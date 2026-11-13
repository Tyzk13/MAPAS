// Harlow House — pousada de madeira na Commerce St oeste: recepção, sala de jantar, apartamento da dona,
// corredor e 6 quartos. Cada quarto tem um morador (ver docs/casos/harlow-caso-whitlock.md, "A pousada") e
// pertences legíveis de perto. O quarto 6 está "reservado" — para os agentes, com os nomes já no livro.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { wallGeo } from '../igreja/common';
import { Batch, mtx, rnd, reseed, TM, shell, light, rect, sign, HOTEL, Q } from './common';
import { mk, age, paper, photo } from './police';
import type { Police } from './police';

const X0 = HOTEL.x0, Z0 = HOTEL.z0, W = HOTEL.x1 - HOTEL.x0, D = HOTEL.z1 - HOTEL.z0;
const FL = 0.3, H = 3.6, CEIL = 3.0, T = 0.25, IT = 0.12;
const wx = (x: number) => X0 + x, wz = (z: number) => Z0 + z;
const CZ = 6, CZ2 = 8; // corredor entre z 6 e 8; quartos de 8 a 16

export async function buildHotel(G: THREE.Group): Promise<Police> {
  reseed(1987);
  const m = TM();
  const B = new Batch('pousada'), Dt = new Batch('pousada-detalhes'), F = new Batch('pousada-piso'), R = new Batch('pousada-teto');
  const roofs = new THREE.Group(); roofs.name = 'telhado-pousada'; G.add(roofs);
  const vttWalls: Police['vttWalls'] = [], portals: Police['portals'] = [], lamps: THREE.MeshBasicMaterial[] = [];
  const docs: Police['docs'] = []; let nextName = ''; const nm = (n: string) => { nextName = n; };
  const bx = (b: Batch, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, c: number, ry = 0) => b.box(mat, w, h, d, wx(x), y, wz(z), c, ry);
  /** documento: ry 0 = olha +z, π = −z, π/2 = +x, −π/2 = −x; flat = deitado */
  const doc = (t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, flat = false) => {
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, envMapIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }));
    mm.position.set(wx(x), y, wz(z)); if (flat) mm.rotation.set(-Math.PI / 2, 0, ry); else mm.rotation.y = ry;
    mm.userData.ns = 1; mm.userData.cullDist = 40; mm.geometry.computeBoundingSphere(); G.add(mm);
    if (nextName) { docs.push({ o: mm, n: nextName }); nextName = ''; } return mm;
  };
  const wallIn = 0xd8c8a8, wallLo = 0x7a5a40; // papel de parede creme e lambri escuro

  // ---------- casca (tábuas pintadas) com porta e janelas ----------
  const roomsX = [0, 1, 2, 3, 4, 5].map(i => i * 4 + 2);
  shell(B, m.siding, 0xd8ccb0, X0, Z0, X0 + W, Z0 + D, H, T, [
    { side: 'N', at: wx(12), w: 1.6, h: 2.3, sill: FL },
    ...[3, 6, 18, 21].map(x => ({ side: 'N' as const, at: wx(x), w: 1.1, h: 1.4, sill: 1.0 })),
    ...roomsX.map(x => ({ side: 'S' as const, at: wx(x), w: 0.9, h: 1.2, sill: 1.1 })),
  ], { sides: ['W', 'E'], rise: 2.2 });
  // telhado de duas águas (cumeeira em x) — camada do telhado
  { const half = D / 2 + 0.5, L = Math.hypot(half, 2.2), a = Math.atan2(2.2, half);
    [-1, 1].forEach(s => { const g = new THREE.BoxGeometry(W + 0.8, 0.12, L); boxUV(g); g.applyMatrix4(new THREE.Matrix4().makeRotationX(-s * a)); g.translate(wx(W / 2), H + 1.1 + 0.06, wz(D / 2) - s * half / 2); R.add(m.shingle, g, 0x6a5a50); }); }
  bx(R, m.plain, W - 2 * T, 0.05, D - 2 * T, W / 2, CEIL + 0.03, D / 2, 0xe8e0d0);
  // varanda da frente (deque, colunas, telhadinho) e degraus
  bx(F, m.wood, 16, FL, 2.6, 12, FL / 2, -1.3, 0x9a7a5a);
  [0.12, 0.2].forEach((h, s) => bx(F, m.wood, 2.2, h, 0.4, 12, h / 2, -2.8 - (1 - s) * 0.4, 0x8a6a4a));
  [4.2, 8, 16, 19.8].forEach(x => bx(Dt, m.paint, 0.14, 2.6, 0.14, x, FL + 1.3, -2.4, 0xe8e0d0));
  bx(Dt, m.tin, 16.6, 0.08, 3.0, 12, FL + 2.7, -1.4, 0x8a8a84);
  for (let x = 4.6; x < 19.6; x += 0.5) if (Math.abs(x - 12) > 1.2) bx(Dt, m.paint, 0.05, 0.7, 0.05, x, FL + 0.35, -2.4, 0xe8e0d0);
  bx(Dt, m.paint, 15.6, 0.06, 0.08, 12, FL + 0.72, -2.4, 0xe8e0d0);
  F.box(m.sidewalk, 2.2, 0.1, Z0 - 6, wx(12), 0.05, (Z0 + 6) / 2 - 1.5, 0xb8b2a8); // caminho até a calçada da rua
  { const s = sign('THE HARLOW HOUSE', 7, 0.8, { bg: '#2a3a2a', fg: '#e8d8a0', border: '#e8d8a0', font: 'Georgia, serif', sub: 'HOTEL · ROOMS BY THE WEEK · EST. 1911' }); s.position.set(wx(12), FL + 3.15, wz(-2.95)); s.rotation.y = Math.PI; G.add(s); }
  { const v = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), new THREE.MeshBasicMaterial({ color: 0xff4040, toneMapped: false }));
    const vt = sign('VACANCY', 1.1, 0.3, { bg: '#1a0a0a', fg: '#ff5050' }); vt.position.set(wx(13.6), FL + 2.1, wz(-0.03)); vt.rotation.y = Math.PI; G.add(vt); void v; }
  light(wx(12), FL + 2.5, wz(-1.4), 4, 6, 0xffc070, { vtt: 6 });

  // ---------- piso, lambri, papel de parede ----------
  bx(F, m.floor, W - 2 * T, FL, D - 2 * T, W / 2, FL / 2, D / 2, 0x8a6a50);
  // paredes externas: as tábuas ficam aparentes por dentro (um painel liso taparia as janelas)

  // ---------- paredes internas ----------
  const HI = CEIL - FL;
  const seg = (axis: 'x' | 'z', c: number, u: number, v: number): [number, number][] => axis === 'z' ? [[wx(u), wz(c)], [wx(v), wz(c)]] : [[wx(c), wz(u)], [wx(c), wz(v)]];
  const iw = (axis: 'x' | 'z', c: number, a: number, b: number, holes: { at: number; w: number; h: number }[] = []) => {
    const L = b - a, mid = (a + b) / 2;
    const g = wallGeo(L, HI, IT, holes.map(h => ({ pts: rect(h.w, h.h), x: axis === 'z' ? h.at - mid : mid - h.at, y: 0 })));
    g.applyMatrix4(axis === 'z' ? mtx(wx(mid), FL, wz(c) - IT / 2) : mtx(wx(c) - IT / 2, FL, wz(mid), Math.PI / 2)); boxUV(g); B.add(m.plain, g, wallIn);
    [-1, 1].forEach(s => { if (axis === 'z') bx(Dt, m.plain, L, 0.9, 0.01, mid, FL + 0.45, c + s * (IT / 2 + 0.006), wallLo); else bx(Dt, m.plain, 0.01, 0.9, L, c + s * (IT / 2 + 0.006), FL + 0.45, mid, wallLo); });
    const cuts = holes.map(h => [h.at - h.w / 2, h.at + h.w / 2]).sort((p, q) => p[0] - q[0]);
    let s0 = a; cuts.forEach(([u, v]) => { vttWalls.push(seg(axis, c, s0, u)); s0 = v; const [pa, pb] = seg(axis, c, u, v); portals.push({ p: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], a: pa, b: pb }); }); vttWalls.push(seg(axis, c, s0, b));
  };
  iw('x', 8, T, CZ, [{ at: 3.2, w: 1.8, h: 2.3 }]);          // sala de jantar ↔ recepção (passagem larga)
  iw('x', 16, T, CZ, [{ at: 4.6, w: 0.9, h: 2.1 }]);         // apartamento da dona
  iw('z', CZ, T, 8 - IT / 2); iw('z', CZ, 16 + IT / 2, W - T);
  iw('z', CZ2, T, W - T, roomsX.map(x => ({ at: x - 0.9, w: 0.85, h: 2.1 })));
  [4, 8, 12, 16, 20].forEach(x => iw('x', x, CZ2 + IT / 2, D - T));
  vttWalls.push([[X0, Z0], [wx(11.2), Z0]], [[wx(12.8), Z0], [X0 + W, Z0], [X0 + W, Z0 + D], [X0, Z0 + D], [X0, Z0]]);
  portals.push({ p: [wx(12), Z0], a: [wx(11.2), Z0], b: [wx(12.8), Z0] });
  // portas (abertas em ângulos diferentes; a do quarto 2 fechada)
  const door = (x: number, z: number, ang: number, w = 0.85) => { const d = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, 2.08, 0.045)), m.woodDark); d.geometry.translate(w / 2, 1.04, 0); d.position.set(wx(x), FL, wz(z)); d.rotation.y = ang; d.castShadow = true; G.add(d); };
  roomsX.forEach((x, i) => door(x - 0.9 - 0.425, CZ2 - IT / 2, [-1.2, 0, -0.5, -1.4, -0.25, -1.5][i]));
  door(16, 4.6 - 0.45, Math.PI / 2 + 0.9); door(11.2, 0.05, -1.0, 1.6);

  // ---------- móveis (código) ----------
  const bed = (x: number, z: number, blanket: number, made = true) => {
    bx(Dt, m.woodDark, 1.3, 0.35, 2.05, x, FL + 0.2, z, 0x4a3020); bx(Dt, m.woodDark, 1.3, 0.9, 0.08, x, FL + 0.45, z + 1.0, 0x3a2418);
    bx(Dt, m.plain, 1.2, 0.18, 1.95, x, FL + 0.46, z, 0xe8e2d4); bx(Dt, m.plain, 0.9, 0.12, 0.38, x, FL + 0.6, z + 0.75, 0xf0ece0);
    bx(Dt, m.plain, made ? 1.26 : 1.0, 0.06, made ? 1.4 : 1.1, x + (made ? 0 : 0.12), FL + 0.57, z - (made ? 0.25 : 0.4), blanket, made ? 0 : 0.3);
  };
  const night = (x: number, z: number, lit: boolean) => { bx(Dt, m.woodDark, 0.45, 0.6, 0.4, x, FL + 0.3, z, 0x5a3a24);
    bx(Dt, m.paint, 0.08, 0.3, 0.08, x, FL + 0.75, z, 0xb8a070); const sh = new THREE.CylinderGeometry(0.1, 0.17, 0.2, 10); sh.translate(wx(x), FL + 0.98, wz(z)); Dt.add(lit ? m.lit : m.plain, sh, 0xe8d8b0); };
  const wardrobe = (x: number, z: number) => { bx(Dt, m.woodDark, 0.9, 1.9, 0.5, x, FL + 0.95, z, 0x4a3020); bx(Dt, m.paint, 0.02, 0.1, 0.02, x - 0.05, FL + 1.1, z + 0.26, 0xc8a050); bx(Dt, m.paint, 0.02, 0.1, 0.02, x + 0.05, FL + 1.1, z + 0.26, 0xc8a050); };
  const chair = (x: number, z: number, ry: number) => { const M = mtx(wx(x), FL, wz(z), ry); const ad = (w: number, h: number, d: number, px: number, py: number, pz: number) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(px, py, pz); g.applyMatrix4(M); Dt.add(m.woodDark, g, 0x5a3a24); };
    ad(0.42, 0.05, 0.42, 0, 0.45, 0); ad(0.42, 0.5, 0.04, 0, 0.72, -0.19); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => ad(0.04, 0.45, 0.04, a, 0.22, b)); };
  const table = (x: number, z: number, w: number, d: number, h = 0.75, c = 0x5a3a24) => { bx(Dt, m.woodDark, w, 0.05, d, x, FL + h, z, c); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(Dt, m.woodDark, 0.05, h, 0.05, x + a * (w / 2 - 0.06), FL + h / 2, z + b * (d / 2 - 0.06), c)); };
  const rug = (x: number, z: number, w: number, d: number, c: number) => bx(Dt, m.plain, w, 0.01, d, x, FL + 0.006, z, c);

  // ---------- RECEPÇÃO (x 8..16, z 0..6) ----------
  bx(B, m.woodDark, 3.0, 1.05, 0.6, 12.6, FL + 0.52, 4.2, 0x5a3a24); bx(Dt, m.woodDark, 3.1, 0.05, 0.75, 12.6, FL + 1.07, 4.2, 0x3a2418);
  { const bell = new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); bell.translate(wx(11.6), FL + 1.1, wz(4.1)); Dt.add(m.paint, bell, 0xd0b060); }
  rug(12, 1.8, 3.2, 2.2, 0x6a2a24); chair(9.0, 1.2, 0.6); chair(9.0, 2.4, 1.2);
  nm('Livro de hóspedes'); doc(paper('THE HARLOW HOUSE — GUEST REGISTER', ['Feb 16 \'87  V. Laroche — Rm 1 — "one week"', 'Feb 16 \'87  Mr. A. Vance — Rm 2 — paid in advance (cash, 1946 notes)', 'Feb 17 \'87  Gil Navarro — Rm 3 — monthly', 'Feb 17 \'87  Juniper Fox — Rm 4 — monthly', 'Feb 17 \'87  F. Kowalski — Rm 5', 'Feb 18 \'87  Rm 6 — RESERVED:', '      "the visitors from the city"', '      (names written below, same ink)', '      ______  ______  ______  ______'], { size: 15 }), 0.34, 0.45, 13.3, FL + 1.1, 4.15, 0.15, true);
  nm('Quadro de chaves'); doc(mk(512, 360, g => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, 512, 360); g.fillStyle = '#e8d8a0'; g.font = 'bold 26px Georgia'; g.textAlign = 'center'; g.fillText('ROOMS', 256, 40);
    for (let i = 0; i < 8; i++) { const x = 60 + (i % 4) * 130, y = 90 + Math.floor(i / 4) * 140; g.fillStyle = '#e8d8a0'; g.font = '22px Georgia'; g.fillText(i < 6 ? String(i + 1) : i === 6 ? 'OWNER' : 'CELLAR', x, y);
      g.fillStyle = '#c8a050'; g.beginPath(); g.arc(x, y + 20, 5, 0, 7); g.fill(); const has = i === 0 || i === 2 || i === 4 || i === 7; if (has) { g.fillRect(x - 3, y + 24, 6, 50); g.fillStyle = '#a02020'; g.fillRect(x - 14, y + 70, 28, 18); } }
    g.fillStyle = '#e8d8a0'; g.font = 'italic 16px Georgia'; g.fillText('Rm 6 key: "they will ask for it"', 256, 345); }), 1.0, 0.7, 16 - IT / 2 - 0.012, 1.95, 2.0, -Math.PI / 2);
  nm('Calendário da recepção'); doc(mk(320, 400, g => { g.fillStyle = '#f2eee2'; g.fillRect(0, 0, 320, 400); g.fillStyle = '#a02020'; g.fillRect(0, 0, 320, 70); g.fillStyle = '#fff'; g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.fillText('FEBRUARY 1987', 160, 46);
    g.fillStyle = '#1a1a1a'; g.font = '18px Arial'; for (let d = 1; d <= 28; d++) { const c = (d - 1) % 7, r = Math.floor((d - 1) / 7), x = 30 + c * 43, y = 120 + r * 60; g.fillText(String(d), x, y); if (d < 18) { g.strokeStyle = '#333'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, y - 14); g.lineTo(x + 14, y + 6); g.stroke(); } if (d === 20) { g.strokeStyle = '#a02020'; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 6, 18, 0, 7); g.stroke(); } }
    g.fillStyle = '#a02020'; g.font = 'italic 15px Georgia'; g.fillText('20th — lock up early. ALL doors.', 160, 385); age(g, 320, 400, 30); }), 0.4, 0.5, 8 + IT / 2 + 0.012, 1.8, 5.0, Math.PI / 2);
  light(wx(12), CEIL - 0.3, wz(3), 4, 7, 0xffc080, { vtt: 5 });

  // ---------- SALA DE JANTAR (x 0..8, z 0..6) ----------
  table(4, 3, 3.2, 1.2); [[-1.2, -1], [0, -1], [1.2, -1], [-1.2, 1], [0, 1], [1.2, 1]].forEach(([a, b]) => chair(4 + a, 3 + b * 0.85, b > 0 ? Math.PI : 0)); chair(2.0, 3, Math.PI / 2); chair(6.0, 3, -Math.PI / 2);
  for (let i = 0; i < 8; i++) { const a = i < 3 ? [-1.2 + i * 1.2, -0.38] : i < 6 ? [-1.2 + (i - 3) * 1.2, 0.38] : [i === 6 ? -1.45 : 1.45, 0]; const p = new THREE.CylinderGeometry(0.12, 0.1, 0.02, 14); p.translate(wx(4 + a[0]), FL + 0.79, wz(3 + a[1])); Dt.add(m.paint, p, 0xf0ece4); }
  bx(Dt, m.woodDark, 1.6, 0.9, 0.5, 4, FL + 0.45, T + 0.3, 0x4a3020); // aparador
  { const tv = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.48, 0.45), m.plain); tv.position.set(wx(1.0), FL + 1.14, wz(T + 0.3)); G.add(tv);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), new THREE.MeshBasicMaterial({ map: mk(64, 64, g => { for (let i = 0; i < 1400; i++) { const v = Math.floor(rnd() * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * 64, rnd() * 64, 2, 2); } }), toneMapped: false })); st.position.set(wx(1.0), FL + 1.15, wz(T + 0.53)); st.userData.ns = 1; G.add(st); lamps.push(st.material as THREE.MeshBasicMaterial);
    bx(Dt, m.woodDark, 0.8, 0.9, 0.5, 1.0, FL + 0.45, T + 0.3, 0x4a3020); }
  nm('Cardápio da semana (sala de jantar)'); doc(paper('THIS WEEK AT THE TABLE', ['MON — pot roast', 'TUE — chili & cornbread', 'WED (18th) — chicken fried steak', 'THU — ...', 'FRI (20th) — NO SUPPER. Rooms by 9 PM.', '', 'Breakfast 7–9. Coffee all day.', 'Please do not open the door to anyone after dark on the 20th, even if you know the voice. — E.P.'], { size: 15, bg: '#efe6cc' }), 0.45, 0.6, T + 0.012, 1.7, 4.6, Math.PI / 2);
  light(wx(4), CEIL - 0.4, wz(3), 3.5, 5, 0xffb870);

  // ---------- APARTAMENTO DA DONA (x 16..24, z 0..6) ----------
  bed(22.6, 3.6, 0x7a4a5a); night(23.5, 1.9, true); wardrobe(17.0, 1.0); rug(21, 3, 2.4, 2, 0x4a5a6a); chair(19, 4.6, 2.6); table(19.2, 5.3, 1.0, 0.5);
  nm('Diário da dona (Ellen Price)'); doc(mk(512, 640, g => { g.fillStyle = '#ece4cc'; g.fillRect(0, 0, 512, 640); g.fillStyle = '#2a2a5a'; g.font = '22px "Brush Script MT", "Comic Sans MS", cursive';
    ['Feb 18, 1987', '', 'Wednesday again. I am sure of it,', 'and yet the coffee tin is full again.', 'I bought it Monday. I have bought', 'it every Monday for — I can\'t count.', '', 'Mr. Vance paid for the whole year.', 'He never sleeps in the bed. I hear', 'him on the stairs at night, but', 'we have no stairs.', '', 'Room 6 is for the city people.', 'He told me their names. I wrote', 'them down before they came.'].forEach((l, i) => g.fillText(l, 36, 50 + i * 38)); age(g, 512, 640, 40); }), 0.22, 0.28, 19.2, FL + 0.78, 5.3, 0.25, true);
  nm('Fotos da dona na parede'); doc(mk(512, 320, g => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, 512, 320); photo(g, 20, 20, 220, 150, 'house', 'Harlow House, 1946'); photo(g, 270, 20, 220, 150, 'house', 'Harlow House, 1966'); photo(g, 20, 175, 220, 130, 'house', '1986'); photo(g, 270, 175, 220, 130, 'man', 'guest, 1946 — Mr. V.?'); }), 1.1, 0.7, W - T - 0.012, 1.8, 3, -Math.PI / 2);
  light(wx(20), CEIL - 0.4, wz(3), 2.5, 3, 0xffb070);

  // ---------- CORREDOR ----------
  rug(12, 7, 22, 1.0, 0x5a2a24);
  roomsX.forEach((x, i) => doc(mk(64, 64, g => { g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(32, 32, 30, 22, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.font = 'bold 34px Georgia'; g.textAlign = 'center'; g.fillText(String(i + 1), 32, 44); }), 0.14, 0.14, x - 0.15, 2.35, CZ2 - IT / 2 - 0.012, Math.PI));
  [6, 18].forEach(x => light(wx(x), CEIL - 0.3, wz(7), 2.5, 4, 0xffb060, { flick: x === 18 ? 3 : undefined }));

  // ---------- QUARTOS (x 4i..4i+4, z 8..16) ----------
  const colors = [0x8a3a3a, 0x2a3a4a, 0x4a5a3a, 0x6a4a7a, 0x3a3a3a, 0xa89a7a];
  roomsX.forEach((cx, i) => {
    const x0 = cx - 2, made = i === 1 || i === 5;
    bed(x0 + 4 - 0.85, D - T - 1.1, colors[i], made); night(x0 + 4 - 0.4, D - T - 2.45, i !== 1 && i !== 5); wardrobe(x0 + 0.6, D - T - 0.3); rug(cx, 12.2, 1.6, 2.2, colors[i] - 0x101010);
    chair(x0 + 0.7, 10.2, Math.PI / 2 + 0.3); table(x0 + 0.45, 11.0, 0.6, 0.9);
    light(wx(cx), CEIL - 0.4, wz(12), 2.4, i === 5 ? 5 : 3, i === 1 ? 0xb8c8ff : 0xffb468, { flick: i === 4 ? 3 : undefined });
  });
  // 1 — Vivienne "Vee" Laroche, fotógrafa: fotos com datas impossíveis espalhadas na cama
  nm('Fotos da Vee (quarto 1)'); doc(mk(512, 420, g => { g.clearRect(0, 0, 512, 420); [['field', 'FEB 18 1987'], ['house', 'FEB 18 1987'], ['tower', 'FEB 18 1987'], ['car', 'NOV 15 2025?'], ['field', 'FEB 18 1987'], ['grave', 'FEB 18 1987']].forEach(([k, d], j) => { const x = 20 + (j % 3) * 165, y = 20 + Math.floor(j / 3) * 200; g.fillStyle = '#f0ece0'; g.fillRect(x, y, 150, 180); photo(g, x + 10, y + 10, 130, 130, k); g.fillStyle = j === 3 ? '#a01010' : '#3a3a3a'; g.font = '15px "Courier New"'; g.fillText(d, x + 14, y + 166); }); }), 0.8, 0.66, 3.15, FL + 0.62, 14.3, 0.2, true);
  (docs[docs.length - 1].o as THREE.Mesh).material = Object.assign((docs[docs.length - 1].o as THREE.Mesh).material as THREE.MeshStandardMaterial, { transparent: true });
  // 2 — Mr. Vance: cama nunca usada, caderninho com os nomes dos mortos dos dias 20 escritos ANTES
  nm('Caderno do Mr. Vance (quarto 2)'); doc(paper('(small black notebook)', ['Jul 20 — C. Mayfield ✓', 'Aug 20 — L. Pike ✓', 'Sep 20 — R. Sutter ✓', 'Oct 20 — W. Ames ✓', 'Nov 20 — one of the visitors', '', '2002 — and counting.', 'The children are for her. The 20th is for me.'], { size: 17, bg: '#ece8dc' }), 0.17, 0.23, 4.45, FL + 0.785, 11.0, -0.4, true);
  bx(Dt, m.paint, 0.5, 0.2, 0.35, 7.0, FL + 0.08, 14.6, 0x2a1a14); // maleta de couro, alinhada
  // 3 — Gil Navarro, radialista: fitas e rádio
  nm('Fitas do Gil (quarto 3)'); doc(paper('KHRL 1340 AM — "NIGHT LINE" tapes', ['#112  caller "Clara" — 10:01 PM', '#113  caller "Clara" — 10:01 PM', '#114  caller "Clara" — 10:01 PM (same words)', '#115  scream, 20th, 11:48 PM (no caller)', '#116  station clock reads FEB 18 again', '', 'Note: every tape dated 2/18/87. I recorded these on different nights. I KNOW I did.'], { size: 15 }), 0.24, 0.32, 8.45, FL + 0.78, 11.0, 0.1, true);
  bx(Dt, m.plain, 0.5, 0.25, 0.22, 9.4, FL + 0.95, 15.2, 0x3a3a3a); for (let k = 0; k < 6; k++) bx(Dt, m.plain, 0.1, 0.065, 0.02, 8.3 + k * 0.12, FL + 0.81, 10.6, 0x1a1a1a);
  // 4 — Juniper Fox: sal na porta, ervas, fita cassete copiada
  { const sal = new THREE.BoxGeometry(0.85, 0.01, 0.06); sal.translate(wx(14 - 0.9 - 0.425 + 0.425), FL + 0.006, wz(CZ2 + 0.15)); Dt.add(m.plain, sal, 0xf4f4f0); }
  nm('Bilhete da Juniper (quarto 4)'); doc(paper('(note pinned to the wardrobe)', ['salt at the door — keep it unbroken.', 'sage in the window.', 'the copy of the 10:01 tape is under the mattress.', 'if it says my name, I was never here.', '— J.'], { size: 18, bg: '#e8f0dc' }), 0.2, 0.26, 12.6, 1.6, D - T - 0.56, Math.PI);
  // 5 — Frank Kowalski: terço, mapa com cruzes onde caíram os mortos do dia 20
  nm('Mapa do Frank (quarto 5)'); doc(mk(512, 512, g => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#6a5a4a'; g.lineWidth = 6; g.strokeRect(150, 150, 212, 212); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
    g.fillStyle = '#1a1a1a'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('HARLOW', 256, 140); g.strokeStyle = '#a01010'; g.lineWidth = 4; [[300, 330], [120, 80], [420, 60], [80, 430], [380, 440], [210, 300], [460, 300]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 10, y - 10); g.lineTo(x + 10, y + 10); g.moveTo(x + 10, y - 10); g.lineTo(x - 10, y + 10); g.stroke(); });
    g.fillStyle = '#a01010'; g.font = 'italic 20px Georgia'; g.fillText('every 20th. they all face the square.', 256, 495); }), 0.7, 0.7, 16 + IT / 2 + 0.012, 1.7, 11.5, Math.PI / 2);
  // 6 — reservado para os agentes: cama feita, toalhas dobradas, bilhete de boas-vindas com os nomes
  bx(Dt, m.plain, 0.4, 0.08, 0.3, 23.1, FL + 0.63, 14.1, 0xf4f0e8); bx(Dt, m.plain, 0.4, 0.08, 0.3, 23.1, FL + 0.71, 14.1, 0xf4f0e8);
  nm('Bilhete de boas-vindas (quarto 6)'); doc(mk(400, 280, g => { g.fillStyle = '#f4efe0'; g.fillRect(0, 0, 400, 280); g.fillStyle = '#2a2a5a'; g.font = '24px "Brush Script MT", "Comic Sans MS", cursive'; ['Welcome back.', '', 'Your room is just as you left it.', 'Supper is at six. Not on the 20th.', '', '— E.P., February 18, 1987'].forEach((l, i) => g.fillText(l, 26, 44 + i * 40)); age(g, 400, 280, 20); }), 0.26, 0.18, 22.95, FL + 0.62, 13.8, 0.3, true);

  // ---------- montar ----------
  const solids = B.build(G);
  Dt.build(G, { shadow: Q.lights > 8 });
  const floors = F.build(G, { shadow: false });
  R.build(roofs);
  return { docs, solids, floors, roofs, vttWalls, portals, lamps };
}
