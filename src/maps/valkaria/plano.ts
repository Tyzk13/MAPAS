// Valkaria — o coração da capital (Distrito do Panteão), em metros (1 m = 1 quadrado; chão em y = 0; x = leste, z = sul).
// Planta radial em volta da deusa colossal: praça do Panteão (r 42), Anel do Panteão, quatro avenidas diagonais até os
// portões, os grandes prédios nos eixos (Palácio ao norte, Catedral a oeste, Academia a leste, Grande Mercado ao sul),
// o Bulevar das Torres, o Anel dos Ofícios e as travessas dos bairros; o rio corta o lado leste (cais e pontes).
import * as THREE from 'three';

export type V = [number, number];
export const PI = Math.PI;

// ---------- aleatório determinístico ----------
let sd = 990;
export const reseed = (s: number) => { sd = s; };
export const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
export const entre = (a: number, b: number) => a + (b - a) * rnd();
export const pick = <T,>(a: T[]) => a[(rnd() * a.length) | 0];

// ---------- círculos da planta ----------
export const R_MURO = 165, N_MURO = 28;
export const PRACA_R = 42;
export const ANEL1 = { r: 47, w: 9 }, ANEL2 = { r: 86, w: 8 }, ANEL3 = { r: 128, w: 6 };
/** muralha: polígono de 28 lados (vértices um pouco irregulares) */
export const MURO: V[] = Array.from({ length: N_MURO }, (_, k) => { const a = (k / N_MURO) * PI * 2, r = R_MURO * (1 + 0.012 * Math.sin(k * 2.3)); return [Math.cos(a) * r, Math.sin(a) * r]; });
/** distância até a muralha (positiva dentro) */
export function dentroMuro(x: number, z: number) { const a = Math.atan2(z, x), k = (a / (PI * 2)) * N_MURO; const i = ((Math.floor(k) % N_MURO) + N_MURO) % N_MURO, j = (i + 1) % N_MURO, t = k - Math.floor(k); const r = Math.hypot(...MURO[i]) * (1 - t) + Math.hypot(...MURO[j]) * t; return r * Math.cos(PI / N_MURO) - Math.hypot(x, z); }
/** avenidas diagonais (ângulos) com um portão cada na muralha */
export const AVENIDAS = [-3 * PI / 4, -PI / 4, PI / 4, 3 * PI / 4];
export const NOMES_AV = ['Avenida dos Heróis', 'Avenida da Academia', 'Avenida do Rio', 'Avenida dos Peregrinos'];
export const NOMES_PORTAO = ['Portão da Coroa', 'Portão dos Magos', 'Portão das Barcas', 'Portão dos Peregrinos'];
export const polar = (a: number, r: number): V => [Math.cos(a) * r, Math.sin(a) * r];
/** ângulo da frente virada para o centro (frente local = +z) */
export const paraCentro = (x: number, z: number) => Math.atan2(-x, -z);

// ---------- o rio (corre de norte a sul pelo lado leste) ----------
export const RIO = { larg: 14, agua: -1.25, fundo: -2.4 };
export const rioX = (z: number) => 104 + 6 * Math.sin(z / 60) + 3 * Math.sin(z / 23);
/** margens (oeste e leste) de z0 a z1 */
export function margem(lado: -1 | 1, z0 = -340, z1 = 340, passo = 4): V[] { const o: V[] = []; for (let z = z0; z <= z1 + 0.01; z += passo) o.push([rioX(z) + lado * RIO.larg / 2, z]); return o; }
export const noRio = (x: number, z: number, m = 0) => Math.abs(x - rioX(z)) < RIO.larg / 2 + m;

// ---------- pegadas (caixas orientadas) e ruas (polilinhas) para nada ficar por cima de nada ----------
export interface Caixa { x: number; z: number; hw: number; hd: number; c: number; s: number }
export const caixa = (x: number, z: number, w: number, d: number, ry: number): Caixa => ({ x, z, hw: w / 2, hd: d / 2, c: Math.cos(ry), s: Math.sin(ry) });
export function sobrepoe(A: Caixa, B: Caixa, m = 0) {
  const dx = B.x - A.x, dz = B.z - A.z;
  for (const [ax, az] of [[A.c, -A.s], [A.s, A.c], [B.c, -B.s], [B.s, B.c]]) {
    const ra = A.hw * Math.abs(A.c * ax - A.s * az) + A.hd * Math.abs(A.s * ax + A.c * az), rb = B.hw * Math.abs(B.c * ax - B.s * az) + B.hd * Math.abs(B.s * ax + B.c * az);
    if (Math.abs(dx * ax + dz * az) > ra + rb + m) return false;
  }
  return true;
}
/** distância de um ponto (x,z) à caixa (0 dentro) */
export function distCaixa(B: Caixa, x: number, z: number) { const u = (x - B.x) * B.c - (z - B.z) * B.s, v = (x - B.x) * B.s + (z - B.z) * B.c; return Math.hypot(Math.max(Math.abs(u) - B.hw, 0), Math.max(Math.abs(v) - B.hd, 0)); }
/** cantos da caixa no mundo (paredes do VTT) */
export const cantos = (B: Caixa): V[] => [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([a, b]) => [+(B.x + a * B.hw * B.c + b * B.hd * B.s).toFixed(2), +(B.z - a * B.hw * B.s + b * B.hd * B.c).toFixed(2)] as V);

export interface Rua { n: string; pts: V[]; w: number; nobre?: boolean; beco?: boolean }
export function reamostra(pts: V[], passo: number): V[] {
  const out: V[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / passo)); for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]); }
  return out;
}
export const arco = (r: number, a0: number, a1: number, passo = 3): V[] => { const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / passo)); return Array.from({ length: n + 1 }, (_, k) => polar(a0 + ((a1 - a0) * k) / n, r)); };
export function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number) { const ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / L2)); return Math.hypot(ax + ex * t - x, az + ez * t - z); }

/** grade espacial: caixas ocupadas e segmentos de rua */
export class Ocupacao {
  private cx = new Map<string, Caixa[]>(); private sg = new Map<string, { ax: number; az: number; bx: number; bz: number; hw: number }[]>();
  circ: [number, number, number][] = [];
  /** quem usa em outra cidade troca o contorno e a água (padrão: muralha redonda e rio de Valkaria) */
  constructor(public dentro: (x: number, z: number, m: number) => boolean = (x, z, m) => dentroMuro(x, z) >= m, public agua: (x: number, z: number, m: number) => boolean = (x, z, m) => noRio(x, z, m)) {}
  private ks(x0: number, x1: number, z0: number, z1: number, f: (k: string) => void) { for (let i = Math.floor(x0 / 8); i <= Math.floor(x1 / 8); i++) for (let j = Math.floor(z0 / 8); j <= Math.floor(z1 / 8); j++) f(i + ',' + j); }
  ocupar(B: Caixa) { const r = Math.hypot(B.hw, B.hd); this.ks(B.x - r, B.x + r, B.z - r, B.z + r, k => { let L = this.cx.get(k); if (!L) this.cx.set(k, (L = [])); L.push(B); }); }
  rua(pts: V[], w: number) { const p = reamostra(pts, 3); for (let i = 1; i < p.length; i++) { const [ax, az] = p[i - 1], [bx, bz] = p[i], s = { ax, az, bx, bz, hw: w / 2 }; this.ks(Math.min(ax, bx) - w, Math.max(ax, bx) + w, Math.min(az, bz) - w, Math.max(az, bz) + w, k => { let L = this.sg.get(k); if (!L) this.sg.set(k, (L = [])); L.push(s); }); } }
  bloquear(x: number, z: number, r: number) { this.circ.push([x, z, r]); }
  /** a caixa cabe (sem casa/prédio, rua, círculo bloqueado, rio, e dentro do muro com folga) */
  livre(B: Caixa, folga = 0.1, muro = 6) {
    const r = Math.hypot(B.hw, B.hd);
    for (const [cx, cz, cr] of this.circ) if (Math.hypot(cx - B.x, cz - B.z) < cr + r && distCaixa(B, cx, cz) < cr) return false;
    for (const [u, v] of cantos(B)) { if (!this.dentro(u, v, muro)) return false; if (this.agua(u, v, 3.2)) return false; }
    if (this.agua(B.x, B.z, 3.2)) return false;
    let ok = true;
    this.ks(B.x - r - 1, B.x + r + 1, B.z - r - 1, B.z + r + 1, k => {
      if (!ok) return;
      for (const C of this.cx.get(k) || []) if (sobrepoe(B, C, folga)) { ok = false; return; }
      for (const s of this.sg.get(k) || []) { if (distCaixa(B, s.ax, s.az) < s.hw + folga || distCaixa(B, s.bx, s.bz) < s.hw + folga || distCaixa(B, (s.ax + s.bx) / 2, (s.az + s.bz) / 2) < s.hw + folga) { ok = false; return; } }
    });
    return ok;
  }
  /** ponto livre de prédios (para postes, árvores, objetos) */
  pontoLivre(x: number, z: number, m = 0.6) { const B = caixa(x, z, m * 2, m * 2, 0); return this.livre(B, 0, 3); }
}

export const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** pontos a cada `passo` metros ao longo da polilinha, com a tangente (postes, árvores) */
export function aCada(pts: V[], passo: number, ini = passo / 2): { x: number; z: number; tx: number; tz: number }[] {
  const out: { x: number; z: number; tx: number; tz: number }[] = []; let falta = ini;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az); if (L < 1e-6) continue; let s = falta;
    while (s <= L) { out.push({ x: ax + (bx - ax) * s / L, z: az + (bz - az) * s / L, tx: (bx - ax) / L, tz: (bz - az) / L }); s += passo; }
    falta = s - L;
  }
  return out;
}
