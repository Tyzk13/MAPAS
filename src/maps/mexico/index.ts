// Mapa: San Judas de las Ánimas — cidadezinha mexicana no semiárido, para investigação paranormal.
// Monta natureza, quadras, lugares marcantes; define luzes (limitadas pela qualidade), vistas, VTT e animações.
import * as THREE from 'three';
import type { MapRuntime, View } from '../../core/types';
import { begin, halo, mistTex } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { Town, poleLines } from './town';
import { buildNature, exported } from './nature';
import { buildLandmarks, LREQ } from './landmarks';
import { BLK, BLOCK, WALKW, PANTEON, HACIENDA, TOWER_W, CANTINA, MARKET, CHURCH, ARROYO, ROAD_S, TOWN, Q, reseed, rnd } from './common';

const P = (x: number, y: number, z: number) => [x, y, z] as [number, number, number];
export const VIEWS: View[] = [
  { n: 'Cinema', p: P(52, 26, 70), t: P(4, 2, 0), fov: 45 },
  { n: 'Praça', p: P(16.5, 1.7, 21.5), t: P(0, 2.6, 0), fov: 58 },
  { n: 'Paróquia', p: P(4, 1.7, -17), t: P(0, 7.5, -34), fov: 55 },
  { n: 'Altar', p: P(1.2, 1.9, -36), t: P(0, 3.2, -52), fov: 58 },
  { n: 'Cantina', p: P(26.2, 1.65, -4.8), t: P(34, 1.3, 2), fov: 62 },
  { n: 'Mercado', p: P(-25.8, 1.7, 6.8), t: P(-34, 1.2, -4), fov: 60 },
  { n: 'Portal', p: P(-12, 1.75, 26.4), t: P(10, 2.2, 26.4), fov: 55 },
  { n: 'Panteón', p: P(62, 3.2, -14), t: P(92, 1, -24), fov: 55 },
  { n: 'Fazenda', p: P(-78, 3, 26), t: P(-100, 2, 16), fov: 55 },
  { n: 'Ritual', p: P(-117.6, 1.75, 23.2), t: P(-114.5, 0.2, 25.6), fov: 62 },
  { n: 'Rua', p: P(-45, 1.7, 19), t: P(20, 3, 19), fov: 55 },
  { n: 'Geral', p: P(0, 60, 95), t: P(0, 0, 4) },
  { n: 'Tática', p: P(0, 135, 0.1), t: P(0, 0, 0) },
];

export async function build(M: MapRuntime) {
  begin(M, 13);
  reseed(13);
  LREQ.length = 0;
  const G = M.G;
  const T = new Town(G);

  // ---------- quadras ----------
  T.streets((cx, cz) => cx === 0 && cz === 0);
  const e = BLOCK / 2 - WALKW;
  BLK.forEach(cx => BLK.forEach(cz => {
    if (cx === 0 && (cz === 0 || cz === -38)) return;             // praça e paróquia
    if (cx === 38 && cz === 0) return T.block(cx, cz, ['W'], 7);   // cantina na frente da praça
    if (cx === -38 && cz === 0) return T.block(cx, cz, ['E'], 5.2); // mercado
    if (cx === 0 && cz === 38) {                                  // portal de lojas ao norte
      T.row('S', cz + e, -e, e, 9);
      T.row('E', e, -(cz + e - 9), -36.2, 9);
      T.row('W', -e, 36.2, cz + e - 9, 9);
      return;
    }
    T.block(cx, cz);
  }));
  // casas soltas ao longo da estrada do sul e da estrada da fazenda (algumas em ruína)
  for (let z = TOWN + 6; z < 88; z += 7 + rnd() * 6) {
    if (rnd() < 0.75) T.house(ROAD_S - 7.5, z, Math.PI / 2, { w: 6 + rnd() * 2, d: 6, ruin: rnd() < 0.4, lit: 0.15 });
    if (rnd() < 0.6) T.house(ROAD_S + 7.5, z + 3, -Math.PI / 2, { w: 6 + rnd() * 2, d: 6, ruin: rnd() < 0.4, lit: 0.15 });
  }
  for (let x = -TOWN - 8; x > HACIENDA.x + 26; x -= 9 + rnd() * 8) if (rnd() < 0.7) T.house(x, 19 - 6.5, 0, { w: 5.5 + rnd() * 2, d: 6, ruin: rnd() < 0.6, lit: 0.1 });
  T.poles(poleLines());

  // ---------- lugares marcantes ----------
  const L = await buildLandmarks(G, T);
  await T.finish();

  // ---------- natureza (fora das construções) ----------
  const inBox = (x: number, z: number, x0: number, x1: number, z0: number, z1: number, m = 0) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
  const free = (x: number, z: number) =>
    !inBox(x, z, -TOWN, TOWN, -TOWN, TOWN, 3) && !inBox(x, z, PANTEON.x0, PANTEON.x1, PANTEON.z0, PANTEON.z1, 4) &&
    Math.hypot(x - HACIENDA.x, z - HACIENDA.z) > 22 && Math.hypot(x - TOWER_W.x, z - TOWER_W.z) > 6 &&
    !(Math.abs(x - ROAD_S) < 16 && z > TOWN && z < 92) && !(z > 8 && z < 26 && x < -TOWN && x > HACIENDA.x);
  const N = await buildNature(G, free);
  // nopais e agaves nos quintais
  if (exported.place && exported.nopal) {
    const yard: { x: number; y: number; z: number; ry: number; s: number }[] = [];
    BLK.forEach(cx => BLK.forEach(cz => { if (cx === 0 && cz <= 0) return; for (let i = 0; i < 2; i++) yard.push({ x: cx + (rnd() - 0.5) * 6, y: 0, z: cz + (rnd() - 0.5) * 6, ry: rnd() * 6, s: 0.9 + rnd() * 0.4 }); }));
    exported.place(exported.nopal, yard);
  }

  // ---------- velas (veladoras) ----------
  {
    const c = L.candles, body = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 6); body.translate(0, 0.06, 0);
    const bm = new THREE.MeshStandardMaterial({ color: 0xa02020, roughness: 0.4, emissive: 0x300000, transparent: true, opacity: 0.9 });
    const fm = new THREE.MeshBasicMaterial({ color: 0xffb060 }); M.lamps.push(fm);
    const fg = new THREE.SphereGeometry(0.018, 5, 4); fg.scale(1, 1.9, 1); fg.translate(0, 0.15, 0);
    const bi = new THREE.InstancedMesh(body, bm, c.length), fi = new THREE.InstancedMesh(fg, fm, c.length), o = new THREE.Object3D(), col = new THREE.Color();
    c.forEach((p, i) => { o.position.copy(p); o.updateMatrix(); bi.setMatrixAt(i, o.matrix); fi.setMatrixAt(i, o.matrix); bi.setColorAt(i, col.setHex([0xa02020, 0xe8e0d0, 0xd8a020, 0x2a6a3a][i % 4])); });
    bi.computeBoundingSphere(); fi.computeBoundingSphere(); bi.userData.ns = fi.userData.ns = 1; G.add(bi, fi);
    c.forEach((p, i) => { if (i % (Q.lights > 8 ? 2 : 4) === 0) halo(p.x, p.y + 0.16, p.z, 0.32); });
  }

  // ---------- luzes: só as mais importantes viram PointLight ----------
  const req = LREQ.slice().sort((a, b) => b.prio - a.prio);
  const flick: { l: THREE.PointLight; n: number; k: number }[] = [];
  req.slice(0, Q.lights).forEach((r, i) => {
    const l = new THREE.PointLight(r.color, 0, r.dist ?? 0, 2); l.position.set(r.x, r.y, r.z); G.add(l);
    M.lights.push({ l, d: 0, n: r.n });
    if (r.flick) flick.push({ l, n: r.n, k: i });
  });

  // ---------- poeira/névoa baixa à deriva ----------
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < (Q.lights > 8 ? 26 : 12); i++) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 220;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0xd8c8b0, transparent: true, depthWrite: false, opacity: 0.08 }));
    const sc = 12 + rnd() * 12; sp.scale.set(sc, sc * 0.22, 1); sp.position.set(x, sc * 0.08 + 0.2, z); sp.userData.v = 0.15 + rnd() * 0.2; sp.userData.ns = 1; sp.userData.noExport = 1;
    G.add(sp); mist.push(sp); M.mist.push(sp);
  }

  // ---------- mato rolando (rodadora) pela rua ----------
  const tumble = (() => {
    const pts: number[] = [];
    for (let i = 0; i < 90; i++) {
      const a = new THREE.Vector3().randomDirection().multiplyScalar(0.25 + rnd() * 0.15), b = a.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(0.25));
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x6a5a40 })); l.userData.noExport = 1; G.add(l); return l;
  })();

  // ---------- registro ----------
  M.walk.push(...N.floors, ...T.floors, ...L.floors);
  const solids = [...T.colliders, ...L.solids];
  M.solid = () => solids;
  M.layers = [{ n: 'Telhados', o: L.roofs, v: true }];
  M.views = VIEWS;
  M.shadowRadius = Q.lights > 8 ? 75 : 55;
  M.walkLimit = 200; M.camMax = 220; M.fogScale = 0.55;
  M.spawn = i => ({ x: 6 + (i % 3) * 1.1, z: 17 + Math.floor(i / 3) * 1.1, y: 0.16 });
  M.walkStart = { x: 17, z: 21 };

  M.vtt = {
    areas: [
      { n: 'Praça e arredores', b: [-32, 32, -32, 32], lv: 1 },
      { n: 'Cidade inteira', b: [-62, 62, -62, 62], lv: 1 },
      { n: 'Paróquia e átrio', b: [-14, 14, -55, -23], lv: 1 },
      { n: 'Cantina', b: [CANTINA.x0 - 3, CANTINA.x1 + 1, CANTINA.z0 - 1, CANTINA.z1 + 1], lv: 1 },
      { n: 'Mercado', b: [MARKET.x0 - 1, MARKET.x1 + 3, MARKET.z0 - 1, MARKET.z1 + 1], lv: 1 },
      { n: 'Panteón', b: [PANTEON.x0 - 4, PANTEON.x1 + 2, PANTEON.z0 - 2, PANTEON.z1 + 2], lv: 1 },
      { n: 'Fazenda abandonada', b: [HACIENDA.x - 17, HACIENDA.x + 19, HACIENDA.z - 15, HACIENDA.z + 15], lv: 1 },
      { n: 'Ponte do arroio', b: [ROAD_S - 16, ROAD_S + 16, ARROYO(ROAD_S) - 16, ARROYO(ROAD_S) + 16], lv: 1 },
    ],
    walls: [...T.vtt, ...L.vttWalls],
    portals: L.portals,
    lights: req.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.color.toString(16).padStart(6, '0')] as [number, number, number, number, string]),
  };
  // vista de cima: sem telhados (camada) e sem copas
  M.exportHide = () => [L.roofs];

  // ---------- animação ----------
  const swing = L.doors.filter(d => d.userData.swing);
  let lampsOn = true;
  // névoa mais rala quando a câmera sobe (vistas aéreas e tática legíveis)
  let fogBase = 0.01;
  M.onTime = p => { lampsOn = p.lamps > 0; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; };
  M.tick = (dt, t) => {
    flick.forEach(f => { if (f.l.intensity > 0) f.l.intensity = f.n * (0.82 + 0.18 * Math.sin(t * 13 + f.k * 7) * Math.sin(t * 7.3 + f.k)); });
    if (lampsOn) M.lamps.forEach((m, i) => { const b = m.userData.base; if (b) m.color.copy(b).multiplyScalar(0.85 + 0.15 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 6.1 + i)); });
    swing.forEach(d => (d.rotation.y = d.userData.swing * (0.05 + 0.06 * Math.sin(t * 1.3 + d.userData.swing))));
    const low = cam.position.y < 30;
    mist.forEach(m => { m.visible = low; m.position.x += m.userData.v * dt; if (m.position.x > 120) m.position.x = -120; });
    // a rodadora atravessa a rua de leste a oeste e recomeça
    const k = ((t * 2.2) % 200) - 100;
    tumble.position.set(-k, 0.38 + Math.abs(Math.sin(t * 3.1)) * 0.25, 19.6 + Math.sin(t * 0.7) * 1.2);
    tumble.rotation.z = t * 5.5; tumble.rotation.x = t * 0.7;
    const f = S.fog as THREE.FogExp2 | null; if (f && f.isFogExp2) f.density = fogBase / (1 + Math.max(0, cam.position.y - 8) / 14);
  };
  void CHURCH;
}
