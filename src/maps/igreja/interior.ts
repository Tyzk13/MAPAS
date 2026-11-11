// Interior: bancos, presbitério, altar, cruz, ambão, balaustrada, coro (2º andar) com escada e órgão,
// lustres, velas e a decoração do casamento (passadeira, arranjos de rosas brancas, pétalas).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boxUV } from '../../core/pbr';
import { roseGeometry, leafGeometry, looseePetalGeometry, oldPainting } from '../../core/procedural';
import { place, model, instance } from '../../core/models';
import { K, halo } from '../../core/kit';
import { FLOOR, NX, NZ, LOFT, LOFT_Z, WIN, WIN_Z, M, iron, brass, velvet, cube, mesh, bx } from './common';

export const PEW = { len: 3.6, x: 3.05, rows: [-5.6, -4.35, -3.1, -1.85, -0.6, 0.65, 1.9, 3.15] };
export const CHANCEL = { z0: -NZ, z1: -7.4, h: 0.45 };

export interface Interior { loft: THREE.Group; solids: THREE.Object3D[]; floors: THREE.Object3D[]; flowers: Flowers; swing: THREE.Object3D[]; group: THREE.Group }

/** Coletor de flores (rosas + folhas) instanciadas no fim, numa só chamada de desenho cada. */
export class Flowers {
  roses: THREE.Matrix4[] = []; leaves: THREE.Matrix4[] = []; petals: THREE.Matrix4[] = [];
  private o = new THREE.Object3D(); private r: () => number;
  constructor(seed = 3) { let s = seed; this.r = () => (s = (s * 16807) % 2147483647) / 2147483647; }
  private push(arr: THREE.Matrix4[], x: number, y: number, z: number, rx: number, ry: number, rz: number, sc: number) {
    this.o.position.set(x, y, z); this.o.rotation.set(rx, ry, rz); this.o.scale.setScalar(sc); this.o.updateMatrix(); arr.push(this.o.matrix.clone());
  }
  /** Buquê esférico em (x,y,z) com raio r. */
  bunch(x: number, y: number, z: number, r: number, n: number, leafK = 1.2, up = 1) {
    const R = this.r;
    for (let i = 0; i < n; i++) {
      const u = R() * Math.PI * 2, v = Math.acos(1 - R() * (1 + up * 0.6)), rr = r * (0.75 + R() * 0.3);
      const dx = Math.sin(v) * Math.cos(u), dy = Math.cos(v), dz = Math.sin(v) * Math.sin(u);
      this.push(this.roses, x + dx * rr, y + dy * rr, z + dz * rr, v * Math.sin(u) * 0.9, R() * 6, -v * Math.cos(u) * 0.9, 0.85 + R() * 0.5);
    }
    for (let i = 0; i < n * leafK; i++) {
      const u = R() * Math.PI * 2, v = 0.6 + R() * 1.3, rr = r * (0.8 + R() * 0.35);
      this.push(this.leaves, x + Math.sin(v) * Math.cos(u) * rr, y + Math.cos(v) * rr * 0.8, z + Math.sin(v) * Math.sin(u) * rr, R() - 0.5 + v, u, R() - 0.5, 1 + R() * 0.8);
    }
  }
  scatterPetals(x0: number, x1: number, z0: number, z1: number, y: number, n: number) {
    const R = this.r; for (let i = 0; i < n; i++) this.push(this.petals, x0 + R() * (x1 - x0), y, z0 + R() * (z1 - z0), (R() - 0.5) * 0.3, R() * 6, (R() - 0.5) * 0.3, 0.7 + R() * 0.6);
  }
  build(parent: THREE.Object3D) {
    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, arr: THREE.Matrix4[], shadow: boolean) => {
      if (!arr.length) return;
      const im = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere(); parent.add(im);
    };
    mk(roseGeometry(), new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.75, side: THREE.DoubleSide, envMapIntensity: 0.5 }), this.roses, true);
    mk(leafGeometry(), new THREE.MeshStandardMaterial({ color: 0x2c3a26, roughness: 0.7, side: THREE.DoubleSide, envMapIntensity: 0.5 }), this.leaves, true);
    mk(looseePetalGeometry(), new THREE.MeshStandardMaterial({ color: 0xeee8de, roughness: 0.8, side: THREE.DoubleSide }), this.petals, false);
  }
}

/** Geometria de um banco de igreja (frente = -z), juntada em 2 materiais: madeira e genuflexório. */
function pewGeometry(L: number) {
  const wood: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0) => { g.rotateX(rx); g.translate(x, y, z); wood.push(boxUV(g)); };
  add(new THREE.BoxGeometry(L, 0.055, 0.44), 0, 0.46, 0.0, 0.04);
  add(new THREE.BoxGeometry(L, 0.62, 0.045), 0, 0.84, 0.25, -0.12);
  add(new THREE.BoxGeometry(L, 0.06, 0.1), 0, 1.17, 0.3);
  add(new THREE.BoxGeometry(L, 0.16, 0.12), 0, 0.82, 0.36);   // porta-livros atrás
  add(new THREE.BoxGeometry(L, 0.08, 0.05), 0, 0.2, 0.2);      // travessa baixa
  // cabeceiras: perfil com voluta
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0); s.lineTo(0.36, 0); s.lineTo(0.36, 1.12); s.quadraticCurveTo(0.36, 1.24, 0.24, 1.24);
  s.lineTo(0.12, 1.24); s.quadraticCurveTo(0.02, 1.0, -0.08, 0.86); s.quadraticCurveTo(-0.24, 0.78, -0.28, 0.66);
  s.quadraticCurveTo(-0.33, 0.6, -0.3, 0.5); s.lineTo(-0.3, 0);
  [-1, 1].forEach(sd => {
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 6 });
    g.rotateY(-Math.PI / 2); g.translate(sd * (L / 2) + 0.035, 0, 0); wood.push(boxUV(g));
  });
  const kneel = boxUV(new THREE.BoxGeometry(L - 0.12, 0.09, 0.2)); kneel.translate(0, 0.14, -0.56);
  const kRail = boxUV(new THREE.BoxGeometry(L - 0.12, 0.05, 0.05)); kRail.translate(0, 0.07, -0.56);
  const W = mergeGeometries(wood.map(g => g.index ? g.toNonIndexed() : g)), Kn = mergeGeometries([kneel.toNonIndexed(), kRail.toNonIndexed()]);
  return { W, Kn };
}

export function buildInterior(G: THREE.Group): Interior {
  const solids: THREE.Object3D[] = [], floors: THREE.Object3D[] = [];
  const F = new Flowers(5);
  const I = new THREE.Group(); I.name = 'interior'; G.add(I);
  const pla = M.plaster(), trim = M.concreteTrim();

  // ---------- bancos ----------
  const { W: pw, Kn } = pewGeometry(PEW.len);
  const xf: THREE.Matrix4[] = [], o = new THREE.Object3D();
  PEW.rows.forEach(z => [-1, 1].forEach(s => { o.position.set(s * PEW.x, FLOOR, z); o.rotation.set(0, 0, 0); o.updateMatrix(); xf.push(o.matrix.clone()); }));
  const pewIm = new THREE.InstancedMesh(pw, M.pew(), xf.length), knIm = new THREE.InstancedMesh(Kn, velvet(), xf.length);
  xf.forEach((m, i) => { pewIm.setMatrixAt(i, m); knIm.setMatrixAt(i, m); });
  [pewIm, knIm].forEach(m => { m.castShadow = m.receiveShadow = true; m.computeBoundingSphere(); I.add(m); });
  // colisão dos bancos: caixas invisíveis (mais leves que a malha detalhada)
  const pewBox = new THREE.BoxGeometry(PEW.len, 1.2, 0.8);
  PEW.rows.forEach(z => [-1, 1].forEach(s => { const b = new THREE.Mesh(pewBox, new THREE.MeshBasicMaterial({ visible: false })); b.position.set(s * PEW.x, FLOOR + 0.6, z + 0.05); b.userData.ns = 1; I.add(b); solids.push(b); }));
  // laços e buquês nas cabeceiras do corredor
  PEW.rows.forEach(z => [-1, 1].forEach(s => {
    const x = s * (PEW.x - PEW.len / 2) - s * 0.06;
    F.bunch(x, FLOOR + 1.05, z + 0.1, 0.11, 9, 1.4);
    cube(0.02, 0.5, 0.08, x - s * 0.03, FLOOR + 0.8, z + 0.1, M.fabric(), I);
  }));

  // ---------- passadeira branca e pétalas ----------
  const run = mesh(boxUV(new THREE.BoxGeometry(1.3, 0.012, NZ - CHANCEL.z1 - 0.6 + NZ)), M.fabric(), 0, FLOOR + 0.008, (NZ + CHANCEL.z1 + 0.6) / 2 - 0.3, I); run.castShadow = false;
  F.scatterPetals(-0.6, 0.6, CHANCEL.z1 + 0.6, NZ - 0.4, FLOOR + 0.018, 120);
  F.scatterPetals(-1.1, 1.1, CHANCEL.z1 + 0.6, NZ - 0.4, FLOOR + 0.008, 50);

  // lanternas com velas no chão, ao longo do corredor
  { const lan: { x: number; y: number; z: number; ry: number; s: number }[] = [];
    PEW.rows.forEach((z, i) => { if (i % 2) return; [-1, 1].forEach(s => lan.push({ x: s * 1.0, y: FLOOR, z: z - 0.35, ry: i * 0.7 + s, s: 0.75 })); });
    instance('wooden_lantern_01', lan, I).catch(() => {});
    const flame = new THREE.MeshBasicMaterial({ color: 0xffa850 }); K.M.lamps.push(flame);
    const fg = new THREE.SphereGeometry(0.022, 6, 6); fg.scale(1, 1.8, 1);
    const fl = new THREE.InstancedMesh(fg, flame, lan.length), oo = new THREE.Object3D();
    lan.forEach((l, i) => { oo.position.set(l.x, FLOOR + 0.12, l.z); oo.updateMatrix(); fl.setMatrixAt(i, oo.matrix); halo(l.x, FLOOR + 0.14, l.z, 0.28); });
    fl.userData.ns = 1; I.add(fl); }

  // Via-Sacra: quadros antigos nas pilastras
  { let n = 1;
    [-1, 1].forEach(s => [-6, -2, 2].forEach(z => {
      const g = new THREE.Group(); g.position.set(s * (NX - 0.24), FLOOR + 2.55, z); g.rotation.y = -s * Math.PI / 2; I.add(g);
      cube(0.5, 0.62, 0.05, 0, 0, 0, M.woodBeam(), g);
      const pm = new THREE.MeshStandardMaterial({ map: oldPainting(n++), roughness: 0.45, envMapIntensity: 0.6 });
      const pnl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), pm); pnl.position.z = 0.027; g.add(pnl);
      cube(0.08, 0.08, 0.04, 0, 0.36, 0.01, brass(), g); // pequena cruz/plaqueta no topo
    })); }

  // velas nos peitoris das janelas (cera, chama, halo) — sem luz própria: o brilho vem do bloom
  { const wax = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.55, emissive: 0x3a2410, emissiveIntensity: 0.6, envMapIntensity: 0.4 });
    const flame = new THREE.MeshBasicMaterial({ color: 0xffb060 }); K.M.lamps.push(flame);
    const cg = new THREE.CylinderGeometry(0.032, 0.035, 1, 12); cg.translate(0, 0.5, 0);
    const fg = new THREE.SphereGeometry(0.014, 6, 6); fg.scale(1, 2, 1);
    const cand: THREE.Matrix4[] = [], fl: THREE.Matrix4[] = [], oo = new THREE.Object3D();
    [-1, 1].forEach(s => WIN_Z.forEach((z, i) => [-0.32, 0, 0.3].forEach((dz, k) => {
      const h = [0.22, 0.32, 0.17][(k + i) % 3], x = s * (NX + 0.07), y = FLOOR + WIN.sill + 0.0;
      oo.position.set(x, y, z + dz); oo.scale.set(1, h, 1); oo.updateMatrix(); cand.push(oo.matrix.clone());
      oo.position.set(x, y + h + 0.025, z + dz); oo.scale.set(1, 1, 1); oo.updateMatrix(); fl.push(oo.matrix.clone());
      halo(x, y + h + 0.03, z + dz, 0.22);
    })));
    const ci = new THREE.InstancedMesh(cg, wax, cand.length); cand.forEach((m, i) => ci.setMatrixAt(i, m)); ci.castShadow = true; ci.receiveShadow = true; I.add(ci);
    const fi = new THREE.InstancedMesh(fg, flame, fl.length); fl.forEach((m, i) => fi.setMatrixAt(i, m)); fi.userData.ns = 1; I.add(fi); }

  // ---------- presbitério ----------
  const st = M.stoneFloor();
  const plat = cube(NX * 2, CHANCEL.h, CHANCEL.z1 - CHANCEL.z0, 0, FLOOR + CHANCEL.h / 2, (CHANCEL.z0 + CHANCEL.z1) / 2, [trim, trim, st, trim, trim, trim], I);
  const step = cube(7, CHANCEL.h / 2, 0.6, 0, FLOOR + CHANCEL.h / 4, CHANCEL.z1 + 0.3, [trim, trim, st, trim, trim, trim], I);
  floors.push(plat, step);
  const PZ = CHANCEL.z1, PY = FLOOR + CHANCEL.h;
  // balaustrada (mesa de comunhão) com abertura central
  const balGeo = new THREE.LatheGeometry([[0.035, 0], [0.05, 0.05], [0.03, 0.12], [0.055, 0.32], [0.03, 0.5], [0.045, 0.56], [0.045, 0.6]].map(([x, y]) => new THREE.Vector2(x, y)), 8);
  const bals: THREE.Matrix4[] = [];
  [-1, 1].forEach(s => {
    for (let x = 1.3; x <= NX - 0.2; x += 0.22) { o.position.set(s * x, PY, PZ + 0.15); o.rotation.set(0, 0, 0); o.updateMatrix(); bals.push(o.matrix.clone()); }
    cube(NX - 1.25, 0.08, 0.2, s * (NX + 1.25) / 2, PY + 0.64, PZ + 0.15, M.pew(), I);
    cube(NX - 1.25, 0.06, 0.16, s * (NX + 1.25) / 2, PY + 0.03, PZ + 0.15, M.pew(), I);
  });
  const balIm = new THREE.InstancedMesh(balGeo, M.pew(), bals.length); bals.forEach((m, i) => balIm.setMatrixAt(i, m)); balIm.castShadow = true; balIm.receiveShadow = true; I.add(balIm);

  // altar de pedra com toalha
  const AZ = -9.3;
  const altar = cube(2.5, 1.0, 0.95, 0, PY + 0.5, AZ, trim, I); solids.push(altar);
  cube(2.7, 0.08, 1.1, 0, PY + 1.04, AZ, trim, I);
  cube(2.74, 0.015, 1.16, 0, PY + 1.085, AZ, M.fabric(), I);
  cube(2.74, 0.42, 0.01, 0, PY + 0.88, AZ + 0.58, M.fabric(), I);
  cube(0.5, 0.42, 0.012, 0, PY + 0.88, AZ + 0.592, velvet(), I); // faixa central
  // cruz grande de madeira e dossel de veludo
  cube(2.6, 3.4, 0.03, 0, PY + 2.2, -NZ + 0.06, velvet(), I);
  cube(0.2, 2.6, 0.14, 0, PY + 2.25, -NZ + 0.15, M.pew(), I);
  cube(1.3, 0.2, 0.14, 0, PY + 2.95, -NZ + 0.15, M.pew(), I);
  cube(0.24, 0.24, 0.02, 0, PY + 2.95, -NZ + 0.23, brass(), I);
  // ambão (estante de leitura)
  { const a = new THREE.Group(); a.position.set(3.6, PY, -7.9); a.rotation.y = -0.3; I.add(a);
    cube(0.5, 1.05, 0.4, 0, 0.525, 0, M.pew(), a); const t = cube(0.66, 0.05, 0.5, 0, 1.12, -0.02, M.pew(), a); t.rotation.x = 0.35;
    cube(0.48, 0.3, 0.012, 0, 0.75, -0.205, velvet(), a); solids.push(a.children[0]); }
  // arranjos de flores do altar (vasos altos)
  [-1, 1].forEach(s => {
    const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.22, 0], [0.2, 0.08], [0.12, 0.5], [0.16, 0.85], [0.25, 1.0], [0.23, 1.02]].map(([x, y]) => new THREE.Vector2(x, y)), 20), trim);
    vase.position.set(s * 2.4, PY, -8.2); vase.castShadow = vase.receiveShadow = true; I.add(vase);
    F.bunch(s * 2.4, PY + 1.25, -8.2, 0.42, 70, 1.3);
  });
  F.bunch(0, PY + 1.15, AZ + 0.2, 0.2, 22, 1.1, 0.4); // arranjo baixo sobre o altar

  // ---------- coro (2º andar), escada e órgão ----------
  const LF = new THREE.Group(); LF.name = 'coro'; G.add(LF);
  const lfl = cube(NX * 2, 0.3, NZ - LOFT_Z, 0, LOFT - 0.15, (NZ + LOFT_Z) / 2, [M.woodBeam(), M.woodBeam(), M.floor(), pla, M.woodBeam(), M.woodBeam()], LF);
  lfl.userData.l = LF; floors.push(lfl);
  cube(NX * 2, 0.42, 0.34, 0, LOFT - 0.36, LOFT_Z + 0.1, M.woodBeam(), LF);
  [-3, 3].forEach(x => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, LOFT - FLOOR - 0.5, 18), trim); c.position.set(x, FLOOR + (LOFT - FLOOR - 0.5) / 2, LOFT_Z + 0.1); c.castShadow = c.receiveShadow = true; LF.add(c); solids.push(c);
    cube(0.6, 0.12, 0.6, x, FLOOR + 0.06, LOFT_Z + 0.1, trim, LF); cube(0.56, 0.18, 0.56, x, LOFT - 0.62, LOFT_Z + 0.1, trim, LF);
  });
  // balaústres do coro
  const lb: THREE.Matrix4[] = [];
  for (let x = -NX + 1.4; x <= NX - 0.15; x += 0.24) { o.position.set(x, LOFT, LOFT_Z + 0.06); o.scale.set(1, 1.5, 1); o.updateMatrix(); lb.push(o.matrix.clone()); }
  o.scale.set(1, 1, 1);
  const lbIm = new THREE.InstancedMesh(balGeo, M.pew(), lb.length); lb.forEach((m, i) => lbIm.setMatrixAt(i, m)); lbIm.castShadow = true; LF.add(lbIm);
  cube(NX * 2 - 1.3, 0.09, 0.16, 0.65, LOFT + 0.94, LOFT_Z + 0.06, M.pew(), LF);
  // escada junto à parede esquerda, subindo em direção à frente (+z)
  const nSteps = 17, rise = (LOFT - FLOOR) / nSteps, tread = 0.27, z0 = LOFT_Z - nSteps * tread, sx = -NX + 0.6;
  for (let i = 0; i < nSteps; i++) {
    const top = FLOOR + (i + 1) * rise, s = cube(1.1, rise, tread + 0.02, sx, top - rise / 2, z0 + (i + 0.5) * tread, [M.woodBeam(), M.woodBeam(), M.pew(), M.woodBeam(), M.woodBeam(), M.woodBeam()], LF);
    s.userData.l = LF; floors.push(s);
    cube(1.1, top - FLOOR - rise, 0.05, sx, FLOOR + (top - FLOOR - rise) / 2, z0 + (i + 1) * tread - 0.02, M.woodBeam(), LF);
  }
  { const sl = Math.hypot(nSteps * tread, LOFT - FLOOR), a = Math.atan2(LOFT - FLOOR, nSteps * tread);
    const r = cube(0.07, 0.07, sl, sx + 0.55, (FLOOR + LOFT) / 2 + 0.95, z0 + (nSteps * tread) / 2, M.pew(), LF); r.rotation.x = -a;
    const st2 = cube(0.08, 0.32, sl, sx + 0.58, (FLOOR + LOFT) / 2, z0 + (nSteps * tread) / 2, M.woodBeam(), LF); st2.rotation.x = -a;
    for (let i = 1; i < nSteps; i += 3) { const y = FLOOR + i * rise; const p = cube(0.04, 0.95, 0.04, sx + 0.55, y + 0.48, z0 + (i + 0.5) * tread, M.pew(), LF); void p; } }
  // órgão
  { const og = new THREE.Group(); og.position.set(0.8, LOFT, NZ - 0.75); LF.add(og);
    cube(4.4, 1.2, 1.1, 0, 0.6, 0, M.pew(), og); cube(4.6, 0.12, 1.2, 0, 1.26, 0, M.woodBeam(), og);
    cube(4.4, 3.4, 0.5, 0, 1.3 + 1.7, 0.3, M.woodBeam(), og);
    const pm = brass(), pipes: THREE.Matrix4[] = [], pg = new THREE.CylinderGeometry(0.075, 0.075, 1, 12);
    for (let i = 0; i < 19; i++) { const t = (i - 9) / 9, h = 1.4 + (1 - Math.abs(t)) ** 1.5 * 1.8; o.position.set(t * 2.0, 1.32 + h / 2, -0.02); o.scale.set(1, h, 1); o.updateMatrix(); pipes.push(o.matrix.clone()); }
    const pim = new THREE.InstancedMesh(pg, pm, pipes.length); pipes.forEach((m, i) => pim.setMatrixAt(i, m)); pim.castShadow = true; og.add(pim);
    cube(1.6, 0.08, 0.4, 0, 0.5, -0.9, M.pew(), og); cube(1.6, 0.42, 0.06, 0, 0.25, -0.9, M.woodBeam(), og);
    solids.push(og.children[0]); }
  o.scale.set(1, 1, 1);

  // ---------- modelos: candelabros, cadeiras, armário, lustres ----------
  const lamps: Promise<unknown>[] = [];
  lamps.push(place('brass_candleholders', -1.05, PY + 1.09, AZ, 0, 1, I));
  lamps.push(place('brass_candleholders', 1.05, PY + 1.09, AZ, Math.PI, 1, I));
  lamps.push(place('WoodenChair_01', 0, PY, -10.45, 0, 1, I));
  lamps.push(place('WoodenChair_01', -1.2, PY, -10.3, 0.25, 0.92, I));
  lamps.push(place('WoodenChair_01', 1.2, PY, -10.3, -0.25, 0.92, I));
  lamps.push(place('GothicCabinet_01', -NX + 0.35, PY, -9.4, Math.PI / 2, 1, I));
  Promise.all(lamps).catch(e => console.warn(e));
  const chZ = [-3.6, 0.8];
  // lustres pendurados por corrente; o grupo tem o pivô no forro para balançar como pêndulo
  const swing: THREE.Object3D[] = [];
  model('Chandelier_03').then(src => {
    const bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3()), k = 1.25 / Math.max(sz.x, sz.z);
    const ceil = 11.2, base = FLOOR + 4.9, top = base + sz.y * k;
    chZ.forEach(z => {
      const pivot = new THREE.Group(); pivot.position.set(0, ceil, z); I.add(pivot);
      const c = src.clone(true); c.scale.setScalar(k); c.position.set(0, base - bb.min.y * k - ceil, 0); pivot.add(c);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, ceil - top, 6), iron()); chain.position.y = -(ceil - top) / 2; pivot.add(chain);
      swing.push(pivot);
    });
  }).catch(e => console.warn(e));
  // luz dos lustres e das velas do altar (intensidades físicas, em candelas)
  const lights = K.M.lights;
  chZ.forEach(z => { const l = new THREE.PointLight(0xffb36b, 0, 0, 2); l.position.set(0, FLOOR + 5.15, z); I.add(l); lights.push({ l, d: 0, n: 26 }); halo(0, FLOOR + 5.2, z, 1.6); });
  [-1.05, 1.05].forEach(x => { const l = new THREE.PointLight(0xff9a50, 0, 0, 2); l.position.set(x, PY + 1.75, AZ + 0.2); I.add(l); lights.push({ l, d: 0, n: 3.2 }); halo(x, PY + 1.6, AZ, 0.9); });

  return { loft: LF, solids, floors, flowers: F, swing, group: I };
}
export { bx };
