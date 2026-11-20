// Sul de Arton — interiores em escala de gente (1 unidade = 1 m), em "cenas de bolso" debaixo da mesa (y = −150),
// longe da vista do mapa. Entra-se pela ficha do lugar ("Ver por dentro") ou pelo menu de vistas. Lá dentro o sol
// é desligado (index.ts) e as luzes do lugar vêm do conjunto que segue a câmera.
// Tavernas (Âncora Quebrada, Macaco Caolho), castelo (Asidon), masmorra (Azazel), cavernas (Congelada, covil de
// Beluhga), Catedral de Gelo, Torre de Covariel, salão de Giluk, cabana da bruxa, templo de Korl Khodan, Zolkan.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MapRuntime, View } from '../../core/types';
import { Batch, MAT, mtx, por } from '../barud/common';
import {
  peca, mesa, banco, banqueta, cadeira, cama, bau, estante, prateleira, lareira, balcao, barril, caixote, sacos, vela, lustre,
  tapecaria, quadro, tapete, armario, caldeirao, altar, bancoTemplo, armadura, cavalete, servico,
} from '../barud/mobilia';
import { MM, comLote, dragao, cristais } from './miniaturas';
import { noise2 } from '../../core/terrain';
import { dustMotes } from '../../core/anim';
import { tempo } from './terreno';

type M4 = THREE.Matrix4;
type Luz = { x: number; y: number; z: number; cor: number; n: number; dist: number };
export const Y0 = -150;
const ORIGENS: [number, number][] = [[-250, -240], [-90, -240], [70, -240], [230, -240], [-250, -80], [-90, -80], [70, -80], [230, -80], [-250, 80], [-90, 80], [70, 80], [230, 80]];

let B: Batch, luzes: Luz[], halos: [number, number, number, number][], vistas: View[], pisos: THREE.Object3D[], colGeo: THREE.BufferGeometry[], paredes: [number, number][][], areas: { n: string; b: [number, number, number, number]; lv: number }[], anim: ((t: number) => void)[];
let brasas: THREE.Vector3[] = [], bolhas: THREE.Vector3[] = [], poeiras: THREE.Box3[] = [];
let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const v3 = (b: M4, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(b);
const luz = (b: M4, x: number, y: number, z: number, cor: number, n: number, dist: number, h = 0) => { const p = v3(b, x, y, z); luzes.push({ x: p.x, y: p.y, z: p.z, cor, n, dist }); if (h) halos.push([p.x, p.y, p.z, h]); };
const vista = (n: string, b: M4, p: [number, number, number], t: [number, number, number], fov = 62) => { const a = v3(b, ...p), c = v3(b, ...t); vistas.push({ n, p: [a.x, a.y, a.z].map(v => +v.toFixed(2)) as [number, number, number], t: [c.x, c.y, c.z].map(v => +v.toFixed(2)) as [number, number, number], fov }); };
const box = (b: M4, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, cor: number = 0xffffff, ry = 0, rz = 0, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); por(B, mat, g, cor, b); };
const cil = (b: M4, mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, cor: number = 0xffffff, lados = 10, r2 = r) => { const g = new THREE.CylinderGeometry(r2, r, h, lados); g.translate(x, y + h / 2, z); por(B, mat, g, cor, b); };
const geo = (b: M4, mat: THREE.Material, g: THREE.BufferGeometry, cor: number = 0xffffff) => por(B, mat, g, cor, b);
/** parede sólida (colisão) em coordenadas locais da cena */
function solido(b: M4, w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y + h / 2, z); g.applyMatrix4(b); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.toNonIndexed()); }
/** piso invisível para arrastar personagens e caminhar */
function piso(b: M4, w: number, d: number, y = 0) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(0, y + 0.01, 0); g.applyMatrix4(b); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ visible: false })); m.userData.ns = 1; m.userData.noExport = 1; pisos.push(m); return m; }
function contorno(n: string, b: M4, w: number, d: number) { const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]].map(([x, z]) => { const p = v3(b, x, 0, z); return [+p.x.toFixed(2), +p.z.toFixed(2)] as [number, number]; }); paredes.push(c); const xs = c.map(p => p[0]), zs = c.map(p => p[1]); areas.push({ n, b: [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...zs) - 1, Math.max(...zs) + 1], lv: 1 }); }
const janelaM = new THREE.MeshBasicMaterial({ color: 0x1c2a44 });

/** sala retangular: piso, teto com vigas, 4 paredes; frente (porta) em +z */
function sala(n: string, b: M4, W: number, D: number, H: number, o: { parede: THREE.Material; cp: number; chao: THREE.Material; cc: number; teto?: THREE.Material; ct?: number; vigas?: boolean; janelas?: number; porta?: boolean }) {
  const M = MAT(), t = 0.3;
  box(b, o.chao, W, 0.2, D, 0, -0.1, 0, o.cc);
  box(b, o.teto ?? M.madeira, W, 0.2, D, 0, H + 0.1, 0, o.ct ?? 0x6a5844);
  box(b, o.parede, W + 2 * t, H, t, 0, H / 2, -D / 2 - t / 2, o.cp); box(b, o.parede, W + 2 * t, H, t, 0, H / 2, D / 2 + t / 2, o.cp);
  box(b, o.parede, t, H, D, -W / 2 - t / 2, H / 2, 0, o.cp); box(b, o.parede, t, H, D, W / 2 + t / 2, H / 2, 0, o.cp);
  if (o.vigas !== false) for (let x = -W / 2 + 1.2; x < W / 2; x += 2.2) box(b, M.madeira, 0.22, 0.28, D, x, H - 0.14, 0, 0x4a3424);
  for (let i = 0; i < (o.janelas ?? 2); i++) { const x = -W / 2 + ((i + 1) * W) / ((o.janelas ?? 2) + 1); box(b, janelaM, 0.9, 1.1, 0.05, x, 1.7, D / 2 - 0.02); box(b, M.madeira, 1.05, 0.08, 0.12, x, 1.12, D / 2 - 0.06, 0x4a3424); box(b, M.madeira, 0.06, 1.1, 0.06, x, 1.7, D / 2 - 0.06, 0x4a3424); }
  if (o.porta !== false) { box(b, M.tabuas, 1.2, 2.2, 0.08, W * 0.3, 1.1, D / 2 - 0.05, 0x5a4030); box(b, M.ferro, 0.08, 0.08, 0.06, W * 0.3 - 0.45, 1.05, D / 2 - 0.1); }
  solido(b, W, H, t, 0, 0, -D / 2 - t / 2); solido(b, W, H, t, 0, 0, D / 2 + t / 2); solido(b, t, H, D, -W / 2 - t / 2, 0, 0); solido(b, t, H, D, W / 2 + t / 2, 0, 0);
  piso(b, W, D); contorno(n, b, W, D);
}
/** gruta (cúpula irregular vista por dentro) com chão */
function gruta(n: string, b: M4, rx: number, ry: number, rz: number, mat: THREE.Material, chao: THREE.Material, cc: number, seed: number) {
  const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.18 * (noise2(x * 2.2 + seed, z * 2.2 + y * 2) - 0.5) * 2 + 0.07 * (noise2(x * 7, z * 7 + seed) - 0.5); p.setXYZ(i, x * rx * k, y * ry * k, z * rz * k); }
  g.computeVertexNormals(); geo(b, mat, g);
  const f = new THREE.CircleGeometry(1, 40); f.rotateX(-Math.PI / 2); const q = f.attributes.position; for (let i = 0; i < q.count; i++) q.setXYZ(i, q.getX(i) * rx * 1.02, 0.05 * noise2(q.getX(i) * 9, q.getZ(i) * 9), q.getZ(i) * rz * 1.02); f.computeVertexNormals(); geo(b, chao, f, cc);
  piso(b, rx * 1.6, rz * 1.6); contorno(n, b, rx * 1.8, rz * 1.8);
  // estalactites
  for (let i = 0; i < 60; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.8, x = Math.cos(a) * r * rx, z = Math.sin(a) * r * rz, yy = ry * Math.sqrt(Math.max(0, 1 - r * r)) * 0.92, h = 0.5 + rnd() * 1.8; const c = new THREE.ConeGeometry(0.08 + rnd() * 0.18, h, 6); c.rotateX(Math.PI); c.translate(x, yy - h / 2, z); geo(b, mat, c); }
}
function tocha(b: M4, x: number, y: number, z: number, ry: number) {
  const M = MAT(), p = peca(B, b, x, y, z, ry);
  p.cx(M.ferro, 0.06, 0.06, 0.3, 0, 0, 0.12); p.cx(M.madeira, 0.06, 0.45, 0.06, 0, 0.18, 0.28, 0x4a3424, 0, -0.25);
  const f = new THREE.ConeGeometry(0.08, 0.28, 6); f.translate(0, 0.52, 0.34); por(B, MAT().aceso, f, 0xffffff, p.m);
  const w = p.pos(0, 0.55, 0.34); luzes.push({ x: w.x, y: w.y, z: w.z, cor: 0xff8a3a, n: 16, dist: 7 }); halos.push([w.x, w.y, w.z, 1.1]);
}
function cartaz(b: M4, x: number, y: number, z: number, ry: number, w: number, h: number, desenho: (g: CanvasRenderingContext2D, W: number, H: number) => void) {
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w); desenho(c.getContext('2d')!, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  m.position.copy(v3(b, x, y, z)); m.rotation.y = ry; m.userData.ns = 1; return m;
}

// ---------------- decoração (mais leitura e mais vida dentro) ----------------
const texCache: Record<string, THREE.Texture> = {};
function texCanvas(id: string, W: number, H: number, f: (g: CanvasRenderingContext2D) => void) { if (texCache[id]) return texCache[id]; const c = document.createElement('canvas'); c.width = W; c.height = H; f(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (texCache[id] = t); }
const matCache: Record<string, THREE.Material> = {};
const matFeixe = () => (matCache.feixe ||= new THREE.MeshBasicMaterial({ map: texCanvas('feixe', 8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); }), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
const matTeia = () => (matCache.teia ||= new THREE.MeshBasicMaterial({ map: texCanvas('teia', 128, 128, g => { g.strokeStyle = 'rgba(230,230,230,0.7)'; g.lineWidth = 1; for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); g.stroke(); } for (let r = 14; r < 128; r += 13) { g.beginPath(); for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI / 2, rr = r * (0.92 + 0.08 * Math.sin(k * 3 + r)); k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.55 }));
const matPoca = () => (matCache.poca ||= new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.08, metalness: 0.05, envMapIntensity: 0.2, transparent: true, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
const matMusgo = () => (matCache.musgo ||= new THREE.MeshStandardMaterial({ color: 0x2a3a1e, roughness: 1, transparent: true, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
const uvFixo = <T extends THREE.BufferGeometry>(g: T) => { (g as any).isUVd = true; return g; };
/** lambri de madeira, rodapé, cornija e pilastras nas quatro paredes */
function acabamento(b: M4, W: number, D: number, H: number, o: { lambri?: number; alt?: number; cornija?: number; pilastras?: number; mat?: THREE.Material } = {}) {
  const M = MAT(), alt = o.alt ?? 1.0, cl = o.lambri ?? 0x4a3020, cc = o.cornija ?? 0x3a2818, mat = o.mat ?? M.madeira;
  for (const [w, x, z, ry] of [[W, 0, -D / 2 + 0.04, 0], [W, 0, D / 2 - 0.04, 0], [D, -W / 2 + 0.04, 0, Math.PI / 2], [D, W / 2 - 0.04, 0, Math.PI / 2]] as [number, number, number, number][]) {
    box(b, mat, w, alt, 0.06, x, alt / 2, z, cl, ry); box(b, mat, w, 0.07, 0.1, x, alt + 0.02, z, cc, ry); box(b, mat, w, 0.16, 0.12, x, H - 0.08, z, cc, ry);
    if (o.pilastras) for (let u = -w / 2 + o.pilastras / 2; u < w / 2; u += o.pilastras) { const px = ry ? x : u, pz = ry ? u : z; box(b, mat, 0.22, H, 0.14, px, H / 2, pz, cc, ry); }
  }
}
/** arandela com vela na parede (luz quente fraca) */
function arandela(b: M4, x: number, y: number, z: number, ry: number, n = 7) {
  const M = MAT(), p = peca(B, b, x, y, z, ry);
  p.cx(M.ferro, 0.12, 0.2, 0.03, 0, 0, 0, 0x6a5a3a); p.cx(M.ferro, 0.03, 0.03, 0.18, 0, -0.05, 0.09, 0x6a5a3a); p.cil(M.ferro, 0.05, 0.03, 0, -0.04, 0.17, 0x6a5a3a, 8);
  p.cil(M.plain, 0.022, 0.14, 0, -0.02, 0.17, 0xf0e6cc, 6); const f = new THREE.ConeGeometry(0.018, 0.06, 5); f.translate(0, 0.15, 0.17); por(B, MAT().aceso, f, 0xffffff, p.m);
  const w = p.pos(0, 0.15, 0.2); luzes.push({ x: w.x, y: w.y, z: w.z, cor: 0xffa860, n, dist: 4 }); halos.push([w.x, w.y, w.z, 0.5]);
}
/** coisas penduradas nas vigas: presuntos, linguiças, alho, ervas, panelas */
function penduricalhos(b: M4, x0: number, x1: number, z: number, H: number, n = 8) {
  const M = MAT();
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n + (rnd() - 0.5) * 0.3, k = (rnd() * 5) | 0, L = 0.25 + rnd() * 0.35, y = H - 0.3 - L;
    box(b, M.plain, 0.01, L, 0.01, x, H - 0.3 - L / 2, z, 0x6a5a40);
    if (k === 0) { const g = new THREE.SphereGeometry(0.12, 8, 6); g.scale(0.8, 1.5, 0.8); g.translate(x, y - 0.12, z); geo(b, M.plain, g, 0x8a3a2a); }
    else if (k === 1) for (let q = 0; q < 4; q++) cil(b, M.plain, 0.025, 0.28, x + (q - 1.5) * 0.04, y - 0.3, z, 0x7a2a1a, 6);
    else if (k === 2) for (let q = 0; q < 5; q++) { const g = new THREE.SphereGeometry(0.04, 6, 4); g.translate(x + (rnd() - 0.5) * 0.06, y - q * 0.06, z + (rnd() - 0.5) * 0.04); geo(b, M.plain, g, 0xe8e0c8); }
    else if (k === 3) { const g = new THREE.ConeGeometry(0.08, 0.32, 6); g.rotateX(Math.PI); g.translate(x, y - 0.16, z); geo(b, MM.palha, g, pick3([0x5a7a30, 0x7a8a40, 0x8a6a3a])); }
    else { cil(b, M.ferro, 0.13, 0.11, x, y - 0.11, z, 0x3a3634, 10); }
  }
}
const pick3 = <T,>(a: T[]) => a[(rnd() * a.length) | 0];
/** caneca, prato com comida, garrafa, pão (em cima de uma mesa na altura y) */
function comida(b: M4, x: number, y: number, z: number) {
  const M = MAT();
  for (let i = 0; i < 2 + ((rnd() * 3) | 0); i++) { const a = rnd() * 6.28, r = 0.15 + rnd() * 0.25, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r * 0.6, k = (rnd() * 4) | 0;
    if (k === 0) { cil(b, M.madeira, 0.045, 0.11, px, y, pz, 0x6a4a2a, 8); }
    else if (k === 1) { cil(b, M.plain, 0.1, 0.015, px, y, pz, 0xd8d0c0, 12); const g = new THREE.SphereGeometry(0.06, 8, 5); g.scale(1.3, 0.6, 1); g.translate(px, y + 0.03, pz); geo(b, M.plain, g, pick3([0x8a4a2a, 0xc89a50, 0x6a8a3a])); }
    else if (k === 2) { cil(b, M.plain, 0.035, 0.2, px, y, pz, pick3([0x2a4a2a, 0x4a2a1a, 0x3a3a5a]), 8, 0.02); }
    else { const g = new THREE.SphereGeometry(0.08, 8, 5); g.scale(1.4, 0.7, 1); g.translate(px, y + 0.04, pz); geo(b, M.plain, g, 0xb88a4a); } }
}
/** escudo redondo de parede com faixa (ou brasão) */
function escudo(b: M4, x: number, y: number, z: number, ry: number, cor: number, cor2: number, r = 0.4) {
  const M = MAT(), p = peca(B, b, x, y, z, ry);
  const g = new THREE.CylinderGeometry(r, r, 0.05, 18); g.rotateX(Math.PI / 2); por(B, M.madeira, g, cor, p.m);
  p.cx(M.madeira, r * 2, r * 0.35, 0.06, 0, 0, 0.01, cor2); p.cx(M.madeira, r * 0.35, r * 2, 0.06, 0, 0, 0.012, cor2);
  const c = new THREE.SphereGeometry(r * 0.22, 10, 6); c.scale(1, 1, 0.5); c.translate(0, 0, 0.04); por(B, M.ferro, c, 0x8a8478, p.m);
  const a = new THREE.TorusGeometry(r, 0.03, 4, 20); por(B, M.ferro, a, 0x5a5650, p.m);
}
/** chifres de troféu na parede */
function trofeu(b: M4, x: number, y: number, z: number, ry: number) {
  const M = MAT(), p = peca(B, b, x, y, z, ry); p.cx(M.madeira, 0.3, 0.36, 0.04, 0, 0, 0, 0x4a3020); p.esf(M.plain, 0.12, 0, 0, 0.1, 0x6a4a30, 1.2);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const g = new THREE.ConeGeometry(0.025, 0.32 - k * 0.06, 5); g.rotateZ(-s * (0.5 + k * 0.35)); g.translate(s * (0.12 + k * 0.1), 0.2 + k * 0.08, 0.1); por(B, M.plain, g, 0xd8cca8, p.m); }
}
function teia(b: M4, x: number, y: number, z: number, ry: number, s = 0.9) { const g = uvFixo(new THREE.PlaneGeometry(s, s)); g.translate(s / 2, -s / 2, 0); g.rotateY(ry); g.translate(x, y, z); geo(b, matTeia(), g); }
/** feixe de luz entrando por uma janela (plano aditivo com degradê, cruzado) */
function feixe(b: M4, x: number, y: number, z: number, rx: number, ry: number, w: number, L: number, cor = 0xb8c8ff) {
  for (const r2 of [0, Math.PI / 2]) { const g = uvFixo(new THREE.PlaneGeometry(w, L)); g.translate(0, -L / 2, 0); g.rotateY(r2); g.rotateX(rx); g.rotateY(ry); g.translate(x, y, z); geo(b, matFeixe(), g, cor); }
}
function poca(b: M4, x: number, z: number, r: number) { const g = new THREE.CircleGeometry(r, 18); g.scale(1, 0.6 + rnd() * 0.5, 1); g.rotateX(-Math.PI / 2); g.rotateY(rnd() * 3); g.translate(x, 0.012, z); geo(b, matPoca(), g); }
function musgo(b: M4, x: number, y: number, z: number, ry: number, w: number, h: number, chao = false) { const g = new THREE.CircleGeometry(0.5, 10); g.scale(w, h, 1); if (chao) g.rotateX(-Math.PI / 2); g.rotateY(ry); g.translate(x, y, z); geo(b, matMusgo(), g); }
/** correntes com grilhões descendo da parede */
function corrente(b: M4, x: number, y: number, z: number, ry: number, L: number) {
  const M = MAT(), p = peca(B, b, x, y, z, ry); p.cx(M.ferro, 0.12, 0.12, 0.05, 0, 0, 0);
  for (let k = 0; k < Math.round(L / 0.09); k++) { const t = new THREE.TorusGeometry(0.035, 0.012, 4, 8); if (k % 2) t.rotateY(Math.PI / 2); t.translate(0, -0.06 - k * 0.075, 0.05); por(B, M.ferro, t, 0x5a5650, p.m); }
  const gr = new THREE.TorusGeometry(0.07, 0.02, 4, 10); gr.rotateX(Math.PI / 2); gr.translate(0, -0.1 - L, 0.06); por(B, M.ferro, gr, 0x4a4640, p.m);
}
/** ossada no chão: crânio, costelas e ossos longos */
function ossada(b: M4, x: number, z: number, ry: number, s = 1) {
  const M = MAT(), p = peca(B, b, x, 0, z, ry), c = 0xd8d0b8;
  p.esf(M.plain, 0.1 * s, 0.35 * s, 0.08 * s, 0, c, 1.05); p.cx(M.plain, 0.06 * s, 0.03 * s, 0.05 * s, 0.43 * s, 0.05 * s, 0, 0x2a2622);
  for (let k = 0; k < 4; k++) { const t = new THREE.TorusGeometry(0.1 * s, 0.012 * s, 4, 8, Math.PI); t.rotateY(Math.PI / 2); t.translate(0.1 * s - k * 0.06 * s, 0.03, 0); por(B, M.plain, t, c, p.m); }
  for (let k = 0; k < 3; k++) { const g = new THREE.CylinderGeometry(0.018 * s, 0.018 * s, 0.38 * s, 5); g.rotateZ(Math.PI / 2); g.rotateY(rnd() * 3); g.translate(-0.25 * s + rnd() * 0.2, 0.02, (rnd() - 0.5) * 0.3 * s); por(B, M.plain, g, c, p.m); }
}
/** gaiola de ferro pendurada */
function gaiola(b: M4, x: number, y: number, z: number, osso = true) {
  const M = MAT(); box(b, M.ferro, 0.02, 1.0, 0.02, x, y + 1.35, z, 0x3a3634);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; cil(b, M.ferro, 0.012, 1.1, x + Math.cos(a) * 0.38, y - 0.25, z + Math.sin(a) * 0.38, 0x3a3634, 4); }
  for (const yy of [-0.25, 0.85]) { const t = new THREE.TorusGeometry(0.38, 0.02, 4, 16); t.rotateX(Math.PI / 2); t.translate(x, y + yy, z); geo(b, M.ferro, t, 0x3a3634); }
  const c = new THREE.ConeGeometry(0.4, 0.3, 10); c.translate(x, y + 1.0, z); geo(b, M.ferro, c, 0x3a3634);
  if (osso) { const g = new THREE.SphereGeometry(0.09, 8, 6); g.translate(x + 0.1, y - 0.15, z); geo(b, M.plain, g, 0xd8d0b8); }
}
/** arco de pedra atravessando a sala (abóbada de berço feita de arcos) */
function arcoPedra(b: M4, z: number, larg: number, H: number, cor: number, esp = 0.45) {
  const M = MAT(), r = larg / 2, h0 = H - r * 0.6;
  const a = new THREE.TorusGeometry(r, 0.18, 6, 20, Math.PI); a.scale(1, 0.6, esp / 0.36); a.translate(0, h0, z); geo(b, M.pedra, a, cor);
  for (const s of [-1, 1]) box(b, M.pedra, 0.4, h0, esp, s * (r - 0.05), h0 / 2, z, cor);
}
/** abóbada: casca curva por dentro entre os arcos */
function abobada(b: M4, W: number, D: number, H: number, cor: number) {
  const r = W / 2, g = new THREE.CylinderGeometry(r, r, D, 24, 1, true, Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(1, 0.6, 1); g.translate(0, H - r * 0.6, 0);
  const ix = g.index!.array as any; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } g.computeVertexNormals(); geo(b, MAT().pedra, g, cor);
}
/** vitral colorido (canvas) que brilha, com um feixe colorido entrando */
function vitral(b: M4, x: number, y: number, z: number, ry: number, w: number, h: number, cores: string[], id: string, feixeCor?: number) {
  const t = texCanvas('vitral-' + id, 64, Math.round(64 * h / w), g => { const W = 64, H = g.canvas.height; g.fillStyle = '#1a1612'; g.fillRect(0, 0, W, H); for (let j = 0; j < 9; j++) for (let i = 0; i < 4; i++) { g.fillStyle = cores[(i * 3 + j * 5 + (i * j) % 3) % cores.length]; g.fillRect(i * 16 + 2, j * H / 9 + 2, 13, H / 9 - 3); } g.fillStyle = '#1a1612'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W / 2, -H * 0.02); g.lineTo(W, 0); g.lineTo(W, H * 0.12); g.quadraticCurveTo(W / 2, -H * 0.06, 0, H * 0.12); g.fill(); g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(W / 2, H * 0.3, 9, 0, 6.3); g.fill(); });
  const m = (matCache['vit' + id] ||= new THREE.MeshBasicMaterial({ map: t })); const g = uvFixo(new THREE.PlaneGeometry(w, h)); g.rotateY(ry); g.translate(x, y, z); geo(b, m, g);
  if (feixeCor !== undefined) { const n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)); feixe(b, x + n.x * 0.1, y + h * 0.3, z + n.z * 0.1, 0.75, ry, w * 0.9, y * 1.6, feixeCor); }
}
/** névoa rasteira: placas transparentes no chão (masmorra, cripta) */
function nevoaChao(G: THREE.Group, b: M4, W: number, D: number, n: number, cor = 0x9aa0a8) {
  const m = new THREE.SpriteMaterial({ map: (matFeixe() as THREE.MeshBasicMaterial).map, color: cor, transparent: true, opacity: 0.0, depthWrite: false });
  const t = texCanvas('nevoa', 64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }); m.map = t; m.opacity = 0.22;
  for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(m), p = v3(b, (rnd() - 0.5) * W, 0.25, (rnd() - 0.5) * D); sp.position.copy(p); sp.scale.set(3 + rnd() * 2, 0.8, 1); sp.userData.ns = 1; sp.userData.noExport = 1; G.add(sp); const x0 = p.x, f = rnd() * 6; anim.push(t2 => { sp.position.x = x0 + Math.sin(t2 * 0.15 + f) * 0.6; }); }
}

// ---------------- extras de cada cena ----------------
function ancoraMais(b: M4) {
  const M = MAT(), W = 14, D = 10, H = 3.6;
  acabamento(b, W, D, H, { lambri: 0x5a3a24, alt: 1.1 });
  penduricalhos(b, -5.5, 5.5, 0.6, H, 12); penduricalhos(b, -5.5, 2, -2.6, H, 7);
  for (const [x, z] of [[-1.8, 1.6], [1.6, 2.6], [4.1, 0.6], [-4.6, 2.9], [1.0, -1.0]]) comida(b, x, 0.8, z);
  for (const [x, z, ry] of [[-6.9, 0.5, Math.PI / 2], [-6.9, -2.5, Math.PI / 2], [6.9, 2.6, -Math.PI / 2], [2.0, 4.9, Math.PI], [-3.0, 4.9, Math.PI]] as [number, number, number][]) arandela(b, x, 2.0, z, ry);
  escudo(b, 5.6, 2.3, -4.92, 0, 0x2a3a5a, 0xd8c8a0, 0.35); escudo(b, -0.8, 2.6, -4.92, 0, 0x6a1a1a, 0xd8b048, 0.3);
  for (let k = 0; k < 6; k++) box(b, M.madeira, 0.08, 0.1, 0.08, -4.6 + k * 0.32, 1.05, -2.65, 0x7a5a3a); // canecas no balcão
  for (let i = 0; i < 3; i++) { const g = new THREE.SphereGeometry(0.12, 10, 8); g.translate(-0.2 + i * 1.7, 1.75, -4.8); geo(b, M.plain, g, [0x3a6a7a, 0x2a5a4a, 0x6a7a8a][i]); } // boias de vidro nas redes
  teia(b, -W / 2 + 0.05, H - 0.05, -D / 2 + 0.05, 0, 0.8); teia(b, W / 2 - 0.05, H - 0.05, -D / 2 + 0.05, -Math.PI / 2, 0.7);
  feixe(b, -W / 2 + 4.67, 2.2, D / 2 - 0.1, 0.8, Math.PI, 0.9, 3.2, 0x8090b0); feixe(b, -W / 2 + 9.33, 2.2, D / 2 - 0.1, 0.8, Math.PI, 0.9, 3.2, 0x8090b0);
  tapete(B, b, 4.6, 0.6, 0.2, 2.2, 1.4);
}
function macacoMais(b: M4) {
  const W = 16, D = 12, H = 4;
  acabamento(b, W, D, H, { lambri: 0x6a4428, alt: 1.0 });
  penduricalhos(b, -6, 6, 2.5, H, 12);
  for (let i = 0; i < 7; i++) comida(b, -3 + (i % 4) * 2.6, 0.8, 0.5 + Math.floor(i / 4) * 2.8);
  for (const [x, z, ry] of [[-7.9, 3.5, Math.PI / 2], [7.9, 4.5, -Math.PI / 2], [-3, 5.9, Math.PI], [4, 5.9, Math.PI]] as [number, number, number][]) arandela(b, x, 2.2, z, ry);
  for (let k = 0; k < 8; k++) { const g = new THREE.SphereGeometry(0.05, 6, 4); g.translate(-1 + k * 0.85, 3.6, -3.4); geo(b, MAT().aceso, g); } luz(b, 2, 3.5, -3.3, 0xffd090, 12, 6); // ribalta
  escudo(b, -4.5, 2.6, -5.92, 0, 0x2a6ac8, 0xf0e8d0, 0.35); escudo(b, 6.5, 2.6, -5.92, 0, 0xc8302a, 0xe8c040, 0.35);
  feixe(b, -W / 2 + 4, 2.3, D / 2 - 0.1, 0.8, Math.PI, 0.9, 3.4, 0x8090b0); feixe(b, -W / 2 + 12, 2.3, D / 2 - 0.1, 0.8, Math.PI, 0.9, 3.4, 0x8090b0);
}
function asidonMais(b: M4) {
  const M = MAT(), W = 22, D = 12, H = 7;
  acabamento(b, W, D, H, { lambri: 0x5a3a24, alt: 1.4 });
  for (let x = -W / 2 + 2; x < W / 2; x += 3) for (const s of [-1, 1]) { const z = s * (D / 2 - 1.2); cil(b, M.pedra, 0.52, 0.4, x, 0, z, 0x9a9282, 12); cil(b, M.pedra, 0.52, 0.35, x, H - 0.55, z, 0x9a9282, 12, 0.4); tapecaria(B, b, x, 4.4, z - s * 0.4, s > 0 ? Math.PI : 0, 0.6, 2.4, [0x8a1a1a, 0x1a2a6a][(x + 11) % 2 ? 1 : 0]); }
  for (let x = -W / 2 + 2; x < W / 2; x += 3) { const a = new THREE.TorusGeometry(D / 2 - 1.2, 0.2, 6, 18, Math.PI); a.scale(1, 0.35, 1); a.rotateY(Math.PI / 2); a.translate(x, H - 0.6, 0); geo(b, M.pedra, a, 0xa8a090); }
  for (let i = 0; i < 4; i++) escudo(b, -8 + i * 5.3, 5.6, -D / 2 + 0.1, 0, [0x8a1a1a, 0x1a2a6a, 0xc8a030, 0x2a5a2a][i], 0xe8e0d0, 0.45);
  tapete(B, b, 0, 0.6, 0, 1.6, 9.5);
  for (let i = 0; i < 3; i++) comida(b, -4 + i * 4, 0.8, 0.5);
  for (const s of [-1, 1]) { const p = peca(B, b, s * 9.8, 0, 3.8, s * -Math.PI / 2); for (let k = 0; k < 4; k++) p.cx(M.madeira, 0.04, 1.6, 0.04, -0.4 + k * 0.27, 0.8, 0, 0x5a4030, 0.06); p.cx(M.madeira, 1.2, 0.06, 0.1, 0, 0.5, 0, 0x4a3020); p.cx(M.madeira, 1.2, 0.06, 0.1, 0, 1.4, 0, 0x4a3020); }
  for (let k = 0; k < 6; k++) { const x = -8 + k * 3.2; feixe(b, x, 5.3, -D / 2 + 0.1, -0.55, 0, 0.5, 5.0, 0x384050); }
}
function masmorraMais(b: M4, G: THREE.Group) {
  const W = 20, D = 16, H = 4;
  abobada(b, 4.4, D, H - 0.03, 0x6e6a62);
  for (let z = -D / 2 + 0.6; z < D / 2; z += 2.6) arcoPedra(b, z, 4.4, H - 0.03, 0x5e5a54, 0.5);
  for (let i = 0; i < 14; i++) poca(b, (rnd() - 0.5) * 3.6, -7 + rnd() * 14, 0.25 + rnd() * 0.45);
  for (let i = 0; i < 18; i++) { const s = rnd() < 0.5 ? -1 : 1; musgo(b, s * (W / 2 - 0.03), 0.4 + rnd() * 2.2, -7 + rnd() * 14, -s * Math.PI / 2, 0.6 + rnd(), 0.4 + rnd() * 0.8); }
  for (let i = 0; i < 14; i++) musgo(b, (rnd() - 0.5) * 18, 0.02, -7 + rnd() * 14, 0, 0.6 + rnd(), 0.4 + rnd(), true);
  for (const s of [-1, 1]) for (let c = 0; c < 3; c++) { const z = 3.5 - c * 4.2; if ((c + (s > 0 ? 0 : 1)) % 2) ossada(b, s * 7.5, z - 0.2, rnd() * 3, 1.3); corrente(b, s * (W / 2 - 0.08), 2.4, z + 0.6, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1.0); cil(b, MAT().madeira, 0.18, 0.3, s * 3.6, 0, z + 1.2, 0x4a3a2a, 8); }
  gaiola(b, 0, 2.0, 1.5); gaiola(b, -1.3, 2.3, -2.2, false);
  // mesa de tortura e grade de escoamento
  { const M = MAT(), p = peca(B, b, -5.5, 0, -6.5, 0.3); p.cx(M.madeira, 0.9, 0.12, 2.0, 0, 0.85, 0, 0x3a2a1e); for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.cx(M.madeira, 0.1, 0.85, 0.1, sx * 0.38, 0.42, sz * 0.9, 0x3a2a1e); for (const sz of [-1, 1]) p.cil(M.madeira, 0.08, 1.0, -0.5, 1.0, sz * 1.0, 0x4a3a2a, 8); }
  box(b, MAT().ferro, 0.8, 0.02, 0.8, 0, 0.015, 3, 0x2a2826); for (let k = 0; k < 6; k++) box(b, MAT().escuro, 0.7, 0.025, 0.04, 0, 0.02, 2.7 + k * 0.12);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; vela(B, b, Math.cos(a) * 2.6, 0, -6 + Math.sin(a) * 2.6); }
  teia(b, -W / 2 + 0.05, H + 0.6, -D / 2 + 0.05, 0, 1.2); teia(b, W / 2 - 0.05, H + 0.6, -D / 2 + 0.05, -Math.PI / 2, 1.0); teia(b, -2.2, H - 0.2, 5, 0.3, 0.8);
  nevoaChao(G, b, W - 2, D - 2, 14, 0x8a8a90);
  luz(b, 0, 2.5, 0, 0x6a7a9a, 10, 10);
}
function catedralMais(b: M4, G: THREE.Group) {
  const W = 12, D = 30, H = 14, ic = MM.gelo as THREE.Material;
  const pal = ['#8fd0ff', '#4a7ac8', '#c8e8ff', '#7a5ac8', '#e8f4ff', '#3a9ac8'];
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) vitral(b, s * (W / 2 - 0.04), 6, -10 + k * 6, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1.4, 4.4, pal, 'gelo', 0x5a8ac8);
  vitral(b, 0, H - 4, -D / 2 + 0.05, 0, 3.2, 5, ['#9ad8ff', '#5a8ae8', '#d8f0ff', '#a07ad8'], 'rosa');
  tapete(B, b, 0, 0, 0, 1.6, D - 6); 
  // dragoa de gelo sobre o altar e lustres de pingentes
  const w = v3(b, 0, 2.2, -D / 2 + 2.2); comLote(B, () => dragao(w.x, w.y, w.z, 0, 1.2));
  for (let k = 0; k < 7; k++) vela(B, b, -1.2 + k * 0.4, 2.0, -D / 2 + 3.4);
  for (const z of [-6, 2, 9]) { const t = new THREE.TorusGeometry(1.1, 0.05, 5, 24); t.rotateX(Math.PI / 2); t.translate(0, H - 4.5, z); geo(b, ic, t); for (let k = 0; k < 10; k++) { const c = new THREE.ConeGeometry(0.05, 0.6, 5); c.rotateX(Math.PI); c.translate(Math.cos(k * 0.63) * 1.1, H - 4.85, z + Math.sin(k * 0.63) * 1.1); geo(b, MM.gelado, c); } luz(b, 0, H - 5, z, 0xbfe8ff, 14, 10, 1.4); }
  nevoaChao(G, b, W - 2, D - 4, 12, 0xc8e4f4);
}
function covarielMais(b: M4) { teia(b, -3.5, 4.9, -3.4, 0.8, 0.8); arandela(b, 4.9, 2.0, 1.2, -Math.PI / 2); arandela(b, -4.9, 2.0, 0.8, Math.PI / 2); for (let i = 0; i < 4; i++) { const x = 1.2 + i * 0.35; box(b, MAT().plain, 0.25, 0.04, 0.32, x, 0.86, -1.6, 0xe8dcb8, 0.3); } }
function gilukMais(b: M4) {
  const W = 9, D = 24, H = 3.2;
  for (let z = -9; z <= 9; z += 6) for (const s of [-1, 1]) trofeu(b, s * (W / 2 - 0.06), 2.7, z + 2.5, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  for (let k = 0; k < 4; k++) tapete(B, b, (k % 2 ? 1 : -1) * 1.6, -9 + k * 5.5, 0.3, 1.4, 1.0); // peles no chão
  penduricalhos(b, -3.5, 3.5, -10.5, H + 1.2, 8); penduricalhos(b, -3.5, 3.5, 10.5, H + 1.2, 8);
  for (let i = 0; i < 6; i++) comida(b, (i % 2 ? 1 : -1) * 2.0, 0.8, -6 + Math.floor(i / 2) * 5);
  for (let z = -8; z <= 8; z += 8) { cil(b, MAT().ferro, 0.18, 0.3, 0, H + 0.4, z, 0x3a3634, 8); box(b, MAT().plain, 0.01, 1.0, 0.01, 0, H + 0.9, z, 0x3a3634); luz(b, 0, H + 0.3, z, 0xffa050, 8, 6, 0.8); }
}
function bruxaMais(b: M4) { teia(b, -2.95, 2.75, -2.45, 0, 0.7); teia(b, 2.95, 2.75, -2.45, -Math.PI / 2, 0.6); penduricalhos(b, -2.5, 2.5, 1.5, 2.8, 8); for (let i = 0; i < 5; i++) ossada(b, -2.2 + rnd() * 0.6, 1.8 + rnd() * 0.4, rnd() * 6, 0.35); }
function temploMais(b: M4) {
  const W = 12, D = 18, H = 7;
  acabamento(b, W, D, H, { lambri: 0x8a8070, alt: 0.8, cornija: 0x7a7060, mat: MAT().pedra, pilastras: 3 });
  for (let z = -6; z <= 6; z += 3) for (const s of [-1, 1]) { cil(b, MM.marmore, 0.55, 0.35, s * 3.8, 0, z, 0xd8d2c4, 14); cil(b, MM.marmore, 0.55, 0.3, s * 3.8, H - 0.3, z, 0xd8d2c4, 14, 0.42); }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) vitral(b, s * (W / 2 - 0.04), 3.8, -5 + k * 5, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1.0, 2.6, ['#2a8a9a', '#1a5a7a', '#c8a040', '#3aa8a8', '#e8d8a0'], 'mar', 0x3a9ab0);
  for (let i = 0; i < 9; i++) vela(B, b, -1.6 + i * 0.4, 0.8, -D / 2 + 2.9);
  for (let i = 0; i < 10; i++) { const x = (rnd() - 0.5) * 2.6; cil(b, MAT().plain, 0.07, 0.12, x, 0.8, -D / 2 + 2.4, pick3([0xd8b048, 0x8a6a4a, 0x9ad8e8]), 8); } // oferendas
}
function zolkanMais(b: M4) {
  const W = 16, D = 14, H = 7;
  acabamento(b, W, D, H, { lambri: 0x3a2018, alt: 1.3, cornija: 0x2a1810, pilastras: 3.2 });
  for (const s of [-1, 1]) estante(B, b, s * (W / 2 - 0.4), -4.5, s > 0 ? -Math.PI / 2 : Math.PI / 2, 2.4, 3.0);
  for (let i = 0; i < 8; i++) teia(b, (i % 2 ? 1 : -1) * (W / 2 - 0.06), H - 0.05 - (i > 3 ? 3.2 : 0), (i < 4 ? -1 : 1) * (D / 2 - 0.06) * (i % 3 ? 1 : 0.3), (i % 2 ? -1 : 1) * Math.PI / 2 * (i % 2 ? 1 : 0), 1.0);
  { const M = MAT(), p = peca(B, b, 0, 0, -D / 2 + 0.06, 0); p.cx(M.madeira, 1.4, 2.2, 0.08, 0, 4.6, 0, 0x3a2418); p.cx(MAT().ferro, 1.2, 2.0, 0.02, 0, 4.6, 0.05, 0x8a9aa8); for (let k = 0; k < 5; k++) p.cx(M.escuro, 0.02, 0.6 + rnd() * 0.6, 0.01, -0.4 + k * 0.2, 4.6, 0.07, 0x101010, (rnd() - 0.5) * 1.2); } // espelho rachado
  for (let i = 0; i < 6; i++) arandela(b, (i % 2 ? 1 : -1) * (W / 2 - 0.06), 2.4, -5 + Math.floor(i / 2) * 4, (i % 2 ? -1 : 1) * Math.PI / 2, 5);
}

// ---------------- cenas ----------------
function ancora(b: M4, G: THREE.Group) {
  const M = MAT(), W = 14, D = 10, H = 3.6, n = 'Âncora Quebrada (dentro)';
  sala(n, b, W, D, H, { parede: M.tabuas, cp: 0xc0a888, chao: M.piso, cc: 0xc8b090, janelas: 2 });
  balcao(B, b, -3.2, -3.0, 0, 5.2); prateleira(B, b, -3.2, -4.8, 0, 4.4, 1.3, 'garrafas'); prateleira(B, b, -3.2, -4.8, 0, 4.4, 2.0, 'garrafas');
  for (let i = 0; i < 3; i++) barril(B, b, -6.3 + i * 0.75, -4.4, 0, false, 1); barril(B, b, -6.1, -3.3, 0, true, 1); barril(B, b, -6.1, -3.3, 0.55, true, 0.9);
  lareira(B, b, 6.65, -1.2, -Math.PI / 2, 0, 2.2); luz(b, 6.1, 0.6, -1.2, 0xff8a3a, 40, 10, 2.4); brasas.push(v3(b, 6.35, 0.35, -1.2));
  poeiras.push(new THREE.Box3(v3(b, -W / 2 + 0.5, 0.3, -D / 2 + 0.5), v3(b, W / 2 - 0.5, H - 0.4, D / 2 - 0.5)));
  const mesas: [number, number][] = [[-1.8, 1.6], [1.6, 2.6], [4.1, 0.6], [-4.6, 2.9], [1.0, -1.0]];
  mesas.forEach(([x, z], i) => { mesa(B, b, x, z, i * 0.4, 1.4, 0.8); for (const [dx, dz] of [[0.6, 0.7], [-0.6, 0.7], [0.6, -0.7], [-0.6, -0.7]]) banqueta(B, b, x + dx, z + dz); vela(B, b, x, 0.8, z); servico(B, b, x + 0.3, 0.8, z + 0.1); luz(b, x, 1.0, z, 0xffa050, 6, 4); });
  // a âncora quebrada na parede do fundo
  { const p = peca(B, b, 3.0, 1.6, -4.85, 0); p.cx(M.ferro, 0.14, 2.2, 0.1, 0, 0, 0); p.cx(M.ferro, 1.2, 0.12, 0.1, 0, 0.85, 0); const a = new THREE.TorusGeometry(0.75, 0.08, 6, 16, Math.PI * 0.62); a.rotateZ(Math.PI * 1.19); a.translate(0, -0.75, 0); por(B, M.ferro, a, 0xffffff, p.m); p.cil(M.ferro, 0.12, 0.08, 0, 1.15, 0, 0xffffff, 12); const t = new THREE.TorusGeometry(0.2, 0.05, 6, 12); t.translate(0, 1.32, 0); por(B, M.ferro, t, 0xffffff, p.m); }
  for (let i = 0; i < 3; i++) box(b, M.tecido, 1.6, 1.0, 0.02, -0.2 + i * 1.7, 2.2, -4.84, 0x5a5040, 0, (i - 1) * 0.1); // redes
  for (let i = 0; i < 11; i++) box(b, M.tabuas, 0.9, 0.12, 0.32, -6.4, 0.18 + i * 0.32, 3.4 - i * 0.32, 0x8a6a4a); // escada
  lustre(B, b, 0, 2.6, 0.6, 0.8); luz(b, 0, 2.7, 0.6, 0xffb060, 22, 9);
  tapete(B, b, 1.5, 3.6, 0, 3, 1.6); caixote(B, b, 5.5, 4.0); sacos(B, b, 6.0, 3.2, 3);
  vista(n, b, [5.6, 1.75, 4.2], [-2.6, 1.0, -2.6]);
  void G;
}
function macacoCaolho(b: M4, G: THREE.Group) {
  const M = MAT(), W = 16, D = 12, H = 4, n = 'Estalagem do Macaco Caolho';
  sala(n, b, W, D, H, { parede: M.reboco, cp: 0xe0d0b0, chao: M.piso, cc: 0xc0a080, janelas: 3 });
  for (let x = -W / 2 + 0.5; x < W / 2; x += 2.6) box(b, M.madeira, 0.18, H, 0.18, x, H / 2, -D / 2 + 0.1, 0x4a3424); // enxaimel
  // palco com cortinas
  box(b, M.tabuas, 5.5, 0.5, 2.6, 2, 0.25, -4.6, 0x8a6040); for (const s of [-1, 1]) box(b, M.tecido, 0.8, 3.2, 0.1, 2 + s * 2.8, 1.9, -3.4, 0x8a1a1a, 0, s * 0.05);
  box(b, M.tecido, 6.4, 0.6, 0.1, 2, 3.5, -3.4, 0x8a1a1a); cadeira(B, b, 2, -4.8, 0, 0.5); luz(b, 2, 3.2, -3.6, 0xffd090, 26, 8, 1.6);
  balcao(B, b, -6.6, -1, Math.PI / 2, 6); prateleira(B, b, -7.75, -1, Math.PI / 2, 5, 1.5, 'garrafas'); for (let i = 0; i < 4; i++) barril(B, b, -7.2, 3 + i * 0.75, 0, false, 1);
  for (let i = 0; i < 7; i++) { const x = -3 + (i % 4) * 2.6, z = 0.5 + Math.floor(i / 4) * 2.8; mesa(B, b, x, z, rnd(), 1.3, 0.8); for (let k = 0; k < 3; k++) banqueta(B, b, x + Math.cos(k * 2.1) * 0.9, z + Math.sin(k * 2.1) * 0.7); servico(B, b, x, 0.8, z); vela(B, b, x + 0.3, 0.8, z - 0.2); luz(b, x, 1.2, z, 0xffa050, 6, 4); }
  // cartazes da Feira de Marah, Arena de Gideon e Circo dos Irmãos Thiannate
  const cartazes: [string, string, string, string][] = [['GRANDE FEIRA', 'DE MARAH', '#c8302a', '#f0d040'], ['ARENA DE', 'GIDEON', '#2a2a2a', '#e8c040'], ['CIRCO DOS IRMÃOS', 'THIANNATE', '#2a5aa8', '#f4e8d0']];
  cartazes.forEach(([a, c2, fundo, letra], i) => G.add(cartaz(b, 7.84, 1.9, -3 + i * 2.3, -Math.PI / 2, 1.4, 1.9, (g, Wc, Hc) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, Wc, Hc); g.fillStyle = fundo; g.fillRect(12, 12, Wc - 24, Hc - 24); g.fillStyle = letra; g.textAlign = 'center'; g.font = 'bold 26px Georgia'; g.fillText(a, Wc / 2, 70); g.font = 'bold 36px Georgia'; g.fillText(c2, Wc / 2, 115); g.strokeStyle = letra; g.lineWidth = 4; g.beginPath(); g.arc(Wc / 2, 210, 50, 0, 6.3); g.stroke(); for (let k = 0; k < 8; k++) { const an = (k / 8) * 6.28; g.beginPath(); g.moveTo(Wc / 2 + Math.cos(an) * 56, 210 + Math.sin(an) * 56); g.lineTo(Wc / 2 + Math.cos(an) * 80, 210 + Math.sin(an) * 80); g.stroke(); } })));
  // placa do macaco caolho sobre o balcão
  G.add(cartaz(b, -7.82, 2.9, -1, Math.PI / 2, 2.2, 1.1, (g, Wc, Hc) => { g.fillStyle = '#5a3a20'; g.fillRect(0, 0, Wc, Hc); g.fillStyle = '#e8d8b0'; g.font = 'bold 20px Georgia'; g.textAlign = 'center'; g.fillText('ESTALAGEM DO', Wc / 2, 26); g.fillText('MACACO CAOLHO', Wc / 2, Hc - 12); g.fillStyle = '#a06a3a'; g.beginPath(); g.arc(Wc / 2, Hc / 2 + 2, 28, 0, 6.3); g.fill(); g.fillStyle = '#e8c8a0'; g.beginPath(); g.ellipse(Wc / 2, Hc / 2 + 10, 18, 13, 0, 0, 6.3); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(Wc / 2 + 10, Hc / 2 - 6, 4, 0, 6.3); g.fill(); g.fillRect(Wc / 2 - 20, Hc / 2 - 12, 18, 10); g.fillRect(Wc / 2 - 30, Hc / 2 - 9, 60, 3); }));
  // maquete de navio na prateleira
  { const p = peca(B, b, 5.5, 2.0, -5.7, 0.3); p.cx(M.madeira, 1.4, 0.2, 0.4, 0, 0, 0, 0x4a3020); p.cx(M.madeira, 0.03, 0.9, 0.03, 0, 0.5, 0, 0x3a2418); p.cx(M.tecido, 0.6, 0.5, 0.02, 0, 0.55, 0.02, 0x101010); box(b, M.madeira, 2, 0.06, 0.4, 5.5, 1.88, -5.75, 0x4a3424); }
  lustre(B, b, -1, 3.0, 1.2, 0.9); lustre(B, b, 4, 3.0, 1.2, 0.9); luz(b, -1, 3.1, 1.2, 0xffb060, 20, 9); luz(b, 4, 3.1, 1.2, 0xffb060, 20, 9);
  vista(n, b, [6.8, 1.75, 5.2], [-1.5, 1.2, -2.5]); poeiras.push(new THREE.Box3(v3(b, -W / 2 + 0.5, 0.3, -D / 2 + 0.5), v3(b, W / 2 - 0.5, H - 0.4, D / 2 - 0.5)));
}
function asidon(b: M4) {
  const M = MAT(), W = 22, D = 12, H = 7, n = 'Salão de Asidon';
  sala(n, b, W, D, H, { parede: M.pedra, cp: 0xe0d8cc, chao: M.lajota, cc: 0xd8d0c0, teto: M.madeira, ct: 0x7a6450, janelas: 0, porta: true });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) tocha(b, -6 + k * 6, 2.4, s * (D / 2 - 0.15), s > 0 ? Math.PI : 0);
  for (let x = -W / 2 + 2; x < W / 2; x += 3) for (const s of [-1, 1]) { cil(b, M.pedra, 0.38, H, x, 0, s * (D / 2 - 1.2), 0xb0a898, 12); }
  for (let i = 0; i < 6; i++) { const x = -8 + i * 3.2; box(b, M.escuro, 0.35, 2.4, 0.05, x, 4.2, -D / 2 + 0.02); }  // seteiras
  box(b, M.pedra, 6.4, 0.45, 2.6, 0, 0.22, -D / 2 + 1.4, 0xa09888); // estrado
  { const p = peca(B, b, 0, 0.45, -D / 2 + 1.2, 0); p.cx(M.madeira, 1.1, 0.12, 0.9, 0, 0.5, 0, 0x4a2a1a); p.cx(M.madeira, 1.1, 2.4, 0.15, 0, 1.6, -0.4, 0x4a2a1a); p.cx(M.tecido, 0.85, 0.08, 0.7, 0, 0.6, 0.05, 0x8a1a1a); p.cx(M.tecido, 0.8, 1.6, 0.04, 0, 1.4, -0.3, 0x8a1a1a); for (const s of [-1, 1]) { p.cx(M.madeira, 0.12, 0.7, 0.85, s * 0.55, 0.85, 0, 0x4a2a1a); p.esf(MAT().ferro, 0.12, s * 0.55, 2.85, -0.4, 0xd8b048); } }
  tapecaria(B, b, 0, 4.6, -D / 2 + 0.08, 0, 2.4, 3.6, 0x8a1a1a); for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; tapecaria(B, b, x, 3.8, D / 2 - 0.1, Math.PI, 1.3, 2.6, [0x1a2a6a, 0x8a1a1a, 0xc8a030][i % 3]); }
  for (let i = 0; i < 3; i++) { const x = -4 + i * 4; mesa(B, b, x, 0.5, 0, 3.8, 1.1); for (const s of [-1, 1]) banco(B, b, x, 0.5 + s * 1.0, 0, 3.4); for (let k = 0; k < 4; k++) servico(B, b, x - 1.4 + k * 0.9, 0.8, 0.5 + (k % 2 ? 0.3 : -0.3)); vela(B, b, x, 0.8, 0.5); }
  for (const x of [-9.5, -7.5, 7.5, 9.5]) armadura(B, b, x, -D / 2 + 0.7); cavalete(B, b, -10.2, 2, Math.PI / 2); cavalete(B, b, -10.2, 4, Math.PI / 2);
  lareira(B, b, W / 2 - 0.4, 2, -Math.PI / 2, 0, 2.8); luz(b, W / 2 - 1, 0.7, 2, 0xff8a3a, 45, 12, 3); brasas.push(v3(b, W / 2 - 0.7, 0.35, 2));
  poeiras.push(new THREE.Box3(v3(b, -W / 2 + 0.5, 0.3, -D / 2 + 0.5), v3(b, W / 2 - 0.5, H - 1, D / 2 - 0.5)));
  for (const x of [-7, 0, 7]) { lustre(B, b, x, 4.6, 0.5, 1.1); luz(b, x, 4.7, 0.5, 0xffb060, 42, 14, 1.4); }
  tapete(B, b, 0, 3.8, Math.PI / 2, 2.2, 5);
  vista(n, b, [0, 2.2, D / 2 - 0.8], [0, 1.6, -D / 2 + 1.2], 66);
}
function masmorra(b: M4) {
  const M = MAT(), W = 20, D = 16, H = 4, n = 'Masmorra de Azazel';
  sala(n, b, W, D, H, { parede: M.pedra, cp: 0x8a847a, chao: M.lajota, cc: 0x7a746a, teto: M.pedra, ct: 0x5a5650, vigas: false, janelas: 0, porta: false });
  // corredor central com celas dos dois lados
  for (const s of [-1, 1]) {
    for (let c = 0; c < 3; c++) {
      const z = 3.5 - c * 4.2, x0 = s * 2.2, x1 = s * (W / 2);
      box(b, M.pedra, Math.abs(x1 - x0), H, 0.4, (x0 + x1) / 2, H / 2, z + 2.1, 0x8a847a); solido(b, Math.abs(x1 - x0), H, 0.4, (x0 + x1) / 2, 0, z + 2.1);
      for (let k = 0; k < 9; k++) cil(b, M.ferro, 0.03, H, x0, 0, z - 1.8 + k * 0.45, 0xffffff, 6);
      box(b, M.ferro, 0.08, 0.08, 4, x0, H - 0.4, z, 0xffffff); box(b, M.ferro, 0.08, 0.08, 4, x0, 0.3, z, 0xffffff);
      box(b, MM.palha, 2.2, 0.15, 1.2, s * 6.5, 0.07, z - 0.6, 0x8a7a4a); // palha
      for (let k = 0; k < 2; k++) { box(b, M.ferro, 0.05, 1.2, 0.05, s * (W / 2 - 0.2), 1.6, z - 0.8 + k * 1.2); const a = new THREE.TorusGeometry(0.12, 0.025, 4, 10); a.translate(s * (W / 2 - 0.2), 1.0, z - 0.8 + k * 1.2); geo(b, M.ferro, a); }
      if ((c + (s > 0 ? 1 : 0)) % 2) { for (let k = 0; k < 6; k++) cil(b, M.plain, 0.03, 0.35, s * 5.2 + (rnd() - 0.5), 0.02, z + (rnd() - 0.5), 0xd8d0b8, 5); }
    }
    for (let k = 0; k < 3; k++) tocha(b, s * 2.0, 1.9, 2.3 - k * 4.2, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  // câmara do ritual no fundo
  const ring = new THREE.TorusGeometry(2.2, 0.06, 6, 48); ring.rotateX(Math.PI / 2); ring.translate(0, 0.03, -6); geo(b, MM.rubro, ring);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; box(b, MM.rubro, 0.25, 0.02, 0.08, Math.cos(a) * 1.7, 0.03, -6 + Math.sin(a) * 1.7, 0xffffff, -a); }
  box(b, M.pedra, 2.0, 0.9, 1.0, 0, 0.45, -7.2, 0x3a3634); vela(B, b, -0.7, 0.9, -7.2); vela(B, b, 0.7, 0.9, -7.2);
  box(b, M.pedra, 0.9, 0.6, 2.2, 4, 0.3, -6.5, 0x5a5650); box(b, M.pedra, 1.0, 0.15, 2.3, 4.05, 0.68, -6.5, 0x4a4644, 0, 0.12); // sarcófago
  luz(b, 0, 0.6, -6, 0xff3020, 28, 9, 2.5);
  // escada subindo para a porta de saída
  for (let i = 0; i < 8; i++) box(b, M.pedra, 2.2, 0.2, 0.35, 0, 0.1 + i * 0.22, D / 2 - 0.2 - i * 0.35, 0x7a746a);
  box(b, M.escuro, 1.4, 2.2, 0.05, 0, 2.9, D / 2 - 0.05);
  vista(n, b, [0, 2.4, D / 2 - 1.6], [0, 0.6, -5.5], 66);
}
function cavernaGelo(b: M4) {
  const n = 'Caverna Congelada (dentro)', gm = new THREE.MeshStandardMaterial({ color: 0x9cc8e0, roughness: 0.18, metalness: 0, envMapIntensity: 1.3, emissive: 0x0c2638, side: THREE.BackSide });
  gruta(n, b, 14, 6.5, 11, gm, MM.neve, 0xeef4ff, 3);
  const ic = MM.gelo as THREE.Material;
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = 3 + rnd() * 7, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.75, h = 0.6 + rnd() * 2.4; const c = new THREE.ConeGeometry(0.2 + rnd() * 0.35, h, 6); c.translate(x, h / 2, z); geo(b, ic, c); }
  // cascata congelada no fundo
  for (let k = 0; k < 9; k++) { const c = new THREE.CylinderGeometry(0.5 + 0.15 * Math.sin(k), 0.6 + 0.15 * Math.cos(k), 0.75, 10); c.translate(Math.sin(k * 1.7) * 0.25, 0.37 + k * 0.7, -9.2 + k * 0.08); geo(b, ic, c); }
  // mamute preso no gelo
  { const p = peca(B, b, 5, 0, -3, -0.6), c = 0x4a3020; p.esf(MAT().plain, 1.2, 0, 1.9, 0, c, 0.85); p.esf(MAT().plain, 0.6, 0, 2.3, 1.3, c); for (const s of [-1, 1]) { p.cil(MAT().plain, 0.28, 1.4, s * 0.55, 0, 0.7, c, 8); p.cil(MAT().plain, 0.28, 1.4, s * 0.55, 0, -0.7, c, 8); const t = new THREE.TorusGeometry(0.7, 0.07, 6, 12, Math.PI * 0.8); t.rotateY(Math.PI / 2); t.translate(s * 0.35, 1.6, 1.8); por(B, MAT().plain, t, 0xf0e8d8, p.m); }
    p.cx(ic, 3.6, 3.6, 4.2, 0, 1.8, 0.2); }
  comLote(B, () => { for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = 4 + rnd() * 7; const w = v3(b, Math.cos(a) * r, 0, Math.sin(a) * r * 0.7); cristaisAzuis(w.x, w.y, w.z); } });
  luz(b, 0, 3, 0, 0x8fd0ff, 30, 16, 3); luz(b, 0, 1.5, -8, 0xa0e0ff, 22, 10, 2); luz(b, 5, 2, -3, 0x8fd0ff, 14, 8);
  vista(n, b, [0, 1.8, 9.2], [1, 1.6, -4], 66);
}
function cristaisAzuis(x: number, y: number, z: number) { for (let i = 0; i < 6; i++) { const h = 0.3 + rnd() * 0.9, g = new THREE.ConeGeometry(0.06 + rnd() * 0.08, h, 5); g.translate(0, h / 2, 0); g.rotateZ((rnd() - 0.5) * 0.9); g.rotateX((rnd() - 0.5) * 0.9); g.translate(x + (rnd() - 0.5) * 0.4, y, z + (rnd() - 0.5) * 0.4); por(B, MM.gelado, g, 0xffffff); } }
function covil(b: M4) {
  const n = 'Covil de Beluhga (dentro)', gm = new THREE.MeshStandardMaterial({ color: 0x8ab8d4, roughness: 0.22, envMapIntensity: 1.2, emissive: 0x0a2232, side: THREE.BackSide });
  gruta(n, b, 24, 12, 20, gm, MM.neve, 0xe8f0fc, 8);
  // tesouro: monte de ouro, moedas, baús, taças e gemas
  const ouro = MM.ouro; { const g = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(6, 1.6, 4.5); g.translate(0, 0, -6); geo(b, ouro, g, 0xe0b040); }
  for (let i = 0; i < 260; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()), x = Math.cos(a) * r * 6.5, z = -6 + Math.sin(a) * r * 5, y = Math.max(0, 1.6 * Math.sqrt(Math.max(0, 1 - (x / 6) ** 2 - ((z + 6) / 4.5) ** 2))); const c = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8); c.rotateX((rnd() - 0.5) * 1.5); c.translate(x, y + 0.02, z); geo(b, ouro, c, 0xf0c050); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28, x = Math.cos(a) * 5, z = -6 + Math.sin(a) * 3.6; bau(B, b, x, z, -a); }
  for (let i = 0; i < 18; i++) { const x = (rnd() - 0.5) * 9, z = -6 + (rnd() - 0.5) * 6, g = new THREE.IcosahedronGeometry(0.12, 0); g.translate(x, 0.8 + rnd() * 0.6, z); geo(b, [MM.rubro, MM.gelado, MM.verdeBruxa, MM.magia][i % 4], g); }
  // ossadas de quem tentou
  for (let i = 0; i < 9; i++) { const x = (rnd() - 0.5) * 30, z = (rnd() - 0.5) * 24; if (Math.hypot(x, z + 6) < 8) continue; const c = new THREE.CylinderGeometry(0.12, 0.12, 2 + rnd() * 3, 6); c.rotateZ(1.3 + rnd() * 0.5); c.rotateY(rnd() * 6); c.translate(x, 0.3, z); geo(b, MAT().plain, c, 0xd8d4c8); }
  for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = 10 + rnd() * 10; const c = new THREE.CylinderGeometry(0.6 + rnd() * 0.6, 1 + rnd() * 0.8, 9 + rnd() * 4, 8); c.translate(Math.cos(a) * r, 5, Math.sin(a) * r * 0.8); geo(b, MM.gelo as THREE.Material, c); }
  // a Rainha Dragoa sobre o tesouro
  const w = v3(b, 0, 1.2, -6.5); comLote(B, () => dragao(w.x, w.y, w.z, Math.PI * 0.9, 4.2));
  { const md = mtx(w.x, w.y, w.z, Math.PI * 0.9, 4.2); for (const s of [-1, 1]) { const o = new THREE.SphereGeometry(0.035, 8, 6); o.translate(s * 0.08, 2.03, 1.42); o.applyMatrix4(md); por(B, MM.gelado, o, 0xffffff); }
    const cab = new THREE.Vector3(0, 2.0, 1.5).applyMatrix4(md); luzes.push({ x: cab.x, y: cab.y, z: cab.z, cor: 0x9fe8ff, n: 14, dist: 7 }); halos.push([cab.x, cab.y, cab.z, 2.2]); }
  luz(b, 0, 9, 0, 0x9fdcff, 60, 30, 6); luz(b, 0, 3, -6, 0xffd070, 30, 12, 3); luz(b, -12, 4, 6, 0x8fd0ff, 20, 14);
  vista(n, b, [0, 3.2, 17], [0, 4, -6], 64);
}
function catedral(b: M4) {
  const W = 12, D = 30, H = 14, n = 'Catedral de Gelo (dentro)', ic = MM.gelo as THREE.Material, M = MAT();
  const pm = new THREE.MeshStandardMaterial({ color: 0xbfe6f8, roughness: 0.12, envMapIntensity: 1.4, emissive: 0x0c2a3c });
  sala(n, b, W, D, H, { parede: pm, cp: 0xffffff, chao: M.lajota, cc: 0xc8e4f4, teto: pm, ct: 0xffffff, vigas: false, janelas: 0, porta: false });
  for (let z = -D / 2 + 3; z < D / 2 - 2; z += 4) for (const s of [-1, 1]) { cil(b, ic, 0.55, H - 1, s * 3.6, 0, z, 0xffffff, 12); geo(b, ic, new THREE.TorusGeometry(2, 0.18, 6, 16, Math.PI).rotateY(Math.PI / 2).translate(s * 3.6, H - 3, z + 2)); }
  for (let z = -D / 2 + 3; z < D / 2 - 2; z += 4) { const a = new THREE.TorusGeometry(3.6, 0.2, 6, 20, Math.PI); a.translate(0, H - 3, z); geo(b, ic, a); }
  for (let i = 0; i < 8; i++) { bancoTemplo(B, b, -1.9, 8 - i * 2, 0, 3); bancoTemplo(B, b, 1.9, 8 - i * 2, 0, 3); }
  for (let i = 0; i < 3; i++) box(b, ic, 6 - i, 0.3, 2.5 - i * 0.5, 0, 0.15 + i * 0.3, -D / 2 + 3, 0xffffff);
  box(b, ic, 2.6, 1.1, 1.0, 0, 1.45, -D / 2 + 3, 0xffffff); for (const s of [-0.9, 0.9]) { const c = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6); c.translate(s, 2.15, -D / 2 + 3); geo(b, MM.gelado, c); }
  const rosa = new THREE.CircleGeometry(2.6, 24); rosa.translate(0, H - 4, -D / 2 + 0.02); geo(b, MM.gelado, rosa);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) box(b, MM.gelado, 0.8, 4, 0.05, s * (W / 2 - 0.02), 6, -10 + k * 6, 0xffffff, Math.PI / 2);
  // escadaria descendo para as profundezas (fundo, à esquerda)
  box(b, M.escuro, 2.4, 0.02, 4, -4.3, 0.01, -9); for (let i = 0; i < 6; i++) box(b, ic, 2.2, 0.2, 0.6, -4.3, -0.15 - i * 0.3, -7.3 - i * 0.6, 0xffffff);
  for (let z = -10; z <= 10; z += 10) { const p = new THREE.Vector3(0, H - 2, z); for (let k = 0; k < 12; k++) { const c = new THREE.ConeGeometry(0.08, 0.9 + rnd(), 5); c.rotateX(Math.PI); c.translate(p.x + Math.cos(k) * 0.9, p.y - 0.4, p.z + Math.sin(k) * 0.9); geo(b, ic, c); } luz(b, 0, H - 3, z, 0xbfe8ff, 26, 16, 2.5); }
  luz(b, 0, 2.6, -D / 2 + 3.5, 0xd8f4ff, 22, 10, 1.6); poeiras.push(new THREE.Box3(v3(b, -W / 2 + 1, 0.5, -D / 2 + 1), v3(b, W / 2 - 1, 9, D / 2 - 1)));
  vista(n, b, [0, 2, D / 2 - 1.5], [0, 4.5, -D / 2 + 2], 64);
}
function covariel(b: M4, G: THREE.Group) {
  const M = MAT(), R = 5, H = 5, n = 'Torre de Covariel (dentro)';
  for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283; box(b, M.muro, 1.85, H, 0.4, Math.cos(a) * (R + 0.2), H / 2, Math.sin(a) * (R + 0.2), 0xb8b0a0, Math.PI / 2 - a); solido(b, 1.85, H, 0.4, Math.cos(a) * (R + 0.2), 0, Math.sin(a) * (R + 0.2), Math.PI / 2 - a); }
  const ch = new THREE.CircleGeometry(R + 0.3, 36); ch.rotateX(-Math.PI / 2); geo(b, M.piso, ch, 0xb89a78); const tt = new THREE.CircleGeometry(R + 0.3, 36); tt.rotateX(Math.PI / 2); tt.translate(0, H, 0); geo(b, M.madeira, tt, 0x5a4434);
  piso(b, R * 2, R * 2); contorno(n, b, R * 2, R * 2);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.4, x = Math.cos(a) * (R - 0.35), z = Math.sin(a) * (R - 0.35); estante(B, b, x, z, -a - Math.PI / 2, 1.5, 2.6); }
  mesa(B, b, -1.6, -1.4, 0.4, 1.8, 0.9); prateleira(B, b, -1.6, -1.4, 0.4, 1.4, 0.82, 'potes');
  for (let i = 0; i < 6; i++) { const g = new THREE.SphereGeometry(0.07, 8, 6); g.translate(-2.2 + i * 0.22, 0.88, -1.2); geo(b, [MM.magia, MM.verdeBruxa, MM.gelado][i % 3], g); }
  const circ = new THREE.Group(); circ.position.copy(v3(b, -0.8, 0.02, 1.0)); G.add(circ);
  { const a1 = new THREE.TorusGeometry(1.5, 0.04, 6, 48), a2 = new THREE.TorusGeometry(1.1, 0.025, 6, 48); a1.rotateX(Math.PI / 2); a2.rotateX(Math.PI / 2); const ma = new THREE.Mesh(a1, MM.magia), mb = new THREE.Mesh(a2, MM.magia); ma.userData.ns = mb.userData.ns = 1; circ.add(ma, mb);
    const runas: THREE.BufferGeometry[] = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28, r = new THREE.BoxGeometry(0.18, 0.01, 0.06); r.rotateY(-a); r.translate(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3); runas.push(r); }
    const mr = new THREE.Mesh(mergeGeometries(runas)!, MM.magia); mr.userData.ns = 1; circ.add(mr); anim.push(t => { circ.rotation.y = t * 0.25; mb.rotation.y = -t * 0.6; }); }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; box(b, MM.magia, 0.18, 0.01, 0.06, -0.8 + Math.cos(a) * 1.3, 0.02, 1.0 + Math.sin(a) * 1.3, 0xffffff, -a); }
  { const orbe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), MM.magia), p0 = v3(b, -0.8, 1.4, 1.0); orbe.position.copy(p0); orbe.userData.ns = 1; G.add(orbe); anim.push(t => { orbe.position.y = p0.y + Math.sin(t * 1.3) * 0.18; const s = 1 + Math.sin(t * 2.1) * 0.06; orbe.scale.setScalar(s); }); }
  luz(b, -0.8, 1.4, 1.0, 0x9a7cff, 24, 8, 2); poeiras.push(new THREE.Box3(v3(b, -4, 0.3, -4), v3(b, 4, 4.5, 4)));
  // luneta junto à janela
  { const p = peca(B, b, -3.2, 0, -2.6, 0.7); for (let k = 0; k < 3; k++) p.cx(M.madeira, 0.04, 1.3, 0.04, Math.cos(k * 2.1) * 0.3, 0.6, Math.sin(k * 2.1) * 0.3, 0x4a3424, Math.cos(k * 2.1) * 0.2, Math.sin(k * 2.1) * 0.2); const t = new THREE.CylinderGeometry(0.06, 0.1, 1.4, 10); t.rotateX(-1.1); t.translate(0, 1.5, -0.2); por(B, MAT().ferro, t, 0xc8a050, p.m); }
  box(b, janelaM, 0.9, 1.3, 0.1, -3.4, 2.3, -3.6, 0xffffff, 0.75);
  // escada em caracol até o alçapão
  cil(b, M.pedra, 0.3, H, 2.6, 0, -2.4, 0x8a8478, 10);
  for (let i = 0; i < 14; i++) { const a = i * 0.45, g = new THREE.BoxGeometry(1.1, 0.12, 0.4); g.translate(0.75, 0, 0); g.rotateY(-a); g.translate(2.6, 0.3 + i * 0.33, -2.4); geo(b, M.madeira, g, 0x6a5038); }
  for (let i = 0; i < 5; i++) vela(B, b, -2.5 + i * 0.4, 0.82, 3.2 - i * 0.1);
  luz(b, -1.6, 1.4, -1.4, 0xffb060, 16, 6); luz(b, 2.6, 3.6, -2.4, 0xffb060, 10, 5);
  vista(n, b, [2.6, 1.9, 3.3], [-0.8, 0.9, -0.6], 72);
}
function gilukSalao(b: M4) {
  const M = MAT(), W = 9, D = 24, H = 3.2, n = 'Salão de Giluk';
  sala(n, b, W, D, H, { parede: M.madeira, cp: 0x8a6a4a, chao: M.terra, cc: 0x8a7a68, teto: M.madeira, ct: 0x5a4434, vigas: false, janelas: 0 });
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(W * 0.62, 0.15, D); g.rotateZ(s * 0.6); g.translate(s * W * 0.25, H + 1.5, 0); geo(b, M.madeira, g, 0x5a4434); }
  box(b, M.pedra, 1.6, 0.3, 14, 0, 0.15, 0, 0x6a6660); box(b, MM.aceso, 1.0, 0.06, 13, 0, 0.31, 0, 0xffffff);
  for (let i = 0; i < 12; i++) { const f = new THREE.ConeGeometry(0.22, 0.6 + rnd() * 0.5, 6); f.translate((rnd() - 0.5) * 0.6, 0.6, -6 + i * 1.1); geo(b, MAT().aceso, f); }
  for (let i = 0; i < 4; i++) { luz(b, 0, 1.0, -5 + i * 3.4, 0xff7a2a, 30, 9, 2); brasas.push(v3(b, 0, 0.4, -5.5 + i * 3.4), v3(b, 0.2, 0.4, -4 + i * 3.4)); }
  poeiras.push(new THREE.Box3(v3(b, -W / 2 + 0.5, 0.4, -D / 2 + 0.5), v3(b, W / 2 - 0.5, H + 1, D / 2 - 0.5)));
  for (let z = -10; z <= 10; z += 4) for (const s of [-1, 1]) { cil(b, M.madeira, 0.22, H + 1.5, s * 3.2, 0, z, 0x6a4a30, 8); const c = new THREE.ConeGeometry(0.22, 0.6, 6); c.rotateZ(s * 1.2); c.translate(s * 3.0, H + 1.2, z); geo(b, M.madeira, c, 0x6a4a30); }
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { mesa(B, b, s * 2.0, -6 + k * 5, 0, 3.6, 0.9); banco(B, b, s * 2.7, -6 + k * 5, 0, 3.4); for (let q = 0; q < 3; q++) servico(B, b, s * 2.0, 0.8, -7 + k * 5 + q * 1.1); } }
  for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1, z = -10 + Math.floor(i / 2) * 5; const g = new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16); g.rotateZ(Math.PI / 2); g.translate(s * (W / 2 - 0.04), 2.0, z); geo(b, M.madeira, g, [0x7a1a1a, 0x1a3a6a, 0x6a6a2a][i % 3]); }
  for (let i = 0; i < 4; i++) { const z = -9 + i * 6; for (let k = 0; k < 4; k++) box(b, M.plain, 0.05, 0.6, 0.05, (k - 1.5) * 0.25, 2.7, -D / 2 + 0.1, 0xd8c8a8, 0, (k - 1.5) * 0.4); void z; }
  box(b, M.madeira, 4, 0.5, 2.5, 0, 0.25, -D / 2 + 1.5, 0x5a4030); { const p = peca(B, b, 0, 0.5, -D / 2 + 1.2, 0); p.cx(M.madeira, 1.4, 0.15, 1.0, 0, 0.5, 0, 0x4a3020); p.cx(M.madeira, 1.6, 2.2, 0.2, 0, 1.4, -0.45, 0x4a3020); p.cx(M.tecido, 1.3, 0.1, 0.9, 0, 0.6, 0.05, 0xe8e0d0); }
  tapete(B, b, -2, 8, 0, 2, 1.4); tapete(B, b, 2, 8, 0, 2, 1.4);
  vista(n, b, [1.4, 1.8, D / 2 - 1], [0, 1.2, -D / 2 + 2], 64);
}
function bruxa(b: M4) {
  const M = MAT(), W = 6, D = 5, H = 2.8, n = 'Cabana da Bruxa (dentro)';
  sala(n, b, W, D, H, { parede: M.tabuas, cp: 0x6a5a48, chao: M.piso, cc: 0x7a6a58, janelas: 1 });
  bolhas.push(v3(b, 0, 0.62, -0.6));
  caldeirao(B, b, 0, -0.6); const sopa = new THREE.CircleGeometry(0.42, 16); sopa.rotateX(-Math.PI / 2); sopa.translate(0, 0.62, -0.6); geo(b, MM.verdeBruxa, sopa); luz(b, 0, 0.9, -0.6, 0x7aff5a, 18, 6, 1.6);
  prateleira(B, b, -1.6, -2.35, 0, 2.2, 1.2, 'potes'); prateleira(B, b, -1.6, -2.35, 0, 2.2, 1.8, 'ervas'); prateleira(B, b, 2.85, 0.2, -Math.PI / 2, 2, 1.5, 'potes');
  for (let i = 0; i < 12; i++) { const x = -2.4 + (i % 6) * 0.9, z = -1.4 + Math.floor(i / 6) * 1.8; box(b, MM.palha, 0.12, 0.5, 0.12, x, H - 0.35, z, [0x5a6a30, 0x7a6a3a, 0x4a5a2a][i % 3]); }
  for (let i = 0; i < 4; i++) { const p = peca(B, b, -2.3 + i * 0.4, 1.95, -2.35); p.esf(M.plain, 0.1, 0, 0, 0, 0xe8e0c8, 1.1); p.cx(M.escuro, 0.04, 0.04, 0.02, -0.035, 0.02, 0.09); p.cx(M.escuro, 0.04, 0.04, 0.02, 0.035, 0.02, 0.09); }
  cama(B, b, 2.0, -1.5, Math.PI / 2); mesa(B, b, -1.5, 1.2, 0.2, 1.0, 0.7); const bola = new THREE.SphereGeometry(0.14, 16, 12); bola.translate(-1.5, 0.92, 1.2); geo(b, MM.magia, bola); luz(b, -1.5, 1.0, 1.2, 0x9a7cff, 8, 4);
  for (let i = 0; i < 7; i++) vela(B, b, -2.6 + rnd() * 1.2, 0.0, 0.2 + rnd() * 1.6);
  { const p = peca(B, b, 1.4, 0, 1.6, 2.4); p.esf(M.plain, 0.13, 0, 0.13, 0, 0x111111, 0.9); p.esf(M.plain, 0.08, 0, 0.27, 0.1, 0x111111); const r = new THREE.ConeGeometry(0.03, 0.25, 4); r.rotateX(-1); r.translate(0, 0.2, -0.18); por(B, M.plain, r, 0x111111, p.m); } // gato preto
  vista(n, b, [2.3, 1.6, 2.0], [-0.8, 0.8, -1.2], 72);
}
function templo(b: M4) {
  const M = MAT(), W = 12, D = 18, H = 7, n = 'Templo de Korl Khodan (dentro)';
  sala(n, b, W, D, H, { parede: M.muro, cp: 0xd0c8b8, chao: M.lajota, cc: 0xc8c0b0, teto: M.pedra, ct: 0x9a9488, vigas: false, janelas: 0 });
  for (let z = -6; z <= 6; z += 3) for (const s of [-1, 1]) cil(b, MM.marmore, 0.4, H, s * 3.8, 0, z, 0xe8e2d4, 14);
  // estátua do deus
  { const p = peca(B, b, 0, 0.8, -D / 2 + 1.6, 0), c = 0xb8b0a0; box(b, M.pedra, 3, 0.8, 2.4, 0, 0.4, -D / 2 + 1.6, 0x8a8478); const l = new THREE.LatheGeometry([[0, 0], [1.1, 0], [1.0, 1.2], [0.8, 2.6], [0.6, 3.4], [0.75, 3.8], [0.4, 4.2], [0, 4.25]].map(([a, bb]) => new THREE.Vector2(a, bb)), 16); por(B, MM.marmore, l, c, p.m); p.esf(MM.marmore, 0.38, 0, 4.6, 0, c, 1.1); p.cx(MAT().ferro, 0.1, 4.6, 0.1, 0.9, 2.3, 0.3, 0x8a7a50); p.esf(MM.ouro, 0.25, 0.9, 4.7, 0.3, 0xd8b048); }
  altar(B, b, 0, -D / 2 + 4, 0);
  poeiras.push(new THREE.Box3(v3(b, -W / 2 + 0.5, 0.4, -D / 2 + 0.5), v3(b, W / 2 - 0.5, H - 0.6, D / 2 - 0.5)));
  for (const [x, z] of [[-2.5, -3], [2.5, -3], [-2.5, 3], [2.5, 3]]) { brasas.push(v3(b, x, 1.0, z)); cil(b, M.ferro, 0.3, 0.9, x, 0, z, 0x3a3634, 8, 0.4); for (let k = 0; k < 5; k++) { const f = new THREE.ConeGeometry(0.12, 0.4, 5); f.translate(x + (rnd() - 0.5) * 0.3, 1.1, z + (rnd() - 0.5) * 0.3); geo(b, MAT().aceso, f); } luz(b, x, 1.3, z, 0xff8a3a, 22, 8, 1.6); }
  sacos(B, b, -2, -D / 2 + 4, 4); for (let i = 0; i < 6; i++) cil(b, M.plain, 0.12, 0.35, 1.6 + (i % 3) * 0.3, 0, -D / 2 + 3.6 + Math.floor(i / 3) * 0.3, 0x9a6a4a, 8, 0.08);
  // descida para a gruta do mar
  box(b, M.escuro, 2.2, 0.02, 3, 4, 0.01, 5.5); for (let i = 0; i < 5; i++) box(b, M.pedra, 2, 0.2, 0.55, 4, -0.15 - i * 0.3, 4.3 + i * 0.55, 0x7a746a);
  const ag = new THREE.PlaneGeometry(2, 2.6); ag.rotateX(-Math.PI / 2); ag.translate(4, -1.6, 5.5); geo(b, new THREE.MeshBasicMaterial({ color: 0x1a6a6a }), ag); luz(b, 4, -0.8, 5.5, 0x3ac0c0, 14, 6);
  tapete(B, b, 0, 2, Math.PI / 2, 2, 8, 0);
  vista(n, b, [0, 1.8, D / 2 - 1], [0, 2.4, -D / 2 + 1.6], 64);
}
function zolkan(b: M4) {
  const M = MAT(), W = 16, D = 14, H = 7, n = 'Mansão de Zolkan (dentro)';
  sala(n, b, W, D, H, { parede: M.reboco, cp: 0xa89a9a, chao: M.piso, cc: 0x8a6a58, teto: M.madeira, ct: 0x4a3a30, janelas: 2 });
  for (const s of [-1, 1]) tocha(b, s * (W / 2 - 0.15), 2.6, 1.5, s > 0 ? -Math.PI / 2 : Math.PI / 2); luz(b, 0, 4.4, -D / 2 + 1.5, 0x9ab0ff, 16, 10);
  // escadaria que se divide no fundo
  for (let i = 0; i < 10; i++) box(b, M.madeira, 4, 0.2, 0.4, 0, 0.1 + i * 0.3, -2 - i * 0.4, 0x4a2a1a);
  box(b, M.madeira, 12, 0.25, 1.6, 0, 3.1, -D / 2 + 0.8, 0x4a2a1a); for (const s of [-1, 1]) for (let i = 0; i < 6; i++) box(b, M.madeira, 1.4, 0.2, 0.4, s * (3.5 + i * 0.5), 3.1 + 0.3 * (i + 1), -D / 2 + 0.8, 0x4a2a1a, Math.PI / 2);
  for (let i = 0; i < 12; i++) box(b, M.madeira, 0.05, 0.9, 0.05, -5.5 + i, 3.65, -D / 2 + 1.55, 0x2a1a10);
  for (let i = 0; i < 6; i++) quadro(B, b, -6 + i * 2.4, 4.8, -D / 2 + 0.05, 0, 1.0, 1.3);
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) quadro(B, b, s * (W / 2 - 0.05), 2.4, -2 + i * 3, -s * Math.PI / 2, 0.9, 1.2);
  lustre(B, b, 0, 5.3, 1.5, 1.3); luz(b, 0, 5.3, 1.5, 0xffb060, 30, 14, 1.4);
  mesa(B, b, 0, 3.5, 0, 5, 1.2); for (let i = 0; i < 6; i++) { cadeira(B, b, -2 + i * 0.8, 2.6, 0); cadeira(B, b, -2 + i * 0.8, 4.4, Math.PI); servico(B, b, -2 + i * 0.8, 0.8, 3.2 + (i % 2) * 0.6); }
  for (const x of [-1.6, 1.6]) { const p = peca(B, b, x, 0.8, 3.5); p.cil(MAT().ferro, 0.04, 0.6, 0, 0, 0, 0x8a7a50, 6); for (const s of [-1, 0, 1]) vela(B, p.m, s * 0.15, 0.6, 0); luz(b, x, 1.6, 3.5, 0xffa050, 10, 5); }
  for (let i = 0; i < 4; i++) { const x = -6 + i * 4, z = i % 2 ? 5 : -4.5; box(b, M.tecido, 1.6, 1.0, 1.0, x, 0.5, z, 0xe8e4dc); } // móveis cobertos
  armadura(B, b, -W / 2 + 0.6, 0, Math.PI / 2); armadura(B, b, W / 2 - 0.6, 0, -Math.PI / 2);
  tapete(B, b, 0, 3.5, 0, 6, 3, 0); box(b, MM.rubro, 0.9, 1.1, 0.05, -W / 2 + 4.3, 1.7, D / 2 - 0.03); luz(b, -W / 2 + 4.3, 1.7, D / 2 - 0.6, 0xff2a1a, 10, 6);
  for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(1.2, 1.2); g.rotateY(Math.PI / 4 + i * Math.PI / 2); g.translate((i % 2 ? 1 : -1) * (W / 2 - 0.5), H - 0.6, (i < 2 ? 1 : -1) * (D / 2 - 0.5)); geo(b, new THREE.MeshBasicMaterial({ color: 0xd8d8d8, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }), g); } // teias
  vista(n, b, [5, 1.8, D / 2 - 1], [-1, 2.4, -3], 66);
}

export function construirInteriores(G: THREE.Group, M: MapRuntime) {
  B = new Batch('interiores'); luzes = []; halos = []; vistas = []; pisos = []; colGeo = []; paredes = []; areas = []; anim = []; sd = 9; brasas = []; bolhas = []; poeiras = [];
  const Mt = MAT(); if (!M.lamps.includes(Mt.aceso)) M.lamps.push(Mt.aceso);
  const cenas: ((b: M4, G: THREE.Group) => void)[] = [ancora, macacoCaolho, asidon, masmorra, cavernaGelo, covil, catedral, covariel, gilukSalao, bruxa, templo, zolkan];
  const extras: (((b: M4, G: THREE.Group) => void) | null)[] = [ancoraMais, macacoMais, asidonMais, masmorraMais, null, null, catedralMais, covarielMais, gilukMais, bruxaMais, temploMais, zolkanMais];
  cenas.forEach((f, i) => { const [x, z] = ORIGENS[i], b = mtx(x, Y0, z, 0); f(b, G); extras[i]?.(b, G); });
  const g = new THREE.Group(); g.name = 'Interiores'; B.build(g); g.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); G.add(g);
  void armario; void cristais;
  let solid: THREE.Object3D[] = [];
  if (colGeo.length) { let n = 0; colGeo.forEach(q => (n += q.attributes.position.count)); const p = new Float32Array(n * 3); let o = 0; colGeo.forEach(q => { p.set(q.attributes.position.array as Float32Array, o); o += q.attributes.position.count * 3; }); const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(p, 3)); cg.computeBoundingSphere(); const col = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); col.userData.ns = 1; col.userData.noExport = 1; G.add(col); solid = [col]; }
  pisos.forEach(p => G.add(p));
  G.add(particulas(brasas, 26, [1.0, 0.55, 0.18], 1.6, 0.45, 'Brasas'), particulas(bolhas, 40, [0.45, 1.0, 0.35], 0.9, 0.25, 'Bolhas do caldeirão'));
  poeiras.forEach(bx => G.add(dustMotes(bx, Math.round(bx.getSize(new THREE.Vector3()).length() * 14), 0xffe6c0)));
  return { vistas, pisos, solidos: solid, luzes, halos, anim, areasVtt: areas, paredesVtt: paredes };
}
export const dentroDeInterior = (p: THREE.Vector3) => p.y < -60;
/** partículas subindo de cada ponto (brasas da lareira, bolhas do caldeirão), animadas só na GPU */
function particulas(fontes: THREE.Vector3[], porFonte: number, cor: [number, number, number], altura: number, abre: number, nome: string) {
  const n = fontes.length * porFonte, pos = new Float32Array(n * 3), sd2 = new Float32Array(n);
  fontes.forEach((f, i) => { for (let k = 0; k < porFonte; k++) { const j = i * porFonte + k; pos.set([f.x + (rnd() - 0.5) * 0.3, f.y, f.z + (rnd() - 0.5) * 0.3], j * 3); sd2[j] = rnd() * 50; } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd2, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uT: tempo, uC: { value: new THREE.Color(...cor) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float seed; uniform float uT; varying float vA; void main() { float u = fract(uT * (0.35 + fract(seed * 7.3) * 0.4) + fract(seed)); vec3 p = position;
      p.y += u * ${altura.toFixed(2)}; p.x += sin(uT * 3.0 + seed) * ${abre.toFixed(2)} * u; p.z += cos(uT * 2.3 + seed * 1.7) * ${abre.toFixed(2)} * u;
      vA = (1.0 - u) * smoothstep(0.0, 0.08, u); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(14.0 / -mv.z, 1.0, 6.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uC * smoothstep(0.5, 0.0, r) * vA * 1.6, 1.0); }` });
  const p = new THREE.Points(g, m); p.name = nome; p.frustumCulled = false; p.userData.ns = 1; p.userData.noExport = 1; return p;
}
