// Planície do oeste do Texas: terreno quase plano com capim seco, mesas (morros de topo plano) ao longe,
// algarobeiras (mesquite), figueiras-da-índia, iúcas, pedras, troncos secos e capim.
import * as THREE from 'three';
import { makeTerrain, fbm, noise2 } from '../../core/terrain';
import { grassField } from '../../core/grass';
import { instance, instanceVariants, type Xf } from '../../core/models';
import { rockGeo, placeRock, nopal, agave, colorize } from '../mexico/nature';
import { MAT } from '../mexico/common';
import { Q, rnd, sm, lod, HWY, RAIL, FARM, FOREST } from './common';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** quanto o ponto está dentro da área construída (1 = plano) */
let builtFn: (x: number, z: number) => number = () => 0;
export function setBuilt(f: (x: number, z: number) => number) { builtFn = f; }

export function groundH(x: number, z: number) {
  const r = Math.hypot(x, z), flat = builtFn(x, z);
  const roll = 2.2 * (fbm(x * 0.012 + 3, z * 0.012, 3) - 0.45) * sm(120, 200, r);
  const v = fbm(x * 0.004 + 11, z * 0.004 - 7, 4);
  const mesa = sm(0.56, 0.6, v) * 26 * sm(190, 250, r) + sm(0.66, 0.69, v) * 14 * sm(210, 260, r);
  return 0.04 * (fbm(x * 0.5, z * 0.5, 2) - 0.5) + (1 - flat) * (roll + mesa);
}

/** estradas de terra (máscara do terreno) */
export function dirtRoad(x: number, z: number) {
  let m = 0;
  if (x > 100 && x < FARM.x + 4) m = Math.max(m, 1 - sm(2.4, 4, Math.abs(z - 0)) ); // estrada da fazenda
  if (Math.abs(x - FARM.x + 12) < 4 && z > -2 && z < FARM.z) m = Math.max(m, 1 - sm(2.4, 4, Math.abs(x - FARM.x + 12)));
  // estrada de terra para a floresta (fim da Commerce St oeste → entrada da trilha)
  { const ax = -150, az = 0, bx = FOREST.trail[0], bz = FOREST.trail[1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    m = Math.max(m, 1 - sm(2.2, 3.8, Math.hypot(x - (ax + dx * t), z - (az + dz * t)))); }
  return m;
}

function yucca(seed: number) {
  const parts: THREE.BufferGeometry[] = [];
  const tr = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6); tr.translate(0, 0.6, 0); tr.deleteAttribute('uv'); parts.push(tr.toNonIndexed());
  const head = agave(seed + 20); head.scale(0.55, 0.7, 0.55); head.translate(0, 1.15, 0); head.deleteAttribute('color'); parts.push(head);
  const g = mergeGeometries(parts.map(p => { p.deleteAttribute('normal'); return p; }))!; g.computeVertexNormals();
  return colorize(g, y => new THREE.Color(y < 1.1 ? 0x5a4a3a : 0x6a7a5a).multiplyScalar(0.8 + y * 0.15));
}

export async function buildNature(G: THREE.Group, free: (x: number, z: number) => boolean) {
  const O = new THREE.Group(); O.name = 'natureza'; G.add(O);
  const ter = makeTerrain({
    size: 560, seg: Q.seg, height: groundH,
    base: { id: 'withered_grass', size: 3.2 }, r: { id: 'sandy_gravel', size: 2.4 }, g: { id: 'dry_ground_rocks', size: 3.0 },
    mask: (x, z) => {
      const n = fbm(x * 0.06, z * 0.06, 3), h = groundH(x, z), built = builtFn(x, z);
      const dirt = Math.max(dirtRoad(x, z), sm(0.58, 0.75, n) * 0.55, built * 0.3 * sm(0.4, 0.62, noise2(x * 0.12, z * 0.12)), (1 - sm(1.8, 3.6, Math.abs(z - RAIL))) * 0.9, (1 - sm(5, 9, Math.abs(z - HWY))) * 0.8);
      const mata = 1 - sm(FOREST.r - 14, FOREST.r + 14, Math.hypot(x - FOREST.x, z - FOREST.z)); // terra escura em volta da floresta (borda suave)
      const rocks = Math.max(sm(3, 14, h) * 0.9, sm(0.65, 0.8, fbm(x * 0.03 + 9, z * 0.03, 3)) * 0.4, mata * 0.95);
      return [Math.min(1, dirt), Math.min(1, rocks)];
    },
  });
  ter.mesh.userData.ns = 1; ter.mesh.receiveShadow = true; O.add(ter.mesh, ter.collider);

  // mesas distantes (anel na névoa)
  {
    const seg = 180, pos: number[] = [], idx: number[] = [], R0 = 320, R1 = 560;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2, v = fbm(Math.cos(a) * 2.5 + 4, Math.sin(a) * 2.5, 4), h = 8 + sm(0.45, 0.5, v) * 55 + sm(0.62, 0.65, v) * 25;
      pos.push(Math.cos(a) * R0, -6, Math.sin(a) * R0, Math.cos(a) * (R0 + 40), h, Math.sin(a) * (R0 + 40), Math.cos(a) * R1, h * 0.9, Math.sin(a) * R1);
      if (i < seg) { const k = i * 3; idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const mm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9a6a50, roughness: 1, side: THREE.DoubleSide, envMapIntensity: 0.4, flatShading: true }));
    mm.userData.ns = 1; mm.userData.noExport = 1; O.add(mm);
  }

  const ok = (x: number, z: number) => free(x, z) && dirtRoad(x, z) < 0.05 && Math.abs(z - HWY) > 9 && Math.abs(z - RAIL) > 5 && Math.hypot(x, z) < 255;
  const scatter = (n: number, rmin: number, rmax: number, sp: number) => {
    const out: Xf[] = [];
    for (let i = 0; i < n * 30 && out.length < n; i++) {
      const a = rnd() * 6.283, r = rmin + Math.pow(rnd(), 0.7) * (rmax - rmin), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!ok(x, z) || out.some(o => Math.abs(o.x - x) < sp && Math.abs(o.z - z) < sp)) continue;
      out.push({ x, y: groundH(x, z) - 0.05, z, ry: rnd() * 6.28, s: 0.8 + rnd() * 0.45 });
    }
    return out;
  };
  const cmat = MAT().cactus;
  const placeGeo: (geo: THREE.BufferGeometry, list: Xf[], shadow?: boolean) => void = (geo: THREE.BufferGeometry, list: Xf[], shadow = true) => {
    if (!list.length) return;
    const by = new Map<string, Xf[]>(); list.forEach(t => { const k = Math.floor(t.x / 50) + ',' + Math.floor(t.z / 50); if (!by.has(k)) by.set(k, []); by.get(k)!.push(t); });
    if (by.size > 1) { by.forEach(L => placeGeo(geo, L, shadow)); return; }
    const im = new THREE.InstancedMesh(geo, cmat, list.length), o = new THREE.Object3D();
    list.forEach((t, i) => { o.position.set(t.x, t.y, t.z); o.rotation.set(0, t.ry || 0, 0); o.scale.setScalar(t.s ?? 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = shadow && Q.lights > 8; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.cullDist = 160; O.add(im);
  };
  const nop = scatter(Math.round(90 * Q.cacti), 40, 240, 4); for (let v = 0; v < 3; v++) placeGeo(nopal(v + 3), nop.filter((_, i) => i % 3 === v));
  const yuc = scatter(Math.round(80 * Q.cacti), 40, 240, 4); for (let v = 0; v < 2; v++) placeGeo(yucca(v), yuc.filter((_, i) => i % 2 === v));
  const agv = scatter(Math.round(60 * Q.cacti), 40, 240, 3); placeGeo(agave(5), agv, false);
  // algarobeiras (mesquite): árvores baixas e retorcidas
  const mq = scatter(Math.round(46 * Q.bushes + 10), 30, 230, 9);
  (await instance(lod('tree_small_02'), mq.map(t => ({ ...t, s: 0.55 + rnd() * 0.3 })), O, { wind: { amp: 0.06, freq: 0.9, flutter: 0.015 }, tile: 70, cullDist: 220 }).catch(() => [])).forEach(m => (m.userData.canopy = 1));
  const bush = scatter(Math.round(110 * Q.bushes), 30, 240, 4);
  if (Q.bushes >= 1) await instance('searsia_lucida', bush.filter((_, i) => i % 3 === 0).map(b => ({ ...b, s: 0.6 + rnd() * 0.4 })), O, { wind: { amp: 0.05, freq: 1.2, flutter: 0.01 }, tile: 50, cullDist: 110 }).catch(() => {});
  await instance('wild_rooibos_bush', bush.filter((_, i) => Q.bushes < 1 || i % 3 !== 0).map(b => ({ ...b, s: 1.2 + rnd() * 0.8 })), O, { shadow: false, wind: { amp: 0.04, freq: 1.5, flutter: 0.01 }, tile: 50, cullDist: 100 }).catch(() => {});
  const stones = scatter(80, 30, 250, 5).map(r => ({ ...r, s: 0.3 + rnd() * 0.9 }));
  for (let v = 0; v < 3; v++) placeRock(rockGeo(v + 4), stones.filter((_, i) => i % 3 === v), O);
  await instanceVariants('namaqualand_boulder_02', scatter(Math.round(12 * Q.bushes), 120, 250, 10).map(r => ({ ...r, s: 0.8 + rnd(), y: r.y - 0.3 })), O, { shadow: Q.bushes >= 1, tile: 60, cullDist: 170 }).catch(() => {});
  await instance('dead_tree_trunk', scatter(10, 40, 220, 14).map(d => ({ ...d, s: 0.9 + rnd() * 0.5 })), O, { tile: 80, cullDist: 200 }).catch(() => {});

  O.add(grassField({
    count: Q.grass, area: [-130, 130, -130, 130], height: groundH, colors: [0x9a8a5a, 0xa89a66, 0x8a7a4a, 0xb0a070, 0x8a8456],
    allow: (x, z) => (ok(x, z) && Math.hypot(x, z) < 130 ? 0.35 + 0.65 * sm(0.4, 0.68, fbm(x * 0.05, z * 0.05, 3)) : 0), tall: () => 1.8,
  }));
  void noise2;
  return { floors: [ter.collider] };
}
