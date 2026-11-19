// Sul de Arton — miniaturas do mapa regional (escala de mesa: casa ≈ 1 unidade). Cada povo tem seu jeito:
// bárbaros do gelo (pedra, troncos, telhado de couro com neve), Lomatubar (barro e palha, ruínas), Deheon
// (reboco e telha, moinhos), costa oeste (cal e telha colorida), Tapista (pedra maciça e estandartes),
// ilhas (palafitas e cais). Lugares únicos têm construção própria (Giluk, Catedral de Gelo, Valkaria…).
import * as THREE from 'three';
import { Batch, mtx } from '../mexico/common';
import { pbr, boxUV } from '../../core/pbr';
import { peca } from '../barud/mobilia';
import {
  type Lugar, LUGARES, Y, Ysolo, rnd, entre, reseed, PERFIS, CAVERNAS, TORRES_RUINA, ACAMPAMENTOS, BATALHAS, FAROIS, PANTANO, LAGO, lugar,
} from './geo';
import { PONTES } from './terreno';

type Peca = ReturnType<typeof peca>;
const V2 = THREE.Vector2;
let B: Batch;
const vc = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.vertexColors = true; return c; };
function mats() {
  return {
    plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.5 }),
    pedra: vc(pbr('grey_stone_path', { size: 1.4 })),
    madeira: vc(pbr('weathered_brown_planks', { size: 0.9 })),
    telha: vc(pbr('clay_roof_tiles_02', { size: 0.8 })),
    ardosia: vc(pbr('roof_slates_02', { size: 0.8 })),
    palha: vc(pbr('withered_grass', { size: 1.4 })),
    neve: vc(pbr('snow_02', { size: 2 })),
    marmore: vc(pbr('concrete_wall_008', { size: 3 })),
    reboco: vc(pbr('grey_plaster', { size: 1.6 })),
    ouro: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.32, envMapIntensity: 1.0, emissive: 0x2a1c04 }),
    gelo: new THREE.MeshStandardMaterial({ color: 0xd6f2ff, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.86, envMapIntensity: 1.8, emissive: 0x1d5a7a, emissiveIntensity: 0.45 }),
    tecido: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }),
    escuro: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }),
    coral: new THREE.MeshStandardMaterial({ color: 0xff7055, emissive: 0x7a1808, emissiveIntensity: 0.7, roughness: 0.3 }),
    agua: new THREE.MeshStandardMaterial({ color: 0x24434a, roughness: 0.12, metalness: 0.1, envMapIntensity: 1.1 }),
    aceso: new THREE.MeshBasicMaterial({ color: 0xffb35a }),
    magia: new THREE.MeshBasicMaterial({ color: 0x9a7cff }),
    gelado: new THREE.MeshBasicMaterial({ color: 0x8fe0ff }),
    rubro: new THREE.MeshBasicMaterial({ color: 0xff3020 }),
    verdeBruxa: new THREE.MeshBasicMaterial({ color: 0x8aff6a }),
  };
}
export let MM: ReturnType<typeof mats>;

export interface Mini { fumaca: THREE.Vector3[]; luzes: { x: number; y: number; z: number; cor: number; n: number; dist: number }[]; halos: [number, number, number, number][]; animar: ((t: number) => void)[] }
let OUT: Mini;

// ---------- primitivas ----------
const P = (x: number, y: number, z: number, ry = 0, s = 1) => peca(B, mtx(x, y, z, ry, s), 0, 0, 0);
const add = (mat: THREE.Material, g: THREE.BufferGeometry, cor: number | THREE.Color, m?: THREE.Matrix4) => { if (m) g.applyMatrix4(m); boxUV(g); B.add(mat, g, cor); };
function prisma(p: Peca, mat: THREE.Material, w: number, d: number, h: number, py: number, cor: number, px = 0, pz = 0, beiral = 0.08) {
  const sh = new THREE.Shape([new V2(-w / 2 - beiral, 0), new V2(w / 2 + beiral, 0), new V2(0, h)]); const g = new THREE.ExtrudeGeometry(sh, { depth: d + beiral * 2, bevelEnabled: false });
  g.translate(px, py, pz - d / 2 - beiral); add(mat, g, cor, p.m);
}
function cone(p: Peca, mat: THREE.Material, r: number, h: number, px: number, py: number, pz: number, cor: number, lados = 8) { const g = new THREE.ConeGeometry(r, h, lados); g.translate(px, py + h / 2, pz); add(mat, g, cor, p.m); }
const pt = (x: number, z: number, y?: number) => new THREE.Vector3(x, y ?? Ysolo(x, z), z);
/** chão sob uma pegada: o mais baixo dos cantos (a casa "entra" no morro) */
function chao(x: number, z: number, r: number) { return Math.min(Ysolo(x - r, z - r), Ysolo(x + r, z - r), Ysolo(x - r, z + r), Ysolo(x + r, z + r), Ysolo(x, z)); }
function inclinacao(x: number, z: number, r: number) { const a = [Y(x - r, z - r), Y(x + r, z - r), Y(x - r, z + r), Y(x + r, z + r)]; return Math.max(...a) - Math.min(...a); }
const rioHash = new Map<string, number[][]>();
function pertoDeRio(x: number, z: number, folga: number) {
  if (!rioHash.size) PERFIS.forEach(R => R.pts.forEach(([a, b], i) => { const k = Math.floor(a / 3) + ',' + Math.floor(b / 3); if (!rioHash.has(k)) rioHash.set(k, []); rioHash.get(k)!.push([a, b, R.larg[i]]); }));
  const cx = Math.floor(x / 3), cz = Math.floor(z / 3);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const [px, pz, w] of rioHash.get((cx + a) + ',' + (cz + b)) || []) if (Math.hypot(px - x, pz - z) < w + folga) return true;
  return false;
}
/** ponto bom para construir (seco, fora do rio, sem ribanceira) */
const bom = (x: number, z: number, r = 0.6, inc = 0.9) => Y(x, z) > 0.28 && !pertoDeRio(x, z, r + 0.5) && inclinacao(x, z, r) < inc;
const janela = (p: Peca, px: number, py: number, pz: number, ry = 0, s = 1) => { const g = new THREE.BoxGeometry(0.11 * s, 0.13 * s, 0.03); g.rotateY(ry); g.translate(px, py, pz); add(MM.aceso, g, 0xffffff, p.m); };
const fumo = (p: Peca, px: number, py: number, pz: number) => OUT.fumaca.push(p.pos(px, py, pz));
function bandeira(p: Peca, px: number, py: number, pz: number, h: number, cor: number, s = 1) {
  p.cil(MM.plain, 0.025 * s, h, px, py, pz, 0x3a2a1a, 4);
  const g = new THREE.PlaneGeometry(0.55 * s, 0.32 * s, 3, 1), a = g.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(a.getX(i) * 6) * 0.04 * s);
  g.translate(0.29 * s, 0, 0); g.translate(px, py + h - 0.18 * s, pz); add(MM.tecido, g, cor, p.m);
}

// ---------- casas por povo ----------
type Estilo = 'gelo' | 'lom' | 'deh' | 'oeste' | 'tap' | 'ilha' | 'tollon' | 'valk' | 'giluk' | 'ruina';
const PAL: Record<string, { parede: [THREE.Material, number[]]; teto: [THREE.Material, number[]]; base?: number }> = {};
function casa(x: number, z: number, ry: number, est: Estilo, s = 1, luz = 0.5) {
  const w = (0.75 + rnd() * 0.4) * s, d = (0.55 + rnd() * 0.3) * s, h = (0.45 + rnd() * 0.25) * s, y = chao(x, z, Math.max(w, d) * 0.55), p = P(x, y, z, ry);
  switch (est) {
    case 'gelo': case 'giluk': {
      const pedra = est === 'giluk' ? 0x9a948c : 0xa8a49c;
      p.cx(MM.pedra, w + 0.08, 0.22 + 0.4, d + 0.08, 0, -0.1, 0, pedra);
      p.cx(MM.madeira, w, h, d, 0, 0.2 + h / 2, 0, est === 'giluk' ? 0x9a6a44 : 0xa0784e);
      prisma(p, MM.neve, w, d, h * 1.05, 0.2 + h, 0xf2f6ff, 0, 0, 0.1);
      p.cx(MM.pedra, 0.14 * s, 0.5 * s, 0.14 * s, w * 0.3, 0.2 + h + 0.25, 0, 0x5a5650);
      if (rnd() < 0.7) fumo(p, w * 0.3, 0.2 + h + 0.55, 0);
      if (rnd() < luz) janela(p, -w * 0.2, 0.2 + h * 0.5, d / 2 + 0.01);
      break;
    }
    case 'lom': {
      const ruina = rnd() < 0.18;
      p.cx(MM.reboco, w, h, d, 0, h / 2 - 0.15, 0, [0xb89a6a, 0xa88a5c, 0xc4a878][(rnd() * 3) | 0]);
      if (!ruina) prisma(p, MM.palha, w, d, h * 0.9, h - 0.15, 0xb8a062);
      else { p.cx(MM.madeira, w * 0.9, 0.05, 0.06, 0, h - 0.1, d * 0.3, 0x3a2e22, 0.3); p.cx(MM.pedra, 0.2, 0.08, 0.2, w * 0.6, 0.02, 0, 0x8a7a6a); }
      if (!ruina && rnd() < luz) janela(p, w * 0.2, h * 0.45, d / 2 + 0.01);
      break;
    }
    case 'deh': {
      p.cx(MM.reboco, w, h, d, 0, h / 2 - 0.15, 0, [0xe8dcc0, 0xf0e6d0, 0xdcd0b4][(rnd() * 3) | 0]);
      for (const sx of [-1, 1]) p.cx(MM.madeira, 0.04, h, 0.04, sx * w * 0.46, h / 2 - 0.15, d / 2 + 0.01, 0x4a3424);
      prisma(p, MM.telha, w, d, h * 0.85, h - 0.15, [0xb05a3a, 0x9a4a32, 0x8a5a40][(rnd() * 3) | 0]);
      if (rnd() < luz) janela(p, -w * 0.22, h * 0.5, d / 2 + 0.01);
      if (rnd() < 0.4) fumo(p, w * 0.25, h + 0.6, 0);
      break;
    }
    case 'oeste': {
      p.cx(MM.reboco, w, h * 1.1, d, 0, h * 0.55 - 0.15, 0, [0xf4f0e6, 0xf0e8d4, 0xe8d8b8][(rnd() * 3) | 0]);
      prisma(p, MM.telha, w, d, h * 0.6, h * 1.1 - 0.15, [0xd0683a, 0xc85a30, 0x3a6a9a, 0xd8a038][(rnd() * 4) | 0]);
      if (rnd() < luz) janela(p, 0, h * 0.55, d / 2 + 0.01);
      break;
    }
    case 'tap': {
      p.cx(MM.pedra, w * 1.3, h * 1.5, d * 1.3, 0, h * 0.75 - 0.15, 0, 0x8a8078);
      p.cx(MM.pedra, w * 1.4, 0.08, d * 1.4, 0, h * 1.5 - 0.15, 0, 0x6a625a);
      if (rnd() < luz) janela(p, 0, h * 0.8, d * 0.65 + 0.01);
      break;
    }
    case 'ilha': case 'tollon': {
      p.cx(MM.madeira, w, h, d, 0, h / 2 - 0.1, 0, est === 'ilha' ? 0x7a6a54 : 0x4a3a2a);
      prisma(p, est === 'ilha' ? MM.palha : MM.plain, w, d, h * 0.8, h - 0.1, est === 'ilha' ? 0x8a7a50 : 0x4a5a30);
      if (rnd() < luz) janela(p, 0, h * 0.5, d / 2 + 0.01);
      if (rnd() < 0.5) fumo(p, w * 0.3, h + 0.5, 0);
      break;
    }
    case 'valk': {
      const hh = h * (1.4 + rnd() * 1.2);
      p.cx(MM.marmore, w, hh, d, 0, hh / 2 - 0.15, 0, [0xd8cce8, 0xc8ccd8, 0xe0d8ec][(rnd() * 3) | 0]);
      if (rnd() < 0.45) prisma(p, MM.ouro, w, d, h * 0.7, hh - 0.15, 0xe8c058); else prisma(p, MM.ardosia, w, d, h * 0.7, hh - 0.15, 0x9aa0c0);
      if (rnd() < luz) janela(p, 0, hh * 0.6, d / 2 + 0.01);
      break;
    }
    case 'ruina': {
      p.cx(MM.pedra, w, h * 0.6, 0.08, 0, h * 0.3 - 0.1, d / 2, 0x8a8478); p.cx(MM.pedra, 0.08, h * 0.9, d, w / 2, h * 0.45 - 0.1, 0, 0x8a8478);
      p.cx(MM.pedra, w * 0.5, h * 0.3, 0.08, -w * 0.2, h * 0.15 - 0.1, -d / 2, 0x7a746a);
      break;
    }
  }
  return p;
}
/** povoado: n casas espalhadas em volta do centro (evita água e ribanceira) */
function povoado(cx: number, cz: number, n: number, raio: number, est: Estilo, s = 1, luz = 0.5, alinhado = false) {
  const ps: [number, number][] = []; let tent = 0;
  while (ps.length < n && tent++ < n * 40) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()) * raio, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (!bom(x, z, 0.5 * s) || ps.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.15 * s)) continue;
    ps.push([x, z]); casa(x, z, alinhado ? Math.round(rnd() * 3) * 1.5708 + (rnd() - 0.5) * 0.15 : rnd() * 6.283, est, s, luz);
  }
  return ps;
}
function cerca(pts: [number, number][], cor = 0x5a4a38, h = 0.22, passo = 0.35) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / passo)), a = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k <= n; k++) { const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n; P(x, Ysolo(x, z), z).cx(MM.madeira, 0.04, h, 0.04, 0, h / 2, 0, cor); }
    const ym = Ysolo((ax + bx) / 2, (az + bz) / 2); const p = P((ax + bx) / 2, ym, (az + bz) / 2, a); p.cx(MM.madeira, 0.025, 0.025, L, 0, h * 0.75, 0, cor);
  }
}
function paliçada(cx: number, cz: number, r: number, n: number, h = 0.7, abertura = -1) {
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; if (abertura >= 0 && Math.abs(((a - abertura + 9.42) % 6.283) - 3.14) < 0.2) continue; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; P(x, chao(x, z, 0.1) - 0.2, z).cil(MM.madeira, 0.07, h + 0.2, 0, 0, 0, 0x5a4532, 5); }
}
function torreVigia(x: number, z: number, h = 1.6) {
  const p = P(x, chao(x, z, 0.3), z, rnd());
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.cx(MM.madeira, 0.05, h, 0.05, sx * 0.2, h / 2, sz * 0.2, 0x4a3a2a);
  p.cx(MM.madeira, 0.55, 0.06, 0.55, 0, h, 0); cone(p, MM.palha, 0.42, 0.35, 0, h + 0.25, 0, 0x8a7a50, 4);
  if (rnd() < 0.6) { janela(p, 0, h + 0.12, 0.2); OUT.halos.push([x, Y(x, z) + h + 0.2, z, 0.9]); }
}
function poco(x: number, z: number, coral = false) {
  const p = P(x, chao(x, z, 0.2), z); p.cil(MM.pedra, 0.22, 0.22, 0, 0, 0, 0x8a8478, 10); p.cil(MM.escuro, 0.16, 0.02, 0, 0.21, 0);
  for (const s of [-1, 1]) p.cx(MM.madeira, 0.03, 0.4, 0.03, s * 0.2, 0.3, 0, 0x4a3a2a); prisma(p, MM.palha, 0.5, 0.35, 0.15, 0.48, 0x8a7a50);
  if (coral) cristais(x + 0.25, z, 0.5);
}
/** coral da Praga: cristais rosa-alaranjados */
function cristais(x: number, z: number, s = 1, y?: number) {
  const y0 = y ?? Ysolo(x, z); const n = 4 + ((rnd() * 4) | 0);
  for (let i = 0; i < n; i++) { const h = (0.18 + rnd() * 0.35) * s, g = new THREE.ConeGeometry(0.04 * s + rnd() * 0.03 * s, h, 5); g.translate(0, h / 2, 0); g.rotateZ((rnd() - 0.5) * 1.1); g.rotateX((rnd() - 0.5) * 1.1); g.translate(x + (rnd() - 0.5) * 0.3 * s, y0, z + (rnd() - 0.5) * 0.3 * s); add(MM.coral, g, 0xffffff); }
}
function arvoreMorta(x: number, z: number, s = 1, coral = false) {
  const y = Ysolo(x, z), p = P(x, y, z, rnd() * 6, s);
  p.cil(MM.madeira, 0.06, 1.0, 0, -0.05, 0, 0x2e2620, 5, 0.03);
  for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, g = new THREE.CylinderGeometry(0.008, 0.03, 0.55, 4); g.translate(0, 0.27, 0); g.rotateZ(0.7 + rnd() * 0.4); g.rotateY(a); g.translate(0, 0.55 + rnd() * 0.4, 0); add(MM.madeira, g, 0x2e2620, p.m); }
  if (coral) cristais(x, z, 0.6 * s, y + 0.3 * s);
}

// ---------- lugares únicos ----------
function giluk(L: Lugar) {
  const { x, z } = L;
  // casas em terraços na encosta (o monte fica ao norte)
  for (let anel = 0; anel < 5; anel++) {
    const r = 2.2 + anel * 1.6, n = 7 + anel * 4;
    for (let i = 0; i < n; i++) { const a = Math.PI * (0.05 + 0.9 * (i + rnd() * 0.4) / n), hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r * 0.9 - 1; if (bom(hx, hz, 0.4, 2.4)) casa(hx, hz, -a + Math.PI / 2 + (rnd() - 0.5) * 0.3, 'giluk', 1.25, 0.8); }
  }
  // salão do jarl (casa longa) no alto
  const y = chao(x, z - 2.2, 1.6), p = P(x, y, z - 2.2, 0.1);
  p.cx(MM.pedra, 3.4, 0.6, 1.7, 0, 0.0, 0, 0x4a4844); p.cx(MM.madeira, 3.2, 0.9, 1.5, 0, 0.75, 0, 0x3e2e20);
  prisma(p, MM.neve, 1.5, 3.2, 1.0, 1.2, 0xf0f4ff, 0, 0, 0.15); // (vão no sentido do comprimento)
  for (const s of [-1, 1]) { p.cx(MM.madeira, 0.08, 0.5, 0.08, s * 1.5, 2.0, 0.7, 0x3a2a1a); p.cx(MM.madeira, 0.08, 0.5, 0.08, s * 1.5, 2.0, -0.7, 0x3a2a1a); }
  for (let i = -2; i <= 2; i++) janela(p, i * 0.6, 0.75, 0.76);
  fumo(p, -0.8, 2.3, 0); fumo(p, 0.8, 2.3, 0);
  // paliçada e estandartes castigados pelo vento
  paliçada(x, z + 0.5, 10.5, 70, 0.8, Math.PI / 2);
  for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + 0.7 * i / 5), bx = x + Math.cos(a) * 9.8, bz = z + 0.5 + Math.sin(a) * 9.8; bandeira(P(bx, Ysolo(bx, bz), bz, rnd()), 0, 0, 0, 1.6, i % 2 ? 0x2a4a7a : 0x7a1a1a); }
  bandeira(p, 0, 1.9, 0, 1.4, 0x2a4a7a, 1.3);
  OUT.luzes.push({ x, y: y + 2, z: z - 1, cor: 0xff9a50, n: 30, dist: 10 });
  for (let i = 0; i < 8; i++) { const a = rnd() * Math.PI, r = 2 + rnd() * 7; OUT.halos.push([x + Math.cos(a) * r, Ysolo(x + Math.cos(a) * r, z + Math.sin(a) * r) + 0.5, z + Math.sin(a) * r, 0.7]); }
}
function catedral(L: Lugar) {
  const { x, z } = L, y = Y(x, z) - 0.6, p = P(x, y, z, 0.35, 1.0);
  p.cx(MM.gelo as any, 2.4, 3.4, 6.2, 0, 1.7, 0); prisma(p, MM.gelo as any, 2.4, 6.2, 1.9, 3.4, 0xffffff);
  for (const s of [-1, 1]) { p.cx(MM.gelo as any, 1.3, 5.2, 1.3, s * 1.25, 2.6, 2.9); cone(p, MM.gelo as any, 0.85, 4.2, s * 1.25, 5.2, 2.9, 0xffffff, 6); }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const zz = -2.2 + i * 1.4; p.cx(MM.gelo as any, 0.25, 2.6, 0.25, s * 1.75, 1.3, zz); cone(p, MM.gelo as any, 0.2, 1.4, s * 1.75, 2.6, zz, 0xffffff, 5); p.cx(MM.gelo as any, 0.12, 0.12, 0.9, s * 1.45, 2.9, zz, 0xffffff, s * 0.7); }
  p.cx(MM.gelo as any, 1.0, 6.0, 1.0, 0, 3.0, -2.6); cone(p, MM.gelo as any, 0.7, 5.5, 0, 6.0, -2.6, 0xffffff, 6);
  const rosa = new THREE.CircleGeometry(0.55, 16); rosa.translate(0, 3.4, 3.56); add(MM.gelado, rosa, 0xffffff, p.m);
  for (let i = 0; i < 6; i++) { const g = new THREE.BoxGeometry(0.16, 0.9, 0.04); g.translate(-1.0 + i * 0.4, 1.2, 3.12); add(MM.gelado, g, 0xffffff, p.m); }
  // escadarias descendo pela montanha até portas escavadas na rocha
  let sx = x + 2.5, sz = z + 4, dir = 1;
  for (let i = 0; i < 26; i++) { const yy = Ysolo(sx, sz); P(sx, yy, sz, 0.35).cx(MM.gelo as any, 0.55, 0.12, 0.35, 0, 0.02, 0); sx += 0.28 * dir; sz += 0.32; if (i % 7 === 6) dir = -dir; }
  for (const [dx, dz] of [[3.5, 7], [-2.8, 6.5]]) { const xx = x + dx, zz = z + dz, yy = Ysolo(xx, zz); const q = P(xx, yy, zz, Math.atan2(dx, dz)); const g = new THREE.CircleGeometry(0.5, 12, 0, Math.PI); g.translate(0, 0, 0.05); add(MM.escuro, g, 0, q.m); }
  OUT.halos.push([x, y + 4, z, 6], [x, y + 9, z - 1, 3]);
  OUT.luzes.push({ x, y: y + 3, z, cor: 0x8fd0ff, n: 40, dist: 14 });
}
function beluhga(L: Lugar) {
  const { x, z } = L, topo = Y(x, z);
  // anel de geada: lascas de gelo em volta do pico
  for (let i = 0; i < 46; i++) { const a = (i / 46) * 6.283, r = 8 + rnd() * 2.5, xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r, h = 0.8 + rnd() * 2.2, g = new THREE.ConeGeometry(0.18 + rnd() * 0.2, h, 5); g.translate(0, h / 2, 0); g.rotateZ((rnd() - 0.5) * 0.6); g.translate(xx, Ysolo(xx, zz) - 0.2, zz); add(MM.gelo as any, g, 0xffffff); }
  // boca do covil
  const ang = 2.6, cx = x + Math.cos(ang) * 3.2, cz = z + Math.sin(ang) * 3.2, q = P(cx, Ysolo(cx, cz) - 0.3, cz, Math.PI / 2 - ang);
  const boca = new THREE.CircleGeometry(1.5, 16, 0, Math.PI); boca.translate(0, 0, 0.3); add(MM.escuro, boca, 0, q.m);
  for (let i = 0; i < 9; i++) { const g = new THREE.ConeGeometry(0.1, 0.5 + rnd() * 0.5, 4); g.rotateX(Math.PI); g.translate(-1.2 + i * 0.3, 1.2 + rnd() * 0.2, 0.35); add(MM.gelo as any, g, 0xffffff, q.m); }
  // a Rainha Dragoa empoleirada no pico
  dragao(x - 0.6, topo - 0.4, z + 0.4, 0.6, 1.5);
  OUT.halos.push([x, topo + 2, z, 12], [x, topo - 3, z, 18]);
  OUT.luzes.push({ x, y: topo + 2, z, cor: 0x9fdcff, n: 50, dist: 18 });
}
/** dragão estilizado de gelo (corpo, pescoço, cabeça, asas e cauda) */
function dragao(x: number, y: number, z: number, ry: number, s: number) {
  const p = P(x, y, z, ry, s), cor = 0xdaf0ff, esc = 0x9ab8d0;
  p.esf(MM.marmore, 0.55, 0, 0.6, 0, cor, 0.8); p.esf(MM.marmore, 0.45, 0, 0.55, -0.6, cor, 0.75);
  const pesc = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.7, 0.4), new THREE.Vector3(0, 1.3, 0.8), new THREE.Vector3(0, 1.9, 0.9)]), 8, 0.16, 6); add(MM.marmore, pesc, cor, p.m);
  const cab = new THREE.ConeGeometry(0.2, 0.75, 6); cab.rotateX(Math.PI / 2); cab.translate(0, 1.95, 1.25); add(MM.marmore, cab, cor, p.m);
  for (const s2 of [-1, 1]) { const ch = new THREE.ConeGeometry(0.04, 0.4, 4); ch.rotateX(-0.9); ch.rotateZ(s2 * 0.3); ch.translate(s2 * 0.1, 2.15, 0.9); add(MM.ouro, ch, 0x9ab8d0, p.m); }
  const cauda = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.5, -0.9), new THREE.Vector3(0.6, 0.3, -1.8), new THREE.Vector3(1.4, 0.2, -2.0), new THREE.Vector3(1.9, 0.35, -1.4)]), 10, 0.12, 5); add(MM.marmore, cauda, cor, p.m);
  for (const sx of [-1, 1]) { // asas abertas
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.0, 0.2, sx * 2.6, 2.4, -0.4, sx * 2.2, 0.9, -1.3, 0, 1.0, 0.2, sx * 2.2, 0.9, -1.3, sx * 0.6, 0.8, -0.8], 3)); g.computeVertexNormals();
    add(new THREE.MeshStandardMaterial({ color: esc, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }), g, esc, p.m);
    p.cx(MM.marmore, 0.06, 0.06, 2.4, sx * 1.3, 1.7, -0.1, cor, 0, 0); // osso da asa
  }
  for (const sx of [-1, 1]) for (const sz of [-0.5, 0.5]) p.cil(MM.marmore, 0.08, 0.5, sx * 0.35, 0.05, sz, cor, 5);
}
function geloAntigo(L: Lugar) {
  const { x, z } = L;
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283, r = 2.4, xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r, h = 1.6 + rnd() * 1.4; P(xx, Ysolo(xx, zz) - 0.3, zz, a).cx(MM.gelo as any, 0.35, h, 0.25, 0, h / 2, 0); }
  for (const [dx, dz, a] of [[0, 0, 0.3], [3.4, 1.5, 1.2]]) { const xx = x + dx, zz = z + dz, p = P(xx, Ysolo(xx, zz) - 0.2, zz, a as number); p.cx(MM.gelo as any, 0.3, 2.2, 0.3, -0.7, 1.1, 0); p.cx(MM.gelo as any, 0.3, 2.2, 0.3, 0.7, 1.1, 0); p.cx(MM.gelo as any, 1.9, 0.3, 0.4, 0, 2.3, 0); }
  OUT.halos.push([x, Ysolo(x, z) + 1.5, z, 4]);
}
function cabana(L: Lugar, bruxa: boolean) {
  const { x, z } = L, y = chao(x, z, 0.6), p = P(x, y, z, rnd() * 6);
  p.cx(MM.madeira, 0.9, 0.55, 0.7, 0, 0.2, 0, bruxa ? 0x3a3024 : 0x5a4432);
  if (bruxa) { const g = new THREE.ConeGeometry(0.7, 0.9, 5); g.rotateZ(0.18); g.translate(0.05, 0.9, 0); add(MM.palha, g, 0x5a5232, p.m); janela(p, 0.2, 0.25, 0.36); const v = new THREE.BoxGeometry(0.12, 0.13, 0.03); v.translate(-0.2, 0.25, 0.36); add(MM.verdeBruxa, v, 0xffffff, p.m); OUT.halos.push([x, y + 0.4, z, 1.6]); for (let i = 0; i < 3; i++) arvoreMorta(x + (rnd() - 0.5) * 3, z + (rnd() - 0.5) * 3, 0.8); }
  else { prisma(p, MM.neve, 0.9, 0.7, 0.5, 0.47, 0xf2f6ff); for (let i = 0; i < 6; i++) p.cil(MM.madeira, 0.05, 0.5, 0.65, 0.03 + (i % 3) * 0.1, -0.2 + ((i / 3) | 0) * 0.1, 0x6a5038, 6, 0.05, Math.PI / 2); janela(p, -0.2, 0.25, 0.36); }
  fumo(p, 0.25, 1.0, 0);
}
function caverna(x: number, z: number, s = 1) {
  // abre para o lado do declive
  const gx = Y(x + 1, z) - Y(x - 1, z), gz = Y(x, z + 1) - Y(x, z - 1), a = Math.atan2(-gx, -gz), y = Ysolo(x, z);
  const q = P(x, y - 0.15 * s, z, a, s), g = new THREE.CircleGeometry(0.7, 12, 0, Math.PI); g.translate(0, 0, 0.25); add(MM.escuro, g, 0, q.m);
  for (let i = 0; i < 6; i++) { const r = new THREE.DodecahedronGeometry(0.18 + rnd() * 0.1); r.translate(-0.8 + i * 0.32, 0.05 + Math.sin(i / 5 * Math.PI) * 0.7, 0.2); add(MM.pedra, r, 0x8a8a90, q.m); }
}
function barudMini(L: Lugar) {
  const { x, z } = L, R = 6.6, n = 12;
  // muralha de 12 lados com torres e o Portão do Rei ao sul
  const vs: [number, number][] = []; for (let i = 0; i < n; i++) { const a = ((15 + i * 30) * Math.PI) / 180, r = R * (0.96 + 0.06 * Math.sin(i * 2.3)); vs.push([x + Math.cos(a) * r, z + Math.sin(a) * r]); }
  for (let i = 0; i < n; i++) {
    const [ax, az] = vs[i], [bx, bz] = vs[(i + 1) % n], L2 = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, y = chao(mx, mz, 0.5);
    const p = P(mx, y - 0.3, mz, a); if (i === 2) { p.cx(MM.pedra, 0.35, 1.3, L2 * 0.38, 0, 0.65, -L2 * 0.31, 0xc8c0b6); p.cx(MM.pedra, 0.35, 1.3, L2 * 0.38, 0, 0.65, L2 * 0.31, 0xc8c0b6); p.cx(MM.pedra, 0.4, 0.4, L2 * 0.3, 0, 1.15, 0, 0xc8c0b6); }
    else p.cx(MM.pedra, 0.35, 1.3, L2, 0, 0.65, 0, 0xc8c0b6);
    const t = P(ax, chao(ax, az, 0.4) - 0.3, az); t.cil(MM.pedra, 0.42, 1.9, 0, 0, 0, 0xb8b0a6, 8); cone(t, MM.telha, 0.5, 0.7, 0, 1.9, 0, 0x6a2a24, 8);
    if (i % 3 === 0) bandeira(t, 0, 2.5, 0, 0.6, 0xa01a14, 0.9);
  }
  // fortaleza no alto da colina (norte)
  const kx = x, kz = z - 3.2, ky = chao(kx, kz, 1.2), k = P(kx, ky - 0.2, kz);
  k.cx(MM.pedra, 2.4, 1.2, 1.8, 0, 0.6, 0, 0xb4aea6); k.cx(MM.pedra, 1.1, 2.8, 1.1, 0, 1.4, 0, 0xaaa49c); cone(k, MM.ardosia, 0.8, 0.9, 0, 2.8, 0, 0x3a3a44, 4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.cil(MM.pedra, 0.25, 1.7, sx * 1.15, 0, sz * 0.85, 0x4e4a46, 8); cone(k, MM.ardosia, 0.3, 0.45, sx * 1.15, 1.7, sz * 0.85, 0x3a3a44, 8); }
  bandeira(k, 0, 3.6, 0, 0.8, 0xa01a14);
  // casas apertadas, Via Real e o canal
  reseedLocal(565); let nC = 0;
  for (let i = 0; i < 260 && nC < 70; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (R - 0.9), hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r; if (Math.abs(hx - x) < 0.45 || Math.hypot(hx - kx, hz - kz) < 1.8 || Math.abs(hz - (z + 0.7)) < 0.35) continue; casa(hx, hz, Math.round(rnd() * 3) * 1.5708, hx < x - 2 && hz < z ? 'ruina' : 'lom', 0.72, hz > z + 2 ? 0.8 : 0.35); nC++; }
  { const g = new THREE.BoxGeometry(R * 1.8, 0.04, 0.5); g.translate(x, Ysolo(x, z + 0.7) + 0.02, z + 0.7); add(MM.agua, g, 0xffffff); }
  for (let i = 0; i < 8; i++) cristais(x - 2.5 - rnd() * 2.5, z - rnd() * 3, 0.55); // Bairro Coral
  OUT.luzes.push({ x, y: Ysolo(x, z) + 2, z: z + 3, cor: 0xffa050, n: 28, dist: 10 });
  for (let i = 0; i < 6; i++) OUT.halos.push([x + (rnd() - 0.5) * 6, Ysolo(x, z) + 1.2, z + 2 + rnd() * 3, 0.8]);
  for (let i = 0; i < 6; i++) OUT.fumaca.push(pt(x + (rnd() - 0.5) * 8, z + (rnd() - 0.5) * 8, Ysolo(x, z) + 1.4));
}
let _sd = 0; const reseedLocal = (s: number) => { _sd = s; reseed(s); };
function nimbarann(L: Lugar) {
  const { x, z } = L; povoado(x, z, 22, 3.8, 'lom', 0.75, 0.6, true); paliçada(x, z, 4.6, 56, 0.6, Math.PI / 2);
  for (const a of [0.8, 2.3, 3.9, 5.5]) torreVigia(x + Math.cos(a) * 4.8, z + Math.sin(a) * 4.8);
  poco(x, z); for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, r = 6 + rnd() * 3; trigal(x + Math.cos(a) * r, z + Math.sin(a) * r, a); }
}
function trigal(x: number, z: number, a: number) { // faixas de trigo dourado com cerca
  if (!bom(x, z, 1.4, 1.2)) return; const p = P(x, Ysolo(x, z), z, a);
  for (let i = 0; i < 5; i++) p.cx(MM.palha, 2.6, 0.12, 0.3, 0, 0.04, -0.8 + i * 0.4, i % 2 ? 0xd8b850 : 0xc8a440);
  cerca([[x - 1.5, z - 1.1], [x + 1.5, z - 1.1]].map(([a2, b]) => [a2, b] as [number, number]));
}
function vilaLom(L: Lugar) { povoado(L.x, L.z, 10 + ((rnd() * 5) | 0), 2.8 * (L.tam ?? 1), 'lom', 0.75, 0.45); poco(L.x + 0.6, L.z + 0.4, rnd() < 0.5); cerca([[L.x + 2, L.z - 2], [L.x + 3.2, L.z - 0.5], [L.x + 3.4, L.z + 1.2]]); }
function asidon(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 2.6), p = P(x, y - 0.3, z, 0.2), H = 1.5, S = 2.6;
  for (const [px, pz, w, d] of [[0, -S, S * 2, 0.4], [0, S, S * 2, 0.4], [-S, 0, 0.4, S * 2], [S, 0, 0.4, S * 2]]) { if (pz === S) { p.cx(MM.pedra, S * 0.8, H, d, -S * 0.6, H / 2, pz, 0x7a746c); p.cx(MM.pedra, S * 0.8, H, d, S * 0.6, H / 2, pz, 0x7a746c); p.cx(MM.pedra, 0.8, 0.4, d, 0, H - 0.2, pz, 0x7a746c); } else p.cx(MM.pedra, w, H, d, px, H / 2, pz, 0x7a746c); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { p.cil(MM.pedra, 0.55, 2.3, sx * S, 0, sz * S, 0x6e6860, 10); cone(p, MM.ardosia, 0.65, 0.8, sx * S, 2.3, sz * S, 0x3a3a46, 10); }
  p.cx(MM.pedra, 1.6, 3.2, 1.6, 0, 1.6, -0.4, 0x6a645c); cone(p, MM.ardosia, 1.2, 1.1, 0, 3.2, -0.4, 0x3a3a46, 4);
  bandeira(p, 0, 4.1, -0.4, 1, 0xd8b020); bandeira(p, S, 3.0, S, 0.6, 0x1a1a1a);
  for (let i = -1; i <= 1; i++) janela(p, i * 0.45, 2.2, 0.41);
  OUT.luzes.push({ x, y: y + 2, z, cor: 0xffa050, n: 22, dist: 8 });
}
function korl(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 1.6), p = P(x, y - 0.1, z, 0.4);
  for (let i = 0; i < 3; i++) p.cx(MM.pedra, 3.2 - i * 0.3, 0.2, 2.4 - i * 0.3, 0, 0.1 + i * 0.2, 0, 0x9a948a);
  for (let i = 0; i < 5; i++) for (const sz of [-0.8, 0.8]) p.cil(MM.marmore, 0.1, 1.3, -1.1 + i * 0.55, 0.6, sz, 0xd8d2c4, 8);
  p.cx(MM.pedra, 2.9, 0.18, 2.0, 0, 1.95, 0, 0x8a847a); prisma(p, MM.pedra, 2.0, 2.9, 0.55, 2.04, 0x8a847a);
  p.cil(MM.marmore, 0.18, 0.8, 0, 0.6, 0, 0x6a6058, 6); p.esf(MM.marmore, 0.16, 0, 1.5, 0, 0x6a6058);
  for (const s of [-1, 1]) { p.cil(MM.pedra, 0.08, 0.4, s * 1.6, 0.6, 1.3, 0x5a5650, 6); const f = new THREE.ConeGeometry(0.07, 0.2, 5); f.translate(s * 1.6, 1.1, 1.3); add(MM.aceso, f, 0xffffff, p.m); }
  OUT.halos.push([x, y + 1.1, z, 2.2]);
}
function torreRuina(x: number, z: number) {
  const y = chao(x, z, 0.5), p = P(x, y - 0.2, z, rnd() * 6);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283, h = 0.6 + rnd() * 1.6; p.cx(MM.pedra, 0.32, h, 0.18, Math.cos(a) * 0.45, h / 2, Math.sin(a) * 0.45, 0x7a7468, 0, 0); }
  for (let i = 0; i < 8; i++) { const r = new THREE.DodecahedronGeometry(0.1 + rnd() * 0.08); r.translate((rnd() - 0.5) * 1.8, 0.05, (rnd() - 0.5) * 1.8); add(MM.pedra, r, 0x7a7468, p.m); }
}
function acampamento(x: number, z: number) {
  for (let i = 0; i < 5; i++) { const xx = x + (rnd() - 0.5) * 3, zz = z + (rnd() - 0.5) * 3, p = P(xx, Ysolo(xx, zz), zz, rnd() * 6), g = new THREE.ConeGeometry(0.4, 0.5, 4); g.rotateZ(rnd() < 0.4 ? 0.9 : 0.1); g.translate(0, 0.2, 0); add(MM.tecido, g, [0x8a7a62, 0x6a5a48, 0x9a8a6a][i % 3], p.m); }
  const p = P(x, Ysolo(x, z), z); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28, r = new THREE.DodecahedronGeometry(0.06); r.translate(Math.cos(a) * 0.2, 0.03, Math.sin(a) * 0.2); add(MM.pedra, r, 0x5a5650, p.m); }
  p.cx(MM.escuro, 0.25, 0.02, 0.25, 0, 0.01, 0); p.cx(MM.madeira, 0.9, 0.08, 0.4, 0.8, 0.1, 0.6, 0x4a3a2a, 0.4);
}
function batalha(x: number, z: number) {
  const y = Ysolo(x, z), p = P(x, y, z, rnd());
  p.esf(MM.palha, 0.9, 0, -0.55, 0, 0x7a6a48, 0.7);
  for (const s of [-1, 1]) { // espadas cruzadas
    const q = P(x, y, z, rnd() * 0.2 + (s > 0 ? 0.6 : 0.6 + Math.PI / 2));
    const g = new THREE.BoxGeometry(0.16, 2.4, 0.05); g.translate(0, 1.2, 0); g.rotateZ(s * 0.55); g.translate(0, 0.2, 0); add(MM.plain, g, 0xc8ccd4, q.m);
    const gu = new THREE.BoxGeometry(0.6, 0.08, 0.1); gu.translate(0, 2.1, 0); gu.rotateZ(s * 0.55); gu.translate(0, 0.2, 0); add(MM.ouro, gu, 0xc8a040, q.m);
    const pu = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 5); pu.translate(0, 2.4, 0); pu.rotateZ(s * 0.55); pu.translate(0, 0.2, 0); add(MM.plain, pu, 0x4a2a1a, q.m);
  }
  for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = 0.8 + rnd() * 2.2, xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r, q = P(xx, Ysolo(xx, zz), zz, rnd() * 6); if (i % 3) q.cx(MM.madeira, 0.03, 0.9, 0.03, 0, 0.3, 0, 0x5a4a38, 0.7); else q.cil(MM.plain, 0.12, 0.03, 0, 0.02, 0, 0x6a3a2a, 8); }
}
function pantano() {
  const { x, z, r } = PANTANO;
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * r * 0.9, xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr, g = new THREE.CircleGeometry(0.6 + rnd() * 1.3, 10); g.rotateX(-Math.PI / 2); g.scale(1, 1, 0.6 + rnd() * 0.5); g.translate(xx, Ysolo(xx, zz) + 0.04, zz); add(MM.agua, g, 0xffffff); }
  for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * r, xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr; arvoreMorta(xx, zz, 0.7 + rnd() * 0.5, rnd() < 0.4); }
  for (let i = 0; i < 30; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * r, xx = x + Math.cos(a) * rr, zz = z + Math.sin(a) * rr, p = P(xx, Ysolo(xx, zz), zz); for (let k = 0; k < 5; k++) p.cx(MM.palha, 0.02, 0.35, 0.02, (rnd() - 0.5) * 0.2, 0.15, (rnd() - 0.5) * 0.2, 0x6a6a38, (rnd() - 0.5) * 0.4); }
}
function valkaria(L: Lugar) {
  const { x, z } = L, y0 = Ysolo(x, z);
  // a estátua colossal da deusa: manto em torno, mãos sobre o punho da espada
  const p = P(x, y0, z, 0.25, 1.75), lil = 0xd8d0e8, cin = 0xc8ccd8;
  const manto = new THREE.LatheGeometry([[0, 0], [2.6, 0], [2.4, 1.5], [2.1, 4], [1.8, 7], [1.5, 9.5], [1.3, 11.5], [1.55, 13], [1.7, 14.2], [1.3, 15.4], [0.7, 16.2], [0, 16.4]].map(([a, b]) => new V2(a, b)), 20);
  add(MM.marmore, manto, lil, p.m);
  for (const hh of [1.5, 4, 7, 9.5]) { const t = new THREE.TorusGeometry(2.6 - hh * 0.12, 0.09, 6, 28); t.rotateX(Math.PI / 2); t.translate(0, hh, 0); add(MM.ouro, t, 0xd8b048, p.m); }
  const esp = new THREE.TorusGeometry(1.65, 0.07, 6, 30, Math.PI * 1.4); esp.rotateX(Math.PI / 2); esp.rotateZ(0.3); esp.translate(0, 12.4, 0); add(MM.ouro, esp, 0xd8b048, p.m);
  p.esf(MM.marmore, 1.0, 0, 17.3, 0, cin, 1.12); // cabeça
  const cab = new THREE.ConeGeometry(1.05, 3.2, 12); cab.translate(0, 15.8, -0.35); add(MM.marmore, cab, lil, p.m); // cabelos
  const coroa = new THREE.TorusGeometry(0.85, 0.12, 6, 16); coroa.rotateX(Math.PI / 2); coroa.translate(0, 18.1, 0); add(MM.ouro, coroa, 0xd8b048, p.m);
  for (const s of [-1, 1]) { const b = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 1.5, 14.4, 0), new THREE.Vector3(s * 1.7, 12.6, 0.5), new THREE.Vector3(s * 0.5, 11.6, 1.3)]), 8, 0.36, 8); add(MM.marmore, b, lil, p.m); }
  p.cx(MM.marmore, 0.32, 9.6, 0.12, 0, 6.6, 1.7, 0xe8ecf4); p.cx(MM.ouro, 1.8, 0.3, 0.3, 0, 11.3, 1.6, 0xd8b048); p.cil(MM.ouro, 0.14, 1.0, 0, 11.4, 1.6, 0xd8b048, 6);
  // palácios até a cintura da deusa, jardins suspensos e viadutos
  const torres: THREE.Vector3[] = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.2, r = 6.4 + rnd() * 1.4, tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r, h = 8 + rnd() * 7, q = P(tx, Ysolo(tx, tz) - 0.2, tz, a);
    q.cx(MM.marmore, 1.3, h, 1.3, 0, h / 2, 0, i % 2 ? lil : cin); cone(q, MM.ouro, 0.95, 1.6, 0, h, 0, 0xd8b048, 6);
    q.cx(MM.plain, 1.5, 0.25, 1.5, 0, h * 0.62, 0, 0x4a7a3a); for (let k = 0; k < 6; k++) q.esf(MM.plain, 0.22, (rnd() - 0.5) * 1.3, h * 0.62 + 0.2, (rnd() - 0.5) * 1.3, 0x3a6a32);
    for (let k = 0; k < 4; k++) janela(q, (k - 1.5) * 0.28, h * (0.3 + k * 0.1), 0.66, 0, 1.3);
    torres.push(new THREE.Vector3(tx, Ysolo(tx, tz) + h * 0.5, tz)); }
  for (let i = 0; i < torres.length; i++) { const a = torres[i], b = torres[(i + 1) % torres.length], m = a.clone().add(b).multiplyScalar(0.5), L2 = a.distanceTo(b); const q = P(m.x, Math.min(a.y, b.y), m.z, Math.atan2(b.x - a.x, b.z - a.z)); q.cx(MM.marmore, 0.5, 0.25, L2, 0, 0, 0, 0xe0dcec); for (let k = -1; k <= 1; k++) q.cx(MM.marmore, 0.2, q.pos(0, 0, 0).y - Ysolo(m.x, m.z), 0.2, 0, -(q.pos(0, 0, 0).y - Ysolo(m.x, m.z)) / 2, k * L2 * 0.3, 0xd0ccdc); }
  // praça com as estátuas menores do Panteão
  for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.283, r = 4.8, sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r, q = P(sx, Ysolo(sx, sz), sz, -a); q.cx(MM.marmore, 0.35, 0.3, 0.35, 0, 0.15, 0, 0xb8b4c4); q.cil(MM.marmore, 0.11, 0.7, 0, 0.3, 0, i % 3 ? 0xd8d2e4 : 0xd8b048, 6, 0.06); q.esf(MM.marmore, 0.08, 0, 1.08, 0, 0xd8d2e4); }
  // cidade em volta e o bairro pobre de barracos na periferia
  reseedLocal(790); povoado(x, z, 90, 12.5, 'valk', 0.85, 0.65, true);
  for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, r = 12.5 + rnd() * 4.5, hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r; if (!bom(hx, hz, 0.25, 1)) continue; const q = P(hx, chao(hx, hz, 0.2), hz, rnd() * 6); q.cx(MM.madeira, 0.45, 0.32, 0.4, 0, 0.1, 0, [0xa89878, 0x9a8a6a, 0xb8a888][i % 3]); q.cx(MM.palha, 0.5, 0.04, 0.45, 0, 0.28, 0, 0xa89060, 0.15); }
  // canal com barcos e pontes (o rio atravessa a cidade)
  for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6, bx = x + 2 + Math.sin(t * 6) * 1, bz = z - 12 + t * 24, q = P(bx, 0, bz, 0); q.cx(MM.madeira, 0.18, 0.08, 0.5, 0, Math.max(0, Y(bx, bz)) + 0.04, 0, 0x5a4030); }
  OUT.halos.push([x, y0 + 14, z, 14], [x, y0 + 30, z, 7]);
  OUT.luzes.push({ x, y: y0 + 6, z: z + 4, cor: 0xffc070, n: 60, dist: 22 });
  for (let i = 0; i < 20; i++) { const a = rnd() * 6.28, r = 2 + rnd() * 12; OUT.halos.push([x + Math.cos(a) * r, y0 + 1 + rnd() * 3, z + Math.sin(a) * r, 0.9]); }
  for (let i = 0; i < 12; i++) OUT.fumaca.push(pt(x + (rnd() - 0.5) * 26, z + (rnd() - 0.5) * 26, y0 + 2));
}
function malpetrim(L: Lugar) {
  const { x, z } = L;
  // cidade sobre a falésia de calcário
  reseedLocal(165); const casas = povoado(x, z - 2.5, 46, 6.5, 'oeste', 0.8, 0.7, true);
  // bairro das tavernas (muitas janelas acesas) e a Estalagem do Macaco Caolho
  for (let i = 0; i < 10; i++) OUT.halos.push([x - 2 + rnd() * 4, Ysolo(x, z) + 1.2, z - 1 + rnd() * 2, 0.8]);
  { const ex = x + 1.2, ez = z - 0.6, q = P(ex, chao(ex, ez, 0.7), ez, 0.2); q.cx(MM.madeira, 1.4, 1.0, 1.0, 0, 0.35, 0, 0x7a5a3a); prisma(q, MM.telha, 1.4, 1.0, 0.5, 0.85, 0x8a3a24); for (let k = -1; k <= 1; k++) janela(q, k * 0.4, 0.5, 0.51); q.cx(MM.madeira, 0.03, 0.4, 0.03, 0.8, 0.9, 0.55, 0x3a2a1a); q.cx(MM.plain, 0.3, 0.25, 0.03, 0.8, 0.95, 0.6, 0xd8a040); }
  // feira de Marah (tendas coloridas), Arena de Gideon e o circo dos irmãos Thiannate
  for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, r = rnd() * 2.5, tx = x - 4 + Math.cos(a) * r, tz = z - 5 + Math.sin(a) * r; if (!bom(tx, tz, 0.3, 1.2)) continue; const q = P(tx, Ysolo(tx, tz), tz, rnd()); const g = new THREE.ConeGeometry(0.32, 0.5, 6); g.translate(0, 0.25, 0); add(MM.tecido, g, [0xc83a2a, 0xe8c040, 0x2a6ac8, 0x3a9a4a, 0xe86a20][i % 5], q.m); }
  { const ax = x + 4.2, az = z - 5, q = P(ax, chao(ax, az, 1.4) - 0.1, az); const g = new THREE.TorusGeometry(1.3, 0.28, 6, 22); g.rotateX(Math.PI / 2); g.scale(1, 1.6, 0.75); g.translate(0, 0.3, 0); add(MM.pedra, g, 0xc8beac, q.m); q.cil(MM.palha, 1.0, 0.04, 0, 0.05, 0, 0xc8b080, 18); }
  { const cx = x - 5.5, cz = z - 1.8, q = P(cx, chao(cx, cz, 1), cz); const g = new THREE.ConeGeometry(1.3, 1.6, 14); g.translate(0, 0.8, 0); const c = g.attributes.position, col = new Float32Array(c.count * 3); for (let i = 0; i < c.count; i++) { const a = Math.atan2(c.getZ(i), c.getX(i)), k = Math.floor((a + Math.PI) / (Math.PI / 7)) % 2; col.set(k ? [0.85, 0.15, 0.12] : [0.95, 0.9, 0.82], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); add(MM.tecido, g, 0xffffff, q.m); bandeira(q, 0, 1.6, 0, 0.5, 0xe8c040, 0.8); }
  // escadaria pela falésia e o cais com navios lá embaixo
  let sx = x + 0.5, sz = z + 1.2, dir = 1; for (let i = 0; i < 18; i++) { const yy = Math.max(0.1, Y(sx, sz)); P(sx, yy, sz, 0.3).cx(MM.pedra, 0.4, 0.08, 0.25, 0, 0.02, 0, 0xd8d0c0); sx += 0.22 * dir; sz += 0.2; if (i % 6 === 5) dir = -dir; }
  for (let i = 0; i < 4; i++) { const cx = x - 3 + i * 2.2, cz = z + 4.8, q = P(cx, 0, cz, 0); q.cx(MM.madeira, 0.5, 0.1, 2.6, 0, 0.18, 0.6, 0x6a5038); for (let k = 0; k < 4; k++) q.cil(MM.madeira, 0.05, 0.6, 0.2 * (k % 2 ? 1 : -1), -0.4, -0.4 + k * 0.6, 0x4a3a2a, 5); }
  void casas;
  OUT.luzes.push({ x, y: Ysolo(x, z) + 2, z, cor: 0xffa050, n: 30, dist: 12 });
  for (let i = 0; i < 6; i++) OUT.fumaca.push(pt(x + (rnd() - 0.5) * 10, z - 2 + (rnd() - 0.5) * 8, Ysolo(x, z) + 1.6));
}
function velhaMalpetrim(L: Lugar) {
  const { x, z } = L;
  for (let i = 0; i < 30; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 6, hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r, y = Y(hx, hz), q = P(hx, y - 0.15, hz, rnd() * 6); const w = 0.6 + rnd() * 0.5, h = 0.3 + rnd() * 0.6; q.cx(MM.pedra, w, h, 0.08, 0, h / 2, 0.3, 0x9a9488); q.cx(MM.pedra, 0.08, h * 0.7, 0.6, w / 2, h * 0.35, 0, 0x8a8478); if (rnd() < 0.3) q.cx(MM.plain, 0.5, 0.02, 0.4, 0, 0.05, 0, 0x2a4a2a); }
  for (let i = 0; i < 7; i++) { const q = P(x + 3 + i * 0.5, 0, z + 2.5 + (rnd() - 0.5) * 0.4); q.cil(MM.madeira, 0.05, 0.7 + rnd() * 0.5, 0, -0.4, 0, 0x3a2e24, 5); }
  { const q = P(x - 2, 0, z + 3, 0.6); q.cx(MM.madeira, 0.06, 2.4, 0.06, 0, 0.6, 0, 0x3a2e24, 0.35); q.cx(MM.madeira, 1.2, 0.05, 0.05, 0.3, 1.4, 0, 0x3a2e24, 0.35); } // mastro afundado
}
function zolkan(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 1.4), p = P(x, y - 0.1, z, 0.6);
  p.cx(MM.pedra, 2.4, 1.4, 1.4, 0, 0.7, 0, 0x3a3836); prisma(p, MM.ardosia, 2.4, 1.4, 0.9, 1.4, 0x22222a);
  for (const s of [-1, 1]) { p.cx(MM.pedra, 0.7, 2.4, 0.7, s * 1.3, 1.2, 0.2, 0x34322f); cone(p, MM.ardosia, 0.55, 1.4, s * 1.3, 2.4, 0.2, 0x1e1e26, 4); }
  janela(p, 0.4, 1.0, 0.71); const v = new THREE.BoxGeometry(0.12, 0.14, 0.03); v.translate(-0.4, 1.0, 0.71); add(MM.rubro, v, 0xffffff, p.m);
  const cer: [number, number][] = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * 6.283; cer.push([x + Math.cos(a) * 3.2, z + Math.sin(a) * 2.6]); } cerca(cer, 0x1a1a1a, 0.3, 0.25);
  for (let i = 0; i < 9; i++) { const tx = x - 2.5 + (i % 3) * 0.5, tz = z + 1.8 + ((i / 3) | 0) * 0.45; P(tx, Ysolo(tx, tz), tz).cx(MM.pedra, 0.18, 0.25, 0.05, 0, 0.1, 0, 0x6a6862); }
  for (let i = 0; i < 4; i++) arvoreMorta(x + (rnd() - 0.5) * 7, z + (rnd() - 0.5) * 6, 1.1);
  OUT.halos.push([x - 0.4, y + 1.1, z, 1.2]);
}
function azazel(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 1), p = P(x, y - 0.2, z);
  p.cil(MM.pedra, 1.0, 1.0, 0, 0, 0, 0x1e1c1c, 10); p.cil(MM.pedra, 0.75, 8.5, 0, 1.0, 0, 0x22201f, 10, 0.55);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, g = new THREE.ConeGeometry(0.12, 1.3, 4); g.rotateZ(-0.35); g.translate(0.55, 9.9, 0); g.rotateY(a); add(MM.pedra, g, 0x1a1818, p.m); }
  for (let i = 0; i < 5; i++) { const g = new THREE.BoxGeometry(0.12, 0.25, 0.03); g.translate(0, 2.5 + i * 1.4, 0.62); g.rotateY(i * 1.3); add(MM.rubro, g, 0xffffff, p.m); }
  OUT.halos.push([x, y + 9.5, z, 3]);
  for (let i = 0; i < 5; i++) arvoreMorta(x + (rnd() - 0.5) * 6, z + (rnd() - 0.5) * 6, 1);
}
function centauros(L: Lugar) {
  const { x, z } = L;
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, r = 2.6 + rnd() * 0.6, hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r; if (!bom(hx, hz, 0.4, 1.2)) continue; const q = P(hx, chao(hx, hz, 0.4), hz); q.cil(MM.madeira, 0.45, 0.4, 0, -0.05, 0, 0x7a6248, 10); cone(q, MM.palha, 0.6, 0.6, 0, 0.35, 0, 0x9a8a5a, 10); }
  for (const [dx, dz, a] of [[-3.8, 2.6, 0.3], [3.6, 3.2, -0.4]]) { const q = P(x + dx, chao(x + dx, z + dz, 1.2), z + dz, a); q.cx(MM.madeira, 3.2, 0.7, 1.2, 0, 0.3, 0, 0x6a5038); prisma(q, MM.palha, 1.2, 3.2, 0.5, 0.65, 0x8a7a50); }
  const cr: [number, number][] = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * 6.283; cr.push([x + 0.5 + Math.cos(a) * 1.8, z - 3 + Math.sin(a) * 1.2]); } cerca(cr);
  OUT.fumaca.push(pt(x, z, Ysolo(x, z) + 0.8));
}
function kobolds(L: Lugar) {
  const { x, z } = L;
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 7, hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r, y = Ysolo(hx, hz), q = P(hx, y + 0.02, hz); const g = new THREE.CircleGeometry(0.16 + rnd() * 0.1, 8); g.rotateX(-Math.PI / 2); add(MM.escuro, g, 0, q.m); const m2 = new THREE.TorusGeometry(0.22, 0.06, 4, 8); m2.rotateX(Math.PI / 2); add(MM.palha, m2, 0x8a6a48, q.m); }
  for (let i = 0; i < 6; i++) { const a = rnd() * 6.28, r = rnd() * 4, hx = x + Math.cos(a) * r, hz = z + Math.sin(a) * r, q = P(hx, Ysolo(hx, hz), hz); cone(q, MM.palha, 0.3, 0.45, 0, 0, 0, 0x6a5a40, 5); }
  const q = P(x, Ysolo(x, z), z); q.cil(MM.madeira, 0.06, 1.4, 0, 0, 0, 0x5a3a2a, 5); q.esf(MM.plain, 0.12, 0, 1.4, 0, 0xc8bca0); OUT.fumaca.push(pt(x + 1, z, Ysolo(x, z) + 0.6));
}
function tiberus(L: Lugar) {
  const { x, z } = L, S = 9.5, H = 3, cor = 0x7a7068;
  for (const [px, pz, w, d] of [[0, -S, S * 2, 1.2], [-S, 0, 1.2, S * 2], [S, 0, 1.2, S * 2]]) { const q = P(x + px, chao(x + px, z + pz, 1) - 0.4, z + pz); q.cx(MM.pedra, w, H, d, 0, H / 2, 0, cor); }
  for (const s of [-1, 1]) { const q = P(x + s * S * 0.55, chao(x + s * S * 0.55, z + S, 1) - 0.4, z + S); q.cx(MM.pedra, S * 0.9, H, 1.2, 0, H / 2, 0, cor); }
  { const q = P(x, chao(x, z + S, 1.2) - 0.4, z + S); q.cx(MM.pedra, 2.2, 1.3, 1.6, 0, H + 0.2, 0, 0x6a6058); for (const s of [-1, 1]) { q.cx(MM.pedra, 1.0, 4.4, 1.8, s * 1.3, 2.2, 0, 0x6a6058); minotauroEstatua(x + s * 2.6, z + S + 1.6, 3.8); } }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const q = P(x + sx * S, chao(x + sx * S, z + sz * S, 1) - 0.4, z + sz * S); q.cx(MM.pedra, 2, H + 1.4, 2, 0, (H + 1.4) / 2, 0, 0x6a6058); bandeira(q, 0, H + 1.4, 0, 1.2, 0x9a1a14, 1.4); }
  { const ax = x + 3, az = z - 2, q = P(ax, chao(ax, az, 3) - 0.2, az); for (let k = 0; k < 4; k++) { const g = new THREE.TorusGeometry(3.4 - k * 0.45, 0.38, 6, 30); g.rotateX(Math.PI / 2); g.scale(1, 1, 0.72); g.translate(0, 0.3 + k * 0.45, 0); add(MM.pedra, g, 0x8a8076, q.m); } q.cil(MM.palha, 2.0, 0.05, 0, 0.1, 0, 0xb8a070, 20); }
  minotauroEstatua(x - 4, z - 3, 7);
  reseedLocal(88); povoado(x, z + 3, 26, 6, 'tap', 1.2, 0.5, true);
  OUT.luzes.push({ x, y: Ysolo(x, z) + 3, z, cor: 0xff9a50, n: 30, dist: 14 });
  for (let i = 0; i < 4; i++) OUT.fumaca.push(pt(x + (rnd() - 0.5) * 12, z + (rnd() - 0.5) * 12, Ysolo(x, z) + 2));
}
function minotauroEstatua(x: number, z: number, h: number) {
  const y = Ysolo(x, z), p = P(x, y, z, 0, h / 5), c = 0x8a8278;
  p.cx(MM.pedra, 1.6, 0.6, 1.6, 0, 0.3, 0, 0x6a6058); for (const s of [-1, 1]) p.cil(MM.marmore, 0.28, 1.6, s * 0.35, 0.6, 0, c, 6, 0.22);
  p.cx(MM.marmore, 1.3, 1.6, 0.8, 0, 3.0, 0, c); p.esf(MM.marmore, 0.38, 0, 4.1, 0.15, c, 1.15);
  for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(0.1, 0.8, 5); g.rotateZ(-s * 1.2); g.translate(s * 0.55, 4.45, 0.1); add(MM.marmore, g, 0xb8b0a0, p.m); p.cil(MM.marmore, 0.18, 1.5, s * 0.85, 2.2, 0, c, 6); }
  p.cx(MM.marmore, 0.12, 2.6, 0.12, 0.95, 3.0, 0.3, 0x9a9488); p.cx(MM.marmore, 0.9, 0.5, 0.08, 0.95, 4.2, 0.3, 0x9a9488); // machado
}
function forteTapista(L: Lugar) { const { x, z } = L, q = P(x, chao(x, z, 1.4) - 0.3, z, 0.3); q.cx(MM.pedra, 2.6, 1.4, 2.6, 0, 0.7, 0, 0x7a7068); q.cx(MM.pedra, 1.2, 2.6, 1.2, 0, 1.3, 0, 0x6a6058); bandeira(q, 0, 2.6, 0, 1, 0x9a1a14); }
function covariel(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 0.8), p = P(x, y - 0.2, z, rnd());
  p.cil(MM.pedra, 0.8, 5.6, 0, 0, 0, 0x7a7a6a, 12, 0.6); p.cx(MM.plain, 0.5, 0.6, 0.06, 0.2, 1.5, 0.66, 0x3a5a2a); // musgo
  cone(p, MM.ardosia, 0.8, 1.8, 0, 5.6, 0, 0x3a3a4a, 12);
  const g = new THREE.BoxGeometry(0.15, 0.22, 0.03); g.translate(0, 4.3, 0.62); add(MM.magia, g, 0xffffff, p.m); janela(p, 0.3, 2.4, 0.66);
  OUT.halos.push([x, y + 4.4, z + 0.5, 2.5]); OUT.luzes.push({ x, y: y + 4.4, z: z + 0.6, cor: 0x9a7cff, n: 14, dist: 7 });
}
function ancora(L: Lugar) {
  const { x, z } = L, y = chao(x, z, 1), p = P(x, y - 0.1, z, 0.9);
  p.cx(MM.pedra, 2.2, 0.5, 1.4, 0, 0.15, 0, 0x7a7468); p.cx(MM.madeira, 2.0, 1.0, 1.25, 0, 0.9, 0, 0x6a4a30);
  prisma(p, MM.telha, 2.0, 1.25, 0.8, 1.4, 0x5a3a2a); p.cx(MM.pedra, 0.2, 1.2, 0.2, 0.7, 1.8, 0.3, 0x6a6458); fumo(p, 0.7, 2.5, 0.3);
  for (let i = -1; i <= 1; i++) { janela(p, i * 0.55, 0.55, 0.64); janela(p, i * 0.55, 1.1, 0.64); }
  // placa com a âncora partida
  const q = peca(B, p.m, 1.25, 0, 0.7, 0); q.cx(MM.madeira, 0.06, 1.6, 0.06, 0, 0.8, 0, 0x3a2a1a); q.cx(MM.madeira, 0.5, 0.05, 0.05, 0.22, 1.55, 0, 0x3a2a1a);
  q.cx(MM.plain, 0.05, 0.42, 0.04, 0.4, 1.25, 0, 0x4a4a50); const an = new THREE.TorusGeometry(0.16, 0.025, 4, 10, Math.PI * 0.75); an.rotateZ(Math.PI * 1.1); an.translate(0.4, 1.08, 0); add(MM.plain, an, 0x4a4a50, q.m);
  // estábulo e cavalos
  const e = peca(B, p.m, -1.7, 0, 0.2, 0); e.cx(MM.madeira, 1.0, 0.55, 0.9, 0, 0.2, 0, 0x5a4030); prisma(e, MM.palha, 1.0, 0.9, 0.35, 0.47, 0x8a7a50);
  OUT.luzes.push({ x, y: y + 1.3, z, cor: 0xffa050, n: 20, dist: 8 }); OUT.halos.push([x, y + 1.2, z + 0.5, 1.6]);
}
function eremita(L: Lugar) { const { x, z } = L, p = P(x, chao(x, z, 0.5), z, rnd() * 6); p.cx(MM.madeira, 0.7, 0.45, 0.55, 0, 0.15, 0, 0x4a3a2a); prisma(p, MM.plain, 0.7, 0.55, 0.4, 0.37, 0x3a4a28); fumo(p, 0.2, 0.9, 0); for (let i = 0; i < 4; i++) p.cx(MM.plain, 0.4, 0.06, 0.12, 0.9, 0.0, -0.3 + i * 0.2, 0x5a6a30); }
function pesca(L: Lugar) {
  const { x, z } = L; povoado(x, z, 8, 2.6, 'ilha', 0.7, 0.5);
  // cais na direção do mar mais próximo
  let melhor = 0, mz = 1e9; for (let a = 0; a < 6.28; a += 0.3) { const tx = x + Math.cos(a) * 4, tz = z + Math.sin(a) * 4, h = Y(tx, tz); if (h < mz) { mz = h; melhor = a; } }
  const cx = x + Math.cos(melhor) * 3, cz = z + Math.sin(melhor) * 3, q = P(cx, 0, cz, Math.PI / 2 - melhor);
  q.cx(MM.madeira, 0.4, 0.08, 3, 0, 0.16, 1.0, 0x6a5038); for (let k = 0; k < 5; k++) q.cil(MM.madeira, 0.04, 0.6, 0.18 * (k % 2 ? 1 : -1), -0.4, -0.3 + k * 0.6, 0x4a3a2a, 5);
  for (let k = 0; k < 2; k++) q.cx(MM.madeira, 0.22, 0.1, 0.6, 0.5 + k * 0.3, 0.05, 1.5 + k * 0.4, 0x5a4030);
}
function farol(x: number, z: number) {
  const y = Ysolo(x, z), p = P(x, y - 0.1, z);
  for (let i = 0; i < 6; i++) { const r = new THREE.DodecahedronGeometry(0.3 + rnd() * 0.2); r.translate((rnd() - 0.5) * 1.4, 0.05, (rnd() - 0.5) * 1.4); add(MM.pedra, r, 0x6a6a6a, p.m); }
  for (let i = 0; i < 5; i++) p.cil(MM.reboco, 0.42 - i * 0.04, 0.6, 0, i * 0.6, 0, i % 2 ? 0xb03a2a : 0xf0ece0, 10, 0.4 - i * 0.04);
  p.cil(MM.aceso, 0.22, 0.35, 0, 3.0, 0, 0xffffff, 8); cone(p, MM.ardosia, 0.32, 0.4, 0, 3.35, 0, 0x2a2a2a, 8);
  OUT.halos.push([x, y + 3.1, z, 4]); OUT.luzes.push({ x, y: y + 3.2, z, cor: 0xffd090, n: 26, dist: 14 });
}
function porto(L: Lugar) { povoado(L.x, L.z - 1.5, 16, 3, 'deh', 0.8, 0.6, true); pesca({ ...L, z: L.z }); for (let i = 0; i < 3; i++) { const q = P(L.x - 2 + i * 1.6, chao(L.x - 2 + i * 1.6, L.z - 0.5, 0.6), L.z - 0.5, 0); q.cx(MM.madeira, 1.2, 0.6, 0.8, 0, 0.2, 0, 0x6a5038); prisma(q, MM.telha, 1.2, 0.8, 0.35, 0.5, 0x7a3a28); } }
function vilaDeh(L: Lugar) {
  const { x, z } = L; povoado(x, z, 12 + ((rnd() * 6) | 0), 3.2, 'deh', 0.8, 0.5, true);
  // igreja com torre e moinho de vento
  const ix = x + 0.6, iz = z - 0.4; if (bom(ix, iz, 0.8, 1.4)) { const q = P(ix, chao(ix, iz, 0.8), iz, rnd()); q.cx(MM.pedra, 0.8, 0.8, 1.5, 0, 0.3, 0, 0xc8c0b0); prisma(q, MM.ardosia, 0.8, 1.5, 0.5, 0.7, 0x5a5a66); q.cx(MM.pedra, 0.45, 1.8, 0.45, 0, 0.8, 0.7, 0xc0b8a8); cone(q, MM.ardosia, 0.35, 0.9, 0, 1.7, 0.7, 0x5a5a66, 4); }
  const mx = x + 3.8, mz = z + 1.5; if (bom(mx, mz, 0.4, 1.2)) { const q = P(mx, chao(mx, mz, 0.4), mz, rnd() * 6); q.cil(MM.reboco, 0.3, 1.4, 0, 0, 0, 0xe0d8c8, 8, 0.22); cone(q, MM.telha, 0.3, 0.4, 0, 1.4, 0, 0x8a4a32, 8); for (let k = 0; k < 4; k++) { const g = new THREE.BoxGeometry(0.1, 1.1, 0.02); g.translate(0, 0.55, 0); g.rotateZ(k * Math.PI / 2 + 0.3); g.translate(0, 1.3, 0.28); add(MM.madeira, g, 0xd8cdb4, q.m); } }
  for (let i = 0; i < 3; i++) { const a = rnd() * 6.28, r = 5 + rnd() * 2, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r; if (bom(cx, cz, 1.4, 1.2)) cerca([[cx - 1.5, cz - 1], [cx + 1.5, cz - 1], [cx + 1.5, cz + 1], [cx - 1.5, cz + 1], [cx - 1.5, cz - 1]]); }
}
function aldeiaGelo(L: Lugar) { const { x, z } = L; povoado(x, z, 6, 1.9, 'gelo', 0.85, 0.6); const p = P(x, Ysolo(x, z), z); p.cil(MM.pedra, 0.25, 0.08, 0, 0, 0, 0x5a5650, 8); const f = new THREE.ConeGeometry(0.12, 0.3, 5); f.translate(0, 0.2, 0); add(MM.aceso, f, 0xffffff, p.m); OUT.halos.push([x, Ysolo(x, z) + 0.3, z, 1.2]); for (let i = 0; i < 2; i++) p.cx(MM.madeira, 0.03, 0.6, 0.6, 1.2, 0.3, (i - 0.5) * 0.8, 0x5a4030); }
function aldeiaGeral(L: Lugar) { povoado(L.x, L.z, 9, 2.6, 'oeste', 0.8, 0.5); }

// ---------- pontes (estradas: pedra em arco; trilhas: madeira) ----------
function pontes() {
  for (const pn of PONTES) {
    const p = P(pn.x, pn.y, pn.z, pn.a), L = pn.L;
    if (pn.trilha) { p.cx(MM.madeira, 0.5, 0.06, L, 0, 0, 0, 0x6a5038); for (const s of [-1, 1]) { p.cx(MM.madeira, 0.03, 0.03, L, s * 0.24, 0.22, 0, 0x4a3a2a); for (let k = 0; k <= 4; k++) p.cx(MM.madeira, 0.03, 0.24, 0.03, s * 0.24, 0.1, -L / 2 + (k * L) / 4, 0x4a3a2a); } }
    else {
      p.cx(MM.pedra, 0.85, 0.16, L, 0, 0, 0, 0x8a847a);
      for (const s of [-1, 1]) p.cx(MM.pedra, 0.08, 0.2, L, s * 0.42, 0.16, 0, 0x7a746a);
      const arco = new THREE.TorusGeometry(Math.min(1.3, L * 0.32), 0.18, 5, 12, Math.PI); arco.rotateY(Math.PI / 2); arco.scale(1, 0.7, 1); arco.translate(0, -0.08, 0); add(MM.pedra, arco, 0x7a746a, p.m);
      for (const s of [-1, 1]) p.cx(MM.pedra, 0.8, 1.2, 0.3, 0, -0.6, s * L * 0.42, 0x6a645a);
    }
  }
}

// ---------- tudo ----------
export function construirMiniaturas(Gr: THREE.Group, M: { lamps: THREE.MeshBasicMaterial[] }): Mini {
  MM = mats(); M.lamps.push(MM.aceso, MM.magia, MM.gelado, MM.rubro, MM.verdeBruxa);
  B = new Batch('miniaturas'); OUT = { fumaca: [], luzes: [], halos: [], animar: [] };
  reseed(1337);
  for (const L of LUGARES) {
    reseed(Math.round(Math.abs(L.x * 131 + L.z * 977)) + 7);
    switch (L.tipo) {
      case 'giluk': giluk(L); break; case 'catedral': catedral(L); break; case 'beluhga': beluhga(L); break; case 'gelo-antigo': geloAntigo(L); break;
      case 'cabana-ian': cabana(L, false); break; case 'cabana-bruxa': cabana(L, true); break; case 'caverna': caverna(L.x, L.z, 1.6); break;
      case 'barud': barudMini(L); break; case 'nimbarann': nimbarann(L); break; case 'vila-lom': vilaLom(L); break; case 'asidon': asidon(L); break; case 'korl': korl(L); break;
      case 'valkaria': valkaria(L); break; case 'porto': porto(L); break; case 'vila-deh': vilaDeh(L); break;
      case 'malpetrim': malpetrim(L); break; case 'velha-malpetrim': velhaMalpetrim(L); break; case 'zolkan': zolkan(L); break; case 'azazel': azazel(L); break;
      case 'centauros': centauros(L); break; case 'kobolds': kobolds(L); break; case 'tiberus': tiberus(L); break; case 'forte-tapista': forteTapista(L); break;
      case 'covariel': covariel(L); break; case 'ancora': ancora(L); break; case 'eremita': eremita(L); break;
      case 'pesca': pesca(L); break; case 'aldeia-gelo': aldeiaGelo(L); break; case 'vila': aldeiaGeral(L); break;
    }
  }
  reseed(99);
  CAVERNAS.forEach(([x, z]) => caverna(x, z, 1.2)); TORRES_RUINA.forEach(([x, z]) => torreRuina(x, z)); ACAMPAMENTOS.forEach(([x, z]) => acampamento(x, z));
  BATALHAS.forEach(([x, z]) => batalha(x, z)); FAROIS.forEach(([x, z]) => farol(x, z)); pantano(); pontes();
  // coral da Praga: margens do rio de Barud e árvores mortas
  const br = lugar('barud'); for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r = 7.5 + rnd() * 14, x = br.x + Math.cos(a) * r, z = br.z + Math.sin(a) * r; if (Y(x, z) > 0.3) (rnd() < 0.3 ? arvoreMorta(x, z, 0.8, true) : cristais(x, z, 0.6)); }
  // gelo à volta do lago de montanha
  for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, x = LAGO.x + Math.cos(a) * LAGO.rx * 1.05, z = LAGO.z + Math.sin(a) * LAGO.rz * 1.05; const h = 0.3 + rnd() * 0.5, g = new THREE.ConeGeometry(0.15, h, 5); g.translate(x, LAGO.nivel + h / 2 - 0.1, z); add(MM.gelo as any, g, 0xffffff); }
  const grupo = new THREE.Group(); grupo.name = 'Miniaturas'; B.build(grupo); grupo.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); Gr.add(grupo);
  void _sd;
  return OUT;
}
