// Sul de Arton — símbolos do mapa: alfinetes coloridos por região, nomes (regiões e lugares), rotas de viagem
// tracejadas com placas de distância (km e dias), bandeirinhas de altitude nos picos.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type P, LUGARES, Ysolo, Y, W, suaviza, PICOS, PICO_A, KM_POR_UNIDADE, lugar } from './geo';
import { fita, rotulo } from './terreno';

export const COR_PINO: Record<string, [number, number, number]> = {
  uiv: [0.08, 0.6, 0.58], nam: [0.08, 0.6, 0.58], oeste: [0.78, 0.1, 0.1], tap: [0.78, 0.1, 0.1], lom: [0.95, 0.74, 0.08], deh: [0.48, 0.22, 0.75], ilha: [0.12, 0.42, 0.9], tollon: [0.15, 0.7, 0.3],
};
const CAPITAIS = ['barud', 'valkaria', 'tiberus', 'giluk'];
export const altPino = (id: string) => (CAPITAIS.includes(id) ? 7.2 : 5.6);

export interface Rota { n: string; de: string; para: string; pts: P[]; km: number }
const pxDe = (id: string): P => { const l = lugar(id); return [l.x / 0.5 + 430, l.z / 0.5 + 1040]; };
const ROTAS_DEF: [string, string, P[]][] = [
  ['barud', 'valkaria', [[545, 1110], [530, 1060], [516, 1020], [560, 1000], [620, 1020], [700, 1002]]],
  ['barud', 'malpetrim', [[510, 1190], pxDe('nimbarann'), [440, 1162], pxDe('ancora'), [352, 1146], [300, 1150], [250, 1150], [205, 1175]]],
  ['valkaria', 'giluk', [[750, 965], [742, 905], [740, 860], [700, 835], [650, 800], [600, 775], [520, 765]]],
  ['malpetrim', 'tiberus', [[168, 1140], [130, 1075], [110, 1020], pxDe('centauros'), [70, 900], [40, 850], [30, 760], [42, 650], [60, 590]]],
  ['barud', 'korl', [[560, 1210], pxDe('asidon'), [505, 1270]]],
  ['giluk', 'catedral', [[438, 660], [400, 630]]],
];
export const ROTAS: Rota[] = ROTAS_DEF.map(([de, para, meio]) => {
  const pts = suaviza([pxDe(de), ...meio, pxDe(para)].map(([a, b]) => W(a, b)), 0.8, 1.2);
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { n: `${lugar(de).n} → ${lugar(para).n}`, de, para, pts, km: L * KM_POR_UNIDADE };
});
export const dias = (km: number, porDia: number) => Math.max(1, Math.round(km / porDia));

function placa(linhas: [string, string]) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 200; const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(232,218,184,0.95)'; g.strokeStyle = '#3a2412'; g.lineWidth = 8;
  const rr = (x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  rr(8, 8, 496, 184, 26); g.fill(); g.stroke();
  g.fillStyle = '#3a2412'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 74px Georgia, serif'; g.fillText(linhas[0], 256, 78);
  g.font = 'italic 40px Georgia, serif'; g.fillText(linhas[1], 256, 150);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, fog: false })); s.center.set(0.5, 0); s.scale.set(9, 9 * 200 / 512, 1); s.renderOrder = 21; s.userData.ns = 1; s.userData.noExport = 1; s.userData.base = 9 * 200 / 512 * 1.6; s.userData.asp = 512 / 200;
  return s;
}

export function construirSimbolos(Gr: THREE.Group) {
  // ---------- alfinetes ----------
  const ps: THREE.BufferGeometry[] = [];
  const pinta = (g: THREE.BufferGeometry, c: [number, number, number]) => { const x = g.index ? g.toNonIndexed() : g, n = x.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); x.setAttribute('color', new THREE.BufferAttribute(a, 3)); x.deleteAttribute('uv'); return x; };
  for (const l of LUGARES) {
    if (!l.pin) continue;
    const y = Ysolo(l.x, l.z), cap = CAPITAIS.includes(l.id), h = altPino(l.id), r = cap ? 1.35 : 1.05, c = cap ? [0.95, 0.72, 0.12] as [number, number, number] : COR_PINO[l.reg];
    const ponta = new THREE.ConeGeometry(r * 0.42, h - r, 10); ponta.rotateX(Math.PI); ponta.translate(l.x, y + (h - r) / 2, l.z); ps.push(pinta(ponta, c));
    const cab = new THREE.SphereGeometry(r, 16, 12); cab.translate(l.x, y + h, l.z); ps.push(pinta(cab, c));
    const miolo = new THREE.SphereGeometry(r * 0.45, 10, 8); miolo.translate(l.x, y + h + r * 0.62, l.z); ps.push(pinta(miolo, [1, 1, 1]));
  }
  const gp = mergeGeometries(ps)!; gp.computeVertexNormals();
  const alfinetes = new THREE.Mesh(gp, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.05, emissive: 0x111111 })); alfinetes.name = 'Alfinetes'; alfinetes.castShadow = true; alfinetes.userData.ns = 1; alfinetes.userData.noExport = 1;
  Gr.add(alfinetes);

  // ---------- nomes ----------
  const nomes = new THREE.Group(); nomes.name = 'Nomes';
  const reg = (txt: string, px: number, py: number, y: number, alt: number, cor: string, it = false) => { const [x, z] = W(px, py), s = rotulo(txt, alt, { cor, esp: 0.18, italico: it, peso: '700' }); s.position.set(x, y, z); s.userData.reg = 1; nomes.add(s); };
  reg('UIVANTES', 400, 770, 34, 12, '#e8f4ff'); reg('FLORESTA DE TOLLON', 335, 1120, 11, 5.6, '#cfeecf'); reg('LOMATUBAR', 545, 1212, 11, 7.2, '#fbe7a0');
  reg('DEHEON', 760, 1075, 13, 9, '#ead6ff'); reg('MAR NEGRO', 330, 1435, 7, 11, '#cfe6e6', true); reg('PETRYNIA', 95, 1040, 14, 7, '#f6dcd0');
  reg('TAPISTA', 210, 520, 12, 6.5, '#f6dcd0'); reg('NAMALKAH', 800, 668, 10, 6.5, '#e6f0d8');
  for (const l of LUGARES) {
    if (!l.rot) continue;
    const cap = CAPITAIS.includes(l.id), y = Ysolo(l.x, l.z) + (l.pin ? altPino(l.id) + 1.6 : 2.5);
    const s = rotulo(l.n, cap ? 6 : 4.2, { cor: cap ? '#ffe9a8' : '#f6ecd6', peso: cap ? '700' : '600', italico: !l.pin });
    s.position.set(l.x, y, l.z); nomes.add(s);
  }
  Gr.add(nomes);

  // ---------- rotas de viagem com placas de distância ----------
  const rotas = new THREE.Group(); rotas.name = 'Rotas de viagem';
  const matR = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 0.78, 1.7), transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 });
  const matN = new THREE.MeshBasicMaterial({ color: 0xf2f6ff, transparent: true, opacity: 0.95, depthWrite: false });
  for (const R of ROTAS) {
    const m = new THREE.Mesh(fita(R.pts, 0.55, (x, z) => Math.max(0, Y(x, z)) + 1.0, [2.0, 1.3]), matR); m.renderOrder = 4; m.userData.ns = 1; rotas.add(m);
    for (const p of [R.pts[0], R.pts[R.pts.length - 1]]) { const d = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 20), matN); d.rotation.x = -Math.PI / 2; d.position.set(p[0], Ysolo(p[0], p[1]) + 1.05, p[1]); d.renderOrder = 4; d.userData.ns = 1; rotas.add(d); }
    let acc = 0, tot = 0; for (let i = 1; i < R.pts.length; i++) tot += Math.hypot(R.pts[i][0] - R.pts[i - 1][0], R.pts[i][1] - R.pts[i - 1][1]);
    let meio = R.pts[0]; for (let i = 1; i < R.pts.length; i++) { acc += Math.hypot(R.pts[i][0] - R.pts[i - 1][0], R.pts[i][1] - R.pts[i - 1][1]); if (acc >= tot / 2) { meio = R.pts[i]; break; } }
    const s = placa([`${Math.round(R.km)} km`, `${dias(R.km, 30)} dias a pé · ${dias(R.km, 50)} a cavalo`]); s.position.set(meio[0], Ysolo(meio[0], meio[1]) + 2.2, meio[1]); s.userData.rota = R.n; rotas.add(s);
  }
  Gr.add(rotas);

  // ---------- bandeirinhas de altitude nos picos ----------
  const bs: THREE.BufferGeometry[] = [];
  PICOS.forEach(([x, z], i) => { if (!PICO_A[i] || PICO_A[i] < 8) return; const y = Y(x, z); const haste = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 4); haste.translate(x, y + 0.9, z); bs.push(pinta(haste, [0.2, 0.15, 0.1])); const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute([x, y + 1.8, z, x + 0.9, y + 1.55, z, x, y + 1.3, z], 3)); b.computeVertexNormals(); bs.push(pinta(b, [0.75, 0.12, 0.1])); });
  const gb = mergeGeometries(bs)!; gb.computeVertexNormals(); const marcos = new THREE.Mesh(gb, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide })); marcos.name = 'Marcos de altitude'; marcos.userData.ns = 1; Gr.add(marcos);
  return { alfinetes, nomes, rotas, marcos };
}
