// Necrotério do Distrito de Greywater (e gabinete do legista) — prédio térreo de concreto na Queen St.
// Recepção com o livro de liberação de corpos, gabinete do Dr. Finch, sala de autópsia (azulejo, mesas de aço,
// um corpo coberto), câmara fria com 12 gavetas (a nº 4 aberta e vazia) e saída dos fundos para o carro fúnebre.
// Terror sutil: nada à mostra — lençóis, etiquetas, datas e assinaturas que não batem.
import * as THREE from 'three';
import { place } from '../../core/models';
import { halo } from '../../core/kit';
import { Batch, reseed, TM, shell, light, sign, mtx, bxM, MORGUE, Q } from './common';
import { Kit, IM, canvasTex, docPlane, sigilKnow, type Interior } from './interior';
import { paper, age } from '../texas/police';

const X0 = MORGUE.x0, Z0 = MORGUE.z0, W = MORGUE.x1 - MORGUE.x0, D = MORGUE.z1 - MORGUE.z0;
const FL = 0.35, H = 4.0, CEIL = 3.2, T = 0.3;
const wx = (x: number) => X0 + x, wz = (z: number) => Z0 + z;

export async function buildMorgue(G: THREE.Group): Promise<Interior> {
  reseed(6541);
  const m = TM(), I = IM();
  const O = new THREE.Group(); O.name = 'necroterio'; G.add(O);
  const roofs = new THREE.Group(); roofs.name = 'telhado-necroterio'; G.add(roofs);
  const K = new Kit(O, 'necroterio'), B = new Batch('necroterio-casca'), GL = new Batch('necroterio-vidro'), R = new Batch('necroterio-teto');
  const docs: Interior['docs'] = [], lamps: THREE.MeshBasicMaterial[] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const tube = new THREE.MeshBasicMaterial({ color: 0xdfe8f0 });

  // ---------- casca de concreto ----------
  const ops = [
    { side: 'N' as const, at: wx(4), w: 1.3, h: 2.4, sill: FL }, ...[1.6, 6.6, 11, 15.5].map(x => ({ side: 'N' as const, at: wx(x), w: 1.2, h: 1.5, sill: 1.2 })),
    { side: 'W' as const, at: wz(3), w: 1.2, h: 1.5, sill: 1.2 }, { side: 'W' as const, at: wz(12), w: 1.8, h: 0.7, sill: 2.3 },
    { side: 'S' as const, at: wx(5), w: 1.8, h: 0.7, sill: 2.3 }, { side: 'S' as const, at: wx(14), w: 1.6, h: 2.4, sill: FL },
    { side: 'E' as const, at: wz(7), w: 1.0, h: 2.3, sill: FL }, { side: 'E' as const, at: wz(3), w: 1.2, h: 1.5, sill: 1.2 },
  ];
  shell(B, m.stone, 0xe0dcd0, X0, Z0, X0 + W, Z0 + D, H, T, ops);
  ops.filter(o => o.sill > 1).forEach(o => {
    const along = o.side === 'N' || o.side === 'S', face = o.side === 'N' ? Z0 : o.side === 'S' ? Z0 + D : o.side === 'W' ? X0 : X0 + W, out = o.side === 'N' || o.side === 'W' ? -1 : 1;
    const c = face - out * T / 2, y = o.sill + o.h / 2;
    if (along) { GL.box(m.glass, o.w, o.h, 0.03, o.at, y, c, 0xffffff); K.D.box(m.plain, o.w + 0.1, 0.08, 0.4, o.at, o.sill - 0.04, face + out * 0.05, 0xb8b4aa); }
    else { GL.box(m.glass, 0.03, o.h, o.w, c, y, o.at, 0xffffff); K.D.box(m.plain, 0.4, 0.08, o.w + 0.1, face + out * 0.05, o.sill - 0.04, o.at, 0xb8b4aa); }
  });
  // vidro fosco (vidro aramado) nas janelas altas
  // laje, platibanda, forro
  R.box(m.concrete, W + 0.4, 0.3, D + 0.4, X0 + W / 2, H + 0.15, Z0 + D / 2, 0x7a7670);
  [[W + 0.4, 0.3, X0 + W / 2, Z0 - 0.05], [W + 0.4, 0.3, X0 + W / 2, Z0 + D + 0.05]].forEach(([w, d, x, z]) => R.box(m.concrete, w, 0.6, d, x, H + 0.6, z, 0x9a968e));
  [[X0 - 0.05], [X0 + W + 0.05]].forEach(([x]) => R.box(m.concrete, 0.3, 0.6, D + 0.4, x, H + 0.6, Z0 + D / 2, 0x9a968e));
  R.box(m.plain, W - 2 * T, 0.03, D - 2 * T, X0 + W / 2, CEIL, Z0 + D / 2, 0xd8d8d0);
  // tinta clara acima do azulejo (a casca de concreto por dentro fica escura)
  [[T + 0.02, 'z'], [W - T - 0.02, 'z']].forEach(([x]) => R.box(m.plain, 0.02, CEIL - FL - 2.0, D - 2 * T, wx(x as number), FL + 2.0 + (CEIL - FL - 2.0) / 2, Z0 + D / 2, 0xc8ccc0));
  [T + 0.02, D - T - 0.02].forEach(z => R.box(m.plain, W - 2 * T, CEIL - FL - 2.0, 0.02, X0 + W / 2, FL + 2.0 + (CEIL - FL - 2.0) / 2, wz(z), 0xc8ccc0));
  // piso: linóleo xadrez; degraus da frente e rampa dos fundos
  K.F.box(m.concrete, W - 2 * T, FL, D - 2 * T, X0 + W / 2, FL / 2, Z0 + D / 2, 0x9a9890);
  K.F.box(I.lino, W - 2 * T, 0.01, D - 2 * T, X0 + W / 2, FL + 0.005, Z0 + D / 2, 0xffffff);
  [0.12, 0.24].forEach((h, i) => K.F.box(m.concrete, 2.4, h, 0.4, wx(4), h / 2, Z0 - 0.2 - (1 - i) * 0.4, 0xa8a49a));
  K.F.box(m.concrete, 2.6, 0.2, 3.0, wx(14), 0.1, Z0 + D + 1.5, 0x9a968e);
  // placa, luminária da porta e bandeira
  { const s = sign('DISTRICT OF GREYWATER', 5.2, 0.42, { bg: '#2a2c2e', fg: '#d8d4c8', font: 'Georgia, serif' }); s.position.set(wx(4), 3.25, Z0 - 0.04); s.rotation.y = Math.PI; O.add(s);
    const s2 = sign("CORONER · MORGUE · MORGUE DU DISTRICT", 4.6, 0.28, { bg: '#2a2c2e', fg: '#c8c4b8' }); s2.position.set(wx(4), 2.9, Z0 - 0.04); s2.rotation.y = Math.PI; O.add(s2);
    const s3 = sign('DELIVERIES — REAR · NO ADMITTANCE', 2.2, 0.3, { bg: '#e8e2d0', fg: '#8a1a14', border: '#8a1a14' }); s3.position.set(wx(14), 3.0, Z0 + D + 0.02); O.add(s3);
    light(wx(4), 2.7, Z0 - 0.5, 4, 5, 0xe8f0ff, { vtt: 5, flick: 3 }); halo(wx(4), 2.75, Z0 - 0.3, 0.6);
    light(wx(14), 2.9, Z0 + D + 0.5, 3, 3, 0xffd8a0, { vtt: 4 }); halo(wx(14), 2.95, Z0 + D + 0.25, 0.5); }

  // ---------- paredes internas ----------
  const tileW = { mat: I.tile, col: 0xffffff, lambri: 0 }, paintW = { col: 0xc8ccb8, lambri: 1.1, lambriCol: 0x4a5a4a };
  K.wall('z', wx(8), wz(T), wz(6), FL, CEIL - FL, [[wz(4.5), 0.9, 2.15]], paintW);
  K.wall('x', wz(6), wx(T), wx(W - T), FL, CEIL - FL, [[wx(3), 1.0, 2.2], [wx(13), 0.9, 2.15]], paintW);
  K.wall('x', wz(8), wx(T), wx(10), FL, CEIL - FL, [[wx(5), 1.4, 2.3]], tileW);
  K.wall('x', wz(8), wx(10), wx(W - T), FL, CEIL - FL, [[wx(14), 1.2, 2.3]], tileW);
  K.wall('z', wx(10), wz(8), wz(D - T), FL, CEIL - FL, [[wz(14), 1.2, 2.3]], tileW);
  // azulejo nas paredes externas da autópsia e da câmara fria
  [[T + 0.01, 8, D - T, 'z'], [W - T - 0.01, 8, D - T, 'z']].forEach(([x, a, b]) => K.B.box(I.tile, 0.02, 2.0, (b as number) - (a as number), wx(x as number), FL + 1.0, wz(((a as number) + (b as number)) / 2), 0xffffff));
  K.B.box(I.tile, W - 2 * T, 2.0, 0.02, X0 + W / 2, FL + 1.0, wz(D - T - 0.01), 0xffffff);
  const vttWalls: Interior['vttWalls'] = [
    [[X0, Z0], [X0 + W, Z0], [X0 + W, Z0 + D], [X0, Z0 + D], [X0, Z0]],
    [[wx(8), wz(T)], [wx(8), wz(4.05)]], [[wx(8), wz(4.95)], [wx(8), wz(6)]], [[wx(T), wz(6)], [wx(2.5), wz(6)]], [[wx(3.5), wz(6)], [wx(12.55), wz(6)]], [[wx(13.45), wz(6)], [wx(W - T), wz(6)]],
    [[wx(T), wz(8)], [wx(4.3), wz(8)]], [[wx(5.7), wz(8)], [wx(13.4), wz(8)]], [[wx(14.6), wz(8)], [wx(W - T), wz(8)]], [[wx(10), wz(8)], [wx(10), wz(13.4)]], [[wx(10), wz(14.6)], [wx(10), wz(D - T)]],
  ];
  const portals: Interior['portals'] = [{ p: [wx(4), Z0], a: [wx(3.35), Z0], b: [wx(4.65), Z0] }, { p: [wx(14), Z0 + D], a: [wx(13.2), Z0 + D], b: [wx(14.8), Z0 + D] }, { p: [X0 + W, wz(7)], a: [X0 + W, wz(6.5)], b: [X0 + W, wz(7.5)] }];

  // luzes fluorescentes (tubos sem luz própria; poucas PointLights)
  const fluo = (x: number, z: number, along: 'x' | 'z' = 'x') => { const g = along === 'x' ? new THREE.BoxGeometry(1.2, 0.05, 0.12) : new THREE.BoxGeometry(0.12, 0.05, 1.2); g.translate(wx(x), CEIL - 0.04, wz(z)); K.D.add(tube, g, 0xffffff); };
  fluo(4, 3); fluo(13, 3); fluo(4, 7); fluo(13, 7); fluo(3, 12, 'z'); fluo(7, 12, 'z'); fluo(14, 10); fluo(14, 14);
  light(wx(4), CEIL - 0.3, wz(3), 5, 3, 0xe8f0ff, { vtt: 6 }); light(wx(13), CEIL - 0.3, wz(3), 4, 2, 0xffe0b0, { vtt: 6 });
  light(wx(5), CEIL - 0.3, wz(12), 8, 6, 0xe8f4ff, { vtt: 7 }); light(wx(14), CEIL - 0.3, wz(12), 4, 5, 0xc8dcff, { vtt: 6, flick: 3 });
  light(wx(9), CEIL - 0.3, wz(7), 3, 1, 0xe8f0ff);

  // ---------- recepção ----------
  { const Mc = mtx(wx(4), FL, wz(2.6), 0);
    bxM(K.D, m.woodDark, 4.2, 1.05, 0.55, 0, 0.525, 0, 0x5a5040, Mc); bxM(K.D, m.woodDark, 4.4, 0.05, 0.65, 0, 1.07, 0, 0x3a3020, Mc);
    K.D.box(m.woodDark, 2.2, 0.45, 0.45, wx(1.5), FL + 0.22, wz(0.75), 0x4a3a2a); // banco de espera
    K.D.box(m.iron, 0.5, 1.3, 0.6, wx(7.4), FL + 0.65, wz(5.4), 0x5a5a52); // arquivo
    { const g = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6); g.translate(wx(0.7), FL + 0.9, wz(5.4)); K.D.add(m.woodDark, g, 0x2a2018); }
    docPlane(O, docs, canvasTex(1024, 680, g => { g.fillStyle = '#e4dcc8'; g.fillRect(0, 0, 1024, 680); g.fillStyle = '#1e1a16'; g.font = 'bold 26px "Courier New"'; g.fillText('RELEASE OF REMAINS — 1965', 30, 44);
      g.font = '17px "Courier New"'; g.fillText('DATE    CASE    NAME                 TO               SIGNED', 30, 90); g.fillRect(30, 98, 960, 2);
      const rows = [['Nov 02', '65-38', 'Lacroix, P.', 'Gauthier F.H.', 'H. Finch'], ['Nov 06', '65-39', 'Ste-Marie, R.', 'Gauthier F.H.', 'H. Finch'], ['Nov 10', '65-40', 'Pelletier, E.', 'Gauthier F.H.', 'H. Finch'], ['Nov 15', '65-41', 'Pelletier, E. (re-exam)', '— RETURNED —', 'H. Finch'], ['Nov 17', '65-42', 'Kowalczyk, S.', '"family"', 'H. Finch'], ['Nov 18', '65-43', 'Moreau, J. (pending)', 'NOT RECOVERED', '']];
      rows.forEach((r, i) => { const y = 132 + i * 52; g.fillStyle = '#1e1a16'; g.font = '17px "Courier New"'; [r[0], r[1], r[2], r[3]].forEach((t, k) => g.fillText(t, [30, 120, 210, 540][k], y)); g.fillStyle = i === 4 ? '#2a2a7a' : '#1a1a4a'; g.font = (i === 4 ? 'italic 30px' : 'italic 26px') + ' "Brush Script MT", cursive'; g.save(); if (i === 4) { g.translate(800, y); g.rotate(0.06); g.fillText('H. Finch', 0, 0); } else g.fillText(r[4], 790, y); g.restore(); });
      g.strokeStyle = 'rgba(170,30,20,0.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(860, 340, 90, 30, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(170,30,20,0.85)'; g.font = 'italic 22px Georgia'; g.fillText('not my hand — H.F.', 700, 400);
      age(g, 1024, 680, 30); }), 0.6, 0.4, wx(4.6), FL + 1.1, wz(2.6), 0.15, 'Livro de liberação de corpos (recepção)', true);
    later(place('Lantern_01', wx(2.4), FL + 1.1, wz(2.6), 0, 0.5, O));
  }
  // ---------- gabinete do legista ----------
  { later(place('metal_office_desk', wx(13), FL, wz(2.2), 0, 1, O)); K.chair(mtx(wx(13), FL, wz(1.2), 0));
    [16.8, 17.4].forEach(x => K.D.box(m.iron, 0.55, 1.35, 0.6, wx(x), FL + 0.68, wz(5.3), 0x4a524a));
    later(place('desk_lamp_arm_01', wx(12.4), FL + 0.78, wz(2.4), 0.6, 1, O));
    docPlane(O, docs, paper('OFFICE OF THE CORONER — MEMO', ['To: Cst. A. Roy, O.P.P.', 'Re: Pelletier, Eva (65-40)', 'Remains returned to us Nov 15 after the', 'grave at St. Columba was found disturbed.', 'Left hand ABSENT. Removed after death,', 'skilfully. Wound closed with black linen', 'thread — a tailor\'s blind stitch.', 'I recommend the grave be watched.', '— H. Finch, M.D.'], { w: 480, h: 640, size: 17, stamp: 'CONFIDENTIAL' }), 0.24, 0.32, wx(13.2), FL + 0.79, wz(2.3), -0.1, 'Memorando do legista (gabinete)', true);
    docPlane(O, docs, canvasTex(900, 600, g => { g.fillStyle = '#26302a'; g.fillRect(0, 0, 900, 600); g.strokeStyle = '#6a4a2a'; g.lineWidth = 20; g.strokeRect(0, 0, 900, 600); g.fillStyle = '#e4e4dc'; g.font = '30px "Comic Sans MS", cursive';
      ['65-40  Pelletier E.   — hand (L)', '65-42  Kowalczyk S.   — released?? to whom', '65-43  Moreau J.      — missing (bridge)', '', 'all: same thread, same stitch', 'Ashdown, M. (Dec 64) — "fall"?', '   → re-read my own report'].forEach((l, i) => g.fillText(l, 40, 70 + i * 66));
      g.strokeStyle = '#e4d070'; g.lineWidth = 3; g.beginPath(); g.ellipse(330, 400, 300, 34, 0, 0, 7); g.stroke(); }), 2.0, 1.33, wx(W - T - 0.02), FL + 1.75, wz(3.2), -Math.PI / 2, 'Quadro-negro do Dr. Finch');
    K.armchair(mtx(wx(9.3), FL, wz(1.2), 0.8), 0x4a3a2a);
  }
  // ---------- autópsia ----------
  { const tableA = (x: number, z: number, body: boolean) => {
      K.D.box(I.steel, 0.8, 0.06, 2.2, wx(x), FL + 0.88, wz(z), 0xc8c8c0); K.D.box(I.steel, 0.86, 0.08, 2.26, wx(x), FL + 0.84, wz(z), 0xa8a8a0);
      { const g = new THREE.CylinderGeometry(0.12, 0.2, 0.8, 10); g.translate(wx(x), FL + 0.4, wz(z)); K.D.add(I.steel, g, 0x9a9a92); }
      if (body) K.covered(mtx(wx(x), FL + 0.91, wz(z - 1.0), 0), 0);
      // luminária cirúrgica
      { const g = new THREE.CylinderGeometry(0.35, 0.45, 0.25, 16, 1, true); g.translate(wx(x), CEIL - 0.9, wz(z)); K.D.add(I.steel, g, 0x8a8a84); const d = new THREE.CircleGeometry(0.33, 16); d.rotateX(Math.PI / 2); d.translate(wx(x), CEIL - 1.02, wz(z)); K.D.add(tube, d, 0xffffff); const r = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6); r.translate(wx(x), CEIL - 0.4, wz(z)); K.D.add(I.steel, r, 0x6a6a64); }
    };
    tableA(3, 12, true); tableA(7, 12, false);
    // pia comprida, balança, carrinho de instrumentos, ralo
    K.D.box(I.steel, 0.7, 0.9, 3.6, wx(T + 0.4), FL + 0.45, wz(12), 0xd8d8d0); K.D.box(I.steel, 0.5, 0.2, 1.0, wx(T + 0.4), FL + 0.85, wz(11), 0x9a9a92);
    K.D.box(I.steel, 0.4, 0.04, 0.3, wx(9.3), FL + 1.5, wz(9), 0xc8c8c0); { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 14); g.translate(wx(9.3), FL + 1.6, wz(9)); K.D.add(I.steel, g, 0xd8d0b0); }
    K.D.box(I.steel, 0.6, 0.04, 0.45, wx(5), FL + 0.8, wz(14.6), 0xc8c8c0); K.D.box(I.steel, 0.04, 0.8, 0.04, wx(4.75), FL + 0.4, wz(14.4), 0x9a9a92); K.D.box(I.steel, 0.04, 0.8, 0.04, wx(5.25), FL + 0.4, wz(14.8), 0x9a9a92);
    { const g = new THREE.CircleGeometry(0.12, 12); g.rotateX(-Math.PI / 2); g.translate(wx(5), FL + 0.02, wz(12)); K.D.add(m.iron, g, 0x1a1a1a); }
    docPlane(O, docs, canvasTex(512, 640, g => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, 512, 640); g.fillStyle = '#1a1a1a'; g.font = 'bold 26px "Courier New"'; g.fillText('CASE 65-41 · RE-EXAM', 24, 50); g.font = '19px "Courier New"';
      ['Pelletier, Eva, 58', 'Exhumed Nov 15 (grave disturbed)', '', 'Body otherwise as buried.', 'Left hand: ABSENT.', 'Black linen thread, 14 stitches,', 'even, tight, "like a seam".', '', 'Fingerprints of the hand are on', 'file (she taught piano).', '', 'Toe tag re-tied. Not by us.'].forEach((l, i) => g.fillText(l, 24, 100 + i * 34)); age(g, 512, 640, 20); }), 0.24, 0.3, wx(5.05), FL + 0.83, wz(14.55), 0.3, 'Ficha da reexumação (autópsia)', true);
  }
  // ---------- câmara fria: 12 gavetas, a nº 4 aberta e vazia ----------
  { const dt = canvasTex(1024, 600, g => { g.fillStyle = '#6a6c6a'; g.fillRect(0, 0, 1024, 600);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 16 + c * 252, y = 16 + r * 194, n = r * 4 + c + 1; g.fillStyle = n === 4 ? '#141414' : '#b8bab4'; g.fillRect(x, y, 236, 178); if (n === 4) continue;
        g.strokeStyle = '#7a7c78'; g.lineWidth = 4; g.strokeRect(x + 6, y + 6, 224, 166); g.fillStyle = '#8a8a84'; g.fillRect(x + 90, y + 74, 56, 26); g.fillStyle = '#e8e4d0'; g.fillRect(x + 80, y + 120, 76, 30); g.fillStyle = '#1a1a1a'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText(String(n), x + 118, y + 143);
        if (n === 7) { g.save(); g.globalAlpha = 0.55; sigilKnow(g, x + 118, y + 70, 46, 'rgba(225,190,90,0.9)', 3); g.restore(); } }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(235,245,250,${Math.random() * 0.12})`; g.fillRect(Math.random() * 1024, Math.random() * 600, 3, 3); } });
    docPlane(O, docs, dt, 6.8, 4.0 * 0.62 * 0.95, wx(W - T - 0.03), FL + 1.35, wz(12.1), -Math.PI / 2, 'Gavetas da câmara fria');
    // gaveta 4 puxada para fora (vazia, com a etiqueta pendurada)
    const gz = wz(12.1) - 6.8 / 2 + (0.016 + 3 * 0.246 + 0.115) * 6.8, gy = FL + 1.35 + 2.42 / 2 - (0.027 + 0.148) * 2.42;
    K.D.box(I.steel, 1.9, 0.06, 0.8, wx(W - T - 0.95), gy - 0.2, gz, 0xc8c8c0); [-1, 1].forEach(s => K.D.box(I.steel, 1.9, 0.14, 0.03, wx(W - T - 0.95), gy - 0.14, gz + s * 0.39, 0xb8b8b0)); K.D.box(I.steel, 0.04, 0.5, 0.8, wx(W - T - 1.9), gy - 0.0, gz, 0xb8bab4);
    docPlane(O, docs, canvasTex(256, 140, g => { g.fillStyle = '#e8e2c8'; g.fillRect(0, 0, 256, 140); g.fillStyle = '#1a1a1a'; g.font = 'bold 20px "Courier New"'; g.fillText('No. 4', 14, 30); g.font = '17px "Courier New"'; ['KOWALCZYK, S.', '65-42 · vagrant', 'RELEASED 17/11', '"to family" — ??'].forEach((l, i) => g.fillText(l, 14, 58 + i * 22)); }), 0.16, 0.09, wx(W - T - 1.93), gy - 0.12, gz + 0.2, -Math.PI / 2, 'Etiqueta da gaveta 4');
    // maca com lençol dobrado
    K.D.box(I.steel, 0.65, 0.05, 1.9, wx(12), FL + 0.8, wz(11), 0xb8b8b0); [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]].forEach(([a, b]) => K.D.box(I.steel, 0.03, 0.8, 0.03, wx(12 + a), FL + 0.4, wz(11 + b), 0x8a8a84));
    K.D.box(I.cloth, 0.55, 0.08, 0.6, wx(12), FL + 0.86, wz(11.5), 0xe8e4dc);
    // porta pesada da câmara (entreaberta)
    K.door(wx(13.4), FL, wz(8.0), -0.7, 1.2, 2.3, 0x9aa0a0);
  }
  // carro fúnebre nos fundos
  later(place('covered_car', wx(14), 0, Z0 + D + 6.5, Math.PI / 2, 1, O));

  const solidsB = B.build(O); GL.build(O, { shadow: false });
  const r = K.build(Q.lights > 8); R.build(roofs);
  await Promise.all(P);
  return { docs, solids: [...solidsB, ...r.walls], floors: r.floors, roofs, vttWalls, portals, lamps, layers: [] };
}
