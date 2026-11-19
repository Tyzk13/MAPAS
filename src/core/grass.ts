// Gramado procedural instanciado: touceiras de lâminas curvas (cor da raiz à ponta, variação por touceira)
// com vento na GPU. Densidade controlada pela qualidade.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addWind } from './anim';

/** Uma touceira: `n` lâminas curvas em volta da origem (base em y=0). */
function clumpGeometry(n = 9, seed = 1, segs = 3) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const h = 0.12 + r() * 0.16, w = (0.026 + r() * 0.016) * (segs < 3 ? 1.5 : 1), seg = segs;
    const g = new THREE.PlaneGeometry(w, h, 1, seg); g.translate(0, h / 2, 0);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    const bend = 0.06 + r() * 0.14;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k), t = y / h;
      p.setX(k, p.getX(k) * (1 - t * 0.85));      // afina na ponta
      p.setZ(k, bend * t * t);                      // curva para fora
      const c = 0.42 + t * 0.4;                      // escuro na raiz, mais claro na ponta
      col[k * 3] = c; col[k * 3 + 1] = c; col[k * 3 + 2] = c;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.rotateY(r() * Math.PI * 2);
    g.translate((r() - 0.5) * 0.16, 0, (r() - 0.5) * 0.16);
    g.deleteAttribute('uv');
    blades.push(g);
  }
  const m = mergeGeometries(blades)!;
  m.computeVertexNormals();
  // normais "para cima" iluminam a grama como volume (evita lâminas pretas de costas para a luz)
  const nn = m.attributes.normal; for (let k = 0; k < nn.count; k++) { nn.setXYZ(k, nn.getX(k) * 0.5, 0.7, nn.getZ(k) * 0.5); }
  return m;
}

export interface GrassOpts {
  count: number;
  area: [number, number, number, number]; // xmin, xmax, zmin, zmax
  allow: (x: number, z: number) => number;  // 0..1 (densidade local)
  height: (x: number, z: number) => number;
  colors?: number[];
  /** escala vertical por posição (ex.: capim mais alto longe do gramado aparado) */
  tall?: (x: number, z: number) => number;
  /** distância (m) a partir da qual os blocos somem (a névoa já esconde) */
  cullDist?: number;
}

export function grassField(o: GrassOpts) {
  const geo = clumpGeometry(9, 3), geoFar = clumpGeometry(5, 3, 1); // perto: 54 tri; longe: 10 tri
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85, envMapIntensity: 0.6 });
  addWind(mat, { amp: 0.05, freq: 1.9, flutter: 0.008, height: 0.3 }, true);
  // instâncias separadas em blocos de TILE m: cada bloco é cortado se estiver fora da tela ou longe (névoa)
  const TILE = 10, tiles = new Map<string, { m: THREE.Matrix4[]; c: THREE.Color[] }>();
  const cols = (o.colors || [0x4b5a30, 0x56663a, 0x445530, 0x5d6640, 0x4a5636]).map(c => new THREE.Color(c));
  const d = new THREE.Object3D(), c = new THREE.Color();
  let s = 77; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let n = 0;
  for (let tries = 0; tries < o.count * 6 && n < o.count; tries++) {
    const x = o.area[0] + r() * (o.area[1] - o.area[0]), z = o.area[2] + r() * (o.area[3] - o.area[2]);
    if (r() > o.allow(x, z)) continue;
    d.position.set(x, o.height(x, z), z); d.rotation.set(0, r() * 6.28, 0);
    const k = 0.75 + r() * 0.6, ty = o.tall ? o.tall(x, z) : 1; d.scale.set(k, k * (0.8 + r() * 0.5) * ty, k); d.updateMatrix();
    const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE);
    if (!tiles.has(key)) tiles.set(key, { m: [], c: [] });
    const t = tiles.get(key)!; t.m.push(d.matrix.clone()); t.c.push(c.copy(cols[(r() * cols.length) | 0]).multiplyScalar(0.85 + r() * 0.3).clone());
    n++;
  }
  const group = new THREE.Group(); group.userData.ns = 1;
  tiles.forEach(t => {
    const im = new THREE.InstancedMesh(geo, mat, t.m.length);
    t.m.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, t.c[i]); });
    im.castShadow = false; im.receiveShadow = true; im.userData.ns = 1;
    im.computeBoundingSphere(); im.userData.cullDist = o.cullDist ?? 38;
    im.userData.lod = { near: geo, far: geoFar, d: 18 };
    group.add(im);
  });
  return group;
}
