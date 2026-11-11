// Modelos .glb de src/assets/models (Meshopt + WebP): carregar com cache e espalhar com instancing.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addWind, windDepth, type WindOpts } from './anim';
import { fetchBinary } from './binario';

const FILES = import.meta.glob('@assets/models/*.glb', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const fileFor = (id: string) => Object.entries(FILES).find(([k]) => k.endsWith(`/models/${id}.glb`))?.[1];
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache: Record<string, Promise<THREE.Group>> = {};

export const hasModel = (id: string) => !!fileFor(id);

/** Vidros de luminárias (acendem à noite). O clima ajusta `emissiveIntensity` (sky.ts). */
export const litGlass: THREE.MeshStandardMaterial[] = [];
const LIT = /street_lamp|lantern|chandelier/i;

/** Ajusta materiais vindos do glTF: folhagem com recorte alfa (sem ordenação), vidro transparente, chamas e vidros acesos. */
function fixMaterials(root: THREE.Object3D, id: string) {
  const seen = new Set<THREE.Material>();
  root.traverse((o: any) => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m: THREE.MeshStandardMaterial) => {
      const n = (m.name || '').toLowerCase();
      if (/glass|vidro/.test(n)) {
        o.castShadow = false;
        if (seen.has(m)) return; seen.add(m);
        m.transparent = true; m.depthWrite = false; m.roughness = Math.min(m.roughness, 0.15); m.envMapIntensity = 1.2;
        if (LIT.test(id)) { m.emissive.set(0xffb468); m.emissiveIntensity = 1.4; m.opacity = Math.max(m.opacity, 0.55); m.userData.litBase = 1.4; litGlass.push(m); }
        return;
      }
      if (/flame|chama/.test(n)) { o.castShadow = false; m.emissiveIntensity = 2.5; m.toneMapped = true; return; }
      if (/(_lamp$|bulb)/.test(n) && LIT.test(id)) { if (!seen.has(m)) { seen.add(m); m.emissive.set(0xffc27a); m.emissiveIntensity = 2.2; m.userData.litBase = 2.2; litGlass.push(m); } return; }
      if (m.transparent || m.alphaTest > 0) {
        m.transparent = false; m.depthWrite = true; m.alphaTest = 0.45; m.side = THREE.DoubleSide;
        m.alphaToCoverage = true;
        o.userData.foliage = true;
      }
      m.envMapIntensity = 0.8;
    });
  });
}

/** Carrega (uma vez) e devolve o grupo original — não adicionar à cena; use clone() ou instance(). */
export function model(id: string): Promise<THREE.Group> {
  return (cache[id] ||= (async () => {
    const url = fileFor(id);
    if (!url) throw new Error('Modelo não encontrado: ' + id);
    const buf = await fetchBinary(url);
    const g: any = await new Promise((ok, no) => loader.parse(buf, '', ok, no));
    const root = g.scene;
    root.updateMatrixWorld(true);
    fixMaterials(root, id);
    return root;
  })());
}

/** Cópia independente (compartilha geometria/material). */
export async function place(id: string, x: number, y: number, z: number, ry = 0, s = 1, parent?: THREE.Object3D) {
  const o = (await model(id)).clone(true);
  o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s);
  parent?.add(o);
  return o;
}

export interface Xf { x: number; y: number; z: number; ry?: number; s?: number; sy?: number; tilt?: number }

/**
 * Espalha um modelo com InstancedMesh (um por material). `variant` escolhe só um nó-raiz do glb
 * (ex.: fir_tree_01 tem 3 árvores); undefined = modelo inteiro.
 */
export async function instance(id: string, list: Xf[], parent: THREE.Object3D, opt: { variant?: number; shadow?: boolean; wind?: Omit<WindOpts, 'height'> } = {}) {
  if (!list.length) return [];
  const root = await model(id);
  const src = opt.variant == null ? root : root.children[opt.variant % root.children.length];
  // junta todas as malhas do (sub)modelo por material, em coordenadas do modelo
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
  src.updateMatrixWorld(true);
  src.traverse((o: any) => {
    if (!o.isMesh) return;
    const g = dequantize(o.geometry);
    const m = new THREE.Matrix4().multiplyMatrices(opt.variant == null ? new THREE.Matrix4() : inv, o.matrixWorld);
    g.applyMatrix4(m);
    // mantém só atributos comuns para poder juntar
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'tangent'].includes(k)) g.deleteAttribute(k);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material)!.push(g);
  });
  // a variante pode estar deslocada: recentra pela base
  let off = new THREE.Vector3();
  if (opt.variant != null) {
    const bb = new THREE.Box3(); byMat.forEach(gs => gs.forEach(g => { g.computeBoundingBox(); bb.union(g.boundingBox!); }));
    off.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  }
  // altura do (sub)modelo, para o vento dobrar mais no topo
  let topY = 0.1; byMat.forEach(gs => gs.forEach(g => { g.computeBoundingBox(); topY = Math.max(topY, g.boundingBox!.max.y + off.y); }));
  const o3 = new THREE.Object3D(), out: THREE.InstancedMesh[] = [];
  byMat.forEach((gs, mat) => {
    gs.forEach(g => { if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]); });
    const geo = gs.length > 1 ? mergeGeometries(gs, false) : gs[0];
    if (!geo) return;
    if (off.lengthSq()) geo.translate(off.x, off.y, off.z);
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => {
      o3.position.set(t.x, t.y, t.z); o3.rotation.set(t.tilt || 0, t.ry || 0, 0, 'YXZ');
      const s = t.s ?? 1; o3.scale.set(s, t.sy ?? s, s); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
    });
    im.castShadow = opt.shadow ?? true; im.receiveShadow = true;
    if (opt.wind && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
      const w = { ...opt.wind, height: topY }, fol = mat.alphaTest > 0;
      addWind(mat, w, fol);
      if (im.castShadow) im.customDepthMaterial = windDepth(mat as THREE.MeshStandardMaterial, w, fol);
    }
    im.computeBoundingSphere();
    parent.add(im); out.push(im);
  });
  return out;
}

/** Converte atributos quantizados (Meshopt: int8/int16 normalizados) para float, para poder transformar e juntar. */
function dequantize(src: THREE.BufferGeometry) {
  const g = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(src.attributes) as [string, THREE.BufferAttribute][]) {
    if (!['position', 'normal', 'uv', 'tangent'].includes(k)) continue;
    const n = a.count, s = a.itemSize, out = new Float32Array(n * s);
    for (let i = 0; i < n; i++) for (let c = 0; c < s; c++) out[i * s + c] = a.getComponent(i, c);
    g.setAttribute(k, new THREE.BufferAttribute(out, s));
  }
  if (src.index) g.setIndex(Array.from(src.index.array as ArrayLike<number>));
  return g;
}

/** Como instance(), mas sorteia entre as variantes (nós-raiz) do modelo — arbustos, pedras, mato. */
export async function instanceVariants(id: string, list: (Xf & { v?: number })[], parent: THREE.Object3D, opt: { shadow?: boolean; wind?: Omit<WindOpts, 'height'> } = {}) {
  const root = await model(id), n = Math.max(1, root.children.length);
  if (n === 1) return instance(id, list, parent, opt);
  const by: Xf[][] = Array.from({ length: n }, () => []);
  list.forEach((t, i) => by[(t.v ?? i) % n].push(t));
  const out: THREE.InstancedMesh[] = [];
  for (let v = 0; v < n; v++) if (by[v].length) out.push(...(await instance(id, by[v], parent, { ...opt, variant: v })));
  return out;
}

/** Caixa (em metros) de um modelo ou variante — útil para escalar a um tamanho alvo. */
export async function modelSize(id: string, variant?: number) {
  const root = await model(id);
  const src = variant == null ? root : root.children[variant % root.children.length];
  return new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
}
