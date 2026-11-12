// Modos de câmera: órbita (OrbitControls), caminhar (personagem em 1ª/3ª pessoa, com colisão) e câmera livre
// (voa pela cena com WASD + Q/E, aceleração suave, colisão opcional). Mouse/toque e joystick no celular.
import * as THREE from 'three';
import { cam, ctl, cv } from './engine';
import { st, $ } from './state';
import { DEF, save, wk, type Token } from './tokens';

const V3 = THREE.Vector3;
export const WM = {
  on: false, third: true, av: null as Token | null,
  x: 0, y: 0, z: 0, yaw: 0, pitch: 0,
  keys: {} as Record<string, number>, jx: 0, jy: 0,
  lk: null as null | { id: number; x: number; y: number },
  /** câmera livre */
  free: false, ghost: false, speed: 4, fy: 0,
  fp: new THREE.Vector3(), vel: new THREE.Vector3(),
};
export type Modo = 'orbita' | 'caminhar' | 'livre';
export const modo = (): Modo => (!WM.on ? 'orbita' : WM.free ? 'livre' : 'caminhar');
/** Avisados quando o modo muda (a interface marca o botão ativo). */
export const modeHooks: ((m: Modo) => void)[] = [];
const TIPS: Record<Modo, string> = {
  orbita: '',
  caminhar: 'WASD ou setas: andar · arrastar: olhar · Shift: correr · V: 1ª/3ª pessoa · Esc: sair',
  livre: 'WASD: mover · arrastar: olhar · Q/E: descer/subir · Shift: rápido · roda: velocidade · G: atravessar paredes · Esc: sair',
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
const coarse = () => matchMedia('(pointer:coarse)').matches;

/** Troca o modo de câmera. */
export function setMode(m: Modo) {
  const cur = modo();
  if (m === cur) return;
  WM.on = m !== 'orbita'; WM.free = m === 'livre';
  (window as any).__walkOn = WM.on; st.anim = null; WM.keys = {}; WM.lk = null; WM.jx = WM.jy = WM.fy = 0;
  // tira o foco do botão clicado (Espaço/Enter não podem "clicar" de novo enquanto se move)
  (document.activeElement as HTMLElement | null)?.blur?.();
  $('tip').textContent = TIPS[m] || TIP0;
  $('joy').hidden = !(WM.on && coarse());
  $('fly').hidden = !(WM.free && coarse());
  $('bpv').hidden = m !== 'caminhar';
  if (WM.on) {
    ctl.enabled = false; cam.rotation.order = 'YXZ';
    if (m === 'caminhar') { WM.av = st.sel || st.T[DEF[0].id] || null; startWalk(); }
    else startFree();
  } else {
    const d = new V3(); cam.getWorldDirection(d); ctl.target.copy(cam.position).addScaledVector(d, 8);
    cam.rotation.order = 'XYZ'; ctl.enabled = true; ctl.update();
  }
  modeHooks.forEach(f => f(m));
}
/** Compatibilidade: liga/desliga o modo caminhar. */
export function setWalk(on: boolean) { setMode(on ? 'caminhar' : 'orbita'); }

/** Começa a câmera livre de onde a câmera está, olhando para onde ela olha. */
export function startFree() {
  const d = new V3(); cam.getWorldDirection(d);
  WM.fp.copy(cam.position); WM.vel.set(0, 0, 0);
  WM.yaw = Math.atan2(-d.x, -d.z); WM.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  cam.rotation.set(WM.pitch, WM.yaw, 0);
  const s0 = WM.fp.clone();
  // usado pelo teste automático (tools/testar-funcoes.mjs)
  (window as any).__freeState = () => ({ moved: WM.fp.distanceTo(s0), y: WM.fp.y });
}
/** Leva a câmera livre para um ponto, olhando para outro (usado pelo menu Vista). */
export function freeLookAt(p: THREE.Vector3, t: THREE.Vector3) {
  const d = t.clone().sub(p).normalize();
  WM.fp.copy(p); WM.vel.set(0, 0, 0);
  WM.yaw = Math.atan2(-d.x, -d.z); WM.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  cam.position.copy(p); cam.rotation.set(WM.pitch, WM.yaw, 0);
}

const fwd = new V3(), right = new V3(), want = new V3(), step = new V3(), orig = new V3();
function freeStep(dt: number) {
  const k = WM.keys, sol = st.MP!.solid();
  if (k.ArrowLeft) WM.yaw += 1.8 * dt; if (k.ArrowRight) WM.yaw -= 1.8 * dt;
  const fw = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - WM.jy;
  const sd = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + WM.jx;
  const up = (k.KeyE || k.Space ? 1 : 0) - (k.KeyQ || k.KeyC || k.ControlLeft ? 1 : 0) + WM.fy;
  const cp = Math.cos(WM.pitch);
  fwd.set(-Math.sin(WM.yaw) * cp, Math.sin(WM.pitch), -Math.cos(WM.yaw) * cp);
  right.set(Math.cos(WM.yaw), 0, -Math.sin(WM.yaw));
  want.set(0, 0, 0).addScaledVector(fwd, fw).addScaledVector(right, sd); want.y += up;
  if (want.lengthSq() > 1) want.normalize();
  want.multiplyScalar(WM.speed * (k.ShiftLeft || k.ShiftRight ? 3 : 1));
  // aceleração/frenagem suaves (sensação de câmera de jogo)
  WM.vel.lerp(want, 1 - Math.exp(-dt * 7));
  if (WM.vel.lengthSq() < 1e-6) WM.vel.set(0, 0, 0);
  step.copy(WM.vel).multiplyScalar(dt);
  if (step.lengthSq()) {
    if (!WM.ghost && sol.length) {
      // colisão por eixo (desliza ao longo das paredes)
      for (const ax of ['x', 'y', 'z'] as const) {
        const v = step[ax]; if (!v) continue;
        const dir = new V3(); dir[ax] = Math.sign(v);
        wr.set(orig.copy(WM.fp), dir); wr.far = Math.abs(v) + 0.35;
        if (wr.intersectObjects(sol, false).length) { step[ax] = 0; WM.vel[ax] = 0; }
      }
    }
    WM.fp.add(step);
  }
  // não entra no chão
  if (!WM.ghost) {
    wr.set(orig.set(WM.fp.x, WM.fp.y + 0.5, WM.fp.z), DN); wr.far = 1.0;
    const g = wr.intersectObjects(wk(), false)[0];
    if (g && WM.fp.y < g.point.y + 0.3) { WM.fp.y = g.point.y + 0.3; if (WM.vel.y < 0) WM.vel.y = 0; }
  }
  WM.fp.set(Math.max(-150, Math.min(150, WM.fp.x)), Math.max(-5, Math.min(140, WM.fp.y)), Math.max(-150, Math.min(150, WM.fp.z)));
  cam.position.copy(WM.fp); cam.rotation.set(WM.pitch, WM.yaw, 0);
}

let tipT = 0;
function aviso(txt: string) {
  const el = $('tip'); el.textContent = txt; clearTimeout(tipT);
  tipT = window.setTimeout(() => { el.textContent = TIPS[modo()] || TIP0; }, 1800);
}

export function walkStep() {
  const n = performance.now(), dt = Math.min(0.05, (n - lastT) / 1000), k = WM.keys, M = st.MP!; lastT = n;
  if (WM.free) { freeStep(dt); return; }
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
    if (e.code === 'Escape') { setMode('orbita'); return; }
    if (e.code === 'KeyV' && !WM.free) { togV(); return; }
    if (e.code === 'KeyG' && WM.free) { WM.ghost = !WM.ghost; aviso(WM.ghost ? 'Atravessar paredes: ligado' : 'Atravessar paredes: desligado'); return; }
    if (/^(Key[WASDQEC]|Arrow|Shift|Space|ControlLeft)/.test(e.code)) { WM.keys[e.code] = 1; if (/^(Arrow|Space)/.test(e.code)) e.preventDefault(); }
  });
  addEventListener('keyup', e => { delete WM.keys[e.code]; if (WM.on && e.code === 'Space') e.preventDefault(); });
  // roda do mouse na câmera livre: velocidade
  cv.addEventListener('wheel', e => {
    if (!WM.free) return;
    e.preventDefault();
    WM.speed = Math.max(0.5, Math.min(40, WM.speed * (e.deltaY > 0 ? 1 / 1.2 : 1.2)));
    aviso('Velocidade: ' + WM.speed.toFixed(1) + ' m/s');
  }, { passive: false });
  // botões ▲▼ da câmera livre no celular
  const hold = (id: string, v: number) => {
    const b = $(id) as HTMLElement;
    b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); WM.fy = v; });
    const up = () => { WM.fy = 0; }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  };
  hold('flu', 1); hold('fld', -1);
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
  $('bpv').onclick = togV;
}
