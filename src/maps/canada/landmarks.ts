// Marcos de Greywater Falls: igreja anglicana de pedra com cemitério (túmulo de Margaret e a cova reaberta de
// Eva Pelletier), fábrica de papel com chaminé,
// ponte de treliça sobre o rio, estação, posto, lanchonete e carros dos anos 70.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { place, instance } from '../../core/models';
import { halo, mistTex } from '../../core/kit';
import { Batch, mtx, rnd, reseed, pick, TM, shell, gableRoof, light, sign, neonTexture, bxM, CHURCH, CEMETERY, MILL, RIVER, riverZ, RAIL, STATION, GAS, DINER, Q } from './common';
import { Kit, IM, canvasTex, docPlane, sigilKnow, scrawl, type Interior } from './interior';
import { paper, age } from '../texas/police';
import { groundH } from './nature';

export interface Landmarks extends Interior { smoke: THREE.Sprite[]; cars: THREE.Group }

/** carro dos anos 70 em código (sedã com rabo de peixe discreto), frente = +x local */
export function car(B: Batch, x: number, z: number, ry: number, col: number) {
  const m = TM(), I = IM(), M = mtx(x, 0, z, ry);
  bxM(B, m.paint, 5.2, 0.62, 1.95, 0, 0.62, 0, col, M);
  bxM(B, m.paint, 2.6, 0.5, 1.75, -0.3, 1.18, 0, col, M);
  bxM(B, m.glass, 2.5, 0.44, 1.78, -0.3, 1.18, 0, 0xffffff, M);
  bxM(B, m.paint, 1.9, 0.05, 1.7, -0.3, 1.45, 0, col, M);
  bxM(B, I.steel, 0.08, 0.22, 1.9, 2.62, 0.48, 0, 0xd8d8d0, M); bxM(B, I.steel, 0.08, 0.2, 1.9, -2.62, 0.5, 0, 0xd8d8d0, M);
  [[2.62, 0.62, 0.7], [2.62, 0.62, -0.7]].forEach(([a, b, c]) => bxM(B, m.lit, 0.04, 0.16, 0.22, a, b, c, 0xffffff, M));
  [[-2.62, 0.72, 0.75], [-2.62, 0.72, -0.75]].forEach(([a, b, c]) => bxM(B, m.paint, 0.04, 0.18, 0.18, a, b, c, 0x8a1a10, M));
  [[1.6, 0.92], [-1.6, 0.92], [1.6, -0.92], [-1.6, -0.92]].forEach(([a, c]) => { const g = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 14); g.rotateX(Math.PI / 2); g.translate(a, 0.36, c); g.applyMatrix4(M); B.add(m.iron, g, 0x141414); });
}

export async function buildLandmarks(G: THREE.Group): Promise<Landmarks> {
  reseed(1964);
  const m = TM(), I = IM();
  const B = new Batch('marcos'), D = new Batch('marcos-detalhes'), R = new Batch('marcos-telhados'), F = new Batch('marcos-piso'), W = new Batch('marcos-vidros');
  const roofs = new THREE.Group(); roofs.name = 'telhados-marcos'; G.add(roofs);
  const docs: Interior['docs'] = [], lamps: THREE.MeshBasicMaterial[] = [], vttWalls: Interior['vttWalls'] = [], portals: Interior['portals'] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const cars = new THREE.Group(); cars.name = 'carros'; G.add(cars);
  const outline = (x0: number, z0: number, x1: number, z1: number) => vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]);

  // ---------- igreja de St. Columba (pedra cinza, torre com agulha) ----------
  {
    const { x, z, w, d } = CHURCH, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, h = 7.5, stoneC = 0x9a968c;
    const ar = (ww: number, hh: number) => { const pts: THREE.Vector2[] = [new THREE.Vector2(-ww / 2, 0), new THREE.Vector2(ww / 2, 0), new THREE.Vector2(ww / 2, hh - ww / 2)]; for (let i = 1; i < 8; i++) { const a = i / 8 * Math.PI; pts.push(new THREE.Vector2(Math.cos(a) * ww / 2, hh - ww / 2 + Math.sin(a) * ww / 2 * 1.3)); } pts.push(new THREE.Vector2(-ww / 2, hh - ww / 2)); return pts; };
    const ops = [{ side: 'S' as const, at: x, w: 1.8, h: 3.4, arch: ar(1.8, 3.4) }, ...[z0 + 4, z0 + 9, z0 + 14].flatMap(zz => [{ side: 'W' as const, at: zz, w: 1.0, h: 3.2, sill: 2.2, arch: ar(1.0, 3.2) }, { side: 'E' as const, at: zz, w: 1.0, h: 3.2, sill: 2.2, arch: ar(1.0, 3.2) }])];
    shell(B, m.stone, stoneC, x0, z0, x1, z1, h, 0.6, ops, { sides: ['N', 'S'], rise: 5 });
    gableRoof(R, m.shingle, 0x4a4a50, x0, z0, x1, z1, h, 5, 'z', 0.5, 0.18);
    // vitrais escuros (de noite, acesos pelo lado de dentro)
    ops.filter(o => o.side !== 'S').forEach(o => { const xx = o.side === 'W' ? x0 + 0.3 : x1 - 0.3; W.box(m.lit, 0.05, 3.0, 0.9, xx, 2.2 + 1.5, o.at, 0xffffff); });
    // torre na frente (sul) com agulha
    const tx = x, tz = z1 + 2.2;
    B.box(m.stone, 4.2, 15, 4.2, tx, 7.5, tz, stoneC);
    [-1, 1].forEach(s => W.box(m.glass, 0.05, 2.2, 0.9, tx + s * 2.11, 12.5, tz, 0xffffff)); W.box(m.glass, 0.9, 2.2, 0.05, tx, 12.5, tz + 2.11, 0xffffff);
    { const c = new THREE.ConeGeometry(3.0, 12, 4); c.rotateY(Math.PI / 4); c.translate(tx, 21, tz); boxUV(c); R.add(m.shingle, c, 0x3a3e44); }
    { const cr = new THREE.BoxGeometry(0.12, 1.4, 0.12); cr.translate(tx, 27.7, tz); D.add(m.iron, cr, 0x2a2a2a); const cb = new THREE.BoxGeometry(0.7, 0.12, 0.12); cb.translate(tx, 27.9, tz); D.add(m.iron, cb, 0x2a2a2a); }
    // porta e degraus
    D.box(m.woodDark, 1.9, 3.3, 0.12, tx, 1.65, tz + 2.2, 0x3a2418);
    [0.15, 0.3].forEach((hh, i) => F.box(m.stone, 3.2, hh, 0.5, tx, hh / 2, tz + 2.6 + (1 - i) * 0.5, 0xa8a49a));
    const s = sign('ST. COLUMBA ANGLICAN CHURCH', 3.6, 0.5, { bg: '#2a2a2a', fg: '#e8e0c8', font: 'Georgia, serif', sub: 'Rev. M. Hale · Evensong 7 pm' }); s.position.set(tx + 3.2, 1.3, tz + 4.5); s.rotation.y = 0.3; G.add(s);
    D.box(m.woodDark, 0.12, 1.3, 0.12, tx + 3.2 - 1.5, 0.65, tz + 4.5, 0x3a2a1a); D.box(m.woodDark, 0.12, 1.3, 0.12, tx + 3.2 + 1.5, 0.65, tz + 4.5 - 0.9, 0x3a2a1a);
    light(tx, 3.9, tz + 2.6, 3, 4, 0xffc070, { vtt: 5 }); halo(tx, 3.9, tz + 2.5, 0.5);
    outline(x0, z0, x1, z1); outline(tx - 2.1, tz - 2.1, tx + 2.1, tz + 2.1);
  }
  // ---------- cemitério: lápides, cerca de ferro, túmulo de Margaret, cova reaberta ----------
  {
    const { x0, x1, z0, z1 } = CEMETERY;
    for (let xx = x0; xx <= x1; xx += 0.15) { D.box(m.iron, 0.03, 1.3, 0.03, xx, 0.65, z0, 0x1a1a1a); D.box(m.iron, 0.03, 1.3, 0.03, xx, 0.65, z1, 0x1a1a1a); }
    for (let zz = z0; zz <= z1; zz += 0.15) { if (Math.abs(zz - (z0 + z1) / 2) < 1.2) continue; D.box(m.iron, 0.03, 1.3, 0.03, x0, 0.65, zz, 0x1a1a1a); D.box(m.iron, 0.03, 1.3, 0.03, x1, 0.65, zz, 0x1a1a1a); }
    [[x1 - x0, (x0 + x1) / 2, z0, 'x'], [x1 - x0, (x0 + x1) / 2, z1, 'x']].forEach(([l, c, zz]) => [0.2, 1.15].forEach(y => D.box(m.iron, l as number, 0.04, 0.04, c as number, y, zz as number, 0x1a1a1a)));
    [x0, x1].forEach(xx => [0.2, 1.15].forEach(y => D.box(m.iron, 0.04, 0.04, z1 - z0, xx, y, (z0 + z1) / 2, 0x1a1a1a)));
    const stone = (gx: number, gz: number, w: number, hh: number, tilt: number, c: number) => { const g = new THREE.BoxGeometry(w, hh, 0.14); const top = new THREE.CylinderGeometry(w / 2, w / 2, 0.14, 12, 1, false, 0, Math.PI); top.rotateX(Math.PI / 2); top.rotateZ(-Math.PI / 2); top.rotateZ(Math.PI / 2); top.translate(0, hh / 2, 0); [g, top].forEach(q => { q.rotateX(tilt); q.translate(gx, groundH(gx, gz) + hh / 2, gz); boxUV(q); B.add(m.stone, q, c); }); };
    for (let zz = z0 + 3; zz < z1 - 2; zz += 3.2) for (let xx = x0 + 2.5; xx < x1 - 1.5; xx += 2.6) { if (Math.abs(zz - (z0 + z1) / 2) < 2 && Math.abs(xx - x1 + 5) < 3) continue; stone(xx + (rnd() - 0.5) * 0.4, zz, 0.6 + rnd() * 0.3, 0.7 + rnd() * 0.5, (rnd() - 0.5) * 0.2, pick([0x8a8680, 0x7a7670, 0x9a968e, 0x6a6862])); }
    // túmulo de Margaret Ashdown (lírios frescos) e cova de Eva Pelletier reaberta
    const mx = x1 - 5, mz = (z0 + z1) / 2 + 1.4;
    stone(mx, mz, 0.9, 1.1, 0, 0xb8b4aa);
    docPlane(G, docs, canvasTex(360, 440, g => { g.fillStyle = '#b8b4aa'; g.fillRect(0, 0, 360, 440); for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '60,60,55' : '230,230,220'},${rnd() * 0.15})`; g.fillRect(rnd() * 360, rnd() * 440, 3, 3); } g.fillStyle = '#3a3832'; g.textAlign = 'center'; g.font = 'bold 34px Georgia'; g.fillText('MARGARET', 180, 110); g.fillText('ASHDOWN', 180, 154); g.font = '24px Georgia'; g.fillText('née Lafleur', 180, 196); g.fillText('1943 — 1974', 180, 250); g.font = 'italic 24px Georgia'; g.fillText('Beloved wife.', 180, 310); g.fillText('"Until we meet again"', 180, 350); }), 0.82, 1.0, mx, groundH(mx, mz) + 0.6, mz + 0.075, 0, 'Lápide de Margaret Ashdown');
    for (let i = 0; i < 6; i++) { const g = new THREE.CylinderGeometry(0.006, 0.006, 0.45, 4); g.rotateZ(0.3 + rnd() * 0.3); g.translate(mx + (rnd() - 0.5) * 0.3, groundH(mx, mz) + 0.05, mz + 0.35); D.add(m.veg, g, 0x3a5a2a); const f = new THREE.SphereGeometry(0.045, 6, 4); f.translate(mx - 0.15 + i * 0.06, groundH(mx, mz) + 0.12, mz + 0.4 + (rnd() - 0.5) * 0.15); D.add(I.cloth, f, 0xf0ece0); }
    const ex = mx - 5, ez = mz + 4;
    stone(ex, ez - 1.3, 0.7, 0.9, 0.12, 0x8a8680);
    docPlane(G, docs, canvasTex(300, 360, g => { g.fillStyle = '#8a8680'; g.fillRect(0, 0, 300, 360); g.fillStyle = '#2a2824'; g.textAlign = 'center'; g.font = 'bold 30px Georgia'; g.fillText('EVA', 150, 100); g.fillText('PELLETIER', 150, 140); g.font = '22px Georgia'; g.fillText('1917 — 1975', 150, 200); g.font = 'italic 20px Georgia'; g.fillText('Her music remains', 150, 260); }), 0.64, 0.77, ex, groundH(ex, ez - 1.3) + 0.47, ez - 1.3 + 0.08, 0, 'Lápide de Eva Pelletier (cova reaberta)');
    D.box(m.plain, 1.0, 0.02, 2.0, ex, groundH(ex, ez) + 0.012, ez + 0.2, 0x1a140e);
    { const g = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(0.7, 0.5, 1.2); g.translate(ex + 1.3, groundH(ex, ez), ez + 0.2); D.add(m.plain, g, 0x3a2a1c); }
    // corda de isolamento da polícia em estacas
    const posts = [[ex - 1.0, ez - 0.9], [ex + 2.2, ez - 0.9], [ex + 2.2, ez + 1.6], [ex - 1.0, ez + 1.6]];
    posts.forEach(([a, b], i) => { D.box(m.wood, 0.05, 0.9, 0.05, a, groundH(a, b) + 0.45, b, 0x8a7050); const [c, d2] = posts[(i + 1) % 4], l = Math.hypot(c - a, d2 - b), g = new THREE.BoxGeometry(l, 0.02, 0.02); g.rotateY(-Math.atan2(d2 - b, c - a)); g.translate((a + c) / 2, groundH(a, b) + 0.82, (b + d2) / 2); D.add(m.paint, g, 0xd8b020); });
    later(place('wooden_lantern_01', ex - 1.2, groundH(ex, ez) + 0.0, ez + 1.4, 0, 1, G));
  }

  // ---------- fábrica de papel: galpões de tijolo, chaminé com fumaça, pilhas de toras, cerca ----------
  const smoke: THREE.Sprite[] = [];
  {
    const { x0, x1, z0, z1 } = MILL, brick = 0x8a6050;
    B.box(m.brick, 16, 18, 14, x0 + 8, 9, z1 + 7, brick);
    R.box(m.tin, 16.6, 0.3, 14.6, x0 + 8, 18.1, z1 + 7, 0x5a5650);
    for (let xx = x0 + 2; xx < x0 + 15; xx += 3.5) for (const yy of [4, 10, 15]) W.box(rnd() < 0.5 ? m.lit : m.glass, 1.6, 2.4, 0.06, xx, yy, z1 + 14.04, 0xffffff);
    const cx = x1 - 6, cz = z0 + 6, hc = 42;
    { const g = new THREE.CylinderGeometry(1.4, 2.4, hc, 16); g.translate(cx, hc / 2, cz); boxUV(g); B.add(m.brick, g, 0x7a5040); }
    [0.25, 0.5, 0.75].forEach(f => { const g = new THREE.CylinderGeometry(2.4 - f + 0.15, 2.4 - f + 0.15, 0.3, 16); g.translate(cx, hc * f, cz); D.add(m.iron, g, 0x2a2a2a); });
    light(cx, hc + 0.5, cz, 4, 2, 0xff2010, { flick: 4 }); halo(cx, hc + 0.6, cz, 1.2);
    const st = new THREE.SpriteMaterial({ map: mistTex(), color: 0x8a8884, transparent: true, depthWrite: false, opacity: 0.35 });
    for (let i = 0; i < (Q.lights > 8 ? 14 : 7); i++) { const sp = new THREE.Sprite(st.clone()); sp.userData = { cx, cz, y0: hc + 1, k: i / 14, ns: 1, noExport: 1 }; G.add(sp); smoke.push(sp); }
    const sg = sign('GREYWATER PULP & PAPER CO.', 22, 2.0, { bg: '#e8e0cc', fg: '#2a2a2a', font: '"Rockwell", Georgia, serif', sub: 'EST. 1898 · SAFETY FIRST' }); sg.position.set((x0 + x1) / 2 + 6, 10.2, z1 + 0.06); // fábrica por dentro: casas.ts G.add(sg);
    // pilhas de toras na margem
    const logs: THREE.BufferGeometry[] = [];
    for (let p = 0; p < 4; p++) { const px = x0 + 26 + p * 8, pz = z1 + 8; for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const g = new THREE.CylinderGeometry(0.3, 0.3, 5, 8); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); g.translate(px + (i - (5 - r) / 2) * 0.62, 0.3 + r * 0.53 + groundH(px, pz), pz); logs.push(g); } }
    logs.forEach(g => { boxUV(g); D.add(m.wood, g, 0x6a5038); });
    for (let xx = x0 - 6; xx < x1 + 8; xx += 3) D.box(m.iron, 0.05, 2.0, 0.05, xx, 1.0, z1 + 18, 0x3a3a3a);
    D.box(m.iron, x1 - x0 + 14, 0.05, 0.05, (x0 + x1) / 2 + 1, 1.9, z1 + 18, 0x3a3a3a);
    [[x0 + 10, z1 + 3], [x1 - 10, z1 + 3], [x0 + 28, z1 + 12]].forEach(([a, b]) => { light(a, 6, b, 8, 2, 0xffb070, { vtt: 9 }); halo(a, 6.2, b, 1.2); D.box(m.iron, 0.12, 6.2, 0.12, a, 3.1, b - 0.6, 0x2a2a2a); });
  }

  // ---------- ponte de treliça de aço sobre o rio (Main St) ----------
  {
    const zc = riverZ(0), L = RIVER.w + 14, zA = zc - L / 2, zB = zc + L / 2, y = 0.35, wd = 9;
    F.box(m.concrete, wd, 0.5, L, 0, y - 0.25, zc, 0x8a8680);
    F.box(m.asphalt, wd - 1.6, 0.02, L, 0, y + 0.01, zc, 0xffffff);
    [-1, 1].forEach(s => F.box(m.concrete, 0.8, 0.25, L, s * (wd / 2 - 0.4), y + 0.12, zc, 0x9a968e));
    const n = 8, hh = 5.2, xs = [-wd / 2 - 0.1, wd / 2 + 0.1];
    xs.forEach(bx => {
      D.box(m.iron, 0.3, 0.4, L, bx, y + 0.2, zc, 0x3a4048); D.box(m.iron, 0.3, 0.35, L - 6, bx, y + hh, zc, 0x3a4048);
      for (let i = 0; i <= n; i++) { const zz = zA + 3 + (L - 6) * i / n; D.box(m.iron, 0.22, hh, 0.22, bx, y + hh / 2, zz, 0x3a4048);
        if (i < n) { const z2 = zA + 3 + (L - 6) * (i + 1) / n, l = Math.hypot(z2 - zz, hh), g = new THREE.BoxGeometry(0.16, 0.16, l); g.rotateX((i % 2 ? 1 : -1) * Math.atan2(hh, z2 - zz)); g.translate(bx, y + hh / 2, (zz + z2) / 2); D.add(m.iron, g, 0x3a4048); } }
      [[zA, zA + 3], [zB - 3, zB]].forEach(([a, b], k) => { const l = Math.hypot(3, hh), g = new THREE.BoxGeometry(0.22, 0.22, l); g.rotateX((k ? -1 : 1) * Math.atan2(hh, 3)); g.translate(bx, y + hh / 2, (a + b) / 2); D.add(m.iron, g, 0x3a4048); });
    });
    for (let i = 0; i <= n; i += 2) { const zz = zA + 3 + (L - 6) * i / n; D.box(m.iron, wd + 0.4, 0.2, 0.2, 0, y + hh, zz, 0x3a4048); }
    [zA + 6, zc + 2, zB - 6].forEach(zz => { const g = new THREE.CylinderGeometry(1.0, 1.2, 4.5, 10); g.translate(0, RIVER.y - 1.2, zz); if (Math.abs(zz - zc) < 4) { B.add(m.concrete, g, 0x7a7670); } });
    const s = sign('FALLS BRIDGE · 1931 · LOAD LIMIT 10 TONS', 3.0, 0.3, { bg: '#e8e2d0', fg: '#2a2a2a' }); s.position.set(-wd / 2 - 0.3, 1.5, zB - 1.0); s.rotation.y = -Math.PI / 2; G.add(s);
    // a marmita do Moreau esquecida na mureta
    D.box(m.paint, 0.3, 0.2, 0.18, wd / 2 - 0.4, y + 0.36, zc - 3, 0x3a4a3a);
    [zA + 2, zB - 2].forEach((zz, i) => { light(i ? -4 : 4, 6.2, zz, 7, 3, 0xffc890, { vtt: 8 }); halo(i ? -4 : 4, 6.3, zz, 1.2); });
  }

  // ---------- estação de trem (madeira, plataforma, trilhos) ----------
  {
    const { x0, x1, z0, z1 } = STATION;
    shell(B, m.siding, 0x8a5a3a, x0, z0, x1, z1, 3.8, 0.18, [{ side: 'S', at: (x0 + x1) / 2, w: 1.2, h: 2.4, sill: 0.3 }, { side: 'N', at: (x0 + x1) / 2, w: 1.2, h: 2.4, sill: 0.3 }, ...[x0 + 3, x1 - 3].flatMap(xx => [{ side: 'S' as const, at: xx, w: 1.4, h: 1.6, sill: 1.0 }, { side: 'N' as const, at: xx, w: 1.4, h: 1.6, sill: 1.0 }])], { sides: ['W', 'E'], rise: 2 }, 0.3);
    gableRoof(R, m.shingle, 0x4a3a30, x0 - 2, z0 - 1, x1 + 2, z1 + 2.5, 4.1, 2.0, 'x', 0.2);
    F.box(m.wood, x1 - x0 + 30, 0.3, 4, (x0 + x1) / 2, 0.15, z1 + 2, 0x6a5a48);
    W.box(m.lit, 1.3, 1.5, 0.05, x0 + 3, 1.85, z1 - 0.1, 0xffffff); W.box(m.glass, 1.3, 1.5, 0.05, x1 - 3, 1.85, z1 - 0.1, 0xffffff);
    const s = sign('GREYWATER FALLS', 5, 0.6, { bg: '#e8e0c8', fg: '#2a1a10', border: '#2a1a10', font: 'Georgia, serif' }); s.position.set((x0 + x1) / 2, 3.7, z1 + 0.1); G.add(s);
    const s2 = sign('GREYWATER FALLS', 5, 0.6, { bg: '#e8e0c8', fg: '#2a1a10', border: '#2a1a10', font: 'Georgia, serif' }); s2.position.set((x0 + x1) / 2, 3.7, z0 - 0.1); s2.rotation.y = Math.PI; G.add(s2);
    light((x0 + x1) / 2, 3.4, z1 + 2, 6, 4, 0xffc070, { vtt: 8 }); halo((x0 + x1) / 2, 3.5, z1 + 1.5, 0.8);
    docPlane(G, docs, paper('TIMETABLE — WINTER 1975', ['Northbound 6:12 (Mon-Sat)', 'Southbound 19:48 daily', '', 'Nov 19: evening train', 'arrives 19:48 — 3 passengers', 'from Ottawa (party of agents)', '', 'Freight Tue / Fri'], { w: 360, h: 480, size: 19 }), 0.5, 0.66, x0 + 6, 1.8, z1 + 0.1, 0, 'Horário dos trens (estação)');
    outline(x0, z0, x1, z1);
    // trilhos e dormentes
    const len = 560;
    for (let t = -len / 2; t < len / 2; t += 0.7) { const g = new THREE.BoxGeometry(0.22, 0.12, 2.6); g.translate(t, groundH(t, RAIL) + 0.06, RAIL); D.add(m.wood, g, 0x4a3a2a); }
    [-0.72, 0.72].forEach(o => F.box(m.iron, len, 0.14, 0.08, 0, 0.2, RAIL + o, 0x4a4442));
  }

  // ---------- posto e lanchonete (Queen St leste) ----------
  {
    const { x, z } = GAS;
    B.box(m.plain, 7, 3.4, 5, x + 4, 1.7, z + 3, 0xe8e4d8); R.box(m.plain, 7.4, 0.25, 5.4, x + 4, 3.5, z + 3, 0x2a5a3a);
    D.box(m.plain, 9, 0.5, 6, x - 3, 4.6, z + 1, 0xe8e4d8); [-1, 1].forEach(s => D.box(m.plain, 0.3, 4.4, 0.3, x - 3 + s * 3.5, 2.2, z + 1, 0xe8e4d8));
    [-1.3, 1.3].forEach(o => { D.box(m.paint, 0.6, 1.6, 0.4, x - 3 + o, 0.8, z + 1, 0xc8302a); D.box(m.lit, 0.5, 0.3, 0.42, x - 3 + o, 1.75, z + 1, 0xffffff); });
    const s = sign('NORTHERN GAS · OIL · LUBE', 6.8, 0.6, { bg: '#2a5a3a', fg: '#f0ece0' }); s.position.set(x + 4, 3.95, z + 0.45); s.rotation.y = Math.PI; G.add(s);
    light(x - 3, 4.2, z + 1, 8, 3, 0xe8f0ff, { vtt: 9 }); halo(x - 3, 4.3, z + 1, 1.4);
    W.box(m.lit, 3.0, 1.6, 0.05, x + 3, 1.6, z + 0.48, 0xffffff);
    outline(x + 0.5, z + 0.5, x + 7.5, z + 5.5);
    const { x0, x1, z0 } = DINER;
    light((x0 + x1) / 2, 2.8, z0 - 1.2, 6, 4, 0xffa070, { vtt: 8, flick: 1 }); // a lanchonete por dentro está em casas.ts
  }
  // cabine telefônica e caixa de correio na esquina do hotel
  { D.box(m.paint, 0.95, 2.3, 0.95, 7.8, 1.15, -33, 0x8a1e1a); W.box(m.glass, 0.8, 1.4, 0.98, 7.8, 1.3, -33, 0xffffff); W.box(m.lit, 0.6, 0.15, 1.0, 7.8, 2.2, -33, 0xffffff);
    D.box(m.paint, 0.5, 1.0, 0.45, 7.8, 0.5, -35.6, 0xb02a1e); D.box(m.paint, 0.55, 0.15, 0.5, 7.8, 1.05, -35.6, 0xb02a1e); }

  // ---------- carros estacionados ----------
  const cB = new Batch('carros'), cc = [0x2a3a4a, 0x5a1e1a, 0x1a1a1a, 0x8a8a7a, 0x3a4a3a, 0xc8c0a8, 0x4a3a2a];
  [[-5.4, -20, -Math.PI / 2], [-5.4, -6, -Math.PI / 2], [5.4, 6, Math.PI / 2], [5.4, 18, Math.PI / 2], [-5.4, 44, -Math.PI / 2], [5.4, -52, Math.PI / 2], [-36, QUEEN_Z() - 3.5, 0], [-54, QUEEN_Z() + 3.5, Math.PI], [GAS.x - 3, GAS.z + 1, 0.2], [DINER.x0 + 4, DINER.z0 - 4, Math.PI], [STATION.x0 - 6, STATION.z0 - 5, 0]].forEach(([a, b, r]) => car(cB, a, b, r, pick(cc)));
  cB.build(cars, { shadow: true });

  // ---------- montar ----------
  const solids = B.build(G);
  D.build(G, { shadow: Q.lights > 8 }); W.build(G, { shadow: false }); R.build(roofs);
  const floors = F.build(G, { shadow: false });
  await Promise.all(P);
  void instance; void age;
  return { docs, solids, floors, roofs, vttWalls, portals, lamps, layers: [], smoke, cars };
}
const QUEEN_Z = () => 30;
