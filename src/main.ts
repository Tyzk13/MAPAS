// Ponto de entrada: monta a interface, carrega o mapa e roda o laço de renderização.
import './style.css';
import './core/heightfog';
import * as THREE from 'three';
import { CFG } from './core/config';
import { R, S, cam, ctl, fit } from './core/engine';
import { st, $ } from './core/state';
import { PRE, setTime, timeHooks, preloadSkies, driftSky } from './core/sky';
import { anim } from './core/anim';
import { updateCull } from './core/cull';
import { DEF, makeToken, dropT, onChar, onPos, selT, sizeT, save, placeT, initTokenInput, tickTokens, snapTokens } from './core/tokens';
import { NET, handlers, startNet } from './core/net';
import { WM, setWalk, setMode, modeHooks, freeLookAt, walkStep, walkPointer, initWalk, placeWalkCam } from './core/walk';
import { menu, lista, fecharMenu, initMenus } from './core/menu';
import { initCinema, rodar, sair, tickCinema, apontar, tomadaPara, gravarAtual, apagarTomada, listaTomadas, abortar, type Estilo, type Tomada } from './core/cinema';
import { initVtt, xcalc, xrender, dd2vtt } from './core/vtt';
import { initImporter } from './core/importer';
import { loadMap, mapHooks } from './core/maps';
import { MAPS } from './maps/manifest';
import { post } from './core/post';
import { loading } from './core/loading';
import { desempenho } from './core/desempenho';

st.pi = Math.min(CFG.time, PRE.length - 1);
st.showC = CFG.chars;
if (!CFG.ui) document.body.classList.add('nu');
if (CFG.ro) document.body.classList.add('ro');

timeHooks.push(p => post.setGrade(p.grade));
handlers.onPos = onPos; handlers.onChar = onChar; handlers.dropT = dropT;

// ---------- novo personagem ----------
function cutBg(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!, w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data;
  if (d[3] < 200) return;
  const r0 = d[0], g0 = d[1], b0 = d[2], seen = new Uint8Array(w * h), q: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x; if (seen[p]) return; seen[p] = 1; const i = p * 4;
    if (Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) < 60) { d[i + 3] = 0; q.push(p); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (q.length) { const p = q.pop()!, x = p % w, y = (p / w) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  g.putImageData(im, 0, 0);
}
async function prep(file: File, cut: boolean) {
  const url = URL.createObjectURL(file);
  const im = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
  for (const H of [480, 400, 320, 260, 200]) {
    const c = document.createElement('canvas'); c.height = H; c.width = Math.max(1, Math.round((im.width * H) / im.height));
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); if (cut) cutBg(c);
    const u = c.toDataURL('image/webp', 0.85);
    if (u.length < 190000) { URL.revokeObjectURL(url); return u; }
  }
  throw new Error('grande');
}
const ray = new THREE.Raycaster();
function spawnPoint() {
  ray.setFromCamera(new THREE.Vector2(0, 0), cam);
  const f = ray.intersectObjects(st.MP!.walk.filter(m => !m.userData.l || m.userData.l.visible), false)[0];
  return f ? { x: Math.round(f.point.x * 2) / 2, z: Math.round(f.point.z * 2) / 2, y: f.point.y } : { x: 0, z: 3, y: 0 };
}
async function addChar(d: { name: string; h: number; c: number; img: string }) {
  const id = 'c' + Date.now().toString(36) + ((Math.random() * 1e4) | 0), p = spawnPoint();
  st.pos[st.curMap + '__' + id] = { x: p.x, z: p.z, y: p.y, h: d.h };
  await NET.addChar(id, d); NET.pos(id, { x: p.x, z: p.z, y: p.y, h: d.h, f: 0 });
}

// ---------- interface (dock, menus e painéis) ----------
const QN = { baixa: 'Baixa', media: 'Média', alta: 'Alta' } as const;
const marcarQ = () => { for (const b of $('bq').children as HTMLCollectionOf<HTMLElement>) b.classList.toggle('act', b.dataset.q === CFG.quality); };
function escolherClima(i: number) { st.pi = i; setTime(i); $('bn').textContent = PRE[i].n; }
function irParaVista(i: number) {
  const v = st.V[i]; if (!v) return;
  st.vi = i; $('bv').textContent = v.n;
  if (WM.free) { freeLookAt(new THREE.Vector3(...v.p), new THREE.Vector3(...v.t)); return; }
  if (WM.on) setMode('orbita');
  st.anim = { cp: new THREE.Vector3(...v.p), tp: new THREE.Vector3(...v.t) };
}
const tg = (id: string, v: boolean) => $(id).setAttribute('aria-pressed', String(v));

// ---------- painel da câmera de cinema ----------
let cEst: Estilo = 'suave', cTodos = true;
function rodarCine(tom: Tomada) { rodar(tom, cEst, { enviar: cTodos, cap: $('ccap').value.trim(), rev: $('crev').value }); }
function itemCine(box: HTMLElement, n: string, go: () => void, del?: () => void) {
  const it = document.createElement('div'); it.className = 'it';
  const b = document.createElement('button'); b.className = 'go'; b.textContent = '▶ ' + n; b.onclick = () => { fecharMenu(); go(); }; it.appendChild(b);
  if (del) { const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Apagar tomada'; x.setAttribute('aria-label', 'Apagar ' + n); x.onclick = e => { e.stopPropagation(); del(); }; it.appendChild(x); }
  box.appendChild(it);
}
function encherCine() {
  const l = $('clist') as HTMLElement; l.innerHTML = '';
  const ts = listaTomadas();
  if (!ts.length) { const v = document.createElement('div'); v.className = 'vazio'; v.textContent = 'Posicione a câmera (Livre ajuda) e grave.'; l.appendChild(v); }
  ts.forEach((t, i) => itemCine(l, t.n || 'Tomada ' + (i + 1), () => rodarCine(t), () => { apagarTomada(i); encherCine(); }));
  const vs = $('cviews') as HTMLElement; vs.innerHTML = '';
  st.V.forEach(v => itemCine(vs, v.n, () => rodarCine({ p: v.p, t: v.t, fov: v.fov || 45 })));
  const sel = $('crev') as HTMLSelectElement, cur = sel.value;
  sel.innerHTML = '<option value="">ninguém</option>' + Object.values(st.T).map(t => `<option value="${t.id}">${t.name.replace(/[<>&"]/g, '')}</option>`).join('');
  sel.value = st.T[cur] ? cur : '';
}
function initCinemaUi() {
  initCinema();
  menu('mcine', 'pcine', encherCine);
  for (const b of $('cest').children as HTMLCollectionOf<HTMLElement>) b.onclick = () => {
    cEst = b.dataset.e as Estilo; for (const o of $('cest').children as HTMLCollectionOf<HTMLElement>) o.classList.toggle('act', o === b);
  };
  $('call').onclick = () => { cTodos = !cTodos; tg('call', cTodos); };
  $('csave').onclick = () => { gravarAtual(); encherCine(); };
  $('cpick').onclick = () => { fecharMenu(); apontar(h => rodarCine(tomadaPara(h))); };
}

// ---------- tela limpa (transmitir) e atalhos ----------
let toastT = 0;
function toast(txt: string, ms = 2600) {
  const el = $('toast') as HTMLElement; el.textContent = txt; el.classList.add('on');
  clearTimeout(toastT); toastT = window.setTimeout(() => el.classList.remove('on'), ms);
}
let limpa = false;
function telaLimpa(v: boolean) {
  limpa = v; fecharMenu();
  if (v) selT(null);
  document.body.classList.toggle('limpa', v);
  document.body.classList.toggle('nu', v || !CFG.ui);
  if (v) toast('Tela limpa · H ou o canto inferior direito para voltar');
}
function initAtalhos() {
  $('blimpa').onclick = () => telaLimpa(true);
  $('bshow').onclick = () => telaLimpa(false);
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName) || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.code === 'KeyH') { telaLimpa(!limpa); return; }
    if (e.code === 'KeyP') { fecharMenu(); apontar(h => rodarCine(tomadaPara(h))); if (limpa) toast('Clique no lugar da câmera', 1500); return; }
    const n = /^Digit([1-9])$/.exec(e.code);
    if (n) { const t = listaTomadas()[+n[1] - 1]; if (t) { fecharMenu(); rodarCine(t); } else if (!limpa) toast('Sem tomada ' + n[1] + ' gravada neste mapa'); }
  });
  // cursor some depois de 2 s parado (na tela limpa)
  let idleT = 0;
  addEventListener('pointermove', () => {
    document.body.classList.remove('idle'); clearTimeout(idleT);
    idleT = window.setTimeout(() => document.body.classList.add('idle'), 2000);
  });
}

function initUi() {
  initMenus();
  // modos de câmera
  $('bmo').onclick = () => setMode('orbita');
  $('blv').onclick = () => setMode(WM.free ? 'orbita' : 'livre');
  modeHooks.push(m => { $('bmo').classList.toggle('act', m === 'orbita'); $('blv').classList.toggle('act', m === 'livre'); });
  // listas: vista, clima, mapa
  menu('mv', 'pl', p => lista(p, 'Vista', st.V.map((v, i) => ({ n: v.n, cur: i === st.vi, go: () => irParaVista(i) }))));
  menu('mn', 'pl', p => lista(p, 'Clima', PRE.map((c, i) => ({ n: c.n, cur: i === st.pi, go: () => escolherClima(i) }))));
  menu('mm', 'pl', p => lista(p, 'Mapa', Object.values(MAPS).map(m => ({ n: m.n, cur: m.id === st.curMap, go: () => { if (m.id !== st.curMap) loadMap(m.id); } }))));
  menu('mc', 'pc');
  initCinemaUi();
  initAtalhos();
  menu('mx', 'px');
  // personagens
  $('ba').onclick = () => { fecharMenu(); $('add').hidden = false; };
  $('ax').onclick = () => { $('add').hidden = true; };
  $('ao').onclick = async () => {
    const f = $('af').files[0], n = $('an').value.trim(), m = $('am');
    if (!f || !n) { m.textContent = 'Escolha uma imagem e um nome'; return; }
    m.textContent = 'Processando...';
    try {
      const img = await prep(f, $('ab').checked);
      await addChar({ name: n, h: +$('as').value, c: parseInt($('ac').value.slice(1), 16), img });
      $('add').hidden = true; $('af').value = ''; $('an').value = ''; m.textContent = '';
    } catch (e) { m.textContent = 'Não consegui adicionar (sem permissão ou imagem inválida)'; }
  };
  const resz = (f: number) => { const s = st.sel; if (!s) return; s.h = Math.max(0.6, Math.min(6, s.h * f)); sizeT(s); save(s, true); };
  $('szm').onclick = () => resz(1 / 1.15); $('szp').onclick = () => resz(1.15);
  $('fl').onclick = () => { const s = st.sel; if (s) { s.fl = !s.fl; sizeT(s); save(s, true); } };
  $('rm').onclick = () => { if (!st.sel || CFG.ro) return; NET.delChar(st.sel.id); selT(null); };
  const setC = (v: boolean) => { st.showC = v; $('ros').style.display = v ? '' : 'none'; tg('bch', v); if (!v) selT(null); };
  $('bch').onclick = () => setC(!st.showC); setC(st.showC);
  $('bg').onclick = () => { st.snap = !st.snap; tg('bg', st.snap); };
  $('br').onclick = () => { if (CFG.ro) return; fecharMenu(); for (const k in st.T) { delete st.pos[st.curMap + '__' + k]; placeT(st.T[k]); save(st.T[k], true); } };
  // mais: qualidade (resolução/sombras/pós na hora; densidade da vegetação ao recarregar o mapa)
  marcarQ();
  for (const b of $('bq').children as HTMLCollectionOf<HTMLElement>) b.onclick = async () => {
    const q = b.dataset.q as keyof typeof QN; if (q === CFG.quality) return;
    CFG.quality = q; marcarQ(); fecharMenu(); post.setQuality(q); await loadMap(st.curMap); desempenho.reiniciar();
  };
  $('bim').addEventListener('click', fecharMenu); $('bx').addEventListener('click', fecharMenu);
  $('bfs').onclick = () => { fecharMenu(); const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); };
  if (!document.documentElement.requestFullscreen) $('bfs').style.display = 'none';
  $('bhelp').onclick = () => { fecharMenu(); $('help').hidden = false; };
  $('hx').onclick = () => { $('help').hidden = true; };
  $('bn').textContent = PRE[st.pi].n;
  // indicador de conexão (ponto verde quando ao vivo)
  new MutationObserver(() => document.body.classList.toggle('ao-vivo', /^ao vivo/.test($('st').textContent))).observe($('st'), { childList: true, characterData: true, subtree: true });
  ctl.addEventListener('start', () => { st.anim = null; });
}

// API para a página que incorpora (iframe): postMessage({cmd:'map',id:'campo'}) e ({cmd:'time',i:2})
addEventListener('message', e => {
  const m = e.data || {};
  if (m.cmd === 'map' && MAPS[m.id]) loadMap(m.id);
  else if (m.cmd === 'time') escolherClima(Math.abs(+m.i || 0) % PRE.length);
  // câmera de cinema: {cmd:'cine', p:[x,y,z], t:[x,y,z], fov?, estilo?: 'suave'|'corte'|'susto', legenda?} e {cmd:'cine-sair'}
  else if (m.cmd === 'cine' && Array.isArray(m.p) && Array.isArray(m.t)) rodar({ p: m.p, t: m.t, fov: +m.fov || 40 }, m.estilo, { enviar: true, cap: String(m.legenda || '').slice(0, 140) });
  else if (m.cmd === 'cine-sair') sair();
});

mapHooks.push(() => abortar()); // trocar de mapa no meio de uma cena de cinema

// ---------- laço ----------
const timer = new THREE.Timer();
// medidor de quadros por segundo (?fps=1)
const fpsEl = CFG.fps ? Object.assign(document.body.appendChild(document.createElement('div')), { id: 'fps' }) : null;
if (fpsEl) R.info.autoReset = false;
if (fpsEl) Object.assign(fpsEl.style, { position: 'fixed', right: '8px', top: '8px', font: '12px monospace', background: '#000a', color: '#9f9', padding: '3px 6px', borderRadius: '6px', zIndex: '9' });
let fpsN = 0, fpsT = performance.now();
function frame(ts?: number) {
  timer.update(ts);
  desempenho.quadro(performance.now());
  if (fpsEl) R.info.reset();
  const dt = Math.min(0.1, timer.getDelta()), t = timer.getElapsed(), M = st.MP;
  if (!M) return;
  anim.time.value = t; driftSky(t);
  tickTokens(WM.on && !WM.free, WM.third, WM.av);
  if (M.tick) M.tick(dt, t);
  if (st.anim) {
    const a = st.anim; ctl.target.lerp(a.tp, 0.1); cam.position.lerp(a.cp, 0.1);
    if (cam.position.distanceTo(a.cp) < 0.1 && ctl.target.distanceTo(a.tp) < 0.1) st.anim = null;
  }
  if (tickCinema(dt, t)) { /* a câmera de cinema está no controle */ } else if (WM.on) walkStep(); else ctl.update();
  updateCull(cam);
  post.render(dt);
  if (fpsEl && ++fpsN >= 30) { const n = performance.now(); fpsEl.textContent = (30000 / (n - fpsT)).toFixed(0) + ' fps · ' + R.info.render.calls + ' draws · ' + (R.info.render.triangles / 1e6).toFixed(2) + ' M tri · res ' + Math.round(desempenho.escala * 100) + '%'; fpsT = n; fpsN = 0; }
}

// ---------- capturas automáticas (tools/capturas.mjs) ----------
function captureApi() {
  (window as any).__cap = {
    allViews: () => st.MP!.views,
    view(v: { p: [number, number, number]; t: [number, number, number]; fov?: number }) {
      if (WM.on) setWalk(false);
      st.showC = false; // vistas fixas: sem personagens
      st.anim = null; cam.fov = v.fov || 50; cam.updateProjectionMatrix();
      cam.position.set(...v.p); ctl.target.set(...v.t); ctl.update();
    },
    third(o: { x: number; z: number; yaw: number; pitch: number }) {
      st.showC = true; setWalk(true); WM.third = true;
      const a = WM.av!; WM.x = o.x; WM.z = o.z; WM.yaw = o.yaw; WM.pitch = o.pitch;
      // assenta no chão
      const rc = new THREE.Raycaster(new THREE.Vector3(o.x, 30, o.z), new THREE.Vector3(0, -1, 0));
      const h = rc.intersectObjects(st.MP!.walk, false)[0]; WM.y = h ? h.point.y : 0;
      a.target.set(WM.x, WM.z); a.ty = WM.y; snapTokens(); placeWalkCam();
    },
    async time(i: number) { st.pi = i; await setTime(i); },
    map: (id: string) => loadMap(id),
    frames(n = 1) { anim.time.value = 7.3; for (let i = 0; i < n; i++) { if (WM.on) placeWalkCam(); if (st.MP?.tick) st.MP.tick(1 / 60, 7.3); snapTokens(); updateCull(cam); tickTokens(WM.on, WM.third, WM.av); post.render(1 / 60); } },
    scene: () => S, renderer: () => R, camera: () => cam,
    stats() {
      const a = R.info.autoReset; R.info.autoReset = false; R.info.reset();
      this.frames(1);
      const r = { calls: R.info.render.calls, triangles: R.info.render.triangles, programs: R.info.programs?.length, textures: R.info.memory.textures, geometries: R.info.memory.geometries, lights: (() => { let n = 0; S.traverse((o: any) => { if (o.isLight && o.visible && o.intensity > 0) n++; }); return n; })() };
      R.info.autoReset = a; return r;
    },
    shot(png = false) { this.frames(post.warmup()); return png ? R.domElement.toDataURL('image/png') : R.domElement.toDataURL('image/jpeg', 0.9); },
    vtt(area: number, ppg: number) { const c = xcalc(area, ppg), png = xrender(c, {}); return { png, json: dd2vtt(c, png) }; },
  };
}

// ---------- iniciar ----------
async function start() {
  initUi(); initWalk(); initVtt(); initImporter();
  initTokenInput(() => WM.on, walkPointer);
  fit();
  post.init(CFG.quality);
  loading.step('Montando o cenário', 0.2);
  await loadMap(CFG.map);
  await setTime(st.pi);
  loading.step('Personagens', 0.85);
  DEF.forEach(makeToken);
  if (CFG.walk) setWalk(true);
  startNet();
  if (!CFG.capture) setTimeout(preloadSkies, 3000);
  try { if (parent !== window) parent.postMessage({ evt: 'ready', maps: Object.keys(MAPS) }, '*'); } catch (_) { /* sem pai */ }
  if (CFG.capture) {
    captureApi();
    await loading.waitTextures();
    await setTime(st.pi); // recaptura a sonda do interior já com as texturas
    (window as any).__capReady = true;
  } else {
    R.setAnimationLoop(frame);
    loading.step('Texturas e modelos', 0.9);
    await loading.waitTextures(30000);
    await setTime(st.pi);
  }
  loading.done();
  desempenho.iniciar();
}
// mostra qualquer erro na tela de carregamento (em vez de ficar parada) e avisa se a placa de vídeo cair
addEventListener('error', e => loading.error(String(e.message || e)));
addEventListener('unhandledrejection', e => loading.error(String((e as PromiseRejectionEvent).reason)));
R.domElement.addEventListener('webglcontextlost', ev => { ev.preventDefault(); loading.error('a placa de vídeo do aparelho reiniciou (memória cheia?) — recarregue a página; use Qualidade: Baixa'); });
start().catch(e => { console.error(e); loading.error(String(e)); });

export { S };
