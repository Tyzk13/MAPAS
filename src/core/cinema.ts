// Câmera de cinema: leva a câmera até uma tomada (posição + alvo) com movimento de filme, barras pretas,
// legenda e, se pedido, para todos os jogadores da sala. Estilos: suave (grua), corte (escurece e corta),
// susto (chicote rápido, zoom e tremida). "Revelar" coloca um personagem no ponto quando a câmera chega.
import * as THREE from 'three';
import { cam, ctl, cv } from './engine';
import { st, $ } from './state';
import { CFG } from './config';
import { WM, setMode, freeLookAt, modo, type Modo } from './walk';
import { NET, handlers } from './net';
import { post } from './post';
import { wk, setTarget, save, type Token } from './tokens';

export type Estilo = 'suave' | 'corte' | 'susto';
type V3t = [number, number, number];
export interface Tomada { n?: string; p: V3t; t: V3t; fov?: number }
/** Mensagem trocada pela rede / postMessage. */
export interface CineMsg { a: 'play' | 'end'; p?: V3t; t?: V3t; fov?: number; e?: Estilo; cap?: string; map?: string; de?: string }

const V = THREE.Vector3;
/** identifica esta aba (para não tocar de novo a própria cena que volta pela rede) */
const EU = Math.random().toString(36).slice(2, 10);
const ESTILOS: Estilo[] = ['suave', 'corte', 'susto'];

const S = {
  on: false, saindo: false, t: 0, dur: 1, est: 'suave' as Estilo, cut: false, hold: 0,
  fromP: new V(), fromT: new V(), fromF: 50, toP: new V(), toT: new V(), toF: 40, lift: 0,
  volta: null as null | { modo: Modo; p: THREE.Vector3; t: THREE.Vector3; fov: number },
  rev: null as null | { tok: Token; x: number; y: number; z: number },
};
const curT = new V(), P = new V(), T = new V(), dir = new V();
const ray = new THREE.Raycaster();

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Para onde a câmera está olhando agora. */
function alvoAtual() {
  if (!WM.on) return ctl.target.clone();
  const d = new V(); cam.getWorldDirection(d); return cam.position.clone().addScaledVector(d, 8);
}
function setFov(f: number) { if (Math.abs(cam.fov - f) > 0.01) { cam.fov = f; cam.updateProjectionMatrix(); } }
function fade(el: string, o: number) { ($(el) as HTMLElement).style.opacity = String(clamp(o, 0, 1)); }
function legenda(txt?: string) { const el = $('lcap') as HTMLElement; el.textContent = txt || ''; el.classList.toggle('on', !!txt); }

/** Chão logo abaixo de um ponto (para revelar personagens). */
function chaoSob(p: THREE.Vector3) {
  ray.set(new V(p.x, p.y + 1, p.z), new V(0, -1, 0)); ray.far = 30;
  return ray.intersectObjects(wk(), false)[0]?.point ?? null;
}

/** Toca uma tomada. `enviar` manda para a sala (só quem pode editar). */
export function rodar(tom: Tomada, est: Estilo = 'suave', o: { enviar?: boolean; cap?: string; rev?: string } = {}) {
  if (!st.MP) return;
  if (!ESTILOS.includes(est)) est = 'suave';
  const from = S.on ? curT.clone() : alvoAtual();
  if (!S.on) S.volta = { modo: modo(), p: cam.position.clone(), t: from.clone(), fov: cam.fov };
  if (WM.on) setMode('orbita');
  ctl.enabled = false; st.anim = null;
  S.fromP.copy(cam.position); S.fromT.copy(from); S.fromF = cam.fov;
  S.toP.set(...tom.p); S.toT.set(...tom.t); S.toF = tom.fov || 40;
  const dist = S.fromP.distanceTo(S.toP);
  S.est = est; S.t = 0; S.hold = 0; S.cut = false; S.on = true; S.saindo = false;
  S.dur = est === 'suave' ? clamp(dist / 7, 2.2, 5.5) : est === 'susto' ? 0.55 : 0.95;
  S.lift = est === 'suave' ? Math.min(8, dist * 0.12) : 0;
  S.rev = null;
  if (o.rev && st.T[o.rev] && !CFG.ro) { const g = chaoSob(S.toT); if (g) S.rev = { tok: st.T[o.rev], x: g.x, y: g.y, z: g.z }; }
  document.body.classList.add('cine'); $('cinex').hidden = false;
  legenda(o.cap); post.focus = S.toT;
  cineHooks.forEach(f => f(est));
  if (o.enviar && !CFG.ro) NET.cine({ a: 'play', p: tom.p, t: tom.t, fov: S.toF, e: est, cap: o.cap || '', map: st.curMap, de: EU } satisfies CineMsg);
}

/** Sai do cinema: a câmera volta para onde estava. */
export function sair(enviar = true) {
  if (!S.on || S.saindo) return;
  if (enviar && !CFG.ro) NET.cine({ a: 'end', de: EU } satisfies CineMsg);
  S.saindo = true; S.t = 0; S.fromP.copy(cam.position); S.fromT.copy(curT); S.fromF = cam.fov;
  legenda(''); fade('fade', 0); fade('flash', 0);
  document.body.classList.remove('cine'); $('cinex').hidden = true;
}

function terminar() {
  const v = S.volta!; S.on = false; S.saindo = false; S.volta = null; post.focus = null;
  setFov(v.fov);
  if (v.modo === 'livre') { setMode('livre'); freeLookAt(v.p, v.t); }
  else if (v.modo === 'caminhar') setMode('caminhar');
  else { cam.position.copy(v.p); ctl.target.copy(v.t); ctl.enabled = true; ctl.update(); }
}

/** Interrompe sem animação (ex.: trocou de mapa). */
export function abortar() {
  if (!S.on) return;
  S.on = false; S.saindo = false; S.volta = null; post.focus = null;
  legenda(''); fade('fade', 0); fade('flash', 0);
  document.body.classList.remove('cine'); $('cinex').hidden = true;
  if (!WM.on) ctl.enabled = true;
}

function revelar() {
  if (!S.rev) return;
  const { tok, x, y, z } = S.rev; S.rev = null;
  tok.oc = false; setTarget(tok, x, z, y); tok.g.position.set(tok.target.x, tok.ty, tok.target.y); save(tok, true);
}

/** Chamado a cada quadro; devolve true enquanto o cinema controla a câmera. */
export function tickCinema(dt: number, time: number) {
  if (!S.on) return false;
  S.t += dt;
  if (S.saindo) {
    const v = S.volta!, k = ease(Math.min(1, S.t / 0.9));
    cam.position.lerpVectors(S.fromP, v.p, k); curT.lerpVectors(S.fromT, v.t, k);
    cam.lookAt(curT); setFov(S.fromF + (v.fov - S.fromF) * k);
    if (k >= 1) terminar();
    return true;
  }
  const u = Math.min(1, S.t / S.dur);
  let F = S.toF;
  if (u < 1) { // movimento
    if (S.est === 'corte') {
      const tc = 0.35;
      if (S.t < tc) { fade('fade', S.t / tc); P.copy(S.fromP); T.copy(S.fromT); F = S.fromF; }
      else { if (!S.cut) { S.cut = true; revelar(); } fade('fade', 1 - (S.t - tc) / (S.dur - tc)); P.copy(S.toP); T.copy(S.toT); }
    } else if (S.est === 'susto') {
      const k = outExpo(u);
      P.lerpVectors(S.fromP, S.toP, k); T.lerpVectors(S.fromT, S.toT, Math.min(1, k * 1.1));
      F = S.fromF + (S.toF * 0.78 - S.fromF) * k;
    } else {
      const k = ease(u);
      P.lerpVectors(S.fromP, S.toP, k); P.y += Math.sin(Math.PI * k) * S.lift;
      T.lerpVectors(S.fromT, S.toT, ease(Math.min(1, u * 1.15)));
      F = S.fromF + (S.toF - S.fromF) * k;
    }
  } else { // chegou: segura a tomada com um avanço lento (dolly) e leve movimento de mão
    if (S.hold === 0) { revelar(); fade('fade', 0); if (S.est === 'susto') fade('flash', 0.35); }
    S.hold += dt;
    dir.subVectors(S.toT, S.toP).normalize();
    P.copy(S.toP).addScaledVector(dir, Math.min(1.2, 0.12 * S.hold)); T.copy(S.toT);
    if (S.est === 'susto') {
      F = S.toF * (0.78 + 0.22 * outExpo(Math.min(1, S.hold / 1.2)));
      const a = 0.07 * Math.exp(-S.hold * 4);
      P.x += (Math.random() - 0.5) * a; P.y += (Math.random() - 0.5) * a; P.z += (Math.random() - 0.5) * a;
      fade('flash', 0.35 * Math.max(0, 1 - S.hold / 0.3));
    }
  }
  P.x += Math.sin(time * 1.3) * 0.006; P.y += Math.sin(time * 1.7 + 1) * 0.004;
  cam.position.copy(P); curT.copy(T); cam.lookAt(curT); setFov(F);
  return true;
}

// ---------- escolher ponto na cena ----------
/** Peças que podem ficar entre a câmera e o alvo (paredes, construções; sem vegetação instanciada). */
function obstaculos() {
  const out: THREE.Object3D[] = [...st.MP!.solid()];
  st.MP!.G.traverse((o: any) => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || o.userData.foliage) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (m && m.visible !== false && !m.transparent) out.push(o);
  });
  return out;
}
/**
 * Monta uma tomada olhando para um ponto: alvo na altura do rosto de quem estaria ali, câmera a ~5,5 m do lado
 * de onde se está olhando, um pouco abaixo do olhar (ângulo baixo), sem atravessar paredes nem construções.
 * Clique numa parede vale como o chão logo à frente dela.
 */
export function tomadaPara(hit: THREE.Intersection) {
  const p = hit.point, n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new V(0, 1, 0);
  const spot = p.clone();
  if (Math.abs(n.y) < 0.5) {
    spot.addScaledVector(new V(n.x, 0, n.z).normalize(), 1.0);
    const g = chaoSob(spot); if (g) spot.y = g.y;
  }
  const alvo = new V(spot.x, spot.y + 1.4, spot.z);
  const d = new V(cam.position.x - spot.x, 0, cam.position.z - spot.z);
  if (d.lengthSq() < 1e-4) d.set(n.x, 0, n.z);
  if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
  d.normalize();
  let D = 5.5;
  ray.set(alvo, d); ray.far = D + 0.4;
  const bate = ray.intersectObjects(obstaculos(), false)[0];
  if (bate) D = Math.max(1.4, bate.distance - 0.4);
  const pos = alvo.clone().addScaledVector(d, D);
  pos.y = alvo.y - 0.15;
  const g2 = chaoSob(pos); if (g2) pos.y = Math.max(pos.y, g2.y + 0.6);
  const r = (v: THREE.Vector3) => v.toArray().map(x => +x.toFixed(2)) as V3t;
  return { p: r(pos), t: r(alvo), fov: 40 } as Tomada;
}

let picking: null | ((h: THREE.Intersection) => void) = null, tipAntes = '';
/** Próximo clique na cena escolhe o ponto (Esc cancela). */
export function apontar(cb: (h: THREE.Intersection) => void) {
  picking = cb; document.body.classList.add('picking');
  tipAntes = $('tip').textContent; $('tip').textContent = 'Clique no lugar para onde a câmera vai · Esc cancela';
}
function pararDeApontar() { picking = null; document.body.classList.remove('picking'); $('tip').textContent = tipAntes; }

// ---------- tomadas gravadas (por mapa, neste navegador) ----------
const chave = () => 'mapa3d:tomadas:' + st.curMap;
export function tomadas(): Tomada[] { try { return JSON.parse(localStorage.getItem(chave()) || '[]'); } catch { return []; } }
function guardar(l: Tomada[]) { try { localStorage.setItem(chave(), JSON.stringify(l)); } catch { /* sem armazenamento: só nesta sessão */ } mem[st.curMap] = l; }
const mem: Record<string, Tomada[]> = {};
export function listaTomadas(): Tomada[] { const l = tomadas(); return l.length ? l : mem[st.curMap] || []; }
export function gravarAtual() {
  const l = listaTomadas(), r = (v: THREE.Vector3) => v.toArray().map(x => +x.toFixed(2)) as V3t;
  let i = l.length + 1; while (l.some(x => x.n === 'Tomada ' + i)) i++;
  l.push({ n: 'Tomada ' + i, p: r(cam.position), t: r(alvoAtual()), fov: Math.round(cam.fov) });
  guardar(l); return l;
}
export function apagarTomada(i: number) { const l = listaTomadas(); l.splice(i, 1); guardar(l); return l; }

export const cineAtivo = () => S.on;
/** A câmera atual como tomada (para gravar cenas). */
export function tomadaAtual(): Tomada {
  const r = (v: THREE.Vector3) => v.toArray().map(x => +x.toFixed(2)) as V3t;
  return { p: r(cam.position), t: r(alvoAtual()), fov: Math.round(cam.fov) };
}
/** Avisados quando uma cena começa (som do estilo, descongelar a tela dos jogadores). */
export const cineHooks: ((e: Estilo) => void)[] = [];

export function initCinema() {
  ray.params.Line = { threshold: 0 }; ray.params.Points = { threshold: 0 };
  cv.addEventListener('pointerdown', e => {
    if (!picking) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const cb = picking; pararDeApontar();
    const r = cv.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam);
    ray.far = 400;
    const h = ray.intersectObjects([...wk(), ...st.MP!.solid()], false)[0];
    if (h) cb(h);
  }, { capture: true });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (picking) pararDeApontar(); else if (S.on) sair();
  });
  $('cinex').onclick = () => sair();
  handlers.onCine = (m: CineMsg) => {
    if (!m || m.de === EU) return;
    if (m.a === 'end') sair(false);
    else if (m.a === 'play' && m.p && m.t && m.map === st.curMap) rodar({ p: m.p, t: m.t, fov: m.fov }, m.e, { cap: m.cap });
  };
  // usado pelo teste automático (tools/testar-funcoes.mjs)
  (window as any).__cineState = () => ({ on: S.on, dist: cam.position.distanceTo(S.toP) });
}
