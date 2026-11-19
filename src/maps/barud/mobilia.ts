// Móveis e objetos medievais feitos em código (juntados no lote: poucas chamadas de desenho).
// Cada função recebe a matriz do prédio (base) e a posição/rotação local do móvel.
import * as THREE from 'three';
import { Batch, MAT, mtx, por, rnd, pick } from './common';

type M4 = THREE.Matrix4;
const MAD = [0x4a3424, 0x3a2a1e, 0x5a4030, 0x2e221a];
/** construtor de peças num referencial local (base · posição · rotação) */
export function peca(B: Batch, base: M4, x: number, y: number, z: number, ry = 0) {
  const m = base.clone().multiply(mtx(x, y, z, ry));
  return {
    m,
    cx(mat: THREE.Material, w: number, h: number, d: number, px: number, py: number, pz: number, cor: number = 0xffffff, rz = 0, rx = 0) {
      const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (rx) g.rotateX(rx); g.translate(px, py, pz); por(B, mat, g, cor, m);
    },
    cil(mat: THREE.Material, r: number, h: number, px: number, py: number, pz: number, cor: number = 0xffffff, lados = 10, r2 = r, rx = 0, rz = 0) {
      const g = new THREE.CylinderGeometry(r2, r, h, lados); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(px, py + (rx || rz ? 0 : h / 2), pz); por(B, mat, g, cor, m);
    },
    esf(mat: THREE.Material, r: number, px: number, py: number, pz: number, cor: number = 0xffffff, sy = 1) {
      const g = new THREE.SphereGeometry(r, 8, 6); g.scale(1, sy, 1); g.translate(px, py, pz); por(B, mat, g, cor, m);
    },
    pos(px: number, py: number, pz: number) { return new THREE.Vector3(px, py, pz).applyMatrix4(m); },
  };
}

export function mesa(B: Batch, b: M4, x: number, z: number, ry = 0, w = 1.6, d = 0.8, y = 0, cor = pick(MAD)) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.madeira, w, 0.07, d, 0, 0.76, 0, cor);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cx(M.madeira, 0.08, 0.74, 0.08, sx * (w / 2 - 0.08), 0.37, sz * (d / 2 - 0.08), cor);
  return P;
}
export function banco(B: Batch, b: M4, x: number, z: number, ry = 0, w = 1.5, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = pick(MAD);
  P.cx(M.madeira, w, 0.06, 0.3, 0, 0.45, 0, c);
  for (const s of [-1, 1]) P.cx(M.madeira, 0.06, 0.44, 0.26, s * (w / 2 - 0.1), 0.22, 0, c);
}
export function banqueta(B: Batch, b: M4, x: number, z: number, y = 0) {
  const P = peca(B, b, x, y, z, rnd() * 6), M = MAT(), c = pick(MAD);
  P.cil(M.madeira, 0.18, 0.05, 0, 0.6, 0, c, 8);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; P.cx(M.madeira, 0.04, 0.6, 0.04, Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12, c); }
}
export function cadeira(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = pick(MAD);
  P.cx(M.madeira, 0.44, 0.05, 0.42, 0, 0.46, 0, c);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cx(M.madeira, 0.05, 0.46, 0.05, sx * 0.18, 0.23, sz * 0.17, c);
  P.cx(M.madeira, 0.44, 0.55, 0.05, 0, 0.75, -0.19, c);
}
/** cama com colchão de palha, travesseiro e manta; rica = dossel */
export function cama(B: Batch, b: M4, x: number, z: number, ry = 0, rica = false, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = pick(MAD);
  P.cx(M.madeira, 1.1, 0.3, 2.05, 0, 0.25, 0, c);
  P.cx(M.madeira, 1.1, 0.75, 0.08, 0, 0.45, -1.0, c);
  P.cx(M.plain, 1.0, 0.16, 1.9, 0, 0.47, 0.02, rica ? 0xcfc4b0 : 0xa89878);
  P.cx(M.tecido, 1.04, 0.06, 1.2, 0, 0.57, 0.35, rica ? 0x5a1a22 : pick([0x5a4a3a, 0x3a4048, 0x4a2a24]));
  P.cx(M.plain, 0.6, 0.1, 0.32, 0, 0.6, -0.75, 0xd8d0c0);
  if (rica) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cx(M.madeira, 0.07, 2.1, 0.07, sx * 0.52, 1.05, sz * 1.0, c);
    P.cx(M.tecido, 1.16, 0.05, 2.1, 0, 2.12, 0, 0x4a141c);
    P.cx(M.tecido, 0.03, 1.2, 2.06, -0.56, 1.5, 0, 0x4a141c); P.cx(M.tecido, 0.03, 1.2, 2.06, 0.56, 1.5, 0, 0x4a141c);
  }
}
export function bau(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.madeira, 0.9, 0.5, 0.5, 0, 0.25, 0, 0x4a3020);
  P.cil(M.madeira, 0.25, 0.9, 0, 0.5, 0, 0x4a3020, 8, 0.25, 0, Math.PI / 2);
  for (const s of [-0.3, 0.3]) P.cx(M.ferro, 0.05, 0.56, 0.54, s, 0.28, 0);
}
/** estante com livros coloridos (cores escuras, gastas) */
export function estante(B: Batch, b: M4, x: number, z: number, ry = 0, w = 1.4, h = 2.0, livros = true, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = 0x3a2a1c;
  P.cx(M.madeira, w, h, 0.05, 0, h / 2, -0.17, c);
  for (const s of [-1, 1]) P.cx(M.madeira, 0.05, h, 0.38, s * w / 2, h / 2, 0, c);
  const n = Math.round(h / 0.45);
  for (let i = 0; i <= n; i++) {
    const py = 0.06 + i * (h - 0.1) / n; P.cx(M.madeira, w, 0.04, 0.36, 0, py, 0, c);
    if (livros && i < n) for (let xx = -w / 2 + 0.08; xx < w / 2 - 0.08;) {
      const lw = 0.04 + rnd() * 0.05, lh = 0.22 + rnd() * 0.12;
      if (rnd() < 0.85) P.cx(M.plain, lw, lh, 0.22 + rnd() * 0.06, xx + lw / 2, py + lh / 2 + 0.02, 0.02, pick([0x5a1a1a, 0x2a3a2a, 0x3a2a1a, 0x1e2430, 0x6a5030, 0x40201a, 0x26201a]));
      xx += lw + 0.006;
    }
  }
}
/** prateleira de parede com potes/garrafas/ervas */
export function prateleira(B: Batch, b: M4, x: number, z: number, ry = 0, w = 1.6, y = 1.2, tipo: 'garrafas' | 'potes' | 'ervas' = 'garrafas') {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  for (const py of [0, 0.5]) {
    P.cx(M.madeira, w, 0.04, 0.28, 0, py, 0, 0x3a2a1c);
    for (let xx = -w / 2 + 0.1; xx < w / 2 - 0.05; xx += 0.14 + rnd() * 0.1) {
      if (tipo === 'garrafas') { const h = 0.22 + rnd() * 0.12; P.cil(M.plain, 0.035, h, xx, py + 0.02, (rnd() - 0.5) * 0.12, pick([0x1a3020, 0x3a1a10, 0x20283a, 0x4a3a1a]), 6, 0.035); P.cil(M.plain, 0.012, 0.06, xx, py + h + 0.02, 0, 0x2a1a10, 5); }
      else if (tipo === 'potes') P.cil(M.plain, 0.05 + rnd() * 0.03, 0.1 + rnd() * 0.1, xx, py + 0.02, 0, pick([0x7a5a3a, 0x5a4a3a, 0x8a7050, 0x3a3028]), 7, 0.045);
      else P.cx(M.plain, 0.08, 0.25, 0.04, xx, py - 0.14, 0.1, pick([0x3a4a2a, 0x4a5030, 0x5a4a2a]));
    }
  }
}
/** lareira de pedra com fogo (devolve onde fica a chama para pôr luz) */
export function lareira(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0, w = 1.8) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.pedra, w, 1.3, 0.25, 0, 0.65, 0.4 - 0.12, 0x6a6058);  // frente (com a boca recortada abaixo)
  P.cx(M.pedra, 0.35, 1.2, 0.8, -w / 2 + 0.17, 0.6, 0, 0x6a6058); P.cx(M.pedra, 0.35, 1.2, 0.8, w / 2 - 0.17, 0.6, 0, 0x6a6058);
  P.cx(M.pedra, w + 0.2, 0.18, 0.95, 0, 1.25, 0.05, 0x5a5048);
  P.cx(M.pedra, w * 0.7, 1.6, 0.6, 0, 2.1, -0.1, 0x5a5048);
  P.cx(M.escuro, w - 0.7, 0.9, 0.05, 0, 0.5, -0.36);
  for (let i = 0; i < 4; i++) P.cx(M.madeira, 0.6, 0.1, 0.1, (rnd() - 0.5) * 0.3, 0.1 + i * 0.03, (rnd() - 0.5) * 0.2, 0x2a1a10, 0, 0);
  for (let i = 0; i < 5; i++) { const g = new THREE.ConeGeometry(0.08 + rnd() * 0.06, 0.3 + rnd() * 0.25, 5); g.translate((rnd() - 0.5) * 0.4, 0.3, (rnd() - 0.5) * 0.15); por(B, M.aceso, g, 0xffffff, P.m); }
  return P.pos(0, 0.5, 0.1);
}
export function balcao(B: Batch, b: M4, x: number, z: number, ry = 0, w = 4, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.tabuas, w, 1.05, 0.6, 0, 0.525, 0, 0x5a4030);
  P.cx(M.madeira, w + 0.1, 0.07, 0.75, 0, 1.08, 0.05, 0x3a2618);
  for (let i = 0; i < Math.floor(w / 0.6); i++) if (rnd() < 0.5) P.cil(M.plain, 0.045, 0.14, -w / 2 + 0.3 + i * 0.6, 1.12, 0.05, pick([0x8a7a60, 0x6a5a40, 0x5a6a6a]), 7, 0.05);
}
export function barril(B: Batch, b: M4, x: number, z: number, y = 0, deitado = false, s = 1) {
  const P = peca(B, b, x, y, z, rnd() * 6), M = MAT();
  if (deitado) { P.cil(M.madeira, 0.33 * s, 0.85 * s, 0, 0.33 * s, 0, 0x5a3e28, 10, 0.28 * s, 0, Math.PI / 2); return; }
  P.cil(M.madeira, 0.28 * s, 0.85 * s, 0, 0, 0, 0x5a3e28, 10, 0.28 * s);
  P.cil(M.madeira, 0.33 * s, 0.35 * s, 0, 0.25 * s, 0, 0x5a3e28, 10, 0.33 * s);
  for (const py of [0.12, 0.72]) P.cil(M.ferro, 0.3 * s, 0.04, 0, py * s, 0, 0xffffff, 10, 0.3 * s);
}
export function caixote(B: Batch, b: M4, x: number, z: number, y = 0, s = 0.6) {
  const P = peca(B, b, x, y, z, rnd() * 0.5), M = MAT();
  P.cx(M.tabuas, s, s, s, 0, s / 2, 0, pick([0x7a6040, 0x6a5038, 0x5a4430]));
}
/** pilha de sacos de grão */
export function sacos(B: Batch, b: M4, x: number, z: number, n = 4, y = 0) {
  const P = peca(B, b, x, y, z, rnd() * 6), M = MAT();
  for (let i = 0; i < n; i++) P.esf(M.plain, 0.28, (i % 2) * 0.5 - 0.25, 0.2 + Math.floor(i / 3) * 0.32, ((i / 2) | 0) % 2 * 0.4, 0x6a5a44, 0.62);
}
export function vela(B: Batch, b: M4, x: number, y: number, z: number) {
  const P = peca(B, b, x, y, z), M = MAT();
  P.cil(M.plain, 0.025, 0.14, 0, 0, 0, 0xe8dcc0, 6);
  const g = new THREE.SphereGeometry(0.018, 5, 4); g.scale(1, 2, 1); g.translate(0, 0.17, 0); por(B, M.aceso, g, 0xffffff, P.m);
  return P.pos(0, 0.2, 0);
}
/** candelabro de ferro pendurado (roda com velas) */
export function lustre(B: Batch, b: M4, x: number, y: number, z: number, r = 0.7) {
  const P = peca(B, b, x, y, z), M = MAT();
  P.cil(M.ferro, r, 0.05, 0, 0, 0, 0xffffff, 16, r);
  P.cx(M.ferro, 0.03, 1.2, 0.03, 0, 0.6, 0);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; vela(B, P.m, Math.cos(a) * r, 0.05, Math.sin(a) * r); }
  return P.pos(0, 0.1, 0);
}
/** tapeçaria/estandarte na parede */
export function tapecaria(B: Batch, b: M4, x: number, y: number, z: number, ry = 0, w = 1.4, h = 2.2, cor = 0x4a141c) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.tecido, w, h, 0.03, 0, 0, 0, cor);
  P.cx(M.madeira, w + 0.2, 0.05, 0.05, 0, h / 2 + 0.03, 0.02, 0x2a1a10);
}
export function quadro(B: Batch, b: M4, x: number, y: number, z: number, ry = 0, w = 0.7, h = 0.9) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.madeira, w, h, 0.05, 0, 0, 0, 0x6a4a20);
  P.cx(M.plain, w - 0.12, h - 0.12, 0.02, 0, 0, 0.025, pick([0x2a2018, 0x3a3020, 0x20242a, 0x40281e]));
}
export function tapete(B: Batch, b: M4, x: number, z: number, ry = 0, w = 2, d = 1.4, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.tecido, w, 0.015, d, 0, 0.01, 0, pick([0x4a1a1a, 0x3a2a1a, 0x2a2a30]));
}
export function armario(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = pick(MAD);
  P.cx(M.madeira, 1.1, 1.9, 0.5, 0, 0.95, 0, c);
  P.cx(M.madeira, 0.02, 1.7, 0.02, 0, 0.95, 0.26, 0x1a120c);
  for (const s of [-0.08, 0.08]) P.cx(M.ferro, 0.03, 0.12, 0.03, s, 1.0, 0.27);
}
/** fogão/caldeirão de cozinha sobre o fogo */
export function caldeirao(B: Batch, b: M4, x: number, z: number, y = 0) {
  const P = peca(B, b, x, y, z), M = MAT();
  P.esf(M.ferro, 0.32, 0, 0.55, 0, 0xffffff, 0.8);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; P.cx(M.ferro, 0.04, 1.4, 0.04, Math.cos(a) * 0.5, 0.65, Math.sin(a) * 0.5, 0xffffff, Math.cos(a) * 0.3, -Math.sin(a) * 0.3); }
  for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(0.07, 0.22, 5); g.translate((rnd() - 0.5) * 0.3, 0.12, (rnd() - 0.5) * 0.3); por(B, M.aceso, g, 0xffffff, P.m); }
  return P.pos(0, 0.3, 0);
}
/** bigorna e forja (ferraria) */
export function forja(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.pedra, 1.6, 0.9, 1.2, 0, 0.45, 0, 0x5a5048);
  P.cx(M.escuro, 1.1, 0.06, 0.8, 0, 0.92, 0);
  for (let i = 0; i < 9; i++) { const g = new THREE.SphereGeometry(0.08, 5, 4); g.translate((rnd() - 0.5) * 0.9, 0.95, (rnd() - 0.5) * 0.6); por(B, M.aceso, g, 0xffffff, P.m); }
  P.cx(M.pedra, 1.0, 2.2, 0.8, 0, 2.0, -0.2, 0x4a4038);
  P.cil(M.madeira, 0.22, 0.6, 1.3, 0, 0.5, 0x5a3e28, 10);           // cepo
  P.cx(M.ferro, 0.5, 0.18, 0.2, 1.3, 0.69, 0.5); P.cx(M.ferro, 0.2, 0.15, 0.15, 1.3, 0.62, 0.5);
  return P.pos(0, 1.1, 0);
}
/** altar de pedra com toalha, velas e símbolo */
export function altar(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.pedra, 2.4, 1.0, 1.0, 0, 0.5, 0, 0x8a8278);
  P.cx(M.tecido, 2.5, 0.02, 1.05, 0, 1.01, 0, 0xd8cfb8); P.cx(M.tecido, 0.6, 0.7, 0.02, 0, 0.66, 0.52, 0x6a1a22);
  const ps: THREE.Vector3[] = [];
  for (const s of [-0.9, -0.5, 0.5, 0.9]) ps.push(vela(B, P.m, s, 1.02, 0));
  return ps;
}
/** banco de templo (comprido, com encosto) */
export function bancoTemplo(B: Batch, b: M4, x: number, z: number, ry = 0, w = 3.4, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT(), c = 0x3a2818;
  P.cx(M.madeira, w, 0.06, 0.4, 0, 0.45, 0, c); P.cx(M.madeira, w, 0.5, 0.05, 0, 0.75, -0.2, c);
  for (const s of [-1, 0, 1]) P.cx(M.madeira, 0.06, 0.95, 0.45, s * (w / 2 - 0.05), 0.47, -0.02, c);
}
/** arca de armas/escudos na parede, armadura num suporte */
export function armadura(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  P.cx(M.madeira, 0.5, 0.06, 0.5, 0, 0.03, 0, 0x3a2818); P.cx(M.madeira, 0.05, 1.3, 0.05, 0, 0.7, 0, 0x3a2818);
  P.cx(M.ferro, 0.45, 0.55, 0.25, 0, 1.25, 0); P.esf(M.ferro, 0.13, 0, 1.7, 0);
  P.cx(M.ferro, 0.12, 0.45, 0.12, -0.3, 1.25, 0); P.cx(M.ferro, 0.12, 0.45, 0.12, 0.3, 1.25, 0);
}
export function cavalete(B: Batch, b: M4, x: number, z: number, ry = 0, y = 0) {
  const P = peca(B, b, x, y, z, ry), M = MAT();
  for (let i = 0; i < 4; i++) P.cx(M.ferro, 0.05, 1.1, 0.05, -0.4 + i * 0.27, 0.9, 0, 0xffffff, (rnd() - 0.5) * 0.15);   // lanças/espadas
  P.cx(M.madeira, 1.2, 0.08, 0.2, 0, 0.5, 0, 0x3a2818); P.cx(M.madeira, 1.2, 0.08, 0.2, 0, 1.3, 0, 0x3a2818);
}
/** prato, caneca e pão sobre uma mesa (y = tampo) */
export function servico(B: Batch, b: M4, x: number, y: number, z: number) {
  const P = peca(B, b, x, y, z, rnd() * 6), M = MAT();
  P.cil(M.plain, 0.12, 0.02, 0, 0, 0, 0x8a8070, 10); P.cil(M.plain, 0.045, 0.12, 0.22, 0, 0.05, pick([0x6a5a40, 0x8a7a60]), 8, 0.05);
  if (rnd() < 0.6) P.esf(M.plain, 0.07, -0.02, 0.05, 0, 0xa07040, 0.6);
}
