// Terreno e arredores: relevo, caminho de pedra, cerca e portão, postes, decoração externa do casamento,
// estacionamento com carros cobertos, galpão, caramanchão, cemitério antigo, estátua, árvores e vegetação.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeTerrain, fbm, noise2 } from '../../core/terrain';
import { grassField } from '../../core/grass';
import { model, place, instance, instanceVariants, hasModel, modelSize, type Xf } from '../../core/models';
import type { View } from '../../core/types';
import { CFG } from '../../core/config';
import { K, halo } from '../../core/kit';
import { Flowers } from './interior';
import { FLOOR, NX, NZ, WT, M, iron, cube, mesh, bx } from './common';

export const FENCE = { x: 26, z0: -24, z1: 40 };
export const PATH = { w: 2.8, z0: 12.8, z1: 40 };
export const PARK = { x0: 10, x1: 25, z0: 24, z1: 39 };
export const SHED = { x: 19, z: 8, w: 4.2, d: 3.2, h: 2.5 };
export const GAZEBO = { x: 15, z: -11, r: 3 };
export const GRAVE = { x0: -22, x1: -11, z0: -4, z1: 14 };

let sd = 41;
const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// vento por tipo de planta: amplitude no topo (m), frequência (rad/s), tremor das folhas (m)
const WIND = {
  fir: { amp: 0.22, freq: 0.7, flutter: 0.02 }, tree: { amp: 0.1, freq: 0.95, flutter: 0.018 },
  shrub: { amp: 0.05, freq: 1.3, flutter: 0.012 }, grass: { amp: 0.07, freq: 1.8, flutter: 0.008 }, low: { amp: 0.04, freq: 1.5, flutter: 0.01 },
};

export interface Grounds { solids: THREE.Object3D[]; floors: THREE.Object3D[]; lightsVtt: [number, number, number, number, string][] }

/** Altura do terreno: plano no pátio, ondulado além da cerca. */
export function groundH(x: number, z: number) {
  const d = Math.max(Math.abs(x) - FENCE.x, z - FENCE.z1, FENCE.z0 - z, 0);
  const far = sm(2, 30, d);
  const micro = 0.06 * (fbm(x * 0.35, z * 0.35, 2) - 0.5);
  const nearPath = Math.abs(x) < 3.5 && z > 11 ? 0 : 1, nearChurch = Math.abs(x) < 12 && Math.abs(z) < 15 ? 0 : 1;
  return micro * nearPath * nearChurch + far * (fbm(x * 0.02 + 3, z * 0.02, 4) * 9 - 3.2);
}

export async function buildGrounds(G: THREE.Group, F: Flowers, views: View[] = []): Promise<Grounds> {
  sd = 41;
  // densidade por qualidade: mato, floresta (quantidade e distância do LOD), sombra da vegetação
  const Q = { baixa: { grass: 80, blades: 7000, forest: 70, lod: 0, vegShadow: false, ferns: 2 }, media: { grass: 250, blades: 32000, forest: 110, lod: 0, vegShadow: true, ferns: 5 }, alta: { grass: 500, blades: 80000, forest: 140, lod: 60, vegShadow: true, ferns: 7 } }[CFG.quality];
  const solids: THREE.Object3D[] = [], floors: THREE.Object3D[] = [], lightsVtt: Grounds['lightsVtt'] = [];
  const O = new THREE.Group(); O.name = 'exterior'; G.add(O);
  const lights = K.M.lights;
  const addLight = (x: number, y: number, z: number, n: number, color = 0xffa860, dist = 0) => {
    const l = new THREE.PointLight(color, 0, dist, 2); l.position.set(x, y, z); O.add(l); lights.push({ l, d: 0, n }); return l;
  };

  // ---------- posições de árvores (antes do terreno, para a máscara de folhas) ----------
  // corredores de visão das câmeras externas: nada de árvore entre a câmera e o alvo
  const cams = views.filter(v => Math.abs(v.p[0]) > NX + 2 || Math.abs(v.p[2]) > NZ + 2);
  const inCorridor = (x: number, z: number) => cams.some(v => {
    const ax = v.p[0], az = v.p[2], bx2 = v.t[0], bz = v.t[2], dx = bx2 - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = Math.max(-0.15, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    return Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < 4.5 + 3 * Math.max(0, t);
  });
  const free = (x: number, z: number, m = 0) => !inCorridor(x, z) &&
    !(Math.abs(x) < NX + 9 + m && z > -NZ - 7 - m && z < NZ + 6 + m) &&            // igreja
    !(Math.abs(x) < 5 + m && z > 10 - m) &&                                         // caminho
    !(x > PARK.x0 - 2 - m && x < PARK.x1 + 2 + m && z > PARK.z0 - 2 - m && z < PARK.z1 + 3 + m) &&
    !(Math.hypot(x - SHED.x, z - SHED.z) < 5 + m) && !(Math.hypot(x - GAZEBO.x, z - GAZEBO.z) < 6 + m) &&
    !(x > GRAVE.x0 - 1 - m && x < GRAVE.x1 + 1 + m && z > GRAVE.z0 - 1 - m && z < GRAVE.z1 + 1 + m) &&
    !(Math.hypot(x + 9, z - 19) < 2.5 + m);
  const inner: { x: number; z: number; id: string; s: number; r: number }[] = [];
  const innerIds = ['island_tree_01', 'island_tree_02', 'island_tree_03', 'tree_small_02', 'island_tree_01', 'island_tree_02', 'jacaranda_tree'];
  for (let i = 0; i < 400 && inner.length < 22; i++) {
    const x = (rnd() - 0.5) * 2 * (FENCE.x - 2), z = FENCE.z0 + 2 + rnd() * (FENCE.z1 - FENCE.z0 - 4);
    if (!free(x, z, 1) || inner.some(t => Math.hypot(t.x - x, t.z - z) < 6.5)) continue;
    inner.push({ x, z, id: innerIds[(rnd() * innerIds.length) | 0], s: 1.15 + rnd() * 0.45, r: rnd() * 6.28 });
  }
  const forest: { x: number; z: number; id: string; v: number; s: number; r: number; tier: string }[] = [];
  for (let i = 0; i < 2500 && forest.length < Q.forest; i++) {
    const a = rnd() * Math.PI * 2, rr = 36 + Math.pow(rnd(), 0.8) * 70, x = Math.cos(a) * rr * 1.05, z = 8 + Math.sin(a) * rr * 1.15;
    if (Math.abs(x) < FENCE.x + 4 && z > FENCE.z0 - 4 && z < FENCE.z1 + 4) continue;
    if (Math.abs(x) < 9 && z > FENCE.z1) continue; // abertura da estrada de acesso
    if (forest.some(t => Math.hypot(t.x - x, t.z - z) < 5) || inCorridor(x, z)) continue;
    forest.push({ x, z, id: 'fir_tree_01', v: (rnd() * 3) | 0, s: 0.85 + rnd() * 0.4, r: rnd() * 6.28, tier: rr < Q.lod ? '' : rr < 68 ? '_lod1' : '_lod2' });
  }
  const underTree = (x: number, z: number) => {
    let m = 0;
    for (const t of inner) m = Math.max(m, 1 - sm(1.5, 6.5, Math.hypot(t.x - x, t.z - z)));
    for (const t of forest) m = Math.max(m, 1 - sm(2, 7, Math.hypot(t.x - x, t.z - z)));
    return m;
  };

  // ---------- terreno ----------
  const ter = makeTerrain({
    size: 320, seg: 256, height: groundH,
    base: { id: 'leafy_grass', size: 3.0 }, r: { id: 'forest_ground_04', size: 2.5 }, g: { id: 'brown_mud_leaves_01', size: 2.6 },
    mask: (x, z) => groundMask(x, z),
  });
  ter.mesh.userData.ns = 1; O.add(ter.mesh); O.add(ter.collider); floors.push(ter.collider);
  function groundMask(x: number, z: number): [number, number] {
      const n = fbm(x * 0.09, z * 0.09, 3), n2 = noise2(x * 0.5, z * 0.5);
      let dirt = sm(0.62, 0.8, n) * 0.7;
      if (Math.abs(x) < PATH.w / 2 + 0.7 && z > PATH.z0 - 1) dirt = Math.max(dirt, 0.55 * (1 - sm(PATH.w / 2 - 0.1, PATH.w / 2 + 0.7, Math.abs(x))) * (0.6 + 0.4 * n2));
      if (Math.abs(x) < NX + 1.2 && Math.abs(z) < NZ + 1.2) dirt = Math.max(dirt, 0.45);
      if (x > PARK.x0 - 1.5 && x < PARK.x1 + 1.5 && z > PARK.z0 - 1.5 && z < PARK.z1 + 1.5) dirt = 1;
      if (Math.hypot(x - SHED.x, z - SHED.z) < 4.5) dirt = Math.max(dirt, 0.9);
      const leaves = Math.min(1, underTree(x, z) * (0.7 + 0.5 * n) + sm(30, 60, Math.hypot(x, z - 8)) * 0.5);
      return [Math.min(1, dirt), leaves];
  }

  // gramado procedural (touceiras de lâminas com vento), mais ralo na terra e sob as árvores:
  // uma camada densa em volta da igreja e do caminho e outra mais esparsa no resto do terreno
  const grassAllow = (x: number, z: number) => {
    if (Math.abs(x) < NX + WT + 0.9 && Math.abs(z) < NZ + WT + 0.9) return 0;
    if (Math.abs(x) < PATH.w / 2 + 0.25 && z > NZ) return 0;
    if (x > PARK.x0 - 0.5 && x < PARK.x1 + 0.5 && z > PARK.z0 - 0.5 && z < PARK.z1 + 0.5) return 0;
    if (Math.hypot(x - GAZEBO.x, z - GAZEBO.z) < GAZEBO.r + 0.4) return 0;
    const [d, l] = groundMask(x, z);
    return Math.max(0, 1 - d * 0.9 - l * 0.6);
  };
  const grassTall = (x: number, z: number) => { const d = Math.min(Math.abs(Math.abs(x) - FENCE.x), Math.abs(z - FENCE.z0)); const g = x > GRAVE.x0 - 1 && x < GRAVE.x1 + 1 && z > GRAVE.z0 - 1 && z < GRAVE.z1 + 1; return g ? 2.2 : 1 + 1.4 * (1 - sm(1, 7, d)); };
  O.add(grassField({ count: Math.round(Q.blades * 0.6), area: [-13, 13, -18, FENCE.z1 - 0.5], height: groundH, allow: grassAllow, tall: grassTall }));
  O.add(grassField({ count: Math.round(Q.blades * 0.4), area: [-FENCE.x + 0.5, FENCE.x - 0.5, FENCE.z0 + 0.5, FENCE.z1 - 0.5], height: groundH, allow: (x, z) => (Math.abs(x) < 13 && z > -18 ? 0 : grassAllow(x, z)), tall: grassTall }));

  // ---------- escadaria, pórtico e caminho de pedra ----------
  const conD = M.concreteDark(), trim = M.concreteTrim();
  for (let i = 0; i < 3; i++) {
    const top = FLOOR - (i + 1) * 0.2 + 0.2, z = NZ + WT + 0.25 + 0.2 + i * 0.42;
    const s = cube(5.2 + i * 0.4, top, 0.42, 0, top / 2, z, [trim, trim, conD, trim, trim, trim], O); floors.push(s);
  }
  // muretas laterais da escada com vasos de flores
  [-1, 1].forEach(s => {
    const m = cube(0.45, FLOOR + 0.35, 1.6, s * 2.85, (FLOOR + 0.35) / 2, NZ + WT + 0.9, conD, O); solids.push(m);
    cube(0.55, 0.08, 1.7, s * 2.85, FLOOR + 0.39, NZ + WT + 0.9, trim, O);
  });
  const PZ0 = NZ + WT + 0.1, PZ1 = NZ + 2.6;
  // pórtico de madeira com telhado de ardósia
  [-1, 1].forEach(s => {
    const p = cube(0.26, 3.4, 0.26, s * 2.3, FLOOR + 1.7, PZ1, M.woodBeam(), O); solids.push(p);
    cube(0.4, 0.2, 0.4, s * 2.3, FLOOR + 0.1, PZ1, trim, O);
    cube(0.2, 0.26, PZ1 - PZ0 + 0.4, s * 2.3, FLOOR + 3.4, (PZ0 + PZ1) / 2, M.woodBeam(), O);
    const br = cube(0.12, 0.9, 0.12, s * 2.3, FLOOR + 3.0, PZ1 - 0.4, M.woodBeam(), O); br.rotation.x = 0.7;
  });
  cube(4.86, 0.26, 0.24, 0, FLOOR + 3.4, PZ1, M.woodBeam(), O);
  { const ang = 0.45, half = 2.75, len = half / Math.cos(ang);
    [-1, 1].forEach(s => { const r = mesh(boxUV(new THREE.BoxGeometry(len, 0.12, PZ1 - PZ0 + 0.7)), [M.woodDark(), M.woodDark(), M.slate(), M.ceiling(), M.woodDark(), M.woodDark()], s * half / 2, FLOOR + 3.55 + (half * Math.tan(ang)) / 2, (PZ0 + PZ1) / 2 + 0.2, O); r.rotation.z = -s * ang; });
    const tri = new THREE.Shape([new THREE.Vector2(-2.5, 0), new THREE.Vector2(2.5, 0), new THREE.Vector2(0, 2.5 * Math.tan(ang))]);
    mesh(boxUV(new THREE.ExtrudeGeometry(tri, { depth: 0.08, bevelEnabled: false })), M.woodDark(), 0, FLOOR + 3.52, PZ1 + 0.05, O); }
  place('lantern_chandelier_01', 0, FLOOR + 2.85, (PZ0 + PZ1) / 2 + 0.3, 0, 1.0, O).catch(() => {});
  addLight(0, FLOOR + 2.75, (PZ0 + PZ1) / 2 + 0.3, 6, 0xffb070);
  halo(0, FLOOR + 2.8, (PZ0 + PZ1) / 2 + 0.3, 1.4);
  lightsVtt.push([0, (PZ0 + PZ1) / 2, 5, 0.8, 'ffb067']);
  // luz quente que sai pela porta aberta
  addLight(0, FLOOR + 2.2, NZ - 1.2, 9, 0xffa050);

  const path = mesh(boxUV(new THREE.BoxGeometry(PATH.w, 0.06, PATH.z1 - PATH.z0)), [trim, trim, M.stonePath(), trim, trim, trim], 0, 0.02, (PATH.z0 + PATH.z1) / 2, O);
  path.castShadow = false;
  // meio-fio
  [-1, 1].forEach(s => { const c = cube(0.14, 0.1, PATH.z1 - PATH.z0, s * (PATH.w / 2 + 0.07), 0.04, (PATH.z0 + PATH.z1) / 2, conD, O); c.castShadow = false; });
  // passadeira branca e pétalas sobre o caminho
  const run = cube(1.2, 0.012, 22, 0, 0.056, PATH.z0 + 11.2, M.fabric(), O); run.castShadow = false;
  F.scatterPetals(-0.6, 0.6, PATH.z0, PATH.z0 + 22, 0.065, 160);
  F.scatterPetals(-1.3, 1.3, PATH.z0, PATH.z0 + 26, 0.055, 80);

  // ---------- varais de lampadinhas (catenária entre dois pontos) ----------
  const bulbPos: THREE.Vector3[] = [], wires: THREE.BufferGeometry[] = [];
  const garland = (a: THREE.Vector3, b: THREE.Vector3, sag: number, n: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; const p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts);
    wires.push(new THREE.TubeGeometry(curve, 24, 0.006, 4, false));
    for (let i = 1; i < n; i++) { const p = curve.getPointAt(i / n); p.y -= 0.03; bulbPos.push(p); }
  };

  // ---------- poças (refletem o céu e as luzes) ----------
  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.05, metalness: 0.0, envMapIntensity: 0.9, transparent: true, opacity: 0.9 });
  const puddle = (x: number, z: number, r: number, y: number) => {
    const pts: THREE.Vector2[] = []; const k = rnd() * 10;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, rr = r * (0.7 + 0.45 * noise2(Math.cos(a) * 1.3 + k, Math.sin(a) * 1.3 + k)); pts.push(new THREE.Vector2(Math.cos(a) * rr * 1.4, Math.sin(a) * rr)); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2), puddleMat);
    m.position.set(x, y, z); m.rotation.y = rnd() * 3; m.receiveShadow = true; m.userData.ns = 1; O.add(m);
  };
  puddle(0.5, 15.5, 0.7, 0.056); puddle(-0.8, 21, 0.55, 0.056); puddle(0.9, 30, 0.8, 0.056); puddle(14, 31, 1.4, 0.04); puddle(20, 37, 1.0, 0.04); puddle(-4.5, 17, 0.9, 0.03); puddle(4.6, 26, 0.7, 0.03);
  K.M.puddle = puddleMat;

  // ---------- cerca de ferro e portão ----------
  { const bars: THREE.Matrix4[] = [], o = new THREE.Object3D(), H = 1.9;
    const bar = (x: number, z: number) => { o.position.set(x, groundH(x, z) + H / 2, z); o.updateMatrix(); bars.push(o.matrix.clone()); };
    for (let x = -FENCE.x; x <= FENCE.x; x += 0.16) { bar(x, FENCE.z0); if (Math.abs(x) > 2.3) bar(x, FENCE.z1); }
    for (let z = FENCE.z0; z <= FENCE.z1; z += 0.16) { bar(-FENCE.x, z); bar(FENCE.x, z); }
    const bg = new THREE.CylinderGeometry(0.014, 0.014, H, 5);
    const tip = new THREE.ConeGeometry(0.035, 0.12, 4); tip.translate(0, H / 2 + 0.06, 0);
    const im = new THREE.InstancedMesh(bg, iron(), bars.length), it = new THREE.InstancedMesh(tip, iron(), bars.length);
    bars.forEach((m, i) => { im.setMatrixAt(i, m); it.setMatrixAt(i, m); }); im.castShadow = it.castShadow = true; O.add(im, it);
    const rail = (x0: number, z0: number, x1: number, z1: number) => [0.18, 1.55].forEach(y => { const L = Math.hypot(x1 - x0, z1 - z0); const r = cube(L, 0.035, 0.035, (x0 + x1) / 2, y, (z0 + z1) / 2, iron(), O); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); });
    rail(-FENCE.x, FENCE.z0, FENCE.x, FENCE.z0); rail(-FENCE.x, FENCE.z0, -FENCE.x, FENCE.z1); rail(FENCE.x, FENCE.z0, FENCE.x, FENCE.z1);
    rail(-FENCE.x, FENCE.z1, -2.4, FENCE.z1); rail(2.4, FENCE.z1, FENCE.x, FENCE.z1);
    // pilares do portão com lanternas
    [-1, 1].forEach(s => {
      const p = cube(0.7, 2.6, 0.7, s * 2.65, 1.3, FENCE.z1, M.concrete(), O); solids.push(p);
      cube(0.85, 0.16, 0.85, s * 2.65, 2.68, FENCE.z1, trim, O);
      place('wooden_lantern_01', s * 2.65, 2.76, FENCE.z1, 0, 1.3, O).catch(() => {});
      halo(s * 2.65, 3.05, FENCE.z1, 0.7);
    });
    if (hasModel('large_iron_gate')) modelSize('large_iron_gate').then(sz => {
      const k = 4.4 / sz.x; place('large_iron_gate', 0, 0, FENCE.z1, 0, k, O);
    }).catch(() => {}); }

  // ---------- postes ao longo do caminho ----------
  { const posts: Xf[] = [];
    [17, 25, 33].forEach(z => [-1, 1].forEach(s => posts.push({ x: s * 2.2, y: 0, z, ry: s > 0 ? Math.PI : 0 })));
    if (hasModel('street_lamp_01')) {
      const sz = await modelSize('street_lamp_01'), k = 3.4 / sz.y;
      posts.forEach(p => (p.s = k));
      await instance('street_lamp_01', posts, O);
      posts.forEach((p, i) => { const y = sz.y * k - 0.35; halo(p.x, y, p.z, 0.9); if (i < 4) addLight(p.x, y - 0.1, p.z, 7, 0xffb877); lightsVtt.push([p.x, p.z, 5, 0.7, 'ffb067']); });
    } }

  // varais: frente do pórtico e entre os postes do caminho
  garland(new THREE.Vector3(-2.3, FLOOR + 3.3, NZ + 2.75), new THREE.Vector3(2.3, FLOOR + 3.3, NZ + 2.75), 0.35, 16);
  [-1, 1].forEach(s => { [[17, 25], [25, 33]].forEach(([z0, z1]) => garland(new THREE.Vector3(s * 2.2, 3.0, z0), new THREE.Vector3(s * 2.2, 3.0, z1), 0.55, 18)); });
  [[17, 17], [25, 25], [33, 33]].forEach(([z]) => garland(new THREE.Vector3(-2.2, 3.05, z), new THREE.Vector3(2.2, 3.05, z), 0.5, 12));

  // ---------- decoração do casamento no caminho ----------
  { const lan: Xf[] = [];
    for (let z = PATH.z0 + 1.5; z < PATH.z0 + 23; z += 3) [-1, 1].forEach(s => lan.push({ x: s * 1.75, y: 0.04, z, ry: rnd() * 6 }));
    await instance('wooden_lantern_01', lan, O).catch(() => {});
    // chamas das velas: pequenas luzes emissivas + halo
    const flame = new THREE.MeshBasicMaterial({ color: 0xffb060 }); K.M.lamps.push(flame);
    const fg = new THREE.SphereGeometry(0.03, 6, 6); fg.scale(1, 1.8, 1);
    const fl = new THREE.InstancedMesh(fg, flame, lan.length); const o = new THREE.Object3D();
    lan.forEach((l, i) => { o.position.set(l.x, 0.2, l.z); o.updateMatrix(); fl.setMatrixAt(i, o.matrix); halo(l.x, 0.22, l.z, 0.35); }); O.add(fl);
    // arco de flores sobre o caminho
    const AZ = PATH.z0 + 9, R = 1.85;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 6, 40, Math.PI), iron()); arc.position.set(0, 0.6, AZ); arc.castShadow = true; O.add(arc);
    [-1, 1].forEach(s => { const leg = cube(0.06, 0.62, 0.06, s * R, 0.31, AZ, iron(), O); void leg; });
    for (let k = 0; k <= 26; k++) { const a = (k / 26) * Math.PI; F.bunch(Math.cos(a) * R, 0.6 + Math.sin(a) * R, AZ, 0.16, 5, 2.2); }
    [-1, 1].forEach(s => F.bunch(s * R, 0.35, AZ, 0.32, 18, 2));
    // vasos de barro com flores junto à escada
    [-1, 1].forEach(s => { place('planter_pot_clay', s * 2.85, FLOOR + 0.43, NZ + WT + 0.6, 0, 1.6, O).catch(() => {}); F.bunch(s * 2.85, FLOOR + 0.9, NZ + WT + 0.6, 0.28, 28, 1.6); });
    // bancos de jardim
    [[-4.4, 20, Math.PI / 2], [4.4, 20, -Math.PI / 2], [-4.4, 31, Math.PI / 2], [4.4, 31, -Math.PI / 2]].forEach(([x, z, r]) => place('painted_wooden_bench', x, 0, z, r, 1, O).then(b => b.traverse((o: any) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.45); } })).catch(() => {}));
  }

  // ---------- estacionamento com carros cobertos ----------
  { const gv = mesh(boxUV(new THREE.BoxGeometry(PARK.x1 - PARK.x0, 0.05, PARK.z1 - PARK.z0)), [conD, conD, M.gravel(), conD, conD, conD], (PARK.x0 + PARK.x1) / 2, 0.0, (PARK.z0 + PARK.z1) / 2, O); gv.castShadow = false;
    const drive = mesh(boxUV(new THREE.BoxGeometry(4, 0.05, 10)), [conD, conD, M.gravel(), conD, conD, conD], 6.5, 0.005, 35, O); drive.rotation.y = -0.9; drive.castShadow = false;
    if (hasModel('covered_car')) {
      const sz = await modelSize('covered_car'), k = 4.6 / Math.max(sz.x, sz.z), rot = sz.x > sz.z ? Math.PI / 2 : 0;
      const cars: Xf[] = [{ x: 13.2, y: 0, z: 28.5, ry: rot }, { x: 16.4, y: 0, z: 28.3, ry: rot + 0.04 }, { x: 22.8, y: 0, z: 28.6, ry: rot - 0.05 }, { x: 15, y: 0, z: 35.5, ry: rot + Math.PI + 0.08 }, { x: 19.6, y: 0, z: 35.2, ry: rot + Math.PI }];
      cars.forEach(c => (c.s = k));
      await instance('covered_car', cars, O);
      cars.forEach(c => { const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 4.6), new THREE.MeshBasicMaterial({ visible: false })); b.position.set(c.x, 0.7, c.z); b.rotation.y = (c.ry || 0) - rot; b.userData.ns = 1; O.add(b); solids.push(b); });
    } }

  // ---------- galpão ----------
  { const S = SHED, g = new THREE.Group(); g.position.set(S.x, 0, S.z); g.rotation.y = -Math.PI / 2; O.add(g);
    const wd = M.weathered();
    cube(S.w + 0.2, 0.15, S.d + 0.2, 0, 0.075, 0, conD, g);
    const back = cube(S.w, S.h, 0.1, 0, S.h / 2, -S.d / 2, wd, g);
    const l = cube(0.1, S.h, S.d, -S.w / 2, S.h / 2, 0, wd, g), r = cube(0.1, S.h, S.d, S.w / 2, S.h / 2, 0, wd, g);
    [-1, 1].forEach(s => cube((S.w - 1.1) / 2, S.h, 0.1, s * (S.w + 1.1) / 4, S.h / 2, S.d / 2, wd, g));
    cube(1.1, S.h - 2.0, 0.1, 0, 2.0 + (S.h - 2.0) / 2, S.d / 2, wd, g);
    const door = cube(1.0, 1.95, 0.06, 0.5, 0.98, S.d / 2 + 0.03, wd, g); door.geometry.translate(-0.5, 0, 0); door.position.x = 0.55 - 0.0; door.rotation.y = -1.1;
    solids.push(back, l, r);
    const tri = new THREE.Shape([new THREE.Vector2(-S.w / 2, 0), new THREE.Vector2(S.w / 2, 0), new THREE.Vector2(0, 1.0)]);
    [-1, 1].forEach(s => mesh(boxUV(new THREE.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false })), wd, 0, S.h, s * S.d / 2 - (s > 0 ? 0.1 : 0), g));
    const ang = Math.atan2(1.0, S.w / 2), len = (S.w / 2 + 0.35) / Math.cos(ang);
    [-1, 1].forEach(s => { const rf = cube(len, 0.06, S.d + 0.6, s * (S.w / 4 + 0.08), S.h + 0.5, 0, M.rust(), g); rf.rotation.z = -s * ang; });
    place('Lantern_01', 0.9, 2.1, S.d / 2 + 0.2, 0, 1, g).catch(() => {});
    const wp = new THREE.Vector3(0.9, 2.15, S.d / 2 + 0.25).applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2)).add(new THREE.Vector3(S.x, 0, S.z));
    addLight(wp.x, wp.y - 0.1, wp.z, 3.5, 0xffa458); halo(wp.x, wp.y, wp.z, 1.4); lightsVtt.push([wp.x, wp.z, 4, 0.7, 'ffb067']);
    place('wine_barrel_01', -1.2, 0.15, S.d / 2 + 0.7, 0.3, 1, g).catch(() => {});
    place('wooden_crate_01', 1.5, 0.15, -0.6, 0.2, 1, g).catch(() => {});
    place('wooden_crate_01', -1.4, 0.15, -0.9, -0.4, 0.9, g).catch(() => {}); }

  // ---------- caramanchão (gazebo) ----------
  { const Z = GAZEBO, g = new THREE.Group(); g.position.set(Z.x, 0, Z.z); O.add(g);
    const flm = new THREE.Mesh(boxUV(new THREE.CylinderGeometry(Z.r + 0.2, Z.r + 0.3, 0.3, 8)), M.floor()); flm.position.y = 0.15; flm.castShadow = flm.receiveShadow = true; g.add(flm); floors.push(flm);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * Z.r, z = Math.sin(a) * Z.r;
      const p = cube(0.18, 2.8, 0.18, x, 1.7, z, M.woodBeam(), g); solids.push(p);
      if (k !== 2) { const rl = cube(2 * Z.r * Math.sin(Math.PI / 8), 0.08, 0.08, Math.cos(a + Math.PI / 8) * Z.r * Math.cos(Math.PI / 8), 1.2, Math.sin(a + Math.PI / 8) * Z.r * Math.cos(Math.PI / 8), M.woodBeam(), g); rl.rotation.y = -(a + Math.PI / 8) + Math.PI / 2; }
    }
    const roof = new THREE.Mesh(boxUV(new THREE.ConeGeometry(Z.r + 0.8, 1.8, 8)), M.slate()); roof.position.y = 3.1 + 0.9; roof.rotation.y = Math.PI / 8; roof.castShadow = roof.receiveShadow = true; g.add(roof);
    const ceil = new THREE.Mesh(new THREE.ConeGeometry(Z.r + 0.75, 1.75, 8, 1, true), M.ceiling()); ceil.material = ceil.material; ceil.position.y = 3.08 + 0.88; ceil.rotation.y = Math.PI / 8; (ceil as any).material = M.ceiling().clone(); (ceil.material as THREE.Material).side = THREE.BackSide; g.add(ceil);
    place('wooden_lantern_01', 0, 2.6, 0, 0, 1.1, g).catch(() => {});
    addLight(Z.x, 2.6, Z.z, 4, 0xffae60); halo(Z.x, 2.75, Z.z, 1.6); lightsVtt.push([Z.x, Z.z, 5, 0.7, 'ffb067']);
    F.bunch(Z.x, 0.95, Z.z, 0.3, 26, 1.5); // o coletor de flores usa coordenadas do mundo
    for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((k + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      garland(new THREE.Vector3(Z.x + Math.cos(a0) * Z.r, 3.0, Z.z + Math.sin(a0) * Z.r), new THREE.Vector3(Z.x + Math.cos(a1) * Z.r, 3.0, Z.z + Math.sin(a1) * Z.r), 0.22, 7); }
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 20), M.fabric()); tbl.position.y = 0.78; g.add(tbl);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.5, 10), M.woodBeam()); leg.position.y = 0.55; g.add(leg); }

  // ---------- cemitério antigo ----------
  { const stoneM = pbr2();
    const head = new THREE.Shape(); head.moveTo(-0.32, 0); head.lineTo(0.32, 0); head.lineTo(0.32, 0.7); head.absarc(0, 0.7, 0.32, 0, Math.PI, false); head.lineTo(-0.32, 0);
    const hg = boxUV(new THREE.ExtrudeGeometry(head, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 }));
    const crossS = new THREE.Shape([[-0.06, 0], [0.06, 0], [0.06, 0.62], [0.24, 0.62], [0.24, 0.74], [0.06, 0.74], [0.06, 1.0], [-0.06, 1.0], [-0.06, 0.74], [-0.24, 0.74], [-0.24, 0.62], [-0.06, 0.62]].map(([x, y]) => new THREE.Vector2(x, y)));
    const cg = boxUV(new THREE.ExtrudeGeometry(crossS, { depth: 0.1, bevelEnabled: false }));
    const hs: Xf[] = [], cs: Xf[] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      if (rnd() < 0.18) continue;
      const x = GRAVE.x0 + 1.4 + c * 2.1 + (rnd() - 0.5) * 0.3, z = GRAVE.z0 + 2 + r * 4 + (rnd() - 0.5) * 0.4;
      (rnd() < 0.7 ? hs : cs).push({ x, y: -0.06, z, ry: (rnd() - 0.5) * 0.2, s: 0.8 + rnd() * 0.45, tilt: (rnd() - 0.5) * 0.14 });
    }
    const mk = (geo: THREE.BufferGeometry, L: Xf[]) => { const im = new THREE.InstancedMesh(geo, stoneM, L.length), o = new THREE.Object3D(); L.forEach((t, i) => { o.position.set(t.x, t.y, t.z); o.rotation.set(t.tilt || 0, t.ry || 0, 0); o.scale.setScalar(t.s || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = im.receiveShadow = true; O.add(im); };
    mk(hg, hs); mk(cg, cs);
    // cerquinha baixa de ferro ao redor
    const pts = [[GRAVE.x0, GRAVE.z0], [GRAVE.x1, GRAVE.z0], [GRAVE.x1, GRAVE.z1], [GRAVE.x0, GRAVE.z1]];
    for (let i = 0; i < 4; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % 4]; if (i === 1) continue; const L = Math.hypot(x1 - x0, z1 - z0); const r = cube(L, 0.03, 0.03, (x0 + x1) / 2, 0.7, (z0 + z1) / 2, iron(), O); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      for (let t = 0; t <= L; t += 0.5) cube(0.025, 0.75, 0.025, x0 + ((x1 - x0) * t) / L, 0.37, z0 + ((z1 - z0) * t) / L, iron(), O); } }

  // ---------- estátua ----------
  { const pd = cube(1.1, 1.0, 1.1, -9, 0.5, 19, M.concrete(), O); solids.push(pd); cube(1.3, 0.12, 1.3, -9, 1.04, 19, trim, O);
    if (hasModel('gothic_statue')) modelSize('gothic_statue').then(sz => place('gothic_statue', -9, 1.1, 19, Math.PI / 2, 1.9 / sz.y, O)).catch(() => {}); }

  // ---------- árvores ----------
  { const byId: Record<string, Xf[]> = {};
    inner.forEach(t => (byId[t.id] ||= []).push({ x: t.x, y: groundH(t.x, t.z) - 0.05, z: t.z, ry: t.r, s: t.s }));
    for (const [id, L] of Object.entries(byId)) (await instance(id, L, O, { wind: WIND.tree, tile: 25 })).forEach(m => (m.userData.canopy = 1));
    const fb: Record<string, Xf[]> = {};
    forest.forEach(t => { const k = t.id + t.tier + '#' + t.v; (fb[k] ||= []).push({ x: t.x, y: groundH(t.x, t.z) - 0.1, z: t.z, ry: t.r, s: t.s }); });
    for (const [k, L] of Object.entries(fb)) {
      const [id, v] = k.split('#');
      const mid = hasModel(id) ? id : id.replace(/_lod\d$/, '');
      (await instance(mid, L, O, { variant: +v, shadow: false, wind: WIND.fir, tile: 35 } /* floresta fora da cerca: sombra cairia fora do terreno */)).forEach(m => (m.userData.canopy = 1));
    }
    // tronco morto, tocos e raízes
    await instance('dead_tree_trunk', [{ x: -24, y: 0, z: 22, ry: 1, s: 1.4 }, { x: 23.5, y: 0, z: -14, ry: 2.4, s: 1.2 }, { x: -6, y: 0, z: -21, ry: 0.4, s: 1.0 }], O).catch(() => {});
    await instance('tree_stump_01', [{ x: 8.5, y: 0, z: -17, ry: 0, s: 1.2 }, { x: -18, y: 0, z: 19, ry: 2, s: 1 }, { x: 22, y: 0, z: 18, ry: 1, s: 1.1 }], O).catch(() => {});
    await instanceVariants('root_cluster_01', inner.slice(0, 8).map(t => ({ x: t.x + 0.3, y: groundH(t.x, t.z) - 0.05, z: t.z, ry: t.r, s: 0.8 })), O).catch(() => {});
  }

  // ---------- arbustos, cercas-vivas, samambaias, mato ----------
  { const shrubs: Record<string, Xf[]> = { shrub_01: [], shrub_02: [], shrub_03: [], shrub_04: [] };
    const sk = Object.keys(shrubs);
    for (let z = FENCE.z0 + 1; z < FENCE.z1; z += 1.6) [-1, 1].forEach(s => { if (rnd() < 0.75) shrubs[sk[(rnd() * 4) | 0]].push({ x: s * (FENCE.x - 0.9) + (rnd() - 0.5) * 0.6, y: 0, z: z + (rnd() - 0.5), ry: rnd() * 6, s: 0.9 + rnd() * 0.7 }); });
    for (let x = -FENCE.x + 1; x < FENCE.x; x += 1.6) if (rnd() < 0.75) shrubs[sk[(rnd() * 4) | 0]].push({ x, y: 0, z: FENCE.z0 + 0.9 + (rnd() - 0.5) * 0.5, ry: rnd() * 6, s: 0.9 + rnd() * 0.7 });
    for (const [id, L] of Object.entries(shrubs)) await instanceVariants(id, L, O, { shadow: Q.vegShadow, wind: WIND.shrub, tile: 20, cullDist: 80 }).catch(() => {});
    // cerca-viva baixa ao longo das laterais da igreja
    const hedge: Xf[] = [];
    [-1, 1].forEach(s => { for (let z = -NZ + 0.5; z < NZ - 1; z += 0.9) hedge.push({ x: s * (NX + WT + 1.45), y: 0, z, ry: rnd() * 6, s: 0.55 + rnd() * 0.15 }); });
    for (let x = -4.5; x <= 4.5; x += 0.9) hedge.push({ x, y: 0, z: -NZ - WT - 1.4, ry: rnd() * 6, s: 0.6 });
    await instance('moss_01', hedge, O, { wind: { amp: 0.02, freq: 1.1, flutter: 0.006 }, cullDist: 90 }).catch(() => {});
    // samambaias e urtigas sob as árvores; mato no gramado
    const ferns: Xf[] = [], nettles: Xf[] = [], grass: Xf[] = [], rocks: Xf[] = [];
    inner.forEach(t => { for (let i = 0; i < Q.ferns; i++) { const a = rnd() * 6.28, r = 1 + rnd() * 3; (rnd() < 0.6 ? ferns : nettles).push({ x: t.x + Math.cos(a) * r, y: groundH(t.x, t.z), z: t.z + Math.sin(a) * r, ry: rnd() * 6, s: 0.8 + rnd() * 0.8 }); } });
    for (let i = 0; i < 6000 && grass.length < Q.grass; i++) { const x = (rnd() - 0.5) * 2 * (FENCE.x - 1), z = FENCE.z0 + 1 + rnd() * (FENCE.z1 - FENCE.z0 - 2); if (!free(x, z, -3.5) && !(Math.abs(x) > 4 && Math.abs(x) < 9 && z > 13)) continue; if (Math.abs(x) < 2.6 && z > 11) continue; grass.push({ x, y: groundH(x, z) - 0.02, z, ry: rnd() * 6, s: 0.6 + rnd() * 0.7 }); }
    for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = 30 + rnd() * 25; rocks.push({ x: Math.cos(a) * r, y: groundH(Math.cos(a) * r, 8 + Math.sin(a) * r) - 0.1, z: 8 + Math.sin(a) * r, ry: rnd() * 6, s: 0.8 + rnd() * 1.2 }); }
    await instanceVariants('fern_02', ferns, O, { shadow: Q.vegShadow, wind: WIND.low, tile: 15, cullDist: 50 }).catch(() => {});
    await instanceVariants('nettle_plant', nettles, O, { shadow: Q.vegShadow, wind: WIND.low, tile: 15, cullDist: 50 }).catch(() => {});
    await instanceVariants('grass_medium_01', grass, O, { shadow: false, wind: WIND.grass, tile: 15, cullDist: 45 }).catch(() => {});
    await instanceVariants('rock_moss_set_01', rocks, O).catch(() => {});
    await instance('boulder_01', [{ x: -25, y: 0, z: 36, ry: 1, s: 1 }, { x: 24, y: 0, z: -22, ry: 2, s: 1.2 }], O).catch(() => {});
  }
  // instancia as lampadinhas e os fios (uma chamada de desenho cada)
  if (bulbPos.length) {
    const bm = new THREE.MeshBasicMaterial({ color: 0xffc070 }); K.M.lamps.push(bm);
    const bi = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 6), bm, bulbPos.length), o = new THREE.Object3D();
    bulbPos.forEach((p, i) => { o.position.copy(p); o.updateMatrix(); bi.setMatrixAt(i, o.matrix); });
    bi.userData.ns = 1; O.add(bi);
    const wm = new THREE.Mesh(mergeGeometries(wires), iron()); wm.castShadow = false; wm.userData.ns = 1; O.add(wm);
  }
  return { solids, floors, lightsVtt };
}

let _gs: THREE.MeshStandardMaterial | null = null;
function pbr2() { return (_gs ||= M.concrete().clone()), _gs.color.set(0x8a8a82), _gs; }
export { bx, model };
