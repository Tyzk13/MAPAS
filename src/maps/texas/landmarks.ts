// Lugares marcantes de Harlow: tribunal do condado na praça, saloon (interior), lanchonete e posto na rodovia,
// motel com o quarto 7 aberto, estação de trem e trilhos, silos de grãos, caixa-d'água, igreja batista de
// madeira (interior) com cemitério, fazenda abandonada (casa com interior, celeiro, moinho, milharal seco,
// espantalho, porão de tempestade), bombas de petróleo animadas e outdoors.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { place, instance, type Xf } from '../../core/models';
import { halo } from '../../core/kit';
import { circle, roundArch, pointedArch } from '../igreja/common';
import { MAT } from '../mexico/common';
import { wall } from '../mexico/landmarks';
import {
  Batch, mtx, rnd, pick, sign, signTexture, neonTexture, TM, shell, gableRoof, bxM, light, lod, Q, rect,
  CROP, SQ, ROW0, HWY, RAIL, CHURCH, CEMETERY, DINER, GAS, MOTEL, DEPOT, ELEVATOR, TOWERW, FARM, PUMPS, TAVERN,
} from './common';

export interface Anim { pumps: { beam: THREE.Object3D; crank: THREE.Object3D; ph: number }[]; wheel: THREE.Object3D | null; neon: { m: THREE.MeshBasicMaterial; flick: number }[]; flag: THREE.Mesh | null; doors: THREE.Object3D[] }
export interface Landmarks { solids: THREE.Object3D[]; floors: THREE.Object3D[]; roofs: THREE.Group; vttWalls: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[]; anim: Anim; lamps: THREE.MeshBasicMaterial[] }

export async function buildLandmarks(G: THREE.Group): Promise<Landmarks> {
  const m = TM();
  const B = new Batch('marcos'), D = new Batch('marcos-detalhes'), F = new Batch('marcos-pisos'), R = new Batch('marcos-telhados'), W = new Batch('marcos-vidros');
  const roofs = new THREE.Group(); roofs.name = 'telhados-marcos'; G.add(roofs);
  const vttWalls: Landmarks['vttWalls'] = [], portals: Landmarks['portals'] = [];
  const anim: Anim = { pumps: [], wheel: null, neon: [], flag: null, doors: [] };
  const lamps: THREE.MeshBasicMaterial[] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const box = (b: Batch, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, c: number, ry = 0) => b.box(mat, w, h, d, x, y, z, c, ry);
  const neon = (text: string, color: string, w: number, h: number, x: number, y: number, z: number, ry: number, flick = 0, sub?: string) => {
    const mat = new THREE.MeshBasicMaterial({ map: neonTexture(text, color, { w: 512, h: Math.round(512 * h / w), sub }), toneMapped: false });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); s.position.set(x, y, z); s.rotation.y = ry; G.add(s); lamps.push(mat); if (flick) anim.neon.push({ m: mat, flick });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.15), m.iron); back.position.set(x, y, z); back.rotation.y = ry; back.translateZ(-0.09); G.add(back);
    return s;
  };
  const sg = (text: string, w: number, h: number, x: number, y: number, z: number, ry: number, o: Parameters<typeof sign>[3] = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; G.add(s); return s; };
  const wirePts: number[] = [];

  // =====================================================================================
  // PRAÇA DO TRIBUNAL (gramado seco, caminhos, carvalhos, obelisco, mastros)
  // =====================================================================================
  {
    F.box(m.sidewalk, SQ * 2, 0.18, SQ * 2, 0, 0.09, 0, 0xb8b2a8);
    const lawn = new THREE.PlaneGeometry(SQ * 2 - 1.2, SQ * 2 - 1.2); lawn.rotateX(-Math.PI / 2); lawn.translate(0, 0.185, 0); boxUV(lawn); F.add(MAT().dirt, lawn, 0xa8a080);
    [[0, 0, 3, SQ * 2 - 1.2], [0, 0, SQ * 2 - 1.2, 3]].forEach(([x, z, w, d]) => F.box(m.sidewalk, w, 0.04, d, x, 0.2, z, 0xc8c2b8));
    const trees: Xf[] = [[13, 13], [-13, 13], [13, -13], [-13, -13], [15, 0.5], [-15, -0.5]].map(([x, z]) => ({ x, y: 0.18, z, ry: rnd() * 6, s: 0.5 + rnd() * 0.1 }));
    later(instance(lod('island_tree_01'), trees, G, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).then(ms => ms.forEach(x => (x.userData.canopy = 1))));
    later(instance('painted_wooden_bench', [[6, 16, Math.PI], [-6, 16, Math.PI], [16, 6, -Math.PI / 2], [-16, -6, Math.PI / 2]].map(([x, z, r]) => ({ x, y: 0.2, z, ry: r, s: 1.3 })), G));
    // obelisco (memorial)
    box(B, m.stone, 1.6, 0.8, 1.6, 9, 0.6, 9, 0xd0c8b8); const ob = new THREE.CylinderGeometry(0.25, 0.5, 6, 4); ob.rotateY(Math.PI / 4); ob.translate(9, 4, 9); boxUV(ob); B.add(m.stone, ob, 0xd8d0c0);
    const tip = new THREE.ConeGeometry(0.36, 0.7, 4); tip.rotateY(Math.PI / 4); tip.translate(9, 7.35, 9); B.add(m.stone, tip, 0xd8d0c0);
    // mastros com bandeira do Texas (tremula)
    box(D, m.iron, 0.1, 11, 0.1, -9, 5.5, 9, 0xc8c8c8);
    const fg = new THREE.PlaneGeometry(3.0, 2.0, 12, 6); fg.translate(1.5, 0, 0);
    const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: texasFlag(), side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(-8.95, 9.8, 9); flag.castShadow = true; G.add(flag); anim.flag = flag;

    // ---------- tribunal (2 andares, pórtico, torre do relógio e cúpula) ----------
    const W2 = 12, D2 = 8, H = 9.5, c = 0xd8c8a8;
    box(B, m.stone, W2 * 2, H, D2 * 2, 0, H / 2 + 0.6, 0, c);
    box(B, m.stone, W2 * 2 + 0.6, 0.6, D2 * 2 + 0.6, 0, 0.3, 0, 0xc0b4a0);
    box(D, m.stone, W2 * 2 + 0.5, 0.45, D2 * 2 + 0.5, 0, H + 0.6, 0, 0xe8e0d0);
    box(D, m.stone, W2 * 2 + 0.2, 0.25, D2 * 2 + 0.2, 0, 4.9, 0, 0xe8e0d0);
    box(R, m.concrete, W2 * 2 - 0.4, 0.2, D2 * 2 - 0.4, 0, H + 0.7, 0, 0x8a8a88);
    // janelas nas quatro fachadas
    const sides: [number, number, number, number][] = [[0, D2, 0, W2 * 2], [0, -D2, Math.PI, W2 * 2], [W2, 0, Math.PI / 2, D2 * 2], [-W2, 0, -Math.PI / 2, D2 * 2]];
    sides.forEach(([x, z, ry, len]) => {
      const M = mtx(x, 0, z, ry), n = Math.round(len / 2.6);
      for (let i = 0; i < n; i++) { const cx = -len / 2 + (len / n) * (i + 0.5); if (ry === 0 && Math.abs(cx) < 3) continue;
        [1.6, 6.0].forEach((y, f) => { bxM(D, m.stone, 1.3, 2.4, 0.1, cx, y + 1.1, 0.05, 0xece4d4, M); bxM(W, rnd() < 0.15 && f ? m.lit : m.glass, 1.0, 2.1, 0.08, cx, y + 1.1, 0.07, 0xffffff, M); bxM(D, m.stone, 1.5, 0.25, 0.25, cx, y + 2.45, 0.1, 0xece4d4, M); }); }
    });
    // pórtico com colunas e frontão
    for (let i = 0; i < 4; i++) { const cl = new THREE.CylinderGeometry(0.38, 0.42, 7.6, 14); cl.translate(-4.5 + i * 3, 4.4, D2 + 2.4); boxUV(cl); B.add(m.stone, cl, 0xece4d4); }
    box(B, m.stone, 11, 0.7, 3.6, 0, 8.55, D2 + 1.8, 0xece4d4);
    const ped = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-5.6, 0), new THREE.Vector2(5.6, 0), new THREE.Vector2(0, 2.2)]), { depth: 0.6, bevelEnabled: false }); ped.translate(0, 8.9, D2 + 3.0); boxUV(ped); B.add(m.stone, ped, 0xece4d4);
    for (let s = 0; s < 4; s++) F.box(m.stone, 9, 0.15 * (s + 1), 0.45, 0, 0.075 * (s + 1), D2 + 4.4 - s * 0.45, 0xd8d0c0);
    F.box(m.stone, 11, 0.6, 3.6, 0, 0.3, D2 + 1.8, 0xd0c8b8);
    box(D, m.woodDark, 2.0, 3.2, 0.12, 0, 2.2, D2 + 0.05, 0x3a2a1e);
    sg('HARLOW COUNTY COURTHOUSE', 8, 0.7, 0, 9.55, D2 + 3.62, 0, { bg: '#e8e0d0', fg: '#3a3028' });
    // torre do relógio
    const TH = H + 0.8;
    box(B, m.stone, 6, 5, 6, 0, TH + 2.5, 0, c); box(D, m.stone, 6.6, 0.4, 6.6, 0, TH + 5.2, 0, 0xe8e0d0);
    [[0, 3.02, 0], [0, -3.02, Math.PI], [3.02, 0, Math.PI / 2], [-3.02, 0, -Math.PI / 2]].forEach(([x, z, r]) => { const ck = new THREE.Mesh(new THREE.CircleGeometry(1.3, 28), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.5, emissive: 0x2a2010, emissiveMap: clockTex() })); ck.position.set(x, TH + 2.7, z); ck.rotation.y = r; G.add(ck); });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(B, m.stone, 0.4, 2.6, 0.4, Math.cos(a) * 2.2, TH + 6.7, Math.sin(a) * 2.2, 0xe8e0d0); }
    const dome = new THREE.SphereGeometry(2.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(0, TH + 8.0, 0); boxUV(dome); R.add(m.tin, dome, 0x7a9a8a);
    box(D, m.iron, 0.08, 2, 0.08, 0, TH + 11.5, 0, 0x222222);
    vttWalls.push([[-W2, -D2], [W2, -D2], [W2, D2], [-W2, D2], [-W2, -D2]]);
    light(0, 3.6, D2 + 2.4, 8, 6, 0xffc890, { vtt: 8 }); halo(0, 3.8, D2 + 2.6, 1.2);
    light(0, TH + 2.7, 3.6, 4, 2, 0xffe0b0);
  }

  // =====================================================================================
  // SALOON "Lone Star Tavern" (interior: balcão, mesa de sinuca, mesas, luminárias)
  // =====================================================================================
  {
    const { x0, x1, z0, z1 } = { ...TAVERN, x0: -52.2 }, H = 5.2, T = 0.3, cz = (z0 + z1) / 2, c = 0x6a3a2e;
    shell(B, m.boards, c, x0, z0, x1, z1, H, T, [{ side: 'E', at: cz, w: 1.8, h: 2.6 }, { side: 'E', at: cz - 5, w: 2.4, h: 2.0, sill: 0.8 }, { side: 'E', at: cz + 5, w: 2.4, h: 2.0, sill: 0.8 }, { side: 'W', at: z1 - 2.5, w: 1.0, h: 2.2 }]);
    box(B, m.boards, 0.3, 2.2, z1 - z0, x1 - 0.15, H + 1.1, cz, c);
    box(D, m.plain, 0.5, 0.3, z1 - z0 + 0.2, x1, H + 2.25, cz, 0xe0d8c8);
    box(R, m.tin, x1 - x0, 0.1, z1 - z0, (x0 + x1) / 2, H + 0.05, cz, 0xa8a098);
    F.box(m.floor as THREE.Material, x1 - x0 - 2 * T, 0.06, z1 - z0 - 2 * T, (x0 + x1) / 2, 0.03, cz);
    const ce = new THREE.PlaneGeometry(x1 - x0, z1 - z0); ce.rotateX(Math.PI / 2); ce.translate((x0 + x1) / 2, H - 0.02, cz); D.add(m.woodDark, ce, 0x5a4434);
    sg('LONE STAR TAVERN', 7, 1.1, x1 + 0.03, H + 1.0, cz, Math.PI / 2, { bg: '#2a1e18', fg: '#e8c070', border: '#e8c070', font: '"Rockwell", Georgia, serif' });
    // varanda de tábuas na frente
    box(R, m.tin, 3.2, 0.07, z1 - z0, x1 + 1.6, 3.6, cz, 0xa8a098); for (let z = z0 + 0.2; z <= z1; z += 3) box(D, m.wood, 0.16, 3.5, 0.16, x1 + 3.0, 1.75, z, 0x8a7460);
    // balcão, prateleiras e garrafas
    const bx = x0 + 2.4;
    box(B, m.woodDark, 0.7, 1.1, 10, bx, 0.55, cz - 1, 0x4a3020); box(D, m.woodDark, 0.9, 0.07, 10.2, bx, 1.14, cz - 1, 0x2a1810);
    box(D, m.woodDark, 0.35, 2.4, 9, x0 + T + 0.2, 2.3, cz - 1, 0x3a2418); [1.6, 2.3, 3.0].forEach(y => box(D, m.woodDark, 0.4, 0.04, 9, x0 + T + 0.35, y, cz - 1, 0x2a1810));
    const bott: THREE.Matrix4[] = []; [1.62, 2.32, 3.02].forEach(y => { for (let z = cz - 5.2; z < cz + 3.2; z += 0.15 + rnd() * 0.1) bott.push(mtx(x0 + T + 0.35, y + 0.15, z, 0, 1, 0.8 + rnd() * 0.5)); });
    const bi = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 6), new THREE.MeshStandardMaterial({ roughness: 0.15, envMapIntensity: 1.3, transparent: true, opacity: 0.85 }), bott.length);
    bott.forEach((mm, i) => { bi.setMatrixAt(i, mm); bi.setColorAt(i, new THREE.Color(pick([0x3a2a10, 0x6a4010, 0x2a4a2a, 0x8a8a7a]))); }); bi.computeBoundingSphere(); G.add(bi);
    for (let z = cz - 5; z <= cz + 3; z += 1.2) { const st = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10); st.translate(bx + 0.9, 0.78, z); D.add(m.paint, st, 0x6a1a1a); box(D, m.iron, 0.05, 0.75, 0.05, bx + 0.9, 0.37, z, 0x222222); }
    // mesa de sinuca
    const px = (x0 + x1) / 2 + 1.5, pz = cz + 3.5;
    box(D, m.woodDark, 2.7, 0.75, 1.5, px, 0.42, pz, 0x3a2418); box(D, m.plain, 2.4, 0.04, 1.2, px, 0.81, pz, 0x1e5a32);
    later(instance('WoodenTable_01', [{ x: px + 0.5, y: 0.05, z: cz - 3.5, ry: 0.2, s: 0.6, sy: 1.35 } as Xf, { x: px - 1.2, y: 0.05, z: cz - 6, ry: 1.4, s: 0.6, sy: 1.35 } as Xf], G));
    woodChairs(D, [{ x: px + 0.5, y: 0.05, z: cz - 2.6, ry: 3.1 }, { x: px + 1.4, y: 0.05, z: cz - 3.8, ry: -1.5 }, { x: px - 1.2, y: 0.05, z: cz - 5.1, ry: 2.6 }, { x: px - 2.0, y: 0.25, z: cz - 6.4, ry: 0, tilt: 1.5 }]);
    const hl: Xf[] = [{ x: px, y: H - 1.3, z: pz }, { x: px + 0.5, y: H - 1.3, z: cz - 3.5 }, { x: bx + 0.6, y: H - 1.3, z: cz - 1 }];
    later(instance('hanging_industrial_lamp', hl.map(l => ({ ...l, ry: 0, s: 0.9 })), G));
    hl.forEach((l, i) => { light(l.x, l.y - 0.2, l.z, 6, i ? 7 : 8, 0xffa860, { vtt: 6, flick: i === 2 ? 1 : 0 }); halo(l.x, l.y - 0.05, l.z, 0.7); });
    neon('Lone Star', '#ff3040', 1.8, 0.6, x0 + T + 0.05, 3.9, cz + 4, Math.PI / 2, 0.5);
    vttWalls.push([[x1, cz - 0.9], [x1, z0], [x0, z0], [x0, z1], [x1, z1], [x1, cz + 0.9]]);
    portals.push({ p: [x1 - T / 2, cz], a: [x1 - T / 2, cz - 0.9], b: [x1 - T / 2, cz + 0.9] });
    [-1, 1].forEach(s => { const g = boxUV(new THREE.BoxGeometry(0.05, 1.1, 0.88)); g.translate(0, 0, -s * 0.44); const dd = new THREE.Mesh(g, m.woodDark); dd.position.set(x1 - 0.1, 1.45, cz + s * 0.9); dd.castShadow = true; dd.userData.swing = s; G.add(dd); anim.doors.push(dd); });
  }

  // =====================================================================================
  // RODOVIA: lanchonete, posto de gasolina, motel com o quarto 7
  // =====================================================================================
  {
    // ---------- lanchonete (diner) ----------
    const { x0, x1, z0, z1 } = DINER, H = 4.0, T = 0.25, cx = (x0 + x1) / 2;
    shell(B, m.concrete, 0xece8e0, x0, z0, x1, z1, H, T, [
      { side: 'S', at: cx, w: 1.4, h: 2.4 }, ...[-5.5, -3, 3, 5.5].map(a => ({ side: 'S' as const, at: cx + a, w: 2.2, h: 1.6, sill: 1.0 })),
      { side: 'E', at: (z0 + z1) / 2, w: 2.6, h: 1.6, sill: 1.0 }, { side: 'W', at: (z0 + z1) / 2, w: 2.6, h: 1.6, sill: 1.0 }]);
    [0.6, 2.75].forEach(y => { [z0 - 0.04, z1 + 0.04].forEach(zz => box(D, m.paint, x1 - x0 + 0.1, 0.25, 0.06, cx, y, zz, 0xb02a2a)); [x0 - 0.04, x1 + 0.04].forEach(xx => box(D, m.paint, 0.06, 0.25, z1 - z0 + 0.1, xx, y, (z0 + z1) / 2, 0xb02a2a)); });
    box(R, m.concrete, x1 - x0 + 1.6, 0.3, z1 - z0 + 1.6, cx, H + 0.15, (z0 + z1) / 2, 0xd8d4cc);
    F.box(m.floor as THREE.Material, x1 - x0 - 0.5, 0.05, z1 - z0 - 0.5, cx, 0.025, (z0 + z1) / 2, 0xd8d0c8);
    { const ck = new THREE.PlaneGeometry(x1 - x0 - 0.6, z1 - z0 - 0.6, 1, 1); ck.rotateX(-Math.PI / 2); ck.translate(cx, 0.056, (z0 + z1) / 2); const t = checkerTex(); const mm = new THREE.Mesh(ck, new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, envMapIntensity: 0.8 })); mm.receiveShadow = true; G.add(mm); }
    const ce = new THREE.PlaneGeometry(x1 - x0, z1 - z0); ce.rotateX(Math.PI / 2); ce.translate(cx, H - 0.02, (z0 + z1) / 2); D.add(m.plain, ce, 0xe8e4dc);
    // balcão com banquetas e mesas tipo "booth"
    box(B, m.paint, 9, 1.05, 0.7, cx, 0.52, z0 + 2.6, 0xd8d0c8); box(D, m.paint, 9.2, 0.06, 0.9, cx, 1.08, z0 + 2.6, 0xc03030);
    for (let x = cx - 4; x <= cx + 4; x += 1.0) { const st = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12); st.translate(x, 0.75, z0 + 3.4); D.add(m.paint, st, 0xc03030); box(D, m.iron, 0.06, 0.7, 0.06, x, 0.35, z0 + 3.4, 0xc0c0c0); }
    box(D, m.paint, 12, 1.6, 0.5, cx, 0.8, z0 + 0.6, 0xd0ccc4); later(place('CashRegister_01', cx + 3.5, 1.1, z0 + 2.6, Math.PI, 1, G));
    [-5, -2.2, 2.2, 5].forEach(a => { box(D, m.paint, 1.6, 0.06, 0.9, cx + a, 0.76, z1 - 1.2, 0xe8e0d0); box(D, m.iron, 0.08, 0.72, 0.08, cx + a, 0.37, z1 - 1.2, 0xb0b0b0); [-1, 1].forEach(s => { box(D, m.paint, 0.5, 0.45, 0.9, cx + a + s * 1.05, 0.25, z1 - 1.2, 0xa02424); box(D, m.paint, 0.15, 0.7, 0.9, cx + a + s * 1.3, 0.8, z1 - 1.2, 0xa02424); }); });
    [cx - 3, cx + 3].forEach((x, i) => { light(x, H - 0.4, (z0 + z1) / 2, 6, 8 - i, 0xfff0d8, { vtt: 7 }); halo(x, H - 0.2, (z0 + z1) / 2, 0.6); });
    neon("Dot's Diner", '#ff4a6a', 6, 1.6, cx, H + 1.3, z1 - 0.1, 0, 0, 'OPEN 24 HRS');
    F.box(m.sidewalk, x1 - x0 + 4, 0.12, 4, cx, 0.06, z1 + 2, 0xb8b2a8);
    vttWalls.push([[cx - 0.7, z1], [x0, z1], [x0, z0], [x1, z0], [x1, z1], [cx + 0.7, z1]]); portals.push({ p: [cx, z1 - T / 2], a: [cx - 0.7, z1 - T / 2], b: [cx + 0.7, z1 - T / 2] });
    later(instance('wooden_picnic_table', [{ x: x1 + 3, y: 0, z: z1 - 2, ry: 0.3, s: 0.8 }], G));

    // ---------- posto ----------
    const { x: gx, z: gz } = GAS;
    box(R, m.paint, 12, 0.6, 8, gx, 4.9, gz + 4, 0xe8e4dc); box(D, m.paint, 12.1, 0.25, 8.1, gx, 4.55, gz + 4, 0xb02a2a);
    [-3.5, 3.5].forEach(x => box(B, m.paint, 0.4, 4.6, 0.4, gx + x, 2.3, gz + 4, 0xe8e4dc));
    F.box(m.sidewalk, 10, 0.2, 2, gx, 0.1, gz + 4, 0xc8c4bc);
    [-2, 2].forEach(x => { box(B, m.paint, 0.6, 1.6, 0.45, gx + x, 1.0, gz + 4, 0xc83030); box(D, m.paint, 0.5, 0.4, 0.47, gx + x, 1.5, gz + 4, 0xf0e8d8); const hose = new THREE.TorusGeometry(0.25, 0.02, 4, 10, Math.PI); hose.translate(gx + x + 0.32, 0.9, gz + 4); D.add(m.iron, hose, 0x111111); });
    light(gx, 4.3, gz + 4, 8, 7, 0xe8f0ff, { vtt: 9 }); halo(gx - 3, 4.4, gz + 4, 1.0); halo(gx + 3, 4.4, gz + 4, 1.0);
    shell(B, m.concrete, 0xe0dcd4, gx - 5, gz - 6, gx + 5, gz - 0.5, 3.6, 0.25, [{ side: 'S', at: gx - 2, w: 1.1, h: 2.3 }, { side: 'S', at: gx + 1.8, w: 3, h: 1.5, sill: 0.9 }]);
    box(R, m.concrete, 10.6, 0.25, 6.1, gx, 3.72, gz - 3.25, 0x9a968e);
    F.box(m.floor as THREE.Material, 9.4, 0.05, 5, gx, 0.025, gz - 3.25, 0xc8c0b8);
    sg('HARLOW FUEL & BAIT', 7, 0.8, gx, 3.2, gz - 0.38, 0, { bg: '#e8e4dc', fg: '#a02424', border: '#a02424', font: '"Trebuchet MS", sans-serif' });
    box(D, m.iron, 0.25, 9, 0.25, gx + 7, 4.5, gz + 9, 0x5a5a5a); sg('GAS  $1.09', 3, 1.4, gx + 7, 8.6, gz + 9.15, 0, { bg: '#f0e8d8', fg: '#b02a2a', border: '#222' });
    later(instance('metal_jerrycan', [{ x: gx + 4.6, y: 0, z: gz - 0.1, ry: 0.4 }, { x: gx + 4.2, y: 0, z: gz + 0.1, ry: 1.5 }], G));
    vttWalls.push([[gx - 5, gz - 0.5], [gx - 5, gz - 6], [gx + 5, gz - 6], [gx + 5, gz - 0.5]]);

    // ---------- motel em L com o quarto 7 ----------
    const { x0: mx0, x1: mx1, z0: mz0 } = MOTEL, depth = 7, rz1 = mz0 + depth, rw = 4, n = Math.floor((mx1 - mx0 - 8) / rw);
    const office = { x0: mx0, x1: mx0 + 8, z0: mz0, z1: mz0 + 12 };
    shell(B, m.siding, 0xd8c8a8, office.x0, office.z0, office.x1, office.z1, 3.6, 0.25, [{ side: 'E', at: office.z1 - 3, w: 1.1, h: 2.3 }, { side: 'S', at: office.x0 + 4, w: 3, h: 1.5, sill: 0.9 }]);
    box(R, m.shingle, 9, 0.2, 13, office.x0 + 4, 3.75, office.z0 + 6, 0x6a6460);
    F.box(m.floor as THREE.Material, 7.5, 0.05, 11.5, office.x0 + 4, 0.025, office.z0 + 6, 0x9a8a78);
    box(D, m.woodDark, 0.6, 1.1, 3, office.x0 + 5.5, 0.55, office.z1 - 4, 0x4a3020);
    light(office.x0 + 4, 3.2, office.z0 + 7, 5, 5, 0xfff0d0, { vtt: 6 });
    const roomX = (i: number) => office.x1 + i * rw;
    const R7 = 6; // quarto 7 (índice 6)
    if (R7 > 0) box(B, m.siding, R7 * rw, 3.3, depth, office.x1 + R7 * rw / 2, 1.65, mz0 + depth / 2, 0xe0d0b0);
    box(B, m.siding, (n - R7 - 1) * rw, 3.3, depth, roomX(R7 + 1) + (n - R7 - 1) * rw / 2, 1.65, mz0 + depth / 2, 0xe0d0b0);
    const r7 = { x0: roomX(R7), x1: roomX(R7 + 1) };
    shell(B, m.siding, 0xe0d0b0, r7.x0, mz0, r7.x1, rz1, 3.3, 0.2, [{ side: 'S', at: r7.x0 + 1.0, w: 0.95, h: 2.15 }, { side: 'S', at: r7.x0 + 2.8, w: 1.4, h: 1.1, sill: 1.1 }]);
    box(R, m.shingle, n * rw + 0.4, 0.2, depth + 3.2, office.x1 + n * rw / 2, 3.45, mz0 + depth / 2 + 1.4, 0x6a6460);
    for (let i = 0; i < n; i++) {
      const x = roomX(i); if (i === R7) continue;
      box(D, m.woodDark, 0.95, 2.15, 0.08, x + 1.0, 1.08, rz1 + 0.04, pick([0x2a4a5a, 0x5a2a24]));
      box(W, rnd() < 0.25 ? m.lit : m.glass, 1.4, 1.1, 0.06, x + 2.8, 1.65, rz1 + 0.03, 0xffffff);
      sg(String(i + 1), 0.35, 0.3, x + 1.0, 2.45, rz1 + 0.06, 0, { bg: '#d8c890', fg: '#2a2a2a' });
    }
    sg('7', 0.35, 0.3, r7.x0 + 1.0, 2.45, rz1 + 0.06, 0, { bg: '#d8c890', fg: '#2a2a2a' });
    // porta do 7 escancarada
    { const d = new THREE.Mesh(boxUV(new THREE.BoxGeometry(0.95, 2.15, 0.06)), m.woodDark); d.geometry.translate(0.475, 1.075, 0); d.position.set(r7.x0 + 0.525, 0, rz1 - 0.1); d.rotation.y = -1.9; d.castShadow = true; G.add(d); }
    // calçada coberta com postes
    F.box(m.sidewalk, n * rw, 0.16, 3, office.x1 + n * rw / 2, 0.08, rz1 + 1.5, 0xb8b2a8);
    for (let i = 0; i <= n; i += 2) box(D, m.plain, 0.14, 3.1, 0.14, roomX(i), 1.6, rz1 + 2.8, 0xece6da);
    // interior do quarto 7: cama, criado-mudo, abajur que pisca, TV, espelho riscado
    F.box(m.floor as THREE.Material, rw - 0.4, 0.05, depth - 0.4, (r7.x0 + r7.x1) / 2, 0.025, mz0 + depth / 2, 0x6a5a4a);
    const ce7 = new THREE.PlaneGeometry(rw, depth); ce7.rotateX(Math.PI / 2); ce7.translate((r7.x0 + r7.x1) / 2, 3.28, mz0 + depth / 2); D.add(m.plain, ce7, 0xd0c8b8);
    box(D, m.woodDark, 1.6, 0.45, 2.1, r7.x0 + 2.3, 0.25, mz0 + 1.4, 0x5a3a28); box(D, m.plain, 1.55, 0.2, 2.0, r7.x0 + 2.3, 0.55, mz0 + 1.45, 0xd8d0c0); box(D, m.woodDark, 1.6, 1.0, 0.1, r7.x0 + 2.3, 0.7, mz0 + 0.3, 0x4a2a1a);
    box(D, m.woodDark, 0.5, 0.6, 0.45, r7.x0 + 0.6, 0.3, mz0 + 0.6, 0x4a3020); box(D, m.paint, 0.5, 0.45, 0.4, r7.x0 + 3.5, 1.0, mz0 + depth - 0.6, 0x2a2a2a); box(D, m.woodDark, 0.8, 0.75, 0.5, r7.x0 + 3.5, 0.38, mz0 + depth - 0.6, 0x4a3020);
    { const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshStandardMaterial({ map: mirrorTex(), roughness: 0.1, metalness: 0.6, envMapIntensity: 1.2 })); mir.position.set(r7.x1 - 0.21, 1.6, mz0 + 4.2); mir.rotation.y = -Math.PI / 2; G.add(mir); }
    light(r7.x0 + 0.6, 0.95, mz0 + 0.6, 3, 9, 0xffb070, { flick: 3, vtt: 4 }); halo(r7.x0 + 0.6, 0.9, mz0 + 0.6, 0.4);
    vttWalls.push([[r7.x0 + 0.5, rz1], [r7.x0, rz1], [r7.x0, mz0], [r7.x1, mz0], [r7.x1, rz1], [r7.x0 + 1.5, rz1]]); portals.push({ p: [r7.x0 + 1.0, rz1], a: [r7.x0 + 0.5, rz1], b: [r7.x0 + 1.5, rz1] });
    vttWalls.push([[office.x0, office.z0], [office.x1 + n * rw, mz0], [office.x1 + n * rw, rz1], [office.x1, rz1]]);
    // estacionamento e letreiro
    const lot = new THREE.PlaneGeometry(mx1 - mx0 + 4, HWY - 5 - rz1 - 3); lot.rotateX(-Math.PI / 2); lot.translate((mx0 + mx1) / 2, 0.025, (rz1 + 3 + HWY - 5) / 2); boxUV(lot); F.add(m.asphalt, lot);
    for (let i = 1; i < n; i++) { const l = new THREE.PlaneGeometry(0.12, 5); l.rotateX(-Math.PI / 2); l.translate(roomX(i), 0.035, rz1 + 5.5); D.add(m.plain, l, 0xd8d0c0); }
    box(D, m.iron, 0.4, 10, 0.4, mx1 + 2, 5, HWY - 7, 0x4a4a4a);
    neon('Starlite Motel', '#4ad0ff', 6, 2.2, mx1 + 2, 10.5, HWY - 6.75, 0);
    neon('VACANCY', '#ff3030', 3, 0.7, mx1 + 2, 8.3, HWY - 6.75, 0, 3);
    later(place('covered_car', roomX(3) + 2, 0, rz1 + 6.5, Math.PI / 2 + 0.05, 1, G));
    light(roomX(2), 2.9, rz1 + 1.5, 4, 6, 0xffe0b0, { vtt: 6 }); light(roomX(8), 2.9, rz1 + 1.5, 4, 4, 0xffe0b0, { vtt: 6 });
    for (let i = 0; i < n; i += 2) halo(roomX(i) + 2, 2.95, rz1 + 1.2, 0.5);
  }

  // =====================================================================================
  // FERROVIA: trilhos, estação, silos de grãos, caixa-d'água, passagem de nível
  // =====================================================================================
  {
    const L = 520, z = RAIL;
    const bal = new THREE.PlaneGeometry(L, 3.6); bal.rotateX(-Math.PI / 2); bal.translate(0, 0.06, z); boxUV(bal); F.add(MAT().stone, bal, 0x8a8478);
    [-0.72, 0.72].forEach(o => box(D, m.rust, L, 0.14, 0.08, 0, 0.3, z + o, 0x6a5a50));
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.14, 2.5), m.wood, Math.floor(L / 0.7)), o3 = new THREE.Object3D();
    for (let i = 0; i < ties.count; i++) { o3.position.set(-L / 2 + i * 0.7, 0.17, z); o3.rotation.y = (rnd() - 0.5) * 0.04; o3.updateMatrix(); ties.setMatrixAt(i, o3.matrix); ties.setColorAt(i, new THREE.Color(pick([0x5a4a3a, 0x4a3a2e, 0x6a5848]))); }
    ties.computeBoundingSphere(); ties.receiveShadow = true; G.add(ties);
    // passagem de nível (cruz de santo andré) na Main St
    [-5.5, 5.5].forEach(x => { box(D, m.iron, 0.12, 3.6, 0.12, x, 1.8, z + (x < 0 ? 3 : -3), 0xd8d8d8); [-0.6, 0.6].forEach(r => box(D, m.plain, 1.4, 0.22, 0.04, x, 3.3, z + (x < 0 ? 3.07 : -3.07), 0xece8e0, r)); });
    // estação
    const { x0, x1, z0, z1 } = DEPOT, H = 4.2, cx = (x0 + x1) / 2;
    shell(B, m.boards, 0xc8a050, x0, z0, x1, z1, H, 0.25, [{ side: 'N', at: cx - 4, w: 1.2, h: 2.4 }, { side: 'N', at: cx + 3, w: 1.8, h: 1.4, sill: 1.0 }, { side: 'S', at: cx, w: 1.2, h: 2.4 }], { sides: ['E', 'W'], rise: 2.2 });
    gableRoof(R, m.tin, 0x8a7a6a, x0, z0, x1, z1, H, 2.2, 'x', 1.8);
    F.box(m.floor as THREE.Material, x1 - x0 - 0.5, 0.05, z1 - z0 - 0.5, cx, 0.025, (z0 + z1) / 2, 0x9a8a78);
    F.box(m.concrete, x1 - x0 + 8, 0.6, 2.6, cx, 0.3, z0 - 1.3, 0xa8a49c);
    sg('HARLOW', 3.2, 0.8, x0 - 0.02, H + 0.9, (z0 + z1) / 2, -Math.PI / 2, { bg: '#f0e8d0', fg: '#2a2a2a' }); sg('HARLOW', 3.2, 0.8, x1 + 0.02, H + 0.9, (z0 + z1) / 2, Math.PI / 2, { bg: '#f0e8d0', fg: '#2a2a2a' });
    later(instance('painted_wooden_bench', [{ x: cx - 1, y: 0.6, z: z0 - 0.7, ry: Math.PI, s: 1.3 }, { x: cx + 5.5, y: 0.6, z: z0 - 0.7, ry: Math.PI, s: 1.3 }], G));
    light(cx, 3.2, z0 - 1.2, 5, 4, 0xffd8a0, { vtt: 6 }); halo(cx, 3.4, z0 - 0.9, 0.7);
    vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]);
    // silos de grãos (concreto) + casa de máquinas e caixas de metal
    const { x: ex, z: ez } = ELEVATOR, SH = 26;
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, b]) => { const c = new THREE.CylinderGeometry(3, 3, SH, 20); c.translate(ex + a, SH / 2, ez + b); boxUV(c); B.add(m.concrete, c, 0xd0ccc0); });
    box(B, m.tin, 6, 7, 5, ex, SH + 3.5, ez, 0xa8a8a0); gableRoof(R, m.tin, 0x8a8a84, ex - 3, ez - 2.5, ex + 3, ez + 2.5, SH + 7, 1.2, 'x', 0.3);
    sg('HARLOW CO-OP', 6, 1.2, ex, SH - 3, ez + 6.02, 0, { bg: '#d0ccc0', fg: '#3a3028' });
    [[14, -4], [14, 6]].forEach(([a, b]) => { const c = new THREE.CylinderGeometry(4, 4, 9, 20); c.translate(ex + a, 4.5, ez + b); boxUV(c); B.add(m.tin, c, 0xc0c0b8); const k = new THREE.ConeGeometry(4.2, 2, 20); k.translate(ex + a, 10, ez + b); R.add(m.tin, k, 0xb0b0a8); });
    const sp = new THREE.CylinderGeometry(0.25, 0.25, 22, 6); sp.applyMatrix4(mtx(ex + 9, SH - 4, ez + 1, 0, 1, 1, 1, 0, 0.55)); D.add(m.rust, sp, 0x8a7a6a);
    vttWalls.push([[ex - 6, ez - 6], [ex + 6, ez - 6], [ex + 6, ez + 6], [ex - 6, ez + 6], [ex - 6, ez - 6]]);
    later(instance('security_light', [{ x: ex, y: 8, z: ez + 6.1, ry: 0 }], G)); light(ex, 7.5, ez + 7, 5, 3, 0xd8f0d0, { vtt: 9 });
    // caixa-d'água
    const { x: tx, z: tz } = TOWERW, Hh = 18;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const g = new THREE.CylinderGeometry(0.14, 0.18, Hh, 6); g.applyMatrix4(mtx(tx + a * 2.6, Hh / 2, tz + b * 2.6, 0, 1, 1, 1, b * 0.05, -a * 0.05)); D.add(m.paint, g, 0xc8c8c0); });
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 4.6, 24), [new THREE.MeshStandardMaterial({ map: signTexture('HARLOW', { bg: '#d8d8d0', fg: '#1e2a4a', w: 1024, h: 160 }), roughness: 0.5, metalness: 0.3 }), m.paint, m.paint]);
    tk.position.set(tx, Hh + 2.3, tz); tk.castShadow = tk.receiveShadow = true; G.add(tk);
    const cap = new THREE.ConeGeometry(3.8, 1.8, 24); cap.translate(tx, Hh + 5.5, tz); R.add(m.paint, cap, 0xc8c8c0);
    const bl = new THREE.SphereGeometry(0.2, 8, 6); bl.translate(tx, Hh + 6.5, tz); const red = new THREE.MeshBasicMaterial({ color: 0xff2020 }); const bm = new THREE.Mesh(bl, red); G.add(bm); lamps.push(red); anim.neon.push({ m: red, flick: 4 });
  }

  // =====================================================================================
  // IGREJA BATISTA de madeira (interior) e CEMITÉRIO
  // =====================================================================================
  {
    const { x, z, w, d } = CHURCH, x0 = x - w / 2, x1 = x + w / 2, z1 = z + d / 2, z0 = z - d / 2, H = 5.2, T = 0.25;
    const win = pointedArch(1.1, 2.6);
    shell(B, m.siding, 0xf0ece4, x0, z0, x1, z1, H, T, [{ side: 'S', at: x, w: 1.8, h: 2.8 }, ...[-5, -1, 3].flatMap(o => [{ side: 'E' as const, at: z + o, w: 1.1, h: 2.6, sill: 1.3, arch: win }, { side: 'W' as const, at: z + o, w: 1.1, h: 2.6, sill: 1.3, arch: win }])], { sides: ['N', 'S'], rise: 3.6 });
    gableRoof(R, m.shingle, 0x5a5a5e, x0, z0, x1, z1, H, 3.6, 'z', 0.5);
    // campanário
    box(B, m.siding, 3, 4.6, 3, x, H + 3.6 + 0.4, z1 - 1.5, 0xf0ece4); box(D, m.plain, 3.4, 0.25, 3.4, x, H + 6.6, z1 - 1.5, 0xe0dcd4);
    const spire = new THREE.ConeGeometry(2.0, 7.5, 4); spire.rotateY(Math.PI / 4); spire.translate(x, H + 10.5, z1 - 1.5); boxUV(spire); R.add(m.shingle, spire, 0x5a5a5e);
    box(D, m.plain, 0.12, 1.4, 0.12, x, H + 14.9, z1 - 1.5, 0xe8e4dc); box(D, m.plain, 0.7, 0.12, 0.12, x, H + 15.1, z1 - 1.5, 0xe8e4dc);
    W.add(m.lit, (() => { const g = new THREE.CircleGeometry(0.6, 20); g.translate(x, H + 1.9, z1 + 0.01); return g; })());
    F.box(m.floor as THREE.Material, w - 2 * T, 0.3, d - 2 * T, x, 0.15, z, 0x9a8a78);
    for (let s = 0; s < 3; s++) F.box(m.wood, 3, 0.1 * (s + 1), 0.4, x, 0.05 * (s + 1), z1 + 1.1 - s * 0.4, 0x8a7a68);
    const ce = new THREE.PlaneGeometry(w, d); ce.rotateX(Math.PI / 2); ce.translate(x, H - 0.02, z); D.add(m.plain, ce, 0xe8e4dc);
    for (let r = 0; r < 7; r++) [-1, 1].forEach(s => { const pz = z1 - 3 - r * 1.4; box(D, m.wood, 3.2, 0.07, 0.42, x + s * 2.2, 0.75, pz, 0x8a6a4a); box(D, m.wood, 3.2, 0.5, 0.06, x + s * 2.2, 1.05, pz + 0.22, 0x8a6a4a); });
    box(D, m.wood, 1.2, 1.1, 0.7, x, 0.85, z0 + 2.6, 0x6a4a34); box(D, m.wood, w - 1, 0.4, 3, x, 0.5, z0 + 1.8, 0x7a5a44);
    box(D, m.woodDark, 0.15, 2.6, 0.1, x, 2.9, z0 + T + 0.08, 0x3a2418); box(D, m.woodDark, 1.4, 0.15, 0.1, x, 3.6, z0 + T + 0.08, 0x3a2418);
    light(x, H - 0.7, z0 + 4, 5, 5, 0xffd8a0, { vtt: 7 }); light(x, H - 0.7, z1 - 5, 4, 3, 0xffd8a0, { vtt: 7 });
    vttWalls.push([[x - 0.9, z1], [x0, z1], [x0, z0], [x1, z0], [x1, z1], [x + 0.9, z1]]); portals.push({ p: [x, z1], a: [x - 0.9, z1], b: [x + 0.9, z1] });
    sg('FIRST BAPTIST CHURCH', 4.4, 0.6, x + 4.6, 1.3, z1 + 4.4, 0, { bg: '#f0ece4', fg: '#2a3a5a', sub: 'Sunday 10 AM' });
    box(D, m.wood, 0.1, 1.2, 0.1, x + 2.6, 0.6, z1 + 4.4, 0x5a4a3a); box(D, m.wood, 0.1, 1.2, 0.1, x + 6.6, 0.6, z1 + 4.4, 0x5a4a3a);
    // cemitério com cerca de ferro, lápides e cruzes
    const C = CEMETERY, posts: number[] = [];
    const fence = (ax: number, az: number, bx: number, bz: number, gap = false) => { const L2 = Math.hypot(bx - ax, bz - az), n = Math.round(L2 / 0.25); for (let i = 0; i <= n; i++) { const t = i / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t; if (gap && Math.abs(t - 0.5) * L2 < 1.4) continue; posts.push(px, 0, pz, px, 1.5, pz); } [0.2, 1.3].forEach(y => posts.push(ax, y, az, bx, y, bz)); vttWalls.push([[ax, az], [bx, bz]]); };
    fence(C.x0, C.z0, C.x1, C.z0); fence(C.x0, C.z1, C.x1, C.z1, true); fence(C.x0, C.z0, C.x0, C.z1); fence(C.x1, C.z0, C.x1, C.z1);
    const fl = new THREE.BufferGeometry(); fl.setAttribute('position', new THREE.Float32BufferAttribute(posts, 3)); G.add(Object.assign(new THREE.LineSegments(fl, new THREE.LineBasicMaterial({ color: 0x1a1a1a })), { userData: { noExport: 1 } }));
    [-1, 1].forEach(s => box(D, m.stone, 0.4, 2.2, 0.4, (C.x0 + C.x1) / 2 + s * 1.5, 1.1, C.z1, 0xb8b4ac));
    for (let gx = C.x0 + 2; gx < C.x1 - 1; gx += 2.4) for (let gz = C.z0 + 2.5; gz < C.z1 - 2; gz += 3) {
      if (rnd() < 0.15 || Math.abs(gx - (C.x0 + C.x1) / 2) < 1.2) continue;
      const tilt = (rnd() - 0.5) * 0.15, M = mtx(gx + (rnd() - 0.5) * 0.4, 0, gz, (rnd() - 0.5) * 0.1, 1, 1, 1, tilt, tilt * 0.5), k = rnd();
      if (k < 0.55) { bxM(B, m.stone, 0.7, 0.9, 0.16, 0, 0.45, 0, 0xa8a49c, M); const cap2 = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 12, 1, false, 0, Math.PI); cap2.rotateX(Math.PI / 2); cap2.rotateZ(Math.PI / 2); cap2.translate(0, 0.9, 0); cap2.applyMatrix4(M); B.add(m.stone, cap2, 0xa8a49c); }
      else if (k < 0.85) { bxM(D, m.wood, 0.1, 1.3, 0.08, 0, 0.65, 0, 0x6a5a48, M); bxM(D, m.wood, 0.6, 0.1, 0.08, 0, 0.95, 0, 0x6a5a48, M); }
      else { bxM(B, m.stone, 0.5, 1.6, 0.5, 0, 0.8, 0, 0x9a968e, M); const ob = new THREE.ConeGeometry(0.3, 0.6, 4); ob.translate(0, 1.9, 0); ob.applyMatrix4(M); B.add(m.stone, ob, 0x9a968e); }
      const mound = new THREE.SphereGeometry(0.6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2); mound.scale(1, 0.25, 1.8); mound.translate(0, 0, 1.2); mound.applyMatrix4(M); D.add(MAT().dirt, mound, 0x9a8a70);
    }
    later(instance('dead_tree_trunk', [{ x: C.x0 + 4, y: 0, z: C.z0 + 3, ry: 2, s: 1.4 }], G));
    // um túmulo aberto (terra revirada e pá) — gancho
    box(D, m.plain, 1.0, 0.02, 2.2, C.x1 - 4, 0.02, C.z0 + 4, 0x0a0806); const pile = new THREE.SphereGeometry(0.9, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2); pile.scale(1, 0.45, 1.3); pile.translate(C.x1 - 2.5, 0, C.z0 + 4); D.add(MAT().dirt, pile, 0x8a7a60);
    later(place('wooden_ladder', C.x1 - 3.6, 0, C.z0 + 4.9, 0.3, 1, G).then(o => { o.rotation.x = -1.35; }));
  }

  // =====================================================================================
  // FAZENDA abandonada: casa (interior), celeiro, moinho, milharal seco, espantalho, porão
  // =====================================================================================
  {
    const { x: fx, z: fz } = FARM, x0 = fx - 6, x1 = fx + 6, z0 = fz - 5, z1 = fz + 5, H = 6.0, T = 0.25, c = 0xc8c0b0;
    shell(B, m.rawSiding, c, x0, z0, x1, z1, H, T, [
      { side: 'W', at: fz, w: 1.0, h: 2.2 }, { side: 'W', at: fz - 3, w: 0.9, h: 1.4, sill: 0.9 }, { side: 'W', at: fz + 3, w: 0.9, h: 1.4, sill: 0.9 },
      { side: 'W', at: fz - 3, w: 0.9, h: 1.3, sill: 3.8 }, { side: 'W', at: fz + 3, w: 0.9, h: 1.3, sill: 3.8 }, { side: 'S', at: fx + 2, w: 0.9, h: 1.4, sill: 0.9 },
      { side: 'N', at: fx - 2, w: 0.9, h: 1.4, sill: 0.9 }, { side: 'E', at: fz + 2, w: 1.0, h: 2.2 }], { sides: ['N', 'S'], rise: 3.0 });
    gableRoof(R, m.shingle, 0x6a645a, x0, z0, x1, z1 - 4, H, 3.0, 'z', 0.4);   // metade do telhado caiu
    for (let zz = z1 - 3.4; zz < z1; zz += 0.9) { const b = new THREE.BoxGeometry(x1 - x0, 0.16, 0.14); b.rotateZ((rnd() - 0.5) * 0.3); b.translate(fx, H - 0.1, zz); D.add(m.woodDark, b, 0x4a3a2a); }
    for (let i = 0; i < 3; i++) { const b = new THREE.BoxGeometry(5, 0.16, 0.14); b.rotateZ(0.5 + rnd() * 0.3); b.rotateY(rnd()); b.translate(fx - 1 + i * 1.5, 1.3, z1 - 2 + rnd()); D.add(m.woodDark, b, 0x4a3a2a); }
    F.box(m.floor as THREE.Material, x1 - x0 - 0.5, 0.06, z1 - z0 - 0.5, fx, 0.03, fz, 0x8a7a6a);
    const ce = new THREE.PlaneGeometry(x1 - x0, z1 - z0 - 4); ce.rotateX(Math.PI / 2); ce.translate(fx, 3.0, fz - 2); D.add(m.wood, ce, 0x6a5a4a);
    wall(B, m.siding, z1 - z0 - 2 * T, 3.0, 0.2, [{ pts: rect(1.0, 2.1), x: 1, y: 0 }], fx + 0.5, 0, fz, Math.PI / 2, 0xb8b0a0);
    // varanda da frente
    F.box(m.wood, 3, 0.25, z1 - z0, x0 - 1.5, 0.125, fz, 0x7a6a58); box(R, m.tin, 3.2, 0.08, z1 - z0 + 0.4, x0 - 1.6, 2.9, fz, 0x8a7a6a); [-4.5, -1.5, 1.5, 4.5].forEach(o => box(D, m.wood, 0.14, 2.8, 0.14, x0 - 2.9, 1.4, fz + o, 0x6a5a48));
    // sala: círculo de giz com símbolos, velas, poltrona virada, fotos no chão
    const rc = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: chalkTex(), transparent: true, depthWrite: false, roughness: 1 }));
    rc.position.set(fx - 2.8, 0.07, fz); rc.userData.ns = 1; G.add(rc);
    const cand: THREE.Vector3[] = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cand.push(new THREE.Vector3(fx - 2.8 + Math.cos(a) * 1.45, 0.07, fz + Math.sin(a) * 1.45)); }
    const cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6).translate(0, 0.08, 0), new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.6 }), cand.length), flm = new THREE.MeshBasicMaterial({ color: 0xffb060 }); lamps.push(flm);
    const fi = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 5, 4).scale(1, 1.8, 1).translate(0, 0.2, 0), flm, cand.length), o4 = new THREE.Object3D();
    cand.forEach((p, i) => { o4.position.copy(p); o4.updateMatrix(); cm.setMatrixAt(i, o4.matrix); fi.setMatrixAt(i, o4.matrix); halo(p.x, p.y + 0.22, p.z, 0.3); }); cm.computeBoundingSphere(); fi.computeBoundingSphere(); G.add(cm, fi);
    light(fx - 2.8, 0.7, fz, 3, 9, 0xff9040, { flick: 1, vtt: 4 });
    woodChairs(D, [{ x: fx - 0.8, y: 0.3, z: fz + 2.5, ry: 2.2, tilt: 1.5 }]);
    later(place('GothicCabinet_01', x0 + 0.6, 0.06, fz + 3.6, Math.PI / 2, 1, G));
    later(instance('Rockingchair_01', [{ x: x0 - 1.0, y: 0.25, z: fz + 2.6, ry: -Math.PI / 2 }], G));
    vttWalls.push([[x0, fz - 0.5], [x0, z0], [x1, z0], [x1, fz + 1.5], [x1, fz + 2.5], [x1, z1], [x0, z1], [x0, fz + 0.5]]);
    portals.push({ p: [x0, fz], a: [x0, fz - 0.5], b: [x0, fz + 0.5] });
    // porão de tempestade (porta inclinada aberta)
    const cx2 = fx + 9, cz2 = fz + 7;
    box(B, m.concrete, 2.4, 0.5, 2.6, cx2, 0.25, cz2, 0x8a847a); box(D, m.plain, 1.8, 0.02, 2.0, cx2, 0.51, cz2, 0x050404);
    box(D, m.wood, 0.9, 0.06, 2.0, cx2 - 0.45, 0.62, cz2, 0x5a4a38, 0); const od = new THREE.BoxGeometry(0.9, 0.06, 2.0); od.translate(0.45, 0, 0); od.rotateZ(1.9); od.translate(cx2, 0.55, cz2); boxUV(od); D.add(m.wood, od, 0x5a4a38);
    // celeiro vermelho
    const bx0 = fx + 16, bx1 = fx + 30, bz0 = fz - 26, bz1 = fz - 8, BH = 6;
    shell(B, m.boards, 0x8a2a20, bx0, bz0, bx1, bz1, BH, 0.3, [{ side: 'W', at: (bz0 + bz1) / 2, w: 5, h: 4.6 }, { side: 'E', at: (bz0 + bz1) / 2, w: 2, h: 2.4 }], { sides: ['N', 'S'], rise: 4.5 });
    gableRoof(R, m.tin, 0x8a7a6a, bx0, bz0, bx1, bz1, BH, 4.5, 'z', 0.6);
    F.box(MAT().dirt, bx1 - bx0 - 0.6, 0.06, bz1 - bz0 - 0.6, (bx0 + bx1) / 2, 0.03, (bz0 + bz1) / 2, 0x9a8a68);
    for (let i = 0; i < 9; i++) box(D, m.plain, 1.2, 0.6, 0.6, bx1 - 2 + (rnd() - 0.5) * 2, 0.3 + (i % 3) * 0.6, bz0 + 2 + Math.floor(i / 3) * 0.7, 0xc8b070);
    later(place('wooden_ladder', bx0 + 4, 0, bz0 + 1.2, 0, 1.6, G));
    vttWalls.push([[bx0, (bz0 + bz1) / 2 - 2.5], [bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1], [bx0, (bz0 + bz1) / 2 + 2.5]]);
    // moinho de vento (torre treliçada + roda que gira) e tanque
    const wx = fx - 8, wz = fz - 14, WH = 11;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const g = new THREE.CylinderGeometry(0.05, 0.07, WH, 4); g.applyMatrix4(mtx(wx + a * 0.9, WH / 2, wz + b * 0.9, 0, 1, 1, 1, -b * 0.075, a * 0.075)); D.add(m.iron, g, 0x6a6a64); });
    for (let y = 1.5; y < WH; y += 2.2) { const k = 1.8 * (1 - y / WH * 0.82); [[0, k / 2], [0, -k / 2]].forEach(([, oz]) => box(D, m.iron, k, 0.04, 0.04, wx, y, wz + oz, 0x6a6a64)); [[k / 2], [-k / 2]].forEach(([ox]) => box(D, m.iron, 0.04, 0.04, k, wx + ox, y, wz, 0x6a6a64)); }
    const wheel = new THREE.Group(); wheel.position.set(wx, WH + 0.3, wz + 0.4); G.add(wheel);
    const bladeM = new THREE.MeshStandardMaterial({ color: 0x8a8a84, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 18; i++) { const bl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.4), bladeM); const a = i / 18 * Math.PI * 2; bl2.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0); bl2.rotation.z = a - Math.PI / 2; bl2.rotation.y = 0.5; wheel.add(bl2); }
    wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8).rotateX(Math.PI / 2), m.iron));
    anim.wheel = wheel;
    box(D, m.iron, 0.06, 0.06, 2.4, wx, WH + 0.3, wz - 1.0, 0x6a6a64); box(D, m.paint, 0.04, 0.9, 1.4, wx, WH + 0.4, wz - 2.2, 0x8a8a84);
    const tank = new THREE.CylinderGeometry(2.2, 2.2, 0.8, 20, 1, true); tank.translate(wx + 3, 0.4, wz + 2); B.add(m.tin, tank, 0x9a9a92); const wt = new THREE.CircleGeometry(2.15, 20); wt.rotateX(-Math.PI / 2); wt.translate(wx + 3, 0.62, wz + 2); D.add(m.plain, wt, 0x1a2420);
    // milharal seco com espantalho no meio
    const corn: THREE.Matrix4[] = [], cnt = Math.round(1600 * Q.cacti);
    for (let i = 0; i < cnt; i++) { const row = i % 30, x = fx + 14 + row * 1.2 + (rnd() - 0.5) * 0.3, z = fz + 12 + rnd() * 40; if (Math.hypot(x - CROP.x, z - CROP.z) < CROP.r) continue; corn.push(mtx(x, 0, z, rnd() * 6, 0.9 + rnd() * 0.4, 0.8 + rnd() * 0.5)); }
    // milharal em blocos de 12 m (corte por tela e por distância)
    { const cg = cornGeo(), by = new Map<string, THREE.Matrix4[]>(), pv = new THREE.Vector3();
      corn.forEach(mm => { pv.setFromMatrixPosition(mm); const k = Math.floor(pv.x / 12) + ',' + Math.floor(pv.z / 12); if (!by.has(k)) by.set(k, []); by.get(k)!.push(mm); });
      by.forEach(L2 => { const ci = new THREE.InstancedMesh(cg, m.veg, L2.length); L2.forEach((mm, i) => ci.setMatrixAt(i, mm)); ci.computeBoundingSphere(); ci.castShadow = Q.lights > 8; ci.receiveShadow = true; ci.userData.cullDist = 110; G.add(ci); }); }
    const sx = CROP.x, sz = CROP.z; box(D, m.wood, 0.12, 2.6, 0.12, sx, 1.3, sz, 0x6a5a48); box(D, m.wood, 1.8, 0.1, 0.1, sx, 2.0, sz, 0x6a5a48);
    box(D, m.plain, 0.6, 0.8, 0.3, sx, 1.75, sz, 0x6a5a40); const head = new THREE.SphereGeometry(0.22, 8, 6); head.scale(1, 1.15, 1); head.translate(sx, 2.45, sz); D.add(m.plain, head, 0xb8a888);
    const hat = new THREE.CylinderGeometry(0.2, 0.45, 0.22, 10); hat.translate(sx, 2.72, sz); D.add(m.plain, hat, 0x4a3a2a);
    [-1, 1].forEach(s => box(D, m.plain, 0.5, 0.18, 0.2, sx + s * 0.6, 1.98, sz, 0x6a5a40));
  }

  // =====================================================================================
  // BOMBAS DE PETRÓLEO (cavalinhos) e OUTDOORS
  // =====================================================================================
  for (const [px, pz, ry] of PUMPS) {
    const g = new THREE.Group(); g.position.set(px, 0, pz); g.rotation.y = ry; G.add(g);
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, p: THREE.Object3D = g) => { const mm = new THREE.Mesh(geo, mat); mm.castShadow = mm.receiveShadow = true; p.add(mm); return mm; };
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.6, roughness: 0.5 }), yel = new THREE.MeshStandardMaterial({ color: 0x9a7a2a, metalness: 0.4, roughness: 0.6 });
    add(new THREE.BoxGeometry(8, 0.4, 1.4).translate(0, 0.2, 0), m.concrete);
    [-1, 1].forEach(s => { const l = add(new THREE.BoxGeometry(0.2, 4.6, 0.2), dark); l.position.set(0.3, 2.4, s * 0.45); l.rotation.x = -s * 0.12; });
    const beam = new THREE.Group(); beam.position.set(0.3, 4.7, 0); g.add(beam);
    add(new THREE.BoxGeometry(6.2, 0.4, 0.35), yel, beam);
    const headG = new THREE.CylinderGeometry(1.2, 1.2, 0.45, 12, 1, false, -0.6, 1.2); headG.rotateX(Math.PI / 2); headG.rotateZ(Math.PI / 2); const hd = add(headG, yel, beam); hd.position.set(-3.1 + 1.1, 0, 0); hd.scale.set(1, 1, 1);
    const crank = new THREE.Group(); crank.position.set(2.8, 1.5, 0); g.add(crank);
    add(new THREE.BoxGeometry(0.3, 1.8, 0.25).translate(0, -0.6, 0), dark, crank); add(new THREE.BoxGeometry(0.9, 0.7, 0.3).translate(0, -1.3, 0.25), dark, crank);
    add(new THREE.BoxGeometry(1.0, 1.6, 1.0).translate(2.8, 0.8, -0.9), dark);
    add(new THREE.CylinderGeometry(0.03, 0.03, 4.3, 4).translate(-3.2, 2.3, 0), m.iron);
    add(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8).translate(-3.2, 0.4, 0), dark);
    anim.pumps.push({ beam, crank, ph: rnd() * 6 });
    vttWalls.push([[px - 4, pz - 0.8], [px + 4, pz - 0.8], [px + 4, pz + 0.8], [px - 4, pz + 0.8], [px - 4, pz - 0.8]].map(([a, b]) => { const dx = a - px, dz = b - pz; return [+(px + dx * Math.cos(ry) + dz * Math.sin(ry)).toFixed(2), +(pz - dx * Math.sin(ry) + dz * Math.cos(ry)).toFixed(2)] as [number, number]; }));
  }
  const billboard = (x: number, z: number, ry: number, tex: THREE.Texture) => {
    const M = mtx(x, 0, z, ry);
    [-3, 3].forEach(o => bxM(D, m.wood, 0.3, 7, 0.3, o, 3.5, -0.2, 0x6a5a48, M));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); b.position.copy(new THREE.Vector3(0, 5.5, 0).applyMatrix4(M)); b.rotation.y = ry; G.add(b);
    bxM(D, m.wood, 9.3, 4.3, 0.15, 0, 5.5, -0.1, 0x4a3a2a, M);
  };
  billboard(150, HWY + 9, -0.25, signTexture('WELCOME TO HARLOW', { bg: '#e8dcc0', fg: '#8a2a20', w: 1024, h: 456, sub: 'Pop. 812  ·  Home of the Wildcats', border: '#2a3a5a' }));
  billboard(-120, HWY - 9, Math.PI + 0.2, missingTex());
  wirePts.length = 0;

  // ---------- montar ----------
  const solids = B.build(G);
  D.build(G, { shadow: Q.lights > 8 });
  W.build(G, { shadow: false });
  const floors = F.build(G, { shadow: false });
  R.build(roofs);
  await Promise.all(P);
  return { solids, floors, roofs, vttWalls, portals, anim, lamps };
}

// ---------- geometrias e texturas por código ----------
/** cadeira de madeira simples de saloon/cozinha (tilt = tombada) */
function woodChairs(D: Batch, list: { x: number; y: number; z: number; ry: number; tilt?: number }[]) {
  const m = TM();
  list.forEach(c => {
    const M = mtx(c.x, c.y, c.z, c.ry, 1, 1, 1, 0, c.tilt ?? 0);
    const ad = (w: number, h: number, d: number, x: number, y: number, z: number) => bxM(D, m.wood, w, h, d, x, y, z, 0x7a5a40, M);
    ad(0.44, 0.05, 0.42, 0, 0.46, 0);
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([a, b]) => ad(0.04, 0.46, 0.04, a, 0.23, b));
    [-0.19, 0.19].forEach(a => ad(0.04, 0.5, 0.04, a, 0.73, -0.19)); ad(0.42, 0.1, 0.03, 0, 0.9, -0.19); ad(0.42, 0.06, 0.03, 0, 0.7, -0.19);
  });
}
function cornGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const st = new THREE.CylinderGeometry(0.015, 0.025, 2.0, 4, 1); st.translate(0, 1.0, 0); parts.push(st.toNonIndexed());
  for (let i = 0; i < 5; i++) { const l = new THREE.PlaneGeometry(0.08, 0.7, 1, 2); const p = l.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, -Math.pow((p.getY(k) + 0.35) / 0.7, 2) * 0.25); l.translate(0, 0.35, 0); l.rotateX(0.9); l.rotateY(i * 2.4); l.translate(0, 0.5 + i * 0.3, 0); parts.push(l.toNonIndexed()); }
  parts.forEach(p => p.deleteAttribute('uv'));
  const g = mergeGeos(parts);
  const p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) / 2; a[i * 3] = 0.45 + t * 0.2; a[i * 3 + 1] = 0.38 + t * 0.15; a[i * 3 + 2] = 0.22 + t * 0.08; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.computeVertexNormals();
  return g;
}
function mergeGeos(gs: THREE.BufferGeometry[]) {
  let n = 0; gs.forEach(g => (n += g.attributes.position.count));
  const pos = new Float32Array(n * 3); let o = 0; gs.forEach(g => { pos.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g;
}
function texasFlag() {
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d')!;
  g.fillStyle = '#1a2a5a'; g.fillRect(0, 0, 100, 200); g.fillStyle = '#ece8e0'; g.fillRect(100, 0, 200, 100); g.fillStyle = '#a82a2a'; g.fillRect(100, 100, 200, 100);
  g.fillStyle = '#ece8e0'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 13 : 32, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(50 + Math.cos(a) * r, 100 + Math.sin(a) * r); } g.fill();
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(40,30,20,${rnd() * 0.08})`; g.fillRect(rnd() * 300, rnd() * 200, 4, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _clock: THREE.Texture | null = null;
function clockTex() {
  if (_clock) return _clock;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#f0e8d4'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#2a2420'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#2a2420'; g.font = 'bold 14px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['XII', 'III', 'VI', 'IX'].forEach((s, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; g.fillText(s, 64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); });
  g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 - 26, 64 - 20); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 4, 64 - 44); g.stroke(); // parado às 10:01
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_clock = t);
}
function checkerTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#1a1a1a' : '#e8e4dc'; g.fillRect(x * 32, y * 32, 32, 32); }
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(90,70,50,${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 6, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2.5); return t;
}
function mirrorTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 176; const g = c.getContext('2d')!;
  g.fillStyle = '#9aa0a4'; g.fillRect(0, 0, 128, 176); g.strokeStyle = 'rgba(60,20,20,0.7)'; g.lineWidth = 3; g.font = 'bold 26px Georgia'; g.fillStyle = 'rgba(80,20,20,0.75)'; g.textAlign = 'center';
  g.fillText('SHE', 64, 52); g.fillText('CAME', 64, 80); g.fillText('BACK', 64, 108); for (let i = 0; i < 6; i++) { g.beginPath(); const x = 30 + rnd() * 70; g.moveTo(x, 112); g.lineTo(x + (rnd() - 0.5) * 6, 128 + rnd() * 40); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function chalkTex() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(235,230,220,0.8)'; g.lineCap = 'round';
  const ring = (r: number, w: number) => { g.lineWidth = w; g.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, rr = r + (rnd() - 0.5) * 4; g.lineTo(S / 2 + Math.cos(a) * rr, S / 2 + Math.sin(a) * rr); } g.stroke(); };
  ring(235, 5); ring(160, 3); ring(60, 4);
  g.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(S / 2 + Math.cos(a) * 160, S / 2 + Math.sin(a) * 160); g.lineTo(S / 2 + Math.cos(a + 2.09) * 160, S / 2 + Math.sin(a + 2.09) * 160); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.translate(S / 2 + Math.cos(a) * 198, S / 2 + Math.sin(a) * 198); g.rotate(a); g.beginPath(); g.moveTo(-8, -8); g.lineTo(8, 8); g.moveTo(-8, 8); g.lineTo(0, 0); if (i % 3 === 0) g.arc(0, 0, 9, 0, Math.PI); g.stroke(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function missingTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 456; const g = c.getContext('2d')!;
  g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, 1024, 456);
  g.fillStyle = '#1a1a1a'; g.font = 'bold 88px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.fillText('HAVE YOU SEEN', 640, 120);
  g.font = 'bold 72px "Trebuchet MS", sans-serif'; g.fillStyle = '#8a1a1a'; g.fillText('CLARA WHITLOCK?', 640, 220);
  g.font = '36px Georgia'; g.fillStyle = '#2a2a2a'; g.fillText('Missing since Oct. 31, 1986', 640, 300); g.fillText('Call Sheriff Dept. — KL5-0177', 640, 360);
  g.fillStyle = '#6a6a6a'; g.fillRect(60, 60, 240, 320); g.fillStyle = '#4a4a4a'; g.beginPath(); g.ellipse(180, 190, 70, 90, 0, 0, 7); g.fill(); g.fillRect(90, 270, 180, 110);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,250,240' : '60,40,20'},${rnd() * 0.2})`; g.fillRect(rnd() * 1024, rnd() * 456, 3 + rnd() * 14, 2 + rnd() * 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
void circle; void roundArch; void rect;
