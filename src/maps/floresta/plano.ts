// Floresta Sombria — planta: relevo (morros + ravina do riacho), trilha com ramais, lugares e funções de distância.
// x = leste, z = sul. A área vai de −L a L.
import * as THREE from 'three';
import { fbm } from '../../core/terrain';

export const L = 150;
type P2 = [number, number];

/** linha (CatmullRom) com distância rápida: amostras a cada 1 m numa grade de 6 m */
export class Linha {
  pts: THREE.Vector3[]; len: number; private grade = new Map<string, number[]>(); private grosso: THREE.Vector3[];
  constructor(ctrl: P2[], passo = 1) {
    const c = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    this.len = c.getLength(); this.pts = c.getSpacedPoints(Math.ceil(this.len / passo)); this.grosso = c.getSpacedPoints(Math.ceil(this.len / 5));
    this.pts.forEach((p, i) => { const k = Math.floor(p.x / 6) + ',' + Math.floor(p.z / 6); if (!this.grade.has(k)) this.grade.set(k, []); this.grade.get(k)!.push(i); });
  }
  /** distância (m) ao eixo */
  dist(x: number, z: number) { return this.perto(x, z).d; }
  /** índice da amostra mais perto e a distância */
  perto(x: number, z: number) {
    let d = 1e9, i0 = 0;
    for (const p of this.grosso) d = Math.min(d, Math.hypot(p.x - x, p.z - z));
    if (d > 9) return { d, i: -1 };
    d = 1e9; const gx = Math.floor(x / 6), gz = Math.floor(z / 6);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of this.grade.get((gx + a) + ',' + (gz + b)) || []) { const dd = Math.hypot(this.pts[i].x - x, this.pts[i].z - z); if (dd < d) { d = dd; i0 = i; } }
    return { d, i: i0 };
  }
  em(u: number) { return this.pts[Math.max(0, Math.min(this.pts.length - 1, Math.round(u * (this.pts.length - 1))))]; }
}

// ---------- riacho (corre de oeste para leste numa ravina) ----------
export const RIO = new Linha([[-170, 26], [-120, 44], [-80, 52], [-42, 38], [-8, 44], [26, 36], [62, 24], [100, 40], [135, 30], [170, 18]]);
// ---------- trilha principal (entra pelo sul, cruza o riacho na ponte, termina no Círculo de Pedras) ----------
export const TRILHA = new Linha([[2, 152], [6, 128], [-4, 104], [8, 78], [2, 58], [-6, 42], [-12, 22], [-28, -2], [-22, -34], [-4, -62], [8, -88], [8, -106]]);
// ramais
export const RAMAL_CAMPO = new Linha([[6, 84], [22, 80], [38, 72], [46, 66]]);
export const RAMAL_ARVORE = new Linha([[-26, -6], [-42, -16], [-58, -20], [-66, -22]]);
export const RAMAL_RUINA = new Linha([[-6, -60], [16, -58], [36, -52], [54, -50]]);

export const ACAMPAMENTO = { x: 50, z: 64, r: 9 };
export const ARVORE = { x: -72, z: -24, r: 8 };     // a Árvore Oca (tronco no centro)
export const CIRCULO = { x: 8, z: -116, r: 15 };
export const RUINA = { x: 62, z: -50, r: 11, ry: -0.35 };
export const CLAREIRAS = [ACAMPAMENTO, ARVORE, CIRCULO, RUINA];

/** cruzamento da trilha com o riacho (onde fica a ponte) */
export const PONTE = (() => {
  let best = { d: 1e9, i: 0 };
  TRILHA.pts.forEach((p, i) => { const d = RIO.dist(p.x, p.z); if (d < best.d) best = { d, i }; });
  const p = TRILHA.pts[best.i], a = TRILHA.pts[Math.max(0, best.i - 3)], b = TRILHA.pts[Math.min(TRILHA.pts.length - 1, best.i + 3)];
  return { x: p.x, z: p.z, ry: Math.atan2(b.x - a.x, b.z - a.z), i: best.i };
})();

const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** relevo sem a ravina (morros suaves, mais altos ao norte) */
export function H0(x: number, z: number) {
  return 9 * (fbm(x * 0.011 + 3.1, z * 0.011 - 1.7, 4) - 0.45) + 2.2 * (fbm(x * 0.045, z * 0.045, 2) - 0.5) - z * 0.012;
}
/** altura do leito ao longo do riacho (suavizada, sempre descendo de oeste para leste) */
const LEITO = (() => {
  const h = RIO.pts.map(p => H0(p.x, p.z)), s = h.map((_, i) => { let a = 0, n = 0; for (let k = -25; k <= 25; k++) { const j = i + k; if (j >= 0 && j < h.length) { a += h[j]; n++; } } return a / n; });
  for (let i = 1; i < s.length; i++) s[i] = Math.min(s[i], s[i - 1] - 0.004);
  return s;
})();
export const nivelAgua = (i: number) => LEITO[Math.max(0, Math.min(LEITO.length - 1, i))] - 2.1;
/** altura final do chão */
export function H(x: number, z: number) {
  let h = H0(x, z);
  // clareiras achatadas (o chão tende à altura do centro)
  for (const c of CLAREIRAS) { const d = Math.hypot(x - c.x, z - c.z), k = 1 - sstep(c.r * 0.7, c.r + 10, d); if (k > 0) h += (H0(c.x, c.z) - h) * k * 0.85; }
  // trilha: suaviza a inclinação lateral (puxa para a média local)
  const t = TRILHA.perto(x, z); if (t.i >= 0 && t.d < 5) { const p = TRILHA.pts[t.i]; h += (H0(p.x, p.z) - h) * (1 - sstep(1.5, 5, t.d)) * 0.7 - 0.08 * (1 - sstep(0.8, 2.2, t.d)); }
  // ravina do riacho
  const r = RIO.perto(x, z);
  if (r.i >= 0 && r.d < 16) { const fundo = LEITO[r.i] - 2.6, k = 1 - sstep(1.6, 13, r.d); h = h * (1 - k) + fundo * k; }
  return h;
}
/** 0 = livre de árvores (trilha, riacho, clareiras), 1 = mata */
export function mata(x: number, z: number) {
  const dt = Math.min(TRILHA.dist(x, z), RAMAL_CAMPO.dist(x, z) + 0.6, RAMAL_ARVORE.dist(x, z) + 0.6, RAMAL_RUINA.dist(x, z) + 0.6);
  let k = sstep(2.6, 5, dt) * sstep(3.8, 6.5, RIO.dist(x, z));
  for (const c of CLAREIRAS) k *= sstep(c.r, c.r + 5, Math.hypot(x - c.x, z - c.z));
  return k;
}
