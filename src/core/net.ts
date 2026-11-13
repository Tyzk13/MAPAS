// Rede: Claude db (dentro do claude.ai), WebSocket próprio (?ws=) ou local.
import { CFG } from './config';
import { st, $ } from './state';

type PosFn = (id: string, v: any) => void;
/** Implementação da rede em uso (trocada por netDb/netWs). Sem rede: só local. */
const impl = {
  pos: ((_id, _v) => {}) as PosFn,
  addChar: (id: string, v: any): Promise<void> => { handlers.onChar(id, v); return Promise.resolve(); },
  delChar: (id: string) => { handlers.dropT(id); },
  /** câmera de cinema para a sala (sem rede: não faz nada) */
  cine: (_m: any) => {},
};
/** Ramal local (outra janela do mesmo navegador, ver core/espelho.ts): recebe o que esta janela muda. */
export const tap: { pos?: PosFn; char?: (id: string, v: any) => void; del?: (id: string) => void } = {};
export const NET = {
  pos: (id: string, v: any) => { impl.pos(id, v); tap.pos?.(id, v); },
  addChar: async (id: string, v: any) => { await impl.addChar(id, v); tap.char?.(id, v); },
  delChar: (id: string) => { impl.delChar(id); tap.del?.(id); },
  cine: (m: any) => impl.cine(m),
};

// Preenchido por main.ts para evitar dependência circular com tokens.ts
export const handlers = {
  onPos: (_m: string, _id: string, _v: any) => {},
  onChar: (_id: string, _v: any) => {},
  dropT: (_id: string) => {},
  onCine: (_m: any) => {},
};

const key = (id: string) => CFG.room + '__' + st.curMap + '__' + id;

async function netDb() {
  const w = window as any;
  const db = w.claude && (await w.claude.use('db'));
  if (!db) return false;
  const stEl = $('st');
  const col = db.collection('tokens'), cc = db.collection('chars'), P = CFG.room + '__';
  impl.pos = (id, v) => { col.doc(key(id)).set(v).catch(() => { stEl.textContent = 'sem permissão para salvar'; }); };
  impl.addChar = async (id, v) => { await cc.doc(P + id).set(v); };
  impl.delChar = id => { cc.doc(P + id).delete().catch(() => {}); col.doc(key(id)).delete().catch(() => {}); };
  // cinema: um documento por sala; só toca o que chegar depois de abrir a página (nada de cena antiga)
  const cine = db.collection('cine'), t0 = Date.now();
  impl.cine = m => { cine.doc(CFG.room).set({ ...m, ts: Date.now() }).catch(() => {}); };
  cine.onSnapshot((q: any) => q.docChanges().forEach((c: any) => {
    if (c.doc.id !== CFG.room || c.type === 'removed') return;
    const m = c.doc.data(); if (m && m.ts > t0 && Date.now() - m.ts < 20000) handlers.onCine(m);
  }), () => {});
  cc.onSnapshot((q: any) => q.docChanges().forEach((c: any) => {
    if (!c.doc.id.startsWith(P)) return;
    const id = c.doc.id.slice(P.length);
    if (c.type === 'removed') handlers.dropT(id); else handlers.onChar(id, c.doc.data());
  }), () => {});
  col.onSnapshot((q: any) => {
    stEl.textContent = 'ao vivo';
    q.docs.forEach((d: any) => { const a = d.id.split('__'); if (a[0] !== CFG.room) return; handlers.onPos(a[1], a.slice(2).join('__'), d.data()); });
  }, () => { stEl.textContent = 'local'; });
  return true;
}

function netWs(url: string) {
  return new Promise<boolean>(ok => {
    let ws: WebSocket, first = true;
    const stEl = $('st');
    const snd = (o: any) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
    const open = () => {
      const qs = 'room=' + encodeURIComponent(CFG.room) + (CFG.ro ? '&ro=1' : '') + (CFG.key ? '&key=' + encodeURIComponent(CFG.key) : '');
      ws = new WebSocket(url + (url.indexOf('?') > 0 ? '&' : '?') + qs);
      ws.onopen = () => { stEl.textContent = CFG.ro ? 'ao vivo (só ver)' : 'ao vivo (ws)'; if (first) { first = false; ok(true); } };
      ws.onerror = () => { if (first) { first = false; ok(false); } };
      ws.onclose = () => { stEl.textContent = 'reconectando…'; setTimeout(open, 2500); };
      ws.onmessage = e => {
        let m: any; try { m = JSON.parse(e.data); } catch (_) { return; }
        if (m.t === 'hello') { if (!m.edit && !CFG.ro) { CFG.ro = true; document.body.classList.add('ro'); stEl.textContent = 'ao vivo (só ver)'; } }
        else if (m.t === 'pos') handlers.onPos(m.map, m.id, m.v);
        else if (m.t === 'char') handlers.onChar(m.id, m.v);
        else if (m.t === 'delchar') handlers.dropT(m.id);
        else if (m.t === 'cine') handlers.onCine(m.v);
      };
    };
    impl.pos = (id, v) => snd({ t: 'pos', map: st.curMap, id, v });
    impl.addChar = (id, v) => { snd({ t: 'char', id, v }); return Promise.resolve(); };
    impl.delChar = id => snd({ t: 'delchar', id });
    impl.cine = v => snd({ t: 'cine', v });
    open();
  });
}

export async function startNet() {
  let ok = false;
  if (CFG.ws) ok = await netWs(CFG.ws);
  if (!ok) try { ok = await netDb(); } catch (_) { /* fica local */ }
  return ok;
}
