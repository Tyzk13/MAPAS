// Mapa principal: igreja tradicional de concreto preparada para um casamento, com terreno amplo.
// Monta as partes (building, interior, grounds) e define vistas, camadas, colisão e dados de VTT.
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { MapRuntime, View } from '../../core/types';
import { begin, K } from '../../core/kit';
import { buildChurch } from './building';
import { EnvProbe } from '../../core/probe';
import { mergeStatic } from '../../core/merge';
import { cam } from '../../core/engine';
import { dustMotes, lightShaft } from '../../core/anim';
import { mistTex } from '../../core/kit';
import { st } from '../../core/state';
import { buildInterior, PEW } from './interior';
import { buildGrounds, SHED, GAZEBO } from './grounds';
import { FLOOR, NX, NZ, WT, LOFT, LOFT_Z, TOWER, DOOR, WIN, WIN_Z, TOP } from './common';

const P = (x: number, y: number, z: number) => [x, y, z] as [number, number, number];
export const VIEWS: View[] = [
  { n: 'Cinema', p: P(-22, 7.5, 38), t: P(-3, 8, 4), fov: 46 },
  { n: 'Fachada', p: P(-6.5, 1.9, 29), t: P(-1.5, 6.5, 11), fov: 50 },
  { n: 'Altar', p: P(0.5, FLOOR + 1.65, 3.6), t: P(0, FLOOR + 2.0, -10), fov: 55 },
  { n: 'Coro', p: P(1.6, FLOOR + 1.75, -6.4), t: P(0, FLOOR + 3.0, 9), fov: 58 },
  { n: 'Geral', p: P(0, 30, 46), t: P(0, 2, 6) },
  { n: 'Tática', p: P(0, 62, 8.1), t: P(0, 0, 8) },
  { n: 'Do coro', p: P(-1.2, LOFT + 1.65, 9.6), t: P(0, FLOOR + 1.2, -9) },
];

export async function build(M: MapRuntime) {
  begin(M, 7);
  const G = M.G;
  const B = buildChurch(G);
  const I = buildInterior(G);
  const Gr = await buildGrounds(G, I.flowers, VIEWS);
  // as flores do exterior foram somadas ao mesmo coletor; instancia agora
  I.flowers.build(G);

  M.glass.push(...B.glass);
  M.walk.push(...Gr.floors, ...B.floors, ...I.floors);
  M.loft = I.loft;
  M.layers = [{ n: 'Paredes', o: B.walls, v: true }, { n: 'Telhado', o: B.roof, v: true }, { n: '2º andar', o: I.loft, v: true }];
  M.shadowRadius = 48;

  M.views = VIEWS;

  M.spawn = i => ({ x: i % 2 ? 0.45 : -0.45, z: 4.2 - Math.floor(i / 2) * 1.3, y: FLOOR });
  M.walkStart = { x: 0, z: 18 };
  // som no lugar: velas do altar crepitando, sino da torre (de vez em quando) e a porta que range quando a câmera passa
  M.sons = [
    { x: 0, y: FLOOR + 1.7, z: -9.3, tipo: 'velas' },
    { x: (TOWER.x0 + TOWER.x1) / 2, y: TOWER.h - 3, z: (TOWER.z0 + TOWER.z1) / 2, tipo: 'sino' },
    { x: 0, y: FLOOR + 1.8, z: NZ + WT / 2, tipo: 'porta' },
  ];

  const OX = NX + WT, OZ = NZ + WT, T = TOWER, dw = DOOR.w / 2;
  const sh = { x0: SHED.x - SHED.d / 2, x1: SHED.x + SHED.d / 2, z0: SHED.z - SHED.w / 2, z1: SHED.z + SHED.w / 2 };
  M.vtt = {
    areas: [
      { n: 'Interior da igreja', b: [-7, 7, -12, 12], lv: 1 },
      { n: 'Igreja + entrada', b: [-13, 13, -14, 21], lv: 1 },
      { n: 'Propriedade inteira', b: [-28, 28, -26, 42], lv: 1 },
      { n: 'Coro (2º andar)', b: [-6.5, 6.5, LOFT_Z - 0.6, 11.6], lv: 2 },
    ],
    walls: [
      [[-dw, OZ], [-OX, OZ], [-OX, -OZ], [OX, -OZ], [OX, OZ], [dw, OZ]],
      [[T.x0, T.z0], [T.x1, T.z0], [T.x1, T.z1], [T.x0, T.z1], [T.x0, T.z0]],
      [[sh.x0, sh.z0], [sh.x1, sh.z0], [sh.x1, sh.z1], [sh.x0, sh.z1 - 1.1]],
    ],
    portals: [{ p: [0, OZ], a: [-dw, OZ], b: [dw, OZ] }],
    lights: [
      [0, -3.6, 9, 0.9, 'ffb067'], [0, 0.8, 9, 0.9, 'ffb067'], [-1.05, -9.3, 4, 0.7, 'ffb067'], [1.05, -9.3, 4, 0.7, 'ffb067'],
      [GAZEBO.x, GAZEBO.z, 5, 0.7, 'ffb067'],
      ...Gr.lightsVtt.filter(l => !(l[0] === GAZEBO.x && l[1] === GAZEBO.z)),
    ],
  };
  // exportação de cima: esconde o que fica acima do térreo (lustres, tesouras, topo da torre etc.)
  M.exportHide = () => {
    const out: THREE.Object3D[] = [], bb = new THREE.Box3();
    [B.walls, G.getObjectByName('interior')!].forEach(root => root.traverse(o => {
      if ((o as THREE.Mesh).isMesh && !isIn(o, I.loft) && bb.setFromObject(o).min.y > FLOOR + 3.2) out.push(o);
    }));
    return out;
  };
  const solids = [...B.solids, ...I.solids, ...Gr.solids];
  M.solid = () => (B.walls.visible ? solids : Gr.solids);
  // luz fria e difusa que entra pelos vitrais: uma luz de área ao longo de cada parede lateral
  RectAreaLightUniformsLib.init();
  const fills = [-1, 1].map(s => {
    const l = new THREE.RectAreaLight(0xaebcd6, 0, NZ * 2 - 3, 3.4);
    l.position.set(s * (NX - 0.25), FLOOR + 3.6, 0); l.lookAt(0, FLOOR + 2.2, 0); B.walls.add(l); return l;
  });
  // sonda de ambiente do interior (reflexos do piso, luz rebatida nas paredes)
  const probe = new EnvProbe(new THREE.Vector3(0, FLOOR + 2.4, -1), new THREE.Box3(new THREE.Vector3(-NX - 0.15, 0, -NZ - 0.15), new THREE.Vector3(NX + 0.15, 13, NZ + 0.15)), 1);
  probe.bind(G, o => !!o.userData.ns || !!o.userData.exterior);
  const tokens = () => Object.values(st.T).map(t => t.g);
  // ---------- atmosfera animada ----------
  // poeira em suspensão na nave
  const dust = dustMotes(new THREE.Box3(new THREE.Vector3(-NX + 0.3, FLOOR + 0.3, -NZ + 0.5), new THREE.Vector3(NX - 0.3, TOP, NZ - 0.5)), 520);
  I.group.add(dust);
  // feixes de luz entrando pelos vitrais (frios) e saindo pela porta (quente)
  const shafts: THREE.Mesh[] = [];
  [-1, 1].forEach(sd => WIN_Z.forEach(z => {
    const sh = lightShaft(new THREE.Vector3(sd * (NX - 0.02), FLOOR + WIN.sill + WIN.h * 0.42, z), new THREE.Vector3(-sd, -0.62, 0.18), 6.5, WIN.w * 0.95, WIN.h * 0.8, 0x9fb4d8);
    I.group.add(sh); shafts.push(sh);
  }));
  const doorShaft = lightShaft(new THREE.Vector3(0, FLOOR + 1.9, NZ + 0.3), new THREE.Vector3(0, -0.32, 1), 7, DOOR.w * 0.95, 3.4, 0xffa25a);
  G.add(doorShaft);
  [...shafts, doorShaft, dust].forEach(o => (o.userData.noExport = 1));
  // névoa baixa à deriva no terreno (fora da igreja)
  const mist: THREE.Sprite[] = [];
  let ms = 5; const mr = () => (ms = (ms * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 22; i++) {
    let x = (mr() - 0.5) * 70, z = -20 + mr() * 70;
    if (Math.abs(x) < NX + 4 && Math.abs(z) < NZ + 4) x += x < 0 ? -12 : 12;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0xb9c3cf, transparent: true, depthWrite: false, opacity: 0.08 }));
    const sc = 9 + mr() * 9; sp.scale.set(sc, sc * 0.28, 1); sp.position.set(x, sc * 0.11 + 0.15, z); sp.userData.v = 0.08 + mr() * 0.12; sp.userData.ns = 1;
    G.add(sp); mist.push(sp); M.mist.push(sp);
  }
  M.onTime = p => {
    fills.forEach(l => (l.intensity = p.env * 3.2));
    shafts.forEach(m => ((m.material as THREE.ShaderMaterial).uniforms.uInt.value = 0.015 + p.env * 0.09));
    (doorShaft.material as THREE.ShaderMaterial).uniforms.uInt.value = 0.06 * p.lamps;
    (dust.material as THREE.ShaderMaterial).uniforms.uInt.value = 0.08 + 0.12 * p.lamps;
    lampsOn = p.lamps > 0;
    const hide = [...tokens(), ...shafts, doorShaft, dust];
    probe.update(hide); probe.update(hide);
  };
  // velas e lustres tremulando, chamas pulsando, lustres balançando, névoa andando
  const flick = M.lights.filter(l => l.n > 0 && l.n < 4), chand = M.lights.filter(l => l.n >= 20);
  let lampsOn = true;
  // dentro da nave, com a porta fora do campo de visão, o exterior (gramado, árvores, floresta) não aparece:
  // deixa de ser desenhado (as paredes o escondem de qualquer jeito)
  const EXT = G.getObjectByName('exterior')!; EXT.userData.autoHide = true;
  const frus = new THREE.Frustum(), pm = new THREE.Matrix4();
  const door = new THREE.Box3(new THREE.Vector3(-DOOR.w / 2, FLOOR, NZ - 0.2), new THREE.Vector3(DOOR.w / 2, FLOOR + DOOR.h, NZ + WT + 0.2));
  const inside = () => Math.abs(cam.position.x) < NX && Math.abs(cam.position.z) < NZ && cam.position.y < TOP + 3 && cam.position.y > FLOOR - 0.2;
  const updExterior = () => {
    if (!inside() || !B.walls.visible) { EXT.visible = true; return; }
    cam.updateMatrixWorld(); pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frus.setFromProjectionMatrix(pm);
    EXT.visible = frus.intersectsBox(door);
  };
  M.tick = (dt, t) => {
    updExterior();
    flick.forEach((l, i) => { if (l.l.intensity > 0) l.l.intensity = l.n * (0.86 + 0.14 * Math.sin(t * 13 + i * 7) * Math.sin(t * 7.3 + i)); });
    chand.forEach((l, i) => { if (l.l.intensity > 0) l.l.intensity = l.n * (0.95 + 0.05 * Math.sin(t * 9.1 + i * 3) * Math.sin(t * 5.3 + i)); });
    if (lampsOn) M.lamps.forEach((m, i) => { const b = m.userData.base; if (b) m.color.copy(b).multiplyScalar(0.88 + 0.12 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 6.1 + i)); });
    I.swing.forEach((p, i) => { p.rotation.x = Math.sin(t * 0.63 + i * 1.7) * 0.006; p.rotation.z = Math.sin(t * 0.51 + i) * 0.005; });
    mist.forEach(m => { m.position.x += m.userData.v * dt; if (m.position.x > 40) m.position.x = -40; });
  };
  // ---------- desempenho: junta peças estáticas por material (cada camada separada; alto/baixo para o VTT) ----------
  const bucket = (_m: THREE.Mesh, b: THREE.Box3) => (b.min.y > FLOOR + 3.2 ? 'alto' : 'baixo');
  const skip = (o: THREE.Object3D) => I.swing.includes(o) || o === I.loft;
  let antes = 0, depois = 0;
  for (const root of [B.walls, B.roof, I.loft, I.group, G.getObjectByName('exterior')!]) {
    const r = mergeStatic(root, { skip: o => o !== root && skip(o), bucket }); antes += r.before; depois += r.after;
  }
  console.info(`peças estáticas juntadas: ${antes} → ${depois}`);
  void K; void PEW;
}

function isIn(o: THREE.Object3D, root: THREE.Object3D) { for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === root) return true; return false; }
