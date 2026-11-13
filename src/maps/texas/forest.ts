// Cedar Hollow — pinheiral a noroeste de Harlow, onde as crianças somem. No meio, o Camp Harlow (acampamento
// infantil abandonado em 1987): cabanas, torre de vigia, fogueira, balanço, mastro, e a "árvore dos sapatos"
// com o sigilo entalhado. Pistas: bicicleta do Danny, lanterna do Tommy acesa no chão, cartazes, diário da
// monitora. Pinheiros de modelo perto do acampamento e pinheiros leves em código no resto (a névoa esconde).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boxUV, pbr } from '../../core/pbr';
import { instance, instanceVariants, hasModel, type Xf } from '../../core/models';
import { halo } from '../../core/kit';
import { grassField } from '../../core/grass';
import { fbm, noise2 } from '../../core/terrain';
import { Batch, mtx, rnd, reseed, TM, shell, gableRoof, light, sign, lod, Q, FOREST, CAMP } from './common';
import { groundH } from './nature';

export interface Forest { solids: THREE.Object3D[]; floors: THREE.Object3D[]; roofs: THREE.Group; docs: { o: THREE.Object3D; n: string }[]; vttWalls: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[]; lamps: THREE.MeshBasicMaterial[] }

/** a floresta ocupa um círculo deformado; 1 = mata fechada */
export function forestMask(x: number, z: number) {
  const d = Math.hypot(x - FOREST.x, z - FOREST.z), r = FOREST.r * (0.85 + 0.3 * noise2(x * 0.03, z * 0.03));
  return 1 - Math.min(1, Math.max(0, (d - r + 10) / 14));
}
/** trilha da estrada até o acampamento (0..1 no leito) */
export function trailMask(x: number, z: number) {
  const a = new THREE.Vector2(FOREST.trail[0], FOREST.trail[1]), b = new THREE.Vector2(CAMP.x, CAMP.z), p = new THREE.Vector2(x, z);
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  const q = a.clone().addScaledVector(ab, t), wob = Math.sin(t * 9) * 3;
  return 1 - Math.min(1, Math.max(0, (p.distanceTo(q) - Math.abs(wob) * 0.2 - 1.6) / 1.8));
}

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/** pinheiro leve (~150 triângulos): tronco + 7 saias de galhos com borda irregular, verde-escuro */
function pineGeo(seed: number) {
  reseed(seed * 17 + 3);
  const parts: THREE.BufferGeometry[] = [], h = 10 + rnd() * 5, tiers = 7;
  const tr = new THREE.CylinderGeometry(0.1, 0.3, h * 0.6, 6); tr.translate(0, h * 0.3, 0); parts.push(tr.toNonIndexed());
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), y0 = h * (0.18 + f * 0.62), r = (2.3 - f * 1.9) * (0.85 + rnd() * 0.3), ch = h * (0.22 - f * 0.06);
    const c = new THREE.ConeGeometry(r, ch, 9, 1, true); c.translate(0, y0 + ch / 2, 0);
    const p = c.attributes.position; // borda de baixo irregular e caída (galhos)
    for (let k = 0; k < p.count; k++) if (p.getY(k) < y0 + 0.01) { const a = Math.atan2(p.getZ(k), p.getX(k)), j = 0.8 + 0.4 * Math.abs(Math.sin(a * 4.5 + i * 1.7)); p.setXYZ(k, p.getX(k) * j, y0 - 0.35 * j - rnd() * 0.25, p.getZ(k) * j); }
    c.rotateY(rnd() * 3); parts.push(c.toNonIndexed());
  }
  const tip = new THREE.ConeGeometry(0.35, h * 0.14, 6); tip.translate(0, h * 0.95, 0); parts.push(tip.toNonIndexed());
  parts.forEach(p => p.deleteAttribute('uv'));
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const p = g.attributes.position, a = new Float32Array(p.count * 3), base = new THREE.Color().setHSL(0.25 + rnd() * 0.05, 0.22, 0.075), bark = new THREE.Color(0x2e221a);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i));
    const c = (y < h * 0.2 && r < 0.4) ? bark : base.clone().multiplyScalar(0.7 + 0.6 * (y / h) + 0.35 * Math.min(1, r / 2) + 0.1 * Math.sin(i * 1.3));
    a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

export async function buildForest(G: THREE.Group): Promise<Forest> {
  reseed(1966);
  const m = TM(), O = new THREE.Group(); O.name = 'floresta'; G.add(O);
  const B = new Batch('floresta'), D = new Batch('floresta-detalhes'), F = new Batch('floresta-piso'), R = new Batch('floresta-telhados');
  const roofs = new THREE.Group(); roofs.name = 'telhados-floresta'; G.add(roofs);
  const docs: Forest['docs'] = [], vttWalls: Forest['vttWalls'] = [], portals: Forest['portals'] = [], lamps: THREE.MeshBasicMaterial[] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const gy = (x: number, z: number) => groundH(x, z);
  const plane = (t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, name?: string, o: THREE.MeshStandardMaterialParameters = {}) => {
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, transparent: true, ...o }));
    mm.position.set(x, y, z); mm.rotation.y = ry; mm.userData.ns = 1; mm.geometry.computeBoundingSphere(); mm.userData.cullDist = 60; O.add(mm);
    if (name) docs.push({ o: mm, n: name }); return mm;
  };

  // ---------- chão de mata (folhas e agulhas) por cima do terreno, com borda irregular ----------
  {
    const S = FOREST.r * 2 + 40, seg = Math.round(S / 1.5), g = new THREE.PlaneGeometry(S, S, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + FOREST.x, z = p.getZ(i) + FOREST.z, k = forestMask(x, z) * (0.75 + 0.5 * fbm(x * 0.12, z * 0.12, 2)), tr = trailMask(x, z);
      // dentro da mata fica 4 cm acima do terreno; fora, afunda (borda irregular, sem transparência)
      p.setXYZ(i, x, gy(x, z) + 0.04, z);
      const c = (0.75 + 0.3 * fbm(x * 0.05 + 3, z * 0.05, 2)) * (1 + tr * 0.25); col[i * 4] = c; col[i * 4 + 1] = c * 0.98; col[i * 4 + 2] = c * 0.92; col[i * 4 + 3] = Math.min(1, Math.max(0, (k - 0.08) / 0.4)); // borda some aos poucos
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.computeVertexNormals(); boxUV(g);
    // cor de vértice com alfa (itemSize 4): a borda da mata se mistura com o terreno, sem degraus
    const base = pbr('forest_ground_04', { size: 2.5, color: 0xb0a898 }), mat = base.clone(); mat.vertexColors = true; mat.transparent = true; mat.depthWrite = false; mat.polygonOffset = true; mat.polygonOffsetFactor = -2;
    const fl = new THREE.Mesh(g, mat); fl.receiveShadow = true; fl.userData.ns = 1; fl.renderOrder = -1; O.add(fl);
  }

  // ---------- árvores ----------
  const trees: { x: number; z: number; s: number; r: number; v: number }[] = [];
  const shoeX = CAMP.x + CAMP.shoes[0], shoeZ = CAMP.z + CAMP.shoes[1];
  // pontos que ficam livres de árvores: câmeras das vistas da floresta (não nascem árvores na frente delas)
  const livres = FOREST.cams;
  const free = (x: number, z: number, sp: number) => Math.hypot(x - CAMP.x, z - CAMP.z) > CAMP.r && Math.hypot(x - shoeX, z - shoeZ) > 7.5 && livres.every(([a, b2]) => Math.hypot(x - a, z - b2) > 5) && trailMask(x, z) < 0.05 && !trees.some(t => Math.abs(t.x - x) < sp && Math.abs(t.z - z) < sp);
  const N = { baixa: 260, media: 420, alta: 600 }[Q.lights > 14 ? 'alta' : Q.lights > 8 ? 'media' : 'baixa'];
  for (let i = 0; i < N * 12 && trees.length < N; i++) {
    const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * (FOREST.r + 8), x = FOREST.x + Math.cos(a) * rr, z = FOREST.z + Math.sin(a) * rr;
    if (forestMask(x, z) < 0.35 + rnd() * 0.4 || !free(x, z, 3.2 + rnd() * 2)) continue;
    trees.push({ x, z, s: 0.8 + rnd() * 0.5, r: rnd() * 6.28, v: (rnd() * 3) | 0 });
  }
  const rest = trees;
  // pinheiros leves em código (o resto da mata)
  const pmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.35, side: THREE.DoubleSide });
  for (let v = 0; v < 3; v++) {
    const geo = pineGeo(v), list = rest.filter(t => t.v === v), by = new Map<string, typeof list>();
    list.forEach(t => { const k = Math.floor(t.x / 30) + ',' + Math.floor(t.z / 30); if (!by.has(k)) by.set(k, []); by.get(k)!.push(t); });
    by.forEach(L => { const im = new THREE.InstancedMesh(geo, pmat, L.length), o = new THREE.Object3D(); L.forEach((t, i) => { o.position.set(t.x, gy(t.x, t.z) - 0.2, t.z); o.rotation.set(0, t.r, 0); o.scale.setScalar(t.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = Q.lights > 8; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.cullDist = 230; im.userData.canopy = 1; O.add(im); });
  }
  // sub-bosque: arbustos, samambaias, troncos caídos, raízes, pedras com musgo, tocos
  const scatter = (n: number, inner = CAMP.r) => { const out: Xf[] = []; for (let i = 0; i < n * 20 && out.length < n; i++) { const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * FOREST.r, x = FOREST.x + Math.cos(a) * rr, z = FOREST.z + Math.sin(a) * rr; if (forestMask(x, z) < 0.5 || Math.hypot(x - CAMP.x, z - CAMP.z) < inner || Math.hypot(x - CAMP.x - CAMP.shoes[0], z - CAMP.z - CAMP.shoes[1]) < 5 || trailMask(x, z) > 0.1) continue; out.push({ x, y: gy(x, z) - 0.05, z, ry: rnd() * 6.28, s: 0.7 + rnd() * 0.6 }); } return out; };
  const k = Q.lights > 8 ? 1 : 0.5;
  await instanceVariants('fern_02', scatter(Math.round(90 * k), 6), O, { shadow: false, wind: { amp: 0.04, freq: 1.4, flutter: 0.01 }, tile: 25, cullDist: 55 }).catch(() => {});
  await instance('shrub_03', scatter(Math.round(40 * k)), O, { shadow: false, wind: { amp: 0.04, freq: 1.3, flutter: 0.01 }, tile: 30, cullDist: 80 }).catch(() => {});
  await instance('dead_tree_trunk', scatter(10, 8).map(t => ({ ...t, s: 1 + rnd() * 0.5 })), O, { tile: 40, cullDist: 140 }).catch(() => {});
  await instance('tree_stump_01', scatter(14, 6), O, { tile: 40, cullDist: 90 }).catch(() => {});
  await instance('root_cluster_01', scatter(Math.round(10 * k), 8), O, { tile: 40, cullDist: 80 }).catch(() => {});
  await instanceVariants('rock_moss_set_01', scatter(Math.round(18 * k), 6), O, { tile: 40, cullDist: 100 }).catch(() => {});
  await instance('dry_branches_medium_01', scatter(Math.round(24 * k), 3), O, { shadow: false, tile: 30, cullDist: 60 }).catch(() => {});
  O.add(grassField({ count: Math.round(Q.grass * 0.35), area: [FOREST.x - FOREST.r, FOREST.x + FOREST.r, FOREST.z - FOREST.r, FOREST.z + FOREST.r], height: gy, colors: [0x4a5a32, 0x56603a, 0x3e4a2c, 0x6a6a40],
    allow: (x, z) => forestMask(x, z) * 0.6 * (1 - trailMask(x, z)), tall: () => 1.4, cullDist: 40 }));

  // ---------- portal da trilha e placa do acampamento ----------
  const [ex, ez] = FOREST.trail, ang = Math.atan2(CAMP.x - ex, CAMP.z - ez);
  const Mg = mtx(ex, gy(ex, ez), ez, ang);
  [-2.2, 2.2].forEach(o => { const g = new THREE.CylinderGeometry(0.16, 0.2, 4.2, 8); g.translate(o, 2.1, 0); g.applyMatrix4(Mg); boxUV(g); B.add(m.wood, g, 0x6a5440); });
  { const g = new THREE.BoxGeometry(5.2, 0.9, 0.12); g.translate(0, 3.7, 0); g.applyMatrix4(Mg); boxUV(g); D.add(m.wood, g, 0x5a4634); }
  { const s = sign('CAMP HARLOW · EST. 1952', 4.8, 0.7, { bg: '#d8c8a0', fg: '#3a2a18', border: '#3a2a18', font: 'Georgia, serif' }); s.position.copy(new THREE.Vector3(0, 3.7, 0.07).applyMatrix4(Mg)); s.rotation.y = ang; O.add(s);
    const s2 = sign('CLOSED BY ORDER OF THE COUNTY · 1987', 3.6, 0.45, { bg: '#e8e0cc', fg: '#8a1a14', border: '#8a1a14' }); s2.position.copy(new THREE.Vector3(1.2, 1.4, 0.24).applyMatrix4(Mg)); s2.rotation.y = ang + 0.12; s2.rotation.z = 0.08; O.add(s2); }
  // cartaz de desaparecido pregado numa árvore na entrada
  plane(tex(256, 340, g => { g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#1a1a1a'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('MISSING', 128, 44);
    g.fillStyle = '#5a5a5a'; g.fillRect(58, 60, 140, 160); g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(128, 130, 40, 50, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.font = 'bold 24px Arial'; g.fillText('DANNY BOONE', 128, 252); g.font = '17px Arial'; g.fillText('Age 11 · Nov 9', 128, 278); g.fillText('Bike found on this trail', 128, 302); g.fillText('Call 555-0119', 128, 326);
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(80,60,30,${Math.random() * 0.12})`; g.fillRect(Math.random() * 256, Math.random() * 340, 4, 4); } }),
    0.42, 0.56, ex - 3.4, gy(ex - 3.4, ez) + 1.6, ez + 0.5, ang + 0.3, 'Cartaz: Danny Boone (entrada da trilha)');
  // bicicleta do Danny caída na trilha
  { const bx = ex + (CAMP.x - ex) * 0.3 + 1.5, bz = ez + (CAMP.z - ez) * 0.3, by = gy(bx, bz), M2 = mtx(bx, by + 0.05, bz, ang + 1.2, 1, 1, 1, Math.PI / 2 - 0.1, 0);
    [-0.5, 0.5].forEach(o => { const w = new THREE.TorusGeometry(0.33, 0.025, 6, 20); w.translate(o, 0, 0); w.applyMatrix4(M2); D.add(m.iron, w, 0x1a1a1a); });
    [[0, 0.1, 0, 1.0, 0.04, 0.04, 0.4], [0.2, 0.25, 0, 0.6, 0.04, 0.04, -0.6], [-0.3, 0.3, 0, 0.04, 0.4, 0.04, 0]].forEach(([x, y, z, w, h, d, rz]) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateZ(rz); g.translate(x, y, z); g.applyMatrix4(M2); D.add(m.paint, g, 0xb02a2a); });
    docs.push({ o: plane(tex(256, 160, g => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#1a1a1a'; g.font = 'bold 22px "Courier New"'; g.fillText('EVIDENCE TAG', 16, 34); g.font = '18px "Courier New"'; ['#26-1109-A', 'Bicycle, red, boy\'s', 'Owner: D. Boone (11)', 'DO NOT MOVE — Sheriff'].forEach((l, i) => g.fillText(l, 16, 66 + i * 24)); }), 0.2, 0.12, bx + 0.3, by + 0.45, bz, ang + 0.6), n: 'Etiqueta na bicicleta do Danny' }); }

  // ---------- acampamento ----------
  const { x: cx, z: cz } = CAMP, cy = gy(cx, cz);
  // fogueira: anel de pedras, toras e cinzas
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, g = new THREE.IcosahedronGeometry(0.22, 0); g.scale(1, 0.7, 1); g.translate(cx + Math.cos(a) * 1.1, cy + 0.1, cz + Math.sin(a) * 1.1); D.add(m.plain, g, 0x6a6660); }
  { const g = new THREE.CircleGeometry(0.95, 16); g.rotateX(-Math.PI / 2); g.translate(cx, cy + 0.05, cz); D.add(m.plain, g, 0x1e1a18); }
  [[2.6, 0.3, 1.0], [-2.4, 1.2, 0.6], [0.4, 2.7, 2.2]].forEach(([ox, oz, r]) => { const g = new THREE.CylinderGeometry(0.22, 0.25, 2.2, 8); g.rotateZ(Math.PI / 2); g.rotateY(r); g.translate(cx + ox, cy + 0.22, cz + oz); boxUV(g); D.add(m.wood, g, 0x6a5038); });
  // cabanas (com interior na primeira)
  const cabins: [number, number, number][] = [[-10, -6, 0.5], [9, -9, -0.6], [-2, -15, 0]];
  cabins.forEach(([ox, oz, ry], i) => {
    const x = cx + ox, z = cz + oz, y = gy(x, z), w = 5, d = 4, Mc = mtx(x, y, z, ry);
    // a cabana é feita em coordenadas locais (frente para +z) e girada
    const Lb = new Batch(), Ld = new Batch(), Lr = new Batch();
    shell(Lb, m.rawSiding, 0x8a7a68, -w / 2, -d / 2, w / 2, d / 2, 2.6, 0.18, [{ side: 'S', at: 0.6, w: 0.9, h: 2.0 }, { side: 'E', at: 0, w: 0.8, h: 0.7, sill: 1.1 }, { side: 'W', at: 0, w: 0.8, h: 0.7, sill: 1.1 }], { sides: ['E', 'W'], rise: 1.3 });
    gableRoof(Lr, m.tin, 0x6a5a4a, -w / 2, -d / 2, w / 2, d / 2, 2.6, 1.3, 'x', 0.4);
    Ld.box(m.wood, w - 0.4, 0.06, d - 0.4, 0, 0.03, 0, 0x6a5a48);
    Ld.box(m.wood, 0.9, 0.5, 1.9, -w / 2 + 0.7, 0.4, -0.6, 0x5a4a38); Ld.box(m.plain, 0.85, 0.12, 1.85, -w / 2 + 0.7, 0.71, -0.6, 0x8a8478);
    Ld.box(m.wood, 0.9, 0.5, 1.9, w / 2 - 0.7, 0.4, -0.6, 0x5a4a38); Ld.box(m.wood, 0.9, 0.05, 1.9, w / 2 - 0.7, 1.5, -0.6, 0x5a4a38);
    Ld.box(m.wood, 0.8, 0.75, 0.6, 0, 0.38, -1.4, 0x6a5440);
    for (const [src, dst, mats] of [[Lb, B, 0], [Ld, D, 0], [Lr, R, 0]] as const) { void mats; src.parts.forEach((gs, mat) => gs.forEach(g => { g.applyMatrix4(Mc); boxUV(g); dst.add(mat, g); })); }
    const wl = (a: number[], b2: number[]) => { const pa = new THREE.Vector3(a[0], 0, a[1]).applyMatrix4(Mc), pb = new THREE.Vector3(b2[0], 0, b2[1]).applyMatrix4(Mc); return [[+pa.x.toFixed(2), +pa.z.toFixed(2)], [+pb.x.toFixed(2), +pb.z.toFixed(2)]] as [number, number][]; };
    vttWalls.push([...wl([0.15, d / 2], [-w / 2, d / 2]), ...wl([-w / 2, -d / 2], [w / 2, -d / 2]), ...wl([w / 2, d / 2], [1.05, d / 2])]);
    const pd = new THREE.Vector3(0.6, 0, d / 2).applyMatrix4(Mc); portals.push({ p: [pd.x, pd.z], a: [pd.x - 0.45, pd.z], b: [pd.x + 0.45, pd.z] });
    // placas das cabanas e documentos
    const nomes = ['CABIN 1 · BLUEJAYS', 'CABIN 2 · COYOTES', 'CABIN 3 · OWLS'];
    const sg = sign(nomes[i], 1.6, 0.3, { bg: '#c8b890', fg: '#2a2010' }); sg.position.copy(new THREE.Vector3(-1.2, 2.3, d / 2 + 0.11).applyMatrix4(Mc)); sg.rotation.y = ry; O.add(sg);
    if (i === 0) {
      const pDiary = new THREE.Vector3(0, 0.79, -1.4).applyMatrix4(Mc);
      const dm = plane(tex(512, 680, g => { g.fillStyle = '#e8e2c8'; g.fillRect(0, 0, 512, 680); g.strokeStyle = '#a8b8d0'; for (let y = 80; y < 680; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
        g.fillStyle = '#2a2a5a'; g.font = '22px "Comic Sans MS", cursive'; ['Oct. 30, 1986', '', 'The little ones keep saying a girl', 'in a white dress calls them from', 'the trees after lights-out. She', 'knows their names. Even the new', 'kids. Even the ones she never met.', '', 'Tonight Lucy said the girl told her', '"it doesn\'t hurt, it\'s only cold."', '', 'Mr. Pruitt came by again with', 'candles. I don\'t like him here.', '', '— Counselor M. Ruiz'].forEach((l, j) => g.fillText(l, 30, 70 + j * 32)); }),
        0.24, 0.32, pDiary.x, pDiary.y + 0.005, pDiary.z, 0, 'Diário da monitora (1986)');
      dm.rotation.set(-Math.PI / 2, 0, ry + 0.2);
      const pn = new THREE.Vector3(1.4, 1.5, d / 2 + 0.11).applyMatrix4(Mc);
      plane(tex(256, 200, g => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 256, 200); g.fillStyle = '#2a3a8a'; g.font = '30px "Comic Sans MS", cursive'; g.textAlign = 'center'; g.fillText('TOMMY', 128, 60); g.fillText('COME HOME', 128, 105); g.font = '22px "Comic Sans MS", cursive'; g.fillText('we love you', 128, 145); g.fillText('— Mom', 128, 180); }), 0.36, 0.28, pn.x, pn.y, pn.z, ry, 'Bilhete "Tommy, volte para casa"');
      light(pn.x, cy + 1.8, pn.z + 0.8, 2.5, 5, 0xffa860, { flick: 1, vtt: 4 });
    }
  });
  // lampião aceso na varanda da cabana 1 (alguém esteve aqui)
  later(instance('Lantern_01', [{ x: cx - 9.4, y: gy(cx - 9.4, cz - 3.4), z: cz - 3.4, ry: 0 }], O)); halo(cx - 9.4, cy + 0.45, cz - 3.4, 0.6);
  // torre de vigia
  { const tx = cx + 16, tz = cz + 4, ty = gy(tx, tz), H = 6;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const g = new THREE.BoxGeometry(0.18, H, 0.18); g.translate(tx + a * 1.1, ty + H / 2, tz + b * 1.1); boxUV(g); B.add(m.wood, g, 0x5a4a38); });
    F.box(m.wood, 2.8, 0.12, 2.8, tx, ty + H, tz, 0x6a5440); for (let i = 0; i < 4; i++) D.box(m.wood, 2.8, 0.08, 0.08, tx, ty + H + 0.9, tz + (i < 2 ? 1 : -1) * (i % 2 ? 1.36 : 1.36), 0x5a4a38);
    [[0, 1.36, 0], [0, -1.36, 0], [1.36, 0, 1], [-1.36, 0, 1]].forEach(([a, b, rot]) => D.box(m.wood, rot ? 0.08 : 2.8, 0.08, rot ? 2.8 : 0.08, tx + a, ty + H + 0.9, tz + b, 0x5a4a38));
    gableRoof(R, m.tin, 0x5a4a3a, tx - 1.5, tz - 1.5, tx + 1.5, tz + 1.5, ty + H + 2.1, 0.8, 'x', 0.2);
    [-1.2, 1.2].forEach(o => D.box(m.wood, 0.06, 2.2, 0.06, tx + o, ty + H + 1.1, tz + 1.4, 0x5a4a38));
    for (let y = 0.4; y < H; y += 0.35) D.box(m.wood, 0.6, 0.05, 0.06, tx, ty + y, tz + 1.3, 0x6a5440); }
  // balanço (uma corrente quebrada) e mastro com bandeira rasgada
  { const sx = cx - 12, sz = cz + 6, sy = gy(sx, sz);
    [-1.5, 1.5].forEach(o => [-0.6, 0.6].forEach(d2 => { const g = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6); g.applyMatrix4(mtx(sx + o, sy + 1.25, sz + d2, 0, 1, 1, 1, d2 > 0 ? -0.25 : 0.25)); D.add(m.iron, g, 0x5a5a5a); }));
    D.box(m.iron, 3.2, 0.06, 0.06, sx, sy + 2.5, sz, 0x5a5a5a);
    [[-0.6, 2.0], [0.6, 1.2]].forEach(([o, len], i) => { D.box(m.iron, 0.02, len, 0.02, sx + o - 0.2, sy + 2.5 - len / 2, sz, 0x3a3a3a); D.box(m.iron, 0.02, i ? len : 2.0, 0.02, sx + o + 0.2, sy + 2.5 - (i ? len : 2.0) / 2, sz, 0x3a3a3a); });
    D.box(m.wood, 0.6, 0.04, 0.22, sx - 0.6, sy + 0.5, sz, 0x6a5440); }
  { const fx = cx + 4, fz = cz + 8, fy = gy(fx, fz); D.box(m.iron, 0.08, 7, 0.08, fx, fy + 3.5, fz, 0xb0b0b0);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7, 6, 3), new THREE.MeshStandardMaterial({ color: 0x6a3a30, side: THREE.DoubleSide, roughness: 0.9 })); fl.geometry.translate(0.6, 0, 0);
    const pa = fl.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 4) * 0.08); fl.position.set(fx, fy + 6.5, fz); O.add(fl); }

  // ---------- árvore dos sapatos (o sigilo entalhado, fitas, sapatinhos em círculo, fita de isolamento) ----------
  { const tx = cx + CAMP.shoes[0], tz = cz + CAMP.shoes[1], ty = gy(tx, tz);
    // árvore seca em pé (tronco grosso, galhos quebrados)
    { const tg = new THREE.CylinderGeometry(0.32, 0.55, 6.5, 9, 4); const pp = tg.attributes.position; for (let k2 = 0; k2 < pp.count; k2++) { const yy = pp.getY(k2); pp.setX(k2, pp.getX(k2) + Math.sin(yy * 0.9) * 0.12); pp.setZ(k2, pp.getZ(k2) + Math.cos(yy * 0.7) * 0.1); }
      tg.computeVertexNormals(); tg.translate(tx, ty + 3.2, tz); boxUV(tg); B.add(m.wood, tg, 0x6a5a4c);
      [[2.6, 0.6, 1.1, 0.9], [3.6, 2.4, 0.8, -0.8], [4.6, 4.1, 1.3, 0.6], [5.4, 1.3, 0.9, -1.1]].forEach(([y2, ang2, len, tilt]) => { const g2 = new THREE.CylinderGeometry(0.05, 0.14, len * 1.6, 6); g2.translate(0, len * 0.8, 0); g2.rotateZ(tilt); g2.rotateY(ang2); g2.translate(tx, ty + y2, tz); boxUV(g2); D.add(m.wood, g2, 0x5a4a3e); }); }
    const vc = FOREST.cams[2], dirx = vc[0] - tx, dirz = vc[1] - tz, dl = Math.hypot(dirx, dirz), ryS = Math.atan2(dirx, dirz);
    plane(tex(512, 512, g => { g.clearRect(0, 0, 512, 512); g.strokeStyle = 'rgba(210,190,150,0.9)'; g.lineWidth = 12; g.lineCap = 'round';
      g.beginPath(); g.arc(256, 256, 170, 0, 7); g.stroke(); g.beginPath(); g.arc(256, 256, 72, 0, 7); g.stroke();
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 72, 256 + Math.sin(a) * 72); g.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.stroke(); }
      g.beginPath(); g.moveTo(214, 282); g.lineTo(256, 208); g.lineTo(298, 282); g.closePath(); g.stroke(); }),
      0.62, 0.62, tx + dirx / dl * 0.52, ty + 1.6, tz + dirz / dl * 0.52, ryS, 'Sigilo entalhado na árvore', { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const shoes: THREE.Matrix4[] = [], cols = [0xd02a4a, 0x2a6ad0, 0xe0e0e0, 0x2a2a2a, 0xe8b020, 0x6a3a8a];
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 2.2; shoes.push(mtx(tx + Math.cos(a) * r, ty + 0.05, tz + Math.sin(a) * r, -a + Math.PI / 2 + (rnd() - 0.5) * 0.4)); }
    shoes.forEach((mm, i) => { const g = new THREE.BoxGeometry(0.1, 0.07, 0.22); g.translate(0, 0.035, 0); g.applyMatrix4(mm); D.add(m.paint, g, cols[i % cols.length]); });
    const rib: number[] = []; for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, h = ty + 2 + rnd() * 2, x = tx + Math.cos(a) * 0.7, z = tz + Math.sin(a) * 0.7; rib.push(x, h, z, x + Math.cos(a) * 0.1, h - 0.6, z + Math.sin(a) * 0.1); }
    const rl = new THREE.BufferGeometry(); rl.setAttribute('position', new THREE.Float32BufferAttribute(rib, 3)); O.add(Object.assign(new THREE.LineSegments(rl, new THREE.LineBasicMaterial({ color: 0xc02030 })), { userData: { noExport: 1 } }));
    const tape: number[] = [], posts = [[-5, -4], [5, -5], [6, 4], [-4, 6], [-5, -4]];
    posts.forEach(([a, b2], i) => { const x = tx + a, z = tz + b2; D.box(m.wood, 0.06, 1.1, 0.06, x, gy(x, z) + 0.55, z, 0x8a7a68); if (i) { const [pa, pb] = posts[i - 1]; tape.push(tx + pa, gy(tx + pa, tz + pb) + 0.95, tz + pb, x, gy(x, z) + 0.95, z); } });
    const tl = new THREE.BufferGeometry(); tl.setAttribute('position', new THREE.Float32BufferAttribute(tape, 3)); O.add(Object.assign(new THREE.LineSegments(tl, new THREE.LineBasicMaterial({ color: 0xe8c020 })), { userData: { noExport: 1 } }));
    // lanterna do Tommy, ainda acesa, caída no chão
    const lx = tx - 1.2, lz = tz + 0.8, ly = gy(lx, lz);
    const lg = new THREE.CylinderGeometry(0.035, 0.045, 0.24, 10); lg.rotateZ(Math.PI / 2); lg.translate(lx, ly + 0.05, lz); D.add(m.paint, lg, 0x2a4a8a);
    const lens = new THREE.MeshBasicMaterial({ color: 0xfff2d0, toneMapped: false }); const le = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), lens); le.position.set(lx + 0.125, ly + 0.05, lz); le.rotation.y = Math.PI / 2; O.add(le); lamps.push(lens);
    light(lx + 0.6, ly + 0.15, lz, 2.5, 7, 0xe8f0ff, { flick: 3, vtt: 3 }); halo(lx + 0.15, ly + 0.06, lz, 0.25);
  }

  // ---------- montar ----------
  const solids = B.build(O);
  D.build(O, { shadow: Q.lights > 8 });
  const floors = F.build(O, { shadow: false });
  R.build(roofs);
  await Promise.all(P);
  return { solids, floors, roofs, docs, vttWalls, portals, lamps };
}
