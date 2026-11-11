// Carregar/trocar mapas.
import * as THREE from 'three';
import { S, cam, ctl } from './engine';
import { st, $ } from './state';
import { setTime, setShadowRadius } from './sky';
import { placeT, selT } from './tokens';
import { fillAreas } from './vtt';
import { WM, startWalk } from './walk';
import { MAPS } from '../maps/manifest';
import { loading as loader } from './loading';
import type { MapRuntime } from './types';

function newRuntime(id: string): MapRuntime {
  return {
    id, G: new THREE.Group(), layers: [], views: [], loft: null, walk: [], lights: [], glass: [], halos: [], mist: [], lamps: [], puddle: null,
    spawn: i => ({ x: (i % 4) * 1.2 - 1.8, z: Math.floor(i / 4) * 1.5 }),
    solid: () => [], walkStart: { x: 0, z: 10 },
    vtt: { areas: [{ n: 'Mapa', b: [-20, 20, -20, 20], lv: 1 }], walls: [], portals: [], lights: [] },
    exportHide: () => [], tick: null, onTime: null, shadowRadius: 55,
  };
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((x: any) => {
    if (x.geometry) x.geometry.dispose();
    const ms = Array.isArray(x.material) ? x.material : x.material ? [x.material] : [];
    ms.forEach((m: any) => m.dispose && m.dispose());
  });
}

let loading: Promise<void> | null = null;
export const mapHooks: ((M: MapRuntime) => void)[] = [];

export async function loadMap(id: string) {
  if (loading) await loading;
  let done!: () => void; loading = new Promise(r => (done = r));
  try {
    if (!MAPS[id]) id = 'igreja';
    const old = st.MP;
    const M = newRuntime(id);
    await MAPS[id].build(M);
    if (old) { S.remove(old.G); disposeTree(old.G); }
    S.add(M.G); st.MP = M; st.curMap = id;
    setShadowRadius(M.shadowRadius);
    ctl.maxDistance = M.camMax ?? 95;
    $('bmap').textContent = 'Mapa: ' + MAPS[id].n;
    const L = $('lay'); L.innerHTML = '';
    M.layers.forEach(l => {
      const b = document.createElement('button'); let on = l.v;
      const u = () => { b.textContent = l.n + ': ' + (on ? 'on' : 'off'); l.o.visible = on; };
      b.onclick = () => { on = !on; u(); }; u(); L.appendChild(b);
    });
    $('bk').style.display = M.layers.length ? '' : 'none'; L.hidden = true;
    st.V = M.views; st.vi = 0; st.anim = null;
    const v = st.V[0];
    $('bv').textContent = 'Vista: ' + v.n;
    cam.fov = v.fov || 50; cam.updateProjectionMatrix();
    cam.position.set(...v.p); ctl.target.set(...v.t); ctl.update();
    setTime(st.pi);
    let i = 0; for (const k in st.T) placeT(st.T[k], i++);
    selT(null); fillAreas();
    if (WM.on) startWalk();
    mapHooks.forEach(f => f(M));
    // quando as texturas chegarem, reaplica o clima (recaptura sondas de ambiente)
    loader.waitTextures(20000).then(() => { if (st.MP === M) setTime(st.pi); });
  } finally { loading = null; done(); }
}
