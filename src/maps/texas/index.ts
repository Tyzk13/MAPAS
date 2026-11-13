// Mapa: Harlow, Texas — cidadezinha do oeste texano (tribunal na praça, Main Street, rodovia, ferrovia,
// fazenda abandonada). Monta ruas, lojas, casas, marcos, natureza, luzes, vistas, VTT e animações.
import * as THREE from 'three';
import type { MapRuntime, View } from '../../core/types';
import { begin, mistTex } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { Builder } from './buildings';
import { buildLandmarks } from './landmarks';
import { buildMystery, DOCS } from './mystery';
import { buildPolice } from './police';
import { PISTAS, NOTAS } from './pistas';
import { buildNature, setBuilt, groundH } from './nature';
import {
  Q, rnd, reseed, sm, LREQ, TM, neonTexture, SQ, RING, ROW0, ROWD, HWY, RAIL, RES_Z, RES_X, EXT, CHURCH, CEMETERY, DINER, GAS, MOTEL, DEPOT, ELEVATOR, TOWERW, FARM, PUMPS, TAVERN, POLICE,
} from './common';

const P = (x: number, y: number, z: number) => [x, y, z] as [number, number, number];
export const VIEWS: View[] = [
  // a 1ª vista é a inicial: o mapa abre na delegacia (onde a missão começa)
  { n: 'Delegacia', p: P(-9, 2.8, 67.5), t: P(12, 2.2, 82.5), fov: 52 },
  { n: 'Cinema', p: P(70, 30, 82), t: P(0, 2, -6), fov: 45 },
  { n: 'Praça', p: P(27, 1.7, 30), t: P(0, 5, 0), fov: 58 },
  { n: 'Main Street', p: P(-2.5, 1.75, -66), t: P(1, 3, 10), fov: 50 },
  { n: 'Saloon', p: P(-38.6, 1.7, -29.5), t: P(-50, 1.4, -24), fov: 62 },
  { n: 'Lanchonete', p: P(-50, 1.7, 92.8), t: P(-60, 1.2, 86), fov: 62 },
  { n: 'Rodovia', p: P(18, 1.7, 112), t: P(60, 4, 88), fov: 55 },
  { n: 'Quarto 7', p: P(69.1, 1.6, 80.5), t: P(70.2, 0.9, 72), fov: 64 },
  { n: 'Igreja', p: P(-46, 1.9, -71.5), t: P(-46, 2.2, -86), fov: 58 },
  { n: 'Cemitério', p: P(-72, 1.7, -66), t: P(-72, 0.8, -90), fov: 58 },
  { n: 'Estação', p: P(-10, 2.2, -86), t: P(30, 6, -108), fov: 55 },
  { n: 'Fazenda', p: P(140, 3, 18), t: P(168, 3, 26), fov: 55 },
  { n: 'Ritual', p: P(166.5, 1.7, 33), t: P(165.2, 0.1, 30), fov: 64 },
  { n: 'Recepção', p: P(14.6, 1.65, 85.4), t: P(13, 1.7, 78), fov: 62 },
  { n: 'Sala do xerife', p: P(15.3, 1.65, 77.3), t: P(11, 1.3, 73), fov: 64 },
  { n: 'Agentes', p: P(17, 1.7, 82.8), t: P(24, 1.2, 74), fov: 64 },
  { n: 'Sala do caso', p: P(21, 1.65, 85.2), t: P(21, 1.6, 94), fov: 66 },
  { n: 'Evidências', p: P(26.8, 1.65, 78), t: P(31, 1.1, 83), fov: 64 },
  { n: 'Interrogatório', p: P(31.3, 1.7, 76.3), t: P(27, 1.0, 72), fov: 64 },
  { n: 'Rádio', p: P(14.5, 1.65, 87), t: P(10.5, 1.2, 90), fov: 64 },
  { n: 'Celas', p: P(27.2, 1.65, 85.6), t: P(32, 1.3, 89.5), fov: 64 },
  { n: 'Quadro do caso', p: P(21, 1.65, 91.2), t: P(21, 1.65, 94), fov: 62 },
  { n: 'Mural da recepção', p: P(13, 1.7, 80.0), t: P(13, 1.7, 78), fov: 60 },
  { n: 'Milharal', p: P(186, 2.4, 50), t: P(199, 0, 60), fov: 58 },
  { n: 'Vagão', p: P(-58, 1.7, -96), t: P(-63, 2.4, -104), fov: 58 },
  { n: 'Geral', p: P(0, 70, 120), t: P(0, 0, 10) },
  { n: 'Tática', p: P(0, 150, 0.1), t: P(0, 0, 0) },
];

export async function build(M: MapRuntime) {
  begin(M, 21); reseed(21); LREQ.length = 0;
  const G = M.G, b = new Builder(G);

  // área construída (o terreno fica plano aqui)
  const inR = (x: number, z: number, x0: number, x1: number, z0: number, z1: number, mm = 0) => x > x0 - mm && x < x1 + mm && z > z0 - mm && z < z1 + mm;
  setBuilt((x, z) => {
    const d = Math.max(0, Math.max(Math.abs(x) - (EXT + 10), z - (HWY + 12), (RAIL - 24) - z));
    const farm = Math.max(0, Math.hypot(x - FARM.x - 8, z - FARM.z) - 48);
    return Math.max(1 - sm(0, 30, d), 1 - sm(0, 20, farm));
  });

  // ---------- ruas ----------
  const R2 = SQ + RING.street / 2, RW = RING.street;
  b.road(0, -R2, 'x', 2 * ROW0, RW, false, 0.03); b.road(0, R2, 'x', 2 * ROW0, RW, false, 0.03);
  b.road(-R2, 0, 'z', 2 * SQ, RW, false, 0.031); b.road(R2, 0, 'z', 2 * SQ, RW, false, 0.031);
  b.road(0, (ROW0 + HWY - 5) / 2, 'z', HWY - 5 - ROW0, 12, true, 0.034);           // Main St sul
  b.road(0, (-ROW0 + RAIL + 8) / 2, 'z', ROW0 - RAIL - 8 - 0.0, 12, true, 0.034);  // Main St norte
  b.road((-ROW0 - EXT) / 2, 0, 'x', EXT - ROW0, 12, true, 0.036); b.road((ROW0 + 100) / 2, 0, 'x', 100 - ROW0, 12, true, 0.036); // Commerce
  RES_Z.forEach(z => b.road(0, z, 'x', 2 * EXT, 9, true, 0.038));
  RES_X.forEach(x => b.road(x, 0, 'z', 2 * Math.abs(RES_Z[0]) - 9, 9, true, 0.04));
  b.road(0, HWY, 'x', 600, 10, true, 0.045);
  // vagas a 45° em volta da praça
  for (let t = -34; t <= 34; t += 3.2) {
    if (Math.abs(t) < 7) continue;
    [[t, -(ROW0 - 2.6), 0.78], [t, ROW0 - 2.6, -0.78], [-(ROW0 - 2.6), t, 0.78 + Math.PI / 2], [ROW0 - 2.6, t, -0.78 + Math.PI / 2]].forEach(([x, z, r]) => { const g = new THREE.PlaneGeometry(0.12, 4.2); g.rotateX(-Math.PI / 2); g.rotateY(r); g.translate(x, 0.04, z); b.D.add(TM().plain, g, 0xd8d0c0); });
  }
  // calçadas cobertas das lojas
  const sw = (a: number, c: number, along: 'x' | 'z', w: number) => along === 'x' ? b.walk(a, c, w, RING.walk) : b.walk(c, a, RING.walk, w);
  [-1, 1].forEach(s => { const c = s * (ROW0 - RING.walk / 2); [[-ROW0, -6], [6, ROW0]].forEach(([a0, a1]) => { sw((a0 + a1) / 2, c, 'x', a1 - a0); sw((a0 + a1) / 2, c, 'z', a1 - a0); }); });

  // ---------- lojas em volta da praça ----------
  const names = ['HARLOW SAVINGS & LOAN', 'FIRST STATE BANK', 'ROXY', 'HARLOW HARDWARE', "RIDDLE'S DRUG STORE", 'FEED & SEED', 'BARBER SHOP', 'WESTERN WEAR', 'U.S. POST OFFICE', 'HARLOW GAZETTE', 'PRUITT FUNERAL HOME', 'PAWN & GUNS', 'FOR LEASE', 'CAFE', 'FIVE & DIME', 'ABSTRACT & TITLE', 'TAXIDERMY', 'BAIL BONDS'];
  const sc: Record<string, [string, string]> = { 'HARLOW SAVINGS & LOAN': ['#e8e0cc', '#2a3a5a'], 'FIRST STATE BANK': ['#e0d8c0', '#2a2a2a'], 'PRUITT FUNERAL HOME': ['#1e1a18', '#d8c8a0'], 'PAWN & GUNS': ['#e8c040', '#2a1a10'] };
  let ni = 0, roxy: { x: number; z: number; ry: number } | null = null;
  const fill = (a: number, c: number, along: 'x' | 'z', ry: number, from: number, to: number) => {
    let t = from;
    while (to - t > 4) {
      let w = 6.5 + rnd() * 3.5; if (to - t - w < 5) w = to - t;
      const mid = t + w / 2, name = names[ni++ % names.length], x = along === 'x' ? mid : c, z = along === 'x' ? c : mid;
      b.store(x, z, ry, { w, d: ROWD, name, brick: rnd() < 0.5, signCol: sc[name], two: name === 'ROXY' ? true : undefined, dark: name === 'FOR LEASE' || name === 'PRUITT FUNERAL HOME' });
      if (name === 'ROXY') roxy = { x, z, ry };
      t += w;
    }
    void a;
  };
  const E = ROW0 + ROWD;
  fill(0, -ROW0, 'x', 0, -E, -6); fill(0, -ROW0, 'x', 0, 6, E);
  fill(0, ROW0, 'x', Math.PI, -E, -6); fill(0, ROW0, 'x', Math.PI, 6, E);
  fill(0, ROW0, 'z', -Math.PI / 2, -ROW0, -6); fill(0, ROW0, 'z', -Math.PI / 2, 6, ROW0);
  fill(0, -ROW0, 'z', Math.PI / 2, -ROW0, TAVERN.z0); fill(0, -ROW0, 'z', Math.PI / 2, TAVERN.z1, -6); fill(0, -ROW0, 'z', Math.PI / 2, 6, ROW0);

  // ---------- casas ----------
  const busy = (x: number, z: number) =>
    inR(x, z, -E - 6, E + 6, -E - 6, E + 6) || inR(x, z, CHURCH.x - 12, CHURCH.x + 12, -100, -60) || inR(x, z, CEMETERY.x0, CEMETERY.x1, CEMETERY.z0, CEMETERY.z1, 8) ||
    inR(x, z, DINER.x0 - 6, GAS.x + 10, 70, 99) || inR(x, z, MOTEL.x0 - 6, MOTEL.x1 + 6, MOTEL.z0 - 6, 99) || Math.abs(x) < 10 || inR(x, z, DEPOT.x0, DEPOT.x1, DEPOT.z0, DEPOT.z1, 6) || inR(x, z, POLICE.x0, POLICE.x1, POLICE.z0, POLICE.z1, 7);
  const lot = (x: number, z: number, ry: number) => { if (busy(x, z)) return; b.house(x, z, ry, { w: 8 + rnd() * 3, d: 8 + rnd() * 2, ruin: rnd() < 0.1, two: rnd() < 0.18 }); };
  for (let x = -EXT + 10; x <= EXT - 10; x += 16 + rnd() * 3) {
    lot(x, RES_Z[1] + 11.5, Math.PI); lot(x, RES_Z[0] - 11.5, 0);
    if (Math.abs(x) > 60) { lot(x, RES_Z[1] - 11.5, 0); lot(x, RES_Z[0] + 11.5, Math.PI); }
  }
  RES_X.forEach(xs => { for (let z = -50; z <= 50; z += 16 + rnd() * 3) { if (Math.abs(z) < 12) continue; lot(xs + 11.5, z, -Math.PI / 2); lot(xs - 11.5, z, Math.PI / 2); } });
  [[70, 84], [-84, -70]].forEach(([a0, a1]) => { for (let x = a0; x <= a1; x += 16) { lot(x, -13, 0); lot(x, 13, Math.PI); } });

  // ---------- postes e iluminação ----------
  const line = (ax: number, az: number, bx: number, bz: number, step = 30): [number, number][] => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)), out: [number, number][] = []; for (let i = 0; i <= n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); return out; };
  b.poles([
    line(-250, HWY - 7, 250, HWY - 7, 34), line(7.5, ROW0 + 6, 7.5, HWY - 9), line(-EXT, -7.5, -ROW0 - 4, -7.5), line(ROW0 + 4, 7.5, FARM.x - 14, 7.5, 32),
    line(-EXT, RES_Z[0] - 5.5, EXT, RES_Z[0] - 5.5), line(-EXT, RES_Z[1] + 5.5, EXT, RES_Z[1] + 5.5), line(RES_X[0] - 5.5, -60, RES_X[0] - 5.5, 60), line(RES_X[1] + 5.5, -60, RES_X[1] + 5.5, 60),
    line(-7.5, -ROW0 - 4, -7.5, RAIL + 8),
  ]);
  b.streetLights([
    [-ROW0 + 1.0, -21, Math.PI / 2], [ROW0 - 1.0, 21, -Math.PI / 2], [-21, ROW0 - 1.0, Math.PI], [21, -ROW0 + 1.0, 0],
    [7, 70, -Math.PI / 2], [-7, 88, Math.PI / 2], [7, -70, -Math.PI / 2], [-50, 6.5, Math.PI], [60, -6.5, 0],
    [-30, HWY - 6, 0], [30, HWY - 6, 0], [RES_X[0] - 5, 0, Math.PI / 2], [RES_X[1] + 5, 0, -Math.PI / 2],
  ], 3);
  if (roxy) { // marquise do cinema
    const r = roxy as { x: number; z: number; ry: number }, Mx = new THREE.Matrix4().makeRotationY(r.ry).setPosition(r.x, 0, r.z);
    const pos = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(Mx);
    const mq = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.5, metalness: 0.4 })); mq.position.copy(pos(0, 3.9, 1.1)); mq.rotation.y = r.ry; G.add(mq);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(6.3, 0.9), new THREE.MeshBasicMaterial({ map: neonTexture('CLOSED · SEE YOU SOON', '#ffd070', { w: 1024, h: 146, font: '"Trebuchet MS", sans-serif' }), toneMapped: false }));
    t.position.copy(pos(0, 3.9, 2.22)); t.rotation.y = r.ry; G.add(t); M.lamps.push(t.material as THREE.MeshBasicMaterial);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.6), new THREE.MeshBasicMaterial({ map: neonTexture('ROXY', '#ff3a3a', { w: 512, h: 160 }), toneMapped: false }));
    v.position.copy(pos(0, 6.6, 0.6)); v.rotation.y = r.ry; v.rotateZ(Math.PI / 2); G.add(v); M.lamps.push(v.material as THREE.MeshBasicMaterial);
  }

  const L = await buildLandmarks(G);
  buildMystery(G, L.lamps);
  const PD = await buildPolice(G);
  M.lamps.push(...PD.lamps);
  // documentos clicáveis + tradução/nota do mestre; notas por vista (só na janela do mestre)
  M.docs = [...PD.docs, ...DOCS].map(d => ({ ...d, ...(PISTAS[d.n] || {}) }));
  M.notas = NOTAS;
  await b.finish();
  M.lamps.push(...L.lamps);

  // ---------- natureza ----------
  const free = (x: number, z: number) => !busy(x, z) && !inR(x, z, -EXT - 4, EXT + 4, RES_Z[0] - 22, RES_Z[1] + 22) && !inR(x, z, FARM.x - 25, FARM.x + 50, FARM.z - 32, FARM.z + 60) &&
    !inR(x, z, ELEVATOR.x - 10, ELEVATOR.x + 22, ELEVATOR.z - 10, ELEVATOR.z + 14) && Math.hypot(x - TOWERW.x, z - TOWERW.z) > 7 && !PUMPS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 7) &&
    !(Math.abs(x) < 9 && z < 0 && z > RAIL - 30);
  const N = await buildNature(G, free);

  // ---------- luzes ----------
  const req = LREQ.slice().sort((a, c) => c.prio - a.prio), flick: { l: THREE.PointLight; n: number; k: number; kind: number }[] = [];
  req.slice(0, Q.lights).forEach((r, i) => { const l = new THREE.PointLight(r.color, 0, 0, 2); l.position.set(r.x, r.y, r.z); G.add(l); M.lights.push({ l, d: 0, n: r.n }); if (r.flick) flick.push({ l, n: r.n, k: i, kind: r.flick }); });

  // ---------- poeira e rodadoras ----------
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < (Q.lights > 8 ? 24 : 10); i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0xd8c8b0, transparent: true, depthWrite: false, opacity: 0.08 }));
    const s = 14 + rnd() * 12; sp.scale.set(s, s * 0.22, 1); sp.position.set((rnd() - 0.5) * 260, s * 0.08 + 0.2, (rnd() - 0.5) * 260); sp.userData.v = 0.2 + rnd() * 0.25; sp.userData.ns = sp.userData.noExport = 1; G.add(sp); mist.push(sp); M.mist.push(sp);
  }
  const tumbles = [0, 1, 2].map(() => {
    const pts: number[] = []; for (let i = 0; i < 90; i++) { const a = new THREE.Vector3().randomDirection().multiplyScalar(0.25 + rnd() * 0.15), c = a.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(0.25)); pts.push(a.x, a.y, a.z, c.x, c.y, c.z); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x7a6a48 })); l.userData.noExport = 1; G.add(l); return l;
  });

  // ---------- registro ----------
  M.walk.push(...N.floors, ...b.floors, ...L.floors, ...PD.floors);
  const solids = [...b.colliders, ...L.solids, ...PD.solids];
  M.solid = () => solids;
  M.layers = [{ n: 'Telhados', o: b.roofs, v: true }, { n: 'Telhados (marcos)', o: L.roofs, v: true }, { n: 'Teto da delegacia', o: PD.roofs, v: true }];
  M.views = VIEWS;
  M.shadowRadius = Q.lights > 8 ? 80 : 55;
  M.walkLimit = 240; M.camMax = 240; M.fogScale = 0.5;
  M.spawn = i => ({ x: 7.2 + (i % 3) * 1.0, z: 77.4 - Math.floor(i / 3) * 1.1, y: 0.12 }); // calçada da delegacia
  M.walkStart = { x: 7, z: 82 };
  // som no lugar: velas do ritual na fazenda e do porão, sino do campanário, portas do saloon e do quarto 7
  M.sons = [
    { x: FARM.x - 2.8, y: 0.5, z: FARM.z, tipo: 'velas' },
    { x: CHURCH.x, y: 13, z: CHURCH.z + CHURCH.d / 2 - 1.5, tipo: 'sino' },
    { x: TAVERN.x1, y: 1.4, z: (TAVERN.z0 + TAVERN.z1) / 2, tipo: 'porta' },
    { x: MOTEL.x0 + 8 + 6 * 4 + 0.6, y: 1.2, z: MOTEL.z0 + 7, tipo: 'porta' },
  ];
  M.vtt = {
    areas: [
      { n: 'Delegacia (missão)', b: [POLICE.x0 - 8, POLICE.x1 + 1, POLICE.z0 - 1, POLICE.z1 + 1], lv: 1 },
      { n: 'Praça do tribunal', b: [-55, 55, -55, 55], lv: 1 },
      { n: 'Saloon', b: [TAVERN.x0 - 1, TAVERN.x1 + 5, TAVERN.z0 - 1, TAVERN.z1 + 1], lv: 1 },
      { n: 'Rodovia (lanchonete, posto, motel)', b: [-70, 85, 64, 112], lv: 1 },
      { n: 'Motel — quarto 7', b: [60, 74, 66, 82], lv: 1 },
      { n: 'Igreja e cemitério', b: [-88, -36, -100, -60], lv: 1 },
      { n: 'Estação e silos', b: [-30, 70, -125, -84], lv: 1 },
      { n: 'Fazenda abandonada', b: [FARM.x - 24, FARM.x + 34, FARM.z - 30, FARM.z + 14], lv: 1 },
      { n: 'Milharal (círculo)', b: [182, 218, 42, 82], lv: 1 },
      { n: 'Cidade inteira', b: [-160, 160, -125, 115], lv: 1 },
    ],
    walls: [...b.vtt, ...L.vttWalls, ...PD.vttWalls],
    portals: [...L.portals, ...PD.portals],
    lights: req.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.color.toString(16).padStart(6, '0')] as [number, number, number, number, string]),
  };
  M.exportHide = () => [b.roofs, L.roofs, PD.roofs];

  // ---------- animação ----------
  let fogBase = 0.01, lampsOn = true;
  M.onTime = p => { lampsOn = p.lamps > 0; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; };
  const fp = L.anim.flag?.geometry.attributes.position as THREE.BufferAttribute | undefined, fx0 = fp ? Float32Array.from(fp.array as Float32Array) : null;
  M.tick = (dt, t) => {
    flick.forEach(f => {
      if (f.l.intensity <= 0) return;
      if (f.kind === 3) { const on = Math.sin(t * 2.3) + Math.sin(t * 7.1) * 0.6 > -0.6; f.l.intensity = f.n * (on ? 0.9 + 0.1 * Math.sin(t * 40) : 0.08); }
      else f.l.intensity = f.n * (0.82 + 0.18 * Math.sin(t * 13 + f.k * 7) * Math.sin(t * 7.3 + f.k));
    });
    if (lampsOn) {
      M.lamps.forEach((m, i) => { const bb = m.userData.base; if (bb && !L.anim.neon.some(n => n.m === m)) m.color.copy(bb).multiplyScalar(0.9 + 0.1 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 6.1 + i)); });
      L.anim.neon.forEach(n => { const bb = n.m.userData.base; if (!bb) return; const on = n.flick === 4 ? Math.sin(t * 2.0) > 0 : Math.sin(t * 1.7 + n.flick) + Math.sin(t * 9.3) * 0.5 > -0.9; n.m.color.copy(bb).multiplyScalar(on ? 1 : 0.12); });
    }
    L.anim.pumps.forEach(p => { const a = t * 1.3 + p.ph; p.crank.rotation.z = -a; p.beam.rotation.z = Math.sin(a) * 0.22; });
    if (L.anim.wheel) L.anim.wheel.rotation.z = t * 1.6;
    L.anim.doors.forEach(d => (d.rotation.y = d.userData.swing * (0.05 + 0.06 * Math.sin(t * 1.3 + d.userData.swing))));
    if (fp && fx0) { for (let i = 0; i < fp.count; i++) { const x = fx0[i * 3]; fp.setZ(i, Math.sin(x * 2.2 - t * 5) * 0.12 * x / 3); fp.setY(i, fx0[i * 3 + 1] + Math.sin(x * 1.6 - t * 4) * 0.04 * x); } fp.needsUpdate = true; }
    const low = cam.position.y < 30;
    mist.forEach(m => { m.visible = low; m.position.x += m.userData.v * dt; if (m.position.x > 140) m.position.x = -140; });
    tumbles.forEach((tb, i) => {
      const k = ((t * (2.4 + i * 0.5) + i * 70) % 260) - 130, z = [HWY + 2, RES_Z[0] - 1, RES_Z[1] + 1][i];
      tb.position.set(i === 1 ? k : -k, groundH(-k, z) + 0.38 + Math.abs(Math.sin(t * 3.1 + i)) * 0.25, z + Math.sin(t * 0.7 + i) * 1.2);
      tb.rotation.z = t * 5.5 * (i === 1 ? -1 : 1); tb.rotation.x = t * 0.7;
    });
    const f = S.fog as THREE.FogExp2 | null; if (f && f.isFogExp2) f.density = fogBase / (1 + Math.max(0, cam.position.y - 8) / 14);
  };
}
