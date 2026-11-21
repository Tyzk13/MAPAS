// Valkaria — materiais próprios: mármore claro (paredes nobres, muralha, palácio, catedral) e a pedra lisa da deusa.
import * as THREE from 'three';
import { pbr } from '../../core/pbr';

let _m: { marmore: THREE.Material; deusa: THREE.Material; ouro: THREE.Material } | null = null;
export function matsV() {
  if (_m) return _m;
  const vc = (m: THREE.Material) => { const c = (m as THREE.MeshStandardMaterial).clone(); c.vertexColors = true; return c; };
  _m = {
    marmore: vc(pbr('painted_plaster_wall', { size: 4 })),
    deusa: vc(pbr('concrete_wall_008', { size: 6 })),
    ouro: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.85, roughness: 0.32 }),
  };
  return _m;
}
