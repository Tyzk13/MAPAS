// Sul de Arton — miniaturas do mapa regional (escala de mesa: casa ≈ 1 unidade). Cada povo tem seu jeito:
// bárbaros do gelo (pedra, troncos, telhado de couro com neve), Lomatubar (barro e palha, ruínas), Deheon
// (reboco e telha, moinhos), costa oeste (cal e telha colorida), Tapista (pedra maciça e estandartes),
// ilhas (palafitas e cais). Lugares únicos têm construção própria (Giluk, Catedral de Gelo, Valkaria…).
import * as THREE from 'three';
import { Batch, mtx } from '../mexico/common';
import { pbr, boxUV } from '../../core/pbr';
import { peca } from '../barud/mobilia';
import { addWind } from '../../core/anim';
import {
  type Lugar, LUGARES, Y, Ysolo, rnd, reseed, PERFIS, CAVERNAS, TORRES_RUINA, ACAMPAMENTOS, BATALHAS, FAROIS, PANTANO, LAGO, lugar,
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
    bandeira: (() => { const b = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }); addWind(b, { amp: 0.02, freq: 1.7, flutter: 0.035, height: 1 }, true); return b; })(),
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
export function chao(x: number, z: number, r: number) { return Math.min(Ysolo(x - r, z - r), Ysolo(x + r, z - r), Ysolo(x - r, z + r), Ysolo(x + r, z + r), Ysolo(x, z)); }
export function inclinacao(x: number, z: number, r: number) { const a = [Y(x - r, z - r), Y(x + r, z - r), Y(x - r, z + r), Y(x + r, z + r)]; return Math.max(...a) - Math.min(...a); }
const rioHash = new Map<string, number[][]>();
export function pertoDeRio(x: number, z: number, folga: number) {
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
  g.translate(0.29 * s, 0, 0); g.translate(px, py + h - 0.18 * s, pz); add(MM.bandeira, g, cor, p.m);
}

// ---------- casas por povo ----------
/** povoado: n casas espalhadas em volta do centro (evita água e ribanceira) */
function cerca(pts: [number, number][], cor = 0x5a4a38, h = 0.22, passo = 0.35) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / passo)), a = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k <= n; k++) { const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n; P(x, Ysolo(x, z), z).cx(MM.madeira, 0.04, h, 0.04, 0, h / 2, 0, cor); }
    const ym = Ysolo((ax + bx) / 2, (az + bz) / 2); const p = P((ax + bx) / 2, ym, (az + bz) / 2, a); p.cx(MM.madeira, 0.025, 0.025, L, 0, h * 0.75, 0, cor);
  }
}
/** coral da Praga: cristais rosa-alaranjados */
export function cristais(x: number, z: number, s = 1, y?: number) {
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
export function dragao(x: number, y: number, z: number, ry: number, s: number) {
  const p = P(x, y, z, ry, s), cor = 0xdaf0ff, esc = 0x9ab8d0;
  p.esf(MM.marmore, 0.55, 0, 0.6, 0, cor, 0.8); p.esf(MM.marmore, 0.45, 0, 0.55, -0.6, cor, 0.75);
  const pesc = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.7, 0.4), new THREE.Vector3(0, 1.3, 0.8), new THREE.Vector3(0, 1.9, 0.9)]), 8, 0.16, 6); add(MM.marmore, pesc, cor, p.m);
  const cab = new THREE.ConeGeometry(0.2, 0.75, 6); cab.rotateX(Math.PI / 2); cab.translate(0, 1.95, 1.25); add(MM.marmore, cab, cor, p.m);
  for (const s2 of [-1, 1]) { const ch = new THREE.ConeGeometry(0.04, 0.4, 4); ch.rotateX(-0.9); ch.rotateZ(s2 * 0.3); ch.translate(s2 * 0.1, 2.15, 0.9); add(MM.ouro, ch, 0x9ab8d0, p.m); }
  const cauda = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.5, -0.9), new THREE.Vector3(0.6, 0.3, -1.8), new THREE.Vector3(1.4, 0.2, -2.0), new THREE.Vector3(1.9, 0.35, -1.4)]), 10, 0.12, 5); add(MM.marmore, cauda, cor, p.m);
  const memb = (MM as any)._memb ||= new THREE.MeshStandardMaterial({ color: esc, roughness: 0.55, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false });
  for (const sx of [-1, 1]) { // asas de morcego: ombro, cotovelo e três dedos com membrana entre eles
    const om = new THREE.Vector3(sx * 0.3, 1.05, 0.25), co = new THREE.Vector3(sx * 1.3, 2.1, -0.15);
    const dedos = [new THREE.Vector3(sx * 2.9, 2.9, -0.5), new THREE.Vector3(sx * 3.2, 2.0, -1.2), new THREE.Vector3(sx * 2.6, 1.15, -1.9)], base = new THREE.Vector3(sx * 0.4, 0.75, -1.0);
    const osso = (a: THREE.Vector3, b2: THREE.Vector3, r: number) => { const L = a.distanceTo(b2), g = new THREE.CylinderGeometry(r * 0.6, r, L, 5); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b2.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z); add(MM.marmore, g, cor, p.m); };
    osso(om, co, 0.09); dedos.forEach(d => osso(co, d, 0.045));
    const pts = [om, co, dedos[0], co, dedos[0], dedos[1], co, dedos[1], dedos[2], co, dedos[2], base, om, co, base];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(v => [v.x, v.y, v.z]), 3)); g.computeVertexNormals(); add(memb, g, esc, p.m);
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
function farol(x: number, z: number) {
  const y = Ysolo(x, z), p = P(x, y - 0.1, z);
  for (let i = 0; i < 6; i++) { const r = new THREE.DodecahedronGeometry(0.3 + rnd() * 0.2); r.translate((rnd() - 0.5) * 1.4, 0.05, (rnd() - 0.5) * 1.4); add(MM.pedra, r, 0x6a6a6a, p.m); }
  for (let i = 0; i < 5; i++) p.cil(MM.reboco, 0.42 - i * 0.04, 0.6, 0, i * 0.6, 0, i % 2 ? 0xb03a2a : 0xf0ece0, 10, 0.4 - i * 0.04);
  p.cil(MM.aceso, 0.22, 0.35, 0, 3.0, 0, 0xffffff, 8); cone(p, MM.ardosia, 0.32, 0.4, 0, 3.35, 0, 0x2a2a2a, 8);
  OUT.halos.push([x, y + 3.1, z, 4]); OUT.luzes.push({ x, y: y + 3.2, z, cor: 0xffd090, n: 26, dist: 14 });
}
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

/** usa as peças daqui (dragão, cristais…) noutro lote (ex.: interiores) */
export function comLote(b: Batch, f: () => void) { const v = B; B = b; try { f(); } finally { B = v; } }

// ---------- tudo ----------
export function construirMiniaturas(Gr: THREE.Group, M: { lamps: THREE.MeshBasicMaterial[] }): Mini {
  MM = mats(); M.lamps.push(MM.aceso, MM.magia, MM.gelado, MM.rubro, MM.verdeBruxa);
  B = new Batch('miniaturas'); OUT = { fumaca: [], luzes: [], halos: [], animar: [] };
  reseed(1337);
  for (const L of LUGARES) {
    reseed(Math.round(Math.abs(L.x * 131 + L.z * 977)) + 7);
    switch (L.tipo) {
      case 'catedral': catedral(L); break; case 'beluhga': beluhga(L); break; case 'gelo-antigo': geloAntigo(L); break;
      case 'cabana-ian': cabana(L, false); break; case 'cabana-bruxa': cabana(L, true); break; case 'caverna': caverna(L.x, L.z, 1.6); break;
      case 'asidon': asidon(L); break; case 'korl': korl(L); break;
      case 'velha-malpetrim': velhaMalpetrim(L); break; case 'zolkan': zolkan(L); break; case 'azazel': azazel(L); break;
      case 'centauros': centauros(L); break; case 'kobolds': kobolds(L); break; case 'forte-tapista': forteTapista(L); break;
      case 'covariel': covariel(L); break; case 'ancora': ancora(L); break; case 'eremita': eremita(L); break;
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
  return OUT;
}
