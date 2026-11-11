// Kit para construir mapas: formas básicas, instancing, luzes e texturas procedurais.
// Os mapas chamam begin(M) antes de construir; as funções adicionam objetos em K.G por padrão.
import * as THREE from 'three';
import type { MapRuntime } from './types';

export const K = { G: null as unknown as THREE.Group, M: null as unknown as MapRuntime };
export function begin(M: MapRuntime, seed = 7) { K.G = M.G; K.M = M; sd = seed; }

/** Fator de conversão de intensidades antigas (three r128, modo não físico) para o modo físico atual. */
export const LI = Math.PI;

let sd = 7;
export const seed = (s: number) => { sd = s; };
export const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

type MatLike = THREE.Material | number | string | undefined;
export const mat = (c: number | string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
const asMat = (c: MatLike) => (c && (c as THREE.Material).isMaterial ? (c as THREE.Material) : mat(c as number));

export function box(w: number, h: number, d: number, x: number, y: number, z: number, c?: MatLike, g?: THREE.Object3D) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), asMat(c));
  m.position.set(x, y, z); (g || K.G).add(m); return m;
}
export function cyl(r1: number, r2: number, h: number, x: number, y: number, z: number, c?: MatLike, g?: THREE.Object3D, n?: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, n || 14), asMat(c));
  m.position.set(x, y, z); (g || K.G).add(m); return m;
}
export function flat(w: number, d: number, x: number, z: number, y: number, m: THREE.Material, g?: THREE.Object3D) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); (g || K.G).add(p); return p;
}

export interface InstSpec { x: number; y: number; z: number; r?: number; sx?: number; sy?: number; sz?: number; c?: number; rx?: number; rz?: number }
export function inst(geo: THREE.BufferGeometry, m: THREE.Material, arr: InstSpec[], col?: boolean | number, g?: THREE.Object3D) {
  const im = new THREE.InstancedMesh(geo, m, Math.max(1, arr.length)), o = new THREE.Object3D(), c = new THREE.Color();
  im.count = arr.length;
  arr.forEach((a, i) => {
    o.position.set(a.x, a.y, a.z); o.rotation.set(a.rx || 0, a.r || 0, a.rz || 0);
    o.scale.set(a.sx || 1, a.sy || 1, a.sz || a.sx || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    if (col) im.setColorAt(i, c.setHex(a.c ?? 0xffffff));
  });
  im.computeBoundingSphere();
  (g || K.G).add(im); return im;
}

/** Luz pontual quente. d = intensidade de dia, n = de noite (valores na escala antiga). */
export function PL(x: number, y: number, z: number, d: number, n: number, dist?: number, color = 0xffa24a, g?: THREE.Object3D) {
  const l = new THREE.PointLight(color, d * LI, dist || 14, 1);
  l.position.set(x, y, z); (g || K.G).add(l); K.M.lights.push({ l, d: d * LI, n: n * LI }); return l;
}

// ---------- texturas procedurais (provisórias; serão trocadas por PBR) ----------
const jit = (r: number, g: number, b: number, v: number) => `rgb(${(r + v * (rnd() - 0.5)) | 0},${(g + v * (rnd() - 0.5)) | 0},${(b + v * (rnd() - 0.5)) | 0})`;
export function tex(w: number, h: number, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void, rx: number, ry: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export const cl = (t: THREE.Texture, rx: number, ry: number) => { const t2 = t.clone(); t2.needsUpdate = true; t2.repeat.set(rx, ry); return t2; };

function makeTextures() {
  sd = 7;
  const wood = tex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = jit(88, 64, 44, 26); g.fillRect(i * 32, 0, 32, h); for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(40,25,10,.18)'; g.fillRect(i * 32 + rnd() * 30, rnd() * h, 1, 20 + rnd() * 60); } g.fillStyle = 'rgba(20,10,0,.55)'; g.fillRect(i * 32, 0, 2, h); } }, 1.5, 2.75);
  const stone = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#8a8a86'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = jit(138, 138, 134, 34); g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(60,60,58,' + (0.04 + rnd() * 0.1) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.6, 0, 7); g.fill(); }
    for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h * 0.45, l = 50 + rnd() * 160, gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(30,34,30,.22)'); gr.addColorStop(1, 'rgba(30,34,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 3 + rnd() * 9, l); }
    g.fillStyle = 'rgba(25,25,25,.55)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(0, h / 2, w, 1.5); g.fillRect(w / 2, 0, 1.5, h);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, 2, w, 1); g.fillRect(2, 0, 1, h);
    for (let i = 0; i < 5; i++) { let x = rnd() * w, y = rnd() * h; g.strokeStyle = 'rgba(30,30,30,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rnd() - 0.5) * 14; y += 4 + rnd() * 8; g.lineTo(x, y); } g.stroke(); }
  }, 1, 1);
  const tile = tex(128, 128, (g, w, h) => { g.fillStyle = '#2a1410'; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 9; c++) { g.fillStyle = jit(92, 58, 54, 30); g.fillRect(c * 16 + (r % 2) * 8 + 1, r * 16 + 1, 14, 14); } }, 1, 1);
  const grass = tex(256, 256, (g, w, h) => { g.fillStyle = '#364a30'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3200; i++) { g.fillStyle = jit(50 + rnd() * 22, 76 + rnd() * 30, 46, 24); g.fillRect(rnd() * w, rnd() * h, 2, 3 + rnd() * 3); } }, 60, 60);
  const cob = tex(128, 128, (g, w, h) => { g.fillStyle = '#46423c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = jit(120, 116, 106, 36); g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 7 + rnd() * 4, 5 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); } }, 1, 1);
  return { wood, stone, tile, grass, cob };
}
let _tx: ReturnType<typeof makeTextures> | null = null;
/** Texturas procedurais compartilhadas (criadas na primeira chamada). */
export const TX = () => (_tx ||= makeTextures());

export const sm = (w: number, h: number) => { const t = cl(TX().stone, w / 4, h / 4); return mat(0xffffff, { map: t, bumpMap: t, bumpScale: 2.5, roughness: 0.95 }); };

export function glassTex(rose?: boolean) {
  const w = 128, h = rose ? 128 : 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!, P = ['#2f4f86', '#8e3a3a', '#d9a24c', '#e0b868', '#c98a3a', '#4b7a5c'];
  g.fillStyle = '#16110d'; g.fillRect(0, 0, w, h);
  if (rose) {
    for (let i = 0; i < 12; i++) { g.fillStyle = P[i % 6]; g.beginPath(); g.moveTo(64, 64); g.arc(64, 64, 60, (i * Math.PI) / 6 + 0.04, ((i + 1) * Math.PI) / 6 - 0.04); g.fill(); }
    g.fillStyle = '#e5a823'; g.beginPath(); g.arc(64, 64, 17, 0, 7); g.fill(); g.strokeStyle = '#16110d'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 38, 0, 7); g.stroke();
  } else {
    const cw = 32, ch = 32;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const cx = (x + 0.5) * cw, cy = (y + 0.5) * ch; g.fillStyle = P[(rnd() * 6) | 0]; g.beginPath(); g.moveTo(cx, cy - ch / 2 + 2); g.lineTo(cx + cw / 2 - 2, cy); g.lineTo(cx, cy + ch / 2 - 2); g.lineTo(cx - cw / 2 + 2, cy); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** Material de vitral (emissivo, cor ajustada pelo clima). */
export const GM = (m: THREE.Texture) => { const x = new THREE.MeshBasicMaterial({ map: m, side: THREE.DoubleSide }); K.M.glass.push(x); return x; };

export function arch(w: number, h: number) {
  const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(-w, h * 0.62); s.quadraticCurveTo(-w, h * 0.9, 0, h); s.quadraticCurveTo(w, h * 0.9, w, h * 0.62); s.lineTo(w, 0);
  const g = new THREE.ShapeGeometry(s, 12), u = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < u.count; i++) u.setXY(i, (p.getX(i) + w) / (2 * w), p.getY(i) / h);
  return g;
}

let _halo: THREE.Texture | null = null;
export function haloTex() {
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,200,130,1)'); r.addColorStop(0.35, 'rgba(255,170,90,.35)'); r.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(c));
}
export function halo(x: number, y: number, z: number, sc: number) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.4 }));
  m.scale.set(sc, sc, 1); m.position.set(x, y, z); K.G.add(m); K.M.halos.push(m); return m;
}

let _mist: THREE.Texture | null = null;
export function mistTex() {
  if (_mist) return _mist;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return (_mist = new THREE.CanvasTexture(c));
}

/** Marca todas as malhas (exceto userData.ns) para projetar e receber sombra e reduz o reflexo do ambiente. */
export function finishShadows(G: THREE.Object3D, env = 0.45) {
  G.traverse((o: any) => {
    if (o.isMesh && !o.userData.ns) o.castShadow = o.receiveShadow = true;
    if (o.isMesh && o.material && o.material.isMeshStandardMaterial && o.material.envMapIntensity === 1) o.material.envMapIntensity = env;
  });
}
