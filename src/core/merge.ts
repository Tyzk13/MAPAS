// Junta malhas estáticas que usam o mesmo material numa só (menos chamadas de desenho, inclusive na sombra).
// As malhas originais saem da cena mas continuam válidas para colisão/raycast (matrixWorld preservada).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const OK_ATTR = new Set(['position', 'normal', 'uv']);

export interface MergeOpts {
  /** não mexe nestes objetos nem nos filhos (ex.: animados) */
  skip?: (o: THREE.Object3D) => boolean;
  /** separa em grupos distintos (ex.: 'alto'/'baixo' para a exportação VTT esconder o que fica acima do térreo) */
  bucket?: (o: THREE.Mesh, worldBox: THREE.Box3) => string;
}

/** Junta as malhas de `root` (em qualquer profundidade) e adiciona as juntadas diretamente em `root`. */
export function mergeStatic(root: THREE.Object3D, o: MergeOpts = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[]; cast: boolean; recv: boolean; bucket: string }>();
  const box = new THREE.Box3();
  const visit = (obj: THREE.Object3D) => {
    if (o.skip?.(obj) || !obj.visible) return;
    const m = obj as THREE.Mesh;
    if (m.isMesh && !(m as any).isInstancedMesh && !(m as any).isSkinnedMesh && !Array.isArray(m.material) && m.material.visible !== false
      && Object.keys(m.geometry.attributes).every(k => OK_ATTR.has(k)) && m.geometry.attributes.normal && m.geometry.attributes.uv
      && !m.userData.noMerge && !m.morphTargetInfluences
      // geometria comprimida (Meshopt: inteiros normalizados) não pode ser transformada direto — fica de fora
      && Object.values(m.geometry.attributes).every((at: any) => !at.normalized && at.array instanceof Float32Array && !at.isInterleavedBufferAttribute)) {
      box.setFromObject(m);
      const bucket = o.bucket ? o.bucket(m, box) : '';
      const key = m.material.uuid + '|' + m.castShadow + '|' + m.receiveShadow + '|' + bucket + '|' + (m.geometry.index ? 'i' : 'n') + '|' + m.renderOrder;
      if (!groups.has(key)) groups.set(key, { mat: m.material, geos: [], meshes: [], cast: m.castShadow, recv: m.receiveShadow, bucket });
      const g = m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const grp = groups.get(key)!; grp.geos.push(g); grp.meshes.push(m);
    }
    obj.children.slice().forEach(visit);
  };
  root.children.slice().forEach(visit);
  let before = 0, after = 0;
  groups.forEach(g => {
    if (g.meshes.length < 2) return;
    const geo = mergeGeometries(g.geos, false);
    if (!geo) return;
    const mm = new THREE.Mesh(geo, g.mat);
    mm.castShadow = g.cast; mm.receiveShadow = g.recv; mm.userData.merged = g.bucket || true;
    root.add(mm);
    g.meshes.forEach(m => m.removeFromParent()); // continua usável para colisão (matrixWorld já calculada)
    before += g.meshes.length; after++;
  });
  return { before, after };
}
