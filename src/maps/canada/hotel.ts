// Hotel Laurentian (1912) — a casa e o negócio de William Ashdown; o hotel aonde a cidade inteira vai. Tijolo escuro, 3 andares, esquina da Main St com a King St. Térreo: saguão com
// recepção, sala de jantar, "beverage room" (bar com entradas separadas MEN / LADIES & ESCORTS, como em
// Ontário nos anos 60), escritório do gerente e cozinha. 2º e 3º andares: corredor central e 7 quartos cada
// (x06 é o banheiro coletivo). Quarto 304 = apartamento do dono, William Ashdown; 307 = trancado (onde ele "trabalha"); porão sob a cozinha = onde
// Margaret morreu.
// Cada andar é uma camada: esconder o 3º mostra o 2º de cima (e o arrastar de personagens pisa no andar visível).
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { place } from '../../core/models';
import { halo } from '../../core/kit';
import { Batch, mtx, rnd, reseed, TM, shell, light, sign, neonTexture, bxM, HOTEL, Q, type Opening } from './common';
import { Kit, IM, canvasTex, docPlane, sigilKnow, scrawl, type Interior } from './interior';
import { paper, photo, paperDraw, age } from '../texas/police';

const X0 = HOTEL.x0, Z0 = HOTEL.z0, W = HOTEL.x1 - HOTEL.x0, D = HOTEL.z1 - HOTEL.z0;
const T = 0.35;
/** base (topo da laje) e pé-direito de cada andar */
export const LV = [{ y: 0.2, h: 4.0 }, { y: 4.4, h: 3.4 }, { y: 8.0, h: 3.4 }];
const TOP = 11.6;
const wx = (x: number) => X0 + x, wz = (z: number) => Z0 + z;
/** quartos do lado oeste (frente, Main St) e leste; z em coordenada local */
const ROOMS_W: [number, number][] = [[T, 6.5], [6.5, 13], [13, 19.5], [19.5, D - T]];
const ROOMS_E: [number, number][] = [[T, 7], [12, 19], [19, D - T]];

export async function buildHotel(G: THREE.Group): Promise<Interior> {
  reseed(1965);
  const m = TM(), I = IM();
  const docs: Interior['docs'] = [], lamps: THREE.MeshBasicMaterial[] = [], portals: Interior['portals'] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const grp = LV.map((_, k) => { const g = new THREE.Group(); g.name = 'hotel-andar-' + (k + 1); G.add(g); return g; });
  const roofs = new THREE.Group(); roofs.name = 'hotel-telhado'; G.add(roofs);
  const kits = grp.map((g, k) => new Kit(g, 'hotel' + (k + 1)));
  const EXT = grp.map((_, k) => new Batch('hotel-fachada' + (k + 1))), GL = grp.map((_, k) => new Batch('hotel-vidro' + (k + 1)));
  const R = new Batch('hotel-telhado');
  const brick = 0xb08878, trim = 0xd8d0c0, stoneC = 0xb8b0a0;
  const vtt: [number, number][][] = [];
  const outline = [[X0, Z0], [X0 + W, Z0], [X0 + W, Z0 + D], [X0, Z0 + D], [X0, Z0]] as [number, number][];

  // ---------- fachada: casca por andar, com janelas ----------
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9aa8b0, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.22, envMapIntensity: 1.4, depthWrite: false });
  const winLit = new Set<string>(['2W22.6', '2W16.25', '1W9.75', '0W9.6', '0W16.4', '0W22.7', '2S4.5', '1E15.5']);
  const opsFor = (k: number): Opening[] => {
    const o: Opening[] = [];
    const add = (side: Opening['side'], at: number, w: number, h: number, sill: number) => o.push({ side, at: side === 'N' || side === 'S' ? wx(at) : wz(at), w, h, sill });
    if (k === 0) {
      [2.2, 5.0].forEach(z => add('W', z, 1.6, 2.4, 0.9)); add('W', 13, 2.2, 3.0, 0.2); [9.6, 16.4].forEach(z => add('W', z, 2.0, 2.6, 0.9));
      [20.6, 24.8].forEach(z => add('W', z, 1.0, 2.4, 0.2)); add('W', 22.7, 1.4, 1.2, 1.6);
      [2.5, 6.5].forEach(x => add('N', x, 1.6, 2.4, 0.9)); add('N', 15.5, 1.2, 1.8, 1.1);
      add('S', 5, 1.2, 1.2, 1.6); add('S', 16, 1.2, 1.4, 1.2);
      add('E', 22.5, 1.0, 2.3, 0.2); add('E', 16, 1.2, 1.4, 1.2); add('E', 3.5, 1.2, 1.8, 1.1);
    } else {
      [3.4, 9.75, 16.25, 22.6].forEach(z => add('W', z, 1.1, 1.75, 0.8));
      [4.5, 10, 15.5].forEach(x => add('N', x, 1.1, 1.75, 0.8)); [4.5, 10, 15.5].forEach(x => add('S', x, 1.1, 1.75, 0.8));
      [3.5, 15.5, 22.5].forEach(z => add('E', z, 1.1, 1.75, 0.8)); add('E', 9.5, 1.0, 1.4, 1.6);
    }
    return o;
  };
  LV.forEach((L, k) => {
    const y0 = k === 0 ? 0 : L.y, h = (k === 2 ? TOP : LV[k + 1].y) - y0, ops = opsFor(k);
    shell(EXT[k], m.brick, brick, X0, Z0, X0 + W, Z0 + D, h, T, ops, undefined, y0);
    // por dentro: papel de parede numa casca fina com os MESMOS vãos (não tapa as janelas)
    shell(kits[k].B, I.paper, k === 0 ? 0xd0c4a4 : 0xd8ccb0, X0 + T, Z0 + T, X0 + W - T, Z0 + D - T, L.h, 0.02, ops.map(o => ({ ...o, sill: Math.max(0, o.sill! - (L.y - y0)) })), undefined, L.y);
    // vidro, caixilho, peitoril de pedra e verga em cada vão de janela (portas ficam abertas)
    ops.forEach(o => {
      const door = o.sill! < 0.5, along = o.side === 'N' || o.side === 'S';
      const face = o.side === 'N' ? Z0 : o.side === 'S' ? Z0 + D : o.side === 'W' ? X0 : X0 + W, out = o.side === 'N' || o.side === 'W' ? -1 : 1;
      const pos = (off: number, y: number, dOut: number) => along ? [o.at + off, y, face + out * dOut] : [face + out * dOut, y, o.at + off];
      const bxw = (Bt: Batch, mat: THREE.Material, w: number, h2: number, d: number, off: number, y: number, dOut: number, c: number) => { const [x, yy, z] = pos(off, y, dOut); Bt.box(mat, along ? w : d, h2, along ? d : w, x, yy, z, c); };
      const yb = y0 + o.sill!;
      bxw(EXT[k], m.stone, o.w + 0.5, 0.3, 0.5, 0, yb + o.h + 0.15, 0.1, stoneC);           // verga
      if (door) return;
      bxw(EXT[k], m.stone, o.w + 0.3, 0.1, 0.45, 0, yb - 0.05, 0.12, stoneC);              // peitoril
      bxw(GL[k], glassM, o.w, o.h, 0.02, 0, yb + o.h / 2, -T / 2, 0xffffff);                // vidro
      bxw(kits[k].D, m.woodDark, o.w, 0.06, 0.08, 0, yb + o.h * 0.55, -T / 2, 0xe8e2d4);   // travessa
      [-1, 1].forEach(s => bxw(kits[k].D, m.woodDark, 0.06, o.h, 0.1, s * (o.w / 2 - 0.03), yb + o.h / 2, -T / 2, 0xe8e2d4));
      bxw(kits[k].D, m.woodDark, o.w, 0.06, 0.1, 0, yb + o.h - 0.03, -T / 2, 0xe8e2d4);
      bxw(kits[k].D, m.woodDark, 0.05, o.h, 0.06, 0, yb + o.h / 2, -T / 2, 0xe8e2d4);
      // persiana de enrolar: em parte das janelas, meio baixada e acesa por dentro à noite
      const key = k + o.side + (along ? o.at - X0 : o.at - Z0);
      if (winLit.has(key)) { // persiana acesa: plano virado só para fora (de dentro se vê o pano)
        const g = new THREE.PlaneGeometry(o.w - 0.1, o.h * 0.42); g.rotateY({ N: Math.PI, S: 0, W: -Math.PI / 2, E: Math.PI / 2 }[o.side]); const [px, py, pz] = pos(0, yb + o.h * 0.78, -T / 2 - 0.03); g.translate(px, py, pz); kits[k].D.add(m.lit, g, 0xffffff);
        bxw(kits[k].D, I.cloth, o.w - 0.1, o.h * 0.42, 0.01, 0, yb + o.h * 0.78, -T + 0.04, 0xd8c8a0);
      } else if (rnd() < 0.55) bxw(kits[k].D, I.cloth, o.w - 0.1, o.h * (0.25 + rnd() * 0.35), 0.01, 0, yb + o.h * 0.8, -T + 0.04, 0xd8ccb0);
      // cortinas por dentro
      if (k > 0) [-1, 1].forEach(s => bxw(kits[k].D, I.cloth, 0.35, o.h + 0.5, 0.04, s * (o.w / 2 + 0.1), yb + o.h / 2 + 0.1, -T - 0.05, k === 2 ? 0x5a3a3a : 0x4a5a4a));
    });
    // friso entre os andares
    const yb = (k === 2 ? TOP : LV[k + 1].y) - 0.1;
    if (k < 2) { [[W + 0.3, X0 + W / 2, Z0 - 0.05, 0.25], [W + 0.3, X0 + W / 2, Z0 + D + 0.05, 0.25]].forEach(([w, x, z, d]) => EXT[k].box(m.stone, w, 0.22, d, x, yb, z, stoneC)); [[X0 - 0.05], [X0 + W + 0.05]].forEach(([x]) => EXT[k].box(m.stone, 0.25, 0.22, D + 0.3, x, yb, Z0 + D / 2, stoneC)); }
  });
  vtt.push(outline);

  // ---------- telhado: laje, platibanda com cornija, caixa-d'água, chaminé ----------
  R.box(m.concrete, W, 0.25, D, X0 + W / 2, TOP - 0.12, Z0 + D / 2, 0x6a6660);
  R.box(m.plain, W - 2 * T, 0.02, D - 2 * T, X0 + W / 2, TOP - 0.26, Z0 + D / 2, 0xd8d0c0); // forro do 3º andar
  [[W, 0.3, X0 + W / 2, Z0 + 0.15], [W, 0.3, X0 + W / 2, Z0 + D - 0.15]].forEach(([w, d, x, z]) => R.box(m.brick, w, 1.0, d, x, TOP + 0.5, z, brick));
  [[X0 + 0.15], [X0 + W - 0.15]].forEach(([x]) => R.box(m.brick, 0.3, 1.0, D, x, TOP + 0.5, Z0 + D / 2, brick));
  [[W + 0.6, 0.6, X0 + W / 2, Z0 - 0.1], [W + 0.6, 0.6, X0 + W / 2, Z0 + D + 0.1]].forEach(([w, d, x, z]) => R.box(m.stone, w, 0.3, d, x, TOP + 1.05, z, stoneC));
  [[X0 - 0.1], [X0 + W + 0.1]].forEach(([x]) => R.box(m.stone, 0.6, 0.3, D + 0.6, x, TOP + 1.05, Z0 + D / 2, stoneC));
  { const g = new THREE.CylinderGeometry(1.4, 1.4, 2.6, 14); g.translate(wx(16), TOP + 3.3, wz(18)); boxUV(g); R.add(m.wood, g, 0x6a5a48); const c = new THREE.ConeGeometry(1.55, 0.8, 14); c.translate(wx(16), TOP + 5.0, wz(18)); R.add(m.tin, c, 0x7a7670);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => R.box(m.iron, 0.12, 2.0, 0.12, wx(16 + a * 1.0), TOP + 1.0, wz(18 + b * 1.0), 0x3a3a3a)); }
  R.box(m.brick, 1.0, 2.6, 0.7, wx(17.5), TOP + 1.3, wz(14), brick);
  // letreiro vertical HOTEL (neon vermelho) na esquina noroeste e marquise da entrada
  { const mat = new THREE.MeshBasicMaterial({ map: neonTexture('HOTEL', '#ff3a2a', { w: 512, h: 116, font: '"Trebuchet MS", sans-serif' }), toneMapped: false }); lamps.push(mat);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.8, 0.18), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.6, roughness: 0.5 })); fr.position.set(X0 - 0.75, 8.6, Z0 + 1.2); G.add(fr);
    [1, -1].forEach(s => { const v = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.0), mat); v.position.set(X0 - 0.75, 8.6, Z0 + 1.2 + s * 0.1); v.rotation.set(0, s > 0 ? 0 : Math.PI, Math.PI / 2); G.add(v); });
    light(X0 - 1.6, 8.6, Z0 + 1.2, 6, 5, 0xff4030, { flick: 1 }); halo(X0 - 1.0, 8.6, Z0 + 1.2, 2.2); }
  { const mq = new Batch('hotel-marquise');
    mq.box(m.iron, 2.4, 0.3, 4.2, X0 - 1.2, 3.6, wz(13), 0x2a2a2c); [-1.9, 1.9].forEach(dz => mq.box(m.iron, 0.04, 0.04, 2.6, X0 - 1.2, 4.6, wz(13 + dz) , 0x2a2a2c));
    mq.build(G);
    const s = sign('HOTEL LAURENTIAN', 4.0, 0.3, { bg: '#1a1410', fg: '#e8c070', font: 'Georgia, serif' }); s.position.set(X0 - 2.43, 3.6, wz(13)); s.rotation.y = -Math.PI / 2; G.add(s);
    for (let i = 0; i < 9; i++) { const zz = wz(13) - 1.9 + i * 0.475; halo(X0 - 1.8, 3.42, zz, 0.35); }
    light(X0 - 1.3, 3.3, wz(13), 6, 7, 0xffc880, { vtt: 6 });
    const bev = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: neonTexture('Beverage Room', '#40d8ff', { w: 512, h: 100 }), toneMapped: false }));
    bev.position.set(X0 - 0.06, 3.3, wz(22.7)); bev.rotation.y = -Math.PI / 2; G.add(bev); lamps.push(bev.material as THREE.MeshBasicMaterial);
    const s1 = sign('MEN', 0.8, 0.22, { bg: '#1a1410', fg: '#e8d8b0' }); s1.position.set(X0 - 0.03, 2.8, wz(20.6)); s1.rotation.y = -Math.PI / 2; G.add(s1);
    const s2 = sign('LADIES & ESCORTS', 1.2, 0.2, { bg: '#1a1410', fg: '#e8d8b0' }); s2.position.set(X0 - 0.03, 2.8, wz(24.8)); s2.rotation.y = -Math.PI / 2; G.add(s2);
    // letras douradas nas vitrines do saguão e da sala de jantar
    const gold = (t: string, sub: string) => canvasTex(512, 160, g => { g.fillStyle = '#d8b050'; g.textAlign = 'center'; g.font = 'bold 56px Georgia'; g.fillText(t, 256, 72); g.font = 'italic 30px Georgia'; g.fillText(sub, 256, 124); });
    [[9.6, 'HOTEL', 'Laurentian · 1912'], [16.4, 'ROOMS', 'Weekly · Monthly'], [2.2, 'DINING', 'Room'], [5.0, 'SALLE', 'à manger']].forEach(([z, a, b]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.47), new THREE.MeshBasicMaterial({ map: gold(a as string, b as string), transparent: true, depthWrite: false, side: THREE.DoubleSide })); p.position.set(X0 - 0.01, 2.6, wz(z as number)); p.rotation.y = -Math.PI / 2; p.userData.ns = 1; G.add(p); }); }
  // escada de incêndio de ferro na fachada da King St (quartos 205/305)
  { const fe = new Batch('hotel-escada-incendio'), fx = wx(15.5);
    [LV[1].y, LV[2].y].forEach(y => { fe.box(m.iron, 2.6, 0.06, 1.2, fx, y - 0.03, Z0 - 0.62, 0x222222); fe.box(m.iron, 2.6, 0.04, 0.04, fx, y + 1.0, Z0 - 1.2, 0x222222); [-1.3, 1.3].forEach(dx => fe.box(m.iron, 0.04, 1.0, 1.2, fx + dx, y + 0.5, Z0 - 0.62, 0x222222)); for (let i = -1.25; i <= 1.25; i += 0.25) fe.box(m.iron, 0.02, 1.0, 0.02, fx + i, y + 0.5, Z0 - 1.2, 0x222222); });
    for (const [ya, yb, dir] of [[LV[1].y, LV[2].y, 1], [LV[1].y - 2.0, LV[1].y, -1]] as [number, number, number][]) { const n = 10; for (let i = 0; i < n; i++) fe.box(m.iron, 0.6, 0.03, 0.18, fx + dir * (-1.0 + 2.0 * i / n), ya + (yb - ya) * (i + 0.5) / n, Z0 - 0.9, 0x222222); [-1, 1].forEach(s => { const g = new THREE.BoxGeometry(2.3, 0.04, 0.04); g.rotateZ(dir * Math.atan2(yb - ya, 2.0)); g.translate(fx, (ya + yb) / 2, Z0 - 0.9 + s * 0.3); fe.add(m.iron, g, 0x222222); }); }
    fe.build(G, { shadow: true }); }

  // ---------- pisos e lajes (cada andar no seu grupo); vãos das escadas ----------
  const slab = (k: number, holes: [number, number, number, number][]) => {
    const y = LV[k].y, F = kits[k].F, x0 = T, x1 = W - T, z0 = T, z1 = D - T;
    // laje cortada em faixas: tira os retângulos dos vãos [lx0, lx1, lz0, lz1]
    const xs = [x0, x1, ...holes.flatMap(h => [h[0], h[1]])].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1]; if (b - a < 0.01) continue;
      const cx = (a + b) / 2, hs = holes.filter(h => cx > h[0] && cx < h[1]).sort((p, q) => p[2] - q[2]); let zz = z0;
      for (const h of hs) { if (h[2] > zz) F.box(k ? m.plain : m.concrete, b - a, 0.2, h[2] - zz, wx(cx), y - 0.1, wz((zz + h[2]) / 2), 0xd8d0c4); zz = h[3]; }
      if (z1 > zz) F.box(k ? m.plain : m.concrete, b - a, 0.2, z1 - zz, wx(cx), y - 0.1, wz((zz + z1) / 2), 0xd8d0c4);
    }
  };
  const ST1: [number, number, number, number] = [11.8, 18.2, 7.9, 9.6], ST2: [number, number, number, number] = [12.6, 18.2, 9.9, 11.6];
  slab(0, [[12.9, 17.3, 24.3, D - T]]); slab(1, [ST1]); slab(2, [ST2]);
  // revestimentos: tábuas nos quartos e salão, pedra no saguão, linóleo na cozinha e banheiros, passadeira vermelha
  const cover = (k: number, mat: THREE.Material, x0: number, x1: number, z0: number, z1: number, c = 0xffffff) => kits[k].F.box(mat, x1 - x0, 0.02, z1 - z0, wx((x0 + x1) / 2), LV[k].y + 0.01, wz((z0 + z1) / 2), c);
  cover(0, m.floor, T, 11, T, 7); cover(0, I.stone, T, 11, 7, 19); cover(0, m.floor, T, 11, 19, D - T, 0x8a7060); cover(0, I.lino, 11, W - T, 12, 24.3); cover(0, I.lino, 11, 12.9, 24.3, D - T); cover(0, I.lino, 17.3, W - T, 24.3, D - T); cover(0, m.floor, 11, W - T, T, 7); cover(0, I.stone, 11, W - T, 7, 12);
  [1, 2].forEach(k => {
    ROOMS_W.forEach(([a, b]) => cover(k, m.floor, T, 9, a, b)); ROOMS_E.forEach(([a, b], i) => cover(k, i === 1 ? I.lino : m.floor, 11, W - T, a, b));
    cover(k, m.floor, 9, 11, T, D - T, 0x7a6050); kits[k].F.box(I.carpet, 1.3, 0.025, D - 2 * T - 0.6, wx(10), LV[k].y + 0.02, wz(D / 2), 0x6a1e1e);
    cover(k, m.floor, 11, W - T, 7, 12, 0x7a6050);
  });
  // ---------- escadas (degraus maciços, corrimão) + rampa invisível para pisar ----------
  const floorsWalk: THREE.Object3D[][] = [[], [], []];
  const stair = (k: number, xa: number, xb: number, z0: number, z1: number, ya: number, yb: number) => {
    const n = Math.round((yb - ya) / 0.19), run = (xb - xa) / n, Bt = kits[k].D;
    for (let i = 0; i < n; i++) { const top = ya + (yb - ya) * (i + 1) / n, x = xa + run * (i + 0.5); Bt.box(m.woodDark, Math.abs(run) + 0.02, top - ya + 0.05, z1 - z0, wx(x), (top + ya) / 2 - 0.02, wz((z0 + z1) / 2), 0x5a3a24); Bt.box(I.carpet, Math.abs(run) * 0.7, 0.02, (z1 - z0) * 0.6, wx(x), top + 0.01, wz((z0 + z1) / 2), 0x6a1e1e); }
    // corrimão nos dois lados (inclinado) e balaústres
    [z0 + 0.05, z1 - 0.05].forEach(z => { const len = Math.hypot(xb - xa, yb - ya), g = new THREE.BoxGeometry(len, 0.06, 0.08); g.rotateZ(Math.atan2(yb - ya, xb - xa)); g.translate(wx((xa + xb) / 2), (ya + yb) / 2 + 0.9, wz(z)); Bt.add(m.woodDark, g, 0x3a2418);
      for (let i = 0; i <= n; i += 2) { const x = xa + run * i, top = ya + (yb - ya) * i / n; Bt.box(m.woodDark, 0.04, 0.9, 0.04, wx(x), top + 0.45, wz(z), 0x3a2418); } });
    const len = Math.hypot(xb - xa, yb - ya), rg = new THREE.PlaneGeometry(len, z1 - z0); rg.rotateX(-Math.PI / 2); rg.rotateZ(Math.sign(xb - xa) * Math.atan2(yb - ya, Math.abs(xb - xa))); rg.translate(wx((xa + xb) / 2), (ya + yb) / 2 + 0.02, wz((z0 + z1) / 2));
    const ramp = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); ramp.userData.ns = ramp.userData.noExport = 1; grp[k].add(ramp); floorsWalk[k].push(ramp);
  };
  stair(0, ST1[0], ST1[1], ST1[2], ST1[3], LV[0].y, LV[1].y);
  stair(1, ST2[1], ST2[0], ST2[2], ST2[3], LV[1].y, LV[2].y);
  // guarda-corpo em volta dos vãos
  const rail = (k: number, x0: number, x1: number, z: number) => { const y = LV[k].y; kits[k].D.box(m.woodDark, x1 - x0, 0.06, 0.08, wx((x0 + x1) / 2), y + 0.95, wz(z), 0x3a2418); for (let x = x0; x <= x1; x += 0.3) kits[k].D.box(m.woodDark, 0.04, 0.95, 0.04, wx(x), y + 0.47, wz(z), 0x3a2418); };
  rail(1, ST1[0], ST1[1], ST1[3] + 0.06); rail(1, ST1[0], ST1[1], ST1[2] - 0.06); rail(2, ST2[0], ST2[1], ST2[2] - 0.06); rail(2, ST2[0], ST2[1], ST2[3] + 0.06);

  // ---------- térreo ----------
  const K0 = kits[0], y0 = LV[0].y, h0 = LV[0].h;
  K0.wall('x', wz(7), wx(T), wx(11), y0, h0, [[wx(5.5), 1.8, 2.8]], { col: 0xd8c8a8 });
  K0.wall('x', wz(19), wx(T), wx(11), y0, h0, [[wx(9.2), 1.2, 2.4]], { col: 0xd8c8a8 });
  K0.wall('z', wx(11), wz(T), wz(D - T), y0, h0, [[wz(9.6), 2.8, 3.0], [wz(25.0), 0.9, 2.2]], { col: 0xd8c8a8 });
  K0.wall('x', wz(7), wx(11), wx(W - T), y0, h0, [[wx(14), 0.9, 2.2]], { col: 0xc8c0a8 });
  K0.wall('x', wz(12), wx(11), wx(W - T), y0, h0, [[wx(19.0), 0.9, 2.2]], { col: 0xc8c0a8 });
  vtt.push([[wx(T), wz(7)], [wx(4.6), wz(7)]], [[wx(6.4), wz(7)], [wx(11), wz(7)]], [[wx(T), wz(19)], [wx(8.6), wz(19)]], [[wx(11), wz(T)], [wx(11), wz(8.2)]], [[wx(11), wz(11)], [wx(11), wz(24.55)]], [[wx(11), wz(7)], [wx(13.55), wz(7)]], [[wx(14.45), wz(7)], [wx(W - T), wz(7)]], [[wx(11), wz(12)], [wx(18.55), wz(12)]]);
  portals.push({ p: [wx(0), wz(13)], a: [wx(0), wz(11.9)], b: [wx(0), wz(14.1)] }, { p: [wx(0), wz(20.6)], a: [wx(0), wz(20.1)], b: [wx(0), wz(21.1)] }, { p: [wx(0), wz(24.8)], a: [wx(0), wz(24.3)], b: [wx(0), wz(25.3)] });
  // saguão: balcão da recepção, quadro de chaves, poltronas, mesinha com o jornal, relógio, lustre
  { const Mx = mtx(wx(8.5), y0, wz(16), -Math.PI / 2);
    bxM(K0.D, m.woodDark, 3.6, 1.05, 0.6, 0, 0.525, 0, 0x4a2a1a, Mx); bxM(K0.D, m.woodDark, 3.8, 0.05, 0.75, 0, 1.08, 0.05, 0x2a1810, Mx);
    for (let i = -1.6; i <= 1.6; i += 0.4) bxM(K0.D, m.woodDark, 0.05, 0.9, 0.02, i, 0.5, 0.31, 0x3a2014, Mx);
    later(place('CashRegister_01', wx(8.55), y0 + 1.1, wz(17.2), -Math.PI / 2, 1, grp[0]));
    later(place('wall_clock', wx(5.6), y0 + 3.0, wz(7.09), 0, 1, grp[0]));
    // quadro de chaves (escaninhos) na parede atrás: falta a chave do 304
    docPlane(grp[0], docs, canvasTex(768, 400, g => { g.fillStyle = '#3a2416'; g.fillRect(0, 0, 768, 400); for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) { const x = 18 + c * 106, y = 20 + r * 124; g.fillStyle = '#1a100a'; g.fillRect(x, y, 96, 108); g.fillStyle = '#c8b080'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; const num = String((r + 1) * 100 + c + 1); g.fillText(num, x + 48, y + 100); const has = !(num === '304' || num === '307' || num === '106' || num === '206' || num === '306' || (r === 1 && c === 3)); if (num.endsWith('6')) { g.fillStyle = '#6a5a40'; g.font = '14px Georgia'; g.fillText('BATH', x + 48, y + 50); } else if (has) { g.strokeStyle = '#b08a3a'; g.lineWidth = 4; g.beginPath(); g.arc(x + 48, y + 30, 9, 0, 7); g.stroke(); g.fillStyle = '#b08a3a'; g.fillRect(x + 45, y + 38, 6, 30); g.fillStyle = '#d8d0b8'; g.fillRect(x + 34, y + 62, 28, 14); } else if (num === '307') { g.fillStyle = '#a02a1a'; g.font = 'bold 13px Georgia'; g.fillText('DO NOT', x + 48, y + 40); g.fillText('ENTER', x + 48, y + 58); } } }), 2.2, 1.15, wx(10.92), y0 + 1.9, wz(16), -Math.PI / 2, 'Quadro de chaves da recepção');
    // livro de hóspedes aberto no balcão
    docPlane(grp[0], docs, canvasTex(1024, 640, g => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 640); g.stroke();
      g.fillStyle = '#2a1e14'; g.font = 'bold 26px Georgia'; g.fillText('HOTEL LAURENTIAN — REGISTER', 30, 42); g.fillText('November 1975', 560, 42);
      g.font = '20px "Courier New"'; const rows: [string, string, string][] = [['OWNER', 'W. Ashdown', '304 (apt.)'], ['OWNER', 'W. Ashdown', '307 — PRIVATE'], ['Nov 5', 'Mrs. A. Doucette', '303 (perm.)'], ['Nov 8', 'Dr. H. Finch', '204 (perm.)'], ['Nov 11', 'R. Leduc (Eaton\'s)', '302'], ['Nov 13', 'Mr & Mrs Pelletier', '305 — LEFT'], ['Nov 16', 'E. Brodeur (night clerk)', '205'], ['Nov 19', 'RESERVED: Ottawa', '202, 203'], ['Nov 19', '"for the agents"', 'paid in cash']];
      rows.forEach(([d, n, r], i) => { const x = i < 5 ? 30 : 560, y = 100 + (i % 5) * 92; g.fillStyle = '#2a2a6a'; g.font = 'italic 26px "Brush Script MT", cursive'; g.fillText(n, x + 90, y + 4); g.fillStyle = '#2a1e14'; g.font = '18px "Courier New"'; g.fillText(d, x, y); g.fillText('Room ' + r, x + 90, y + 34); g.strokeStyle = '#b8a888'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + 50); g.lineTo(x + 440, y + 50); g.stroke(); });
      g.save(); g.translate(300, 300); g.rotate(-0.2); g.strokeStyle = 'rgba(200,150,40,0.35)'; g.lineWidth = 2; sigilKnow(g, 0, 0, 40, 'rgba(190,140,40,0.35)', 2); g.restore(); age(g, 1024, 640, 30); }), 0.62, 0.39, wx(8.45), y0 + 1.115, wz(15.3), -Math.PI / 2 + 0.1, 'Livro de hóspedes (recepção)', true);
    [[3.0, 9.0, 0.6], [3.0, 11.2, -0.5]].forEach(([x, z, r]) => K0.armchair(mtx(wx(x), y0, wz(z), Math.PI / 2 + r), 0x5a2a24));
    K0.table(mtx(wx(1.8), y0, wz(10.1), 0), 0.7, 0.7, 0.55, 0x3a2418);
    docPlane(grp[0], docs, canvasTex(640, 860, g => { g.fillStyle = '#e4dece'; g.fillRect(0, 0, 640, 860); g.fillStyle = '#1a1a1a'; g.font = 'bold 64px "Times New Roman"'; g.textAlign = 'center'; g.fillText('The Greywater Examiner', 320, 76); g.font = '18px "Times New Roman"'; g.fillText('WEDNESDAY, NOVEMBER 19, 1975 · 25 CENTS', 320, 104); g.fillRect(20, 114, 600, 3);
      g.font = 'bold 44px "Times New Roman"'; g.fillText('GRAVE FOUND DISTURBED', 320, 168); g.fillText('AT ST. COLUMBA', 320, 214);
      g.textAlign = 'left'; g.font = '19px "Times New Roman"'; ['Police say the grave of Mrs. Eva Pelletier, buried', 'Nov. 8, was "carefully reopened and closed again".', 'Sexton: "The Ashdown plot was re-sodded in', 'October. Not by me."', 'MILL HAND MISSING SINCE SUNDAY — Jean Moreau, 34,', 'did not return from the night shift. His lunch pail', 'was found on the Falls bridge.', '', 'CORONER ASKS FOR CALM — Dr. H. Finch denies rumours', 'about "irregularities" at the District Morgue.'].forEach((l, i) => g.fillText(l, 30, 262 + i * 30));
      g.fillStyle = '#7a7a72'; g.fillRect(380, 560, 230, 190); g.fillStyle = '#1a1a1a'; g.font = 'italic 16px "Times New Roman"'; g.fillText('The Falls bridge, Wednesday.', 384, 772);
      g.font = '18px "Times New Roman"'; ['Last Christmas: Margaret Ashdown, 31,', 'of the Laurentian, dies in a fall', 'down the hotel cellar stairs.', 'Husband "inconsolable".', 'WEATHER: Freezing rain, fog.'].forEach((l, i) => g.fillText(l, 30, 580 + i * 30)); age(g, 640, 860, 40); }), 0.42, 0.56, wx(1.8), y0 + 0.565, wz(10.1), 0.4, 'Jornal na mesa do saguão', true);
    later(place('planter_pot_clay', wx(1.0), y0, wz(12.0), 0, 1.3, grp[0]));
    later(place('Chandelier_03', wx(5.5), y0 + h0 - 0.05, wz(13), 0, 1, grp[0]));
    later(place('Rockingchair_01', wx(2.0), y0, wz(17.5), 2.2, 1, grp[0]));
    light(wx(5.5), y0 + 3.2, wz(13), 14, 7, 0xffc080, { vtt: 8 });
    K0.rug(mtx(wx(5), y0 + 0.03, wz(13), 0), 4, 5, 0x5a1e1e);
  }
  // sala de jantar: mesas com toalha, cadeiras, aparador
  { [[3, 2.2], [3, 5], [7.5, 2.2], [7.5, 5]].forEach(([x, z], i) => { K0.table(mtx(wx(x), y0, wz(z), 0), 1.0, 1.0, 0.76, 0x3a2418, 0xe8e4d8); [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(r => { if (i === 3 && r) return; K0.chair(mtx(wx(x) + Math.sin(r) * 0.75, y0, wz(z) + Math.cos(r) * 0.75, r + Math.PI)); }); });
    K0.dresser(mtx(wx(10.4), y0, wz(3.5), -Math.PI / 2), false, 0x3a2418);
    light(wx(5), y0 + 3.2, wz(3.6), 8, 4, 0xffc080, { vtt: 7 }); }
  // beverage room: balcão, prateleira de garrafas, mesas redondas, divisória, televisão
  { const Mb = mtx(wx(9.9), y0, wz(22), -Math.PI / 2);
    bxM(K0.D, m.woodDark, 4.4, 1.08, 0.6, 0, 0.54, 0, 0x3a2014, Mb); bxM(K0.D, m.woodDark, 4.6, 0.06, 0.8, 0, 1.1, -0.05, 0x2a160c, Mb); bxM(K0.D, IM().brass, 4.4, 0.05, 0.05, 0, 0.15, 0.36, 0xffffff, Mb);
    for (let i = 0; i < 3; i++) bxM(K0.D, m.woodDark, 3.6, 0.04, 0.3, 0, 1.4 + i * 0.45, -0.95, 0x2a160c, Mb);
    for (let i = 0; i < 24; i++) K0.bottle(Mb, -1.6 + (i % 12) * 0.28, 1.43 + Math.floor(i / 12) * 0.45, -0.95);
    [[3, 20.8], [6, 21], [3, 24.5], [6.5, 24.6]].forEach(([x, z]) => { const g = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14); g.translate(wx(x), y0 + 0.72, wz(z)); K0.D.add(m.woodDark, g, 0x3a2014); const p = new THREE.CylinderGeometry(0.05, 0.2, 0.7, 8); p.translate(wx(x), y0 + 0.35, wz(z)); K0.D.add(m.iron, p, 0x2a2a2a);
      [0.8, 2.4, 4.0].forEach(r => K0.chair(mtx(wx(x) + Math.sin(r) * 0.7, y0, wz(z) + Math.cos(r) * 0.7, r + Math.PI), 0x3a2014, 0x3a2a24));
      for (let k = 0; k < 3; k++) { const gl = new THREE.CylinderGeometry(0.035, 0.03, 0.14, 8); gl.translate(wx(x) + (rnd() - 0.5) * 0.4, y0 + 0.81, wz(z) + (rnd() - 0.5) * 0.4); K0.D.add(IM().ice, gl, 0xe8c070); } });
    K0.D.box(m.woodDark, 5.5, 1.5, 0.08, wx(3.1), y0 + 0.75, wz(22.7), 0x3a2014);
    later(place('Television_01', wx(1.0), y0 + 2.2, wz(25.2), 0.5, 0.8, grp[0]));
    K0.D.box(m.woodDark, 0.8, 0.05, 0.5, wx(1.0), y0 + 2.18, wz(25.3), 0x2a160c);
    docPlane(grp[0], docs, canvasTex(512, 384, g => { g.fillStyle = '#1e2420'; g.fillRect(0, 0, 512, 384); g.strokeStyle = '#6a4a2a'; g.lineWidth = 14; g.strokeRect(0, 0, 512, 384); g.fillStyle = '#e8e4d8'; g.font = '34px "Comic Sans MS", cursive'; g.fillText('DRAUGHT ........ 45¢', 40, 70); g.fillText('2 FOR ............ 85¢', 40, 120); g.font = '24px "Comic Sans MS", cursive'; g.fillText('No standing · No singing', 40, 180); g.fillText('Ladies admitted with', 40, 230); g.fillText('escort only (other door)', 40, 264); g.fillStyle = '#d8c060'; g.fillText('Nov 19 — CLOSED AT 11', 40, 330); }), 1.0, 0.75, wx(5.5), y0 + 2.1, wz(19.08), 0, 'Quadro-negro do beverage room');
    light(wx(5), y0 + 3.0, wz(22.6), 8, 4, 0xffb060, { flick: 1, vtt: 7 }); }
  // escritório do gerente: escrivaninha, cofre, arquivo, livro de reclamações
  { later(place('metal_office_desk', wx(15.5), y0, wz(3.2), Math.PI, 1, grp[0]));
    K0.chair(mtx(wx(15.5), y0, wz(2.2), 0));
    K0.D.box(m.iron, 0.8, 1.0, 0.7, wx(19.1), y0 + 0.5, wz(1.2), 0x2a3a2a); K0.D.box(IM().brass, 0.12, 0.12, 0.04, wx(19.1), y0 + 0.65, wz(1.57), 0xffffff);
    K0.D.box(m.iron, 0.5, 1.35, 0.6, wx(11.5), y0 + 0.68, wz(1.0), 0x5a5a52);
    docPlane(grp[0], docs, paper('COMPLAINTS — HOTEL LAURENTIAN', ['Nov 3 — Rm 303 (Doucette): sewing machine in 304 after midnight. Spoke to Mr. A.', 'Nov 7 — Maid refuses to do 304. "Smell of ice and lilies."', 'Nov 9 — 2 blocks of ice delivered to 307 "for the radiator". ???', 'Nov 13 — Pelletiers (305) left at 4 a.m. without paying. Said a woman was singing in the wall.', 'Nov 16 — Mr. Ashdown (owner) orders: NO ONE enters 307. He took the only key.', 'Nov 18 — Night clerk saw Mr. A. carrying a rolled carpet up the back stairs. Says it was heavy.'], { size: 16, stamp: 'MANAGER' }), 0.3, 0.4, wx(15.4), y0 + 0.8, wz(3.3), Math.PI, 'Livro de reclamações (gerência)', true);
    later(place('desk_lamp_arm_01', wx(16.1), y0 + 0.78, wz(3.5), 2.4, 1, grp[0]));
    docPlane(grp[0], docs, paper('O.P.P. — OCCURRENCE (copy)', ['Dec 26 1974 · 23:40', 'ASHDOWN, Margaret, 31 (owner)', 'Laurentian Hotel — found at foot', 'of the CELLAR stairs after the', 'Boxing Day party. Husband William', 'states she fell carrying preserves.', 'Husband intoxicated, "inconsolable".', 'Bruising to wrists — noted.', 'Ruled accidental — H. Finch, Coroner'], { w: 420, h: 560, size: 18, stamp: 'CLOSED' }), 0.26, 0.34, wx(14.9), y0 + 0.8, wz(3.1), Math.PI - 0.2, 'Ocorrência de 1974 (escritório)', true);
    light(wx(15.5), y0 + 2.4, wz(3.4), 5, 3, 0xffd8a0); }
  // cozinha: fogão, bancadas, pia, porta dos fundos
  { K0.D.box(m.iron, 1.6, 0.9, 0.8, wx(19.2), y0 + 0.45, wz(15.5), 0x1a1a1a); K0.D.box(m.iron, 1.4, 0.04, 0.6, wx(19.2), y0 + 0.92, wz(15.5), 0x3a3a3a);
    K0.D.box(m.plain, 0.7, 0.9, 5.0, wx(19.3), y0 + 0.45, wz(20), 0xd8d4c8); K0.D.box(IM().steel, 0.6, 0.15, 0.9, wx(19.3), y0 + 0.88, wz(19), 0xb8b8b0);
    K0.D.box(m.woodDark, 2.0, 0.9, 1.0, wx(15), y0 + 0.45, wz(18), 0x6a4a30);
    for (let i = 0; i < 4; i++) { const g = new THREE.CylinderGeometry(0.16, 0.15, 0.22, 10); g.translate(wx(14.4 + i * 0.4), y0 + 1.02, wz(18)); K0.D.add(IM().steel, g, 0x9a9a92); }
    light(wx(16), y0 + 3.0, wz(18), 5, 2, 0xe8f0ff); }

  // ---------- porão (debaixo da cozinha): onde Margaret morreu, em 26/12/1974 ----------
  { const yb = -2.6, Kc = K0;
    Kc.B.box(m.stone, 0.3, 2.7, 13.9, wx(10.95), -1.35, wz(18.9), 0x8a8478); Kc.B.box(m.stone, 0.3, 2.7, 13.9, wx(19.8), -1.35, wz(18.9), 0x8a8478);
    Kc.B.box(m.stone, 9.15, 2.7, 0.3, wx(15.4), -1.35, wz(11.95), 0x8a8478); Kc.B.box(m.stone, 9.15, 2.7, 0.3, wx(15.4), -1.35, wz(25.8), 0x8a8478);
    Kc.F.box(m.concrete, 8.7, 0.1, 13.7, wx(15.4), yb - 0.05, wz(18.9), 0x6a665e);
    stair(0, 17.3, 12.9, 24.4, 25.6, yb, LV[0].y);
    rail(0, 12.9, 17.3, 24.24);
    // caldeira do hotel e canos
    { const g = new THREE.CylinderGeometry(0.75, 0.75, 1.9, 14); g.translate(wx(12.6), yb + 0.95, wz(13.6)); Kc.D.add(m.iron, g, 0x2a2622); }
    [12.6, 13.2].forEach(x => Kc.D.box(m.iron, 0.12, 0.8, 0.12, wx(x), yb + 2.3, wz(13.6), 0x3a3430)); Kc.D.box(m.iron, 0.12, 0.12, 6.0, wx(13.2), -0.3, wz(16.5), 0x3a3430);
    // prateleiras de conservas (vidros de geleia) na parede leste
    for (let i = 0; i < 4; i++) Kc.D.box(m.wood, 0.45, 0.04, 6.0, wx(19.35), yb + 0.4 + i * 0.5, wz(17), 0x6a5038);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 22; j++) { if (rnd() < 0.25) continue; const g = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8); g.translate(wx(19.3 + (rnd() - 0.5) * 0.15), yb + 0.5 + i * 0.5, wz(14.2 + j * 0.26)); Kc.D.add(I.bottle, g, [0x8a2a1a, 0xa86a20, 0x5a1a2a, 0xc8a040][(rnd() * 4) | 0]); }
    later(place('wine_barrel_01', wx(15.2), yb, wz(13.4), 0.3, 1, grp[0])); later(place('Barrel_01', wx(16.8), yb, wz(13.3), 0, 1, grp[0]));
    later(place('wooden_crate_01', wx(12.3), yb, wz(19.5), 0.4, 1, grp[0])); later(place('wooden_crate_01', wx(12.4), yb, wz(20.6), 0.1, 1, grp[0]));
    // ao pé da escada: vidros de conserva quebrados e uma mancha velha de geleia, nunca limpa
    Kc.F.box(m.plain, 1.1, 0.006, 0.8, wx(18.6), yb + 0.004, wz(24.9), 0x2a1410);
    for (let i = 0; i < 9; i++) { const g = new THREE.BoxGeometry(0.04 + rnd() * 0.05, 0.01, 0.03 + rnd() * 0.05); g.rotateY(rnd() * 3); g.translate(wx(18.2 + rnd() * 1.2), yb + 0.01, wz(24.5 + rnd() * 0.9)); Kc.D.add(I.bottle, g, 0xa86a20); }
    // a parede escrita: "you pushed me" e o sigilo
    docPlane(grp[0], docs, canvasTex(1024, 512, g => { g.clearRect(0, 0, 1024, 512); scrawl(g, 'you pushed me', 1024, 512, 'rgba(230,185,70,0.9)', 30, 46); sigilKnow(g, 512, 300, 120, 'rgba(225,185,70,0.9)', 6); }), 3.2, 1.6, wx(19.62), yb + 1.5, wz(21.6), -Math.PI / 2, 'Parede do porão (hotel)', false, 0.55);
    { const g = new THREE.SphereGeometry(0.06, 8, 6); g.translate(wx(15.4), -0.25, wz(19)); Kc.D.add(m.lit, g, 0xffffff); }
    light(wx(15.4), -0.5, wz(19), 3, 4, 0xffc890, { flick: 3 }); light(wx(18.6), yb + 0.8, wz(23.6), 1.8, 4, 0xd8a840, { flick: 1 });
  }
  // escadaria: luz e quadro
  light(wx(15), y0 + 3.5, wz(9.6), 5, 4, 0xffc080);

  // ---------- andares de quartos ----------
  const roomDocs: Record<string, (k: number, x0: number, z0: number, x1: number, z1: number, M: THREE.Matrix4) => void> = {};
  const decorRoom = (k: number, side: 'W' | 'E', z0: number, z1: number, num: string, wall: number, blanket: number) => {
    const Kt = kits[k], y = LV[k].y, xa = side === 'W' ? T : 11, xb = side === 'W' ? 9 : W - T, outer = side === 'W' ? T : W - T;
    const bedX = side === 'W' ? 4.4 : 16.2;
    if (num.endsWith('6')) { // banheiro coletivo: banheira, pia, privada, azulejo
      Kt.D.box(I.tile, 0.05, 1.5, z1 - z0 - 0.2, wx(xb - 0.1), y + 0.75, wz((z0 + z1) / 2), 0xffffff);
      { const g = new THREE.BoxGeometry(0.8, 0.55, 1.7); g.translate(wx(xb - 1.0), y + 0.3, wz(z1 - 1.0)); Kt.D.add(IM().steel, g, 0xe8e4dc); }
      Kt.D.box(IM().steel, 0.5, 0.18, 0.4, wx(xa + 0.6), y + 0.85, wz(z0 + 1.0), 0xe8e4dc); Kt.D.box(IM().steel, 0.4, 0.42, 0.55, wx(xa + 0.6), y + 0.21, wz(z0 + 2.6), 0xe8e4dc);
      Kt.D.box(IM().mirror as unknown as THREE.Material, 0.02, 0.6, 0.45, wx(xa + 0.03), y + 1.5, wz(z0 + 1.0), 0xffffff);
      light(wx((xa + xb) / 2), y + 2.8, wz((z0 + z1) / 2), 3, 1, 0xe8f0ff);
      return;
    }
    const lw = 0.07 + 0.07; // encosto na parede (meia parede + folga)
    if (num === '307') { // trancado: sem móveis de hotel, cortinas fechadas, só o aquecedor
      Kt.radiator(mtx(wx(outer - 0.15), y, wz((z0 + z1) / 2), -Math.PI / 2));
      Kt.D.box(I.cloth, 0.04, 2.3, 1.6, wx(outer - 0.2), y + 1.4, wz(22.5), 0x2a2020);
      return;
    }
    Kt.bed(mtx(wx(bedX), y, wz(z0 + lw), 0), { blanket, messy: num === '304' || num === '305' });
    Kt.nightstand(mtx(wx(bedX + (side === 'W' ? -1.15 : 1.15)), y, wz(z0 + 0.35), 0));
    Kt.dresser(mtx(wx(side === 'W' ? 6.6 : 12.6), y, wz(z1 - 0.08), Math.PI), true, 0x4a3020);
    Kt.chair(mtx(wx(side === 'W' ? 1.3 : 18.7), y, wz(z1 - 1.3), side === 'W' ? 2.4 : -2.4));
    Kt.radiator(mtx(wx(outer + (side === 'W' ? 0.15 : -0.15)), y, wz((z0 + z1) / 2 + (num.startsWith('2') ? 0 : 0)), side === 'W' ? Math.PI / 2 : -Math.PI / 2));
    Kt.rug(mtx(wx((xa + xb) / 2), y + 0.02, wz((z0 + z1) / 2 + 0.6), 0), 2.2, 1.6, [0x5a2a24, 0x2a3a4a, 0x4a4a2a][(rnd() * 3) | 0]);
    // quadrinho genérico na parede (paisagem) — só em divisória (parede externa tem janela)
    if (z0 > T) docPlane(grp[k], [], canvasTex(256, 192, g => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#8a9aa0'); gr.addColorStop(1, '#4a5a4a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 192); g.fillStyle = '#2a3a2a'; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 24, 150); g.lineTo(i * 24 + 12, 70 + rnd() * 30); g.lineTo(i * 24 + 24, 150); g.fill(); } g.strokeStyle = '#6a4a20'; g.lineWidth = 14; g.strokeRect(0, 0, 256, 192); }), 0.6, 0.45, wx(bedX), y + 1.75, wz(z0 + 0.085), 0);
    // luminária de teto
    { const g = new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI); g.translate(wx((xa + xb) / 2), y + LV[k].h - 0.02, wz((z0 + z1) / 2)); Kt.D.add(TM().lit, g, 0xffffff); }
    light(wx((xa + xb) / 2), y + 2.6, wz((z0 + z1) / 2), num === '304' ? 3 : 4, num === '304' ? 6 : 1, 0xffc890);
    void wall;
  };
  const wallCols = [0xd8c8a8, 0xc8d0b8, 0xd8c0b8, 0xc8c8d0, 0xe0d0b0, 0xc0b8a8, 0xd0c0a0];
  [1, 2].forEach(k => {
    const Kt = kits[k], y = LV[k].y, h = LV[k].h, fl = k + 1;
    // paredes do corredor (portas dos quartos) e divisórias
    const dW = [5.5, 7.5, 18.5, 20.5], dE = [5.8, 13.0, 20.2];
    Kt.wall('z', wx(9), wz(T), wz(D - T), y, h, dW.map(z => [wz(z), 0.9, 2.15] as [number, number, number]), { col: 0xd0c4a8 });
    Kt.wall('z', wx(11), wz(T), wz(7), y, h, [[wz(dE[0]), 0.9, 2.15]], { col: 0xd0c4a8 });
    Kt.wall('z', wx(11), wz(12), wz(D - T), y, h, [[wz(dE[1]), 0.9, 2.15], [wz(dE[2]), 0.9, 2.15]], { col: 0xd0c4a8 });
    [6.5, 13, 19.5].forEach((z, i) => Kt.wall('x', wz(z), wx(T), wx(9), y, h, [], { col: wallCols[(i + k) % 7] }));
    [7, 12, 19].forEach((z, i) => Kt.wall('x', wz(z), wx(11), wx(W - T), y, h, [], { col: wallCols[(i + 3 + k) % 7] }));
    // números nas portas (placas no corredor) e folhas de porta entreabertas/fechadas
    const numW = ['01', '02', '03', '04'], numE = ['05', '06', '07'];
    dW.forEach((z, i) => { const n = fl + numW[i], closed = n === '304' || n === '303' || n === '204'; Kt.door(wx(9.07), y, wz(z - 0.45), closed ? -Math.PI / 2 : -Math.PI / 2 - 1.1, 0.9, 2.12, 0x4a3222, n); });
    dE.forEach((z, i) => { const n = fl + numE[i], closed = n === '307' || n === '306'; Kt.door(wx(10.93), y, wz(z + 0.45), closed ? Math.PI / 2 : Math.PI / 2 - 1.1, 0.9, 2.12, n === '307' ? 0x2a1a12 : 0x4a3222, n.endsWith('6') ? 'BATH' : n); });
    // corredor: arandelas e luz
    for (let z = 3; z < D; z += 7) { const g = new THREE.SphereGeometry(0.09, 8, 6); g.translate(wx(9.12), y + 2.0, wz(z)); Kt.D.add(TM().lit, g, 0xffffff); }
    light(wx(10), y + 2.6, wz(4), 5, 3, 0xffc080); light(wx(10), y + 2.6, wz(22), 5, 3, 0xffc080, { flick: fl === 3 ? 3 : 0 }); light(wx(15), y + 2.8, wz(9.6), 4, 2, 0xffc080);
    ROOMS_W.forEach(([a, b], i) => decorRoom(k, 'W', a, b, fl + numW[i], wallCols[i], [0x6a2a2a, 0x2a4a5a, 0x5a5a3a, 0x4a2a4a][i]));
    ROOMS_E.forEach(([a, b], i) => decorRoom(k, 'E', a, b, fl + numE[i], wallCols[i + 4], [0x3a4a2a, 0x6a2a2a, 0x2a3a5a][i]));
  });

  // ---------- os quartos que contam a história ----------
  // 304 — William Ashdown: cama desfeita, garrafas, manequim coberto, máquina de costura, fotos e "medidas"
  roomDocs['304'] = (k, xa, z0, xb, z1) => {
    const Kt = kits[k], y = LV[k].y, Gk = grp[k];
    [[1.0, 21.5], [5.4, 24.6], [6.5, 21.0]].forEach(([x, z], i) => Kt.bottle(mtx(wx(x), y, wz(z), i), 0, 0, 0, i !== 1));
    Kt.bottle(mtx(wx(3.2), y + 0.6, wz(z0 + 0.35), 0), 0, 0, 0);
    // manequim de costureira coberto por um lençol, junto à janela
    { const g = new THREE.LatheGeometry([[0, 0], [0.2, 0.02], [0.03, 0.05], [0.03, 0.9], [0.17, 0.95], [0.22, 1.15], [0.16, 1.32], [0.2, 1.45], [0.12, 1.55], [0.05, 1.62], [0, 1.64]].map(([a, b]) => new THREE.Vector2(a, b)), 14); g.translate(wx(1.2), y, wz(z0 + 1.2)); Kt.D.add(I.cloth, g, 0xe8e2d8);
      const s = new THREE.ConeGeometry(0.42, 1.0, 14, 1, true); s.translate(wx(1.2), y + 0.95, wz(z0 + 1.2)); Kt.D.add(I.cloth, s, 0xe0dad0); }
    // mesa com máquina de costura, carretéis de linha preta e a lista
    Kt.table(mtx(wx(7.6), y, wz(23.6), Math.PI / 2), 1.2, 0.6, 0.76, 0x3a2418);
    Kt.D.box(m.iron, 0.42, 0.28, 0.2, wx(7.6), y + 0.9, wz(23.8), 0x1a1a1a); Kt.D.box(m.iron, 0.1, 0.12, 0.2, wx(7.6), y + 1.08, wz(23.55), 0x1a1a1a);
    for (let i = 0; i < 5; i++) { const g = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8); g.translate(wx(7.35 + i * 0.05), y + 0.8, wz(23.2)); Kt.D.add(I.cloth, g, 0x101010); }
    Kt.chair(mtx(wx(6.9), y, wz(23.6), Math.PI / 2));
    // aliança na mesinha
    { const g = new THREE.TorusGeometry(0.012, 0.003, 6, 16); g.rotateX(Math.PI / 2); g.translate(wx(3.2), y + 0.605, wz(z0 + 0.45)); Kt.D.add(IM().brass, g, 0xffd060); }
    // parede com fotos de Margaret e a folha de "medidas"
    docPlane(Gk, docs, canvasTex(1024, 720, g => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 1024, 720);
      photo(g, 30, 40, 260, 320, 'girl', 'Maggie, 1968'); photo(g, 320, 20, 300, 260, 'group', 'our wedding'); photo(g, 660, 50, 240, 300, 'girl', 'M.');
      paperDraw(g, 340, 300, 380, 400, 'MAGGIE — measurements', ['height 5 ft 5 — J.M. ✓', 'hands: small, long fingers — E.P. ✓', 'shoulders, back — S.K. ✓', 'voice: — she has her own', 'eyes: grey-green — not yet (20th)', '', '"bring me the rest, Willy"'], { size: 19, rot: 0.03 });
      g.strokeStyle = 'rgba(200,30,20,0.8)'; g.lineWidth = 4; g.beginPath(); g.ellipse(160, 200, 100, 140, 0, 0, 7); g.stroke();
      g.save(); g.strokeStyle = '#a02a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(160, 340); g.lineTo(420, 420); g.moveTo(780, 340); g.lineTo(640, 440); g.stroke(); g.restore(); }),
      2.4, 1.69, wx(xb - 0.09), y + 1.65, wz(23.3), -Math.PI / 2, 'Fotos de Margaret e a lista de "medidas" (304)');
    // calendário de novembro com dias marcados
    docPlane(Gk, docs, canvasTex(400, 520, g => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, 400, 520); g.fillStyle = '#5a6a7a'; g.fillRect(0, 0, 400, 150); g.fillStyle = '#e8e4d8'; g.font = 'bold 34px Georgia'; g.textAlign = 'center'; g.fillText('NOVEMBER 1975', 200, 60); g.font = '18px Georgia'; g.fillText('Greywater Pulp & Paper Co.', 200, 100);
      g.fillStyle = '#2a2a2a'; g.font = '15px Georgia'; ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => g.fillText(d, 30 + i * 52, 180)); for (let d = 1; d <= 30; d++) { const c = (d + 5) % 7, r = Math.floor((d + 5) / 7); const x = 30 + c * 52, yy = 210 + r * 52; g.fillStyle = '#2a2a2a'; g.font = '20px Georgia'; g.fillText(String(d), x, yy);
        if (d < 19) { g.strokeStyle = 'rgba(30,30,30,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, yy - 18); g.lineTo(x + 14, yy + 6); g.stroke(); }
        if (d === 9 || d === 16 || d === 17) { g.strokeStyle = '#a02a1a'; g.lineWidth = 3; g.beginPath(); g.arc(x, yy - 6, 18, 0, 7); g.stroke(); g.fillStyle = '#a02a1a'; g.font = '11px Arial'; g.fillText(d === 9 ? 'E.P.' : d === 16 ? 'J.M.' : 'S.K.', x, yy + 14); }
        if (d === 20) { g.fillStyle = '#c09030'; g.font = 'bold 13px Arial'; g.fillText('EYES', x, yy + 14); } } }),
      0.42, 0.55, wx(8.3), y + 1.6, wz(z1 - 0.012), Math.PI, 'Calendário do quarto 304');
    // espelho da cômoda escrito com o sigilo e "YOU DID THIS" (dourado do Conhecimento)
    docPlane(Gk, docs, canvasTex(512, 600, g => { g.clearRect(0, 0, 512, 600); sigilKnow(g, 256, 260, 150, 'rgba(225,180,60,0.9)', 6); g.fillStyle = 'rgba(225,180,60,0.85)'; g.font = 'italic 46px "Brush Script MT", cursive'; g.textAlign = 'center'; g.fillText('you did this, Willy', 256, 520); g.fillText('now finish me', 256, 572); }),
      0.66, 0.77, wx(6.6), y + 1.35, wz(z1 - 0.16), Math.PI, 'Espelho do quarto 304', false, 0.5);
    // bilhete da gerência passado por baixo da porta
    docPlane(Gk, docs, paper('Mr. Ashdown — Room 304', ['Sir, with respect: guests complain', 'of the sewing machine after midnight', 'and of a woman singing in your rooms.', 'Since Mrs. Ashdown passed you live', 'alone. Sir, the hotel cannot afford', 'this. — L. Gauthier, Manager'], { w: 400, h: 300, size: 18 }), 0.22, 0.17, wx(8.4), y + 0.03, wz(18.9), 0.3, 'Bilhete da gerência (no chão do 304)', true);
    // brilho dourado fraco que pulsa (a presença dela)
    light(wx(6.6), y + 1.4, wz(z1 - 0.6), 2.5, 6, 0xd8a840, { flick: 1 });
  };
  // 307 — trancado: gelo, serragem, lençóis, um vulto coberto na mesa, paredes escritas
  roomDocs['307'] = (k, xa, z0, xb, z1) => {
    const Kt = kits[k], y = LV[k].y, Gk = grp[k];
    // a cama foi encostada; no meio, uma mesa comprida com o vulto coberto
    Kt.table(mtx(wx(15.5), y, wz(22.5), 0), 0.9, 2.1, 0.8, 0x3a2418);
    Kt.covered(mtx(wx(15.5), y + 0.8, wz(21.5), 0), 0);
    // caixas de madeira com blocos de gelo e serragem
    [[19.0, 20.0], [19.0, 21.4], [13.0, 23.3]].forEach(([x, z]) => { Kt.D.box(m.wood, 0.9, 0.6, 1.1, wx(x), y + 0.3, wz(z), 0x7a6040); Kt.D.box(I.ice, 0.7, 0.3, 0.9, wx(x), y + 0.7, wz(z), 0xffffff); Kt.D.box(m.plain, 0.86, 0.04, 1.06, wx(x), y + 0.58, wz(z), 0xc8a870); });
    for (let i = 0; i < 6; i++) Kt.D.box(I.cloth, 0.8 + rnd() * 0.4, 0.05, 0.6, wx(12.2 + rnd() * 1.2), y + 0.03 + i * 0.04, wz(20 + rnd() * 1.5), 0xe8e4dc);
    // paredes escritas MARGARET, em dourado, e o sigilo grande
    docPlane(Gk, docs, canvasTex(1536, 700, g => { g.clearRect(0, 0, 1536, 700); scrawl(g, 'Margaret', 1536, 700, 'rgba(225,180,60,0.85)', 120, 38); sigilKnow(g, 768, 380, 230, 'rgba(225,185,70,0.85)', 8); }), 6.2, 2.8, wx(xa + 0.095), y + 1.7, wz((z0 + z1) / 2), Math.PI / 2, 'Parede do quarto 307', false, 0.45);
    // recibos de entrega de gelo
    docPlane(Gk, docs, paper('NORTHERN ICE CO. — DELIVERY', ['To: W. Ashdown, Laurentian Hotel rm 307', 'Nov 9 · 2 blocks (100 lb)', 'Nov 12 · 2 blocks', 'Nov 16 · 4 blocks — "rush"', 'Nov 18 · 4 blocks', 'Paid cash. Driver not to come upstairs.'], { w: 420, h: 360, size: 18 }), 0.24, 0.2, wx(15.9), y + 0.81, wz(23.3), 0.2, 'Recibos de gelo (307)', true);
    light(wx(15.5), y + 2.6, wz(22.5), 2.5, 5, 0xd8b050, { flick: 3 });
  };
  // 303 — Mrs. Doucette (vizinha): terço, rádio, diário
  roomDocs['303'] = (k, xa, z0) => { const y = LV[k].y; later(place('vintage_radio_transceiver', wx(6.0), y + 0.6, wz(z0 + 0.35), Math.PI, 0.6, grp[k]));
    docPlane(grp[k], docs, paper('Diary — A. Doucette', ['Nov 14. The machine again at three. Then a woman humming "Que sera". He lives alone, the clerk says. Mrs. Ashdown died last Christmas, downstairs, in the cellar.', 'Nov 17. Knocked on 304. He opened smiling, smelled of rye and of the cold. Behind him the mannequin had a dress on.', 'Nov 18. I heard her say my name through the wall. I have not told Father Hale.'], { w: 460, h: 600, size: 17 }), 0.26, 0.34, wx(xa + 0.8), y + 0.78, wz(z0 + 3.4), 0.5, 'Diário da Sra. Doucette (303)', true);
    kits[k].table(mtx(wx(xa + 0.8), y, wz(z0 + 3.4), 0), 0.6, 0.6); };
  // 204 — Dr. Finch, o legista (mora no hotel)
  roomDocs['204'] = (k, xa, z0) => { const y = LV[k].y; kits[k].table(mtx(wx(xa + 1.0), y, wz(z0 + 3.0), 0), 0.9, 0.6);
    docPlane(grp[k], docs, paper('H. Finch, M.D. — private notes', ['Pelletier (exhumed): left hand absent. Severed after death, skilfully. Stitched closed with black thread, tailor\'s stitch.', 'Moreau: not found. Pail on the bridge.', 'Drawer 4 at the morgue: Kowalczyk (vagrant) — released to "family" Nov 17. He had no family.', 'Who signs my name?', 'Do NOT tell Constable Roy until I am sure.'], { w: 460, h: 620, size: 17 }), 0.26, 0.35, wx(xa + 1.0), y + 0.77, wz(z0 + 3.0), 0.2, 'Notas particulares do Dr. Finch (204)', true); };
  // 202 e 203 — reservados para os agentes
  roomDocs['202'] = (k, xa, z0) => docPlane(grp[k], docs, paper('RESERVED', ['Rooms 202 & 203', 'Guests from Ottawa', 'Arriving Nov 19, evening train', 'Paid in full — cash, envelope', 'left at the desk. No name.'], { w: 360, h: 300, size: 20, stamp: 'PAID' }), 0.2, 0.17, wx(4.4), LV[k].y + 0.68, wz(z0 + 1.6), 0.1, 'Bilhete de reserva dos agentes (202)', true);
  void roomDocs;
  // 305 — os Pelletier fugiram de madrugada: mala aberta no chão
  roomDocs['305'] = (k, xa, z0) => { const y = LV[k].y; kits[k].D.box(m.woodDark, 0.7, 0.22, 0.45, wx(xa + 3.4), y + 0.11, wz(z0 + 4.4), 0x5a3a20); kits[k].D.box(I.cloth, 0.6, 0.05, 0.4, wx(xa + 3.4), y + 0.24, wz(z0 + 4.4), 0x6a6a8a); };

  // recompõe a ordem: decorRoom chama roomDocs[num] — os quartos com história foram definidos depois, então
  // refazemos só as extras deles agora (os móveis comuns já estão no lote)
  ['304', '307', '303', '204', '202', '305'].forEach(n => { const k = +n[0] - 1, idx = +n[2], side = idx <= 4 ? 'W' : 'E', [a, b] = side === 'W' ? ROOMS_W[idx - 1] : ROOMS_E[idx - 5], xa = side === 'W' ? T : 11, xb = side === 'W' ? 9 : W - T; roomDocs[n](k, xa, a, xb, b, new THREE.Matrix4()); });

  // ---------- montar ----------
  const solids: THREE.Object3D[] = [], floors: THREE.Object3D[] = [];
  kits.forEach((Kt, k) => {
    EXT[k].build(grp[k]).forEach(o => solids.push(o));
    GL[k].build(grp[k], { shadow: false });
    const r = Kt.build(Q.lights > 8);
    solids.push(...r.walls);
    r.floors.forEach(f => { f.userData.l = grp[k]; floors.push(f); });
    floorsWalk[k].forEach(f => { f.userData.l = grp[k]; floors.push(f); });
  });
  R.build(roofs);
  await Promise.all(P);
  const layers = [{ n: 'Telhado do hotel', o: roofs, v: true }, { n: 'Hotel: 3º andar', o: grp[2], v: true }, { n: 'Hotel: 2º andar', o: grp[1], v: true }];
  return { docs, solids, floors, roofs, vttWalls: vtt, portals, lamps, layers };
}
/** porão debaixo da cozinha (o terreno é recortado aqui) */
export const CELLAR = { x0: X0 + 11.1, x1: X0 + 19.65, z0: Z0 + 12.1, z1: Z0 + 25.65 };
export const HOTEL_GROUPS = (G: THREE.Group) => [G.getObjectByName('hotel-andar-2'), G.getObjectByName('hotel-andar-3'), G.getObjectByName('hotel-telhado')].filter(Boolean) as THREE.Object3D[];
