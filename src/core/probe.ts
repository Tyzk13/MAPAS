// Sonda de ambiente local: captura um cubemap da cena num ponto (com as luzes do momento) e usa como
// envMap (reflexo + luz difusa rebatida) nos materiais das malhas que estão dentro de uma caixa.
// Dá a um interior a sua própria "luz ambiente" em vez da do céu de fora. Recapturar ao mudar o clima.
import * as THREE from 'three';
import { R, S } from './engine';

export class EnvProbe {
  private cubeRT = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  private cam: THREE.CubeCamera;
  private pmrem = new THREE.PMREMGenerator(R);
  private envRT: THREE.WebGLRenderTarget | null = null;
  private mats: THREE.MeshStandardMaterial[] = [];

  constructor(public pos: THREE.Vector3, public box: THREE.Box3, private intensity = 1) {
    this.cam = new THREE.CubeCamera(0.1, 80, this.cubeRT);
    this.cam.position.copy(pos);
  }

  /** Troca os materiais das malhas dentro da caixa por cópias que usam a sonda. */
  bind(root: THREE.Object3D, skip: (o: THREE.Object3D) => boolean = () => false) {
    const clones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    const c = new THREE.Vector3(), bb = new THREE.Box3();
    root.updateMatrixWorld(true);
    root.traverse((o: any) => {
      if (!o.isMesh || skip(o)) return;
      bb.setFromObject(o); bb.getCenter(c);
      if (!this.box.containsPoint(c)) return;
      const swap = (m: THREE.Material) => {
        if (!(m as any).isMeshStandardMaterial) return m;
        let k = clones.get(m);
        if (!k) { k = (m as THREE.MeshStandardMaterial).clone(); k.envMapIntensity = this.intensity; clones.set(m, k); this.mats.push(k); }
        return k;
      };
      o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    });
    return this.mats.length;
  }

  /** Renderiza o cubemap agora (objetos em `hide` ficam fora da captura). */
  update(hide: THREE.Object3D[] = []) {
    const vis = hide.map(o => o.visible); hide.forEach(o => (o.visible = false));
    // (a captura enxerga a sonda anterior: cada atualização soma mais um rebote de luz)
    const tm = R.toneMapping; R.toneMapping = THREE.NoToneMapping;
    this.cam.update(R, S);
    R.toneMapping = tm;
    hide.forEach((o, i) => (o.visible = vis[i]));
    const old = this.envRT;
    this.envRT = this.pmrem.fromCubemap(this.cubeRT.texture);
    this.mats.forEach(m => { if (!m.envMap) m.needsUpdate = true; m.envMap = this.envRT!.texture; });
    old?.dispose();
  }
}
