// Personagens 2D (billboards): criar, posicionar, selecionar, arrastar com medidor e mover pelo teclado.
import * as THREE from 'three';
import { S, cam, cv, ctl } from './engine';
import { CFG } from './config';
import { st, $ } from './state';
import { mat } from './kit';
import { NET } from './net';
// Imagens dos jogadores: artes de terceiros, ficam fora do git em npcs-local/jogadorN.png (repositório público).
// Sem elas, usa as fichas antigas do repositório.
import dante from '@assets/tokens/dante.png';
import luis from '@assets/tokens/luis.png';
import leo from '@assets/tokens/leo.png';
const LOCAL = import.meta.glob('../../npcs-local/jogador*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const jog = (n: number, alt: string) => Object.entries(LOCAL).find(([k]) => k.endsWith('/jogador' + n + '.png'))?.[1] ?? alt;

export interface TokenDef { id: string; name: string; h: number; c: number; img: string; custom?: boolean }
export interface Token {
  id: string; name: string; h: number; h0: number; fl: boolean; idx: number; custom: boolean;
  g: THREE.Group; sp: THREE.Group; base: THREE.Mesh; mesh: THREE.Mesh | null; hit: THREE.Mesh; ring: THREE.Mesh; btn: HTMLButtonElement;
  target: THREE.Vector2; ty: number; ls: number;
  /** oculto: só o mestre vê (meio transparente) até revelar */
  oc: boolean;
}

export const DEF: TokenDef[] = [
  { id: 'j1', name: 'Jogadora 1', h: 1.68, c: 0x8a6ad8, img: jog(1, dante) },
  { id: 'j2', name: 'Jogador 2', h: 1.78, c: 0xd9a93a, img: jog(2, luis) },
  { id: 'j3', name: 'Jogador 3', h: 1.85, c: 0x3aa86b, img: jog(3, leo) },
];

const V3 = THREE.Vector3;
export const pick: THREE.Mesh[] = [];
const tl = new THREE.TextureLoader();
export const K = (id: string) => CFG.room + '__' + st.curMap + '__' + id;

export function sizeT(t: Token) {
  const h = t.h;
  if (t.mesh) { t.mesh.scale.set(t.fl ? -h : h, h, 1); t.mesh.position.y = h / 2 + 0.1; }
  const k = Math.max(0.7, h / 1.7);
  t.base.scale.set(k, 1, k); t.ring.scale.set(k, 1, k); t.hit.scale.set(k, h + 0.2, k); t.hit.position.y = (h + 0.2) / 2;
}
export function placeT(t: Token, i?: number) {
  const p = st.pos[st.curMap + '__' + t.id];
  if (typeof i === 'number') t.idx = i;
  if (p) { t.target.set(p.x, p.z); t.ty = p.y || 0; if (typeof p.h === 'number') t.h = p.h; t.fl = !!p.f; t.oc = !!p.o; }
  else { const s = st.MP!.spawn(t.idx); t.target.set(s.x, s.z); t.ty = s.y || 0; t.h = t.h0; t.fl = false; t.oc = false; }
  t.g.position.set(t.target.x, t.ty, t.target.y); sizeT(t);
}
export function makeToken(d: TokenDef): Token {
  if (st.T[d.id]) return st.T[d.id];
  const g = new THREE.Group(), base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 24), mat(d.c));
  base.position.y = 0.05; base.castShadow = true; g.add(base);
  const spr = new THREE.Group(); spr.rotation.order = 'YXZ'; g.add(spr);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 10), new THREE.MeshBasicMaterial({ visible: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.76, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  ring.position.y = 0.12; ring.visible = false; g.add(ring);
  const b = document.createElement('button'); b.className = 'av'; b.title = d.name;
  const t: Token = { id: d.id, name: d.name, h: d.h, h0: d.h, fl: false, idx: Object.keys(st.T).length, custom: !!d.custom, g, sp: spr, base, mesh: null, hit, ring, btn: b, target: new THREE.Vector2(), ty: 0, ls: 0, oc: false };
  st.T[d.id] = t;
  hit.userData.t = t; g.add(hit); pick.push(hit);
  const im = new Image(); im.src = d.img; b.appendChild(im); b.onclick = () => { selT(t); focusT(t); }; $('ros').appendChild(b);
  tl.load(d.img, tx => {
    tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(tx.image.width / tx.image.height, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
    m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ map: tx, alphaTest: 0.3, depthPacking: THREE.RGBADepthPacking });
    spr.add(m); t.mesh = m; sizeT(t);
  });
  base.userData.t = t; pick.push(base); S.add(g); placeT(t); return t;
}
export function dropT(id: string) {
  const t = st.T[id]; if (!t) return;
  t.btn.remove(); S.remove(t.g);
  for (let i = pick.length - 1; i >= 0; i--) if (pick[i].userData.t === t) pick.splice(i, 1);
  delete st.T[id]; if (st.sel === t) selT(null);
}
export function selT(t: Token | null) {
  st.sel = t; $('sel').hidden = !t;
  for (const k in st.T) st.T[k].btn.classList.toggle('on', st.T[k] === t);
  if (t) { $('sn').textContent = t.name; $('rm').hidden = !t.custom; $('boc').textContent = t.oc ? 'Mostrar' : 'Ocultar'; }
}
export function setTarget(t: Token, x: number, z: number, y: number) {
  const q = st.snap ? 2 : 10;
  t.target.set(Math.max(-90, Math.min(90, Math.round(x * q) / q)), Math.max(-90, Math.min(90, Math.round(z * q) / q))); t.ty = y;
}
export function focusT(t: Token) {
  if ((window as any).__walkOn) return;
  const tp = new V3(t.g.position.x, t.g.position.y + 1, t.g.position.z), d = cam.position.clone().sub(ctl.target);
  if (d.length() > 16) d.setLength(16);
  st.anim = { tp, cp: tp.clone().add(d) };
}
export function save(t: Token, force?: boolean) {
  const n = performance.now();
  if (CFG.ro || (!force && n - t.ls < 120)) return;
  t.ls = n; const v = { x: t.target.x, z: t.target.y, y: t.ty, h: t.h, f: t.fl ? 1 : 0, o: t.oc ? 1 : 0 };
  st.pos[st.curMap + '__' + t.id] = v; NET.pos(t.id, v);
}
export function onPos(map: string, id: string, v: any) {
  if (!v || typeof v.x !== 'number') return;
  st.pos[map + '__' + id] = v; if (map !== st.curMap) return;
  const t = st.T[id];
  if (t && t !== st.drag) {
    t.target.set(v.x, v.z); t.ty = v.y || 0; t.fl = !!v.f; t.oc = !!v.o; if (typeof v.h === 'number') t.h = v.h; sizeT(t);
    // salto grande (ex.: revelado pela câmera de cinema): aparece direto no lugar, sem deslizar pelo mapa
    if (Math.hypot(t.g.position.x - v.x, t.g.position.z - v.z) > 8) t.g.position.set(v.x, t.ty, v.z);
  }
}
export function onChar(id: string, v: any) {
  if (v && v.img && !st.T[id]) makeToken({ id, name: v.name, h: v.h, c: v.c, img: v.img, custom: true });
}

// ---------- arrastar, medir, teclado ----------
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(), off = new THREE.Vector2(), st0 = new V3();
export const wk = () => st.MP!.walk.filter(m => !m.userData.l || m.userData.l.visible);
const ghost = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8c27a, transparent: true, opacity: 0.9, depthTest: false }));
ghost.visible = false; ghost.renderOrder = 4; S.add(ghost);
const mline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: 0xe8c27a, depthTest: false }));
mline.visible = false; mline.renderOrder = 4; mline.frustumCulled = false; S.add(mline);
export const helpers = [ghost, mline];

function setM(e: PointerEvent) {
  const r = cv.getBoundingClientRect();
  m2.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(m2, cam);
}
function freeSpot(t: Token, x: number, z: number, y: number): [number, number] {
  const q = st.snap ? 0.5 : 0.25;
  const busy = (a: number, b: number) => { for (const k in st.T) { const o = st.T[k]; if (o !== t && o.g.visible && Math.abs(o.ty - y) < 1.5 && Math.hypot(o.target.x - a, o.target.y - b) < 0.85) return true; } return false; };
  if (!busy(x, z)) return [x, z];
  for (let r = 1; r <= 6; r++) for (let i = 0; i < 8 * r; i++) {
    const a = (i / (8 * r)) * 6.283, nx = Math.round((x + Math.cos(a) * r * q * 2) / q) * q, nz = Math.round((z + Math.sin(a) * r * q * 2) / q) * q;
    if (!busy(nx, nz)) return [nx, nz];
  }
  return [x, z];
}

export function initTokenInput(walkActive: () => boolean, walkPointer: (e: PointerEvent, kind: 'down' | 'move' | 'up') => void) {
  cv.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    if (walkActive()) { walkPointer(e, 'down'); return; }
    setM(e);
    const h = ray.intersectObjects(pick.filter(m => (m.userData.t as Token).g.visible), false)[0];
    if (!h) { selT(null); return; }
    const t = h.object.userData.t as Token; selT(t); st.anim = null; if (CFG.ro) return;
    st.drag = t; ctl.enabled = false; cv.setPointerCapture(e.pointerId);
    const f = ray.intersectObjects(wk(), false)[0];
    off.set(f ? t.g.position.x - f.point.x : 0, f ? t.g.position.z - f.point.z : 0);
    st0.set(t.target.x, t.ty, t.target.y); ghost.visible = mline.visible = true; $('meas').hidden = false;
  });
  cv.addEventListener('pointermove', e => {
    if (walkActive()) { walkPointer(e, 'move'); return; }
    const drag = st.drag; if (!drag) return;
    setM(e); const f = ray.intersectObjects(wk(), false)[0]; if (!f) return;
    setTarget(drag, f.point.x + off.x, f.point.z + off.y, f.point.y); save(drag, false);
    const x = drag.target.x, z = drag.target.y, d = Math.hypot(x - st0.x, z - st0.z);
    ghost.position.set(x, drag.ty + 0.06, z); ghost.scale.setScalar(Math.max(0.7, drag.h / 1.7));
    const a = mline.geometry.attributes.position as THREE.BufferAttribute;
    a.setXYZ(0, st0.x, st0.y + 0.15, st0.z); a.setXYZ(1, x, drag.ty + 0.15, z); a.needsUpdate = true;
    const mm = $('meas'); mm.textContent = d.toFixed(1) + ' quad. · ' + (d * 1.5).toFixed(1) + ' m';
    mm.style.left = e.clientX + 14 + 'px'; mm.style.top = e.clientY - 34 + 'px';
  });
  const end = (e: PointerEvent) => {
    walkPointer(e, 'up');
    if (!st.drag) return;
    const t = st.drag, fp = freeSpot(t, t.target.x, t.target.y, t.ty);
    t.target.set(fp[0], fp[1]); st.drag = null; ctl.enabled = true; ghost.visible = mline.visible = false; $('meas').hidden = true; save(t, true);
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  addEventListener('keydown', e => {
    const sel = st.sel;
    if (walkActive() || !sel || CFG.ro || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    if (e.key === 'Escape') { selT(null); return; }
    const m = ({ ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] } as any)[e.key]; if (!m) return;
    e.preventDefault();
    const fx = ctl.target.x - cam.position.x, fz = ctl.target.z - cam.position.z, L = Math.hypot(fx, fz) || 1, ux = fx / L, uz = fz / L;
    const vx = -uz * m[0] - ux * m[1], vz = ux * m[0] - uz * m[1], dx = Math.abs(vx) > Math.abs(vz) ? Math.sign(vx) : 0, dz = dx ? 0 : Math.sign(vz);
    setTarget(sel, sel.target.x + dx, sel.target.y + dz, sel.ty); save(sel, true);
  });
}

/** Atualiza posição/rotação dos billboards a cada quadro. */
export function tickTokens(walkOn: boolean, third: boolean, av: Token | null) {
  const cx = cam.position.x, cz = cam.position.z, M = st.MP!, hi = !M.loft || M.loft.visible;
  for (const k in st.T) {
    const t = st.T[k], p = t.g.position, s = t === st.drag ? 0.45 : 0.25;
    p.x += (t.target.x - p.x) * s; p.z += (t.target.y - p.z) * s; p.y += (t.ty - p.y) * s;
    // oculto: some na tela dos jogadores e para quem só vê; o mestre vê meio transparente
    const ocultoAqui = t.oc && (st.jogadores || CFG.ro);
    t.g.visible = st.showC && (hi || t.ty < 1.5) && !(walkOn && !third && t === av) && !ocultoAqui;
    if (t.mesh) { const m = t.mesh.material as THREE.MeshBasicMaterial, op = t.oc ? 0.4 : 1; if (m.opacity !== op) { m.opacity = op; m.depthWrite = !t.oc; } }
    t.base.visible = !t.oc; t.btn.classList.toggle('oc', t.oc);
    const dx = cx - p.x, dz = cz - p.z, el = Math.atan2(cam.position.y - p.y - 1, Math.hypot(dx, dz));
    t.sp.rotation.y = Math.atan2(dx, dz); t.sp.rotation.x = -Math.min(1.25, Math.max(0, el - 0.6) * 1.1);
    t.sp.position.y += ((t === st.drag ? 0.35 : 0) - t.sp.position.y) * 0.3; t.ring.visible = t === st.sel && !walkOn;
  }
}
/** Coloca todos os personagens exatamente no alvo (sem animação). */
export function snapTokens() { for (const k in st.T) { const t = st.T[k]; t.g.position.set(t.target.x, t.ty, t.target.y); } }
