// Barud — a Mata dos Chifres: floresta sombria em volta das muralhas e a trilha que sai da estrada do sul.
// Pinheiros escuros e árvores mortas em código (instanciados por bloco), chão de folhas com borda suave,
// trilha de terra com bordas que somem, e três pontos de mesa: a Forca da Encruzilhada (início), a Cabana do
// Lenhador (meio) e o Círculo dos Chifres (fim, com coral crescendo no altar).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pbr } from '../../core/pbr';
import { instance, instanceVariants, type Xf } from '../../core/models';
import { grassField } from '../../core/grass';
import { fbm } from '../../core/terrain';
import { Batch, MAT, mtx, por, cil, telhado, coral, rnd, reseed, Q, PORTAO_SUL, PORTAO_LESTE, signTexture } from './common';
import { luz } from './cidade';
import { mesa, banqueta, cama, bau, vela, caixote, barril, peca } from './mobilia';

type P2 = [number, number];
// ---------- planta da trilha (x = leste, z = sul) ----------
/** pontos de controle: da estrada do sul (perto da forca) até o centro do Círculo dos Chifres */
export const TRILHA: P2[] = [[2.5, 150], [-8, 159], [-26, 165], [-44, 177], [-60, 183], [-78, 181], [-96, 191], [-110, 205], [-126, 210], [-140, 214], [-152, 219]];
export const FORCA = { x: -6, z: 146 };
export const CABANA = { x: -63, z: 193.5, ry: 0 };   // porta (lado −z local) virada para a trilha, ao norte
export const CLAREIRA = { x: -152, z: 219, r: 16 };
export const AREAS: Record<string, [number, number, number, number]> = {
  mata: [-170, 14, 136, 240],
  cabana: [CABANA.x - 4, CABANA.x + 4, CABANA.z - 4, CABANA.z + 4],
  circulo: [CLAREIRA.x - CLAREIRA.r, CLAREIRA.x + CLAREIRA.r, CLAREIRA.z - CLAREIRA.r, CLAREIRA.z + CLAREIRA.r],
  forca: [FORCA.x - 6, FORCA.x + 9, FORCA.z - 6, FORCA.z + 12],
};
export const MARCAS: Record<string, [number, number, number]> = {
  mata: [-60, 16, 180], cabana: [CABANA.x, 6, CABANA.z], circulo: [CLAREIRA.x, 8, CLAREIRA.z], forca: [FORCA.x, 7, FORCA.z],
};

const curva = new THREE.CatmullRomCurve3(TRILHA.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
const LEN = curva.getLength();
const FINO = curva.getSpacedPoints(Math.ceil(LEN / 0.6));
const GROSSO = curva.getSpacedPoints(Math.ceil(LEN / 3));
const hashF = new Map<string, number[]>();
FINO.forEach((p, i) => { const k = Math.floor(p.x / 6) + ',' + Math.floor(p.z / 6); if (!hashF.has(k)) hashF.set(k, []); hashF.get(k)!.push(i); });
/** ponto da trilha na fração u (0 = estrada, 1 = clareira) */
export const naTrilha = (u: number) => curva.getPointAt(Math.max(0, Math.min(1, u)));
/** distância (m) até o eixo da trilha */
export function distTrilha(x: number, z: number) {
  let d = 1e9;
  for (const p of GROSSO) d = Math.min(d, Math.hypot(p.x - x, p.z - z));
  if (d > 8) return d;
  const cx0 = Math.floor(x / 6), cz0 = Math.floor(z / 6);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of hashF.get((cx0 + a) + ',' + (cz0 + b)) || []) d = Math.min(d, Math.hypot(FINO[i].x - x, FINO[i].z - z));
  return d;
}
function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
  const ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
  return Math.hypot(ax + ex * t - x, az + ez * t - z);
}
/** 1 = mata fechada; 0 = campo aberto em volta da muralha ou leito das estradas */
export function mataMask(x: number, z: number) {
  const d = Math.hypot(x, z), borda = 134 + 26 * (fbm(x * 0.018 + 7, z * 0.018, 3) - 0.47);
  let k = Math.min(1, Math.max(0, (d - borda) / 14));
  const est = Math.min(distSeg(x, z, PORTAO_SUL.x, PORTAO_SUL.z, PORTAO_SUL.x + 8, 330), distSeg(x, z, PORTAO_LESTE.x, PORTAO_LESTE.z, 330, PORTAO_LESTE.z - 20));
  k *= Math.min(1, Math.max(0, (est - 7) / 7));
  return k;
}

/** vistas da mata (as câmeras ficam livres de árvores) */
export function vistasMata() {
  const a = naTrilha(0.012), b = naTrilha(0.09), m = naTrilha(0.5), c0 = naTrilha(0.93);
  return [
    { n: 'Trilha da Mata', p: [+(a.x + 2).toFixed(2), 1.75, +(a.z - 1.5).toFixed(2)], t: [+b.x.toFixed(2), 1.3, +b.z.toFixed(2)], fov: 60 },
    { n: 'Forca da Encruzilhada', p: [FORCA.x + 9, 2.4, FORCA.z - 6], t: [FORCA.x, 2.2, FORCA.z], fov: 55 },
    { n: 'Cabana do Lenhador', p: [CABANA.x + 5, 1.75, CABANA.z - 8.5], t: [CABANA.x, 1.6, CABANA.z], fov: 58 },
    { n: 'Cabana do Lenhador (dentro)', p: [CABANA.x + 1.2, 1.6, CABANA.z - 1.3], t: [CABANA.x - 1, 0.9, CABANA.z + 1.4], fov: 70 },
    { n: 'Círculo dos Chifres', p: [+(c0.x + 4).toFixed(2), 2.6, +(c0.z - 6).toFixed(2)], t: [CLAREIRA.x, 1.2, CLAREIRA.z], fov: 60 },
    { n: 'Mata dos Chifres (do alto)', p: [+(m.x + 30).toFixed(2), 48, +(m.z - 60).toFixed(2)], t: [+m.x.toFixed(2), 0, +m.z.toFixed(2)], fov: 55 },
  ] as { n: string; p: [number, number, number]; t: [number, number, number]; fov: number }[];
}

/** árvore morta retorcida (~150 tri): tronco curvo em gomos e galhos finos subindo */
function mortaGeo(seed: number) {
  reseed(seed * 31 + 11);
  const parts: THREE.BufferGeometry[] = [], h = 7 + rnd() * 5, gomos = 5;
  let x = 0, z = 0, y = 0, r = 0.32 + rnd() * 0.12;
  const dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  const tubo = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r0: number, r1: number, lados = 5) => {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), L = a.distanceTo(b);
    const g = new THREE.CylinderGeometry(r1, r0, L, lados, 1, true); g.translate(0, L / 2, 0);
    dir.subVectors(b, a).normalize(); q.setFromUnitVectors(up, dir); g.applyQuaternion(q); g.translate(x0, y0, z0);
    g.deleteAttribute('uv'); parts.push(g.toNonIndexed());
  };
  const topo: THREE.Vector3[] = [];
  for (let i = 0; i < gomos; i++) {
    const nx = x + (rnd() - 0.5) * 1.1, nz = z + (rnd() - 0.5) * 1.1, ny = y + h / gomos, nr = r * 0.78;
    tubo(x, y, z, nx, ny, nz, r, nr, 6);
    if (i >= 2) topo.push(new THREE.Vector3(nx, ny, nz));
    x = nx; z = nz; y = ny; r = nr;
  }
  // galhos: saem dos gomos de cima, sobem tortos e às vezes se dividem
  const nG = 5 + ((rnd() * 3) | 0);
  for (let i = 0; i < nG; i++) {
    const o = topo[(rnd() * topo.length) | 0], a = rnd() * 6.283, L = 1.6 + rnd() * 2.6, sobe = 0.4 + rnd() * 0.9;
    const ex = o.x + Math.cos(a) * L, ez = o.z + Math.sin(a) * L, ey = o.y + L * sobe * 0.7;
    tubo(o.x, o.y - 0.3, o.z, ex, ey, ez, 0.11, 0.035, 4);
    if (rnd() < 0.7) { const a2 = a + (rnd() - 0.5) * 1.6, L2 = L * 0.55; tubo(ex, ey, ez, ex + Math.cos(a2) * L2, ey + L2 * 0.5, ez + Math.sin(a2) * L2, 0.035, 0.01, 3); }
  }
  // raízes à mostra
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + rnd(); tubo(0, 0.35, 0, Math.cos(a) * 1.1, -0.1, Math.sin(a) * 1.1, 0.16, 0.05, 4); }
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const base = new THREE.Color().setHSL(0.07 + rnd() * 0.04, 0.1, 0.06 + rnd() * 0.025);
  for (let i = 0; i < p.count; i++) { c.copy(base).multiplyScalar(0.75 + 0.45 * (p.getY(i) / h) + 0.12 * Math.sin(i * 0.7)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
/** pinheiro escuro e frio (~150 tri): tronco + 7 saias de galhos com borda irregular (receita de Harlow) */
function pinheiroEscuro(v: number) {
  reseed(v * 17 + 43);
  const parts: THREE.BufferGeometry[] = [], h = 10 + rnd() * 6, tiers = 7;
  const tr = new THREE.CylinderGeometry(0.1, 0.32, h * 0.6, 6); tr.translate(0, h * 0.3, 0); parts.push(tr.toNonIndexed());
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), y0 = h * (0.18 + f * 0.62), r = (2.3 - f * 1.9) * (0.85 + rnd() * 0.3), ch = h * (0.22 - f * 0.06);
    const c = new THREE.ConeGeometry(r, ch, 9, 1, true); c.translate(0, y0 + ch / 2, 0);
    const p = c.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) < y0 + 0.01) { const a = Math.atan2(p.getZ(k), p.getX(k)), j = 0.8 + 0.4 * Math.abs(Math.sin(a * 4.5 + i * 1.7)); p.setXYZ(k, p.getX(k) * j, y0 - 0.4 * j - rnd() * 0.3, p.getZ(k) * j); }
    c.rotateY(rnd() * 3); parts.push(c.toNonIndexed());
  }
  const tip = new THREE.ConeGeometry(0.35, h * 0.14, 6); tip.translate(0, h * 0.95, 0); parts.push(tip.toNonIndexed());
  parts.forEach(p => p.deleteAttribute('uv'));
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const p = g.attributes.position, a = new Float32Array(p.count * 3), base = new THREE.Color().setHSL(0.28 + rnd() * 0.06, 0.16, 0.042), bark = new THREE.Color(0x261c16), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i));
    if (y < h * 0.2 && r < 0.4) c.copy(bark); else c.copy(base).multiplyScalar(0.7 + 0.6 * (y / h) + 0.35 * Math.min(1, r / 2) + 0.1 * Math.sin(i * 1.3));
    a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

/** crânio de touro numa estaca (marcos da trilha e do círculo) */
function cranio(B: Batch, x: number, z: number, ry: number, h = 1.7) {
  const M = MAT(), P = peca(B, new THREE.Matrix4(), x, 0, z, ry);
  P.cil(M.madeira, 0.05, h, 0, 0, 0, 0x5a4838, 5, 0.035);
  P.cx(M.plain, 0.26, 0.22, 0.34, 0, h + 0.05, 0.02, 0xc8bca0);           // caixa craniana
  P.cx(M.plain, 0.16, 0.14, 0.28, 0, h - 0.02, 0.26, 0xbcb094, -0, 0.25);   // focinho
  P.cx(M.escuro, 0.06, 0.06, 0.02, -0.08, h + 0.08, 0.19); P.cx(M.escuro, 0.06, 0.06, 0.02, 0.08, h + 0.08, 0.19); // órbitas
  for (const s of [-1, 1]) { // chifres curvos: dois cones
    const g = new THREE.ConeGeometry(0.05, 0.42, 6); g.rotateZ(-s * 1.25); g.translate(s * 0.3, h + 0.16, 0); por(B, M.plain, g, 0x8a7a5a, P.m);
    const g2 = new THREE.ConeGeometry(0.03, 0.26, 5); g2.rotateZ(-s * 0.3); g2.translate(s * 0.5, h + 0.32, 0); por(B, M.plain, g2, 0x6a5a40, P.m);
  }
}

export interface Floresta { floors: THREE.Object3D[]; colliders: THREE.Object3D; cartaz: { x: number; y: number; z: number; ry: number }; nevoa: THREE.Vector3[] }

export async function construirFloresta(G: THREE.Group): Promise<Floresta> {
  reseed(777);
  const M = MAT(), O = new THREE.Group(); O.name = 'Mata dos Chifres'; G.add(O);
  const B = new Batch('mata'), BR = new Batch('mata-telhado');
  const floors: THREE.Object3D[] = [], colGeo: THREE.BufferGeometry[] = [];
  const coluna = (x: number, z: number, w: number, d: number, h: number, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, h / 2, z); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.toNonIndexed()); };
  const nivel = Q.luzes > 14 ? 2 : Q.luzes > 8 ? 1 : 0;

  // ---------- chão de folhas e agulhas (anel em volta da cidade; some na borda e nas estradas) ----------
  {
    const g = new THREE.RingGeometry(112, 336, 220, 64); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), k = mataMask(x, z) * (0.8 + 0.4 * fbm(x * 0.1, z * 0.1, 2));
      p.setY(i, -0.018); uv.setXY(i, x, -z);
      const c = 0.7 + 0.35 * fbm(x * 0.04 + 3, z * 0.04, 2);
      col[i * 4] = c; col[i * 4 + 1] = c * 0.97; col[i * 4 + 2] = c * 0.92; col[i * 4 + 3] = Math.min(1, Math.max(0, (k - 0.1) / 0.45));
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.computeVertexNormals();
    const mat = pbr('forest_ground_04', { size: 2.5, color: 0x6a6254 }).clone();
    mat.vertexColors = true; mat.transparent = true; mat.depthWrite = false; mat.polygonOffset = true; mat.polygonOffsetFactor = -2;
    const fl = new THREE.Mesh(g, mat); fl.receiveShadow = true; fl.userData.ns = 1; fl.renderOrder = -1; O.add(fl);
  }

  // ---------- trilha de terra batida (fita com borda que some) ----------
  {
    const n = FINO.length, pos = new Float32Array(n * 4 * 3), uv = new Float32Array(n * 4 * 2), col = new Float32Array(n * 4 * 4), idx: number[] = [];
    const lado = [-2.4, -1.3, 1.3, 2.4], alfa = [0, 1, 1, 0];
    for (let i = 0; i < n; i++) {
      const a = FINO[Math.max(0, i - 1)], b = FINO[Math.min(n - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, L = Math.hypot(tx, tz) || 1, nx = -tz / L, nz = tx / L;
      const larg = 1 + 0.25 * Math.sin(i * 0.11) + (i > n - 12 ? (i - (n - 12)) * 0.3 : 0); // abre na clareira
      for (let k = 0; k < 4; k++) {
        const j = i * 4 + k, x = FINO[i].x + nx * lado[k] * larg, z = FINO[i].z + nz * lado[k] * larg;
        pos.set([x, -0.01, z], j * 3); uv.set([x, -z], j * 2);
        const c = 0.85 + 0.2 * Math.sin(i * 0.37 + k); col.set([c, c * 0.96, c * 0.9, alfa[k] * (i < 4 ? i / 4 : 1)], j * 4);
      }
      if (i < n - 1) for (let k = 0; k < 3; k++) { const a0 = i * 4 + k, b0 = a0 + 4; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); } // anti-horário visto de cima (face para cima)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx); g.computeVertexNormals();
    const mat = pbr('dry_ground_rocks', { size: 3, color: 0xb8a68a }).clone();
    mat.vertexColors = true; mat.transparent = true; mat.depthWrite = false; mat.polygonOffset = true; mat.polygonOffsetFactor = -4;
    const tr = new THREE.Mesh(g, mat); tr.receiveShadow = true; tr.userData.ns = 1; tr.renderOrder = 0; O.add(tr);
  }

  // ---------- pontos livres de árvores ----------
  const vistas = vistasMata();
  const livre = (x: number, z: number, folga: number) =>
    distTrilha(x, z) > 2.8 + folga && Math.hypot(x - CLAREIRA.x, z - CLAREIRA.z) > CLAREIRA.r + folga &&
    Math.hypot(x - CABANA.x, z - CABANA.z) > 7 + folga && Math.hypot(x - FORCA.x, z - (FORCA.z + 3)) > 9 &&
    vistas.every(v => v.p[1] > 20 || Math.hypot(x - v.p[0], z - v.p[2]) > 7);

  // ---------- árvores ----------
  const N = [2200, 3400, 4800][nivel];
  const arv: { x: number; z: number; s: number; r: number; v: number; morta: boolean }[] = [];
  const grade = new Map<string, number[]>(), CEL = 4;
  const perto = (x: number, z: number, sp: number) => {
    const gx = Math.floor(x / CEL), gz = Math.floor(z / CEL);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of grade.get((gx + a) + ',' + (gz + b)) || []) if (Math.hypot(arv[i].x - x, arv[i].z - z) < sp) return true;
    return false;
  };
  for (let t = 0; t < N * 10 && arv.length < N; t++) {
    let x: number, z: number;
    if (t % 3 === 0) { const p = FINO[(rnd() * FINO.length) | 0], a = rnd() * 6.283, d = 3 + rnd() * 40; x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; } // mais densa perto da trilha
    else { const a = rnd() * 6.283, [r0, r1] = rnd() < 0.7 ? [128, 225] : [225, 330], r = Math.sqrt(rnd() * (r1 ** 2 - r0 ** 2) + r0 ** 2); x = Math.cos(a) * r; z = Math.sin(a) * r; } // faixa colada à muralha é a mais vista
    const k = mataMask(x, z); if (k < 0.15 + rnd() * 0.35) continue;
    const s = 0.75 + rnd() * 0.55; if (!livre(x, z, s * 0.6) || perto(x, z, 2.1 * s + 0.5)) continue;
    const dC = Math.hypot(x - CLAREIRA.x, z - CLAREIRA.z), morta = rnd() < (dC < 45 ? 0.6 : distTrilha(x, z) < 12 ? 0.35 : 0.2);
    const k2 = Math.floor(x / CEL) + ',' + Math.floor(z / CEL); if (!grade.has(k2)) grade.set(k2, []); grade.get(k2)!.push(arv.length);
    arv.push({ x, z, s, r: rnd() * 6.283, v: (rnd() * 3) | 0, morta });
    if (distTrilha(x, z) < 40 || dC < 40) coluna(x, z, 0.55 * s, 0.55 * s, 3);
  }
  const matPin = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.3, side: THREE.DoubleSide });
  const matMorta = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, envMapIntensity: 0.25 });
  for (const morta of [false, true]) for (let v = 0; v < 3; v++) {
    const geo = morta ? mortaGeo(v) : pinheiroEscuro(v), lista = arv.filter(t => t.morta === morta && t.v === v), by = new Map<string, typeof lista>();
    lista.forEach(t => { const k = Math.floor(t.x / 30) + ',' + Math.floor(t.z / 30); if (!by.has(k)) by.set(k, []); by.get(k)!.push(t); });
    by.forEach(L => {
      const im = new THREE.InstancedMesh(geo, morta ? matMorta : matPin, L.length), o = new THREE.Object3D();
      L.forEach((t, i) => { o.position.set(t.x, -0.2, t.z); o.rotation.set(0, t.r, 0); o.scale.setScalar(t.s * (morta ? 1 : 1.05)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = nivel > 0; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.cullDist = 280; im.userData.canopy = 1; im.userData.ns = 1; O.add(im);
    });
  }

  // ---------- sub-bosque perto da trilha (onde a câmera anda) ----------
  const espalha = (n: number, d0: number, d1: number, incluiClareira = false) => {
    const out: Xf[] = [];
    for (let t = 0; t < n * 25 && out.length < n; t++) {
      let x: number, z: number;
      if (incluiClareira && rnd() < 0.3) { const a = rnd() * 6.283, r = CLAREIRA.r - 1 + rnd() * 10; x = CLAREIRA.x + Math.cos(a) * r; z = CLAREIRA.z + Math.sin(a) * r; }
      else { const p = FINO[(rnd() * FINO.length) | 0], a = rnd() * 6.283, d = d0 + rnd() * (d1 - d0); x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; }
      if (mataMask(x, z) < 0.3 || distTrilha(x, z) < d0 || Math.hypot(x - CABANA.x, z - CABANA.z) < 5 || Math.hypot(x - FORCA.x, z - FORCA.z) < 6) continue;
      if (Math.hypot(x - CLAREIRA.x, z - CLAREIRA.z) < CLAREIRA.r - 2) continue;
      out.push({ x, y: -0.03, z, ry: rnd() * 6.283, s: 0.8 + rnd() * 0.5 });
    }
    return out;
  };
  const k = [0.5, 1, 1.3][nivel];
  const carga: Promise<unknown>[] = [];
  const vai = (p: Promise<unknown>) => carga.push(p.catch(() => {}));
  vai(instanceVariants('fern_02', espalha(Math.round(110 * k), 2.4, 22), O, { shadow: false, wind: { amp: 0.04, freq: 1.4, flutter: 0.01 }, tile: 30, cullDist: 60 }));
  vai(instance('shrub_03', espalha(Math.round(50 * k), 3, 30), O, { shadow: false, wind: { amp: 0.04, freq: 1.3, flutter: 0.01 }, tile: 30, cullDist: 80 }));
  vai(instance('dead_tree_trunk', espalha(12, 4, 26, true).map(t => ({ ...t, s: 1 + rnd() * 0.5 })), O, { tile: 40, cullDist: 140 }));
  vai(instance('tree_stump_01', espalha(18, 3, 24, true), O, { tile: 40, cullDist: 90 }));
  vai(instance('root_cluster_01', espalha(Math.round(14 * k), 2.8, 18), O, { tile: 40, cullDist: 80 }));
  vai(instanceVariants('rock_moss_set_01', espalha(Math.round(22 * k), 3, 26, true), O, { tile: 40, cullDist: 100 }));
  vai(instance('dry_branches_medium_01', espalha(Math.round(30 * k), 2.2, 16), O, { shadow: false, tile: 30, cullDist: 60 }));
  if (Q.grama) O.add(grassField({
    count: nivel > 1 ? 9000 : 5000, area: [AREAS.mata[0], AREAS.mata[1], AREAS.mata[2], AREAS.mata[3]], height: () => -0.03,
    colors: [0x3a4228, 0x42482c, 0x343a24, 0x4a4a30],
    allow: (x, z) => { const d = distTrilha(x, z); return d < 2.2 || d > 26 ? 0 : 0.7 * mataMask(x, z); }, tall: () => 1.5, cullDist: 40,
  }));

  // ---------- Forca da Encruzilhada (onde a trilha deixa a estrada) ----------
  {
    const m = mtx(FORCA.x, 0, FORCA.z, Math.PI / 2), P = peca(B, m, 0, 0, 0);
    P.cx(M.tabuas, 3.2, 0.12, 2.4, 0, 1.3, 0, 0x6a5a48);                                    // tablado
    for (const sx of [-1.45, 1.45]) for (const sz of [-1.05, 1.05]) P.cx(M.madeira, 0.16, 1.3, 0.16, sx, 0.65, sz, 0x5a4838);
    for (let i = 0; i < 4; i++) P.cx(M.tabuas, 0.9, 0.08, 0.3, 0, 0.25 + i * 0.3, 1.35 + (3 - i) * 0.3, 0x5a4a3a); // degraus
    for (const sx of [-1.2, 1.2]) P.cx(M.madeira, 0.22, 3.6, 0.22, sx, 1.3 + 1.8, -0.6, 0x5a4838);
    P.cx(M.madeira, 2.9, 0.22, 0.24, 0, 4.95, -0.6, 0x5a4838);                              // travessa
    P.cx(M.madeira, 0.12, 0.9, 0.12, 0.85, 4.45, -0.6, 0x5a4838, 0.6);                       // mão-francesa
    P.cx(M.escuro, 0.7, 0.04, 0.7, 0, 1.37, -0.6);                                          // alçapão
    P.cil(M.plain, 0.02, 1.4, 0, 3.55, -0.6, 0x8a7a5a, 4);                                   // corda
    const nó = new THREE.TorusGeometry(0.13, 0.025, 4, 10); nó.translate(0, 3.42, -0.6); por(B, M.plain, nó, 0x8a7a5a, P.m);
    coluna(FORCA.x, FORCA.z, 2.4, 3.2, 1.4, Math.PI / 2);
    // gaiola de ferro pendurada num poste ao lado
    const g = peca(B, m, -3.6, 0, 1.2);
    g.cx(M.madeira, 0.22, 4.4, 0.22, 0, 2.2, 0, 0x5a4838); g.cx(M.madeira, 1.4, 0.16, 0.16, 0.65, 4.2, 0, 0x5a4838);
    g.cil(M.ferro, 0.012, 0.9, 1.25, 3.3, 0, 0xffffff, 4);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; g.cil(M.ferro, 0.015, 1.5, 1.25 + Math.cos(a) * 0.36, 1.8, Math.sin(a) * 0.36, 0xffffff, 4); }
    for (const y of [1.8, 3.3]) { const t = new THREE.TorusGeometry(0.36, 0.022, 4, 14); t.rotateX(Math.PI / 2); t.translate(1.25, y, 0); por(B, M.ferro, t, 0xffffff, g.m); }
    cranio(B, FORCA.x + 1.2, FORCA.z + 5.5, 0.8, 1.5);
    // placa da encruzilhada
    const px = FORCA.x + 4.2, pz = FORCA.z + 7.5;
    cil(B, M.madeira, 0.07, 2.6, px, 0, pz, 0x5a4a3a, 6);
    const placa = (txt: string, y: number, ry: number, desl: number) => {
      const t = signTexture(txt, { bg: '#5a4632', fg: '#e8d8b8', border: '#2a2018', w: 512, h: 112, font: 'bold 54px Georgia, serif' });
      const mt = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
      for (const lado of [0, Math.PI]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.33), mt); pl.position.set(px + Math.sin(ry) * desl, y, pz + Math.cos(ry) * desl); pl.rotation.y = ry + Math.PI / 2 + lado; pl.translateZ(0.03); pl.userData.ns = 1; O.add(pl); }
    };
    // tocha da Legião na placa (única luz da encruzilhada)
    { const g = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6); g.rotateZ(0.5); g.translate(px + 0.18, 2.75, pz); por(B, M.madeira, g, 0x4a3a2a);
      const f = new THREE.ConeGeometry(0.09, 0.28, 6); f.translate(px + 0.3, 3.05, pz); por(B, M.aceso, f, 0xffffff); luz(px + 0.3, 3.1, pz, 28, 2, 0xff8a3a, 13, 6); }
    placa('BARUD ▲', 2.25, Math.PI, 0.7);
    placa('◄ MATA DOS CHIFRES', 1.85, -Math.PI / 2, 0.7);
  }

  // ---------- marcos de chifre e tronco caído ao longo da trilha ----------
  for (const u of [0.12, 0.3, 0.55, 0.74, 0.88]) {
    const p = naTrilha(u), q = naTrilha(u + 0.01), a = Math.atan2(q.x - p.x, q.z - p.z), s = u * 7 % 2 < 1 ? 1 : -1;
    cranio(B, p.x + Math.cos(a) * 2.4 * s, p.z - Math.sin(a) * 2.4 * s, a + Math.PI / 2 * s);
  }
  {
    const p = naTrilha(0.4), q = naTrilha(0.41), a = Math.atan2(q.x - p.x, q.z - p.z);
    const g = new THREE.CylinderGeometry(0.34, 0.42, 7.5, 9); g.rotateZ(Math.PI / 2); g.rotateY(a + Math.PI / 2 + 0.25); g.translate(p.x, 0.3, p.z); por(B, M.madeira, g, 0x3a3226);
    for (let i = 0; i < 3; i++) { const b = new THREE.CylinderGeometry(0.04, 0.08, 1.4, 4); b.rotateZ(0.9 + i * 0.4); b.rotateY(a + i); b.translate(p.x + (i - 1) * 1.5, 0.75, p.z); por(B, M.madeira, b, 0x3a3226); }
  }

  // ---------- Cabana do Lenhador (abandonada... ou quase) ----------
  {
    const m = mtx(CABANA.x, 0, CABANA.z, CABANA.ry), P = peca(B, m, 0, 0, 0), W = 3.8, D = 4.6, H = 2.4, T = 0.14, cor = 0x9a8468;
    P.cx(M.piso, W, 0.12, D, 0, 0.06, 0, 0x8a7a62);
    P.cx(M.tabuas, W, H, T, 0, H / 2, D / 2, cor);                                         // fundo
    for (const s of [-1, 1]) P.cx(M.tabuas, T, H, D, s * W / 2, H / 2, 0, cor);            // lados
    P.cx(M.tabuas, (W - 1) / 2, H, T, -(W + 1) / 4, H / 2, -D / 2, cor); P.cx(M.tabuas, (W - 1) / 2, H, T, (W + 1) / 4, H / 2, -D / 2, cor);
    P.cx(M.tabuas, 1, H - 2, T, 0, 2 + (H - 2) / 2, -D / 2, cor);                           // verga da porta
    { const g = new THREE.BoxGeometry(0.95, 1.95, 0.05); g.translate(0.475, 0.98, 0); g.rotateY(-1.1); g.translate(-0.5, 0, -D / 2); por(B, M.tabuas, g, 0x4a3a2a, m); } // porta entreaberta
    P.cx(M.escuro, 0.5, 0.4, 0.04, -W / 2 - 0.01, 1.4, 0.8, 0, 0); // janela cega (tábuas pregadas)
    for (const s of [-1, 1]) for (const z of [-D / 2, D / 2]) P.cx(M.madeira, 0.16, H + 0.1, 0.16, s * W / 2, (H + 0.1) / 2, z, 0x5a4838);
    telhado(BR, M.tabuas, W, D, 1.3, H, 0x7a6a58, m, 0.4, M.tabuas, cor);
    P.cx(M.pedra, 0.7, 4.2, 0.7, W / 2 + 0.36, 2.1, D / 2 - 0.6, 0x8a847a);                // chaminé (do lado de fora)
    P.cx(M.madeira, W - 0.3, 0.06, D - 0.3, 0, H - 0.02, 0, 0x5a4838);                      // forro
    // por dentro
    cama(B, m, -1.1, 1.3, Math.PI / 2); mesa(B, m, 0.9, 0.5, 0, 1.1, 0.7); banqueta(B, m, 0.9, -0.2); bau(B, m, 1.3, 1.9, Math.PI);
    const v = vela(B, m, 0.8, 0.8, 0.55); luz(v.x, v.y + 0.2, v.z, 26, 3, 0xff9a48, 8, 3);
    caixote(B, m, -1.3, -1.6); barril(B, m, 1.4, -1.7);
    // fora: cepo com machado, lenha empilhada, armadilhas
    const f = peca(B, m, 2.6, 0, -2.4);
    f.cil(M.madeira, 0.32, 0.6, 0, 0, 0, 0x5a4a38, 10); f.cx(M.madeira, 0.05, 0.75, 0.05, 0.05, 0.85, 0, 0x4a3a2a, 0.35); f.cx(M.ferro, 0.22, 0.14, 0.03, 0.2, 1.15, 0, 0xffffff, 0.35);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const g = new THREE.CylinderGeometry(0.11, 0.11, 1.1, 7); g.rotateX(Math.PI / 2); g.translate(-W / 2 - 0.5, 0.12 + r * 0.2, -1.2 + i * 0.23 + r * 0.11); por(B, M.madeira, g, 0x6a5440, m); }
    for (let i = 0; i < 3; i++) { const t = new THREE.TorusGeometry(0.22, 0.02, 4, 10); t.rotateX(Math.PI / 2); t.translate(-0.5 + i * 0.7, 1.7, D / 2 + 0.09); t.rotateX(0); por(B, M.ferro, t, 0xffffff, m); }
    // paredes para colisão (porta livre)
    const c = Math.cos(CABANA.ry), s = Math.sin(CABANA.ry), w2 = (lx: number, lz: number) => [CABANA.x + lx * c + lz * s, CABANA.z - lx * s + lz * c];
    const [bx, bz] = w2(0, D / 2); coluna(bx, bz, W, T, H, CABANA.ry);
    for (const sx of [-1, 1]) { const [x, z] = w2(sx * W / 2, 0); coluna(x, z, T, D, H, CABANA.ry); const [fx, fz] = w2(sx * (W + 1) / 4, -D / 2); coluna(fx, fz, (W - 1) / 2, T, H, CABANA.ry); }
  }

  // ---------- Círculo dos Chifres (clareira no fim da trilha) ----------
  {
    const { x: X, z: Z } = CLAREIRA;
    // chão de terra pisada na clareira
    { const g = new THREE.CircleGeometry(CLAREIRA.r - 2, 40); g.rotateX(-Math.PI / 2); const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)), j = 1 + 0.12 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 5); p.setXYZ(i, X + p.getX(i) * j, -0.012, Z + p.getZ(i) * j); uv.setXY(i, p.getX(i), -p.getZ(i)); void r; }
      const mt = pbr('brown_mud_leaves_01', { size: 3, color: 0x7a6a5a }).clone(); mt.polygonOffset = true; mt.polygonOffsetFactor = -3;
      const me = new THREE.Mesh(g, mt); me.receiveShadow = true; me.userData.ns = 1; O.add(me); }
    // pedras em pé (menires inclinados), duas caídas
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.283 + 0.2, r = 9 + (rnd() - 0.5), x = X + Math.cos(a) * r, z = Z + Math.sin(a) * r, h = 2.4 + rnd() * 1.6, caida = i === 3 || i === 7;
      const g = new THREE.BoxGeometry(1.0 + rnd() * 0.4, h, 0.6 + rnd() * 0.3, 2, 3, 2), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) { const t = (p.getY(k) + h / 2) / h; p.setXYZ(k, p.getX(k) * (1 - t * 0.35) + (rnd() - 0.5) * 0.08, p.getY(k), p.getZ(k) * (1 - t * 0.3) + (rnd() - 0.5) * 0.08); }
      if (caida) { g.rotateX(Math.PI / 2 - 0.1); g.translate(0, 0.35, h / 2 - 0.3); } else { g.rotateX((rnd() - 0.5) * 0.15); g.translate(0, h / 2 - 0.15, 0); }
      g.rotateY(-a + Math.PI / 2); g.translate(x, 0, z); g.computeVertexNormals(); por(B, M.pedra, g, 0xb0aaa0);
      if (!caida) coluna(x, z, 1, 1, h);
      if (i % 3 === 1) coral(B, x + Math.cos(a) * 0.5, 0.05, z + Math.sin(a) * 0.5, 1.6);
    }
    // altar: laje sobre duas pedras, com coral brotando e velas
    { const g = new THREE.BoxGeometry(2.4, 0.3, 1.3); g.translate(X, 0.95, Z); por(B, M.pedra, g, 0x9a948a);
      for (const s of [-0.8, 0.8]) { const g2 = new THREE.BoxGeometry(0.5, 0.8, 1.0); g2.translate(X + s, 0.4, Z); por(B, M.pedra, g2, 0x9a948a); }
      coluna(X, Z, 2.4, 1.3, 1.1);
      coral(B, X - 0.5, 1.1, Z, 2.4); coral(B, X + 0.6, 1.1, Z + 0.2, 1.6); coral(B, X + 0.2, 0, Z + 0.9, 2);
      const b = new THREE.Matrix4();
      for (const [dx, dz] of [[-1, -0.5], [1.05, -0.45], [0.4, 0.5], [-0.9, 0.45]]) vela(B, b, X + dx, 1.1, Z + dz);
      luz(X, 1.6, Z, 24, 3, 0xffa858, 10, 4);
      luz(X - 0.4, 1.5, Z + 0.3, 14, 2, 0xff3a3a, 7);                                   // brilho do coral
      cranio(B, X, Z - 0.9, 0, 1.25); }
    // crânios em estacas em volta e a grande árvore morta atrás do altar
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + 0.6, r = 6; cranio(B, X + Math.cos(a) * r, Z + Math.sin(a) * r, -a - Math.PI / 2, 1.5 + rnd() * 0.5); }
    { const g = mortaGeo(9); g.scale(1.6, 1.4, 1.6); g.rotateY(0.7); g.translate(X - 4.5, -0.2, Z + 4.5); B.add(matMorta, g, 0xffffff); coluna(X - 4.5, Z + 4.5, 1, 1, 3);
      // trapos e ossos pendurados nos galhos
      for (let i = 0; i < 6; i++) { const gx = X - 4.5 + (rnd() - 0.5) * 4, gz = Z + 4.5 + (rnd() - 0.5) * 4, y = 4.5 + rnd() * 3;
        const t = new THREE.BoxGeometry(0.25, 0.7 + rnd() * 0.5, 0.02); t.translate(gx, y - 0.5, gz); por(B, M.tecido, t, i % 2 ? 0x4a1418 : 0x6a6050);
        const c = new THREE.CylinderGeometry(0.004, 0.004, 1, 3); c.translate(gx, y, gz); por(B, M.plain, c, 0x3a3020); } }
    // fogueira apagada pela metade (brasas)
    { const fx = X + 3.4, fz = Z - 3.6;
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const g = new THREE.DodecahedronGeometry(0.16); g.translate(fx + Math.cos(a) * 0.55, 0.08, fz + Math.sin(a) * 0.55); por(B, M.pedra, g, 0x4a4844); }
      for (let i = 0; i < 4; i++) { const g = new THREE.CylinderGeometry(0.06, 0.07, 0.8, 5); g.rotateZ(Math.PI / 2 - 0.2); g.rotateY(i * 0.8); g.translate(fx, 0.12, fz); por(B, M.madeira, g, 0x1a1410); }
      const e = new THREE.SphereGeometry(0.28, 8, 4); e.scale(1, 0.25, 1); e.translate(fx, 0.06, fz); por(B, M.aceso, e, 0xffffff);
      luz(fx, 0.6, fz, 30, 2, 0xff6a2a, 12, 5); }
  }

  // ---------- montagem ----------
  B.build(O); BR.build(O);
  await Promise.all(carga);
  const n = colGeo.reduce((a, g) => a + g.attributes.position.count, 0), p = new Float32Array(n * 3); let o = 0;
  colGeo.forEach(g => { p.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3; });
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(p, 3)); cg.computeBoundingSphere(); cg.computeBoundingBox();
  const colliders = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); colliders.userData.ns = 1; colliders.userData.noExport = 1; G.add(colliders);
  const cartaz = { x: FORCA.x + 4.2 - 0.09, y: 1.3, z: FORCA.z + 7.5, ry: -Math.PI / 2 };
  const nevoa = [0.08, 0.2, 0.33, 0.46, 0.6, 0.72, 0.84, 0.95].map(u => naTrilha(u));
  return { floors, colliders, cartaz, nevoa };
}
