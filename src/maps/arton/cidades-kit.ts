// Sul de Arton — ferramentas das cidades: ruas (fitas sobre o relevo), lotes ao longo das ruas, casas de cada povo,
// muralhas que seguem o relevo (torres, portões onde as estradas chegam, arcos sobre os rios), paliçadas, praças,
// barracas, poços, chafarizes, estátuas, templos, castelos, salões, armazéns, arenas, moinhos que giram, cais, navios,
// lavouras, pomares e vinhedos. Duas camadas: o grosso (com sombra) e os detalhes miúdos (janelas, portas, ameias,
// barracas, lampiões, carroças), que somem quando a câmera está longe.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Batch, mtx } from '../mexico/common';
import { boxUV, pbr } from '../../core/pbr';
import { peca } from '../barud/mobilia';
import { CFG } from '../../core/config';
import { type Muro, ESTRADAS, Y, Ysolo, rnd, dentroMuro, ocupar, raioMuro } from './geo';
import { MM, type Mini, chao, inclinacao, pertoDeRio } from './miniaturas';

export type V = [number, number];
export type Peca = ReturnType<typeof peca>;
type Mat = THREE.Material;
export const Q = CFG.quality;

// ---------- estado do lote ----------
export let BC: Batch, BD: Batch, OUT: Mini, CM: ReturnType<typeof matsCidade>;
const CHAO = new Map<Mat, THREE.BufferGeometry[]>();
export const PONTES_C: { x: number; z: number; a: number; L: number; y: number; larg: number; cor: number }[] = [];
const MOINHOS: { x: number; y: number; z: number; ry: number; s: number }[] = [];
const ANIM: ((t: number) => void)[] = [];
let nFumo = 0;

function matsCidade() {
  const piso = (id: string, size: number, cor: number, off: number) => { const m = pbr(id, { size, color: cor }).clone(); m.vertexColors = true; m.polygonOffset = true; m.polygonOffsetFactor = off; m.polygonOffsetUnits = off; return m; };
  const vc = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.vertexColors = true; return c; };
  return {
    calcada: piso('cobblestone_floor_08', 0.9, 0xa49888, -5),
    lajota: piso('monastery_stone_floor', 1.4, 0xd8d0c4, -6),
    terra: piso('dry_ground_rocks', 2.5, 0x8a7458, -5),
    areia: piso('sandy_gravel', 1.6, 0xe0d0a8, -6),
    campo: piso('withered_grass', 1.2, 0xffffff, -3),
    agua: (() => { const m = (MM.agua as THREE.MeshStandardMaterial).clone(); m.polygonOffset = true; m.polygonOffsetFactor = -7; m.polygonOffsetUnits = -7; return m; })(),
    tijolo: vc(pbr('red_brick', { size: 0.9 })),
    janela: new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 0.45, metalness: 0.1 }),
    vitral: new THREE.MeshBasicMaterial({ color: 0xd89a50 }),
    arcano: new THREE.MeshBasicMaterial({ color: 0xb08cff }),
    forja: new THREE.MeshBasicMaterial({ color: 0xff7a30 }),
  };
}
export function iniciarKit(out: Mini, lamps: THREE.MeshBasicMaterial[]) {
  BC = new Batch('cidades'); BD = new Batch('cidades: detalhes'); OUT = out; CM = matsCidade(); CM.campo.color.setRGB(1.55, 1.42, 1.05); lamps.push(CM.vitral, CM.arcano, CM.forja);
  CHAO.clear(); PONTES_C.length = 0; MOINHOS.length = 0; ANIM.length = 0; nFumo = 0;
}

// ---------- utilidades ----------
export const pick = <T,>(a: readonly T[]) => a[(rnd() * a.length) | 0];
export const entreR = (a: number, b: number) => a + (b - a) * rnd();
export const Pc = (x: number, y: number, z: number, ry = 0, s = 1) => peca(BC, mtx(x, y, z, ry, s), 0, 0, 0);
export const det = (p: Peca) => peca(BD, p.m, 0, 0, 0);
export function geo(B: Batch, mat: Mat, g: THREE.BufferGeometry, cor: number, m?: THREE.Matrix4) { if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals(); boxUV(g); B.add(mat, g, cor); }
export function plano(B: Batch, m: THREE.Matrix4, mat: Mat, w: number, h: number, x: number, y: number, z: number, ry: number, cor: number) { const g = new THREE.PlaneGeometry(w, h); if (ry) g.rotateY(ry); g.translate(x, y, z); geo(B, mat, g, cor, m); }
export function cone(p: Peca, mat: Mat, r: number, h: number, x: number, y: number, z: number, cor: number, lados = 8, rot = 0, B = BC) { const g = new THREE.ConeGeometry(r, h, lados); if (rot) g.rotateY(rot); g.translate(x, y + h / 2, z); geo(B, mat, g, cor, p.m); }
export function cupula(p: Peca, mat: Mat, r: number, x: number, y: number, z: number, cor: number, sy = 1) { const g = new THREE.SphereGeometry(r, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, sy, 1); g.translate(x, y, z); geo(BC, mat, g, cor, p.m); }
/** fumaça de chaminé (limitada: muitas colunas pesam) */
export function fumo(v: THREE.Vector3, chance = 1) { if (nFumo < 150 && rnd() < chance) { OUT.fumaca.push(v); nFumo++; } }
export const luz = (x: number, y: number, z: number, cor = 0xffa050, n = 22, dist = 9) => OUT.luzes.push({ x, y, z, cor, n, dist });
export const brilho = (x: number, y: number, z: number, s: number) => OUT.halos.push([x, y, z, s]);

// caixas orientadas (pegadas das casas) e segmentos de rua
export interface Caixa { x: number; z: number; hw: number; hd: number; c: number; s: number }
export const caixa = (x: number, z: number, hw: number, hd: number, ry: number): Caixa => ({ x, z, hw, hd, c: Math.cos(ry), s: Math.sin(ry) });
function sobrepoe(A: Caixa, B: Caixa) {
  const dx = B.x - A.x, dz = B.z - A.z;
  for (const [ax, az] of [[A.c, -A.s], [A.s, A.c], [B.c, -B.s], [B.s, B.c]]) {
    const ra = A.hw * Math.abs(A.c * ax - A.s * az) + A.hd * Math.abs(A.s * ax + A.c * az), rb = B.hw * Math.abs(B.c * ax - B.s * az) + B.hd * Math.abs(B.s * ax + B.c * az);
    if (Math.abs(dx * ax + dz * az) > ra + rb) return false;
  }
  return true;
}
function distSegCaixa(B: Caixa, ax: number, az: number, bx: number, bz: number) {
  const u1 = (ax - B.x) * B.c - (az - B.z) * B.s, v1 = (ax - B.x) * B.s + (az - B.z) * B.c, u2 = (bx - B.x) * B.c - (bz - B.z) * B.s, v2 = (bx - B.x) * B.s + (bz - B.z) * B.c, du = u2 - u1, dv = v2 - v1;
  let t0 = 0, t1 = 1;
  const clip = (p: number, q: number) => { if (p === 0) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
  if (clip(-du, u1 + B.hw) && clip(du, B.hw - u1) && clip(-dv, v1 + B.hd) && clip(dv, B.hd - v1)) return 0;
  const pb = (u: number, v: number) => Math.hypot(Math.max(Math.abs(u) - B.hw, 0), Math.max(Math.abs(v) - B.hd, 0));
  const ps = (u: number, v: number) => { const L2 = du * du + dv * dv || 1e-9; const t = Math.max(0, Math.min(1, ((u - u1) * du + (v - v1) * dv) / L2)); return Math.hypot(u - u1 - du * t, v - v1 - dv * t); };
  return Math.min(pb(u1, v1), pb(u2, v2), ps(B.hw, B.hd), ps(-B.hw, B.hd), ps(B.hw, -B.hd), ps(-B.hw, -B.hd));
}
export function comprimentos(pts: V[]) { const a = [0]; for (let i = 1; i < pts.length; i++) a.push(a[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return a; }
/** ponto e tangente (unitária) a uma distância s ao longo da linha */
export function noPonto(pts: V[], acc: number[], s: number): [number, number, number, number] {
  s = Math.max(0, Math.min(acc[acc.length - 1], s)); let i = 1; while (i < acc.length - 1 && acc[i] < s) i++;
  const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = acc[i] - acc[i - 1] || 1e-6, f = (s - acc[i - 1]) / L;
  return [ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / L, (bz - az) / L];
}
export function reamostra(pts: V[], passo: number): V[] {
  const out: V[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / passo)); for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]); }
  return out;
}
export const arco = (cx: number, cz: number, r: number, a0: number, a1: number, passo = 0.4): V[] => { const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / passo)); return Array.from({ length: n + 1 }, (_, k) => { const a = a0 + ((a1 - a0) * k) / n; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r] as V; }); };

// ---------- a cidade: pegadas ocupadas, ruas, área ----------
export class Cid {
  caixas = new Map<string, Caixa[]>(); segs = new Map<string, { ax: number; az: number; bx: number; bz: number; hw: number }[]>(); circ: [number, number, number][] = [];
  /** ponto bom para construir (dentro do muro, seco, sem ribanceira) */
  area: (x: number, z: number, r: number) => boolean;
  constructor(public x: number, public z: number, public muro: Muro | null = null) {
    this.area = (x2, z2, r) => !this.muro || this.muro.tipo === 'aberta' || dentroMuro(this.muro, x2, z2) > r + 0.32;
  }
  L = (u: number, v: number): V => [this.x + u, this.z + v];
  Ls = (a: V[]) => a.map(([u, v]) => this.L(u, v));
  private ks(x0: number, x1: number, z0: number, z1: number, f: (k: string) => void) { for (let i = Math.floor(x0); i <= Math.floor(x1); i++) for (let j = Math.floor(z0); j <= Math.floor(z1); j++) f(i + ',' + j); }
  ocupar(B: Caixa) { const r = Math.hypot(B.hw, B.hd); this.ks(B.x - r, B.x + r, B.z - r, B.z + r, k => { let L = this.caixas.get(k); if (!L) this.caixas.set(k, (L = [])); L.push(B); }); }
  /** reserva um retângulo (praça, prédio grande) */
  reservar(x: number, z: number, w: number, d: number, ry = 0) { this.ocupar(caixa(x, z, w / 2, d / 2, ry)); }
  bloquear(x: number, z: number, r: number) { this.circ.push([x, z, r]); }
  seg(ax: number, az: number, bx: number, bz: number, hw: number) { const s = { ax, az, bx, bz, hw }; this.ks(Math.min(ax, bx) - hw, Math.max(ax, bx) + hw, Math.min(az, bz) - hw, Math.max(az, bz) + hw, k => { let L = this.segs.get(k); if (!L) this.segs.set(k, (L = [])); L.push(s); }); }
  livre(B: Caixa, folga = 0.03) {
    const r = Math.hypot(B.hw, B.hd);
    for (const [cx, cz, cr] of this.circ) { if (Math.hypot(cx - B.x, cz - B.z) > cr + r) continue; const u = (cx - B.x) * B.c - (cz - B.z) * B.s, v = (cx - B.x) * B.s + (cz - B.z) * B.c; if (Math.hypot(Math.max(Math.abs(u) - B.hw, 0), Math.max(Math.abs(v) - B.hd, 0)) < cr) return false; }
    let ok = true;
    this.ks(B.x - r - 0.6, B.x + r + 0.6, B.z - r - 0.6, B.z + r + 0.6, k => {
      if (!ok) return;
      for (const C of this.caixas.get(k) || []) if (sobrepoe(B, C)) { ok = false; return; }
      for (const s of this.segs.get(k) || []) if (distSegCaixa(B, s.ax, s.az, s.bx, s.bz) < s.hw + folga) { ok = false; return; }
    });
    return ok;
  }
  /** chão firme e permitido para uma pegada */
  bom(x: number, z: number, r: number, inc = 1.3) { return Y(x, z) > 0.3 && !pertoDeRio(x, z, r + 0.15) && inclinacao(x, z, r) < inc && this.area(x, z, r); }
  /** rua: registra (para as casas desviarem) e desenha. Devolve os pontos reamostrados */
  rua(pts: V[], larg: number, mat: Mat = CM.calcada, o: { desenhar?: boolean; cor?: number; ponte?: number } = {}) {
    const r = reamostra(pts, 0.3);
    for (let i = 1; i < r.length; i++) this.seg(r[i - 1][0], r[i - 1][1], r[i][0], r[i][1], larg / 2);
    if (o.desenhar !== false) { pontesDaRua(r, larg, o.ponte ?? 0x9a948a); FAIXAS.push({ pts: r, larg, mat, cor: o.cor ?? 0xffffff }); }
    return r;
  }
  /** a estrada (de terra) que passa pela vila também é rua */
  estradasPerto(raio: number) {
    const out: V[][] = [];
    for (const R of ESTRADAS) { let cur: V[] = []; for (const p of R) { if (Math.hypot(p[0] - this.x, p[1] - this.z) < raio) cur.push(p as V); else { if (cur.length > 1) out.push(cur); cur = []; } } if (cur.length > 1) out.push(cur); }
    out.forEach(r => this.rua(r, 0.62, CM.terra, { desenhar: false }));
    return out;
  }
  /** rua mais próxima (para alinhar casas soltas) */
  direcaoRua(x: number, z: number): number | null {
    let best = 1e9, ry: number | null = null;
    this.ks(x - 2, x + 2, z - 2, z + 2, k => { for (const s of this.segs.get(k) || []) { const ex = s.bx - s.ax, ez = s.bz - s.az, L2 = ex * ex + ez * ez || 1e-9, t = Math.max(0, Math.min(1, ((x - s.ax) * ex + (z - s.az) * ez) / L2)), px = s.ax + ex * t, pz = s.az + ez * t, d = Math.hypot(px - x, pz - z); if (d < best && d > 1e-4) { best = d; ry = Math.atan2(px - x, pz - z); } } });
    return ry;
  }
}

// ---------- ruas e pisos (malhas sobre o relevo, sem sombra) ----------
const FAIXAS: { pts: V[]; larg: number; mat: Mat; cor: number }[] = [];
export function addChao(mat: Mat, g: THREE.BufferGeometry) { let L = CHAO.get(mat); if (!L) CHAO.set(mat, (L = [])); L.push(g); }
export function yRuaC(x: number, z: number) { let y = Ysolo(x, z); for (const p of PONTES_C) { const d = Math.hypot(p.x - x, p.z - z); if (d < p.L / 2 + 1.4) y = Math.max(y, p.y + 0.1 - Math.max(0, d - p.L / 2) * 0.16); } return y; }
function corAttr(g: THREE.BufferGeometry, cor: number) { const c = new THREE.Color(cor), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
function faixa(pts: V[], larg: number, cor: number, ergue = 0.05) {
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1, nx = (-tz / L) * larg / 2, nz = (tx / L) * larg / 2, [x, z] = pts[i];
    for (const s of [1, -1]) { const px = x + nx * s, pz = z + nz * s; pos.push(px, yRuaC(px, pz) + ergue, pz); }
    if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); boxUV(g); corAttr(g, cor);
  return g;
}
/** piso sobre o relevo: círculo (r) ou retângulo (w × d girado ry) */
export function piso(x: number, z: number, f: { r?: number; w?: number; d?: number; ry?: number }, mat: Mat, cor = 0xffffff, ergue = 0.045) {
  const pos: number[] = [], idx: number[] = [];
  if (f.r) {
    const nr = Math.max(2, Math.ceil(f.r / 0.45)), ns = Math.max(14, Math.ceil((f.r * 6.283) / 0.45));
    pos.push(x, yRuaC(x, z) + ergue, z);
    for (let i = 1; i <= nr; i++) for (let j = 0; j < ns; j++) { const a = (j / ns) * 6.283, r = (f.r * i) / nr, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; pos.push(px, yRuaC(px, pz) + ergue, pz); }
    for (let j = 0; j < ns; j++) idx.push(0, 1 + ((j + 1) % ns), 1 + j);
    for (let i = 1; i < nr; i++) for (let j = 0; j < ns; j++) { const a = 1 + (i - 1) * ns + j, b = 1 + (i - 1) * ns + ((j + 1) % ns), c = a + ns, d = b + ns; idx.push(a, b, d, a, d, c); }
  } else {
    const w = f.w!, d = f.d!, c = Math.cos(f.ry ?? 0), s = Math.sin(f.ry ?? 0), nx = Math.max(1, Math.ceil(w / 0.45)), nz = Math.max(1, Math.ceil(d / 0.45));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const u = (i / nx - 0.5) * w, v = (j / nz - 0.5) * d, px = x + u * c + v * s, pz = z - u * s + v * c; pos.push(px, yRuaC(px, pz) + ergue, pz); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, e = a + nx + 1, f2 = e + 1; idx.push(a, e, b, b, e, f2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // garante a face para cima
  const n = g.attributes.normal; let up = 0; for (let i = 0; i < n.count; i++) up += n.getY(i); if (up < 0) { const ix = g.index!.array as any; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } g.computeVertexNormals(); }
  boxUV(g); corAttr(g, cor); addChao(mat, g);
}

// ---------- pontes das ruas sobre os rios ----------
function pontesDaRua(pts: V[], larg: number, cor: number) {
  let ini = -1;
  for (let i = 0; i <= pts.length; i++) {
    const molhado = i < pts.length && pertoDeRio(pts[i][0], pts[i][1], 0.2);
    if (molhado && ini < 0) ini = i;
    if (!molhado && ini >= 0) {
      const A = pts[Math.max(0, ini - 2)], B = pts[Math.min(pts.length - 1, i + 1)], mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2;
      if (!PONTES_C.some(p => Math.hypot(p.x - mx, p.z - mz) < 1)) PONTES_C.push({ x: mx, z: mz, a: Math.atan2(B[0] - A[0], B[1] - A[1]), L: Math.hypot(B[0] - A[0], B[1] - A[1]) + 0.4, y: Math.max(Ysolo(A[0], A[1]), Ysolo(B[0], B[1])) + 0.06, larg, cor });
      ini = -1;
    }
  }
}
function construirPontes() {
  for (const pn of PONTES_C) {
    const p = Pc(pn.x, pn.y, pn.z, pn.a), q = det(p), L = pn.L, w = pn.larg + 0.16;
    p.cx(MM.pedra, w, 0.12, L, 0, -0.02, 0, pn.cor);
    for (const s of [-1, 1]) { p.cx(MM.pedra, 0.06, 0.12, L, s * (w / 2 - 0.03), 0.09, 0, pn.cor); for (let k = 0; k <= 4; k++) q.cx(MM.pedra, 0.08, 0.05, 0.08, s * (w / 2 - 0.03), 0.17, -L / 2 + (k * L) / 4, 0x7a746a); }
    const nArc = Math.max(1, Math.round(L / 1.6)); for (let k = 0; k < nArc; k++) { const r = Math.min(0.75, L / (nArc * 2) * 0.85), a = new THREE.TorusGeometry(r, 0.12, 5, 12, Math.PI); a.rotateY(Math.PI / 2); a.scale(1, 0.8, 1); a.translate(0, -0.08, -L / 2 + (L * (k + 0.5)) / nArc); geo(BC, MM.pedra, a, 0x847e74, p.m); }
    for (let k = 1; k < nArc; k++) p.cx(MM.pedra, w * 0.8, 1.1, 0.22, 0, -0.62, -L / 2 + (k * L) / nArc, 0x7a746a);
    for (const s of [-1, 1]) p.cx(MM.pedra, w, 1.0, 0.3, 0, -0.55, s * L * 0.46, 0x6a645a);
  }
}

// ---------- telhados (cumeeira ao longo de x; 'z' gira 90°) ----------
function geoTelhado(w: number, d: number, h: number, b: number, quatro: boolean) {
  const W = w / 2 + b, D = d / 2 + b, e = (-b * h) / (d / 2), r = quatro ? Math.max(0, W - D) : W, t: number[] = [];
  const A = [-W, e, D], B = [W, e, D], C = [r, h, 0], Dd = [-r, h, 0], E = [W, e, -D], F = [-W, e, -D];
  const tri = (a: number[], b2: number[], c: number[]) => t.push(...a, ...b2, ...c);
  tri(A, B, C); tri(A, C, Dd); tri(E, F, Dd); tri(E, Dd, C); if (quatro) { tri(B, E, C); tri(F, A, Dd); }
  const teto = new THREE.BufferGeometry(); teto.setAttribute('position', new THREE.Float32BufferAttribute(t, 3)); teto.computeVertexNormals();
  let oitao: THREE.BufferGeometry | null = null;
  if (!quatro) { const hw = w / 2, hd = d / 2; oitao = new THREE.BufferGeometry(); oitao.setAttribute('position', new THREE.Float32BufferAttribute([hw, 0, hd, hw, 0, -hd, hw, h, 0, -hw, 0, -hd, -hw, 0, hd, -hw, h, 0], 3)); oitao.computeVertexNormals(); }
  return { teto, oitao };
}
export interface OpTelhado { quatro?: boolean; cumeeira?: 'x' | 'z'; b?: number; parede?: [Mat, number]; px?: number; pz?: number }
export function telhado(p: Peca, mat: Mat, w: number, d: number, h: number, y: number, cor: number, o: OpTelhado = {}) {
  const b = o.b ?? 0.05, emZ = (o.cumeeira ?? (w >= d ? 'x' : 'z')) === 'z';
  const { teto, oitao } = geoTelhado(emZ ? d : w, emZ ? w : d, h, b, !!o.quatro);
  for (const g of [teto, oitao]) if (g) { if (emZ) g.rotateY(Math.PI / 2); g.translate(o.px ?? 0, y, o.pz ?? 0); }
  geo(BC, mat, teto, cor, p.m); if (oitao) geo(BC, o.parede?.[0] ?? mat, oitao, o.parede?.[1] ?? cor, p.m);
}

// ---------- casas ----------
export type Est = 'barud' | 'lom' | 'deh' | 'valk' | 'oeste' | 'tap' | 'giluk' | 'ilha' | 'ruina' | 'barraco';
export interface OC { and?: number; luz?: number; cumeeira?: 'x' | 'z'; loja?: number; fumo?: number; coral?: boolean; cor?: number }
function janela(q: Peca, x: number, y: number, z: number, ry: number, acesa: boolean, persiana?: number) {
  plano(BD, q.m, acesa ? MM.aceso : CM.janela, 0.06, 0.08, x, y, z, ry, 0xffffff);
  if (persiana !== undefined) for (const s of [-1, 1]) { const dx = Math.cos(ry) * s * 0.05, dz = -Math.sin(ry) * s * 0.05; plano(BD, q.m, MM.plain, 0.035, 0.085, x + dx, y, z + dz, ry, persiana); }
}
interface OpFachada { esp?: number; y0?: number; de?: number; persiana?: number; porta?: number; saliente?: number; semPorta?: boolean }
export function fachada(q: Peca, w: number, d: number, and: number, hA: number, luz: number, o: OpFachada = {}) {
  const y0 = o.y0 ?? 0, zf = d / 2 + 0.006, pw = Math.min(0.1, w * 0.24), ph = Math.min(0.18, hA * 0.62), px = (rnd() - 0.5) * Math.max(0, w - pw * 2.4);
  if (!o.semPorta) plano(BD, q.m, MM.madeira, pw, ph, px, y0 + ph / 2 - 0.01, zf, 0, o.porta ?? 0x3a2a1e);
  for (let a = o.de ?? 0; a < and; a++) {
    const n = Math.max(1, Math.round(w / (o.esp ?? 0.24))), yj = y0 + a * hA + hA * 0.6, z = zf + (a > 0 ? o.saliente ?? 0 : 0);
    for (let k = 0; k < n; k++) { const u = ((k + 0.5) / n - 0.5) * w; if (a === 0 && !o.semPorta && Math.abs(u - px) < pw) continue; janela(q, u, yj, z, 0, rnd() < luz, o.persiana); }
  }
  if (d > 0.4) for (const s of [-1, 1]) if (rnd() < 0.5) janela(q, s * (w / 2 + 0.006), y0 + hA * 0.6, (rnd() - 0.5) * d * 0.4, s * Math.PI / 2, rnd() < luz * 0.7);
}
/** vigas do enxaimel na frente do andar de cima */
function enxaimel(q: Peca, w: number, d: number, y0: number, y1: number, cor = 0x3a2a1e) {
  const z = d / 2 + 0.006, h = y1 - y0;
  plano(BD, q.m, MM.madeira, w, 0.022, 0, y0 + 0.011, z, 0, cor); plano(BD, q.m, MM.madeira, w, 0.022, 0, y1 - 0.011, z, 0, cor);
  for (const u of [-0.5, -0.17, 0.17, 0.5]) plano(BD, q.m, MM.madeira, 0.022, h, u * (w - 0.022), y0 + h / 2, z, 0, cor);
  for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(0.018, Math.hypot(w * 0.33, h) * 0.95); g.rotateZ(s * Math.atan2(w * 0.33, h)); g.translate(s * w * 0.33, y0 + h / 2, z); geo(BD, MM.madeira, g, cor, q.m); }
}
function chamine(p: Peca, w: number, d: number, H: number, hT: number, cum: 'x' | 'z', cor: number, chance = 0.25) {
  const [cx, cz] = cum === 'x' ? [(rnd() < 0.5 ? -1 : 1) * w * 0.28, -d * 0.1] : [w * 0.1, (rnd() < 0.5 ? -1 : 1) * d * 0.28], h = hT * 0.85 + 0.12;
  p.cx(MM.pedra, 0.075, h, 0.075, cx, H + h / 2, cz, cor); fumo(p.pos(cx, H + h + 0.05, cz), chance);
}
const corpo = (p: Peca, mat: Mat, w: number, d: number, H: number, cor: number) => p.cx(mat, w, H + 0.16, d, 0, (H - 0.16) / 2, 0, cor);

export function casa(x: number, z: number, ry: number, w: number, d: number, est: Est, o: OC = {}) {
  const and = o.and ?? 1, lz = o.luz ?? 0.4, y0 = chao(x, z, Math.max(w, d) * 0.5), p = Pc(x, y0, z, ry), q = det(p);
  const cum = o.cumeeira ?? (rnd() < 0.72 ? 'x' : 'z'), fch = o.fumo ?? 0.22;
  switch (est) {
    case 'barud': case 'lom': {
      const hA = 0.3, H = hA * and, cor = o.cor ?? pick(est === 'barud' ? [0xb8a890, 0xa89880, 0xc4b49c, 0x9a8a74, 0xb09272, 0xc0a88a] : [0xc8a878, 0xb89a6a, 0xd4bc94, 0xa88e66, 0xc0a070]);
      corpo(p, MM.reboco, w, d, H, cor);
      if (and > 1 && rnd() < 0.45) enxaimel(q, w, d, hA, H);
      const palha = est === 'lom' ? rnd() < 0.55 : rnd() < 0.06, hT = d * (palha ? 0.62 : 0.46);
      telhado(p, palha ? MM.palha : MM.telha, w, d, hT, H, palha ? pick([0xb8a062, 0xa89058, 0xc0a868, 0x9a8450]) : pick([0x8a4a32, 0x7a3e2a, 0x9a5a3a, 0x6e3a28, 0x84503a]), { cumeeira: cum, parede: [MM.reboco, cor] });
      if (rnd() < 0.5) chamine(p, w, d, H, hT, cum, 0x8a7e70, fch);
      fachada(q, w, d, and, hA, lz); break;
    }
    case 'deh': {
      const hA = 0.32, H = hA * and, cor = o.cor ?? pick([0xece2cc, 0xf2ead8, 0xe6dcc4, 0xf0e4d0, 0xe8dcc0]), e = and > 1 ? 0.05 : 0;
      if (and > 1) { corpo(p, MM.reboco, w, d, hA, cor); p.cx(MM.reboco, w + e, H - hA, d + e, 0, hA + (H - hA) / 2, 0, cor); enxaimel(q, w + e, d + e, hA, H); }
      else { corpo(p, MM.reboco, w, d, H, cor); for (const s of [-1, 1]) plano(BD, q.m, MM.madeira, 0.022, H, s * (w / 2 - 0.011), H / 2, d / 2 + 0.006, 0, 0x3a2a1e); }
      const ard = rnd() < 0.22, hT = d * 0.72;
      telhado(p, ard ? MM.ardosia : MM.telha, w + e, d + e, hT, H, ard ? pick([0x4a4a56, 0x56566a]) : pick([0xa84a32, 0x9a3e2a, 0x8a4a3a, 0xb4583a]), { cumeeira: cum, parede: [MM.reboco, cor] });
      if (rnd() < 0.6) chamine(p, w, d, H, hT, cum, 0x8a6a58, fch);
      fachada(q, w, d, and, hA, lz, { saliente: e / 2 }); break;
    }
    case 'valk': {
      const hA = 0.36, H = hA * and, cor = o.cor ?? pick([0xe4dcee, 0xd8d0e4, 0xeee8f2, 0xd4d0dc, 0xe8e0d4, 0xdcd4c8]);
      corpo(p, MM.marmore, w, d, H, cor); q.cx(MM.marmore, w + 0.04, 0.03, d + 0.04, 0, H - 0.01, 0, 0xc4bcd0);
      const r = rnd();
      if (r < 0.55) telhado(p, MM.ardosia, w, d, d * 0.5, H, pick([0x7a86a8, 0x6a7898, 0x8a94b4, 0x5a6888]), { quatro: true });
      else if (r < 0.85) telhado(p, MM.telha, w, d, d * 0.5, H, pick([0x9a5a4a, 0x8a4a3a, 0xa0604a]), { cumeeira: cum, parede: [MM.marmore, cor] });
      else { p.cx(MM.marmore, w + 0.03, 0.05, d + 0.03, 0, H + 0.02, 0, cor); cupula(p, MM.ouro, Math.min(w, d) * 0.32, 0, H + 0.04, 0, 0xe8c058); }
      if (rnd() < 0.1) { p.cil(MM.marmore, 0.1, H + 0.3, w / 2, -0.1, d / 2, cor, 8); cone(p, MM.ardosia, 0.13, 0.3, w / 2, H + 0.2, d / 2, 0x6a7898, 8); }
      fachada(q, w, d, and, hA, lz, { esp: 0.2 }); break;
    }
    case 'oeste': {
      const hA = 0.3, H = hA * and, cor = o.cor ?? (rnd() < 0.78 ? pick([0xf4f0e6, 0xf0e8d8, 0xf8f4ec, 0xece4d4]) : pick([0xe8c890, 0xc8d4e0, 0xecc8b8, 0xe0d0a0]));
      corpo(p, MM.reboco, w, d, H, cor);
      if (rnd() < 0.3) { // terraço com mureta e plantas
        p.cx(MM.reboco, w + 0.02, 0.04, d + 0.02, 0, H + 0.01, 0, cor);
        for (const [a, b2, c2, e2] of [[w, 0.025, 0, d / 2], [w, 0.025, 0, -d / 2], [0.025, d, w / 2, 0], [0.025, d, -w / 2, 0]]) q.cx(MM.reboco, a, 0.06, b2, c2, H + 0.05, e2, cor);
        if (rnd() < 0.6) q.esf(MM.plain, 0.05, (rnd() - 0.5) * w * 0.6, H + 0.07, (rnd() - 0.5) * d * 0.6, 0x4a7a3a);
      } else telhado(p, MM.telha, w, d, d * 0.32, H, pick([0xc8683a, 0xb85a30, 0xd07848, 0xc06040]), { quatro: rnd() < 0.5, cumeeira: cum, parede: [MM.reboco, cor] });
      fachada(q, w, d, and, hA, lz, { persiana: rnd() < 0.45 ? pick([0x3a6aa0, 0x4a8a6a, 0x2a5a8a]) : undefined }); break;
    }
    case 'tap': {
      const hA = 0.32, H = hA * and, tij = rnd() < 0.55, cor = o.cor ?? (tij ? pick([0xc8806a, 0xb87058, 0xd8907a]) : pick([0xe0c498, 0xd4b080, 0xe8d0a8]));
      corpo(p, tij ? CM.tijolo : MM.reboco, w, d, H, cor);
      telhado(p, MM.telha, w, d, d * 0.28, H, pick([0xc0603a, 0xb05030, 0xc87048]), { quatro: true });
      const n = Math.max(1, Math.round(w / 0.3)); for (let k = 0; k < n; k++) plano(BD, q.m, CM.janela, 0.12, 0.15, ((k + 0.5) / n - 0.5) * w, 0.075, d / 2 + 0.006, 0, 0xffffff);
      fachada(q, w, d, and, hA, lz, { de: 1, semPorta: true, esp: 0.18 }); break;
    }
    case 'giluk': {
      const hA = 0.32, H = hA * and, cm = o.cor ?? pick([0x8a6a48, 0x7a5a3a, 0x94704a, 0x6a4e34]), hT = d * 0.6;
      p.cx(MM.pedra, w + 0.06, 0.24, d + 0.06, 0, -0.04, 0, 0x8a867e); p.cx(MM.madeira, w, H, d, 0, 0.08 + H / 2, 0, cm);
      telhado(p, MM.neve, w, d, hT, 0.08 + H, pick([0xd8e2ee, 0xe2eaf4, 0xccd8e6]), { cumeeira: 'x', b: 0.05, parede: [MM.madeira, cm] });
      p.cx(MM.madeira, w + 0.12, 0.035, 0.035, 0, 0.08 + H + hT + 0.01, 0, 0x4a3424); // cumeeira de tronco
      for (const s of [-1, 1]) for (const r2 of [-0.55, 0.55]) q.cx(MM.madeira, 0.02, 0.2, 0.02, s * (w / 2 + 0.07), 0.08 + H + hT + 0.04, 0, 0x4a3424, r2);
      fumo(p.pos(w * 0.2, 0.08 + H + hT + 0.1, 0), fch * 1.4);
      fachada(q, w, d, and, hA, lz, { y0: 0.08 }); break;
    }
    case 'ilha': {
      const hA = 0.28, yb = 0.16;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) q.cx(MM.madeira, 0.03, 0.5, 0.03, sx * w * 0.42, yb - 0.25, sz * d * 0.42, 0x4a3a2a);
      p.cx(MM.madeira, w, hA, d, 0, yb + hA / 2, 0, o.cor ?? pick([0x7a6a54, 0x8a7a60, 0x6a5a44]));
      telhado(p, MM.palha, w, d, d * 0.6, yb + hA, pick([0x8a7a50, 0x9a8a5a]), { cumeeira: cum, parede: [MM.madeira, 0x6a5a44] });
      fachada(q, w, d, 1, hA, lz, { y0: yb }); break;
    }
    case 'ruina': {
      const cor = o.cor ?? pick([0x9a8a78, 0x8a7e70, 0xa89880]);
      p.cx(MM.reboco, w, 0.12 + rnd() * 0.3, 0.05, 0, 0.08, d / 2, cor); p.cx(MM.reboco, 0.05, 0.2 + rnd() * 0.25, d, -w / 2, 0.08, 0, cor);
      if (rnd() < 0.6) p.cx(MM.reboco, 0.05, 0.1 + rnd() * 0.2, d * 0.7, w / 2, 0.04, -d * 0.1, cor);
      q.cx(MM.madeira, w * 0.9, 0.025, 0.03, 0, 0.32, d * 0.1, 0x2e241c, 0.3);
      for (let i = 0; i < 3; i++) q.cx(MM.pedra, 0.08, 0.05, 0.07, (rnd() - 0.5) * w, 0.0, (rnd() - 0.5) * d, 0x7a7068, rnd());
      break;
    }
    case 'barraco': {
      const H = 0.2 + rnd() * 0.07;
      p.cx(MM.madeira, w, H + 0.1, d, 0, (H - 0.1) / 2, 0, o.cor ?? pick([0xa89878, 0x9a8a6a, 0xb8a888, 0x8a7a60]));
      p.cx(rnd() < 0.5 ? MM.palha : MM.madeira, w + 0.08, 0.025, d + 0.1, 0, H + 0.03, 0, pick([0xa89060, 0x7a6a50, 0x8a7a58]), 0, 0.2);
      if (rnd() < 0.35) janela(q, 0, H * 0.6, d / 2 + 0.006, 0, rnd() < lz);
      break;
    }
  }
  if (o.loja !== undefined) { const g = new THREE.PlaneGeometry(Math.min(0.34, w * 0.8), 0.14); g.rotateX(-1.0); g.translate(0, 0.27, d / 2 + 0.07); geo(BC, MM.tecido, g, o.loja, p.m); }
  return p;
}

// ---------- lotes: casas ao longo de uma rua, viradas para ela ----------
export interface OpLote { lados?: number[]; recuo?: number; w: [number, number]; d: [number, number]; gap?: [number, number]; prob?: number; ini?: number; fim?: number; ok?: (x: number, z: number) => boolean; casa: (x: number, z: number, ry: number, w: number, d: number, i: number) => void; vazio?: (x: number, z: number, ry: number) => void }
export function casasNaRua(c: Cid, pts: V[], larg: number, o: OpLote) {
  const acc = comprimentos(pts), tot = acc[acc.length - 1]; let n = 0;
  for (const sd of o.lados ?? [-1, 1]) {
    let s = o.ini ?? 0.15; const fim = Math.min(tot, o.fim ?? tot) - 0.15;
    while (s < fim) {
      const w = entreR(o.w[0], o.w[1]), d = entreR(o.d[0], o.d[1]), [px, pz, tx, tz] = noPonto(pts, acc, s + w / 2), nx = -tz, nz = tx, off = larg / 2 + (o.recuo ?? 0.03) + d / 2;
      const x = px + nx * sd * off, z = pz + nz * sd * off, ry = Math.atan2(-nx * sd, -nz * sd), B = caixa(x, z, w / 2, d / 2, ry);
      if ((!o.ok || o.ok(x, z)) && c.bom(x, z, Math.max(w, d) * 0.5) && c.livre(B)) {
        if (o.prob === undefined || rnd() < o.prob) { c.ocupar(B); o.casa(x, z, ry, w, d, n++); } else { c.ocupar(caixa(x, z, w / 2, d / 2, ry)); o.vazio?.(x, z, ry); }
        s += w + entreR(...(o.gap ?? [0.02, 0.08]));
      } else s += 0.1;
    }
  }
  return n;
}
/** casas soltas (fundos de quarteirão, periferia), alinhadas com a rua mais perto */
export function preencher(c: Cid, n: number, amostra: () => V, o: { w: [number, number]; d: [number, number]; ok?: (x: number, z: number) => boolean; casa: (x: number, z: number, ry: number, w: number, d: number) => void }) {
  let k = 0;
  for (let i = 0; i < n; i++) {
    const [x, z] = amostra(), w = entreR(o.w[0], o.w[1]), d = entreR(o.d[0], o.d[1]), r0 = c.direcaoRua(x, z), ry = r0 === null ? rnd() * 6.283 : r0 + (rnd() < 0.2 ? Math.PI / 2 : 0), B = caixa(x, z, w / 2, d / 2, ry);
    if ((!o.ok || o.ok(x, z)) && c.bom(x, z, Math.max(w, d) * 0.5) && c.livre(B, 0.06)) { c.ocupar(B); o.casa(x, z, ry, w, d); k++; }
  }
  return k;
}

// ---------- muralhas, paliçadas e portões ----------
export interface Portao { x: number; z: number; tx: number; tz: number }
/** onde as estradas cruzam o contorno da cidade (tx,tz = direção para fora) */
export function portoes(m: Muro): Portao[] {
  const out: Portao[] = [];
  for (const R of ESTRADAS) for (let i = 1; i < R.length; i++) {
    const a = R[i - 1], b = R[i], da = dentroMuro(m, a[0], a[1]), db = dentroMuro(m, b[0], b[1]);
    if (da > 0 === db > 0) continue;
    const f = da / (da - db), x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, sg = db < da ? 1 : -1;
    if (!out.some(p => Math.hypot(p.x - x, p.z - z) < 1.4)) out.push({ x, z, tx: ((b[0] - a[0]) / L) * sg, tz: ((b[1] - a[1]) / L) * sg });
  }
  return out;
}
/** pontos ao longo do contorno (polígono ou círculo), com o índice da aresta */
export function contorno(m: Muro, passo: number): { x: number; z: number; e: number }[] {
  const out: { x: number; z: number; e: number }[] = [];
  if (m.pol) { const P = m.pol; for (let i = 0; i < P.length; i++) { const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / passo)); for (let k = 0; k < n; k++) out.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, e: i }); } }
  else { const n = Math.ceil((m.r * 6.283) / passo); for (let k = 0; k < n; k++) { const a = (k / n) * 6.283, rr = raioMuro(m, a); out.push({ x: m.x + Math.cos(a) * rr, z: m.z + Math.sin(a) * rr, e: Math.floor((k / n) * 12) }); } }
  return out;
}
export interface OpMuro { h: number; esp: number; cor: number; mat?: Mat; torre: { r: number; h: number; teto?: number; quadrada?: boolean; cada: number; tetoMat?: Mat }; portao: { larg: number; teto?: number }; bandeira?: number; ameias?: boolean }
export function muralha(m: Muro, gates: Portao[], o: OpMuro) {
  const pts = contorno(m, 0.32), n = pts.length, mat = o.mat ?? MM.pedra, pos: number[] = [], larg = o.portao.larg;
  const naPorta = (x: number, z: number, folga: number) => gates.some(g => Math.hypot(g.x - x, g.z - z) < larg / 2 + folga);
  const molhado = (x: number, z: number) => pertoDeRio(x, z, 0.25);
  const aberto = (e: number) => m.aberto?.includes(e);
  let agua: { x: number; z: number }[] = [];
  const arcos: { x: number; z: number }[][] = [];
  for (let i = 0; i < n; i++) {
    const A = pts[i], B = pts[(i + 1) % n]; if (m.pol && aberto(A.e)) continue;
    const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2;
    if (molhado(mx, mz)) { agua.push({ x: mx, z: mz }); continue; } else if (agua.length) { arcos.push(agua); agua = []; }
    if (naPorta(mx, mz, 0.02)) continue;
    const tx = B.x - A.x, tz = B.z - A.z, L = Math.hypot(tx, tz) || 1, nx = (-tz / L) * o.esp / 2, nz = (tx / L) * o.esp / 2;
    const yA = Ysolo(A.x, A.z), yB = Ysolo(B.x, B.z), h = o.h;
    const a0 = [A.x + nx, yA - 0.5, A.z + nz], b0 = [B.x + nx, yB - 0.5, B.z + nz], a1 = [A.x + nx, yA + h, A.z + nz], b1 = [B.x + nx, yB + h, B.z + nz];
    const c0 = [A.x - nx, yA - 0.5, A.z - nz], d0 = [B.x - nx, yB - 0.5, B.z - nz], c1 = [A.x - nx, yA + h, A.z - nz], d1 = [B.x - nx, yB + h, B.z - nz];
    pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1, ...d0, ...c0, ...c1, ...d0, ...c1, ...d1, ...c1, ...b1, ...d1, ...c1, ...a1, ...b1);
    // ameias do lado de fora
    if (o.ameias !== false && i % 2 === 0) { const fora = Math.sign((mx - m.x) * nx + (mz - m.z) * nz) || 1, q = peca(BD, mtx(mx + nx * fora * 0.75, (yA + yB) / 2 + h, mz + nz * fora * 0.75, Math.atan2(tx, tz)), 0, 0, 0); q.cx(mat, o.esp * 0.28, 0.09, 0.13, 0, 0.045, 0, o.cor); }
  }
  if (agua.length) arcos.push(agua);
  if (pos.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); geo(BC, mat, g, o.cor); }
  // arcos sobre o rio (portão d'água com grade)
  for (const A of arcos) {
    const a = A[0], b = A[A.length - 1], L = Math.hypot(b.x - a.x, b.z - a.z) + 0.6, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, y = Math.max(Ysolo(a.x, a.z), Ysolo(b.x, b.z));
    const p = Pc(mx, y, mz, Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2), q = det(p);
    p.cx(mat, o.esp + 0.04, o.h * 0.42, L, 0, o.h * 0.79, 0, o.cor); q.cx(MM.escuro, o.esp * 0.3, o.h * 0.4, L * 0.92, 0, o.h * 0.38, 0, 0x101010);
    const ar = new THREE.TorusGeometry(L * 0.45, 0.09, 5, 12, Math.PI); ar.scale(1, 0.75, 1); ar.translate(0, o.h * 0.55, 0); ar.rotateY(Math.PI / 2); geo(BC, mat, ar, o.cor, p.m);
  }
  // torres
  const T = o.torre, torres: V[] = [];
  if (m.pol) m.pol.forEach(([x, z], i) => { if (!aberto(i) || !aberto((i - 1 + m.pol!.length) % m.pol!.length)) torres.push([x, z]); });
  const passo = Math.max(1, Math.round(T.cada / 0.32));
  pts.forEach((P, i) => { if (i % passo === 0 && !aberto(P.e) && !torres.some(([x, z]) => Math.hypot(x - P.x, z - P.z) < T.cada * 0.6)) torres.push([P.x, P.z]); });
  for (const [x, z] of torres) {
    if (naPorta(x, z, T.r + 0.15) || pertoDeRio(x, z, T.r + 0.2)) continue;
    const y = Ysolo(x, z) - 0.6, p = Pc(x, y, z, rnd() * 6), q = det(p), H = T.h + 0.6;
    if (T.quadrada) { p.cx(mat, T.r * 1.8, H, T.r * 1.8, 0, H / 2, 0, o.cor); if (T.teto !== undefined) telhado(p, T.tetoMat ?? MM.telha, T.r * 1.8, T.r * 1.8, T.r * 1.3, H, T.teto, { quatro: true, b: 0.06 }); }
    else { p.cil(mat, T.r * 1.08, H, 0, 0, 0, o.cor, 10, T.r); if (T.teto !== undefined) cone(p, T.tetoMat ?? MM.telha, T.r * 1.18, T.r * 1.7, 0, H, 0, T.teto, 10); }
    if (T.teto === undefined) for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; q.cx(mat, 0.1, 0.1, 0.1, Math.cos(a) * T.r * 0.9, H + 0.05, Math.sin(a) * T.r * 0.9, o.cor); }
    janela(q, 0, H - 0.3, T.r + 0.004, 0, rnd() < 0.5);
    if (o.bandeira !== undefined && rnd() < 0.4) bandeira(p, 0, H + (T.teto !== undefined ? T.r * 1.7 : 0.1), 0, 0.5, o.bandeira, 0.8);
  }
  // portões: duas torres, verga e grade levantada
  for (const g of gates) {
    const y = Ysolo(g.x, g.z) - 0.4, p = Pc(g.x, y, g.z, Math.atan2(g.tx, g.tz)), q = det(p), H = o.h + 0.4, hw = larg / 2 + T.r * 0.9;
    for (const s of [-1, 1]) {
      p.cx(mat, T.r * 1.8, H + 0.5, T.r * 1.9 + o.esp * 0.5, s * hw, (H + 0.5) / 2, 0, o.cor);
      if (o.portao.teto !== undefined) telhado(p, MM.telha, T.r * 1.8, T.r * 1.9 + o.esp * 0.5, T.r * 1.2, H + 0.5, o.portao.teto, { quatro: true, px: s * hw });
      else for (let k = 0; k < 4; k++) q.cx(mat, 0.1, 0.1, 0.1, s * hw + (k % 2 ? 1 : -1) * T.r * 0.7, H + 0.55, (k < 2 ? 1 : -1) * T.r * 0.7, o.cor);
      janela(q, s * hw, H * 0.7, (T.r * 1.9 + o.esp * 0.5) / 2 + 0.006, 0, rnd() < 0.7);
      if (o.bandeira !== undefined) { const g2 = new THREE.PlaneGeometry(0.22, 0.5); g2.translate(s * hw, H * 0.55, (T.r * 1.9 + o.esp * 0.5) / 2 + 0.01); geo(BC, MM.tecido, g2, o.bandeira, p.m); }
    }
    p.cx(mat, larg + 0.25, H * 0.32, o.esp + 0.14, 0, H * 0.86, 0, o.cor);
    q.cx(MM.escuro, larg, 0.16, 0.03, 0, H * 0.62, o.esp / 2 + 0.05, 0x141210);
    brilho(g.x + g.tx * 0.5, Ysolo(g.x, g.z) + 0.5, g.z + g.tz * 0.5, 0.9);
  }
}
/** paliçada de estacas pontudas (faixa contínua com dentes) */
export function palicada(m: Muro, gates: Portao[], o: { h: number; cor?: number; larg?: number }) {
  const pts = contorno(m, 0.16), n = pts.length, pos: number[] = [], larg = o.larg ?? 0.55;
  for (let i = 0; i < n; i++) {
    const A = pts[i], B = pts[(i + 1) % n], mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2;
    if (gates.some(g => Math.hypot(g.x - mx, g.z - mz) < larg / 2) || pertoDeRio(mx, mz, 0.1)) continue;
    const tx = B.x - A.x, tz = B.z - A.z, L = Math.hypot(tx, tz) || 1, h = o.h * (0.92 + 0.16 * rnd());
    for (const s of [1, -1]) {
      const nx = (-tz / L) * 0.05 * s, nz = (tx / L) * 0.05 * s, yA = Ysolo(A.x, A.z), yB = Ysolo(B.x, B.z), ym = (yA + yB) / 2;
      const a0 = [A.x + nx, yA - 0.3, A.z + nz], b0 = [B.x + nx, yB - 0.3, B.z + nz], a1 = [A.x + nx, yA + h, A.z + nz], b1 = [B.x + nx, yB + h, B.z + nz], m1 = [mx + nx, ym + h + 0.12, mz + nz];
      if (s > 0) pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1, ...a1, ...b1, ...m1); else pos.push(...b0, ...a0, ...a1, ...b0, ...a1, ...b1, ...b1, ...a1, ...m1);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); geo(BC, MM.madeira, g, o.cor ?? 0x6a5038);
  for (const gt of gates) { // portão de troncos com duas torres de vigia
    const hw = larg / 2 + 0.2;
    for (const s of [-1, 1]) torreVigia(gt.x - gt.tz * hw * s, gt.z + gt.tx * hw * s, o.h + 0.9);
    const p = Pc(gt.x, Ysolo(gt.x, gt.z), gt.z, Math.atan2(gt.tx, gt.tz)); p.cx(MM.madeira, larg + 0.5, 0.1, 0.1, 0, o.h + 0.25, 0, 0x4a3828);
  }
}
export function torreVigia(x: number, z: number, h = 1.5) {
  const p = Pc(x, chao(x, z, 0.25), z, rnd()), q = det(p);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.cx(MM.madeira, 0.05, h, 0.05, sx * 0.17, h / 2, sz * 0.17, 0x4a3a2a);
  p.cx(MM.madeira, 0.5, 0.05, 0.5, 0, h, 0, 0x5a4532); for (const s of [-1, 1]) q.cx(MM.madeira, 0.5, 0.12, 0.02, 0, h + 0.08, s * 0.24, 0x5a4532);
  cone(p, MM.palha, 0.4, 0.32, 0, h + 0.28, 0, 0x8a7a50, 4, Math.PI / 4);
  if (rnd() < 0.7) { plano(BD, q.m, MM.aceso, 0.05, 0.05, 0, h + 0.16, 0.0, 0, 0xffffff); brilho(x, Ysolo(x, z) + h + 0.2, z, 0.8); }
}

// ---------- adereços ----------
export function bandeira(p: Peca, px: number, py: number, pz: number, h: number, cor: number, s = 1) {
  p.cil(MM.plain, 0.02 * s, h, px, py, pz, 0x3a2a1a, 4);
  const g = new THREE.PlaneGeometry(0.5 * s, 0.3 * s, 3, 1), a = g.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getX(i) * 6) * 0.04 * s);
  g.translate(0.26 * s, 0, 0); g.translate(px, py + h - 0.17 * s, pz); geo(BC, MM.bandeira, g, cor, p.m);
}
export function poco(x: number, z: number, cor = 0x8a8478) {
  const p = Pc(x, chao(x, z, 0.2), z, rnd()), q = det(p);
  p.cil(MM.pedra, 0.17, 0.18, 0, 0, 0, cor, 10); q.cil(MM.escuro, 0.13, 0.02, 0, 0.17, 0, 0x101010, 8);
  for (const s of [-1, 1]) q.cx(MM.madeira, 0.025, 0.34, 0.025, s * 0.15, 0.27, 0, 0x4a3a2a);
  telhado(p, MM.telha, 0.38, 0.26, 0.12, 0.44, 0x7a4a32, { b: 0.02 });
}
export function chafariz(x: number, z: number, r = 0.4, cor = 0xd8d0c8, mat: Mat = MM.marmore) {
  const p = Pc(x, chao(x, z, r), z), q = det(p);
  p.cil(mat, r, 0.12, 0, 0, 0, cor, 16); q.cil(CM.agua, r * 0.88, 0.02, 0, 0.1, 0, 0xffffff, 16);
  p.cil(mat, r * 0.14, 0.42, 0, 0, 0, cor, 8); p.cil(mat, r * 0.42, 0.05, 0, 0.36, 0, cor, 12, r * 0.3);
  q.cil(CM.agua, r * 0.36, 0.015, 0, 0.405, 0, 0xffffff, 12); p.esf(mat, 0.05, 0, 0.47, 0, cor);
}
export function estatua(x: number, z: number, h: number, cor = 0xd8d2e4, mat: Mat = MM.marmore, ry = 0) {
  const p = Pc(x, chao(x, z, 0.2 * h), z, ry, h);
  p.cx(MM.pedra, 0.32, 0.22, 0.32, 0, 0.11, 0, 0x9a948a); p.cil(mat, 0.07, 0.42, 0, 0.22, 0, cor, 6, 0.1);
  p.esf(mat, 0.06, 0, 0.7, 0, cor); p.cx(mat, 0.03, 0.26, 0.03, 0.09, 0.66, 0.02, cor, -0.4);
}
export function barraca(x: number, z: number, ry: number, cor: number) {
  const p = Pc(x, Ysolo(x, z), z, ry), q = det(p);
  q.cx(MM.madeira, 0.26, 0.09, 0.13, 0, 0.045, 0.02, 0x6a5038);
  for (const s of [-1, 1]) q.cx(MM.madeira, 0.02, 0.24, 0.02, s * 0.12, 0.12, -0.06, 0x4a3a2a);
  for (let k = 0; k < 3; k++) q.cx(MM.plain, 0.05, 0.03, 0.05, -0.08 + k * 0.08, 0.105, 0.03, pick([0xc83a2a, 0xe8c040, 0x5a8a3a, 0xd88a40, 0x8a5a9a]));
  const g = new THREE.PlaneGeometry(0.32, 0.2); g.rotateX(-1.05); g.translate(0, 0.22, 0.0); geo(BC, MM.tecido, g, cor, p.m);
}
export function lampiao(x: number, z: number) {
  const y = Ysolo(x, z), q = peca(BD, mtx(x, y, z), 0, 0, 0);
  q.cx(MM.plain, 0.02, 0.32, 0.02, 0, 0.16, 0, 0x2a2622); q.cx(MM.aceso, 0.045, 0.05, 0.045, 0, 0.34, 0, 0xffffff);
  brilho(x, y + 0.34, z, 0.45);
}
export function lampioesNaRua(pts: V[], larg: number, cada = 1.4) {
  const acc = comprimentos(pts), tot = acc[acc.length - 1];
  for (let s = cada / 2, k = 0; s < tot; s += cada, k++) { const [x, z, tx, tz] = noPonto(pts, acc, s), sd = k % 2 ? 1 : -1, o = larg / 2 + 0.05; lampiao(x - tz * sd * o, z + tx * sd * o); }
}
export function arvore(x: number, z: number, s = 1, cor = 0x4a7a3a) {
  const p = Pc(x, Ysolo(x, z), z, rnd() * 6, s);
  p.cil(MM.madeira, 0.035, 0.32, 0, 0, 0, 0x4a3a2a, 5); const g = new THREE.IcosahedronGeometry(0.2, 0); g.scale(1, 1.1, 1); g.translate(0, 0.42, 0); geo(BC, MM.plain, g, cor, p.m);
}
export function carroca(x: number, z: number, ry: number, feno = rnd() < 0.5) {
  const q = peca(BD, mtx(x, Ysolo(x, z), z, ry), 0, 0, 0);
  q.cx(MM.madeira, 0.16, 0.06, 0.28, 0, 0.1, 0, 0x6a5038); for (const s of [-1, 1]) q.cil(MM.madeira, 0.06, 0.02, s * 0.09, 0.06, 0, 0x3a2a1e, 8, 0.06, 0, Math.PI / 2);
  q.cx(MM.madeira, 0.015, 0.015, 0.22, 0, 0.08, 0.24, 0x3a2a1e); if (feno) q.cx(MM.palha, 0.15, 0.08, 0.24, 0, 0.17, 0, 0xc8a850);
}
export function barris(x: number, z: number, n = 3) { const q = peca(BD, mtx(x, Ysolo(x, z), z, rnd() * 6), 0, 0, 0); for (let i = 0; i < n; i++) i % 2 ? q.cx(MM.madeira, 0.08, 0.07, 0.08, (rnd() - 0.5) * 0.2, 0.035, (rnd() - 0.5) * 0.2, 0x8a6a48) : q.cil(MM.madeira, 0.04, 0.09, (rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2, 0x6a4a30, 8); }
export function fogueira(x: number, z: number, s = 1, forte = false) {
  const y = Ysolo(x, z), q = peca(BD, mtx(x, y, z, 0, s), 0, 0, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; q.cx(MM.pedra, 0.06, 0.04, 0.06, Math.cos(a) * 0.12, 0.02, Math.sin(a) * 0.12, 0x5a5650); }
  const g = new THREE.ConeGeometry(0.07, 0.18, 5); g.translate(0, 0.09, 0); geo(BD, MM.aceso, g, 0xffffff, q.m);
  brilho(x, y + 0.15 * s, z, 0.9 * s); if (forte) luz(x, y + 0.5, z, 0xff9040, 16, 6);
}
export function lenha(x: number, z: number, ry: number) { const q = peca(BD, mtx(x, Ysolo(x, z), z, ry), 0, 0, 0); for (let i = 0; i < 3; i++) q.cil(MM.madeira, 0.035, 0.3, 0, 0.035 + i * 0.06, (i % 2) * 0.03, 0x7a5a3a, 6, 0.035, 0, Math.PI / 2); }
export function tenda(x: number, z: number, r: number, cor: number, listras?: number) {
  const p = Pc(x, Ysolo(x, z), z, rnd() * 6), g = new THREE.ConeGeometry(r, r * 1.3, 10); g.translate(0, r * 0.65, 0);
  if (listras !== undefined) { const c = g.attributes.position, col = new Float32Array(c.count * 3), a1 = new THREE.Color(cor), a2 = new THREE.Color(listras); for (let i = 0; i < c.count; i++) { const k = Math.floor(((Math.atan2(c.getZ(i), c.getX(i)) + Math.PI) / Math.PI) * 5) % 2, cc = k ? a1 : a2; col.set([cc.r, cc.g, cc.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo(BC, MM.tecido, g, 0xffffff, p.m); }
  else geo(BC, MM.tecido, g, cor, p.m);
  return p;
}

// ---------- prédios marcantes ----------
export interface OpTemplo { mat?: Mat; parede: number; tetoMat?: Mat; teto: number; torre?: 'agulha' | 'cupula' | 'quadrada' | null; w?: number; d?: number; h?: number }
/** templo/igreja: nave, abside, torre na frente, rosácea acesa */
export function templo(x: number, z: number, ry: number, s: number, o: OpTemplo) {
  const w = o.w ?? 0.9, d = o.d ?? 1.7, h = o.h ?? 0.75, mat = o.mat ?? MM.pedra, tm = o.tetoMat ?? MM.ardosia;
  const y = chao(x, z, Math.max(w, d) * 0.5 * s), p = Pc(x, y, z, ry, s), q = det(p);
  p.cx(mat, w, h + 0.2, d, 0, (h - 0.2) / 2, 0, o.parede);
  telhado(p, tm, w, d, w * 0.6, h, o.teto, { cumeeira: 'z', b: 0.06, parede: [mat, o.parede] });
  const ab = new THREE.CylinderGeometry(w * 0.45, w * 0.45, h * 0.8 + 0.2, 10, 1, false, Math.PI / 2, Math.PI); ab.translate(0, (h * 0.8 - 0.2) / 2, -d / 2); geo(BC, mat, ab, o.parede, p.m);
  const abt = new THREE.ConeGeometry(w * 0.5, w * 0.35, 10, 1, false, Math.PI / 2, Math.PI); abt.translate(0, h * 0.8 + w * 0.175, -d / 2); geo(BC, tm, abt, o.teto, p.m);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { p.cx(mat, 0.08, h * 0.7, 0.1, sx * (w / 2 + 0.04), h * 0.35 - 0.1, -d / 2 + 0.3 + k * (d - 0.6) / 2, o.parede); plano(BD, q.m, CM.vitral, 0.07, 0.22, sx * (w / 2 + 0.006), h * 0.55, -d / 2 + 0.45 + k * (d - 0.6) / 2, sx * Math.PI / 2, 0xffffff); }
  let zf = d / 2;
  if (o.torre) {
    const tw = w * 0.48, th = h * 2.1; zf = d / 2 + tw / 2;
    p.cx(mat, tw, th + 0.2, tw, 0, (th - 0.2) / 2, d / 2, o.parede);
    if (o.torre === 'agulha') cone(p, tm, tw * 0.75, th * 0.65, 0, th, d / 2, o.teto, 4, Math.PI / 4);
    else if (o.torre === 'cupula') cupula(p, MM.ouro, tw * 0.55, 0, th, d / 2, 0xe8c058, 1.4);
    else telhado(p, tm, tw, tw, tw * 0.7, th, o.teto, { quatro: true, pz: d / 2 });
    plano(BD, q.m, CM.janela, 0.08, 0.1, 0, th - 0.15, zf + 0.006, 0, 0xffffff);
  }
  const ros = new THREE.CircleGeometry(0.1, 12); ros.translate(0, h * 0.62, zf + 0.007); geo(BD, CM.vitral, ros, 0xffffff, q.m);
  plano(BD, q.m, MM.madeira, 0.14, 0.22, 0, 0.1, zf + 0.007, 0, 0x3a2414);
  const c = p.pos(0, h * 0.6, zf + 0.1); brilho(c.x, c.y, c.z, 1.2 * s);
  return p;
}
export interface OpCastelo { mat?: Mat; cor: number; teto: number; tetoMat?: Mat; bandeira: number; S?: number; H?: number }
/** castelo: pátio murado com torres redondas, torre de menagem com torrinhas e estandartes */
export function castelo(x: number, z: number, ry: number, s: number, o: OpCastelo) {
  const S = o.S ?? 1.3, H = o.H ?? 0.7, mat = o.mat ?? MM.pedra, tm = o.tetoMat ?? MM.ardosia, y = chao(x, z, S * s) - 0.12, p = Pc(x, y, z, ry, s), q = det(p);
  for (const [px, pz, w, d] of [[0, -S, S * 2, 0.18], [-S, 0, 0.18, S * 2], [S, 0, 0.18, S * 2]]) p.cx(mat, w, H + 0.2, d, px, (H - 0.2) / 2, pz, o.cor);
  for (const sx of [-1, 1]) p.cx(mat, S * 0.75, H + 0.2, 0.18, sx * S * 0.62, (H - 0.2) / 2, S, o.cor);
  for (let k = 0; k < 28; k++) { const t = k / 28, side = Math.floor(t * 4), u = (t * 4 - side) * 2 - 1; const [px, pz] = side === 0 ? [u * S, -S] : side === 1 ? [S, u * S] : side === 2 ? [-u * S, S] : [-S, -u * S]; if (side === 2 && Math.abs(u * S) < S * 0.25) continue; q.cx(mat, 0.08, 0.08, 0.08, px, H + 0.04, pz, o.cor); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p.cil(mat, 0.26, H + 0.55, sx * S, -0.2, sz * S, o.cor, 10); cone(p, tm, 0.32, 0.5, sx * S, H + 0.35, sz * S, o.teto, 10); janela(q, sx * S, H + 0.1, sz * S + sz * 0.265, sz > 0 ? 0 : Math.PI, rnd() < 0.6); }
  // portão com torres
  for (const sx of [-1, 1]) { p.cx(mat, 0.32, H + 0.5, 0.36, sx * S * 0.3, (H + 0.3) / 2, S, o.cor); cone(p, tm, 0.26, 0.4, sx * S * 0.3, H + 0.4, S, o.teto, 4, Math.PI / 4); }
  p.cx(mat, S * 0.6, 0.18, 0.3, 0, H * 0.8, S, o.cor); q.cx(MM.escuro, S * 0.3, H * 0.55, 0.02, 0, H * 0.27, S + 0.17, 0x121010);
  // menagem
  const kw = S * 0.85, kh = H * 2.6;
  p.cx(mat, kw, kh + 0.2, kw, 0, (kh - 0.2) / 2, -S * 0.25, o.cor);
  for (let k = 0; k < 12; k++) { const t = k / 12, side = Math.floor(t * 4), u = (t * 4 - side) * 2 - 1, hw = kw / 2; const [px, pz] = side === 0 ? [u * hw, -hw] : side === 1 ? [hw, u * hw] : side === 2 ? [-u * hw, hw] : [-hw, -u * hw]; q.cx(mat, 0.09, 0.09, 0.09, px, kh + 0.045, pz - S * 0.25, o.cor); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p.cil(mat, 0.13, 0.5, sx * kw / 2, kh - 0.2, sz * kw / 2 - S * 0.25, o.cor, 8); cone(p, tm, 0.17, 0.42, sx * kw / 2, kh + 0.3, sz * kw / 2 - S * 0.25, o.teto, 8); }
  for (let a = 0; a < 3; a++) for (const u of [-0.22, 0.22]) janela(q, u * kw, 0.45 + a * kh * 0.3, -S * 0.25 + kw / 2 + 0.006, 0, rnd() < 0.55);
  bandeira(p, 0, kh, -S * 0.25, 0.9, o.bandeira, 1.3);
  for (const sx of [-1, 1]) bandeira(p, sx * S, H + 0.85, S, 0.45, o.bandeira, 0.8);
  const c = p.pos(0, kh * 0.6, -S * 0.25 + kw); luz(c.x, c.y, c.z, 0xffa860, 18, 8); brilho(c.x, c.y, c.z, 1.2 * s);
  return p;
}
/** casa longa (salão) com cabeças de dragão nas pontas da cumeeira */
export function salaoLongo(x: number, z: number, ry: number, L: number, W: number, o: { cor: number; neve?: boolean; dragoes?: boolean }) {
  const y = chao(x, z, L * 0.5) - 0.05, p = Pc(x, y, z, ry), q = det(p), H = 0.42, hT = W * 0.85;
  p.cx(MM.pedra, L + 0.1, 0.3, W + 0.1, 0, -0.02, 0, 0x6a6660); p.cx(MM.madeira, L, H, W, 0, 0.13 + H / 2, 0, o.cor);
  telhado(p, o.neve ? MM.neve : MM.palha, L, W, hT, 0.13 + H, o.neve ? 0xeef4ff : 0x9a8a5a, { cumeeira: 'x', b: 0.1, parede: [MM.madeira, o.cor] });
  if (o.dragoes) for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(0.06, 0.4, 5); g.rotateZ(-s * 1.0); g.translate(s * (L / 2 + 0.2), 0.13 + H + hT + 0.08, 0); geo(BC, MM.madeira, g, 0x3a2a1a, p.m); q.esf(MM.madeira, 0.06, s * (L / 2 + 0.33), 0.13 + H + hT + 0.2, 0, 0x3a2a1a); }
  for (let k = -2; k <= 2; k++) janela(q, k * L * 0.18, 0.13 + H * 0.55, W / 2 + 0.006, 0, true);
  plano(BD, q.m, MM.madeira, 0.18, 0.28, 0, 0.13 + 0.12, W / 2 + 0.007, 0, 0x3a2414);
  for (const s of [-1, 1]) fumo(p.pos(s * L * 0.25, 0.13 + H + hT, 0), 1);
  const c = p.pos(0, 0.5, W / 2 + 0.2); luz(c.x, c.y, c.z, 0xff9a50, 26, 9); brilho(c.x, c.y, c.z, 1.4);
  return p;
}
export function armazem(x: number, z: number, ry: number, w: number, d: number, cor: number, teto: number) {
  const y = chao(x, z, Math.max(w, d) * 0.5), p = Pc(x, y, z, ry), q = det(p), H = 0.5;
  corpo(p, MM.madeira, w, d, H, cor); telhado(p, MM.telha, w, d, d * 0.42, H, teto, { cumeeira: 'x', parede: [MM.madeira, cor] });
  for (let k = 0; k < Math.max(1, Math.round(w / 0.6)); k++) plano(BD, q.m, MM.madeira, 0.2, 0.3, (k + 0.5 - Math.max(1, Math.round(w / 0.6)) / 2) * 0.6, 0.15, d / 2 + 0.006, 0, 0x3a2a1e);
  return p;
}
/** arena oval em degraus, areia no meio */
export function arena(x: number, z: number, ry: number, rx: number, rz: number, cor = 0xc8beac, tiers = 3) {
  const y = chao(x, z, Math.max(rx, rz)) - 0.1, p = Pc(x, y, z, ry), q = det(p);
  for (let k = 0; k < tiers; k++) { const t = new THREE.TorusGeometry(1, 0.2, 5, 28); t.rotateX(Math.PI / 2); t.scale(rx - k * 0.22, 1.4 + k * 0.5, rz - k * 0.22); t.translate(0, 0.25 + k * 0.22, 0); geo(BC, MM.pedra, t, cor, p.m); }
  const muro = new THREE.CylinderGeometry(1, 1, 0.5 + tiers * 0.22, 28, 1, true); muro.scale(rx + 0.15, 1, rz + 0.15); muro.translate(0, (0.5 + tiers * 0.22) / 2 - 0.05, 0); geo(BC, MM.pedra, muro, cor - 0x101010, p.m);
  for (let k = 0; k < 20; k++) { const a = (k / 20) * 6.283; plano(BD, q.m, CM.janela, 0.12, 0.2, Math.cos(a) * (rx + 0.16), 0.2, Math.sin(a) * (rz + 0.16), Math.atan2(Math.cos(a) * rz, Math.sin(a) * rx), 0xffffff); }
  piso(x, z, { w: (rx - tiers * 0.22) * 1.5, d: (rz - tiers * 0.22) * 1.5, ry }, CM.areia, 0xffffff, 0.06);
  return p;
}
const geoPas = (() => { let g: THREE.BufferGeometry | null = null; return () => { if (g) return g; const ps: THREE.BufferGeometry[] = []; for (let k = 0; k < 4; k++) { const b = new THREE.BoxGeometry(0.11, 0.62, 0.012); b.translate(0.03, 0.34, 0); b.rotateZ((k * Math.PI) / 2); ps.push(b.toNonIndexed()); } ps.push(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 6).rotateX(Math.PI / 2).toNonIndexed()); g = mergeGeometries(ps)!; return g; }; })();
/** moinho de vento (as pás giram) */
export function moinho(x: number, z: number, ry: number, s = 1, cor = 0xe8e0d0) {
  const y = chao(x, z, 0.3 * s), p = Pc(x, y, z, ry, s), q = det(p);
  p.cil(MM.reboco, 0.22, 1.1, 0, -0.1, 0, cor, 8, 0.3); cone(p, MM.telha, 0.27, 0.34, 0, 1.0, 0, 0x8a4a32, 8);
  plano(BD, q.m, MM.madeira, 0.1, 0.16, 0, 0.08, 0.29, 0, 0x3a2a1e); janela(q, 0, 0.6, 0.255, 0, rnd() < 0.5);
  const c = p.pos(0, 1.08, 0.3); MOINHOS.push({ x: c.x, y: c.y, z: c.z, ry, s });
}
/** navio ancorado: casco, convés, mastros e velas recolhidas */
export function navio(x: number, z: number, ry: number, s = 1, cor = 0x5a3e28) {
  const p = Pc(x, 0.02, z, ry, s), q = det(p);
  const casco = new THREE.CylinderGeometry(0.2, 0.12, 1.3, 8, 1, false); casco.rotateX(Math.PI / 2); casco.scale(1, 0.6, 1); casco.translate(0, 0.06, 0); geo(BC, MM.madeira, casco, cor, p.m);
  const proa = new THREE.ConeGeometry(0.2, 0.4, 8); proa.rotateX(Math.PI / 2); proa.scale(1, 0.6, 1); proa.translate(0, 0.06, 0.85); geo(BC, MM.madeira, proa, cor, p.m);
  p.cx(MM.madeira, 0.34, 0.03, 1.1, 0, 0.17, -0.05, 0x8a6a48); p.cx(MM.madeira, 0.3, 0.14, 0.28, 0, 0.24, -0.5, cor);
  for (const [mz, mh] of [[0.2, 1.1], [-0.25, 0.85]]) { p.cil(MM.madeira, 0.02, mh, 0, 0.17, mz, 0x3a2a1a, 5); q.cx(MM.madeira, 0.5, 0.02, 0.02, 0, 0.17 + mh * 0.8, mz, 0x3a2a1a); p.cx(MM.palha, 0.46, 0.06, 0.06, 0, 0.17 + mh * 0.77, mz, 0xe0d8c0); }
  janela(q, 0, 0.26, -0.36 + 0.006, 0, rnd() < 0.6);
}
export function barco(x: number, z: number, ry: number) { const p = Pc(x, 0.02, z, ry); p.cx(MM.madeira, 0.16, 0.06, 0.42, 0, 0.04, 0, 0x5a4030); p.cx(MM.madeira, 0.12, 0.02, 0.06, 0, 0.08, 0.05, 0x7a5a3a); }
/** cais de madeira (comprimento L ao longo de +z local) */
export function cais(x: number, z: number, ry: number, L: number, larg = 0.4) {
  const p = Pc(x, 0, z, ry), q = det(p);
  p.cx(MM.madeira, larg, 0.06, L, 0, 0.2, L / 2, 0x6a5038);
  for (let k = 0; k <= Math.round(L / 0.5); k++) for (const s of [-1, 1]) q.cil(MM.madeira, 0.03, 0.6, s * (larg / 2 - 0.02), -0.4, (k * L) / Math.round(L / 0.5), 0x3e2e20, 5);
  return p;
}
export function guindaste(x: number, z: number, ry: number) { const q = peca(BD, mtx(x, Ysolo(x, z), z, ry), 0, 0, 0); q.cx(MM.madeira, 0.06, 0.8, 0.06, 0, 0.4, 0, 0x4a3a2a); q.cx(MM.madeira, 0.04, 0.04, 0.6, 0, 0.78, 0.22, 0x4a3a2a, 0, -0.35); q.cx(MM.plain, 0.008, 0.3, 0.008, 0, 0.6, 0.48, 0x2a2420); q.cx(MM.madeira, 0.1, 0.08, 0.1, 0, 0.42, 0.48, 0x8a6a48); }

// ---------- campos ----------
export function lavoura(x: number, z: number, w: number, d: number, ry: number, cor: number, medas = 0) {
  if (Y(x, z) < 0.35 || pertoDeRio(x, z, Math.max(w, d) * 0.5)) return false;
  piso(x, z, { w, d, ry }, CM.campo, cor, 0.03); ocupar(x, z, Math.max(w, d) * 0.55);
  for (let i = 0; i < medas; i++) { const u = (rnd() - 0.5) * w * 0.8, v = (rnd() - 0.5) * d * 0.8, px = x + u * Math.cos(ry) + v * Math.sin(ry), pz = z - u * Math.sin(ry) + v * Math.cos(ry); cone(Pc(px, Ysolo(px, pz), pz), MM.palha, 0.1, 0.17, 0, 0, 0, 0xc8a850, 6); }
  return true;
}
export function cerca(pts: V[], cor = 0x5a4a38, h = 0.14) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 0.4)), a = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k <= n; k++) { const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n; peca(BD, mtx(x, Ysolo(x, z), z), 0, 0, 0).cx(MM.madeira, 0.025, h, 0.025, 0, h / 2, 0, cor); }
    const ym = Ysolo((ax + bx) / 2, (az + bz) / 2); peca(BD, mtx((ax + bx) / 2, ym, (az + bz) / 2, a), 0, 0, 0).cx(MM.madeira, 0.015, 0.015, L, 0, h * 0.75, 0, cor);
  }
}
export function cercaRet(x: number, z: number, w: number, d: number, ry: number, cor?: number) { const c = Math.cos(ry), s = Math.sin(ry), P = (u: number, v: number): V => [x + u * c + v * s, z - u * s + v * c]; cerca([P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2), P(-w / 2, -d / 2)], cor); }
export function pomar(x: number, z: number, w: number, d: number, ry: number, cor = 0x5a8a3a) {
  if (Y(x, z) < 0.35) return; const c = Math.cos(ry), s = Math.sin(ry); ocupar(x, z, Math.max(w, d) * 0.55);
  for (let u = -w / 2 + 0.25; u < w / 2; u += 0.5) for (let v = -d / 2 + 0.25; v < d / 2; v += 0.5) { const px = x + u * c + v * s, pz = z - u * s + v * c; if (!pertoDeRio(px, pz, 0.3)) arvore(px, pz, 0.6 + rnd() * 0.2, rnd() < 0.15 ? 0x8a9a3a : cor); }
}
export function vinhedo(x: number, z: number, w: number, d: number, ry: number) {
  if (Y(x, z) < 0.35) return; const p = Pc(x, Ysolo(x, z), z, ry); ocupar(x, z, Math.max(w, d) * 0.55);
  piso(x, z, { w, d, ry }, CM.campo, 0xb0905a, 0.03);
  for (let v = -d / 2 + 0.15; v < d / 2; v += 0.26) p.cx(MM.plain, w * 0.92, 0.1, 0.07, 0, Y(x, z) > 0 ? 0.04 : 0, v, 0x4a6a2a);
}

// ---------- fim: monta as malhas ----------
export function terminarKit(Gr: THREE.Group) {
  construirPontes();
  for (const f of FAIXAS) addChao(f.mat, faixa(f.pts, f.larg, f.cor)); FAIXAS.length = 0;
  const grupo = new THREE.Group(); grupo.name = 'Cidades'; Gr.add(grupo);
  BC.build(grupo);
  const det2 = new THREE.Group(); det2.name = 'Cidades: detalhes'; grupo.add(det2);
  BD.build(det2, { shadow: false }).forEach(m => { m.userData.cullDist = Q === 'baixa' ? 70 : 110; });
  const chao2 = new THREE.Group(); chao2.name = 'Ruas e praças'; grupo.add(chao2);
  CHAO.forEach((gs, mat) => { const g = mergeGeometries(gs, false); if (!g) return; const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.userData.ns = 1; chao2.add(me); });
  CHAO.clear();
  // pás dos moinhos: uma malha instanciada só, girando
  if (MOINHOS.length) {
    const im = new THREE.InstancedMesh(geoPas(), new THREE.MeshStandardMaterial({ color: 0xe0d6c0, roughness: 0.8, side: THREE.DoubleSide }), MOINHOS.length); im.name = 'Pás dos moinhos'; im.castShadow = true; im.userData.ns = 1; im.frustumCulled = false; grupo.add(im);
    const o = new THREE.Object3D(), fase = MOINHOS.map(() => rnd() * 6);
    ANIM.push(t => { MOINHOS.forEach((m, i) => { o.position.set(m.x, m.y, m.z); o.rotation.set(0, m.ry, t * 0.9 + fase[i], 'YXZ'); o.scale.setScalar(m.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; });
  }
  return { anim: ANIM.slice(), grupo };
}
