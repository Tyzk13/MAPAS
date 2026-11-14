// Natureza de Greywater Falls: vale raso com morros de pinheiros (Escudo Canadense), rio escuro com a represa
// das cataratas, árvores peladas de novembro, capim morto, lama e folhas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeTerrain, fbm, noise2 } from '../../core/terrain';
import { grassField } from '../../core/grass';
import { instance, instanceVariants, type Xf } from '../../core/models';
import { rockGeo, placeRock } from '../mexico/nature';
import { pineGeo } from '../texas/forest';
import { Q, rnd, sm, RIVER, riverZ, RAIL } from './common';

let builtFn: (x: number, z: number) => number = () => 0;
export function setBuilt(f: (x: number, z: number) => number) { builtFn = f; }

/** profundidade do leito do rio (0 fora, 1 no meio) */
export function riverBed(x: number, z: number) { const d = Math.abs(z - riverZ(x)); return 1 - sm(RIVER.w / 2 - 5, RIVER.w / 2 + 5, d); }

export function groundH(x: number, z: number) {
  const flat = builtFn(x, z), r = Math.hypot(x * 0.9, z);
  const hills = (6 + 26 * fbm(x * 0.006 + 5, z * 0.006 - 3, 4)) * sm(150, 250, r);
  const roll = 1.6 * (fbm(x * 0.02, z * 0.02, 3) - 0.45);
  const bed = riverBed(x, z);
  return 0.03 * (fbm(x * 0.5, z * 0.5, 2) - 0.5) + (1 - flat) * (hills + roll) * (1 - bed) - bed * 4.2;
}

/** árvore pelada (sem folhas): galhos em 4 níveis, ~400 triângulos, cor de vértice cinza-marrom */
export function bareTree(seed: number) {
  let s = seed * 7919 + 13; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const parts: THREE.BufferGeometry[] = [], up = new THREE.Vector3(0, 1, 0);
  const branch = (p: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
    const g = new THREE.CylinderGeometry(rad * 0.62, rad, len, depth > 2 ? 6 : 4, 1, true);
    g.translate(0, len / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir)); g.translate(p.x, p.y, p.z);
    g.deleteAttribute('uv'); parts.push(g.toNonIndexed());
    if (depth <= 0) return;
    const end = p.clone().addScaledVector(dir, len), n = depth > 2 ? 3 : 2 + (r() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, tilt = 0.45 + r() * 0.5;
      const side = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const d = dir.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).add(new THREE.Vector3(0, 0.15, 0)).normalize();
      const at = i === 0 ? end : p.clone().addScaledVector(dir, len * (0.55 + r() * 0.4));
      branch(at, d, len * (0.62 + r() * 0.15), rad * 0.62, depth - 1);
    }
  };
  branch(new THREE.Vector3(0, -0.3, 0), new THREE.Vector3((r() - 0.5) * 0.15, 1, (r() - 0.5) * 0.15).normalize(), 3.6 + r() * 1.4, 0.26, 4);
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = 0.16 + 0.05 * Math.min(1, p.getY(i) / 9) + 0.02 * Math.sin(i * 0.7); c[i * 3] = k * 1.05; c[i * 3 + 1] = k * 0.98; c[i * 3 + 2] = k * 0.92; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** espalha uma geometria de vértice colorido em blocos de 40 m (corte por tela e distância) */
export function placeGeo(O: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, list: Xf[], o: { shadow?: boolean; cull?: number; canopy?: boolean } = {}) {
  const by = new Map<string, Xf[]>(); list.forEach(t => { const k = Math.floor(t.x / 40) + ',' + Math.floor(t.z / 40); if (!by.has(k)) by.set(k, []); by.get(k)!.push(t); });
  by.forEach(L => {
    const im = new THREE.InstancedMesh(geo, mat, L.length), d = new THREE.Object3D();
    L.forEach((t, i) => { d.position.set(t.x, t.y, t.z); d.rotation.set(0, t.ry || 0, 0); d.scale.setScalar(t.s ?? 1); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
    im.castShadow = !!o.shadow; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.cullDist = o.cull ?? 200; if (o.canopy) im.userData.canopy = 1; O.add(im);
  });
}

export async function buildNature(G: THREE.Group, free: (x: number, z: number) => boolean, streetTrees: Xf[]) {
  const O = new THREE.Group(); O.name = 'natureza'; G.add(O);
  const ter = makeTerrain({
    size: 620, seg: Q.seg, height: groundH,
    base: { id: 'withered_grass', size: 3.2 }, r: { id: 'brown_mud_leaves_01', size: 2.6 }, g: { id: 'forest_ground_04', size: 2.8 },
    mask: (x, z) => {
      const n = fbm(x * 0.05, z * 0.05, 3), built = builtFn(x, z), r = Math.hypot(x, z);
      const mud = Math.max(sm(0.55, 0.72, n) * 0.6, built * 0.35 * sm(0.4, 0.6, noise2(x * 0.1, z * 0.1)), riverBed(x, z), (1 - sm(1.8, 3.4, Math.abs(z - RAIL))) * 0.9);
      const woods = Math.max(sm(150, 200, r) * (0.6 + 0.4 * n), sm(0.62, 0.75, fbm(x * 0.03 + 9, z * 0.03, 3)) * 0.5);
      return [Math.min(1, mud), Math.min(1, woods)];
    },
  });
  ter.mesh.userData.ns = 1; O.add(ter.mesh, ter.collider);

  // ---------- rio: faixa de água escura seguindo o leito, represa e cachoeira ----------
  {
    const seg = 160, L0 = -310, L1 = 310, pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= seg; i++) { const x = L0 + (L1 - L0) * i / seg, zc = riverZ(x), y = x < -30 ? RIVER.y + 0.9 : RIVER.y; pos.push(x, y, zc - RIVER.w / 2 - 2, x, y, zc + RIVER.w / 2 + 2); if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    // degrau na represa (x = −30): a água de cima fica 0,9 m mais alta
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const water = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x141a1c, roughness: 0.06, metalness: 0.15, envMapIntensity: 1.3 }));
    water.name = 'rio'; water.receiveShadow = true; water.userData.ns = 1; O.add(water);
    // represa de concreto e espuma da queda
    const zc = riverZ(-30), dam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, RIVER.w + 6), new THREE.MeshStandardMaterial({ color: 0x6a6a64, roughness: 0.9 }));
    dam.position.set(-30, RIVER.y - 0.6, zc); dam.castShadow = dam.receiveShadow = true; O.add(dam);
    const fc = document.createElement('canvas'); fc.width = 64; fc.height = 256; const fg = fc.getContext('2d')!;
    for (let i = 0; i < 400; i++) { fg.fillStyle = `rgba(230,236,238,${0.15 + Math.random() * 0.5})`; fg.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 6 + Math.random() * 20); }
    const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(8, 1);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(RIVER.w + 2, 1.2), new THREE.MeshStandardMaterial({ map: ft, transparent: true, opacity: 0.8, roughness: 0.6, depthWrite: false }));
    foam.position.set(-28.85, RIVER.y + 0.35, zc); foam.rotation.set(0, Math.PI / 2, 0); foam.rotateX(-0.25); foam.userData.ns = 1; O.add(foam);
    const foam2 = new THREE.Mesh(new THREE.PlaneGeometry(RIVER.w, 6), foam.material); foam2.position.set(-25, RIVER.y + 0.03, zc); foam2.rotation.x = -Math.PI / 2; foam2.rotation.z = Math.PI / 2; foam2.userData.ns = 1; O.add(foam2);
    O.userData.foam = ft;
  }

  // ---------- pinheiros (morros) e árvores peladas ----------
  const ok = (x: number, z: number) => free(x, z) && riverBed(x, z) < 0.05 && Math.abs(z - RAIL) > 6 && Math.hypot(x, z) < 300;
  const scatter = (n: number, rmin: number, rmax: number, sp: number) => {
    const out: Xf[] = [], grid = new Map<string, Xf[]>(), key = (x: number, z: number) => Math.floor(x / sp) + ',' + Math.floor(z / sp);
    const near = (x: number, z: number) => { const gx = Math.floor(x / sp), gz = Math.floor(z / sp); for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (const o of grid.get((gx + a) + ',' + (gz + c)) || []) if (Math.abs(o.x - x) < sp && Math.abs(o.z - z) < sp) return true; return false; };
    for (let i = 0; i < n * 12 && out.length < n; i++) {
      const a = rnd() * 6.283, r = rmin + Math.pow(rnd(), 0.6) * (rmax - rmin), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!ok(x, z) || near(x, z)) continue;
      const t = { x, y: groundH(x, z) - 0.2, z, ry: rnd() * 6.28, s: 0.8 + rnd() * 0.5 }; out.push(t); const k = key(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k)!.push(t);
    }
    return out;
  };
  const pmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.35, side: THREE.DoubleSide });
  const nP = { 8: 1500, 14: 2400, 22: 3200 }[Q.lights as 8 | 14 | 22] ?? 2000;
  const pines = scatter(nP, 145, 300, 3.4);
  for (let v = 0; v < 3; v++) placeGeo(O, pineGeo(v + 4), pmat, pines.filter((_, i) => i % 3 === v), { shadow: Q.lights > 8, cull: 330, canopy: true });
  const bmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.3 });
  const bare = [...scatter(Math.round(120 * Q.bushes + 40), 60, 160, 7), ...streetTrees];
  for (let v = 0; v < 3; v++) placeGeo(O, bareTree(v + 1), bmat, bare.filter((_, i) => i % 3 === v).map(t => ({ ...t, s: (t.s ?? 1) * (0.9 + rnd() * 0.35) })), { shadow: true, cull: 240, canopy: true });
  // margens do rio: pedras e capim alto
  const bank: Xf[] = []; for (let x = -250; x < 250; x += 3 + rnd() * 5) [-1, 1].forEach(s => { const z = riverZ(x) + s * (RIVER.w / 2 + 1 + rnd() * 3); if (Math.abs(x) > 14 && free(x, z)) bank.push({ x, y: groundH(x, z) - 0.1, z, ry: rnd() * 6.28, s: 0.4 + rnd() * 0.9 }); });
  for (let v = 0; v < 3; v++) placeRock(rockGeo(v + 7), bank.filter((_, i) => i % 3 === v), O);
  await instance('dead_tree_trunk', scatter(12, 70, 220, 14).map(d => ({ ...d, s: 0.9 + rnd() * 0.5 })), O, { tile: 80, cullDist: 200 }).catch(() => {});
  await instanceVariants('rock_moss_set_01', scatter(Math.round(30 * Q.bushes), 120, 260, 8), O, { tile: 60, cullDist: 160 }).catch(() => {});
  await instance('shrub_03', scatter(Math.round(60 * Q.bushes), 40, 200, 5).map(b => ({ ...b, s: 0.7 + rnd() * 0.5 })), O, { shadow: false, wind: { amp: 0.04, freq: 1.3, flutter: 0.01 }, tile: 50, cullDist: 110 }).catch(() => {});
  O.add(grassField({
    count: Q.grass, area: [-150, 150, -150, 150], height: groundH, colors: [0x7a7050, 0x8a7e58, 0x6a6244, 0x9a8a60, 0x6e6a4a],
    allow: (x, z) => (ok(x, z) ? 0.25 + 0.75 * sm(0.4, 0.66, fbm(x * 0.05, z * 0.05, 3)) : 0), tall: (x, z) => 1 + riverBed(x, z) * 0.6 + sm(0.3, 0.8, noise2(x * 0.03, z * 0.03)) * 0.8,
  }));
  return { floors: [ter.collider], foam: O.userData.foam as THREE.Texture };
}
