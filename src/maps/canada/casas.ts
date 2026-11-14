// Lugares de Greywater Falls que dá para ENTRAR (além do hotel e do necrotério): a fábrica de papel (salão das
// máquinas, relógio de ponto, quadro de avisos, escritório do capataz), a lanchonete Lucky Star e duas casas das
// vítimas — a da professora de piano Eva Pelletier (Elm St) e a do operário Jean Moreau (Birch St).
// Cada lugar tem documentos que apontam de volta para o hotel e para William.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { place } from '../../core/models';
import { halo } from '../../core/kit';
import { Batch, mtx, rnd, reseed, TM, shell, gableRoof, light, sign, neonTexture, bxM, MILL, DINER, ELM, BIRCH, Q, type Opening } from './common';
import { Kit, IM, canvasTex, docPlane, type Interior } from './interior';
import { paper, photo, age } from '../texas/police';

/** casas abertas: centro e lado da frente (a rua fica desse lado) */
export const CASA_EVA = { x: ELM - 12, z: -8, front: 'E' as const };
export const CASA_MOREAU = { x: BIRCH + 12, z: 48, front: 'W' as const };
/** alfaiataria (posição definida na hora: é um lote da Main St) */
export const ALF = { x: 0, z: 0, ok: false };
/** retângulos com interior (luz acesa fraca de dia) */
export const DENTRO: [number, number, number, number][] = [
  [MILL.x0, MILL.x1, MILL.z0, MILL.z1], [DINER.x0, DINER.x1, DINER.z0, DINER.z1],
  [CASA_EVA.x - 5, CASA_EVA.x + 5, CASA_EVA.z - 4.5, CASA_EVA.z + 4.5], [CASA_MOREAU.x - 5, CASA_MOREAU.x + 5, CASA_MOREAU.z - 4.5, CASA_MOREAU.z + 4.5],
];

export async function buildCasas(G: THREE.Group, alf: { x: number; z: number; w: number } | null = null): Promise<Interior> {
  reseed(1975);
  const m = TM(), I = IM();
  const O = new THREE.Group(); O.name = 'lugares-abertos'; G.add(O);
  const roofs = new THREE.Group(); roofs.name = 'telhados-lugares-abertos'; G.add(roofs);
  const K = new Kit(O, 'lugares'), B = new Batch('lugares-casca'), R = new Batch('lugares-telhado'), W = new Batch('lugares-vidro');
  const docs: Interior['docs'] = [], lamps: THREE.MeshBasicMaterial[] = [], vttWalls: Interior['vttWalls'] = [], portals: Interior['portals'] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const extra: THREE.Object3D[] = [];

  // ================= FÁBRICA DE PAPEL (salão das máquinas) =================
  {
    const { x0, x1, z0, z1 } = MILL, Wd = x1 - x0, T = 0.4, H = 12, brick = 0x8a6050;
    const doorBig = x0 + 24, doorP = x0 + 44;
    const ops: Opening[] = [{ side: 'S', at: doorBig, w: 4.5, h: 5, sill: 0 }, { side: 'S', at: doorP, w: 1.1, h: 2.3, sill: 0 }];
    for (let xx = x0 + 19; xx < x1 - 1; xx += 4) { ops.push({ side: 'S', at: xx, w: 1.8, h: 2.6, sill: 6.7 }); if (Math.abs(xx - doorBig) > 3.6 && Math.abs(xx - doorP) > 1.9) ops.push({ side: 'S', at: xx, w: 1.8, h: 2.6, sill: 1.7 }); }
    for (let xx = x0 + 3; xx < x1 - 1; xx += 4) ops.push({ side: 'N', at: xx, w: 1.8, h: 2.6, sill: 6.7 });
    shell(B, m.brick, brick, x0, z0, x1, z1, H, T, ops);
    ops.filter(o => o.sill! > 1).forEach(o => { const z = o.side === 'S' ? z1 - T / 2 : z0 + T / 2; W.box(rnd() < 0.35 ? m.lit : m.glass, o.w, o.h, 0.04, o.at, o.sill! + o.h / 2, z, 0xffffff); });
    gableRoof(R, m.tin, 0x6a6660, x0, z0, x1, z1, H, 3, 'x', 0.4);
    K.F.box(m.concrete, Wd - 2 * T, 0.12, z1 - z0 - 2 * T, (x0 + x1) / 2, 0.06, (z0 + z1) / 2, 0x8a867e);
    for (let xx = x0 + 4; xx < x1; xx += 8) K.D.box(m.iron, 0.25, 0.35, z1 - z0 - 0.8, xx, H - 0.2, (z0 + z1) / 2, 0x2a2826); // tesouras do telhado
    // máquina de papel: tela, prensas, secadores e a bobina
    const zc = -180, y = 0.12;
    K.D.box(m.iron, 38, 0.6, 3.4, 47, y + 0.3, zc, 0x2a3a3a);
    [-1.75, 1.75].forEach(s => K.D.box(m.iron, 38, 0.15, 0.15, 47, y + 1.1, zc + s, 0x3a4a4a));
    const roll = (x: number, yy: number, r: number, len = 3.3, col = 0x8a8a84, mat: THREE.Material = I.steel) => { const g = new THREE.CylinderGeometry(r, r, len, 14); g.rotateX(Math.PI / 2); g.translate(x, yy, zc); K.D.add(mat, g, col); };
    for (let x = 30; x < 44; x += 1.2) roll(x, y + 1.35, 0.22, 3.3, 0x9a9a92);
    K.D.box(I.cloth, 14, 0.03, 3.1, 37, y + 1.58, zc, 0x3a4a5a); // a tela (feltro)
    [[46, 1.5, 0.55], [46, 2.6, 0.55], [49, 1.5, 0.55], [49, 2.6, 0.55]].forEach(([x, yy, r]) => roll(x, y + yy, r));
    for (let i = 0; i < 9; i++) roll(52 + i * 1.5, y + (i % 2 ? 3.1 : 1.6), 0.72, 3.3, 0x6a6a64);
    K.D.box(m.iron, 15, 1.2, 4.2, 58, y + 4.6, zc, 0x3a2a24); // capota dos secadores
    roll(66.5, y + 1.3, 1.05, 3.0, 0xf0ece0, I.cloth); // bobina de papel
    [-2.3, 2.3].forEach(s => { K.D.box(m.iron, 38, 0.05, 0.05, 47, y + 1.05, zc + s, 0xc8a020); for (let x = 28; x <= 66; x += 2) K.D.box(m.iron, 0.05, 1.05, 0.05, x, y + 0.52, zc + s, 0xc8a020); });
    // tanques de massa (polpa) com escada e bobinas prontas
    [24, 30, 36].forEach(x => { const g = new THREE.CylinderGeometry(2.3, 2.3, 3.6, 20, 1, true); g.translate(x, y + 1.8, -190); K.D.add(m.rust, g, 0x8a7a6a); const t = new THREE.CircleGeometry(2.25, 20); t.rotateX(-Math.PI / 2); t.translate(x, y + 3.2, -190); K.D.add(m.plain, t, 0x6a6a52);
      for (let k = 0; k < 10; k++) K.D.box(m.iron, 0.5, 0.03, 0.05, x + 2.4, y + 0.3 + k * 0.34, -190, 0x2a2a2a); });
    for (let i = 0; i < 6; i++) { const g = new THREE.CylinderGeometry(0.75, 0.75, 1.9, 16); g.translate(66 + (i % 3) * 1.7, y + 0.95 + Math.floor(i / 3) * 1.9, -190); K.D.add(I.cloth, g, 0xece8dc); }
    // armários dos operários (o de Moreau, nº 17, aberto) junto à parede sul
    for (let i = 0; i < 12; i++) { const x = 48 + i * 0.62; K.D.box(I.steel, 0.58, 1.9, 0.5, x, y + 0.95, z1 - T - 0.27, i === 7 ? 0x5a6a5a : 0x6a7a6a); }
    K.door(48 + 7 * 0.62 + 0.29, y + 0.08, z1 - T - 0.53, Math.PI - 1.2, 0.56, 1.75, 0x6a7a6a);
    // relógio de ponto e escaninho de cartões, quadro de avisos
    K.D.box(m.iron, 0.4, 0.55, 0.25, 60.4, 1.5, z1 - T - 0.13, 0x6a5a3a);
    docPlane(O, docs, canvasTex(512, 640, g => { g.fillStyle = '#5a4a32'; g.fillRect(0, 0, 512, 640); for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const x = 12 + c * 125, y0 = 12 + r * 104; g.fillStyle = '#2a2016'; g.fillRect(x, y0, 117, 96); if (r === 2 && c === 1) { g.fillStyle = '#a02a1a'; g.font = 'bold 18px Arial'; g.fillText('EMPTY', x + 26, y0 + 56); continue; } g.fillStyle = '#e8e2c8'; g.fillRect(x + 20, y0 - 2, 76, 92); g.fillStyle = '#2a2a2a'; g.font = '13px "Courier New"'; g.fillText('#' + (4460 + r * 4 + c), x + 30, y0 + 20); } }),
      0.6, 0.75, 59.5, 1.6, z1 - T - 0.012, Math.PI, 'Escaninho dos cartões de ponto');
    docPlane(O, docs, paper('TIME CARD · GREYWATER PULP & PAPER', ['MOREAU, Jean  #4469  Night shift', 'Week of Nov 10, 1975', 'Mon 10 IN 15:00 OUT 23:02', 'Wed 12 IN 14:58 OUT 23:00', 'Fri 14 IN 15:01 OUT 23:03', 'Sun 16 IN 15:02 OUT 23:01', 'Mon 17 —', 'Tue 18 —', 'pencil, on the back: "Laurentian after — W.A. is buying"'], { w: 360, h: 520, size: 16 }), 0.18, 0.26, 61.1, 1.45, z1 - T - 0.012, Math.PI, 'Cartão de ponto de Jean Moreau');
    docPlane(O, docs, canvasTex(1024, 720, g => { g.fillStyle = '#9a7650'; g.fillRect(0, 0, 1024, 720); g.strokeStyle = '#5a4026'; g.lineWidth = 18; g.strokeRect(0, 0, 1024, 720);
      const note = (x: number, y0: number, w: number, h: number, t: string, ls: string[], c = '#ece6d6') => { g.save(); g.translate(x, y0); g.rotate((rnd() - 0.5) * 0.06); g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = 'bold 26px "Courier New"'; g.fillText(t, 16, 38); g.font = '19px "Courier New"'; ls.forEach((l, i) => g.fillText(l, 16, 72 + i * 26)); g.restore(); };
      note(30, 30, 440, 300, 'MISSING — JEAN MOREAU', ['Night shift, #4469. Last seen', 'Sunday Nov 16 after 11 pm.', 'Anyone who saw him please', 'call Cst. Roy, O.P.P.', 'His wife Lise asks for prayers.'], '#f0e8d0');
      note(520, 40, 460, 260, 'UNION MEETING', ['Thursday 8 pm, Laurentian', 'Beverage Room. Mr. Ashdown', 'offers the first round.', '"Everybody comes to the', 'Laurentian."']);
      note(40, 380, 440, 300, 'WORK UNIFORMS — FREE', ['Mr. W. Ashdown (tailor, now of', 'the Laurentian) will measure', 'night-shift men for new work', 'clothes, at no charge.', 'Fittings Saturdays, room 307.']);
      note(540, 360, 430, 300, 'SAFETY FIRST', ['Days without accident:', '', '        0', '', 'Wear your gloves on the press.'], '#e8e0a0'); }),
      2.4, 1.7, 57.6, 1.9, z1 - T - 0.012, Math.PI, 'Quadro de avisos da fábrica');
    // escritório do capataz (canto sudeste, divisória com vidro)
    const ox0 = 66, oz0 = -171, ox1 = x1 - T, oz1 = z1 - T;
    K.wall('x', oz0, ox0, ox1, y, 3.0, [[ox0 + 1.4, 0.9, 2.1]], { col: 0xb8c0a8, lambri: 1.1, lambriCol: 0x4a5a4a });
    K.wall('z', ox0, oz0, oz1, y, 3.0, [], { col: 0xb8c0a8, lambri: 1.1, lambriCol: 0x4a5a4a });
    W.box(m.glass, 0.03, 1.2, 4.0, ox0, y + 1.8, (oz0 + oz1) / 2, 0xffffff);
    K.D.box(m.plain, ox1 - ox0, 0.06, oz1 - oz0, (ox0 + ox1) / 2, y + 3.0, (oz0 + oz1) / 2, 0xd8d4c8);
    later(place('metal_office_desk', ox0 + 4.2, y, oz0 + 4.5, -Math.PI / 2, 1, O)); K.chair(mtx(ox0 + 5.3, y, oz0 + 4.5, -Math.PI / 2));
    K.D.box(m.iron, 0.5, 1.35, 0.6, ox1 - 0.3, y + 0.68, oz0 + 1.2, 0x4a524a);
    docPlane(O, docs, paper('FOREMAN\'S LOG — NIGHT SHIFT', ['Sun Nov 16. Shift ends 23:00. Moreau', 'out 23:01. Mr. Ashdown waiting at', 'the gate in his car — "a drink at', 'the Laurentian, Jean, on the house".', 'Mon 17. Moreau no-show. Lise came', 'at 6 a.m., crying. Pail found on', 'the Falls bridge.', 'Ashdown measured 14 of my men in', 'Oct. "Only Moreau was the right', 'size," he said. Right size for what?'], { w: 460, h: 640, size: 17, stamp: 'R. TREMBLAY' }), 0.24, 0.33, ox0 + 4.3, y + 0.79, oz0 + 4.4, -Math.PI / 2 + 0.15, 'Livro do capataz', true);
    docPlane(O, docs, canvasTex(640, 860, g => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, 640, 860); g.fillStyle = '#1a1a1a'; g.font = 'bold 28px Georgia'; g.fillText('ASHDOWN & SON — TAILORS', 30, 50); g.font = 'italic 22px Georgia'; g.fillText('Work clothes — night shift — Oct. 1975', 30, 86);
      g.font = '20px "Courier New"'; [['Bouchard, R.', "5' 11\""], ['Côté, A.', "6' 0\""], ['Gagnon, P.', "5' 9\""], ['Lavoie, M.', "6' 2\""], ['MOREAU, J.', "5' 5\""], ['Ouellet, D.', "5' 10\""], ['Roy, G.', "5' 8\""], ['Tremblay, L.', "6' 1\""], ['Wilson, K.', "5' 11\""]].forEach(([n, h], i) => { g.fillStyle = '#1a1a1a'; g.fillText(n.padEnd(16, '.') + ' ' + h, 40, 150 + i * 52); });
      g.strokeStyle = '#a02a1a'; g.lineWidth = 3; g.beginPath(); g.ellipse(200, 352, 190, 26, 0, 0, 7); g.stroke(); g.fillStyle = '#a02a1a'; g.font = 'italic 26px "Brush Script MT", cursive'; g.fillText('exactly hers ✓', 380, 360); age(g, 640, 860, 30); }),
      0.25, 0.34, ox0 + 3.9, y + 0.795, oz0 + 5.0, -Math.PI / 2 - 0.2, 'Lista de medidas de uniformes (capataz)', true);
    // luz de vapor de sódio pendurada
    [[30, -180], [44, -184], [58, -176], [36, -190], [62, -186], [52, -167]].forEach(([a, b]) => { const g = new THREE.CylinderGeometry(0.3, 0.5, 0.35, 10, 1, true); g.translate(a, 8.5, b); K.D.add(m.iron, g, 0x2a2a2a); light(a, 8.2, b, 14, 2, 0xffb060, { vtt: 10 }); halo(a, 8.3, b, 0.8); });
    light(ox0 + 3.5, y + 2.6, oz0 + 4.5, 5, 4, 0xffe0b0, { vtt: 6 });
    vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], [[ox0, oz1], [ox0, oz0], [ox1, oz0]]);
    portals.push({ p: [doorBig, z1], a: [doorBig - 2.25, z1], b: [doorBig + 2.25, z1] }, { p: [doorP, z1], a: [doorP - 0.55, z1], b: [doorP + 0.55, z1] });
  }

  // ================= LANCHONETE LUCKY STAR (interior) =================
  {
    const { x0, x1, z0, z1 } = DINER, T = 0.25, H = 3.6;
    const ops: Opening[] = [{ side: 'N', at: x0 + 3, w: 1.0, h: 2.3, sill: 0.1 }];
    for (let xx = x0 + 5.5; xx < x1 - 1; xx += 2.2) ops.push({ side: 'N', at: xx, w: 1.8, h: 1.2, sill: 1.5 });
    shell(B, m.plain, 0xd8d4c8, x0, z0, x1, z1, H, T, ops);
    ops.filter(o => o.sill! > 1).forEach(o => W.box(m.glass, o.w, o.h, 0.03, o.at, o.sill! + o.h / 2, z0 + T / 2, 0xffffff));
    R.box(m.tin, x1 - x0 + 0.6, 0.3, z1 - z0 + 0.6, (x0 + x1) / 2, H + 0.15, (z0 + z1) / 2, 0x9a9a92);
    K.D.box(m.plain, x1 - x0 - 0.5, 0.02, z1 - z0 - 0.5, (x0 + x1) / 2, H - 0.05, (z0 + z1) / 2, 0xe8e4d8);
    K.D.box(m.paint, x1 - x0 + 0.1, 0.4, 0.1, (x0 + x1) / 2, 1.0, z0 - 0.02, 0x8a2a24);
    K.F.box(I.lino, x1 - x0 - 2 * T, 0.1, z1 - z0 - 2 * T, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, 0xffffff);
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: neonTexture('Lucky Star Diner', '#ff6a3a', { w: 640, h: 128, sub: 'OPEN ALL NIGHT · CAFÉ' }), toneMapped: false })); nm.position.set((x0 + x1) / 2, 4.6, z0 - 0.1); nm.rotation.y = Math.PI; O.add(nm); lamps.push(nm.material as THREE.MeshBasicMaterial);
    // balcão com banquetas, cafeteira, estufa de tortas; reservados (booths) junto às janelas
    K.D.box(m.paint, x1 - x0 - 4, 1.05, 0.6, (x0 + x1) / 2 + 1, 0.55, z1 - 2.6, 0xc8302a); K.D.box(I.steel, x1 - x0 - 3.8, 0.05, 0.75, (x0 + x1) / 2 + 1, 1.1, z1 - 2.6, 0xd8d8d0);
    for (let xx = x0 + 3.5; xx < x1 - 1; xx += 1.0) { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12); g.translate(xx, 0.78, z1 - 3.4); K.D.add(I.cloth, g, 0xa82a24); const p = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6); p.translate(xx, 0.38, z1 - 3.4); K.D.add(I.steel, p, 0xc8c8c0); }
    K.D.box(I.steel, x1 - x0 - 1, 0.9, 0.6, (x0 + x1) / 2, 0.45, z1 - T - 0.35, 0xb8b8b0);
    K.D.box(m.iron, 0.4, 0.5, 0.35, x1 - 3, 1.35, z1 - 2.5, 0x2a2a2a);
    for (let xx = x0 + 5.5; xx < x1 - 1; xx += 2.2) { K.D.box(m.woodDark, 0.9, 0.05, 0.7, xx, 0.75, z0 + 0.8, 0xe8e4d8); [-0.75, 0.75].forEach(s => { K.D.box(I.cloth, 0.5, 0.45, 0.8, xx + s, 0.23, z0 + 0.75, 0x8a2a24); K.D.box(I.cloth, 0.15, 0.6, 0.8, xx + s * 1.05, 0.75, z0 + 0.75, 0x8a2a24); }); }
    K.D.box(m.paint, 0.8, 1.5, 0.5, x0 + 0.8, 0.75, z1 - 1.2, 0x8a6a2a); K.D.box(m.lit, 0.6, 0.4, 0.52, x0 + 0.8, 1.2, z1 - 1.2, 0xffffff); // jukebox
    docPlane(O, docs, paper('GUEST CHECK — Lucky Star', ['Table 4 · Sun Nov 16 · 23:20', '2 coffee ............ 50¢', '1 apple pie ......... 75¢', 'Paid: Mr. Ashdown (big tip)', '', 'Dot: "He kept looking at Jean', 'like he was measuring him."'], { w: 360, h: 460, size: 18 }), 0.15, 0.19, x0 + 7.6, 0.79, z0 + 0.8, 0.3, 'Comanda da lanchonete (domingo, 16/nov)', true);
    docPlane(O, docs, canvasTex(512, 384, g => { g.fillStyle = '#1e2420'; g.fillRect(0, 0, 512, 384); g.fillStyle = '#e8e4d8'; g.font = '30px "Comic Sans MS", cursive'; ['COFFEE ............ 25¢', 'PIE (apple) ....... 75¢', 'HOT HAMBURG ...... $1.40', 'POUTINE ............ 95¢', 'Open all night'].forEach((l, i) => g.fillText(l, 30, 60 + i * 62)); }), 1.4, 1.05, (x0 + x1) / 2, 2.4, z1 - T - 0.012, Math.PI, 'Cardápio da lanchonete');
    light((x0 + x1) / 2, 3.1, (z0 + z1) / 2, 7, 4, 0xfff0d8, { vtt: 8, flick: 1 });
    vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]); portals.push({ p: [x0 + 3, z0], a: [x0 + 2.5, z0], b: [x0 + 3.5, z0] });
  }


  // ================= ALFAIATARIA ASHDOWN & SON (Main St, fechada desde 1969 — mas alguém trabalha lá à noite) =================
  if (alf) {
    const x1 = alf.x, x0 = alf.x - 14, z0 = alf.z - alf.w / 2, z1 = alf.z + alf.w / 2, zc = alf.z, H = 7.2, T = 0.3, FL = 0.16, CE = 3.6;
    const ops: Opening[] = [{ side: 'E', at: zc, w: 1.1, h: 2.4, sill: FL }, { side: 'E', at: zc - 2.3, w: 2.0, h: 2.0, sill: 0.7 }, { side: 'E', at: zc + 2.3, w: 2.0, h: 2.0, sill: 0.7 },
      ...[zc - 2.3, zc + 2.3].map(z => ({ side: 'E' as const, at: z, w: 1.0, h: 1.5, sill: 4.6 }))];
    shell(B, m.brick, 0xb08878, x0, z0, x1, z1, H, T, ops);
    ops.filter(o => o.sill! > 0.5).forEach(o => W.box(m.glass, 0.03, o.h, o.w, x1 - T / 2, o.sill! + o.h / 2, o.at, 0xffffff));
    B.box(m.brick, 0.3, 1.2, alf.w, x1 - 0.15, H + 0.6, zc, 0xb08878); K.D.box(m.plain, 0.45, 0.3, alf.w + 0.2, x1 + 0.05, H + 1.2, zc, 0xe0d8c8);
    R.box(m.tin, 13.6, 0.1, alf.w - 0.4, (x0 + x1) / 2, H + 0.05, zc, 0x8a8a84);
    R.box(m.plain, 14 - 2 * T, 0.04, alf.w - 2 * T, (x0 + x1) / 2, CE, zc, 0xd8d0c0);
    { const s2 = sign('ASHDOWN & SON · TAILORS', Math.min(alf.w - 0.6, 6.5), 0.9, { bg: '#2a2a2a', fg: '#c8b890', border: '#c8b890', font: 'Georgia, serif', sub: 'BESPOKE · ALTERATIONS · SINCE 1931' }); s2.position.set(x1 + 0.03, 3.6, zc); s2.rotation.y = Math.PI / 2; O.add(s2); }
    docPlane(O, docs, canvasTex(512, 300, g => { g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, 512, 300); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = 'bold 54px Georgia'; g.fillText('CLOSED', 256, 80); g.font = 'italic 28px Georgia'; g.fillText('Thank you for 38 years', 256, 140); g.fillText('— W. Ashdown, June 1969', 256, 182); g.fillStyle = 'rgba(200,160,60,0.5)'; g.font = 'italic 30px "Brush Script MT", cursive'; g.fillText('open again for her', 256, 260); }), 0.5, 0.29, x1 + 0.02, 1.9, zc - 1.6, Math.PI / 2, 'Placa da porta da alfaiataria');
    K.F.box(m.floor, 14 - 2 * T, 0.04, alf.w - 2 * T, (x0 + x1) / 2, FL, zc, 0x7a6a58);
    const xp = x1 - 6.5; // divisória: loja na frente, oficina no fundo
    K.wall('z', xp, z0 + T, z1 - T, FL, CE - FL, [[zc + 1.2, 1.0, 2.2]], { col: 0xc8bca0 });
    // loja: balcão, manequins nus, rolos de tecido, espelho de corpo inteiro, cadeiras
    K.D.box(m.woodDark, 0.6, 1.0, 3.2, x1 - 4.2, FL + 0.5, zc - 0.6, 0x4a3020); K.D.box(m.woodDark, 0.7, 0.05, 3.3, x1 - 4.2, FL + 1.02, zc - 0.6, 0x2a1a10);
    const manequim = (x: number, z: number, cor = 0xd8ccb0) => { const g2 = new THREE.LatheGeometry([[0, 0], [0.2, 0.02], [0.03, 0.05], [0.03, 0.9], [0.17, 0.95], [0.22, 1.15], [0.16, 1.32], [0.2, 1.45], [0.12, 1.55], [0.05, 1.62], [0, 1.64]].map(([a, b2]) => new THREE.Vector2(a, b2)), 14); g2.translate(x, FL, z); K.D.add(I.cloth, g2, cor); };
    manequim(x1 - 1.2, zc - 2.3); manequim(x1 - 1.2, zc + 2.3); manequim(x1 - 3.0, zc + 1.6, 0xb8aa90);
    for (let i = 0; i < 9; i++) { const g2 = new THREE.CylinderGeometry(0.11, 0.11, 1.2, 10); g2.rotateZ(Math.PI / 2); g2.translate(xp + 1.0, FL + 0.5 + (i % 3) * 0.3, z0 + 0.8 + Math.floor(i / 3) * 0.26); K.D.add(I.cloth, g2, [0x2a2a3a, 0x5a4a3a, 0x3a3a2a, 0x6a2a2a, 0x8a8a7a][i % 5]); }
    K.D.box(m.woodDark, 1.4, 0.05, 1.0, xp + 1.0, FL + 0.4, z0 + 1.1, 0x3a2418);
    K.D.box(I.mirror as unknown as THREE.Material, 0.03, 1.7, 0.7, xp + 0.1, FL + 1.0, zc - 2.4, 0xffffff);
    K.chair(mtx(x1 - 2.2, FL, z1 - 1.0, Math.PI));
    // oficina (fundos): mesa de corte com moldes, máquina de costura, moldes de papel do corpo dela na parede
    K.table(mtx(x0 + 3.2, FL, zc, Math.PI / 2), 2.4, 1.2, 0.9, 0x5a4030);
    K.D.box(m.plain, 2.2, 0.01, 1.0, x0 + 3.2, FL + 0.91, zc, 0xc8a878);
    K.D.box(m.iron, 0.42, 0.28, 0.2, x0 + 1.0, FL + 0.9, zc + 1.8, 0x1a1a1a); K.table(mtx(x0 + 1.0, FL, zc + 1.8, Math.PI / 2), 1.0, 0.6);
    docPlane(O, docs, canvasTex(1400, 700, g => { g.fillStyle = '#6a5a48'; g.fillRect(0, 0, 1400, 700);
      const peca = (pts: [number, number][], rot: number, lbl: string, ox: number, oy: number) => { g.save(); g.translate(ox, oy); g.rotate(rot); g.fillStyle = '#d8c098'; g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); pts.forEach(([a, b2], i) => i ? g.lineTo(a, b2) : g.moveTo(a, b2)); g.closePath(); g.fill(); g.stroke(); g.setLineDash([6, 5]); g.stroke(); g.setLineDash([]); g.fillStyle = '#2a1a10'; g.font = '18px "Courier New"'; g.fillText(lbl, 10, 30); g.restore(); };
      peca([[0, 0], [160, 0], [190, 300], [-20, 300]], 0.02, 'M. — BODICE (front)', 60, 60);
      peca([[0, 0], [150, 0], [180, 300], [-30, 300]], -0.03, 'M. — BACK  (S.K.)', 300, 70);
      peca([[0, 0], [70, 0], [90, 420], [10, 420]], 0.05, 'M. — L. ARM', 560, 60); peca([[0, 0], [70, 0], [90, 420], [10, 420]], -0.04, 'M. — R. ARM', 680, 60);
      peca([[0, 40], [40, 0], [100, 0], [120, 160], [20, 180]], 0.1, 'HANDS (E.P.) ✓', 820, 80); peca([[0, 0], [110, 0], [140, 520], [-10, 520]], 0.01, 'LEG — 5\'5" (J.M.)', 1000, 60);
      peca([[0, 0], [110, 0], [140, 520], [-10, 520]], -0.02, 'LEG', 1180, 70);
      g.fillStyle = '#a02a1a'; g.font = 'bold 30px Georgia'; g.fillText('EYES — ?', 840, 360); g.strokeStyle = '#a02a1a'; g.lineWidth = 3; g.beginPath(); g.ellipse(900, 450, 70, 40, 0, 0, 7); g.stroke();
      g.fillStyle = 'rgba(225,185,70,0.8)'; g.font = 'italic 40px "Brush Script MT", cursive'; g.fillText('make me again, Willy', 520, 640); age(g, 1400, 700, 50); }), 5.6, 2.8, x0 + T + 0.02, FL + 1.75, zc, Math.PI / 2, 'Moldes de papel na parede (alfaiataria)', false, 0.15);
    docPlane(O, docs, paper('ORDER BOOK — Ashdown & Son', ['1969 · shop closed (married, the hotel).', '', 'Oct 1975 · mill night shift — work', 'clothes, 14 men. Measured all.', 'Moreau — 5\'5". Exactly.', 'Nov 1975 · Pelletier, E. — gloves?', '"No. Her hands."', '', 'Nov 20 · EYES. Grey-green. She', 'says the old woman next door.'], { w: 460, h: 620, size: 17 }), 0.3, 0.4, x0 + 3.0, FL + 0.915, zc + 0.3, Math.PI / 2 + 0.2, 'Livro de encomendas (alfaiataria)', true);
    later(place('desk_lamp_arm_01', x0 + 3.9, FL + 0.9, zc - 0.4, 0.5, 1, O));
    light(x0 + 3.5, FL + 1.6, zc, 3, 4, 0xffd8a0, { vtt: 5, flick: 1 }); light(x1 - 3.0, CE - 0.4, zc, 3, 2, 0xffe0b0, { vtt: 5 });
    vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], [[xp, z0], [xp, zc + 0.7]], [[xp, zc + 1.7], [xp, z1]]);
    portals.push({ p: [x1, zc], a: [x1, zc - 0.55], b: [x1, zc + 0.55] });
    ALF.x = alf.x; ALF.z = alf.z; ALF.ok = true;
  }

  // ================= CASAS ABERTAS =================
  const casa = (c: { x: number; z: number; front: 'E' | 'W' }, cor: number, decor: (s: number, base: number) => void) => {
    const w = 9, d = 8, base = 0.5, h = 2.8, s = c.front === 'E' ? 1 : -1, x0 = c.x - w / 2, x1 = c.x + w / 2, z0 = c.z - d / 2, z1 = c.z + d / 2, back = c.front === 'E' ? 'W' : 'E';
    B.box(m.concrete, w, base, d, c.x, base / 2, c.z, 0x7a766e);
    shell(B, m.siding, cor, x0, z0, x1, z1, h, 0.18, [{ side: c.front, at: c.z + 1.6, w: 1.0, h: 2.15, sill: 0 }, { side: c.front, at: c.z - 2, w: 1.2, h: 1.4, sill: 0.85 }, { side: 'N', at: c.x + s * 2, w: 1.0, h: 1.3, sill: 0.9 }, { side: 'S', at: c.x + s * 2, w: 1.0, h: 1.3, sill: 0.9 }, { side: back, at: c.z, w: 1.0, h: 1.3, sill: 0.9 }], { sides: ['N', 'S'], rise: 2.4 }, base);
    [[c.front, c.z - 2, 1.2, 1.4], ['N', c.x + s * 2, 1.0, 1.3], ['S', c.x + s * 2, 1.0, 1.3], [back, c.z, 1.0, 1.3]].forEach(([sd, at, ww, hh]) => {
      const sg = sd as string, a = at as number, ww2 = ww as number, hh2 = hh as number, yy = base + 0.9 + hh2 / 2;
      if (sg === 'N' || sg === 'S') W.box(m.lit, ww2, hh2, 0.03, a, yy, sg === 'N' ? z0 + 0.09 : z1 - 0.09, 0xffffff); else W.box(m.glass, 0.03, hh2, ww2, sg === 'E' ? x1 - 0.09 : x0 + 0.09, yy, a, 0xffffff);
    });
    gableRoof(R, m.shingle, 0x5a5a5c, x0, z0, x1, z1, base + h, 2.4, 'z', 0.4);
    R.box(m.plain, w - 0.36, 0.04, d - 0.36, c.x, base + h - 0.02, c.z, 0xd8d0c4);
    K.F.box(m.floor, w - 0.36, 0.04, d - 0.36, c.x, base, c.z, 0x8a7a68);
    K.wall('z', c.x - s * 0.5, z0 + 0.18, z1 - 0.18, base, h, [[c.z + 1.0, 1.0, 2.1]], { col: 0xd0c4a8 });
    // varanda e degraus
    K.F.box(m.wood, 2.2, 0.12, 2.2, c.x + s * (w / 2 + 1.1), base - 0.06, c.z + 1.6, 0x7a6a58); [0.17, 0.34].forEach((hh, i) => K.F.box(m.wood, 0.4, hh, 1.4, c.x + s * (w / 2 + 2.4 + (1 - i) * 0.4), hh / 2, c.z + 1.6, 0x6a5a48));
    decor(s, base);
    light(c.x + s * 2.2, base + 2.3, c.z, 4, 3, 0xffd0a0, { vtt: 6 }); light(c.x - s * 2.4, base + 2.3, c.z, 3, 2, 0xffd0a0);
    vttWalls.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], [[c.x - s * 0.5, z0], [c.x - s * 0.5, c.z + 0.5]], [[c.x - s * 0.5, c.z + 1.5], [c.x - s * 0.5, z1]]);
    portals.push({ p: [c.front === 'E' ? x1 : x0, c.z + 1.6], a: [c.front === 'E' ? x1 : x0, c.z + 1.1], b: [c.front === 'E' ? x1 : x0, c.z + 2.1] });
  };
  // ---- casa de Eva Pelletier (professora de piano) ----
  casa(CASA_EVA, 0xb8a8c0, (s, base) => {
    const c = CASA_EVA, fx = (dx: number) => c.x + s * dx;
    // piano de armário com a partitura aberta
    K.D.box(m.woodDark, 0.6, 1.3, 1.5, fx(4.1), base + 0.65, c.z - 2.4, 0x1a0e08); K.D.box(m.plain, 0.25, 0.05, 1.3, fx(3.75), base + 0.75, c.z - 2.4, 0xf0ece0); K.D.box(m.woodDark, 0.45, 0.45, 0.9, fx(3.2), base + 0.23, c.z - 2.4, 0x2a1810);
    docPlane(O, docs, paper('Lesson book — Mrs. E. Pelletier', ['Tue 4 pm  — Gagnon girl (scales)', 'Wed 5 pm  — little Ouellet', 'Oct 21 — Mr. W. ASHDOWN called.', '"For my wife." Asked to see my', 'hands play. Watched them only.', 'I told him his wife is dead.', 'He said: "She doesn\'t think so."', 'Did not come back. Thank God.'], { w: 420, h: 560, size: 17 }), 0.32, 0.42, fx(3.9), base + 1.2, c.z - 2.4, s > 0 ? -Math.PI / 2 + 0.25 : Math.PI / 2 - 0.25, 'Caderno de aulas de Eva Pelletier');
    K.armchair(mtx(fx(2.0), base, c.z - 0.5, s > 0 ? Math.PI / 2 : -Math.PI / 2), 0x5a4a6a); K.rug(mtx(fx(2.5), base + 0.03, c.z - 1, 0), 2.2, 2.6, 0x4a3a5a);
    later(place('Lantern_01', fx(1.2), base, c.z + 3.2, 0, 0.6, O));
    docPlane(O, docs, canvasTex(600, 420, g => { g.fillStyle = '#2a2420'; g.fillRect(0, 0, 600, 420); photo(g, 20, 20, 260, 340, 'girl', 'recital 1974'); photo(g, 320, 30, 250, 320, 'group', 'my pupils'); }), 1.0, 0.7, fx(4.33), base + 1.9, c.z - 0.4, s > 0 ? -Math.PI / 2 : Math.PI / 2, 'Fotos na sala de Eva Pelletier');
    K.bed(mtx(fx(-2.4), base, c.z - 3.6, 0), { blanket: 0x6a5a7a }); K.nightstand(mtx(fx(-3.6), base, c.z - 3.4, 0));
  });
  // ---- casa de Jean e Lise Moreau ----
  casa(CASA_MOREAU, 0xa8b0a0, (s, base) => {
    const c = CASA_MOREAU, fx = (dx: number) => c.x + s * dx;
    K.table(mtx(fx(2.4), base, c.z - 1.8, 0), 1.2, 0.8, 0.76, 0x4a3020, 0xe8e0c8);
    [-0.7, 0.7].forEach(dz => K.chair(mtx(fx(2.4), base, c.z - 1.8 + dz, dz > 0 ? Math.PI : 0)));
    [-0.25, 0.25].forEach(dz => { const g = new THREE.CylinderGeometry(0.13, 0.11, 0.03, 14); g.translate(fx(2.4), base + 0.79, c.z - 1.8 + dz); K.D.add(I.steel, g, 0xe8e4dc); });
    later(place('Television_01', fx(4.0), base, c.z + 0.2, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0.8, O));
    K.armchair(mtx(fx(1.6), base, c.z + 0.4, s > 0 ? Math.PI / 2 : -Math.PI / 2), 0x6a5a3a);
    docPlane(O, docs, paper('Jean —', ['Your supper is in the oven since', 'Sunday. I keep it warm. I know.', 'Mr. Ashdown came Monday with', 'flowers and said how sorry he', 'was. He asked if you had a', 'brother. Why would he ask that?', 'Come home. — Lise'], { w: 400, h: 520, size: 18 }), 0.2, 0.26, fx(2.5), base + 0.78, c.z - 1.6, 0.4, 'Bilhete de Lise Moreau', true);
    docPlane(O, docs, paper('ASHDOWN & SON — FITTING CARD', ['Client: MOREAU, Jean', 'Height 5 ft 5 in', 'Chest 36 · Sleeve 31', 'Fitting: Sat Nov 15, rm 307', 'Laurentian Hotel', '"No charge."'], { w: 340, h: 420, size: 18 }), 0.16, 0.2, fx(3.2), base + 0.78, c.z - 2.0, -0.2, 'Cartão de prova de roupa (Moreau)', true);
    K.bed(mtx(fx(-2.4), base, c.z - 3.6, 0), { blanket: 0x3a5a6a, messy: true }); K.dresser(mtx(fx(-2.6), base, c.z + 3.82, Math.PI), true);
  });

  B.build(O).forEach(o => extra.push(o)); W.build(O, { shadow: false }); R.build(roofs);
  const r = K.build(Q.lights > 8);
  await Promise.all(P);
  void boxUV; void sign; void bxM;
  return { docs, solids: [...extra, ...r.walls], floors: r.floors, roofs, vttWalls, portals, lamps, layers: [{ n: 'Telhados (fábrica, lanchonete, casas)', o: roofs, v: true }] };
}
