// Harlow, Texas — cidadezinha no oeste do Texas (planície seca, mesas no horizonte).
// Planta em metros (1 quadrado = 1 m; chão y=0; +z = sul), materiais e utilitários.
// Reaproveita o lote (Batch), placas e aleatório do mapa do México.
import * as THREE from 'three';
import { pbr, boxUV } from '../../core/pbr';
import { weather } from '../../core/weathering';
import { wallGeo, type Hole } from '../igreja/common';
import { Batch, mtx } from '../mexico/common';
export { Batch, mtx, rnd, reseed, pick, sm, sign, signTexture, lod, Q } from '../mexico/common';
export { rect } from '../mexico/landmarks';

// ---------- planta ----------
export const SQ = 20;                 // meia-largura da praça do tribunal
export const RING = { street: 14, walk: 3.2 }; // rua em volta da praça e calçada coberta
export const ROW0 = SQ + RING.street + RING.walk; // 37,2: começo das lojas
export const ROWD = 15;               // profundidade das lojas
export const HWY = 104;               // rodovia (eixo z)
export const RAIL = -104;             // trilhos (eixo z)
export const RES_Z = [-64, 64];       // ruas residenciais leste-oeste
export const RES_X = [-96, 96];       // ruas residenciais norte-sul
export const EXT = 150;               // extensão das ruas residenciais
export const CHURCH = { x: -46, z: -78, w: 10, d: 18 };
export const CEMETERY = { x0: -84, x1: -60, z0: -96, z1: -72 };
export const DINER = { x0: -64, x1: -48, z0: 84, z1: 94 };
export const GAS = { x: -30, z: 88 };
export const MOTEL = { x0: 36, x1: 78, z0: 70, z1: 92 };
export const DEPOT = { x0: 4, x1: 24, z0: -98, z1: -90 };
export const ELEVATOR = { x: 46, z: -114 };
export const TOWERW = { x: -24, z: -116 };
export const FARM = { x: 168, z: 30 };
export const PUMPS: [number, number, number][] = [[130, -46, 0.4], [196, -6, 2.1], [214, 96, 1.2], [-150, 50, 3.0], [-190, -40, 0.9]];
/** círculo amassado no milharal (centro do mistério) */
export const CROP = { x: 199, z: 60, r: 7 };
export const TAVERN = { x0: -53.2, x1: -ROW0, z0: -36, z1: -18 };

// ---------- materiais ----------
const vc = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.vertexColors = true; return c; };
let _m: ReturnType<typeof make> | null = null;
function make() {
  return {
    /** tábuas pintadas (sem mapa de cor: a cor vem do vértice, o relevo das tábuas fica) */
    siding: weather(vc(pbr('weathered_plank_siding', { size: 2.2, map: false, normalScale: 1.4, envMapIntensity: 0.4 })), { ground: 0, grime: 0.7, streaks: 0.1, moss: 0.2 }),
    /** tábuas cruas (celeiro, ruína) */
    rawSiding: weather(vc(pbr('weathered_plank_siding', { size: 2.2, envMapIntensity: 0.4 })), { ground: 0, grime: 0.6, streaks: 0.08, moss: 0.2 }),
    boards: weather(vc(pbr('distressed_painted_planks', { size: 2.2, envMapIntensity: 0.4 })), { ground: 0, grime: 0.7, streaks: 0.1, moss: 0 }),
    brick: weather(vc(pbr('red_brick', { size: 1.8, envMapIntensity: 0.4 })), { ground: 0, grime: 0.6, streaks: 0.12, moss: 0 }),
    stone: vc(pbr('concrete_wall_008', { size: 3, envMapIntensity: 0.5 })),
    concrete: vc(pbr('concrete_wall_004', { size: 2.4, envMapIntensity: 0.4 })),
    sidewalk: vc(pbr('concrete_wall_006', { size: 2.5, envMapIntensity: 0.4 })),
    asphalt: pbr('asphalt_02', { size: 5, color: 0x9a9894, envMapIntensity: 0.5 }),
    shingle: vc(pbr('grey_roof_01', { size: 2.0, envMapIntensity: 0.4 })),
    tin: vc(pbr('rusty_corrugated_iron', { size: 2.0, metalMap: true, envMapIntensity: 0.6 })),
    wood: vc(pbr('weathered_brown_planks', { size: 1.6, envMapIntensity: 0.35 })),
    woodDark: vc(pbr('dark_wooden_planks', { size: 2, envMapIntensity: 0.35 })),
    floor: pbr('old_wooden_floor_02', { size: 2.4, color: 0x9a8a80, envMapIntensity: 0.4 }),
    rust: vc(pbr('rusty_metal_02', { size: 1.5, metalMap: true })),
    iron: new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.8, roughness: 0.6, envMapIntensity: 0.7, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0d1012, roughness: 0.1, metalness: 0.2, envMapIntensity: 1.2 }),
    lit: new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: 0xffb064, emissiveIntensity: 1, roughness: 0.3 }),
    plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.5 }),
    paint: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.8 }),
    veg: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, envMapIntensity: 0.5 }),
  };
}
export const TM = () => (_m ||= make());

// ---------- cores ----------
export const SIDING = [0xe8e2d4, 0xd8d0b8, 0xa8b8c0, 0xc8c098, 0xb0a890, 0x9aa894, 0xe0d0b0, 0xc0b8b0, 0x8a9aa8, 0xd8c8a8];
export const STORE = [0x8a3a30, 0x3a5a4a, 0x2e4a6a, 0xc8b890, 0x6a4a3a, 0xa86a3a, 0x5a6a5a, 0xd8d0c0];

// ---------- luzes pedidas (só as mais importantes viram PointLight) ----------
export interface LightReq { x: number; y: number; z: number; n: number; color: number; prio: number; flick?: number; vtt?: number }
export const LREQ: LightReq[] = [];
export const light = (x: number, y: number, z: number, n: number, prio: number, color = 0xffa860, o: Partial<LightReq> = {}) => LREQ.push({ x, y, z, n, prio, color, ...o });

// ---------- casca de prédio com vãos (para interiores) ----------
export interface Opening { side: 'N' | 'S' | 'E' | 'W'; at: number; w: number; h: number; sill?: number; arch?: THREE.Vector2[] }
/** quatro paredes (wallGeo) com vãos reais; opcional: oitão (empena) nos lados indicados */
export function shell(B: Batch, mat: THREE.Material, col: number, x0: number, z0: number, x1: number, z1: number, h: number, T: number, ops: Opening[], gable?: { sides: ('N' | 'S' | 'E' | 'W')[]; rise: number }, y = 0) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const side = (s: 'N' | 'S' | 'E' | 'W') => {
    const along = s === 'N' || s === 'S', w = along ? x1 - x0 : z1 - z0;
    const holes: Hole[] = ops.filter(o => o.side === s).map(o => ({
      pts: o.arch || [new THREE.Vector2(-o.w / 2, 0), new THREE.Vector2(o.w / 2, 0), new THREE.Vector2(o.w / 2, o.h), new THREE.Vector2(-o.w / 2, o.h)],
      x: along ? o.at - cx : cz - o.at, y: o.sill ?? 0,
    }));
    const top = gable?.sides.includes(s) ? [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(0, h + gable.rise), new THREE.Vector2(-w / 2, h)] : undefined;
    const g = wallGeo(w, h, T, holes, top);
    if (s === 'N') g.applyMatrix4(mtx(cx, y, z0));
    if (s === 'S') g.applyMatrix4(mtx(cx, y, z1 - T));
    if (s === 'W') g.applyMatrix4(mtx(x0, y, cz, Math.PI / 2));
    if (s === 'E') g.applyMatrix4(mtx(x1 - T, y, cz, Math.PI / 2));
    boxUV(g); B.add(mat, g, col);
  };
  (['N', 'S', 'E', 'W'] as const).forEach(side);
}

/** telhado de duas águas sobre [x0,x1]×[z0,z1]; ridge = 'x' (cumeeira ao longo de x) ou 'z' */
export function gableRoof(B: Batch, mat: THREE.Material, col: number, x0: number, z0: number, x1: number, z1: number, h: number, rise: number, ridge: 'x' | 'z', o = 0.5, th = 0.12) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const len = (ridge === 'x' ? x1 - x0 : z1 - z0) + 2 * o, hd = (ridge === 'x' ? z1 - z0 : x1 - x0) / 2;
  const a = Math.atan2(rise, hd), L = (hd + o) / Math.cos(a);
  [1, -1].forEach(s => {
    const g = new THREE.BoxGeometry(len, th, L);
    g.rotateX(s * a);
    g.translate(0, h + rise - (L / 2) * Math.sin(a) + th / 2, s * (L / 2) * Math.cos(a));
    if (ridge === 'z') g.rotateY(Math.PI / 2);
    g.translate(cx, 0, cz); boxUV(g); B.add(mat, g, col);
  });
}

/** caixa com UV de mundo, num referencial (matriz) */
export function bxM(B: Batch, mat: THREE.Material, w: number, h: number, d: number, lx: number, ly: number, lz: number, col: number | THREE.Color, M: THREE.Matrix4, rx = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz);
  g.translate(lx, ly, lz); g.applyMatrix4(M); boxUV(g); B.add(mat, g, col);
}

/** letreiro de neon: texto brilhante sobre fundo escuro (brilha mais à noite pelo M.lamps) */
export function neonTexture(text: string, color: string, o: { w?: number; h?: number; sub?: string; font?: string } = {}) {
  const W = o.w || 512, H = o.h || 160, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0c0b0a'; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = o.sub ? H * 0.46 : H * 0.6;
  g.font = `bold ${fs}px ${o.font || '"Brush Script MT", "Trebuchet MS", sans-serif'}`;
  let s = 1; while (g.measureText(text).width * s > W * 0.9) s *= 0.95;
  for (const [blur, a] of [[24, 0.9], [10, 1], [0, 1]] as const) {
    g.save(); g.shadowColor = color; g.shadowBlur = blur; g.fillStyle = blur ? color : '#fff8f0'; g.globalAlpha = a;
    g.translate(W / 2, o.sub ? H * 0.38 : H / 2); g.scale(s, 1); g.fillText(text, 0, 0); g.restore();
  }
  if (o.sub) { g.font = `bold ${H * 0.22}px "Trebuchet MS", sans-serif`; g.shadowColor = color; g.shadowBlur = 10; g.fillStyle = color; g.fillText(o.sub, W / 2, H * 0.8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
