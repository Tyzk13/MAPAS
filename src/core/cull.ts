// Corte por distância: objetos com userData.cullDist somem quando a câmera está mais longe que isso
// (medido até a borda da esfera envolvente). Complementa o corte por tela que o three já faz.
import * as THREE from 'three';

const v = new THREE.Vector3();
let list: THREE.Mesh[] = [];

/** Coleta os objetos com cullDist de um mapa recém-carregado. */
export function collectCull(root: THREE.Object3D) {
  list = [];
  root.traverse((o: any) => { if (o.userData.cullDist && o.geometry) list.push(o); });
}

export function updateCull(cam: THREE.Camera) {
  for (const o of list) {
    const s = (o as any).boundingSphere ?? o.geometry.boundingSphere;
    if (!s) continue;
    v.copy(s.center).applyMatrix4(o.matrixWorld);
    const d = cam.position.distanceTo(v) - s.radius;
    o.visible = d < o.userData.cullDist;
    const lod = o.userData.lod; // troca para a geometria simples quando longe
    if (lod && o.visible) { const g = d > lod.d ? lod.far : lod.near; if (o.geometry !== g) o.geometry = g; }
  }
}
