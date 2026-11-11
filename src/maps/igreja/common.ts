// Medidas, materiais e utilitários de geometria compartilhados pelo mapa da igreja.
import * as THREE from 'three';
import { pbr, boxUV } from '../../core/pbr';
import { weather } from '../../core/weathering';

// ---------- medidas (metros; 1 quadrado da grade = 1 m) ----------
export const FLOOR = 0.6;          // piso da nave (acima do terreno, y=0)
export const NX = 6, NZ = 11;      // meia-largura e meio-comprimento internos da nave
export const WT = 0.36;            // espessura das paredes
export const WH = 7.2;             // altura das paredes acima do piso
export const TOP = FLOOR + WH;     // topo das paredes
export const RISE = 4.6;           // altura do telhado acima do topo das paredes
export const LOFT = FLOOR + 3.4;   // piso do coro (2º andar)
export const LOFT_Z = 5.2;         // borda do coro (de LOFT_Z até a parede da frente)
export const WIN_Z = [-8, -4, 0, 4, 8];
export const WIN = { w: 1.3, sill: 1.7, h: 3.7 };
export const DOOR = { w: 2.6, h: 4.3 };
export const TOWER = { x0: -10.5, x1: -6.4, z0: 9.0, z1: 13.1, h: 14.5 };

// ---------- materiais ----------
export const M = {
  concrete: () => weather(pbr('concrete_wall_008', { size: 3.4, color: 0xa9b0b6, envMapIntensity: 0.8 }), { ground: 0 }),
  concreteOld: () => pbr('concrete_wall_006', { size: 3.2, color: 0xaab4bc, envMapIntensity: 0.7 }),
  concreteDark: () => weather(pbr('concrete_wall_004', { size: 2.2, color: 0x8e8c88, envMapIntensity: 0.5 }), { ground: 0, grime: 0.5, streaks: 0.15 }),
  concreteTrim: () => pbr('concrete_wall_004', { size: 1.6, color: 0xb2aea6, envMapIntensity: 0.5 }),
  plaster: () => pbr('grey_plaster', { size: 3, color: 0xdcd9d2, envMapIntensity: 0.3 }),
  woodDark: () => pbr('dark_wooden_planks', { size: 2, color: 0x9a8a7a, envMapIntensity: 0.4 }),
  woodBeam: () => pbr('dark_wooden_planks', { size: 3, color: 0x6a5a4c, envMapIntensity: 0.3 }),
  ceiling: () => pbr('dark_wooden_planks', { size: 2.4, color: 0x7d6e60, envMapIntensity: 0.25 }),
  pew: () => pbr('dark_wood', { size: 1.4, color: 0x8a6a58, roughness: 0.9, envMapIntensity: 0.5 }),
  floor: () => pbr('old_wooden_floor_02', { size: 2.6, color: 0x9a8a80, envMapIntensity: 0.4 }),
  stoneFloor: () => pbr('monastery_stone_floor', { size: 2.5, color: 0xa8a49c, envMapIntensity: 0.4 }),
  slate: () => pbr('roof_slates_02', { size: 2.2, color: 0x6f7880, envMapIntensity: 0.7 }),
  weathered: () => pbr('weathered_brown_planks', { size: 2, envMapIntensity: 0.4 }),
  fabric: () => pbr('quatrefoil_jacquard_fabric', { size: 0.5, map: false, color: 0xc4bfb4, roughness: 0.95, envMapIntensity: 0.35 }),
  stonePath: () => pbr('grey_stone_path', { size: 2.4, color: 0x9a978f, envMapIntensity: 0.8 }),
  gravel: () => pbr('gravel_floor_02', { size: 2.2, color: 0x8e8a82 }),
  rust: () => pbr('rusty_metal_02', { size: 1.5, color: 0x6a5e56, metalMap: true }),
};
let _iron: THREE.MeshStandardMaterial | null = null, _brass: THREE.MeshStandardMaterial | null = null, _red: THREE.MeshStandardMaterial | null = null;
export const iron = () => (_iron ||= new THREE.MeshStandardMaterial({ color: 0x17181a, metalness: 0.85, roughness: 0.55, envMapIntensity: 0.8 }));
export const brass = () => (_brass ||= new THREE.MeshStandardMaterial({ color: 0x9c7c4a, metalness: 1, roughness: 0.38, envMapIntensity: 1 }));
export const velvet = () => (_red ||= new THREE.MeshStandardMaterial({ color: 0x3e1418, roughness: 1, envMapIntensity: 0.2 }));

// ---------- geometria ----------
/** Caixa com UVs em metros. */
export function bx(w: number, h: number, d: number) { return boxUV(new THREE.BoxGeometry(w, h, d)); }
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, parent?: THREE.Object3D) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent?.add(m); return m;
}
/** Caixa posicionada pelo centro. */
export function cube(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D) {
  return mesh(bx(w, h, d), mat, x, y, z, parent);
}

/** Contorno de arco ogival (pontiagudo) com base em y=0, centrado em x=0. */
export function pointedArch(w: number, h: number, seg = 12): THREE.Vector2[] {
  const r = w * 0.85, ah = Math.sqrt(r * r - (r - w / 2) ** 2), ys = Math.max(0, h - ah);
  const pts: THREE.Vector2[] = [new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, ys)];
  // arco direito (centro à esquerda) até o ápice
  const cxR = w / 2 - r, a0 = 0, a1 = Math.acos((r - w / 2) / r);
  for (let i = 1; i <= seg; i++) { const a = a0 + (a1 - a0) * (i / seg); pts.push(new THREE.Vector2(cxR + Math.cos(a) * r, ys + Math.sin(a) * r)); }
  const cxL = -w / 2 + r;
  for (let i = seg - 1; i >= 0; i--) { const a = Math.PI - (a0 + (a1 - a0) * (i / seg)); pts.push(new THREE.Vector2(cxL + Math.cos(a) * r, ys + Math.sin(a) * r)); }
  pts.push(new THREE.Vector2(-w / 2, ys), new THREE.Vector2(-w / 2, 0));
  return pts;
}
/** Contorno de arco pleno (semicírculo) com base em y=0. */
export function roundArch(w: number, h: number, seg = 16): THREE.Vector2[] {
  const r = w / 2, ys = h - r, pts = [new THREE.Vector2(r, 0), new THREE.Vector2(r, ys)];
  for (let i = 1; i < seg; i++) { const a = (i / seg) * Math.PI; pts.push(new THREE.Vector2(Math.cos(a) * r, ys + Math.sin(a) * r)); }
  pts.push(new THREE.Vector2(-r, ys), new THREE.Vector2(-r, 0));
  return pts;
}
export function circle(r: number, seg = 32, cx = 0, cy = 0) {
  const p: THREE.Vector2[] = []; for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; p.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } return p;
}
const shift = (pts: THREE.Vector2[], x: number, y: number) => pts.map(p => new THREE.Vector2(p.x + x, p.y + y));

export interface Hole { pts: THREE.Vector2[]; x: number; y: number }
/**
 * Parede (no plano XY, espessura em Z a partir de z=0 para +z) com aberturas.
 * Retorna geometria com UVs em metros; grupos: 0 = faces, 1 = laterais/vãos.
 */
export function wallGeo(w: number, h: number, d: number, holes: Hole[] = [], top?: THREE.Vector2[]) {
  const s = new THREE.Shape(top || [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)]);
  holes.forEach(hl => s.holes.push(new THREE.Path(shift(hl.pts, hl.x, hl.y).reverse())));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 8 });
  return boxUV(g);
}
/** Moldura (anel) a partir de um contorno: contorno ampliado menos o original. */
export function frameGeo(pts: THREE.Vector2[], grow: number, d: number) {
  const c = new THREE.Vector2(0, pts.reduce((a, p) => Math.max(a, p.y), 0) * 0.45);
  const outer = pts.map(p => { if (p.y < 1e-4) return new THREE.Vector2(p.x + Math.sign(p.x) * grow, p.y - grow * 0.6); const v = p.clone().sub(c); return p.clone().add(v.setLength(grow)); });
  const s = new THREE.Shape(outer); s.holes.push(new THREE.Path(pts.slice().reverse()));
  return boxUV(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }));
}
/** Superfície plana com o contorno dado e UV normalizada 0..1 (para vitrais). */
export function panelGeo(pts: THREE.Vector2[]) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts), 10);
  g.computeBoundingBox(); const b = g.boundingBox!, uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  return g;
}
