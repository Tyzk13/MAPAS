// Terreno do vale (cidade plana, morros e serra em volta, arroio seco ao sul), serra distante,
// cactos feitos em código (sahuaro, nopal, agave), arbustos, pedras, capim seco e árvores.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeTerrain, fbm, noise2 } from '../../core/terrain';
import { grassField } from '../../core/grass';
import { instance, instanceVariants, type Xf } from '../../core/models';
import { lod } from './common';
import { addWind } from '../../core/anim';
import { Q, rnd, reseed, sm, PANTEON, HACIENDA, ARROYO, ROAD_S, TOWN, MAT, TOWER_W } from './common';

// ---------- relevo ----------
function boxDist(x: number, z: number, x0: number, x1: number, z0: number, z1: number) {
  const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); return Math.hypot(dx, dz);
}
/** 1 = área plana construída (cidade, panteão, fazenda, caixa-d'água); cai para 0 em 25 m. */
export function flatMask(x: number, z: number) {
  const d = Math.min(
    boxDist(x, z, -TOWN - 8, TOWN + 8, -TOWN - 30, TOWN + 10),
    boxDist(x, z, PANTEON.x0 - 6, PANTEON.x1 + 6, PANTEON.z0 - 6, PANTEON.z1 + 6),
    Math.max(0, Math.hypot(x - HACIENDA.x, z - HACIENDA.z) - 30),
    Math.max(0, Math.hypot(x - TOWER_W.x, z - TOWER_W.z) - 10),
  );
  return 1 - sm(0, 28, d);
}
/** estradas de terra fora do núcleo: 1 no leito */
export function roadMask(x: number, z: number) {
  let m = 0;
  if (z > TOWN - 2) m = Math.max(m, 1 - sm(3.2, 5.5, Math.abs(x - ROAD_S)));                              // sul
  if (x < -TOWN + 2 && x > HACIENDA.x + 10) m = Math.max(m, 1 - sm(2.6, 4.6, Math.abs(z - 19)));        // oeste (fazenda)
  if (x > TOWN - 2 && x < PANTEON.x0 + 2) m = Math.max(m, 1 - sm(2.6, 4.6, Math.abs(z + 19)));          // leste (panteão)
  if (z < -TOWN + 2 && z > TOWER_W.z) m = Math.max(m, 1 - sm(1.8, 3.6, Math.abs(x - 38)) * 0.8);        // trilha da caixa-d'água
  return m;
}
export function arroyoDepth(x: number, z: number) {
  const d = Math.abs(z - ARROYO(x));
  return 3.2 * (1 - sm(4, 11, d)) * (0.85 + 0.15 * noise2(x * 0.1, 3));
}
export function groundH(x: number, z: number) {
  const f = flatMask(x, z), r = Math.hypot(x * 0.9, z * (z < 0 ? 0.75 : 1));
  const micro = 0.05 * (fbm(x * 0.4, z * 0.4, 2) - 0.5);
  const base = 4 * (fbm(x * 0.02 + 7, z * 0.02, 3) - 0.35);
  const mount = Math.pow(sm(90, 260, r), 1.4) * (30 + 70 * fbm(x * 0.007 + 5, z * 0.007 - 2, 5)) * (z < 0 ? 1.25 : 0.8);
  const ridge = Math.pow(sm(110, 240, r), 2) * 18 * Math.abs(noise2(x * 0.02, z * 0.02) - 0.5) * 2;
  const road = roadMask(x, z);
  const hills = (base + mount + ridge) * (1 - road * 0.7);
  return micro + (1 - f) * hills - arroyoDepth(x, z) * (1 - f * 0.5);
}

// ---------- cactos ----------
const green = (k: number) => new THREE.Color().setHSL(0.27 + rnd() * 0.05, 0.28 + rnd() * 0.1, 0.2 + k * 0.08);
export function colorize(g: THREE.BufferGeometry, fn: (y: number, x: number, z: number) => THREE.Color) {
  const p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = fn(p.getY(i), p.getX(i), p.getZ(i)); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
/** coluna com gomos e topo arredondado (lathe), base em y=0 */
function ribbed(r: number, h: number, ribs = 10) {
  const pr: THREE.Vector2[] = [new THREE.Vector2(r * 0.92, 0)];
  for (let i = 1; i <= 6; i++) pr.push(new THREE.Vector2(r, (h - r) * (i / 6)));
  for (let i = 1; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; pr.push(new THREE.Vector2(Math.cos(a) * r + 0.001, h - r + Math.sin(a) * r * 0.9)); }
  const g = new THREE.LatheGeometry(pr, ribs * 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.09 * Math.cos(a * ribs); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); return g;
}
function saguaro(seed: number) {
  reseed(seed * 131 + 7);
  const h = 4.2 + rnd() * 3.2, r = 0.26 + rnd() * 0.08, parts: THREE.BufferGeometry[] = [ribbed(r, h, 11)];
  const arms = 1 + ((rnd() * 3) | 0);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + rnd(), y0 = h * (0.35 + rnd() * 0.3), out = 0.55 + rnd() * 0.4, up = 1 + rnd() * (h - y0 - 0.6);
    const ar = r * 0.7, dx = Math.cos(a), dz = Math.sin(a);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dx * r * 0.5, y0, dz * r * 0.5), new THREE.Vector3(dx * out * 0.75, y0 + 0.05, dz * out * 0.75),
      new THREE.Vector3(dx * out, y0 + 0.45, dz * out), new THREE.Vector3(dx * out, y0 + up * 0.6, dz * out)]);
    const t = new THREE.TubeGeometry(curve, 8, ar, 10, false); parts.push(t);
    const top = ribbed(ar, up * 0.45 + ar, 8); top.translate(dx * out, y0 + up * 0.6 - 0.05, dz * out); parts.push(top);
  }
  const g = mergeGeometries(parts.map(x => { const y = x.index ? x.toNonIndexed() : x; y.deleteAttribute('uv'); return y; }))!;
  const c0 = green(1);
  return colorize(g, y => c0.clone().multiplyScalar(0.72 + 0.28 * Math.min(1, y / 1.5)));
}
export function nopal(seed: number) {
  reseed(seed * 71 + 3);
  const parts: THREE.BufferGeometry[] = [], c0 = green(1.4);
  const pad = (x: number, y: number, z: number, ry: number, rz: number, s: number, depth: number) => {
    const g = new THREE.SphereGeometry(0.22, 9, 6); g.scale(1, 1.3, 0.2); g.translate(0, 0.26, 0);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(s, s, s)));
    g.deleteAttribute('uv'); parts.push(g);
    if (depth > 0) { const n = 1 + ((rnd() * 2.2) | 0); for (let i = 0; i < n; i++) { const t = rz + (rnd() - 0.5) * 1.4; pad(x - Math.sin(rz) * 0.5 * s, y + Math.cos(rz) * 0.5 * s, z, ry + (rnd() - 0.5) * 1.2, t, s * 0.92, depth - 1); } }
  };
  for (let i = 0; i < 3; i++) pad((rnd() - 0.5) * 0.4, 0, (rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.6, 1.1, 3);
  const g = mergeGeometries(parts)!;
  return colorize(g, (y, x, z) => c0.clone().multiplyScalar(0.8 + 0.25 * noise2(x * 6 + y * 3, z * 6)));
}
export function agave(seed: number) {
  reseed(seed * 53 + 11);
  const parts: THREE.BufferGeometry[] = [], c0 = new THREE.Color().setHSL(0.36 + rnd() * 0.06, 0.18, 0.36);
  const n = 18 + ((rnd() * 8) | 0);
  for (let i = 0; i < n; i++) {
    const L = 0.6 + rnd() * 0.5, g = new THREE.ConeGeometry(0.08, L, 4, 1); g.scale(1, 1, 0.35); g.translate(0, L / 2, 0);
    const tilt = 0.25 + (i / n) * 1.0 + rnd() * 0.15;
    g.applyMatrix4(new THREE.Matrix4().makeRotationX(tilt)); g.applyMatrix4(new THREE.Matrix4().makeRotationY((i * 2.4) % 6.283));
    g.deleteAttribute('uv'); parts.push(g.toNonIndexed());
  }
  const g = mergeGeometries(parts)!;
  return colorize(g, y => c0.clone().multiplyScalar(0.75 + 0.5 * Math.min(1, y / 0.8)));
}

/** pedra baixa-poligonal (icosaedro deformado), base em y=0 */
export function rockGeo(seed: number) {
  reseed(seed * 37 + 5);
  const g = new THREE.IcosahedronGeometry(0.5, 1), p = g.attributes.position, k = rnd() * 9;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 0.75 + 0.5 * noise2(v.x * 2.3 + k, v.y * 2.3 + v.z * 1.7); v.multiplyScalar(n); v.y *= 0.62; p.setXYZ(i, v.x, v.y + 0.12, v.z * 1.2); }
  g.computeVertexNormals(); g.deleteAttribute('uv');
  const c0 = new THREE.Color().setHSL(0.07, 0.18 + rnd() * 0.1, 0.32 + rnd() * 0.08);
  return colorize(g, y => c0.clone().multiplyScalar(0.7 + y * 0.6));
}
let _rm: THREE.MeshStandardMaterial | null = null;
export function placeRock(geo: THREE.BufferGeometry, list: Xf[], parent: THREE.Object3D) {
  if (!list.length) return;
  const mat = (_rm ||= Object.assign(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }), { flatShading: true }));
  const im = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach((t, i) => { o.position.set(t.x, t.y, t.z); o.rotation.set(0, t.ry || 0, 0); o.scale.setScalar(t.s ?? 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.castShadow = Q.bushes >= 1; im.receiveShadow = true; im.computeBoundingSphere(); parent.add(im);
}

export interface Nature { floors: THREE.Object3D[] }

/** `free(x,z)` diz se o ponto está fora das construções e ruas. */
export async function buildNature(G: THREE.Group, free: (x: number, z: number) => boolean): Promise<Nature> {
  reseed(9);
  const O = new THREE.Group(); O.name = 'natureza'; G.add(O);

  // ---------- terreno ----------
  const ter = makeTerrain({
    size: 520, seg: Q.seg, height: groundH,
    base: { id: 'dry_ground_01', size: 3.2 }, r: { id: 'sandy_gravel', size: 2.4 }, g: { id: 'dry_ground_rocks', size: 3.0 },
    mask: (x, z) => {
      const n = fbm(x * 0.07, z * 0.07, 3), h = groundH(x, z), f = flatMask(x, z);
      const road = roadMask(x, z), arr = 1 - sm(3, 9, Math.abs(z - ARROYO(x)));
      const dirt = Math.max(road, sm(0.55, 0.75, n) * 0.6, f * 0.35 * sm(0.4, 0.6, noise2(x * 0.15, z * 0.15)));
      const rocks = Math.max(arr * 0.9, sm(4, 18, Math.abs(h)) * 0.85 * (0.6 + 0.4 * n), sm(0.62, 0.8, fbm(x * 0.03 + 9, z * 0.03, 3)) * 0.5);
      return [Math.min(1, dirt), Math.min(1, rocks * (1 - road))];
    },
  });
  ter.mesh.userData.ns = 1; ter.mesh.receiveShadow = true; O.add(ter.mesh, ter.collider);
  ter.mesh.material.color?.setHex(0xe6d6c2);

  // ---------- serra distante (silhueta na névoa) ----------
  {
    const seg = 160, g = new THREE.BufferGeometry(), pos: number[] = [], idx: number[] = [];
    const R0 = 300, R1 = 520;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2, h = 40 + 120 * fbm(Math.cos(a) * 3 + 4, Math.sin(a) * 3, 5) * (Math.sin(a) < 0 ? 1.4 : 0.9);
      pos.push(Math.cos(a) * R0, -10, Math.sin(a) * R0, Math.cos(a) * (R0 + R1) / 2, h, Math.sin(a) * (R0 + R1) / 2, Math.cos(a) * R1, h * 0.6, Math.sin(a) * R1);
      if (i < seg) { const k = i * 3; idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8a7c6e, roughness: 1, side: THREE.DoubleSide, envMapIntensity: 0.4 }));
    m.userData.ns = 1; m.userData.noExport = 1; O.add(m);
  }

  // ---------- cactos ----------
  const okWild = (x: number, z: number, m = 0) => free(x, z) && roadMask(x, z) < 0.05 && Math.abs(z - ARROYO(x)) > 6 + m && Math.hypot(x, z) < 245;
  const scatter = (n: number, rmin: number, rmax: number, spacing: number, extra?: (x: number, z: number) => boolean) => {
    const out: Xf[] = [];
    for (let i = 0; i < n * 30 && out.length < n; i++) {
      const a = rnd() * 6.283, r = rmin + Math.pow(rnd(), 0.7) * (rmax - rmin), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!okWild(x, z) || (extra && !extra(x, z)) || out.some(o => Math.abs(o.x - x) < spacing && Math.abs(o.z - z) < spacing)) continue;
      out.push({ x, y: groundH(x, z) - 0.05, z, ry: rnd() * 6.28, s: 0.8 + rnd() * 0.45 });
    }
    return out;
  };
  const cmat = MAT().cactus;
  const placeGeo = (geo: THREE.BufferGeometry, list: Xf[], shadow = true) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, cmat, list.length), o = new THREE.Object3D();
    list.forEach((t, i) => { o.position.set(t.x, t.y, t.z); o.rotation.set(0, t.ry || 0, 0); o.scale.setScalar(t.s ?? 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere(); O.add(im);
  };
  const sag = scatter(Math.round(70 * Q.cacti), 66, 240, 7);
  for (let v = 0; v < 4; v++) placeGeo(saguaro(v), sag.filter((_, i) => i % 4 === v));
  const nop = scatter(Math.round(110 * Q.cacti), 64, 200, 3);
  for (let v = 0; v < 3; v++) placeGeo(nopal(v), nop.filter((_, i) => i % 3 === v));
  const agv = scatter(Math.round(120 * Q.cacti), 64, 220, 2.5);
  for (let v = 0; v < 3; v++) placeGeo(agave(v), agv.filter((_, i) => i % 3 === v), false);
  // cactos de quintal / beira de rua (dentro da cidade, em lugares livres pedidos pelo mapa)
  exported.nopal = nopal(9); exported.agave = agave(9); exported.place = placeGeo;

  // ---------- arbustos, pedras, troncos ----------
  const bush = scatter(Math.round(120 * Q.bushes), 64, 230, 4);
  const big = bush.filter((_, i) => i % 3 === 0), small = bush.filter((_, i) => i % 3 !== 0);
  if (Q.bushes >= 1) await instance('searsia_lucida', big.map(b => ({ ...b, s: 0.7 + rnd() * 0.5 })), O, { wind: { amp: 0.05, freq: 1.2, flutter: 0.01 } }).catch(() => {});
  else small.push(...big);
  await instance('wild_rooibos_bush', small.map(b => ({ ...b, s: 1.2 + rnd() * 0.8 })), O, { shadow: false, wind: { amp: 0.04, freq: 1.5, flutter: 0.01 } }).catch(() => {});
  // poucas pedras grandes de modelo; o resto são pedras leves feitas em código
  const rocks = scatter(Math.round(18 * Q.bushes), 66, 235, 8).map(r => ({ ...r, s: 0.6 + rnd() * 1.0, y: r.y - 0.3 }));
  await instanceVariants('namaqualand_boulder_02', rocks, O, { shadow: Q.bushes >= 1 }).catch(() => {});
  const stones: Xf[] = scatter(70, 64, 235, 4).map(r => ({ ...r, s: 0.3 + rnd() * 0.9 }));
  for (let i = 0; i < 70; i++) { const x = -200 + rnd() * 400, z = ARROYO(x) + (rnd() - 0.5) * 7; if (Math.abs(x - ROAD_S) < 6) continue; stones.push({ x, y: groundH(x, z) - 0.05, z, ry: rnd() * 6, s: 0.2 + rnd() * 0.5 }); }
  for (let v = 0; v < 3; v++) placeRock(rockGeo(v), stones.filter((_, i) => i % 3 === v), O);
  const dead = scatter(8, 70, 200, 14).map(d => ({ ...d, s: 0.8 + rnd() * 0.5 }));
  await instance('dead_tree_trunk', dead, O).catch(() => {});
  await instance('dry_branches_medium_01', scatter(10, 64, 200, 6), O, { shadow: false }).catch(() => {});

  // ---------- árvores (mezquites/pirules) nos arredores e ao longo do arroio ----------
  const trees: Xf[] = [];
  for (let i = 0; i < 400 && trees.length < 26; i++) {
    const x = -200 + rnd() * 400, z = ARROYO(x) + (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 8);
    if (!okWild(x, z) || trees.some(t => Math.hypot(t.x - x, t.z - z) < 9)) continue;
    trees.push({ x, y: groundH(x, z) - 0.1, z, ry: rnd() * 6, s: 0.8 + rnd() * 0.4 });
  }
  trees.push(...scatter(14, 70, 150, 14).map(t => ({ ...t, s: 0.7 + rnd() * 0.4 })));
  const tl = (i: number) => trees.filter((_, k) => k % 2 === i);
  (await instance(lod('tree_small_02'), tl(0), O, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).catch(() => [])).forEach(m => (m.userData.canopy = 1));
  (await instance(lod('island_tree_02'), tl(1).map(t => ({ ...t, s: (t.s ?? 1) * 0.75 })), O, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).catch(() => [])).forEach(m => (m.userData.canopy = 1));

  // ---------- capim seco ----------
  const dry = [0x9a8a5a, 0xa89a66, 0x8a7a4a, 0xb0a070, 0x7d7448];
  O.add(grassField({
    count: Q.grass, area: [-125, 125, -125, 125], height: groundH, colors: dry,
    allow: (x, z) => (okWild(x, z) && Math.hypot(x, z) < 125 ? 0.25 + 0.75 * sm(0.45, 0.7, fbm(x * 0.05, z * 0.05, 3)) : 0) * (1 - flatMask(x, z) * 0.7),
    tall: () => 1.6,
  }));

  void addWind;
  return { floors: [ter.collider] };
}

/** Geometrias de cacto prontas para o mapa usar em quintais e na praça. */
export const exported: { nopal?: THREE.BufferGeometry; agave?: THREE.BufferGeometry; place?: (g: THREE.BufferGeometry, l: Xf[], s?: boolean) => void } = {};
