// San Judas de las Ánimas — cidadezinha no semiárido do norte do México.
// Medidas da planta (metros; 1 quadrado da grade = 1 m; chão em y=0; frente = +z = sul),
// materiais e o "lote" (Batch) que junta peças por material para poucas chamadas de desenho (celular).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pbr, boxUV } from '../../core/pbr';
import { weather } from '../../core/weathering';
import { CFG } from '../../core/config';

// ---------- planta ----------
/** Eixos das ruas (x e z): quadras de 30 m, ruas de 8 m. A praça é a quadra central. */
export const GRID = [-57, -19, 19, 57];
export const STREET = 8;          // largura da rua (de fachada a fachada, sem calçada)
export const WALKW = 1.6;         // calçada
export const CURB = 0.16;         // altura do meio-fio
export const BLOCK = 30;          // quadra (inclui calçada)
export const PLAZA = 15;          // meia-largura da praça
export const TOWN = 61;           // meia-largura do núcleo urbano
/** quadras: centros em -38, 0, 38 */
export const BLK = [-38, 0, 38];

export const CHURCH = { x: 0, z0: -32, z1: -53, w: 13, wallH: 9.5, front: -32 };
export const ATRIO = { z0: -24.6, z1: -32 };
export const CANTINA = { x0: 24.6, x1: 36.6, z0: -6.3, z1: 6.3, h: 4.4 };
export const MARKET = { x0: -36.6, x1: -25.0, z0: -8, z1: 8, h: 6.2 };
export const PORTAL = { z: 24.6, depth: 3.6, x0: -14.6, x1: 14.6 };
export const KIOSCO = { r: 4.2, h: 1.1 };
export const PANTEON = { x0: 72, x1: 112, z0: -48, z1: -6 };
export const HACIENDA = { x: -104, z: 16 };
export const TOWER_W = { x: 46, z: -78 };
export const ARROYO = (x: number) => 96 + Math.sin(x * 0.03) * 7 + Math.sin(x * 0.011 + 1) * 5;
export const ROAD_S = 19;          // a estrada de terra que sai para o sul continua a rua x=19

// ---------- qualidade ----------
export const Q = {
  baixa: { seg: 150, grass: 2500, cacti: 0.55, bushes: 0.25, lights: 8, wires: false, papel: 0.5, far: false },
  media: { seg: 220, grass: 9000, cacti: 1, bushes: 1, lights: 14, wires: true, papel: 1, far: true },
  alta: { seg: 300, grass: 22000, cacti: 1.5, bushes: 1.6, lights: 22, wires: true, papel: 1, far: true },
}[CFG.quality];

// ---------- aleatório determinístico ----------
let sd = 2024;
export const reseed = (s: number) => { sd = s; };
export const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
export const pick = <T,>(a: T[]) => a[(rnd() * a.length) | 0];
export const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- cores (fachadas pintadas, já desbotadas pelo sol) ----------
export const FACADE = [0xc9796a, 0xd9a35a, 0x5f9c94, 0xc7c0ae, 0xb7655a, 0x8fa8b0, 0xd8c08a, 0xa86e86, 0x7e9a6a, 0xe2d6c0, 0xcf8b4e, 0x6f8aa6];
export const BASE = [0x6a3a32, 0x3f5f5a, 0x7a5a3a, 0x58606a, 0x8a4a3a, 0x40483c];

// ---------- materiais ----------
const vc = (m: THREE.MeshStandardMaterial) => { const c = m.clone(); c.vertexColors = true; return c; };
let _m: ReturnType<typeof makeMats> | null = null;
function makeMats() {
  return {
    /** reboco pintado (a cor vem da cor de vértice) */
    plaster: weather(vc(pbr('painted_plaster_wall', { size: 2.6, envMapIntensity: 0.5 })), { ground: 0, grime: 0.6, streaks: 0.1, moss: 0 }),
    /** reboco velho/descascado (ruína, panteão) */
    worn: weather(vc(pbr('painted_plaster_wall', { size: 1.7, normalScale: 1.6, envMapIntensity: 0.35 })), { ground: 0, grime: 1.0, streaks: 0.3, moss: 0 }),
    adobe: vc(pbr('rough_plaster_brick', { size: 2.2, envMapIntensity: 0.35 })),
    tile: vc(pbr('clay_roof_tiles_02', { size: 1.8, envMapIntensity: 0.5 })),
    dirt: vc(pbr('dry_ground_01', { size: 2.5, envMapIntensity: 0.3 })),
    roof: vc(pbr('concrete_wall_004', { size: 2.4, envMapIntensity: 0.4 })),
    stone: vc(pbr('concrete_wall_008', { size: 3, envMapIntensity: 0.5 })),
    cobble: pbr('cobblestone_floor_08', { size: 2.2, color: 0xb0a898, envMapIntensity: 0.6 }),
    terracotta: pbr('terracotta_floor_tiles', { size: 2.4, color: 0xc0a090, envMapIntensity: 0.5 }),
    sidewalk: vc(pbr('concrete_wall_006', { size: 2.5, envMapIntensity: 0.4 })),
    wood: vc(pbr('weathered_brown_planks', { size: 1.6, envMapIntensity: 0.35 })),
    woodDark: vc(pbr('dark_wooden_planks', { size: 2, envMapIntensity: 0.35 })),
    floor: pbr('old_wooden_floor_02', { size: 2.4, color: 0x9a8a80, envMapIntensity: 0.4 }),
    rust: vc(pbr('rusty_metal_02', { size: 1.5, metalMap: true })),
    iron: new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.8, roughness: 0.6, envMapIntensity: 0.7, vertexColors: true }),
    /** vidro escuro das janelas (de dia reflete o céu) */
    glass: new THREE.MeshStandardMaterial({ color: 0x0d1012, roughness: 0.12, metalness: 0.2, envMapIntensity: 1.1 }),
    /** janelas acesas à noite (intensidade ajustada pelo clima via M.glass) */
    lit: new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: 0xffa654, emissiveIntensity: 1, roughness: 0.3 }),
    plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.5 }),
    cactus: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, envMapIntensity: 0.5 }),
  };
}
export const MAT = () => (_m ||= makeMats());
export type MatKey = keyof ReturnType<typeof makeMats>;

// ---------- lote: junta geometrias por material ----------
const _c = new THREE.Color();
/** Prepara uma geometria para juntar: sem índice, com uv e cor de vértice. */
function prep(g: THREE.BufferGeometry, color: number | THREE.Color, m?: THREE.Matrix4) {
  let x = g.index ? g.toNonIndexed() : g.clone();
  if (m) x.applyMatrix4(m);
  if (!x.attributes.normal) x.computeVertexNormals();
  if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
  for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) x.deleteAttribute(k);
  if (!x.attributes.color) {
    _c.set(color as any); const n = x.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    x.setAttribute('color', new THREE.BufferAttribute(a, 3));
  }
  x.morphAttributes = {};
  return x;
}

export class Batch {
  parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  constructor(public name = 'lote') {}
  /** geo em coordenadas locais + matriz; color = tinta (multiplica a textura) */
  add(mat: THREE.Material, geo: THREE.BufferGeometry, color: number | THREE.Color = 0xffffff, m?: THREE.Matrix4) {
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat)!.push(prep(geo, color, m));
  }
  /** caixa com UV em metros (UV gerada já na posição do mundo, para as texturas não se repetirem iguais) */
  box(mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, color: number | THREE.Color = 0xffffff, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z); boxUV(g);
    this.add(mat, g, color);
  }
  build(parent: THREE.Object3D, o: { shadow?: boolean; receive?: boolean } = {}) {
    const out: THREE.Mesh[] = [];
    this.parts.forEach((gs, mat) => {
      if (!gs.length) return;
      // até ~60k vértices por malha (celular)
      for (let i = 0; i < gs.length;) {
        const chunk: THREE.BufferGeometry[] = []; let n = 0;
        while (i < gs.length && (n < 60000 || !chunk.length)) { n += gs[i].attributes.position.count; chunk.push(gs[i++]); }
        const g = mergeGeometries(chunk, false); if (!g) continue;
        g.computeBoundingSphere(); g.computeBoundingBox();
        const mesh = new THREE.Mesh(g, mat); mesh.name = this.name;
        mesh.castShadow = o.shadow ?? true; mesh.receiveShadow = o.receive ?? true;
        if (o.shadow === false) mesh.userData.ns = 1;
        parent.add(mesh); out.push(mesh);
      }
    });
    this.parts.clear();
    return out;
  }
}

/** Matriz a partir de posição/rotação/escala. */
export const mtx = (x: number, y: number, z: number, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));

// ---------- placas pintadas (texto em textura) ----------
export function signTexture(text: string, o: { bg?: string; fg?: string; w?: number; h?: number; font?: string; border?: string; sub?: string } = {}) {
  const W = o.w || 512, H = o.h || 128, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = o.bg || '#e9dcc0'; g.fillRect(0, 0, W, H);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = H * 0.06; g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1); }
  g.fillStyle = o.fg || '#7a2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = o.sub ? H * 0.42 : H * 0.56;
  g.font = `bold ${fs}px ${o.font || 'Georgia, serif'}`;
  let s = 1; while (g.measureText(text).width * s > W * 0.9) s *= 0.95;
  g.save(); g.translate(W / 2, o.sub ? H * 0.4 : H / 2); g.scale(s, 1); g.fillText(text, 0, 0); g.restore();
  if (o.sub) { g.font = `${H * 0.2}px ${o.font || 'Georgia, serif'}`; g.fillText(o.sub, W / 2, H * 0.8); }
  // desgaste: manchas e descascado
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,250,235' : '60,40,30'},${0.05 + rnd() * 0.18})`; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 2 + rnd() * 18, 1 + rnd() * 6, rnd() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function sign(text: string, w: number, h: number, o: Parameters<typeof signTexture>[1] = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTexture(text, { ...o, w: 512, h: Math.round(512 * h / w) }), roughness: 0.85, envMapIntensity: 0.4 }));
  m.receiveShadow = true;
  return m;
}
