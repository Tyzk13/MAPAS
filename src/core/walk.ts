// Caminhar com visão livre: WASD/setas, mouse/toque, joystick no celular; 1ª e 3ª pessoa com colisão.
import * as THREE from 'three';
import { cam, ctl } from './engine';
import { st, $ } from './state';
import { DEF, save, wk, type Token } from './tokens';

const V3 = THREE.Vector3;
export const WM = {
  on: false, third: true, av: null as Token | null,
  x: 0, y: 0, z: 0, yaw: 0, pitch: 0,
  keys: {} as Record<string, number>, jx: 0, jy: 0,
  lk: null as null | { id: number; x: number; y: number },
};
const wr = new THREE.Raycaster(), DN = new V3(0, -1, 0), ray = new THREE.Raycaster();
let lastT = performance.now();
let TIP0 = '';

export function placeWalkCam() {
  const M = st.MP!;
  if (WM.third) {
    const cp = Math.cos(WM.pitch), pv = new V3(WM.x, WM.y + 1.5, WM.z);
    const bk = new V3(Math.sin(WM.yaw) * cp, -Math.sin(WM.pitch), Math.cos(WM.yaw) * cp);
    let dist = 3.4; wr.set(pv, bk); wr.far = dist + 0.3;
    const h = wr.intersectObjects(M.solid(), false)[0];
    if (h) dist = Math.max(0.7, h.distance - 0.3);
    cam.position.copy(pv).addScaledVector(bk, dist);
    cam.position.y = Math.max(cam.position.y, WM.y + 0.35);
  } else cam.position.set(WM.x, WM.y + 1.55, WM.z);
  cam.rotation.set(WM.pitch, WM.yaw, 0);
}
export function togV() { WM.third = !WM.third; $('bpv').textContent = WM.third ? '3ª pessoa' : '1ª pessoa'; }

export function startWalk() {
  const d = new V3(); cam.getWorldDirection(d);
  ray.setFromCamera(new THREE.Vector2(0, 0), cam);
  const f = ray.intersectObjects(wk(), false)[0], a = WM.av, M = st.MP!;
  if (a) { WM.x = a.target.x; WM.z = a.target.y; WM.y = a.ty; WM.yaw = Math.atan2(-d.x, -d.z); }
  else if (f && f.distance < 90 && d.y < -0.02) { WM.x = f.point.x; WM.z = f.point.z; WM.y = f.point.y; WM.yaw = Math.atan2(-d.x, -d.z); }
  else { WM.x = M.walkStart.x; WM.z = M.walkStart.z; WM.y = 0; WM.yaw = 0; }
  WM.pitch = WM.third ? -0.15 : 0; placeWalkCam();
  const sx = WM.x, sz = WM.z;
  // usado pelo teste automático (tools/testar-funcoes.mjs)
  (window as any).__walkState = () => ({ moved: Math.hypot(WM.x - sx, WM.z - sz), y: WM.y, x: WM.x, z: WM.z });
}
export function setWalk(on: boolean) {
  if (on === WM.on) return;
  WM.on = on; (window as any).__walkOn = on; st.anim = null; WM.keys = {}; WM.lk = null; WM.jx = WM.jy = 0;
  $('bwk').classList.toggle('act', on);
  $('tip').textContent = on ? 'WASD ou setas: andar · ←/→ ou arrastar: olhar · Shift: correr · V: 1ª/3ª pessoa · Esc: sair' : TIP0;
  $('joy').hidden = !(on && matchMedia('(pointer:coarse)').matches);
  if (on) { WM.av = st.sel || st.T[DEF[0].id] || null; ctl.enabled = false; cam.rotation.order = 'YXZ'; startWalk(); }
  else { const d = new V3(); cam.getWorldDirection(d); ctl.target.copy(cam.position).addScaledVector(d, 8); cam.rotation.order = 'XYZ'; ctl.enabled = true; ctl.update(); }
}
export function walkStep() {
  const n = performance.now(), dt = Math.min(0.05, (n - lastT) / 1000), k = WM.keys, M = st.MP!; lastT = n;
  if (k.ArrowLeft) WM.yaw += 1.8 * dt; if (k.ArrowRight) WM.yaw -= 1.8 * dt;
  let fw = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - WM.jy, sd2 = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + WM.jx;
  const L = Math.hypot(fw, sd2); if (L > 1) { fw /= L; sd2 /= L; }
  const sp = (k.ShiftLeft || k.ShiftRight ? 6.5 : 3.2) * dt, sn = Math.sin(WM.yaw), cs = Math.cos(WM.yaw);
  const dx = (-sn * fw + cs * sd2) * sp, dz = (-cs * fw - sn * sd2) * sp;
  if (dx || dz) {
    const sol = M.solid();
    const bl = (ax: number, az: number) => { const l = Math.hypot(ax, az); if (!l) return false; wr.set(new V3(WM.x, WM.y + 0.9, WM.z), new V3(ax / l, 0, az / l)); wr.far = l + 0.4; return wr.intersectObjects(sol, false).length > 0; };
    if (!bl(dx, 0)) WM.x += dx; if (!bl(0, dz)) WM.z += dz;
    WM.x = Math.max(-90, Math.min(90, WM.x)); WM.z = Math.max(-90, Math.min(90, WM.z));
  }
  wr.set(new V3(WM.x, WM.y + 0.8, WM.z), DN); wr.far = 40;
  const g = wr.intersectObjects(wk(), false)[0];
  if (g) WM.y += Math.max(-0.4, Math.min(0.35, g.point.y - WM.y));
  if (WM.third) WM.pitch = Math.max(-0.9, Math.min(0.5, WM.pitch));
  if (WM.av) { const a = WM.av; a.target.set(WM.x, WM.z); a.ty = WM.y; a.g.position.set(WM.x, WM.y, WM.z); save(a, false); }
  placeWalkCam();
}

/** Recebe os eventos de ponteiro do canvas enquanto o modo caminhar está ativo. */
export function walkPointer(e: PointerEvent, kind: 'down' | 'move' | 'up') {
  if (kind === 'up') { WM.lk = null; return; }
  if (kind === 'down') { WM.lk = { id: e.pointerId, x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); return; }
  const l = WM.lk;
  if (l && e.pointerId === l.id) {
    WM.yaw -= (e.clientX - l.x) * 0.005; WM.pitch = Math.max(-1.4, Math.min(1.4, WM.pitch - (e.clientY - l.y) * 0.005));
    l.x = e.clientX; l.y = e.clientY;
  }
}

export function initWalk() {
  TIP0 = $('tip').textContent;
  addEventListener('keydown', e => {
    if (!WM.on || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    if (e.code === 'Escape') { setWalk(false); return; }
    if (e.code === 'KeyV') { togV(); return; }
    if (/^(Key[WASD]|Arrow|Shift)/.test(e.code)) { WM.keys[e.code] = 1; if (e.code.indexOf('Arrow') === 0) e.preventDefault(); }
  });
  addEventListener('keyup', e => { delete WM.keys[e.code]; });
  addEventListener('blur', () => { WM.keys = {}; });
  const joy = $('joy') as HTMLElement, knob = joy.firstElementChild as HTMLElement;
  const jmove = (e: PointerEvent) => {
    const r = joy.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    WM.jx = x; WM.jy = y; knob.style.transform = 'translate(' + x * 30 + 'px,' + y * 30 + 'px)';
  };
  joy.addEventListener('pointerdown', e => { joy.setPointerCapture(e.pointerId); jmove(e); });
  joy.addEventListener('pointermove', e => { if (e.buttons) jmove(e); });
  const jend = () => { WM.jx = WM.jy = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
  $('bwk').onclick = () => setWalk(!WM.on);
  $('bpv').onclick = togV;
}
