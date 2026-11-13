// Departamento do Xerife do Condado de Harlow — onde a missão do Caso Whitlock começa.
// Prédio de tijolo térreo com interior completo: recepção, sala do xerife, sala dos agentes, sala do caso
// (quadro com mapa, fotos e barbantes), evidências e arquivo, interrogatório, rádio (despacho) e celas.
// Os documentos são texturas de canvas legíveis de perto (inglês, como no lugar; tradução no dossiê).
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { place, instance, type Xf } from '../../core/models';
import { halo } from '../../core/kit';
import { wallGeo } from '../igreja/common';
import { Batch, mtx, rnd, reseed, TM, shell, light, rect, sign, POLICE, Q } from './common';

const X0 = POLICE.x0, Z0 = POLICE.z0, W = POLICE.x1 - POLICE.x0, D = POLICE.z1 - POLICE.z0;
const FL = 0.15, H = 4.2, CEIL = 2.9, T = 0.3, IT = 0.15;
const wx = (x: number) => X0 + x, wz = (z: number) => Z0 + z;

// ---------- papel, quadros e fotos (canvas) ----------
type G2 = CanvasRenderingContext2D;
const mk = (w: number, h: number, draw: (g: G2) => void) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const age = (g: G2, w: number, h: number, k = 60) => { for (let i = 0; i < k; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '120,90,40' : '255,250,235'},${rnd() * 0.06})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 30, 2 + rnd() * 12, rnd() * 3, 0, 7); g.fill(); } };
/** folha datilografada */
function paperDraw(g: G2, x: number, y: number, w: number, h: number, title: string, lines: string[], o: { bg?: string; head?: string; size?: number; stamp?: string; rot?: number } = {}) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(o.rot ?? (rnd() - 0.5) * 0.05); g.translate(-w / 2, -h / 2);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(3, 4, w, h);
  g.fillStyle = o.bg || '#ece6d6'; g.fillRect(0, 0, w, h);
  const s = o.size || Math.max(10, w / 26);
  g.fillStyle = o.head || '#1e1a16'; g.font = `bold ${s * 1.25}px "Courier New", monospace`; g.textAlign = 'left';
  let yy = wrap(g, title, 0.06 * w, s * 1.7, w * 0.88, s * 1.4) + s * 0.55;
  g.font = `${s}px "Courier New", monospace`; g.fillStyle = '#26221c';
  for (const l of lines) { yy = wrap(g, l, 0.06 * w, yy, w * 0.88, s * 1.25) + s * 0.35; if (yy > h - s) break; }
  if (o.stamp) { g.save(); g.translate(w * 0.7, h * 0.82); g.rotate(-0.25); g.strokeStyle = 'rgba(160,20,20,0.75)'; g.lineWidth = 3; g.font = `bold ${s * 1.4}px Arial`; g.fillStyle = 'rgba(160,20,20,0.75)'; g.textAlign = 'center'; const tw = g.measureText(o.stamp).width; g.strokeRect(-tw / 2 - 8, -s * 1.3, tw + 16, s * 1.9); g.fillText(o.stamp, 0, 0); g.restore(); }
  age(g, w, h, 25);
  g.restore();
}
function wrap(g: G2, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' '); let line = '';
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = t; }
  if (line) { g.fillText(line, x, y); y += lh; }
  return y;
}
const paper = (title: string, lines: string[], o: Parameters<typeof paperDraw>[7] & { w?: number; h?: number } = {}) => mk(o.w || 512, o.h || 680, g => paperDraw(g, 0, 0, o.w || 512, o.h || 680, title, lines, { ...o, rot: 0 }));
function photo(g: G2, x: number, y: number, w: number, h: number, kind: string, cap?: string) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((rnd() - 0.5) * 0.15); g.translate(-w / 2, -h / 2);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(3, 4, w, h); g.fillStyle = '#f2eee4'; g.fillRect(0, 0, w, h);
  const ix = w * 0.07, iy = w * 0.07, iw = w * 0.86, ih = h * (cap ? 0.72 : 0.86);
  const grd = g.createLinearGradient(0, iy, 0, iy + ih); grd.addColorStop(0, '#5a5a62'); grd.addColorStop(1, '#2a2622'); g.fillStyle = grd; g.fillRect(ix, iy, iw, ih);
  g.strokeStyle = '#1a1612'; g.fillStyle = '#1a1612'; g.lineWidth = Math.max(2, w / 60);
  const cx = ix + iw / 2, cy = iy + ih / 2;
  if (kind === 'girl') { g.fillStyle = '#8a7a6a'; g.beginPath(); g.ellipse(cx, cy - ih * 0.08, iw * 0.16, ih * 0.24, 0, 0, 7); g.fill(); g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(cx, cy - ih * 0.2, iw * 0.2, ih * 0.2, 0, Math.PI, 0); g.fill(); g.fillStyle = '#6a2a2a'; g.fillRect(cx - iw * 0.28, cy + ih * 0.18, iw * 0.56, ih * 0.32); }
  else if (kind === 'man') { g.fillStyle = '#7a7068'; g.beginPath(); g.ellipse(cx, cy - ih * 0.05, iw * 0.15, ih * 0.22, 0, 0, 7); g.fill(); g.fillStyle = '#2a2a2a'; g.fillRect(cx - iw * 0.3, cy + ih * 0.2, iw * 0.6, ih * 0.3); g.fillRect(cx - iw * 0.2, cy - ih * 0.34, iw * 0.4, ih * 0.08); }
  else if (kind === 'grave') { g.fillStyle = '#3a3026'; g.fillRect(ix + iw * 0.2, cy, iw * 0.6, ih * 0.3); g.fillStyle = '#8a8680'; g.fillRect(cx - iw * 0.12, iy + ih * 0.15, iw * 0.24, ih * 0.35); }
  else if (kind === 'field') { g.fillStyle = '#4a4030'; g.fillRect(ix, cy, iw, ih / 2); g.strokeStyle = '#a02a1a'; g.lineWidth = Math.max(2, w / 40); g.beginPath(); g.ellipse(cx, cy + ih * 0.25, iw * 0.35, ih * 0.12, 0, 0, 7); g.stroke(); g.fillStyle = '#1a1612'; g.fillRect(cx - 2, cy - ih * 0.2, 4, ih * 0.45); g.fillRect(cx - iw * 0.1, cy - ih * 0.05, iw * 0.2, 3); }
  else if (kind === 'tower') { g.fillStyle = '#9a9a92'; g.fillRect(cx - iw * 0.25, iy + ih * 0.15, iw * 0.5, ih * 0.3); g.strokeStyle = '#8a1a12'; g.beginPath(); g.arc(cx, iy + ih * 0.3, ih * 0.1, 0, 7); g.stroke(); g.strokeStyle = '#6a6a62'; for (let i = -1; i <= 1; i += 2) { g.beginPath(); g.moveTo(cx + i * iw * 0.2, iy + ih * 0.45); g.lineTo(cx + i * iw * 0.3, iy + ih); g.stroke(); } }
  else if (kind === 'car') { g.fillStyle = '#5a2a20'; g.fillRect(ix + iw * 0.1, cy - ih * 0.15, iw * 0.8, ih * 0.35); g.strokeStyle = '#e8e2d0'; g.beginPath(); g.arc(cx, cy, ih * 0.13, 0, 7); g.stroke(); }
  else if (kind === 'mirror') { g.fillStyle = '#9aa0a4'; g.fillRect(cx - iw * 0.25, iy + ih * 0.1, iw * 0.5, ih * 0.8); g.fillStyle = '#7a1a14'; g.font = `bold ${iw * 0.12}px Georgia`; g.textAlign = 'center'; g.fillText('SHE', cx, cy - ih * 0.1); g.fillText('CAME', cx, cy + ih * 0.05); g.fillText('BACK', cx, cy + ih * 0.2); }
  else if (kind === 'house') { g.fillStyle = '#5a5248'; g.fillRect(ix + iw * 0.2, cy - ih * 0.05, iw * 0.6, ih * 0.4); g.beginPath(); g.moveTo(ix + iw * 0.15, cy - ih * 0.05); g.lineTo(cx, cy - ih * 0.35); g.lineTo(ix + iw * 0.85, cy - ih * 0.05); g.fill(); g.fillStyle = '#c02a1a'; g.fillRect(cx + iw * 0.3, cy + ih * 0.28, iw * 0.12, ih * 0.05); }
  else if (kind === 'group') { for (let i = 0; i < 7; i++) { const px = ix + iw * (0.1 + i * 0.12); g.fillStyle = '#6a6058'; g.beginPath(); g.arc(px, cy - ih * 0.05, iw * 0.04, 0, 7); g.fill(); g.fillRect(px - iw * 0.045, cy, iw * 0.09, ih * 0.3); } g.fillStyle = '#4a4030'; g.fillRect(ix, cy + ih * 0.3, iw, ih * 0.2); }
  if (cap) { g.fillStyle = '#2a2420'; g.font = `${Math.max(10, w / 11)}px "Marker Felt", "Comic Sans MS", cursive`; g.textAlign = 'center'; g.fillText(cap, w / 2, h - h * 0.08); }
  g.restore();
}
/** o mesmo sigilo inventado do mistério (pequeno) */
function sigil(g: G2, cx: number, cy: number, r: number, color: string, lw = 2) {
  g.strokeStyle = color; g.lineWidth = lw;
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, r * 0.42, 0, 7); g.stroke();
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42); g.lineTo(cx + Math.cos(a) * r * 1.18, cy + Math.sin(a) * r * 1.18); g.stroke(); }
  g.beginPath(); g.moveTo(cx - r * 0.25, cy + r * 0.15); g.lineTo(cx, cy - r * 0.28); g.lineTo(cx + r * 0.25, cy + r * 0.15); g.closePath(); g.stroke();
}
const pin = (g: G2, x: number, y: number, c = '#c02020') => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x - 2, y - 2, 2, 0, 7); g.fill(); };
const cork = (g: G2, w: number, h: number) => { g.fillStyle = '#9a7650'; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 60; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '60,40,20' : '200,170,120'},${rnd() * 0.35})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } g.strokeStyle = '#5a4026'; g.lineWidth = 18; g.strokeRect(0, 0, w, h); };
const marker = (g: G2, text: string, x: number, y: number, size: number, color = '#1a2a6a') => { g.fillStyle = color; g.font = `${size}px "Marker Felt", "Comic Sans MS", cursive`; g.fillText(text, x, y); };

// ---------- conteúdo ----------
const COUNTY_MAP = (g: G2, x: number, y: number, w: number, h: number) => {
  g.save(); g.translate(x, y);
  g.fillStyle = '#e8e0c4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8a888'; g.lineWidth = 1;
  for (let i = 0; i < w; i += w / 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let i = 0; i < h; i += h / 10) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  // mapa do condado: coordenadas do mundo (-260..260 x, -160..140 z)
  const P2 = (wx2: number, wz2: number): [number, number] => [w * (wx2 + 260) / 520, h * (wz2 + 160) / 300];
  g.strokeStyle = '#3a3a3a'; g.lineWidth = 4; let [a, b] = P2(-260, 104), [c, d] = P2(260, 104); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
  g.setLineDash([8, 6]); [a, b] = P2(-260, -104); [c, d] = P2(260, -104); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); g.setLineDash([]);
  g.lineWidth = 2; [[0, -104, 0, 104], [-150, 0, 168, 0], [-150, -64, 150, -64], [-150, 64, 150, 64]].forEach(([x1, z1, x2, z2]) => { const [p, q] = P2(x1, z1), [r, s] = P2(x2, z2); g.beginPath(); g.moveTo(p, q); g.lineTo(r, s); g.stroke(); });
  g.fillStyle = '#6a6a6a'; const [sx, sz] = P2(-20, -20), [ex, ez] = P2(20, 20); g.fillRect(sx, sz, ex - sx, ez - sz);
  g.font = `bold ${h / 22}px Georgia`; g.fillStyle = '#2a2a2a'; g.fillText('HARLOW', P2(-30, 30)[0], P2(-30, 30)[1]); g.font = `${h / 30}px Georgia`; g.fillText('US-87', P2(200, 98)[0], P2(200, 98)[1]); g.fillText('T&P RR', P2(200, -110)[0], P2(200, -110)[1]);
  g.fillText('PRUITT FARM', P2(150, 50)[0], P2(150, 50)[1]);
  // pontos do sigilo: caixa-d'água, vagão, milharal (+ cemitério) — ligados formam o triângulo do símbolo
  const pts: [number, number, string][] = [[-24, -116, 'WATER TOWER'], [-64, -104, 'BOXCAR 41077'], [199, 60, 'CORN FIELD'], [-62, -92, 'GRAVE']];
  g.strokeStyle = '#c02020'; g.lineWidth = 3; g.beginPath(); [0, 1, 2, 0].forEach((i, k) => { const [p, q] = P2(pts[i][0], pts[i][1]); k ? g.lineTo(p, q) : g.moveTo(p, q); }); g.stroke();
  pts.forEach(([px, pz, n]) => { const [p, q] = P2(px, pz); pin(g, p, q); g.fillStyle = '#8a1010'; g.font = `bold ${h / 34}px Arial`; g.fillText(n, p + 9, q + 4); });
  const [mx, mz] = P2(55, -10); g.fillStyle = '#8a1010'; g.font = `italic ${h / 26}px "Comic Sans MS", cursive`; g.fillText('center = ? (courthouse)', mx, mz);
  g.restore();
};

export interface Police { docs: { o: THREE.Object3D; n: string }[]; solids: THREE.Object3D[]; floors: THREE.Object3D[]; roofs: THREE.Group; vttWalls: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[]; lamps: THREE.MeshBasicMaterial[] }

export async function buildPolice(G: THREE.Group): Promise<Police> {
  reseed(911);
  const m = TM();
  const B = new Batch('delegacia'), Dt = new Batch('delegacia-detalhes'), F = new Batch('delegacia-piso'), R = new Batch('delegacia-teto');
  const roofs = new THREE.Group(); roofs.name = 'telhado-delegacia'; G.add(roofs);
  const vttWalls: Police['vttWalls'] = [], portals: Police['portals'] = [], lamps: THREE.MeshBasicMaterial[] = [];
  const P: Promise<unknown>[] = []; const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));
  const bx = (b: Batch, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, c: number, ry = 0) => b.box(mat, w, h, d, wx(x), y, wz(z), c, ry);
  /** plano de documento/quadro: ry 0 = olha +z, π = −z, π/2 = +x, −π/2 = −x */
  const doc = (t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, flat = false) => {
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, envMapIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }));
    mm.position.set(wx(x), y, wz(z)); if (flat) { mm.rotation.set(-Math.PI / 2, 0, ry); } else mm.rotation.y = ry; mm.userData.ns = 1; G.add(mm); lastDoc = mm; if (nextName) { docs.push({ o: mm, n: nextName }); nextName = ''; } mm.geometry.computeBoundingSphere(); mm.userData.cullDist = 40; return mm;
  };
  const docs: { o: THREE.Object3D; n: string }[] = []; let nextName = ''; const nm = (n: string) => { nextName = n; };
  let lastDoc: THREE.Mesh | null = null;
  /** cadeira de escritório (coordenadas do mundo) */
  const chairs = (list: { x: number; y: number; z: number; ry?: number }[]) => list.forEach(c => {
    const M = mtx(c.x, c.y, c.z, (c.ry ?? 0) + Math.PI), ad = (w: number, h: number, d: number, x: number, y: number, z: number, col: number, mat: THREE.Material = m.paint) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); g.applyMatrix4(M); Dt.add(mat, g, col); };
    ad(0.46, 0.08, 0.44, 0, 0.48, 0, 0x3a3e44, m.plain); ad(0.44, 0.5, 0.06, 0, 0.8, -0.2, 0x3a3e44, m.plain); ad(0.05, 0.42, 0.05, 0, 0.25, 0, 0x8a8a8a);
    ad(0.6, 0.04, 0.06, 0, 0.05, 0, 0x2a2a2a); ad(0.06, 0.04, 0.6, 0, 0.05, 0, 0x2a2a2a);
  });
  const wallLo = 0xa8b4a4, wallHi = 0xdcdccc; // verde-institucional dos anos 80

  // ---------- casca externa (tijolo) ----------
  shell(B, m.brick, 0xc89888, X0, Z0, X0 + W, Z0 + D, H, T, [
    { side: 'W', at: wz(12), w: 1.8, h: 2.4, sill: FL }, { side: 'W', at: wz(14.9), w: 1.0, h: 1.2, sill: 1.1 }, { side: 'W', at: wz(22.5), w: 1.2, h: 1.2, sill: 1.1 },
    { side: 'N', at: wx(3), w: 1.4, h: 1.2, sill: 1.1 }, { side: 'N', at: wx(9), w: 1.6, h: 1.2, sill: 1.1 }, { side: 'N', at: wx(13), w: 1.6, h: 1.2, sill: 1.1 },
    { side: 'S', at: wx(17.2), w: 1.1, h: 2.2, sill: FL },
    ...[16.5, 19.5, 22.5].map(z => ({ side: 'E' as const, at: wz(z), w: 0.7, h: 0.4, sill: 2.3 })),
  ]);
  // cornija só nas bordas (uma laje inteira esconderia o interior na vista de cima)
  [[W / 2, 0, W + 0.3, 0.5], [W / 2, D, W + 0.3, 0.5], [0, D / 2, 0.5, D + 0.3], [W, D / 2, 0.5, D + 0.3]].forEach(([x, z, w, d]) => bx(B, m.stone, w, 0.35, d, x, H + 0.1, z, 0xd8d0c0));
  bx(R, m.concrete, W, 0.15, D, W / 2, H - 0.02, D / 2, 0x8a8a88);
  // forro rebaixado (camada do telhado: some na vista de cima)
  { const t = mk(256, 256, g => { g.fillStyle = '#e8e6dc'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(80,80,70,${rnd() * 0.25})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); } g.strokeStyle = '#a8a8a0'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256); g.fillStyle = 'rgba(140,110,60,0.25)'; g.beginPath(); g.ellipse(170, 90, 50, 30, 0.3, 0, 7); g.fill(); });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 1.2, D / 0.6);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, D - 2 * T), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, envMapIntensity: 0.3, side: THREE.DoubleSide }));
    c.rotation.x = Math.PI / 2; c.position.set(wx(W / 2), CEIL, wz(D / 2)); c.receiveShadow = true; roofs.add(c); }
  // piso de linóleo
  { const t = mk(256, 256, g => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#b8b0a0' : '#8a8478'; g.fillRect(x * 32, y * 32, 32, 32); } for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(40,30,20,${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 2.4, D / 2.4);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, D - 2 * T), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, envMapIntensity: 0.6 }));
    f.rotation.x = -Math.PI / 2; f.position.set(wx(W / 2), FL + 0.002, wz(D / 2)); f.receiveShadow = true; G.add(f);
    bx(F, m.concrete, W - 2 * T, FL, D - 2 * T, W / 2, FL / 2, D / 2, 0x8a8a88); }
  // ---------- paredes internas com portas ----------
  const HI = CEIL - FL;
  const iw = (axis: 'x' | 'z', c: number, a: number, b: number, holes: { at: number; w: number; h: number; sill?: number }[] = [], door = true) => {
    const L = b - a, mid = (a + b) / 2;
    const g = wallGeo(L, HI, IT, holes.map(h => ({ pts: rect(h.w, h.h), x: axis === 'z' ? h.at - mid : mid - h.at, y: h.sill ?? 0 })));
    g.applyMatrix4(axis === 'z' ? mtx(wx(mid), FL, wz(c) - IT / 2) : mtx(wx(c) - IT / 2, FL, wz(mid), Math.PI / 2)); boxUV(g); B.add(m.plain, g, wallHi);
    // rodapé verde (faixa inferior)
    const lo = (s: number) => { if (axis === 'z') bx(Dt, m.plain, L, 1.1, 0.01, mid, FL + 0.55, c + s * (IT / 2 + 0.006), wallLo); else bx(Dt, m.plain, 0.01, 1.1, L, c + s * (IT / 2 + 0.006), FL + 0.55, mid, wallLo); };
    lo(1); lo(-1);
    // vtt: segmentos entre portas
    const cuts = holes.filter(h => (h.sill ?? 0) < 0.2 && door).map(h => [h.at - h.w / 2, h.at + h.w / 2]).sort((p, q) => p[0] - q[0]);
    let s0 = a; cuts.forEach(([u, v]) => { vttWalls.push(seg(axis, c, s0, u)); s0 = v; const pa: [number, number] = axis === 'z' ? [wx(u), wz(c)] : [wx(c), wz(u)], pb: [number, number] = axis === 'z' ? [wx(v), wz(c)] : [wx(c), wz(v)]; portals.push({ p: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], a: pa, b: pb }); }); vttWalls.push(seg(axis, c, s0, b));
  };
  const seg = (axis: 'x' | 'z', c: number, u: number, v: number): [number, number][] => axis === 'z' ? [[wx(u), wz(c)], [wx(v), wz(c)]] : [[wx(c), wz(u)], [wx(c), wz(v)]];
  // faixa verde nas paredes externas por dentro
  bx(Dt, m.plain, W - 2 * T, 1.1, 0.01, W / 2, FL + 0.55, T + 0.006, wallLo); bx(Dt, m.plain, W - 2 * T, 1.1, 0.01, W / 2, FL + 0.55, D - T - 0.006, wallLo);
  bx(Dt, m.plain, 0.01, 1.1, D - 2 * T, T + 0.006, FL + 0.55, D / 2, wallLo); bx(Dt, m.plain, 0.01, 1.1, D - 2 * T, W - T - 0.006, FL + 0.55, D / 2, wallLo);
  bx(Dt, m.plain, W - 2 * T, CEIL - 1.25, 0.01, W / 2, (CEIL + 1.25) / 2, T + 0.004, wallHi); bx(Dt, m.plain, W - 2 * T, CEIL - 1.25, 0.01, W / 2, (CEIL + 1.25) / 2, D - T - 0.004, wallHi);
  bx(Dt, m.plain, 0.01, CEIL - 1.25, D - 2 * T, T + 0.004, (CEIL + 1.25) / 2, D / 2, wallHi); bx(Dt, m.plain, 0.01, CEIL - 1.25, D - 2 * T, W - T - 0.004, (CEIL + 1.25) / 2, D / 2, wallHi);
  iw('x', 6, T, D - T, [{ at: 4, w: 1.0, h: 2.2 }, { at: 11.5, w: 4.0, h: 2.4 }, { at: 20, w: 1.0, h: 2.2 }]);
  iw('z', 8, T, 6 - IT / 2); iw('z', 16, T, 6 - IT / 2, [{ at: 3, w: 1.2, h: 0.9, sill: 1.0 }]);
  iw('z', 14, 6 + IT / 2, 16 - IT / 2, [{ at: 11, w: 1.6, h: 2.2 }]);
  iw('x', 16, T, D - T, [{ at: 3.5, w: 1.0, h: 2.2 }, { at: 11, w: 1.0, h: 2.2 }, { at: 19.5, w: 1.1, h: 2.2 }]);
  iw('z', 7, 16 + IT / 2, W - T); iw('z', 15, 16 + IT / 2, W - T);
  iw('z', 18, 18.4, W - T); iw('z', 21, 18.4, W - T);
  vttWalls.push([[X0, Z0], [X0 + W, Z0], [X0 + W, Z0 + D], [wx(17.75), Z0 + D]], [[wx(16.65), Z0 + D], [X0, Z0 + D], [X0, wz(12.9)]], [[X0, wz(11.1)], [X0, Z0]]);
  portals.push({ p: [X0, wz(12)], a: [X0, wz(11.1)], b: [X0, wz(12.9)] }, { p: [wx(17.2), Z0 + D], a: [wx(16.65), Z0 + D], b: [wx(17.75), Z0 + D] });
  // portas de madeira (algumas abertas) e batentes
  const door = (x: number, z: number, axis: 'x' | 'z', ang: number, c = 0x6a4a34, w = 0.95) => { const d = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, 2.15, 0.05)), m.woodDark); d.geometry.translate(w / 2, 1.075, 0); d.position.set(wx(x), FL, wz(z)); d.rotation.y = (axis === 'x' ? Math.PI / 2 : 0) + ang; d.castShadow = true; G.add(d); void c; };
  door(6, 3.5, 'x', -1.3); door(16, 3.0, 'x', 1.4); door(16, 10.5, 'x', -0.2); door(6, 19.5, 'x', -1.2); door(10.2, 14, 'z', -1.5);
  // ---------- fachada: degraus, letreiro, estrela, mastro, antena ----------
  for (let s = 0; s < 3; s++) F.box(m.concrete, 1.0 - s * 0.3, FL * (s + 1) / 3, 3.2, wx(-0.5 + s * 0.3) - 0.0, FL * (s + 1) / 6, wz(12), 0xb8b2a8);
  F.box(m.sidewalk, 3.6, 0.12, D + 2, wx(-1.8), 0.06, wz(D / 2), 0xb8b2a8);
  { const s = sign("HARLOW COUNTY SHERIFF'S DEPARTMENT", 9, 0.8, { bg: '#e8e2d2', fg: '#1e2a4a', border: '#1e2a4a', font: 'Georgia, serif' }); s.position.set(X0 - 0.03, H - 0.75, wz(12)); s.rotation.y = -Math.PI / 2; G.add(s);
    const st = doc(mk(256, 256, g => { g.clearRect(0, 0, 256, 256); g.fillStyle = '#c8a040'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 50 : 120, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.fill(); g.strokeStyle = '#6a5010'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#3a2a10'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.fillText('SHERIFF', 128, 136); }), 1.3, 1.3, -0.04, 2.85, 12, -Math.PI / 2);
    (st.material as THREE.MeshStandardMaterial).transparent = true; }
  bx(Dt, m.iron, 0.1, 9, 0.1, -2.6, 4.5, 9, 0xd0d0d0); bx(Dt, m.iron, 0.1, 9, 0.1, -2.6, 4.5, 15, 0xd0d0d0);
  bx(Dt, m.iron, 0.06, 7, 0.06, W - 3, H + 3.5, 3, 0x8a8a84); for (let y = H + 1; y < H + 7; y += 1.2) bx(Dt, m.iron, 0.04, 0.04, 0.8, W - 3, y, 3, 0x8a8a84);
  light(wx(-1.2), 2.8, wz(12), 6, 7, 0xe8f0ff, { vtt: 6 }); halo(wx(-0.4), 2.7, wz(12), 0.8);
  later(instance('security_light', [{ x: wx(-0.2), y: 2.5, z: wz(12), ry: -Math.PI / 2 }], G));
  // viaturas (em código): sedã branco e preto com giroflex
  const car = (x: number, z: number, ry: number, lit: boolean) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => { const mm = new THREE.Mesh(geo, mat); mm.position.set(px, py, pz); mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
    const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.35, metalness: 0.4, envMapIntensity: 1 }), black = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4, metalness: 0.5 }), gl = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.05, metalness: 0.3, envMapIntensity: 1.4 });
    add(new THREE.BoxGeometry(1.9, 0.62, 5.0), black, 0, 0.62, 0); add(new THREE.BoxGeometry(1.92, 0.3, 2.0), white, 0, 0.78, 0.1);
    add(new THREE.BoxGeometry(1.7, 0.55, 2.4), gl, 0, 1.2, -0.1); add(new THREE.BoxGeometry(1.72, 0.06, 2.0), white, 0, 1.5, -0.1);
    [[-0.85, 1.55], [0.85, 1.55], [-0.85, -1.55], [0.85, -1.55]].forEach(([a, b]) => { const w2 = add(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 14), black, a, 0.34, b); w2.rotation.z = Math.PI / 2; });
    const red = new THREE.MeshBasicMaterial({ color: lit ? 0xff2020 : 0x501010, toneMapped: false }), blue = new THREE.MeshBasicMaterial({ color: lit ? 0x2050ff : 0x101850, toneMapped: false });
    add(new THREE.BoxGeometry(0.55, 0.14, 0.25), red, -0.32, 1.6, -0.1); add(new THREE.BoxGeometry(0.55, 0.14, 0.25), blue, 0.32, 1.6, -0.1);
    if (lit) { lamps.push(red, blue); }
    const s = sign('SHERIFF', 1.4, 0.28, { bg: '#e8e8e4', fg: '#1a2a5a' }); s.position.set(0.97, 0.8, 0.1); s.rotation.y = Math.PI / 2; g.add(s);
    const s2 = s.clone(); s2.position.x = -0.97; s2.rotation.y = -Math.PI / 2; g.add(s2);
  };
  car(X0 - 6.3, wz(5), 0, true); car(X0 - 6.3, wz(18.5), Math.PI, false);

  // ---------- vidros e persianas nas janelas externas ----------
  { const blindT = mk(64, 256, g => { for (let y = 0; y < 256; y += 8) { g.fillStyle = '#d8d4c8'; g.fillRect(0, y, 64, 6); g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, y + 6, 64, 2); } });
    const blindM = new THREE.MeshStandardMaterial({ map: blindT, transparent: true, alphaTest: 0.3, roughness: 0.7, side: THREE.DoubleSide });
    const glassM = new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35, envMapIntensity: 1.4, depthWrite: false });
    const win = (side: 'N' | 'W' | 'E', at: number, w: number, h: number, sill: number, drop: number) => {
      const ry = side === 'N' ? 0 : side === 'W' ? Math.PI / 2 : -Math.PI / 2;
      const px = (d: number) => side === 'N' ? [wx(at), wz(d)] : side === 'W' ? [wx(d), wz(at)] : [wx(W - d), wz(at)];
      const [gx, gz] = px(T / 2), gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassM); gl.position.set(gx, sill + h / 2, gz); gl.rotation.y = ry; gl.userData.ns = 1; G.add(gl);
      if (drop > 0) { const [bxp, bzp] = px(T + 0.04); const bl = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, h * drop), blindM); bl.position.set(bxp, sill + h - h * drop / 2, bzp); bl.rotation.y = ry; bl.userData.ns = 1; G.add(bl); }
    };
    win('W', 14.9, 1.0, 1.2, 1.1, 0.5); win('W', 22.5, 1.2, 1.2, 1.1, 0.9);
    win('N', 3, 1.4, 1.2, 1.1, 0.7); win('N', 9, 1.6, 1.2, 1.1, 0.4); win('N', 13, 1.6, 1.2, 1.1, 1.0);
    [16.5, 19.5, 22.5].forEach(z => win('E', z, 0.7, 0.4, 2.3, 0));
    // portas de vidro da entrada (abertas para dentro) e toldo
    const gd = new THREE.MeshStandardMaterial({ color: 0x20282e, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45, envMapIntensity: 1.3, depthWrite: false });
    [-1, 1].forEach(sg => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.3, 0.88), gd); d.geometry.translate(0, 0, sg * 0.44); d.position.set(wx(T + 0.05), FL + 1.15, wz(12 + sg * 0.9)); d.rotation.y = -sg * 1.1; d.userData.ns = 1; G.add(d); });
    bx(Dt, m.paint, 2.2, 0.08, 4.0, -1.1, 2.95, 12, 0x1e2a4a); [-1.8, 1.8].forEach(o => bx(Dt, m.iron, 0.06, 2.9, 0.06, -2.1, 1.45, 12 + o, 0x3a3a3a)); }

  // =================== RECEPÇÃO (x 0..6, z 8..16) ===================
  bx(B, m.woodDark, 0.6, 1.1, 2.9, 6 - 0.3, FL + 0.55, 10.95, 0x5a4030); bx(Dt, m.woodDark, 0.75, 0.05, 3.0, 6 - 0.3, FL + 1.12, 10.95, 0x3a2418);
  { const gl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, 2.9), new THREE.MeshStandardMaterial({ color: 0xa8c0c8, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.2, depthWrite: false })); gl.position.set(wx(6 - 0.62), FL + 1.65, wz(10.95)); gl.userData.ns = 1; G.add(gl); } // vidro do balcão
  later(instance('painted_wooden_bench', [{ x: wx(0.7), y: FL, z: wz(9.4), ry: Math.PI / 2, s: 1.3 }, { x: wx(3), y: FL, z: wz(15.4), ry: Math.PI, s: 1.3 }], G));
  bx(Dt, m.paint, 0.35, 1.2, 0.35, 0.5, FL + 0.6, 15.5, 0xd8d8d0); { const wb = new THREE.CylinderGeometry(0.15, 0.15, 0.45, 12); wb.translate(wx(0.5), FL + 1.43, wz(15.5)); Dt.add(m.paint, wb, 0x6a9ac0); }
  // mural de avisos da recepção
  nm('Mural de avisos (recepção)'); doc(mk(1024, 512, g => {
    cork(g, 1024, 512);
    paperDraw(g, 30, 30, 200, 330, 'MISSING', ['CLARA MAE WHITLOCK', 'Age 16 · 5\'4" · brown hair', 'Last seen Oct 31 1986 near Pruitt Rd.', 'Call Sheriff Dept.'], { size: 13, bg: '#f0ead8' }); photo(g, 60, 210, 140, 120, 'girl');
    paperDraw(g, 260, 30, 210, 330, 'WANTED FOR QUESTIONING', ['ELIAS PRUITT', 'Age ~70. Former owner of Pruitt Funeral Home.', 'Re: desecration of a grave at First Baptist cemetery.', 'Do NOT approach.'], { size: 13, bg: '#efe0c0', stamp: 'ARMED?' });
    photo(g, 300, 225, 130, 110, 'man');
    paperDraw(g, 500, 40, 230, 200, 'NOTICE — CURFEW', ['By order of the County: no one outside after 10 PM until further notice.', 'Keep children inside.', '— Sheriff D. Hutto'], { size: 13, bg: '#f2f0e6', stamp: 'EFFECTIVE NOW' });
    paperDraw(g, 500, 270, 230, 210, 'TOWN MEETING', ['Thursday 7 PM, Courthouse.', 'Topic: the pump jacks on the old Pruitt lease. WHO TURNED THEM ON?', 'Texland Power: "no service to those lines since 1994".'], { size: 12, bg: '#e8ecf2' });
    paperDraw(g, 760, 30, 230, 180, 'LOST DOG', ['Blue heeler, "BUCK". Ran off toward the corn field Saturday night. Won\'t come back when called. Reward.'], { size: 12, bg: '#f4f0e0' });
    paperDraw(g, 760, 240, 230, 240, 'PRAYER VIGIL', ['First Baptist Church', 'for Clara and for Ray Collins (missing from Starlite Motel).', 'Candles provided.', 'Pastor A. Kell'], { size: 12, bg: '#f2ece0' });
    [[130, 40], [365, 40], [615, 50], [615, 280], [875, 40], [875, 250]].forEach(([x, y]) => pin(g, x, y));
  }), 2.6, 1.3, 3.0, 1.75, 8 + IT / 2 + 0.012, 0);
  nm('Placa do xerife'); doc(mk(512, 128, g => { g.fillStyle = '#1e2a4a'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#e8d8a0'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.fillText('SHERIFF DALE HUTTO', 256, 58); g.font = '24px Georgia'; g.fillText('Harlow County · Since 1998', 256, 100); }), 1.6, 0.4, 6 - IT / 2 - 0.012, 2.62, 11.5, -Math.PI / 2);
  nm('Foto do grupo de busca, 1986'); doc(mk(512, 360, g => { g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 512, 360); photo(g, 25, 20, 462, 300, 'group'); g.fillStyle = '#e8d8a0'; g.font = '20px Georgia'; g.textAlign = 'center'; g.fillText('Search party · Nov. 1st, 1986 · Sheriff W. Hutto (left)', 256, 345); }), 1.0, 0.7, T + 0.012, 1.85, 9.6, Math.PI / 2);
  light(wx(3), CEIL - 0.1, wz(12), 6, 8, 0xf0f4ff, { vtt: 6 });

  // =================== SALA DO XERIFE (x 0..6, z 0..8) ===================
  later(place('metal_office_desk', wx(3.2), FL, wz(3.4), 0, 1, G));
  chairs([{ x: wx(3.2), y: FL, z: wz(2.4), ry: 0 }, { x: wx(2.6), y: FL, z: wz(4.8), ry: Math.PI }, { x: wx(3.8), y: FL, z: wz(4.9), ry: Math.PI + 0.3 }]);
  later(place('desk_lamp_arm_01', wx(2.5), FL + 0.79, wz(3.2), 0.8, 1, G));
  nm('Memorando do xerife'); doc(paper('MEMO — FROM THE DESK OF SHERIFF D. HUTTO', ['RE: WHITLOCK (86-1031)', 'This case stays CLOSED.', 'Nobody pulls the file. Nobody talks to the press. Nobody goes out to the Pruitt place after dark.', 'My father put it to rest in \'86 and I intend to keep it that way.', '— D.H.'], { stamp: 'CONFIDENTIAL' }), 0.24, 0.32, 3.4, FL + 0.795, 3.3, 0.2, true);
  nm('Carta de Elias Pruitt Jr.'); doc(mk(512, 680, g => { g.fillStyle = '#e8e2cc'; g.fillRect(0, 0, 512, 680); g.fillStyle = '#2a2a6a'; g.font = '24px "Brush Script MT", "Comic Sans MS", cursive'; ['Dale,', '', 'I know what my father did in that', 'field, and I know what your father', 'helped him bury. The circle was', 'never closed. It is opening again.', '', 'It has to be closed from the', 'inside of the field, at 10:01, with', 'the same words. I wrote them down.', 'They are in the cellar.', '', 'Do not let anyone answer when it', 'calls with her voice.', '', '— E. Pruitt'].forEach((l, i) => g.fillText(l, 40, 60 + i * 36)); age(g, 512, 680, 40); }), 0.21, 0.28, 2.95, FL + 0.796, 3.5, -0.3, true);
  nm('Mapa do condado (sala do xerife)'); doc(mk(1024, 700, g => { g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 1024, 700); COUNTY_MAP(g, 30, 30, 964, 640); }), 1.8, 1.2, T + 0.012, 1.75, 5.3, Math.PI / 2);
  nm('Fotos na parede do xerife'); doc(mk(512, 360, g => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, 512, 360); photo(g, 20, 20, 220, 160, 'group', 'Dad, 1986'); photo(g, 270, 20, 220, 160, 'man', 'W. Hutto & E. Pruitt Sr.'); photo(g, 20, 190, 220, 150, 'house', 'Pruitt place'); photo(g, 270, 190, 220, 150, 'field', '"burn it"'); }), 1.3, 0.9, 3, 1.75, 8 - IT / 2 - 0.012, Math.PI);
  bx(B, m.paint, 0.7, 1.0, 0.6, 5.3, FL + 0.5, 0.75, 0x3a3a3c); doc(mk(128, 128, g => { g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c8b060'; g.beginPath(); g.arc(64, 64, 26, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.font = '12px Arial'; g.textAlign = 'center'; g.fillText('MOSLER', 64, 110); }), 0.5, 0.5, 5.3, FL + 0.55, 1.06, 0);
  light(wx(2.5), FL + 1.3, wz(3.2), 3, 6, 0xffb070, { vtt: 4 });

  // =================== SALA DOS AGENTES (x 6..16, z 0..14) ===================
  const desks: [number, number, number][] = [[8.6, 3, 0], [13.2, 3, 0], [8.6, 9, Math.PI], [13.2, 9, Math.PI]];
  desks.forEach(([x, z, r], i) => {
    later(place('metal_office_desk', wx(x), FL, wz(z), r, 1, G));
    later(place('Television_01', wx(x + 0.45), FL + 0.79, wz(z + (r ? 0.15 : -0.15)), r + Math.PI, 0.7, G));
    chairs([{ x: wx(x), y: FL, z: wz(z + (r ? -0.9 : 0.9)), ry: r + Math.PI + (rnd() - 0.5) * 0.5 }]);
    bx(Dt, m.paint, 0.22, 0.08, 0.18, x - 0.6, FL + 0.83, z, 0x2a2a2a);
    const cup = new THREE.CylinderGeometry(0.045, 0.04, 0.1, 10); cup.translate(wx(x - 0.3), FL + 0.84, wz(z + 0.2)); Dt.add(m.paint, cup, [0xe8e0d0, 0x8a2a24, 0x2a4a6a, 0xe8e0d0][i]);
  });
  const reps: [string, string[], string?][] = [
    ['INCIDENT REPORT 26-1102', ['Location: First Baptist cemetery, plot C-14 (WHITLOCK, C.M.).', 'Grave found OPEN at 6:10 AM by groundskeeper. Soil thrown OUTWARD. Casket lid off.', 'Casket EMPTY — per Pruitt Funeral Home 1993 receipt, it was always empty (memorial).', 'Ladder left in the pit. No footprints leaving.'], 'OPEN'],
    ['MISSING PERSON 26-1104', ['RAY COLLINS, 34, salesman, Lubbock. Starlite Motel, ROOM 7.', 'Door found open, lamp on, bed made. Car still in lot.', 'Mirror: "SHE CAME BACK" in a red substance (lab: NOT blood — iron oxide, old paint?).', 'Polaroid on bed dated 10·31·86.'], 'PENDING'],
    ['CALL FOR SERVICE 26-1106', ['Pruitt lease, 5 pump jacks RUNNING. Field shut in since 1994.', 'Texland Power confirms: NO power to those lines.', 'Deputy Garza: "the motors are cold. They\'re moving anyway."'], undefined],
    ['CALL FOR SERVICE 26-1108', ['Hale ranch: 12 head of cattle missing. Gate closed. No tracks.', 'Rancher reports a girl standing in the corn at night, "calling for her mama".', 'Deputy did not find anyone.'], undefined],
  ];
  desks.forEach(([x, z, r], i) => { nm('Relatório: ' + reps[i][0]); doc(paper(reps[i][0], reps[i][1], { stamp: reps[i][2], size: 17 }), 0.23, 0.31, x - 0.15 + (rnd() - 0.5) * 0.1, FL + 0.795, z + (r ? -0.05 : 0.05), r + (rnd() - 0.5) * 0.4, true); });
  // quadro branco: chamadas da semana
  nm('Quadro de chamadas da semana'); doc(mk(1024, 512, g => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 1024, 512); g.strokeStyle = '#9a9a9a'; g.lineWidth = 14; g.strokeRect(0, 0, 1024, 512);
    marker(g, 'CALLS — THIS WEEK', 40, 70, 46, '#1a2a6a');
    ['Mon — grave open (Whitlock) ✔ photos', 'Tue — Ray Collins missing, Room 7', 'Wed — pump jacks moving?? (Garza)', 'Thu — Hale cattle gone / "girl in corn"', 'Fri — 3 calls from the PRUITT line (DISCONNECTED 1987)', 'Sat — clock on courthouse stopped 10:01', 'Sun — ???'].forEach((l, i) => marker(g, l, 50, 130 + i * 50, 30, i === 4 ? '#a01a1a' : '#1a1a1a'));
    marker(g, 'DON\'T GO OUT THERE ALONE', 560, 470, 30, '#a01a1a'); g.fillStyle = 'rgba(120,120,120,0.15)'; g.fillRect(600, 40, 380, 200); }), 3.6, 1.8, 16 - IT / 2 - 0.012, 1.7, 7.4, -Math.PI / 2);
  nm('Dias sem incidentes'); doc(mk(512, 256, g => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#1a1a1a'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('DAYS WITHOUT', 256, 70); g.fillText('AN INCIDENT', 256, 112); g.fillStyle = '#a01a1a'; g.font = 'bold 110px Arial'; g.fillText('0', 256, 230); }), 0.9, 0.45, 14, 2.2, 14 - IT / 2 - 0.012, Math.PI);
  nm('Escala de plantão'); doc(paper('DUTY ROSTER — NOVEMBER', ['DAYS: Sheriff Hutto · Dep. M. Garza', 'NIGHTS: Dep. T. Boone · Dep. J. Lyle', 'DISPATCH: Mrs. Irene Kowalski', '', 'NOTE: night patrol stays ON PAVEMENT. Do NOT drive Pruitt Rd. after 10 PM. — D.H.', 'Lyle — out sick since Wed (?)'], { size: 15 }), 0.8, 1.05, 7.5, 1.7, 14 - IT / 2 - 0.012, Math.PI);
  for (let i = 0; i < 6; i++) bx(B, m.paint, 0.5, 1.9, 0.5, 6.6 + i * 0.52, FL + 0.95, 0.65, 0x6a7a6a); // armários
  bx(Dt, m.paint, 0.5, 0.45, 0.4, 15.4, FL + 1.1, 12.8, 0x2a2a2a); bx(Dt, m.woodDark, 0.8, 0.85, 0.5, 15.4, FL + 0.43, 12.8, 0x5a4030); // cafeteira
  light(wx(11), CEIL - 0.1, wz(6), 8, 9, 0xf0f4ff, { vtt: 9 });

  // =================== SALA DO CASO (x 6..16, z 14..24) ===================
  later(instance('WoodenTable_01', [{ x: wx(11), y: FL, z: wz(19), ry: 0, s: 1.25, sy: 1.4 } as Xf], G));
  chairs([{ x: wx(9.6), y: FL, z: wz(18.2), ry: 0.2 }, { x: wx(12.4), y: FL, z: wz(18.1), ry: -0.3 }, { x: wx(11), y: FL, z: wz(20.4), ry: Math.PI }]);
  later(instance('cardboard_box_01', [{ x: wx(10.4), y: FL + 0.77, z: wz(19), ry: 0.3 }, { x: wx(14.6), y: FL, z: wz(22.8), ry: 1.2 }, { x: wx(15.1), y: FL, z: wz(22.3), ry: 0.2 }, { x: wx(14.8), y: FL + 0.34, z: wz(22.6), ry: 0.9 }], G));
  // QUADRÃO DO CASO
  nm('Quadro do caso'); doc(mk(2048, 512, g => {
    cork(g, 2048, 512);
    COUNTY_MAP(g, 40, 40, 560, 330); pin(g, 320, 40);
    marker(g, 'THE WHITLOCK CASE', 640, 70, 52, '#1a1a1a');
    // linha do tempo
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, 470); g.lineTo(2000, 470); g.stroke();
    [['10/31/86', 'Clara missing. Lights over Pruitt field (3 calls).'], ['11/01/86', 'Search party. Sheriff W. Hutto ends search at noon. WHY?'], ['12/86', 'Elias Pruitt Sr. leaves town. Funeral home closed.'], ['1993', 'Memorial burial. EMPTY casket (Pruitt receipt).'], ['1994', 'Pruitt oil lease shut in.'], ['NOW', 'Grave opened. Room 7. Pump jacks. Calls. Clock 10:01.']].forEach(([d, t], i) => {
      const x = 660 + i * 225; g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x, 470, 8, 0, 7); g.fill(); paperDraw(g, x - 10, 345, 210, 110, d, [t], { size: 13, bg: i === 5 ? '#f2d8d0' : '#f0ead8' }); });
    photo(g, 650, 110, 150, 190, 'girl', 'CLARA, 16'); photo(g, 820, 120, 150, 180, 'man', 'E. PRUITT SR.'); photo(g, 990, 110, 150, 180, 'man', 'RAY COLLINS');
    photo(g, 1170, 100, 150, 120, 'grave', 'plot C-14'); photo(g, 1340, 100, 150, 120, 'mirror', 'Room 7'); photo(g, 1510, 100, 150, 120, 'field', 'Pruitt corn'); photo(g, 1680, 100, 150, 120, 'tower', 'water tower'); photo(g, 1850, 100, 150, 120, 'car', 'boxcar 41077');
    g.fillStyle = '#f0ead8'; g.fillRect(1180, 240, 260, 90); sigil(g, 1240, 285, 32, '#8a1010', 3); g.fillStyle = '#1a1a1a'; g.font = '16px "Courier New"'; g.fillText('same symbol x4', 1285, 270); g.fillText('(tower, boxcar,', 1285, 292); g.fillText(' field, headstone)', 1285, 314);
    paperDraw(g, 1470, 235, 250, 100, 'THE VEIL FELLOWSHIP?', ['Pruitt Sr., W. Hutto?, Dr. Amos Kell Sr. — met at the funeral home, 1984–86.'], { size: 12, bg: '#efe2c8' });
    paperDraw(g, 1740, 235, 270, 100, 'CORONER (1993)', ['"No remains were ever interred. Casket contained: a hair ribbon, a cassette tape."'], { size: 12, bg: '#e8ecef' });
    // barbantes vermelhos
    g.strokeStyle = '#b01818'; g.lineWidth = 3; const L = (a: number[], b: number[]) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); pin(g, a[0], a[1]); pin(g, b[0], b[1]); };
    L([725, 115], [895, 125]); L([895, 125], [1595, 105]); L([725, 115], [1245, 105]); L([1065, 115], [1415, 105]); L([1595, 105], [1240, 250]); L([1755, 105], [1240, 250]); L([1925, 105], [1240, 250]); L([895, 125], [1595, 240]); L([450, 230], [1595, 105]);
    marker(g, 'WHO ANSWERED THE PHONE AT 10:01?', 1300, 30, 26, '#a01a1a');
  }), 8.8, 2.2, 11, 1.65, D - T - 0.012, Math.PI);
  // quadro branco "o que sabemos"
  nm('Quadro "o que sabemos"'); doc(mk(1024, 640, g => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = '#9a9a9a'; g.lineWidth = 14; g.strokeRect(0, 0, 1024, 640);
    marker(g, 'WHAT WE KNOW', 40, 70, 48);
    ['1. Clara went INTO the field. Didn\'t come out.', '2. Pruitt Sr. + "friends" did something there.', '3. Dad ended the search. Dad knew.', '4. Coffin: ribbon + TAPE (evidence #7 — MISSING?)', '5. Symbol = map of the 3 sites. Center?', '6. Everything happens at 10:01 PM.', '7. Pruitt Jr. is back. Wants the field CLOSED.'].forEach((l, i) => marker(g, l, 50, 140 + i * 62, 32, i === 3 || i === 5 ? '#a01a1a' : '#1a1a1a'));
    sigil(g, 900, 120, 60, '#1a2a6a', 4); }), 3.4, 2.1, 6 + IT / 2 + 0.012, 1.65, 17.4, Math.PI / 2);
  // fotos e papéis sobre a mesa
  nm('Papéis sobre a mesa do caso'); doc(mk(512, 512, g => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 512, 512); photo(g, 20, 30, 160, 130, 'field'); photo(g, 200, 10, 160, 130, 'grave'); photo(g, 330, 160, 160, 130, 'mirror'); paperDraw(g, 40, 200, 230, 290, 'PRUITT FUNERAL HOME — RECEIPT', ['Whitlock memorial, 1993.', 'Casket (sealed, child size).', 'CONTENTS per family request: none.', 'Handwritten: "per W.H. — seal it. — E.P."'], { size: 14 }); }), 1.1, 1.1, 11.2, FL + 1.02, 19.2, 0.2, true); (lastDoc!.material as THREE.MeshStandardMaterial).transparent = true;
  light(wx(11), CEIL - 0.1, wz(19), 8, 9, 0xf0f4ff, { vtt: 8 });

  // =================== EVIDÊNCIAS / ARQUIVO (x 16..22, z 7..15) ===================
  const shelf = (x: number, z: number, along: 'x' | 'z', len: number) => {
    const dx = along === 'x' ? len : 0.5, dz = along === 'x' ? 0.5 : len;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(Dt, m.paint, 0.05, 2.2, 0.05, x + a * (dx / 2 - 0.03), FL + 1.1, z + b * (dz / 2 - 0.03), 0x6a6e70));
    [0.1, 0.65, 1.2, 1.75, 2.2].forEach(y => bx(Dt, m.paint, dx, 0.03, dz, x, FL + y, z, 0x7a7e80));
    const boxes: Xf[] = []; [0.13, 0.68, 1.23, 1.78].forEach(y => { for (let t = -len / 2 + 0.3; t < len / 2 - 0.2; t += 0.45 + rnd() * 0.1) if (rnd() < 0.85) boxes.push({ x: wx(x + (along === 'x' ? t : 0)), y: FL + y, z: wz(z + (along === 'x' ? 0 : t)), ry: (along === 'x' ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.2, s: 0.95 }); });
    later(instance('cardboard_box_01', boxes, G));
  };
  shelf(W - T - 0.3, 11, 'z', 7.2); shelf(19, 7 + IT / 2 + 0.3, 'x', 4.0);
  // arquivos de aço (gavetas), um aberto
  for (let i = 0; i < 3; i++) { const z = 13.6 - i * 0.55; bx(B, m.paint, 0.7, 1.35, 0.5, 16.5, FL + 0.68, z, 0x7a8478); for (let k = 0; k < 4; k++) bx(Dt, m.paint, 0.02, 0.28, 0.4, 16.86, FL + 0.18 + k * 0.32, z, 0x5a6458); }
  bx(Dt, m.paint, 0.55, 0.28, 0.46, 17.15, FL + 0.82, 13.05, 0x7a8478);
  later(instance('WoodenTable_01', [{ x: wx(19.2), y: FL, z: wz(11), ry: Math.PI / 2, s: 0.75, sy: 1.4 } as Xf], G));
  later(place('cardboard_box_01', wx(19.1), FL + 0.77, wz(10.6), 0.2, 1, G));
  later(place('cassette_player', wx(19.3), FL + 0.78, wz(11.4), -0.5, 1, G));
  bx(Dt, m.paint, 0.1, 0.012, 0.064, 19.55, FL + 0.785, 11.6, 0x1a1a1a);
  { const rib = new THREE.TorusGeometry(0.06, 0.012, 4, 12); rib.rotateX(Math.PI / 2); rib.translate(wx(19.0), FL + 0.79, wz(11.5)); Dt.add(m.paint, rib, 0xb01a2a); }
  nm('Etiqueta da caixa 86-1031'); doc(mk(512, 160, g => { g.fillStyle = '#c8a878'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#1a1a1a'; g.font = 'bold 44px "Courier New"'; g.fillText('86-1031', 20, 60); g.font = '30px "Courier New"'; g.fillText('WHITLOCK, C.M.', 20, 110); g.fillStyle = '#a01010'; g.fillText('DO NOT OPEN', 250, 150); }), 0.36, 0.11, 19.1, FL + 0.95, 10.35, 0.2);
  nm('Livro de registro de evidências'); doc(paper('EVIDENCE LOG — CASE 86-1031', ['#1  Hair ribbon, red (from casket, 1993)', '#2  Polaroids x6 (Pruitt field, 10/31/86)', '#3  Chalk sample, Pruitt cellar', '#4  Statement — E. Pruitt Jr. (sealed)', '#5  Map, hand drawn, symbol', '#6  Search log 11/01/86 (pages 3–5 TORN OUT)', '#7  Audio cassette "10/31 22:01" — 911 call', '    → CHECKED OUT 11/10 by D. HUTTO', '    → RETURNED: ____', '#8  Dog collar "BUCK" (found in corn, 11/09)'], { size: 15, stamp: 'ITEM #7 MISSING' }), 0.6, 0.8, 16 + IT / 2 + 0.012, 1.55, 13.9, Math.PI / 2);
  light(wx(19), CEIL - 0.15, wz(11), 5, 7, 0xe8f0f0, { vtt: 5, flick: 1 });

  // =================== INTERROGATÓRIO (x 16..22, z 0..7) ===================
  later(instance('WoodenTable_01', [{ x: wx(19.5), y: FL, z: wz(3.5), ry: Math.PI / 2, s: 0.6, sy: 1.4 } as Xf], G));
  chairs([{ x: wx(18.6), y: FL, z: wz(3.5), ry: Math.PI / 2 }, { x: wx(20.4), y: FL, z: wz(3.5), ry: -Math.PI / 2 }]);
  later(place('cassette_player', wx(19.6), FL + 0.78, wz(3.9), 0.3, 1.2, G));
  nm('Transcrição do depoimento de Dot Reyes'); doc(paper('INTERVIEW TRANSCRIPT — D. "DOT" REYES (Dot\'s Diner)', ['Q: You saw Clara that night?', 'A: 9:40. She came in barefoot. Asked for the pay phone. Said she had to call her mama before ten.', 'Q: Did she call?', 'A: She dialed. Then she hung up and said "the scarecrow knows my name". Walked out toward Pruitt Rd.', 'Q: Anything else?', 'A: Last week the diner phone rang at 10:01. I picked up. Somebody said "Dot, tell Mama I\'m in the field." Sheriff, I KNOW that voice.', '[TAPE ENDS]'], { size: 15 }), 0.25, 0.33, 19.4, FL + 0.785, 3.1, -0.15, true);
  { const mir = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.05, metalness: 0.9, envMapIntensity: 1.5 })); mir.position.set(wx(16 + IT / 2 + 0.012), 1.7, wz(5.6)); mir.rotation.y = Math.PI / 2; G.add(mir); }
  light(wx(19.5), CEIL - 0.6, wz(3.5), 5, 8, 0xfff0d0, { vtt: 4 }); halo(wx(19.5), CEIL - 0.5, wz(3.5), 0.5);
  later(instance('hanging_industrial_lamp', [{ x: wx(19.5), y: CEIL - 1.2, z: wz(3.5), ry: 0, s: 0.8 }], G));

  // =================== RÁDIO / DESPACHO (x 0..6, z 16..24) ===================
  bx(B, m.woodDark, 1.0, 0.78, 4.0, 0.85, FL + 0.39, 19.6, 0x5a4636); bx(Dt, m.woodDark, 1.05, 0.04, 4.1, 0.85, FL + 0.8, 19.6, 0x3a2a1e);
  later(place('vintage_radio_transceiver', wx(0.75), FL + 0.82, wz(19.0), Math.PI / 2, 1.1, G));
  later(place('Television_01', wx(0.75), FL + 0.82, wz(20.6), Math.PI / 2, 0.75, G));
  chairs([{ x: wx(1.8), y: FL, z: wz(19.6), ry: -Math.PI / 2 }]);
  // painel com luzinhas
  { const lightsTex = mk(256, 128, g => { g.fillStyle = '#2a2c2a'; g.fillRect(0, 0, 256, 128); for (let y = 0; y < 4; y++) for (let x = 0; x < 10; x++) { g.fillStyle = rnd() < 0.25 ? '#ff4030' : rnd() < 0.4 ? '#40ff60' : '#3a3a30'; g.beginPath(); g.arc(16 + x * 24, 20 + y * 28, 6, 0, 7); g.fill(); } });
    const pm = new THREE.MeshBasicMaterial({ map: lightsTex, toneMapped: false }); const pnl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), pm); pnl.position.set(wx(T + 0.02), 1.6, wz(18.3)); pnl.rotation.y = Math.PI / 2; G.add(pnl); }
  nm('Registro do despacho (rádio)'); doc(paper('DISPATCH LOG — NIGHT OF 11/11', ['21:47  Hale ranch: lights in the corn.', '21:58  Courthouse clock alarm (no one inside).', '22:01  INCOMING — female, young: "Tell Mama I\'m at the field. Tell her to come get me." Line traced to: PRUITT RESIDENCE, Rt. 2.', '        (Southwestern Bell: line DISCONNECTED 03/1987)', '22:01  INCOMING — same voice — Diner.', '22:01  INCOMING — same voice — Whitlock residence.', '22:02  Lyle 10-8 to Pruitt Rd. against orders.', '22:19  Lyle no response.', '22:40  Lyle no response.', '— I.K.'], { size: 15, stamp: 'UNIT 4 SILENT' }), 0.75, 1.0, 4.8, 1.7, 16 + IT / 2 + 0.012, 0);
  nm('Cartão de códigos 10'); doc(mk(256, 256, g => { g.fillStyle = '#e8e2c0'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#1a1a1a'; g.font = 'bold 26px Arial'; g.fillText('10-CODES', 20, 40); g.font = '20px "Courier New"'; ['10-4  OK', '10-8  in service', '10-20 location', '10-33 EMERGENCY', '10-99 ...don\'t', '      answer it'].forEach((l, i) => g.fillText(l, 20, 80 + i * 30)); }), 0.4, 0.4, T + 0.012, 1.75, 21.6, Math.PI / 2);
  light(wx(1.4), 1.7, wz(19.6), 3, 6, 0x9fdcff, { vtt: 4 });

  // =================== CELAS (x 16..22, z 15..24) ===================
  const bars: THREE.Matrix4[] = [];
  for (let z = 15 + IT / 2; z <= D - T; z += 0.13) { if (z > 21.4 && z < 22.4) continue; bars.push(mtx(wx(18.4), FL + (CEIL - FL) / 2, wz(z))); }
  [[18.4, 15.2, 'z'], [18.4, 18, 'z'], [18.4, 21, 'z']].forEach(() => {});
  const bi = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, CEIL - FL, 6), new THREE.MeshStandardMaterial({ color: 0x3a3c3e, metalness: 0.8, roughness: 0.5 }), bars.length);
  bars.forEach((mm, i) => bi.setMatrixAt(i, mm)); bi.computeBoundingSphere(); bi.castShadow = true; G.add(bi);
  [FL + 0.1, FL + 1.1, CEIL - 0.1].forEach(y => bx(Dt, m.iron, 0.05, 0.05, D - T - 15, 18.4, y, (15 + D - T) / 2, 0x3a3c3e));
  // porta da cela 3 aberta
  { const dg = new THREE.Group(); dg.position.set(wx(18.4), FL, wz(21.4)); dg.rotation.y = -1.2; G.add(dg); for (let i = 0; i < 8; i++) { const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, CEIL - FL - 0.1, 6), bi.material as THREE.Material); b2.position.set(0, (CEIL - FL) / 2, i * 0.13); dg.add(b2); } }
  vttWalls.push([[wx(18.4), wz(15)], [wx(18.4), wz(21.4)]], [[wx(18.4), wz(22.4)], [wx(18.4), wz(D - T)]]);
  [16.5, 19.5, 22.5].forEach((z, i) => { bx(Dt, m.plain, 2.6, 0.08, 0.8, 20.6, FL + 0.45, z - 0.9, 0x6a6a68); bx(Dt, m.plain, 2.6, 0.08, 0.75, 20.6, FL + 0.52, z - 0.9, i === 1 ? 0x8a7a68 : 0x6a7a8a); bx(Dt, m.paint, 0.45, 0.45, 0.45, 21.4, FL + 0.23, z + 0.9, 0xc8c8c4); });
  // cela 2: sigilo riscado na parede, marcas de contagem e um bilhete
  nm('Símbolo riscado na cela 2'); doc(mk(512, 512, g => { g.clearRect(0, 0, 512, 512); sigil(g, 256, 230, 150, 'rgba(230,226,215,0.8)', 5); g.strokeStyle = 'rgba(230,226,215,0.75)'; g.lineWidth = 4; for (let k = 0; k < 4; k++) { for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40 + k * 60 + i * 10, 430); g.lineTo(40 + k * 60 + i * 10, 490); g.stroke(); } g.beginPath(); g.moveTo(32 + k * 60, 470); g.lineTo(80 + k * 60, 445); g.stroke(); } g.font = '30px "Comic Sans MS", cursive'; g.fillStyle = 'rgba(230,226,215,0.85)'; g.fillText('10:01', 330, 480); }), 1.6, 1.6, W - T - 0.012, 1.5, 19.5, -Math.PI / 2); (lastDoc!.material as THREE.MeshStandardMaterial).transparent = true;
  nm('Bilhete na cela'); doc(paper('(scrap of paper)', ['they all say the same thing at 10:01.', 'don\'t answer.', 'don\'t say your name out loud.', '— T.B.'], { size: 22, bg: '#ece6d0' }), 0.18, 0.22, 20.3, FL + 0.565, 18.7, 0.6, true);
  light(wx(17.2), CEIL - 0.1, wz(19.5), 5, 8, 0xe0f0e8, { vtt: 5, flick: 3 });

  // luminárias fluorescentes (painéis emissivos no forro)
  { const fm = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, emissive: 0xf0f4ff, emissiveIntensity: 1.6, roughness: 0.4 });
    [[3, 4], [3, 12], [3, 20], [9, 4], [13, 4], [9, 10], [13, 10], [9, 18], [13, 18], [9, 21.5], [13, 21.5], [19, 3.5], [19, 11], [17.2, 18], [17.2, 21.5]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.3), fm); p.position.set(wx(x), CEIL - 0.03, wz(z)); roofs.add(p); }); }

  // ---------- montar ----------
  const solids = B.build(G);
  Dt.build(G, { shadow: Q.lights > 8 });
  const floors = F.build(G, { shadow: false });
  R.build(roofs);
  await Promise.all(P);
  return { docs, solids, floors, roofs, vttWalls, portals, lamps };
}
