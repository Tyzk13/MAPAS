// Barud — capital de Lomatubar (Tormenta 20 / Arton). Cidade murada antiga, marcada por guerras e pela Praga Coral.
// Planta em metros (1 m = 1 quadrado da grade; chão em y=0; x = leste, z = sul; o portão do Rei fica ao sul).
import * as THREE from 'three';
import { pbr, boxUV } from '../../core/pbr';
import { CFG } from '../../core/config';
import { Batch, mtx, signTexture } from '../mexico/common';
export { Batch, mtx, signTexture };

// ---------- qualidade ----------
export const Q = {
  baixa: { luzes: 8, fumaca: 10, merloes: 3.2, props: 0.5, grama: false },
  media: { luzes: 14, fumaca: 22, merloes: 2.4, props: 1, grama: true },
  alta: { luzes: 22, fumaca: 36, merloes: 2.0, props: 1.4, grama: true },
}[CFG.quality];

// ---------- aleatório determinístico ----------
let sd = 1717;
export const reseed = (s: number) => { sd = s; };
export const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
export const entre = (a: number, b: number) => a + (b - a) * rnd();
export const pick = <T,>(a: T[]) => a[(rnd() * a.length) | 0];

// ---------- muralha (polígono irregular de 12 lados; vértices a 15° + k·30°) ----------
export const MURO_R = [104, 101, 106, 100, 103, 99, 105, 102, 100, 104, 98, 103];
export const MURO: [number, number][] = MURO_R.map((r, k) => { const a = THREE.MathUtils.degToRad(15 + k * 30); return [Math.cos(a) * r, Math.sin(a) * r]; });
/** dentro do muro com folga m (positivo = longe do muro) */
export function dentroMuro(x: number, z: number, m = 0) {
  for (let i = 0; i < MURO.length; i++) {
    const [ax, az] = MURO[i], [bx, bz] = MURO[(i + 1) % MURO.length];
    const ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez);
    // normal para dentro (o polígono está em sentido horário no plano x,z com z para o sul → normal = (-ez, ex)/L aponta para dentro)
    const d = ((x - ax) * -ez + (z - az) * ex) / L;
    if (d < m) return false;
  }
  return true;
}
/** portões: no meio do lado sul (entre os vértices de 75° e 105°) e do leste (entre −15° e 15°) */
export const PORTAO_SUL = { x: (MURO[2][0] + MURO[3][0]) / 2, z: (MURO[2][1] + MURO[3][1]) / 2 };
export const PORTAO_LESTE = { x: (MURO[11][0] + MURO[0][0]) / 2, z: (MURO[11][1] + MURO[0][1]) / 2 };

// ---------- canal ----------
export const CANAL = { x0: -86, x1: 86, z0: 14, z1: 24, fundo: -1.15 };

// ---------- ruas (eixos retos; w = largura) ----------
export interface Rua { n: string; x0: number; z0: number; x1: number; z1: number; w: number; beco?: boolean }
export const RUAS: Rua[] = [
  { n: 'Via Real', x0: 0, z0: -52, x1: 0, z1: 100, w: 8 },
  { n: 'Rua das Lanternas', x0: -100, z0: -10, x1: 101, z1: -10, w: 6 },
  { n: 'Cais Norte', x0: -86, z0: 11.5, x1: 86, z1: 11.5, w: 4 },
  { n: 'Cais Sul', x0: -86, z0: 26.5, x1: 86, z1: 26.5, w: 4 },
  { n: 'Rua Baixa', x0: -88, z0: 62, x1: 88, z1: 62, w: 5 },
  { n: 'Rua da Coroa', x0: -70, z0: -42, x1: 70, z1: -42, w: 5 },
  { n: 'Rua do Templo', x0: 48, z0: -64, x1: 48, z1: 92, w: 5 },
  { n: 'Rua dos Curtidores', x0: -48, z0: -64, x1: -48, z1: 92, w: 5 },
  { n: 'Beco do Sal', x0: -24, z0: 28.5, x1: -24, z1: 59.5, w: 2.4, beco: true },
  { n: 'Beco das Velas', x0: 24, z0: 28.5, x1: 24, z1: 59.5, w: 2.4, beco: true },
  { n: 'Beco dos Mendigos', x0: -45.5, z0: 82, x1: 45.5, z1: 82, w: 2.6, beco: true },
  { n: 'Beco do Corvo', x0: -76, z0: 28.5, x1: -76, z1: 80, w: 2.4, beco: true },
  { n: 'Beco do Lírio', x0: 72, z0: 28.5, x1: 72, z1: 80, w: 2.4, beco: true },
];

// ---------- lugares marcantes (retângulos x0,x1,z0,z1) ----------
export type Ret = [number, number, number, number];
export const PRACA: Ret = [-22, 22, -34, 4];
export const FORTALEZA: Ret = [-30, 30, -92, -54];
export const CORAL: Ret = [-100, -51, -64, -14];   // Bairro Coral (isolado por barricadas)

// ---------- materiais ----------
const vc = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.vertexColors = true; return c; };
function makeMats() {
  const pl = (c: number, r = 0.85, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const vcPlain = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  return {
    pedra: vc(pbr('grey_stone_path', { size: 3 })),            // muralha, fortaleza, bases
    muro: vc(pbr('rough_plaster_brick', { size: 3 })),         // paredes de pedra rebocada
    reboco: vc(pbr('grey_plaster', { size: 3 })),              // enxaimel (preenchimento)
    madeira: vc(pbr('dark_wood', { size: 1.5 })),              // vigas, móveis
    tabuas: vc(pbr('weathered_brown_planks', { size: 2 })),    // casebres, portas, bancadas
    piso: vc(pbr('old_wooden_floor_02', { size: 2 })),         // assoalho
    lajota: vc(pbr('monastery_stone_floor', { size: 3 })),     // piso de pedra (templo, salão)
    ardosia: vc(pbr('roof_slates_02', { size: 2 })),           // telhados nobres
    telha: vc(pbr('clay_roof_tiles_02', { size: 2 })),         // telhados comuns
    calcada: pbr('cobblestone_floor_08', { size: 2.6, color: 0x9a948c }),
    terra: pbr('brown_mud_leaves_01', { size: 4, color: 0xa89c90 }),
    tecido: vc(pbr('quatrefoil_jacquard_fabric', { size: 0.8 })),
    plain: vcPlain,
    ferro: pl(0x26262a, 0.55, { metalness: 0.7 }),
    agua: pl(0x0c1416, 0.06, { metalness: 0.35, envMapIntensity: 1.2 }),
    coral: pl(0x6a0e16, 0.3, { emissive: 0x2a0306, emissiveIntensity: 0.8 }),
    escuro: pl(0x0a0908, 1),
    aceso: new THREE.MeshBasicMaterial({ color: 0xffb35a }),
    vitral: new THREE.MeshBasicMaterial({ color: 0xa8602a }),     // vitrais do templo (âmbar fechado)    // janelas acesas e chamas (vai em M.lamps)
  };
}
let _m: ReturnType<typeof makeMats> | null = null;
export const MAT = () => (_m ||= makeMats());
export type MatKey = keyof ReturnType<typeof makeMats>;

// ---------- geometrias ----------
/** coloca uma geometria (local) com a matriz e gera UV em metros no mundo */
export function por(B: Batch, mat: THREE.Material, g: THREE.BufferGeometry, cor: number | THREE.Color, m?: THREE.Matrix4) {
  if (m) g.applyMatrix4(m);
  if (!(g as any).isUVd) boxUV(g);
  B.add(mat, g, cor);
}
/** caixa local (centro x,y,z) transformada por m */
export function cx(B: Batch, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, cor: number | THREE.Color = 0xffffff, m?: THREE.Matrix4, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z);
  por(B, mat, g, cor, m);
}
/** telhado de duas águas: vão ao longo de x (largura w), comprimento d em z, altura h; beiral b */
export function telhado(B: Batch, mat: THREE.Material, w: number, d: number, h: number, y: number, cor: number, m?: THREE.Matrix4, b = 0.45, gableMat?: THREE.Material, gableCor = 0xffffff) {
  const hd = d / 2 + b, t = 0.14, A = Math.atan2(h, w / 2);
  for (const s of [-1, 1]) {
    // água do lado s: da cumeeira (0, y+h) até o beiral (s·(w/2+b), y − h·b/(w/2))
    const dx = s * (w / 2 + b), dy = -h * (1 + b / (w / 2)), L = Math.hypot(dx, dy);
    const g = new THREE.BoxGeometry(L, t, hd * 2);
    g.rotateZ(-s * A); g.translate(dx / 2, y + h + dy / 2 + t / 2, 0);
    por(B, mat, g, cor, m);
  }
  // empenas (triângulos) nas pontas
  if (gableMat) for (const s of [-1, 1]) {
    const sh = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false }); g.translate(0, y, s > 0 ? d / 2 - 0.25 : -d / 2);
    por(B, gableMat, g, gableCor, m);
  }
}
/** cone/pirâmide (telhado de torre) */
export function cone(B: Batch, mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, cor: number, lados = 10, m?: THREE.Matrix4) {
  const g = new THREE.ConeGeometry(r, h, lados, 1); g.translate(x, y + h / 2, z); por(B, mat, g, cor, m);
}
export function cil(B: Batch, mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, cor: number, lados = 14, m?: THREE.Matrix4, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, h, lados); g.translate(x, y + h / 2, z); por(B, mat, g, cor, m);
}
/** coral da praga: cristais vermelhos crescendo de um ponto */
export function coral(B: Batch, x: number, y: number, z: number, s = 1) {
  const n = 4 + ((rnd() * 5) | 0);
  for (let i = 0; i < n; i++) {
    const h = (0.25 + rnd() * 0.6) * s * 0.65, r = (0.03 + rnd() * 0.05) * s * 0.65;
    const g = new THREE.ConeGeometry(r, h, 5, 1); g.translate(0, h / 2, 0);
    g.rotateZ((rnd() - 0.5) * 1.3); g.rotateX((rnd() - 0.5) * 1.3); g.rotateY(rnd() * 6);
    g.translate(x + (rnd() - 0.5) * 0.4 * s, y, z + (rnd() - 0.5) * 0.4 * s);
    B.add(MAT().coral, g, 0xffffff);
  }
}
export const dentroRet = (x: number, z: number, r: Ret, m = 0) => x > r[0] - m && x < r[1] + m && z > r[2] - m && z < r[3] + m;
export const cruzaRet = (a: Ret, b: Ret, m = 0) => a[0] < b[1] + m && a[1] > b[0] - m && a[2] < b[3] + m && a[3] > b[2] - m;
export const retRua = (r: Rua): Ret => r.x0 === r.x1 ? [r.x0 - r.w / 2, r.x0 + r.w / 2, Math.min(r.z0, r.z1), Math.max(r.z0, r.z1)] : [Math.min(r.x0, r.x1), Math.max(r.x0, r.x1), r.z0 - r.w / 2, r.z0 + r.w / 2];

/** "Luar": luz extra de céu das cidades em escala de gente (Barud, Valkaria, Tiberus…) nos climas escuros, para as
 * ruas estreitas não sumirem. Já foi 6–7 na Noite e, numa placa de vídeo de verdade (com o bloom), telhados,
 * muralhas e montanhas ficavam BRANCOS (print do dono em Barud, nov/2026); o swiftshader das capturas escondia. */
export const LUAR = (p: { n: string; bg: number }) => (p.n === 'Noite' ? 3.5 : p.bg < 0.15 ? 1.7 : p.bg < 0.4 ? 0.8 : 0.15);
