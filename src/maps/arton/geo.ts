// Sul de Arton (Tormenta 20) — geografia do mapa regional: regiões, costa, ilhas, rios, estradas, lugares e o
// relevo (grade de alturas com cor por bioma e máscara de rocha/neve). Posições tiradas da imagem de referência do
// dono (mapa do Fichas de Nimb, 905×2000 px): cada ponto está em "px da referência" e vira mundo por W().
// Escala: 1 px da referência = 0,5 unidade. Mapa: x ∈ [−215, 215], z ∈ [−270, 270] (norte = −z).
import { noise2, fbm } from '../../core/terrain';
import { CFG } from '../../core/config';

export type P = [number, number];
export const ESC = 0.5;
export const W = (px: number, py: number): P => [(px - 430) * ESC, (py - 1040) * ESC];
const w = (pts: P[]) => pts.map(([a, b]) => W(a, b));
export const LIM = { x0: -215, x1: 215, z0: -270, z1: 270 };
/** km por unidade do mapa (ajustável no painel; ~860 km de leste a oeste) */
export const KM_POR_UNIDADE = 2;

// ---------- utilidades ----------
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function ridged(x: number, z: number, oct = 5) {
  let s = 0, a = 0.5, f = 1, pw = 1;
  for (let i = 0; i < oct; i++) { let n = 1 - Math.abs(noise2(x * f, z * f) * 2 - 1); n *= n; s += a * n * pw; pw = clamp(n * 1.3); f *= 2.03; a *= 0.5; }
  return s;
}
let sd = 4242;
export const reseed = (s: number) => { sd = s; };
export const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
export const entre = (a: number, b: number) => a + (b - a) * rnd();

type BB = [number, number, number, number];
const bbox = (P: P[], m = 0): BB => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of P) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z); } return [a - m, b + m, c - m, d + m]; };
/** distância com sinal até um polígono (positiva dentro), em unidades do mapa; fora da caixa + 40 devolve −40 */
export function sdPoly(P: P[], x: number, z: number, bb?: BB) {
  if (bb && (x < bb[0] || x > bb[1] || z < bb[2] || z > bb[3])) return -40;
  let d = Infinity, dentro = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const xi = P[i][0], zi = P[i][1], xj = P[j][0], zj = P[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dentro = !dentro;
    const ex = xj - xi, ez = zj - zi, L2 = ex * ex + ez * ez || 1;
    let t = ((x - xi) * ex + (z - zi) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = xi + ex * t - x, dz = zi + ez * t - z, dd = dx * dx + dz * dz;
    if (dd < d) d = dd;
  }
  d = Math.sqrt(d); return dentro ? d : -d;
}
/** distância até uma linha (lista de pontos) e o parâmetro ao longo dela (0..1) */
export function distLinha(L: P[], x: number, z: number) {
  let d = Infinity, u = 0, acc = 0, tot = 0;
  for (let i = 1; i < L.length; i++) tot += Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]);
  for (let i = 1; i < L.length; i++) {
    const [ax, az] = L[i - 1], [bx, bz] = L[i], ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1, seg = Math.sqrt(L2);
    let t = ((x - ax) * ex + (z - az) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dd = Math.hypot(ax + ex * t - x, az + ez * t - z);
    if (dd < d) { d = dd; u = (acc + seg * t) / tot; }
    acc += seg;
  }
  return { d, u };
}
/** linha suavizada (Catmull-Rom) com passo ~p e um leve tremor de mão */
export function suaviza(L: P[], p = 1, tremor = 0, atenua?: (x: number, z: number) => number): P[] {
  const out: P[] = [];
  for (let i = 0; i < L.length - 1; i++) {
    const p0 = L[Math.max(0, i - 1)], p1 = L[i], p2 = L[i + 1], p3 = L[Math.min(L.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / p));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      let x = f(p0[0], p1[0], p2[0], p3[0]), z = f(p0[1], p1[1], p2[1], p3[1]);
      if (tremor) { const tr = tremor * (atenua ? atenua(x, z) : 1); x += (noise2(x * 0.3, z * 0.3 + 5) - 0.5) * tr; z += (noise2(x * 0.3 + 9, z * 0.3) - 0.5) * tr; }
      out.push([x, z]);
    }
  }
  out.push(L[L.length - 1]);
  return out;
}

// ---------- regiões (px da referência; fronteiras pintadas do mapa) ----------
export const UIVANTES = w([[40, 605], [110, 585], [200, 570], [300, 556], [405, 545], [500, 548], [590, 558], [650, 575], [700, 590], [745, 600], [748, 700], [740, 790], [700, 800], [688, 850], [697, 920], [690, 975], [640, 985], [580, 992], [520, 1000], [450, 1006], [380, 998], [315, 988], [280, 962], [240, 935], [180, 912], [110, 888], [50, 872], [25, 840], [22, 760], [28, 680]]);
export const ESTEPE = w([[598, 600], [745, 602], [748, 700], [740, 790], [650, 800], [612, 720]]);
export const TOLLON = w([[315, 988], [380, 998], [440, 1006], [448, 1045], [440, 1090], [405, 1130], [398, 1180], [394, 1240], [392, 1290], [355, 1286], [320, 1280], [285, 1250], [250, 1215], [240, 1165], [242, 1115], [262, 1060], [290, 1012]]);
export const LOMATUBAR = w([[398, 1140], [440, 1098], [485, 1066], [530, 1058], [575, 1066], [615, 1085], [645, 1110], [668, 1160], [670, 1205], [645, 1240], [618, 1275], [590, 1281], [555, 1275], [520, 1282], [495, 1296], [475, 1314], [450, 1320], [420, 1310], [394, 1290], [394, 1240], [396, 1190]]);
export const DEHEON = w([[450, 1006], [520, 1000], [580, 992], [640, 985], [690, 975], [697, 920], [688, 850], [705, 800], [760, 795], [820, 790], [860, 788], [860, 1208], [820, 1216], [785, 1222], [750, 1228], [715, 1242], [680, 1256], [652, 1266], [630, 1262], [645, 1240], [670, 1205], [668, 1160], [645, 1110], [615, 1085], [575, 1066], [530, 1058], [485, 1066], [448, 1045]]);
export const BB = { U: bbox(UIVANTES, 40), E: bbox(ESTEPE, 40), T: bbox(TOLLON, 40), L: bbox(LOMATUBAR, 40), D: bbox(DEHEON, 40) };

// ---------- costa (z da linha da costa para cada x; terra ao norte) ----------
const COSTA = w([[0, 1168], [30, 1180], [60, 1192], [95, 1203], [130, 1206], [170, 1200], [205, 1212], [240, 1224], [265, 1243], [290, 1262], [320, 1281], [355, 1289], [390, 1296], [420, 1310], [450, 1320], [475, 1314], [495, 1296], [520, 1282], [555, 1275], [590, 1281], [620, 1287], [650, 1270], [680, 1256], [715, 1242], [750, 1228], [785, 1222], [820, 1216], [860, 1208]]);
export function costaZ(x: number) {
  let z = COSTA[COSTA.length - 1][1];
  for (let i = 1; i < COSTA.length; i++) if (x <= COSTA[i][0]) { const [ax, az] = COSTA[i - 1], [bx, bz] = COSTA[i]; z = lerp(az, bz, clamp((x - ax) / (bx - ax))); break; }
  return z + (fbm(x * 0.07, 3.3, 3) - 0.47) * 5 + (noise2(x * 0.3, 9.1) - 0.5) * 1.6;
}

// ---------- ilhas do Mar Negro ----------
export interface Ilha { x: number; z: number; rx: number; rz: number; a: number; h: number; s: number }
const ilha = (px: number, py: number, rx: number, rz: number, a: number, h: number, s: number): Ilha => { const [x, z] = W(px, py); return { x, z, rx: rx * ESC, rz: rz * ESC, a, h, s }; };
export const ILHAS: Ilha[] = [
  ilha(338, 1335, 17, 10, 0.3, 2.2, 1), ilha(430, 1392, 10, 8, 0, 1.6, 2), ilha(548, 1340, 9, 7, 0.5, 1.4, 3),
  ilha(640, 1385, 64, 38, -0.25, 15, 4),      // a grande ilha montanhosa do sudeste
  ilha(845, 1300, 22, 14, 0.2, 3, 5), ilha(775, 1400, 15, 10, 0.6, 2.4, 6),
  ilha(235, 1490, 58, 30, 0.15, 6, 7), ilha(163, 1462, 17, 13, 0, 2.5, 8), ilha(303, 1527, 15, 10, 0.4, 1.8, 9),
  ilha(28, 1410, 26, 19, 0.2, 3.5, 10), ilha(505, 1462, 13, 9, -0.3, 2, 11),
  ilha(692, 1532, 24, 13, 0.1, 3.2, 12), ilha(620, 1548, 13, 8, 0.7, 1.6, 13), ilha(392, 1542, 11, 8, 0.2, 1.5, 14),
];
/** distância com sinal até a borda de uma ilha (positiva dentro) */
export function ilhaD(I: Ilha, x: number, z: number) {
  const dx = x - I.x, dz = z - I.z; if (Math.abs(dx) > I.rx * 1.8 + 6 || Math.abs(dz) > I.rx * 1.8 + 6) return -20;
  const c = Math.cos(I.a), s = Math.sin(I.a), u = dx * c + dz * s, v = -dx * s + dz * c;
  const ang = Math.atan2(v, u), rr = 1 + 0.22 * (noise2(Math.cos(ang) * 1.6 + I.s * 7, Math.sin(ang) * 1.6) - 0.5) * 2 + 0.08 * (noise2(ang * 3 + I.s, 1) - 0.5);
  const e = Math.hypot(u / I.rx, v / I.rz) / rr;
  return (1 - e) * Math.min(I.rx, I.rz);
}

// ---------- rios (da nascente para a foz) ----------
export const RIOS: P[][] = [
  [[520, 850], [500, 920], [470, 980], [455, 1012], [452, 1060], [446, 1110], [450, 1160], [452, 1205], [448, 1250], [458, 1290], [463, 1330]],
  [[522, 1060], [508, 1110], [494, 1160], [489, 1205], [482, 1245], [472, 1282], [466, 1310]],
  [[600, 990], [592, 1050], [578, 1105], [584, 1145], [590, 1178], [600, 1212], [608, 1250], [606, 1292]],
  [[300, 1000], [305, 1060], [318, 1120], [305, 1180], [300, 1240], [296, 1280]],
  [[120, 885], [128, 960], [118, 1040], [112, 1120], [104, 1210]],
  [[215, 940], [222, 1010], [210, 1090], [205, 1150], [200, 1218]],
  [[760, 815], [772, 900], [805, 958], [812, 995], [806, 1040], [808, 1120], [815, 1222]],
  [[690, 990], [705, 1050], [725, 1120], [742, 1180], [750, 1234]],
  [[225, 700], [250, 735], [270, 758]],
].map(r => suaviza(w(r as P[]), 0.8, 1.2));
export const LAGO = (() => { const [x, z] = W(275, 765); return { x, z, rx: 8.5, rz: 5.5, nivel: 7.6 }; })();

// ---------- lugares ----------
export type Reg = 'uiv' | 'oeste' | 'tollon' | 'lom' | 'deh' | 'tap' | 'ilha' | 'nam';
export interface Lugar { id: string; n: string; x: number; z: number; reg: Reg; tipo: string; rot?: boolean; pin?: boolean; tam?: number }
const L = (id: string, n: string, px: number, py: number, reg: Reg, tipo: string, o: Partial<Lugar> = {}): Lugar => { const [x, z] = W(px, py); return { id, n, x, z, reg, tipo, rot: true, pin: true, ...o }; };
const V = (px: number, py: number, reg: Reg, tipo = 'vila', o: Partial<Lugar> = {}): Lugar => L(`v${px}_${py}`, '', px, py, reg, tipo, { rot: false, ...o });
export const LUGARES: Lugar[] = [
  // Uivantes
  L('giluk', 'Giluk', 433, 735, 'uiv', 'giluk'), L('catedral', 'Catedral de Gelo', 380, 610, 'uiv', 'catedral'),
  L('beluhga', 'Covil de Beluhga', 321, 698, 'uiv', 'beluhga'), L('gelo1', 'Ruínas do Povo Perdido', 168, 655, 'uiv', 'gelo-antigo'),
  L('gelo2', 'Arcos de Gelo', 233, 660, 'uiv', 'gelo-antigo', { pin: false }), L('lago', 'Lago Espelho', 275, 765, 'uiv', 'nada', { pin: false }),
  L('ian', 'Cabana de Ian', 208, 790, 'uiv', 'cabana-ian'), L('bruxa', 'Cabana da Bruxa', 222, 835, 'uiv', 'cabana-bruxa'),
  L('cavgelo', 'Caverna Congelada', 500, 700, 'uiv', 'caverna'), L('estepe', 'Estepe Gelada', 690, 690, 'nam', 'nada', { pin: false }),
  V(306, 668, 'uiv', 'aldeia-gelo'), V(438, 660, 'uiv', 'aldeia-gelo'), V(306, 755, 'uiv', 'aldeia-gelo'), V(365, 905, 'uiv', 'aldeia-gelo'),
  V(544, 815, 'uiv', 'aldeia-gelo'), V(637, 628, 'uiv', 'aldeia-gelo'), V(680, 615, 'uiv', 'aldeia-gelo'), V(630, 730, 'uiv', 'aldeia-gelo'),
  V(692, 718, 'uiv', 'aldeia-gelo'), V(735, 710, 'uiv', 'aldeia-gelo'), V(652, 780, 'uiv', 'aldeia-gelo'), V(668, 810, 'uiv', 'aldeia-gelo'),
  // Oeste (Petrynia) e Tapista
  L('malpetrim', 'Nova Malpetrim', 165, 1194, 'oeste', 'malpetrim', { tam: 1.2 }), L('velha', 'Velha Malpetrim', 118, 1214, 'oeste', 'velha-malpetrim'),
  L('zolkan', 'Mansão de Zolkan', 238, 1070, 'oeste', 'zolkan'), L('azazel', 'Torre de Azazel', 180, 960, 'oeste', 'azazel'),
  L('centauros', 'Aldeia dos Centauros', 103, 970, 'oeste', 'centauros'), L('kobolds', 'Planalto dos Kobolds', 133, 910, 'oeste', 'kobolds'),
  L('tiberus', 'Tiberus', 88, 545, 'tap', 'tiberus', { tam: 1.3 }),
  V(250, 960, 'oeste'), V(130, 1075, 'oeste'), V(45, 1080, 'oeste'), V(220, 1112, 'oeste'), V(168, 1140, 'oeste'), V(78, 1160, 'oeste'), V(22, 1150, 'oeste'),
  V(315, 532, 'tap', 'forte-tapista'), V(392, 516, 'tap', 'forte-tapista'),
  // Floresta de Tollon
  L('covariel', 'Torre de Covariel', 447, 1050, 'tollon', 'covariel'), L('ancora', 'Taverna Âncora Quebrada', 404, 1140, 'tollon', 'ancora'),
  L('eremita1', 'Clareira do Eremita', 300, 1102, 'tollon', 'eremita', { pin: false }), L('eremita2', 'Cabana do Musgo', 338, 1205, 'tollon', 'eremita', { pin: false }),
  // Lomatubar
  L('barud', 'Barud', 565, 1165, 'lom', 'barud', { tam: 1.2 }), L('nimbarann', 'Nimbarann', 470, 1205, 'lom', 'nimbarann'),
  L('ralanda', 'Ralanda', 545, 1110, 'lom', 'vila-lom', { tam: 1.2 }), L('kurikondir', 'Kurikondir', 628, 1120, 'lom', 'vila-lom'),
  L('karitania', 'Karitania', 613, 1160, 'lom', 'vila-lom'), L('asidon', 'Fortaleza de Asidon', 548, 1247, 'lom', 'asidon'),
  L('boasorte', 'Bosque da Boa Sorte', 425, 1222, 'lom', 'nada', { pin: false }), L('korl', 'Templo de Korl Khodan', 455, 1303, 'lom', 'korl'),
  L('pantano', 'Pântano Cinzento', 528, 1196, 'lom', 'nada', { pin: false }),
  V(440, 1242, 'lom', 'vila-lom'), V(495, 1232, 'lom', 'vila-lom'), V(410, 1276, 'lom', 'vila-lom'),
  // Deheon
  L('valkaria', 'Valkaria', 790, 990, 'deh', 'valkaria', { tam: 1.5 }), L('porto', 'Porto de Deheon', 752, 1220, 'deh', 'porto'),
  V(516, 1020, 'deh', 'vila-deh'), V(688, 860, 'deh', 'vila-deh'), V(740, 860, 'deh', 'vila-deh'), V(800, 890, 'deh', 'vila-deh'),
  V(845, 945, 'deh', 'vila-deh'), V(750, 965, 'deh', 'vila-deh'), V(680, 1130, 'deh', 'vila-deh'), V(835, 1150, 'deh', 'vila-deh'), V(620, 1020, 'deh', 'vila-deh'),
  // Ilhas do Mar Negro
  L('pescadores', 'Vila dos Pescadores', 612, 1364, 'ilha', 'pesca'), L('ilhasul', 'Arquipélago do Sul', 215, 1480, 'ilha', 'pesca'),
  V(838, 1292, 'ilha', 'pesca'), V(28, 1404, 'ilha', 'pesca'),
];
export const lugar = (id: string) => LUGARES.find(l => l.id === id)!;

// ---------- cidades com contorno (muralha, paliçada ou só a borda): as estradas param no portão e viram avenida,
// o chão fica de terra batida e não nascem árvores dentro. pol = contorno em coordenadas locais (senão, círculo) ----------
export interface Muro { id: string; x: number; z: number; r: number; pol?: P[]; tipo: 'pedra' | 'paliçada' | 'aberta'; aberto?: number[] }
const MURO_BARUD: P[] = [104, 101, 106, 100, 103, 99, 105, 102, 100, 104, 98, 103].map((r, k) => { const a = ((15 + k * 30) * Math.PI) / 180, s = r * 0.0641; return [Math.cos(a) * s, Math.sin(a) * s]; });
export const MUROS: Muro[] = ([
  { id: 'barud', r: 6.8, pol: MURO_BARUD, tipo: 'pedra' },
  { id: 'valkaria', r: 16, tipo: 'pedra' },
  { id: 'giluk', r: 10.5, tipo: 'paliçada' },
  // Nova Malpetrim: muralha só do lado de terra; o lado sul é a falésia (aberto = arestas sem muro)
  { id: 'malpetrim', r: 11, pol: [[-9.6, 1.3], [-10.2, -5.5], [-7.4, -10], [0, -11], [7.4, -10], [10.6, -5], [10.8, 2.4], [6, 2.4], [0, 1.4]], tipo: 'pedra', aberto: [6, 7, 8] },
  { id: 'tiberus', r: 13.5, pol: [[-9.5, -9.5], [9.5, -9.5], [9.5, 9.5], [-9.5, 9.5]], tipo: 'pedra' },
  { id: 'nimbarann', r: 4.7, tipo: 'paliçada' },
  { id: 'porto', r: 4.8, tipo: 'aberta' },
] as Omit<Muro, 'x' | 'z'>[]).map(m => { const l = lugar(m.id); return { ...m, x: l.x, z: l.z, pol: m.pol?.map(([a, b]) => [a + l.x, b + l.z] as P) }; });
/** raio do contorno circular numa direção (um pouco irregular) */
export const raioMuro = (m: Muro, a: number) => m.r * (1 + 0.022 * Math.sin(3 * a + m.x) + 0.012 * Math.sin(7 * a + m.z));
/** distância com sinal até o contorno da cidade (positiva dentro) */
export function dentroMuro(m: Muro, x: number, z: number) {
  if (m.pol) return sdPoly(m.pol, x, z);
  return raioMuro(m, Math.atan2(z - m.z, x - m.x)) - Math.hypot(x - m.x, z - m.z);
}
/** a cidade em que o ponto está (folga > 0 = mais para dentro; < 0 inclui a vizinhança) */
export function cidadeEm(x: number, z: number, folga = 0): Muro | null {
  for (const m of MUROS) if (Math.abs(x - m.x) < m.r + 6 && Math.abs(z - m.z) < m.r + 6 && dentroMuro(m, x, z) > folga) return m;
  return null;
}
const pertoDeMuro = (x: number, z: number) => { let f = 1; for (const m of MUROS) { const d = Math.hypot(x - m.x, z - m.z); if (d < m.r + 9) f = Math.min(f, smooth(m.r + 1, m.r + 8, d)); } return f; };
/** áreas ocupadas por campos, pomares e casas fora dos muros (as árvores da natureza desviam) */
const OCUP = new Map<string, [number, number, number][]>();
export function ocupar(x: number, z: number, r: number) { for (let i = Math.floor((x - r) / 4); i <= Math.floor((x + r) / 4); i++) for (let j = Math.floor((z - r) / 4); j <= Math.floor((z + r) / 4); j++) { const k = i + ',' + j; if (!OCUP.has(k)) OCUP.set(k, []); OCUP.get(k)!.push([x, z, r]); } }
export const ocupado = (x: number, z: number) => (OCUP.get(Math.floor(x / 4) + ',' + Math.floor(z / 4)) || []).some(([a, b, r]) => Math.hypot(a - x, b - z) < r);
export const VILAS = ['vila-lom', 'vila-deh', 'vila', 'aldeia-gelo', 'pesca'];

// ---------- marcos espalhados ----------
const pts = (a: P[]) => a.map(([x, y]) => W(x, y));
export const PICOS = pts([[321, 692], [380, 604], [433, 700], [250, 640], [520, 640], [600, 700], [180, 700], [470, 600], [560, 880], [140, 800], [640, 1388], [235, 1488]]);
export const PICO_A = [20, 14, 16, 12, 12, 10, 11, 11, 9, 10, 0, 0];
export const CAVERNAS = pts([[262, 702], [350, 642], [402, 782], [500, 702], [560, 645], [152, 762], [600, 902], [470, 640], [640, 1395]]);
export const TORRES_RUINA = pts([[500, 1095], [640, 1195], [425, 1165], [600, 1240], [380, 520]]);
export const ACAMPAMENTOS = pts([[610, 1226], [520, 1128], [445, 1270]]);
export const BATALHAS = pts([[480, 1150], [592, 1212], [652, 1145]]);
export const FAROIS = pts([[702, 1386], [287, 1512], [205, 1218], [480, 1322], [344, 1330], [858, 1296]]);
export const PANTANO = (() => { const [x, z] = W(528, 1196); return { x, z, r: 11 }; })();
export const BOA_SORTE = (() => { const [x, z] = W(425, 1222); return { x, z, r: 7 }; })();
export const TAIGAS: { x: number; z: number; r: number }[] = [[530, 812, 13], [205, 812, 9], [598, 932, 9], [150, 745, 7], [455, 880, 7], [330, 820, 6]].map(([a, b, r]) => { const [x, z] = W(a, b); return { x, z, r }; });
export const MANADAS: { x: number; z: number; n: number; esp: string }[] = [
  [430, 822, 6, 'mamute'], [522, 760, 5, 'mamute'], [362, 862, 3, 'rinoceronte'], [650, 700, 9, 'bisao'], [600, 800, 6, 'bisao'],
  [705, 655, 10, 'alce'], [482, 882, 8, 'rena'], [252, 862, 6, 'rena'], [455, 858, 5, 'lobo'], [205, 742, 4, 'lobo'], [575, 610, 4, 'lobo'],
].map(([a, b, n, e]) => { const [x, z] = W(a as number, b as number); return { x, z, n: n as number, esp: e as string }; });

// ---------- estradas (terra) e trilhas da floresta ----------
const LUG = (id: string): P => { const l = lugar(id); return [l.x / ESC + 430, l.z / ESC + 1040]; };
export const ESTRADAS: P[][] = ([
  [LUG('malpetrim'), [205, 1175], [250, 1150], [300, 1150], [352, 1146], LUG('ancora'), [440, 1162], LUG('nimbarann'), [510, 1190], [546, 1196], [565, 1182], LUG('barud')],
  [LUG('barud'), [586, 1165], [589, 1140], [568, 1119], LUG('ralanda'), [530, 1060], [516, 1020], [560, 1000], [620, 1020], [700, 1002], LUG('valkaria')],
  [LUG('barud'), [586, 1165], LUG('karitania'), LUG('kurikondir'), [660, 1102], [680, 1130], [740, 1100], [780, 1050], LUG('valkaria')],
  [LUG('barud'), [565, 1182], [560, 1210], LUG('asidon'), [505, 1270], LUG('korl')],
  [LUG('nimbarann'), [462, 1250], LUG('korl')],
  [LUG('valkaria'), [750, 965], [742, 905], [740, 860], [700, 835], [650, 800], [600, 775], [520, 765], LUG('giluk')],
  [[688, 860], [740, 860], [800, 890], [845, 945], LUG('valkaria'), [810, 1070], [835, 1150]],
  [LUG('valkaria'), [780, 1050], [780, 1100], [760, 1180], LUG('porto')],
  [LUG('malpetrim'), [168, 1140], [130, 1075], [110, 1020], LUG('centauros'), [70, 900], [40, 850], [30, 760], [42, 650], [60, 590], [88, 584], LUG('tiberus')],
  [[168, 1140], [220, 1112], LUG('zolkan')], [[130, 1075], [150, 1020], LUG('azazel'), [250, 960]],
  [LUG('giluk'), [438, 660], [400, 630], LUG('catedral')], [LUG('giluk'), [306, 755], [306, 668]],
  [LUG('giluk'), [420, 820], [380, 880], [365, 905], [330, 960], [300, 1000]],
  [[45, 1080], [78, 1160], [130, 1205]], [[22, 1150], [78, 1160]],
] as P[][]).map(r => suaviza(w(r), 0.8, 1.6, pertoDeMuro));
export const TRILHAS: P[][] = ([
  [LUG('ancora'), [380, 1110], [355, 1098], LUG('eremita1'), [282, 1062], [300, 1012], [330, 960]],
  [LUG('covariel'), [420, 1068], [392, 1084], [362, 1098]],
  [LUG('eremita1'), [312, 1150], [328, 1180], LUG('eremita2'), [325, 1248], [318, 1278]],
  [[250, 1150], [272, 1120], LUG('eremita1')],
  [LUG('covariel'), [445, 1020], [420, 1000]],
] as P[][]).map(r => suaviza(w(r), 0.7, 1.4));
/** clareiras abertas na floresta (sem árvores) */
export const CLAREIRAS = [...['ancora', 'covariel', 'eremita1', 'eremita2'].map(id => { const l = lugar(id); return { x: l.x, z: l.z, r: id === 'ancora' ? 4.5 : 3.2 }; })];

// ---------- grade do relevo ----------
export interface Grade { cols: number; rows: number; passo: number; h: Float32Array; cor: Float32Array; splat: Float32Array }
export const PASSO = { baixa: 2, media: 1.5, alta: 1 }[CFG.quality];

/** distância de "terra firme": positiva em terra (afasta da costa e das bordas das ilhas) */
export function terraD(x: number, z: number) {
  let d = costaZ(x) - z;
  for (const I of ILHAS) { const di = ilhaD(I, x, z); if (di > d) d = di; }
  return d;
}

interface Campo { h: number; dl: number; mU: number; mT: number; mL: number; mD: number; mW: number; mE: number; tai: number; pan: number; cor: number; cal: number; plat: number }
const C: Campo = { h: 0, dl: 0, mU: 0, mT: 0, mL: 0, mD: 0, mW: 0, mE: 0, tai: 0, pan: 0, cor: 0, cal: 0, plat: 0 };
const [MPX, MPZ] = W(165, 1194), [VMX, VMZ] = W(118, 1214), [KBX, KBZ] = W(133, 910), [BRX, BRZ] = W(565, 1158), [VKX, VKZ] = W(790, 990);
/** altura e máscaras de bioma num ponto (antes do entalhe dos rios) */
export function campo(x: number, z: number): Campo {
  const dl = terraD(x, z); C.dl = dl;
  const dU = sdPoly(UIVANTES, x, z, BB.U), dT = sdPoly(TOLLON, x, z, BB.T), dL = sdPoly(LOMATUBAR, x, z, BB.L), dD = sdPoly(DEHEON, x, z, BB.D), dE = sdPoly(ESTEPE, x, z, BB.E);
  const mU = smooth(-5, 14, dU), mT = smooth(-5, 7, dT), mL = smooth(-6, 9, dL), mD = smooth(-6, 9, dD) * (1 - mU), mE = smooth(-4, 8, dE);
  const mW = (1 - mU) * (1 - mT) * smooth(-82, -104, x) * smooth(3, 22, dl);
  C.mU = mU; C.mT = mT; C.mL = mL; C.mD = mD; C.mW = mW; C.mE = mE; C.tai = 0; C.pan = 0; C.cor = 0; C.cal = 0; C.plat = 0;
  if (dl < 0) { // mar: plataforma rasa perto da costa e fundo escuro longe
    C.h = -0.35 - 3.2 * smooth(0, 30, -dl) - 1.4 * fbm(x * 0.04, z * 0.04, 3) * smooth(2, 20, -dl);
    // Velha Malpetrim: baixio alagado (ruínas meio submersas)
    const dv = Math.hypot(x - VMX, z - VMZ); if (dv < 13) C.h = lerp(C.h, -0.18 + 0.3 * noise2(x * 0.8, z * 0.8), smooth(13, 7, dv));
    return C;
  }
  let h = 0.3 + 1.6 * smooth(0, 18, dl) + (fbm(x * 0.02, z * 0.02, 4) - 0.45) * 3 * smooth(2, 20, dl);
  // Deheon: colinas marrons e campos; Lomatubar: planícies douradas; Tollon: ondulado suave
  if (mD > 0) h = lerp(h, 1.4 + 3.4 * fbm(x * 0.022 + 5, z * 0.022, 4) + Math.max(0, fbm(x * 0.045, z * 0.045, 3) - 0.5) * 8, mD);
  if (mL > 0) h = lerp(h, 1.1 + 1.6 * fbm(x * 0.03, z * 0.03, 3) + Math.max(0, fbm(x * 0.06 + 3, z * 0.06, 3) - 0.56) * 7, mL * 0.85);
  if (mT > 0) h = lerp(h, 1.5 + 1.8 * fbm(x * 0.04, z * 0.04, 3), mT * 0.8);
  // oeste: colinas acidentadas descendo até a faixa da costa
  if (mW > 0) h += mW * (1.2 + 6.5 * ridged(x * 0.05 + 2, z * 0.05, 4));
  // ilhas: relevo próprio (a grande do sudeste é montanhosa)
  for (const I of ILHAS) { const di = ilhaD(I, x, z); if (di > 0) { const k = clamp(di / Math.min(I.rx, I.rz)); h += I.h * Math.pow(k, 0.8) * (0.55 + 0.7 * ridged(x * 0.07 + I.s * 3, z * 0.07, 4)); } }
  // Tapista (noroeste) e o norte além das Uivantes
  const mTp = (1 - mU) * smooth(-226, -246, z); if (mTp > 0) h += mTp * (1.5 + 4 * fbm(x * 0.04, z * 0.04, 3));
  // Uivantes: anel externo de picos serrilhados, planalto de tundra no centro
  if (mU > 0) {
    const r = ridged(x * 0.036 + 11, z * 0.036 - 7, 5), r2 = ridged(x * 0.09 + 3, z * 0.09, 3), ring = Math.exp(-(((dU - 11) / 11) ** 2)), inner = smooth(14, 34, dU);
    const tundra = smooth(0.5, 0.64, fbm(x * 0.013 + 40, z * 0.013, 3)) * inner; // bacias planas de tundra no centro
    let hm = 7 + ring * (9 + 30 * Math.pow(r, 1.35)) + (1 - ring) * (4 + 20 * Math.pow(r, 1.25)) + 3.2 * r2 * (ring + 0.5);
    hm = lerp(hm, 7.5 + 2.2 * fbm(x * 0.05, z * 0.05, 3), tundra * 0.85);
    hm = lerp(hm, 4.5 + 2 * fbm(x * 0.05, z * 0.05, 2), mE * 0.85); // estepe gelada (nordeste): baixa e lisa
    h = lerp(h, hm, mU);
    for (const t of TAIGAS) { const d = Math.hypot(x - t.x, z - t.z); if (d < t.r * 1.6) { const k = smooth(t.r * 1.6, t.r * 0.5, d); h = lerp(h, Math.min(h, 5.2 + fbm(x * 0.1, z * 0.1, 2) * 1.5), k * 0.8); C.tai = Math.max(C.tai, k); } }
  }
  for (let i = 0; i < PICOS.length; i++) { const A = PICO_A[i]; if (!A) continue; const d = Math.hypot(x - PICOS[i][0], z - PICOS[i][1]); h += A * Math.exp(-((d / (A * 0.75)) ** 2)) * mU * (0.75 + 0.5 * ridged(x * 0.12, z * 0.12, 2)); }
  // Planalto dos Kobolds: mesa de topo plano e encostas íngremes
  { const d = Math.hypot(x - KBX, z - KBZ), r = 9 + 2 * noise2(Math.atan2(z - KBZ, x - KBX) * 2, 3); if (d < r + 5) { const k = smooth(r + 4, r, d); h = lerp(h, Math.max(h, 9.5 + 0.5 * noise2(x * 0.5, z * 0.5)), k); C.plat = k; } }
  // Nova Malpetrim: falésia de calcário sobre o mar
  { const d = Math.hypot(x - MPX, z - MPZ); if (d < 20) { const k = smooth(20, 11, d); h = lerp(h, Math.max(h, 4.6 * smooth(-0.2, 1.4, dl) + 0.6 * fbm(x * 0.2, z * 0.2, 2)), k); C.cal = k * smooth(-1, 3.5, dl) * (1 - smooth(4, 9, dl)); } }
  // Velha Malpetrim: baixada alagada
  { const d = Math.hypot(x - VMX, z - VMZ); if (d < 13) h = lerp(h, -0.18 + 0.32 * noise2(x * 0.8, z * 0.8), smooth(13, 7, d)); }
  // colina da fortaleza de Barud; chão plano de Valkaria
  { const d = Math.hypot(x - BRX, z - BRZ); h += 2.4 * Math.exp(-((d / 4.5) ** 2)); }
  { const d = Math.hypot(x - VKX, z - VKZ); if (d < 22) h = lerp(h, 2.1 + 0.3 * fbm(x * 0.2, z * 0.2, 2), smooth(22, 14, d)); }
  // pântano cinzento perto de Barud
  { const d = Math.hypot(x - PANTANO.x, z - PANTANO.z); if (d < PANTANO.r * 1.4) { const k = smooth(PANTANO.r * 1.4, PANTANO.r * 0.6, d); h = lerp(h, 0.9 + 0.35 * noise2(x * 0.6, z * 0.6), k); C.pan = k; } }
  // coral da Praga: manchas rosa-alaranjadas em volta de Barud e na margem do rio
  if (mL > 0.3) C.cor = smooth(0.62, 0.78, fbm(x * 0.09 + 40, z * 0.09, 3)) * smooth(30, 8, Math.hypot(x - BRX, z - BRZ));
  // lago de montanha: bacia
  { const e = Math.hypot((x - LAGO.x) / LAGO.rx, (z - LAGO.z) / LAGO.rz);
    if (e < 1) h = LAGO.nivel - 0.8 - (1 - e) * 1.2; else if (e < 2.2) h = lerp(h, Math.max(h, LAGO.nivel + 0.3 + (e - 1) * 2), smooth(2.2, 1.2, e)); }
  // bordas do mapa: desce suave até a moldura
  const db = Math.min(x - LIM.x0, LIM.x1 - x, z - LIM.z0, LIM.z1 - z); if (db < 12) h = lerp(1.0, h, smooth(0, 12, db));
  C.h = h;
  return C;
}

/** perfis dos rios (altura da água, descendo sempre) — calculados junto com a grade */
export const PERFIS: { pts: P[]; y: number[]; larg: number[] }[] = [];

export let G: Grade;
/** monta a grade inteira: alturas, entalhe dos rios, cores por bioma e máscara de rocha/neve */
export function construirGrade(): Grade {
  const passo = PASSO, cols = Math.round((LIM.x1 - LIM.x0) / passo) + 1, rows = Math.round((LIM.z1 - LIM.z0) / passo) + 1, n = cols * rows;
  const h = new Float32Array(n), dl = new Float32Array(n), mk = new Float32Array(n * 11);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, c = campo(LIM.x0 + i * passo, LIM.z0 + j * passo);
    h[k] = c.h; dl[k] = c.dl;
    const o = k * 11; mk[o] = c.mU; mk[o + 1] = c.mT; mk[o + 2] = c.mL; mk[o + 3] = c.mD; mk[o + 4] = c.mW; mk[o + 5] = c.mE; mk[o + 6] = c.tai; mk[o + 7] = c.pan; mk[o + 8] = c.cor; mk[o + 9] = c.cal; mk[o + 10] = c.plat;
  }
  G = { cols, rows, passo, h, cor: new Float32Array(n * 3), splat: new Float32Array(n * 2) };
  // chão mais plano onde há povoados (Giluk fica em terraços subindo para o norte)
  const RAIO: Record<string, number> = { valkaria: 22, tiberus: 15, giluk: 13, barud: 9, nimbarann: 7, asidon: 5, centauros: 6, porto: 5, pesca: 4 };
  for (const L of LUGARES) {
    if (['nada', 'beluhga', 'catedral', 'caverna', 'gelo-antigo', 'kobolds', 'malpetrim', 'velha-malpetrim'].includes(L.tipo)) continue;
    const r = RAIO[L.id] ?? RAIO[L.tipo] ?? 4.5, R2 = r + 4, i0 = Math.max(0, Math.floor((L.x - R2 - LIM.x0) / passo)), i1 = Math.min(cols - 1, Math.ceil((L.x + R2 - LIM.x0) / passo)), j0 = Math.max(0, Math.floor((L.z - R2 - LIM.z0) / passo)), j1 = Math.min(rows - 1, Math.ceil((L.z + R2 - LIM.z0) / passo));
    let soma = 0, qt = 0;
    for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) { const d = Math.hypot(LIM.x0 + ii * passo - L.x, LIM.z0 + jj * passo - L.z); if (d < r && h[jj * cols + ii] > 0) { soma += h[jj * cols + ii]; qt++; } }
    if (!qt) continue; const media = soma / qt;
    for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) {
      const x = LIM.x0 + ii * passo, z = LIM.z0 + jj * passo, d = Math.hypot(x - L.x, z - L.z), k = jj * cols + ii; if (d > R2 || h[k] <= 0.05) continue;
      const alvo = L.tipo === 'giluk' ? media + (L.z - z) * 0.32 + 0.6 : media;
      h[k] = lerp(h[k], alvo, smooth(R2, r * 0.7, d) * (L.tipo === 'giluk' ? 0.8 : 0.85));
    }
  }
  // rios: perfil sempre descendo e leito entalhado na grade
  PERFIS.length = 0;
  for (let r = 0; r < RIOS.length; r++) {
    const R = RIOS[r], y: number[] = [], larg: number[] = []; let ult = 99;
    R.forEach(([x, z], i) => { const g = Y(x, z); ult = Math.max(r === RIOS.length - 1 ? LAGO.nivel : 0.12, Math.min(ult, g - 0.05)); y.push(ult); larg.push(0.45 + 0.9 * (i / R.length)); });
    PERFIS.push({ pts: R, y, larg });
    R.forEach(([x, z], i) => {
      const wk = larg[i], raio = wk + 2.2, i0 = Math.floor((x - raio - LIM.x0) / passo), i1 = Math.ceil((x + raio - LIM.x0) / passo), j0 = Math.floor((z - raio - LIM.z0) / passo), j1 = Math.ceil((z + raio - LIM.z0) / passo);
      for (let jj = Math.max(0, j0); jj <= Math.min(rows - 1, j1); jj++) for (let ii = Math.max(0, i0); ii <= Math.min(cols - 1, i1); ii++) {
        const k = jj * cols + ii, d = Math.hypot(LIM.x0 + ii * passo - x, LIM.z0 + jj * passo - z); if (d > raio) continue;
        h[k] = Math.min(h[k], lerp(y[i] - 0.5, h[k], smooth(wk * 0.55, raio, d)));
      }
    });
  }
  // cores e máscara (rocha = encosta íngreme; neve = Uivantes)
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, x = LIM.x0 + i * passo, z = LIM.z0 + j * passo, o = k * 11, hh = h[k];
    const gx = (h[j * cols + Math.min(cols - 1, i + 1)] - h[j * cols + Math.max(0, i - 1)]) / (2 * passo), gz = (h[Math.min(rows - 1, j + 1) * cols + i] - h[Math.max(0, j - 1) * cols + i]) / (2 * passo);
    const inc = 1 - 1 / Math.sqrt(1 + gx * gx + gz * gz); // 0 plano … 1 vertical
    const mU = mk[o], mT = mk[o + 1], mL = mk[o + 2], mD = mk[o + 3], mW = mk[o + 4], mE = mk[o + 5], tai = mk[o + 6], pan = mk[o + 7], cor = mk[o + 8], cal = mk[o + 9], plat = mk[o + 10];
    const aq = fbm(x * 0.03 + 17, z * 0.03, 3), mancha = 0.88 + 0.26 * aq; // manchas de aquarela
    let urb = 0;
    let r = 0.85, g = 0.95, b = 0.62; // campo genérico
    const dlk = dl[k];
    if (dlk < 0 || hh < 0.05) { r = 0.55; g = 0.6; b = 0.5; } // fundo do mar (aparece pouco)
    else {
      const praia = smooth(2.2, 0.3, dlk) * (1 - cal);
      // Deheon: retalhos de lavoura
      if (mD > 0.01) {
        const a = 0.35, u = x * Math.cos(a) - z * Math.sin(a), v = x * Math.sin(a) + z * Math.cos(a), ci = Math.floor(u / 6.5), cj = Math.floor(v / 4.2);
        const hs = Math.abs(Math.sin(ci * 127.1 + cj * 311.7) * 43758.5) % 1, borda = Math.min(Math.abs(u / 6.5 - ci - 0.5), Math.abs(v / 4.2 - cj - 0.5));
        const pal = hs < 0.3 ? [1.6, 1.22, 0.4] : hs < 0.55 ? [0.66, 1.0, 0.42] : hs < 0.75 ? [1.0, 0.66, 0.4] : hs < 0.9 ? [1.25, 1.15, 0.7] : [0.5, 0.78, 0.36];
        const morro = smooth(4.2, 7, hh), sebe = smooth(0.42, 0.5, borda) * 0.35;
        const fr = lerp(pal[0], 1.0, morro) * (1 - sebe), fg = lerp(pal[1], 0.78, morro) * (1 - sebe * 0.6), fb = lerp(pal[2], 0.5, morro) * (1 - sebe);
        r = lerp(r, fr, mD); g = lerp(g, fg, mD); b = lerp(b, fb, mD);
      }
      if (mL > 0.01) { r = lerp(r, 1.62, mL); g = lerp(g, 1.2 + 0.1 * aq, mL); b = lerp(b, 0.34, mL); }       // dourado
      if (mT > 0.01) { r = lerp(r, 0.42, mT); g = lerp(g, 0.58, mT); b = lerp(b, 0.36, mT); }               // chão da mata
      if (mW > 0.01) { r = lerp(r, 0.98, mW * 0.7); g = lerp(g, 0.92, mW * 0.7); b = lerp(b, 0.6, mW * 0.7); } // colinas secas do oeste
      if (mE > 0.01) { r = lerp(r, 1.15, mE); g = lerp(g, 1.12, mE); b = lerp(b, 0.76, mE); }               // estepe pálida
      if (tai > 0.01) { r = lerp(r, 0.4, tai); g = lerp(g, 0.55, tai); b = lerp(b, 0.36, tai); }
      if (pan > 0.01) { r = lerp(r, 0.48, pan); g = lerp(g, 0.5, pan); b = lerp(b, 0.32, pan); }
      if (cor > 0.01) { r = lerp(r, 1.55, cor * 0.8); g = lerp(g, 0.78, cor * 0.8); b = lerp(b, 0.62, cor * 0.8); }
      if (plat > 0.01) { r = lerp(r, 1.1, plat); g = lerp(g, 0.86, plat); b = lerp(b, 0.6, plat); }
      if (praia > 0.01) { r = lerp(r, 1.45, praia); g = lerp(g, 1.32, praia); b = lerp(b, 1.0, praia); }
      r *= mancha; g *= mancha; b *= mancha * 0.98;
      // chão de terra batida nas cidades e em volta das vilas
      const mu = cidadeEm(x, z, -1.4); if (mu) urb = smooth(-1.4, 0.9, dentroMuro(mu, x, z)) * 0.88;
      for (const l of LUGARES) if (VILAS.includes(l.tipo) && Math.abs(l.x - x) < 4 && Math.abs(l.z - z) < 4) urb = Math.max(urb, smooth(2.6 * (l.tam ?? 1), 0.8, Math.hypot(l.x - x, l.z - z)) * 0.5);
      if (urb > 0) { r = lerp(r, 0.86, urb); g = lerp(g, 0.76, urb); b = lerp(b, 0.6, urb); }
    }
    // máscara de rocha e neve
    let R = (1 - urb) * (smooth(0.18, 0.42, inc) + mU * smooth(15, 24, hh) * 0.35 + plat * smooth(0.06, 0.2, inc) + cal);
    let N = mU * (1 - 0.45 * smooth(14, 34, sdPolyCache(x, z))) * (1 - 0.8 * smooth(0.3, 0.6, inc)) * (1 - 0.75 * tai) * (1 - 0.7 * mE);
    if (dlk < 0.6) N *= smooth(0.1, 0.6, dlk);
    N *= 1 - urb * 0.5; // neve pisada nas ruas
    R = clamp(R); N = clamp(N * 1.15);
    const lagoE = Math.hypot((x - LAGO.x) / LAGO.rx, (z - LAGO.z) / LAGO.rz); if (lagoE < 1.1) N = Math.max(N, 0.8);
    // tinta das camadas: rocha fria nas Uivantes, calcário claro em Malpetrim; neve branco-azulada
    const rr = cal > 0.3 ? 1.32 : lerp(1.0, 0.8, mU), rg = cal > 0.3 ? 1.3 : lerp(0.84, 0.84, mU), rb = cal > 0.3 ? 1.24 : lerp(0.64, 0.95, mU);
    const wB = Math.max(0, 1 - R - N);
    G.cor[k * 3] = r * wB + rr * R + 1.32 * N; G.cor[k * 3 + 1] = g * wB + rg * R + 1.36 * N; G.cor[k * 3 + 2] = b * wB + rb * R + 1.46 * N;
    G.splat[k * 2] = R; G.splat[k * 2 + 1] = N;
  }
  sombrearRelevo(G, dl);
  return G;
}
/** média num quadrado de raio r células (soma acumulada por linha e por coluna) */
function borrar(src: Float32Array, cols: number, rows: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let j = 0; j < rows; j++) { let s = 0; const o = j * cols; for (let i = -r; i <= r; i++) s += src[o + Math.min(cols - 1, Math.max(0, i))]; for (let i = 0; i < cols; i++) { tmp[o + i] = s / (2 * r + 1); s += src[o + Math.min(cols - 1, i + r + 1)] - src[o + Math.max(0, i - r)]; } }
  for (let i = 0; i < cols; i++) { let s = 0; for (let j = -r; j <= r; j++) s += tmp[Math.min(rows - 1, Math.max(0, j)) * cols + i]; for (let j = 0; j < rows; j++) { out[j * cols + i] = s / (2 * r + 1); s += tmp[Math.min(rows - 1, j + r + 1) * cols + i] - tmp[Math.max(0, j - r) * cols + i]; } }
  return out;
}
/** relevo legível com qualquer clima: sombreado de mapa (luz de noroeste), escuro nos vales, claro nas cristas e
 *  faixas de estrato na rocha — gravado na cor de vértice (não custa nada por quadro) */
function sombrearRelevo(g: Grade, dl: Float32Array) {
  const { cols, rows, passo, h, cor, splat } = g, media = borrar(h, cols, rows, Math.max(2, Math.round(4 / passo))), largo = borrar(h, cols, rows, Math.max(4, Math.round(12 / passo)));
  const Lx = -0.55, Ly = 0.72, Lz = -0.42, Ln = Math.hypot(Lx, Ly, Lz);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i; if (dl[k] < -0.5) continue;
    const gx = (h[j * cols + Math.min(cols - 1, i + 1)] - h[j * cols + Math.max(0, i - 1)]) / (2 * passo), gz = (h[Math.min(rows - 1, j + 1) * cols + i] - h[Math.max(0, j - 1) * cols + i]) / (2 * passo);
    const nl = Math.hypot(gx, 1, gz), lam = (-gx * Lx + Ly - gz * Lz) / (nl * Ln), sombra = clamp(lam / (Ly / Ln), 0.4, 1.4);
    const cav = h[k] - media[k], vale = h[k] - largo[k];
    let f = lerp(1, sombra, 0.55) * clamp(1 + cav * 0.14, 0.72, 1.14) * clamp(1 + vale * 0.025, 0.85, 1.08);
    const R = splat[k * 2]; if (R > 0.2) f *= 1 + (Math.sin(h[k] * 2.6 + noise2(i * 0.15, j * 0.15) * 4) * 0.09) * R;
    cor[k * 3] *= f; cor[k * 3 + 1] *= f; cor[k * 3 + 2] *= f * (sombra < 1 ? 1 + (1 - sombra) * 0.12 : 1); // sombras frias
  }
}
// distância ao contorno das Uivantes (neve rala no planalto central): reaproveita sdPoly com a caixa
const sdPolyCache = (x: number, z: number) => sdPoly(UIVANTES, x, z, BB.U);

/** altura do relevo (igual aos triângulos da malha) */
export function Y(x: number, z: number) {
  const g = G; if (!g) return 0;
  const fx = (x - LIM.x0) / g.passo, fz = (z - LIM.z0) / g.passo;
  const i = Math.max(0, Math.min(g.cols - 2, Math.floor(fx))), j = Math.max(0, Math.min(g.rows - 2, Math.floor(fz)));
  const u = clamp(fx - i), v = clamp(fz - j), a = g.h[j * g.cols + i], b = g.h[j * g.cols + i + 1], c = g.h[(j + 1) * g.cols + i], d = g.h[(j + 1) * g.cols + i + 1];
  return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
}
/** chão para pôr coisas: nunca abaixo do nível do mar */
export const Ysolo = (x: number, z: number) => Math.max(0.02, Y(x, z));
