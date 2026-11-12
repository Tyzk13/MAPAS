// Janela dos jogadores: uma segunda janela do mesmo navegador (outro monitor) que só mostra a cena e segue a
// câmera do mestre ao vivo — órbita, câmera livre e cinema (com barras, legenda, esmaecimento) —, além de mapa,
// clima e personagens. A ligação é local (BroadcastChannel): não precisa de servidor nem de internet.
import * as THREE from 'three';
import { cam, ctl } from './engine';
import { st, $ } from './state';
import { CFG } from './config';
import { handlers, tap } from './net';
import { post } from './post';
import { WM } from './walk';
import { imersao, fx, aplicarSom, aplicarPreto, setApagao, type Fx, type SomModo } from './imersao';
import { mostrar, exibir, guardarImagem, type Imagem } from './mostrar';
import { som } from './som';

type V3t = [number, number, number];
interface Quadro {
  k: 'cam'; p: V3t; q: [number, number, number, number]; f: number; t: V3t; cine: boolean; cap: string; fade: number; flash: number; chars: boolean;
  cong: boolean; preto: boolean; lant: boolean; snd: SomModo; vol: number; apag: boolean; nev: boolean; img: string;
}
type Msg =
  | Quadro
  | { k: 'oi' }
  | { k: 'vivo' }
  | { k: 'fx'; e: Fx }
  | { k: 'img'; im: Imagem }
  | { k: 'map'; id: string }
  | { k: 'time'; i: number }
  | { k: 'pos'; map: string; id: string; v: any }
  | { k: 'char'; id: string; v: any }
  | { k: 'del'; id: string }
  | { k: 'estado'; map: string; time: number; chars: Record<string, any>; pos: Record<string, any> };

const canal: BroadcastChannel | null = typeof BroadcastChannel === 'function' ? new BroadcastChannel('mapa3d:' + CFG.room) : null;
const enviar = (m: Msg) => { try { canal?.postMessage(m); } catch { /* janela fechando */ } };

/** Personagens criados nesta mesa (para mandar a quem abrir a janela dos jogadores depois). */
const criados: Record<string, any> = {};

export const espelho = {
  /** esta janela é a dos jogadores? */
  jogadores: false,
  disponivel: !!canal,
  ultimo: 0,
};

// ---------- janela dos jogadores: recebe ----------
const alvoP = new THREE.Vector3(), alvoQ = new THREE.Quaternion(), foco = new THREE.Vector3();
let temQuadro = false, alvoF = 50, congelado = false, deslizar = 0, ultimoImgPedido = '';

function aplicarSobreposicao(m: Quadro) {
  document.body.classList.toggle('cine', m.cine);
  const c = $('lcap') as HTMLElement; if (c.textContent !== m.cap) c.textContent = m.cap; c.classList.toggle('on', !!m.cap);
  ($('fade') as HTMLElement).style.opacity = String(m.fade);
  ($('flash') as HTMLElement).style.opacity = String(m.flash);
}

/** Na janela dos jogadores: aproxima a câmera do último quadro recebido (suaviza o intervalo entre mensagens). */
export function tickEspelho(dt: number) {
  if (!espelho.jogadores) return false;
  if (temQuadro) {
    if (deslizar > 0) deslizar -= dt;
    const k = 1 - Math.exp(-dt * (deslizar > 0 ? 2.5 : 18));
    cam.position.lerp(alvoP, k); cam.quaternion.slerp(alvoQ, k);
    if (Math.abs(cam.fov - alvoF) > 0.01) { cam.fov += (alvoF - cam.fov) * k; cam.updateProjectionMatrix(); }
  }
  return true;
}

async function receber(m: Msg) {
  if (!espelho.jogadores) {
    if (m.k === 'oi') mandarEstado(); // uma janela dos jogadores acabou de abrir
    if (m.k === 'oi' || m.k === 'vivo') vivoEm = performance.now();
    return;
  }
  switch (m.k) {
    case 'cam': {
      if (congelado && !m.cong) deslizar = 1.6; // ao descongelar, a câmera desliza até a do mestre
      congelado = m.cong;
      alvoP.set(...m.p); alvoQ.set(...m.q); alvoF = m.f; foco.set(...m.t); post.focus = foco;
      if (!temQuadro) { cam.position.copy(alvoP); cam.quaternion.copy(alvoQ); temQuadro = true; avisos.conectada(); }
      aplicarSobreposicao(m);
      if (st.showC !== m.chars) { st.showC = m.chars; }
      imersao.lanterna = m.lant;
      if (imersao.preto !== m.preto) { imersao.preto = m.preto; aplicarPreto(); }
      if (imersao.somModo !== m.snd || imersao.volume !== m.vol) { imersao.somModo = m.snd; imersao.volume = m.vol; aplicarSom(); }
      if (imersao.apagao !== m.apag) setApagao(m.apag);
      imersao.nevoa = m.nev;
      if (mostrar.atual !== m.img && !exibir(m.img)) ultimoImgPedido = m.img;
      espelho.ultimo = performance.now();
      break;
    }
    case 'fx': fx(m.e, { enviar: false }); break;
    case 'img': guardarImagem(m.im); if (m.im.id === mostrar.atual) exibir(m.im.id); else if (m.im.id === ultimoImgPedido) exibir(m.im.id); break;
    case 'map': if (m.id !== st.curMap) await opcoes.loadMap(m.id); break;
    case 'time': if (m.i !== st.pi) opcoes.setTime(m.i); break;
    case 'pos': handlers.onPos(m.map, m.id, m.v); break;
    case 'char': handlers.onChar(m.id, m.v); break;
    case 'del': handlers.dropT(m.id); break;
    case 'estado': {
      for (const id in m.chars) handlers.onChar(id, m.chars[id]);
      for (const k in m.pos) { const i = k.indexOf('__'); handlers.onPos(k.slice(0, i), k.slice(i + 2), m.pos[k]); }
      if (m.map !== st.curMap) await opcoes.loadMap(m.map);
      if (m.time !== st.pi) opcoes.setTime(m.time);
      break;
    }
  }
}

// ---------- janela do mestre: envia ----------
let ultimoEnvio = 0, ultimaChave = '', vivoEm = 0, eraVivo = false;
let pose0: { p: V3t; q: Quadro['q']; f: number; t: V3t } | null = null;
const fwd = new THREE.Vector3();
/** Chamado a cada quadro na janela do mestre, depois de mover a câmera. Só envia o que mudou (e 1×/s). */
export function enviarQuadro() {
  if (!canal || espelho.jogadores) return;
  const agora = performance.now();
  const vivo = agora - vivoEm < 5000;
  if (vivo !== eraVivo) { eraVivo = vivo; imersao.temJogadores = vivo; aplicarPreto(); avisos.jogadores(vivo); }
  let t: THREE.Vector3;
  if (post.focus) t = post.focus;
  else if (!WM.on) t = ctl.target;
  else { cam.getWorldDirection(fwd); t = fwd.multiplyScalar(8).add(cam.position); }
  const r = (n: number) => +n.toFixed(4);
  // congelado: a tela dos jogadores fica na última pose enviada antes de congelar
  const pose = imersao.congelado && pose0 ? pose0 : { p: cam.position.toArray().map(r) as V3t, q: cam.quaternion.toArray().map(r) as Quadro['q'], f: r(cam.fov), t: t.toArray().map(r) as V3t };
  if (!imersao.congelado) pose0 = pose;
  const m: Quadro = {
    k: 'cam', ...pose, cine: document.body.classList.contains('cine'),
    cong: imersao.congelado, preto: imersao.preto, lant: imersao.lanterna, snd: imersao.somModo, vol: imersao.volume, apag: imersao.apagao, nev: imersao.nevoa, img: mostrar.atual,
    cap: ($('lcap') as HTMLElement).classList.contains('on') ? ($('lcap') as HTMLElement).textContent || '' : '',
    fade: +(($('fade') as HTMLElement).style.opacity || 0), flash: +(($('flash') as HTMLElement).style.opacity || 0), chars: st.showC,
  };
  const chave = JSON.stringify(m);
  if (chave === ultimaChave && agora - ultimoEnvio < 1000) return;
  ultimaChave = chave; ultimoEnvio = agora; enviar(m);
}

function mandarEstado() {
  const pos: Record<string, any> = {};
  for (const k in st.pos) pos[k] = st.pos[k];
  // posições atuais de quem ainda não tem registro (posição inicial do mapa)
  for (const id in st.T) { const t = st.T[id], k = st.curMap + '__' + id; if (!pos[k]) pos[k] = { x: t.target.x, z: t.target.y, y: t.ty, h: t.h, f: t.fl ? 1 : 0, o: t.oc ? 1 : 0 }; }
  enviar({ k: 'estado', map: st.curMap, time: st.pi, chars: criados, pos });
  for (const im of mostrar.lista) enviar({ k: 'img', im }); // imagens já mostradas (a atual entra no próximo quadro)
}

// ---------- modo ----------
const avisos = { toast: (_t: string, _ms?: number) => {}, conectada: () => {}, jogadores: (_v: boolean) => {} };
const opcoes = { loadMap: async (_id: string) => {}, setTime: (_i: number) => {} };

/** Liga/desliga o modo "tela dos jogadores" nesta janela. */
export function serJogadores(v: boolean) {
  espelho.jogadores = v; st.jogadores = v;
  document.body.classList.toggle('jogadores', v);
  document.body.classList.toggle('limpa', v);
  document.body.classList.toggle('nu', v || !CFG.ui);
  if (v) {
    ctl.enabled = false; st.sel = null; temQuadro = false;
    avisos.toast(canal ? 'Tela dos jogadores · aguardando a janela do mestre… (duplo clique: tela cheia e som · H: sair)' : 'Este navegador não liga janelas entre si', 4000);
    avisos.conectada = () => avisos.toast('Tela dos jogadores ligada à janela do mestre', 2000);
    enviar({ k: 'oi' });
    imersao.ehJogadores = true; aplicarSom(); aplicarPreto();
  } else {
    imersao.ehJogadores = false; imersao.preto = false; imersao.lanterna = false; imersao.nevoa = false; aplicarPreto(); aplicarSom();
    if (imersao.apagao) setApagao(false); exibir('');
    post.focus = null; ctl.enabled = !WM.on;
    document.body.classList.remove('cine'); ($('fade') as HTMLElement).style.opacity = '0'; ($('flash') as HTMLElement).style.opacity = '0';
    ($('lcap') as HTMLElement).classList.remove('on');
    const d = new THREE.Vector3(); cam.getWorldDirection(d); ctl.target.copy(cam.position).addScaledVector(d, 8); ctl.update();
  }
}

/** Esta página está dentro de outra (ex.: claude.ai)? */
export const dentroDeOutraPagina = () => { try { return window.top !== window; } catch { return true; } };

/**
 * Abre a janela dos jogadores (outro monitor). Devolve false se o navegador bloquear.
 * Dentro de outra página (claude.ai) não abre: o navegador separa a ligação entre janelas pela página de cima,
 * então a janela tem que ser o mesmo link aberto de novo (ver o aviso no main.ts).
 */
export function abrirJanelaJogadores() {
  if (dentroDeOutraPagina()) return false;
  const u = new URL(location.href); u.searchParams.set('tela', 'jogadores');
  let w: Window | null = null;
  try { w = window.open(u.href, 'mapa3d-jogadores', 'popup,width=1280,height=720'); } catch { w = null; }
  return !!w;
}

export function initEspelho(o: { loadMap: (id: string) => Promise<void>; setTime: (i: number) => void; toast: (t: string, ms?: number) => void; jogadores: (v: boolean) => void }) {
  opcoes.loadMap = o.loadMap; opcoes.setTime = o.setTime; avisos.toast = o.toast; avisos.jogadores = o.jogadores;
  if (!canal) return;
  canal.onmessage = e => { receber(e.data as Msg); };
  imersao.aoEvento = e => enviar({ k: 'fx', e });
  mostrar.aoNova = im => { if (!espelho.jogadores) enviar({ k: 'img', im }); };
  // a janela dos jogadores avisa que está viva (a do mestre mostra o indicador e decide onde escurecer)
  setInterval(() => { if (espelho.jogadores) enviar({ k: 'vivo' }); }, 2000);
  // o que esta janela muda vai para a outra
  tap.pos = (id, v) => { if (!espelho.jogadores) enviar({ k: 'pos', map: st.curMap, id, v }); };
  tap.char = (id, v) => { criados[id] = v; if (!espelho.jogadores) enviar({ k: 'char', id, v }); };
  tap.del = id => { delete criados[id]; if (!espelho.jogadores) enviar({ k: 'del', id }); };
  // personagens que chegam pela rede também entram na lista (para quem abrir depois)
  const onChar = handlers.onChar, dropT = handlers.dropT;
  handlers.onChar = (id, v) => { if (v?.img) criados[id] = v; onChar(id, v); };
  handlers.dropT = id => { delete criados[id]; dropT(id); };
  // a janela dos jogadores não toca cinema sozinha (espelha o da janela do mestre)
  const onCine = handlers.onCine;
  handlers.onCine = m => { if (!espelho.jogadores) onCine(m); };
  // tela cheia com duplo clique ou F
  const cheia = () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else d.requestFullscreen?.(); };
  addEventListener('dblclick', () => { if (espelho.jogadores) cheia(); });
  // o navegador só libera o áudio depois de um gesto nesta janela
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => aplicarSom(), { once: false, passive: true });
  addEventListener('keydown', e => { if (espelho.jogadores && e.code === 'KeyF') cheia(); });
}

/** Avisa a outra janela que o mapa/clima mudou (chamado pelos ganchos do núcleo). */
export function avisarMapa() { if (!espelho.jogadores) enviar({ k: 'map', id: st.curMap }); }
export function avisarClima() { if (!espelho.jogadores) enviar({ k: 'time', i: st.pi }); }

// usado pelo teste automático
(window as any).__espelho = () => ({
  jogadores: espelho.jogadores, quadro: temQuadro, mapa: st.curMap, clima: st.pi, cine: document.body.classList.contains('cine'),
  som: som.ativo, preto: document.getElementById('preto')!.classList.contains('on'), lant: imersao.lanterna, temJog: imersao.temJogadores, cong: imersao.congelado,
  cam: cam.position.toArray().map(n => +n.toFixed(2)),
  tokens: Object.fromEntries(Object.values(st.T).map(t => [t.id, [+t.target.x.toFixed(2), +t.target.y.toFixed(2)]])),
  visiveis: Object.values(st.T).filter(t => t.g.visible).map(t => t.id),
  apag: imersao.apagao, luzes: +(st.MP?.lights.reduce((a, l) => a + l.l.intensity, 0) ?? 0).toFixed(2),
  nevoa: +((((window as any).__fog?.() ?? 0)) as number).toFixed(5), img: mostrar.atual,
});
