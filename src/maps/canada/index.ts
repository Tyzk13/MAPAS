// Mapa: Greywater Falls, Ontário — novembro de 1975. Cidade de fábrica de papel, triste e cinzenta: Main Street
// de tijolo, Hotel Laurentian (3 andares por dentro), necrotério do distrito, igreja e cemitério,
// rio escuro com represa, ponte de treliça, estação. Caso: William Ashdown e Margaret (docs/casos/greywater-caso-ashdown.md).
import * as THREE from 'three';
import type { MapRuntime, View } from '../../core/types';
import { begin, mistTex } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { Builder } from '../texas/buildings';
import { buildNature, setBuilt, groundH } from './nature';
import { buildHotel, CELLAR } from './hotel';
import { buildMorgue } from './morgue';
import { buildLandmarks } from './landmarks';
import { buildCasas, CASA_EVA, CASA_MOREAU, DENTRO } from './casas';
import { moradores, buildRetratos } from './npcs';
import { PISTAS, NOTAS } from './pistas';
import { Q, rnd, reseed, sm, LREQ, ROW0, ROWD, KING, QUEEN, ELM, BIRCH, MAPLE, SPRUCE, CEDAR, EXT, RIVER, riverZ, RAIL, STATION, HOTEL, MORGUE, CHURCH, CEMETERY, MILL, GAS, DINER } from './common';
import type { Xf } from '../../core/models';

const P = (x: number, y: number, z: number) => [x, y, z] as [number, number, number];
export const VIEWS: View[] = [
  // a 1ª vista é a inicial: o hotel, onde os agentes se hospedam
  { n: 'Hotel Laurentian', p: P(-6.5, 1.8, -51), t: P(16, 5.5, -24), fov: 55 },
  { n: 'Estação (chegada)', p: P(6, 1.75, 139.6), t: P(30, 2.2, 135.5), fov: 58 },
  { n: 'Main Street', p: P(2.5, 1.8, 62), t: P(0, 4, -40), fov: 52 },
  { n: 'Saguão', p: P(11.6, 1.9, -13.6), t: P(19.3, 1.5, -17.5), fov: 64 },
  { n: 'Recepção (livro)', p: P(17.7, 1.95, -16.9), t: P(19.0, 1.15, -16.6), fov: 58 },
  { n: 'Beverage room', p: P(11.6, 1.8, -12.2), t: P(20, 1.3, -7.5), fov: 64 },
  { n: 'Sala de jantar', p: P(11.6, 1.8, -24.6), t: P(20, 1.0, -30), fov: 64 },
  { n: 'Escritório do gerente', p: P(23.2, 1.8, -26.4), t: P(26.2, 1.0, -29.3), fov: 62 },
  { n: 'Escadaria', p: P(22.3, 1.8, -20.5), t: P(29, 4.2, -23.3), fov: 64 },
  { n: '2º andar · corredor', p: P(20.5, 6.05, -7.4), t: P(20.5, 5.8, -30), fov: 60 },
  { n: 'Quarto 204 (Dr. Finch)', p: P(19.0, 6.05, -11.9), t: P(12, 4.9, -8.2), fov: 64 },
  { n: 'Quarto 202 (agentes)', p: P(19.0, 6.05, -24.9), t: P(12.5, 4.9, -21.5), fov: 64 },
  { n: '3º andar · corredor', p: P(20.5, 9.65, -30), t: P(20.5, 9.4, -7), fov: 60 },
  { n: 'Quarto 304 (William)', p: P(19.0, 9.7, -11.9), t: P(12.6, 8.8, -7.6), fov: 66 },
  { n: 'Fotos de Margaret (304)', p: P(16.4, 9.65, -8.7), t: P(19.4, 9.6, -8.7), fov: 60 },
  { n: 'Espelho (304)', p: P(17.1, 9.55, -8.3), t: P(17.1, 9.35, -6.4), fov: 60 },
  { n: 'Quarto 307 (trancado)', p: P(29.2, 9.7, -7.4), t: P(22, 9.0, -10.2), fov: 66 },
  { n: 'Quarto 303 (Sra. Doucette)', p: P(19.0, 9.7, -18.4), t: P(12.5, 8.6, -16), fov: 64 },
  { n: 'Escada do porão', p: P(22.3, 1.9, -9.2), t: P(27.6, -2.4, -7), fov: 64 },
  { n: 'Porão do hotel', p: P(23.7, -0.95, -17), t: P(29.2, -1.9, -9.0), fov: 68 },
  { n: 'Telhado do hotel', p: P(15, 13.6, -37), t: P(24, 11.2, -18), fov: 58 },
  { n: 'Necrotério', p: P(-27.5, 1.75, 23.0), t: P(-35, 2.2, 40), fov: 56 },
  { n: 'Necrotério · recepção', p: P(-37.2, 2.0, 39.0), t: P(-40.2, 1.3, 41), fov: 64 },
  { n: 'Gabinete do legista', p: P(-34.6, 2.0, 43.3), t: P(-30, 1.2, 40.6), fov: 64 },
  { n: 'Autópsia', p: P(-35.2, 2.0, 47.0), t: P(-41, 1.0, 50.5), fov: 64 },
  { n: 'Câmara fria', p: P(-32.8, 2.0, 46.8), t: P(-26.4, 1.6, 50.8), fov: 64 },
  { n: 'Igreja', p: P(-85, 1.8, -38.5), t: P(-96, 8, -58), fov: 58 },
  { n: 'Cemitério', p: P(-105.6, 1.7, -52.6), t: P(-111, 0.6, -60.5), fov: 62 },
  { n: 'Ponte', p: P(5, 1.8, -96), t: P(0, 3, -128), fov: 58 },
  { n: 'Fábrica de papel', p: P(-8, 3.5, -104), t: P(42, 14, -176), fov: 55 },
  { n: 'Cataratas', p: P(-14, 1.6, -110), t: P(-30, -2.2, -129), fov: 56 },
  { n: 'Lanchonete', p: P(84, 1.7, 29), t: P(90, 2.2, 38), fov: 58 },
  { n: 'Lanchonete · por dentro', p: P(84.0, 1.7, 39.0), t: P(94, 1.0, 43), fov: 66 },
  { n: 'Fábrica · salão', p: P(62, 2.0, -165), t: P(38, 2.5, -184), fov: 64 },
  { n: 'Fábrica · relógio de ponto', p: P(59.4, 1.7, -165.0), t: P(59.4, 1.6, -162.4), fov: 62 },
  { n: 'Fábrica · escritório do capataz', p: P(67.0, 1.75, -170.0), t: P(71, 0.9, -164.6), fov: 66 },
  { n: 'Casa de Eva Pelletier', p: P(-76.0, 1.9, -4.8), t: P(-72.2, 1.2, -10.3), fov: 68 },
  { n: 'Casa dos Moreau', p: P(76.0, 1.9, 51.0), t: P(73.2, 0.9, 46), fov: 68 },
  { n: 'Retrato de Margaret (saguão)', p: P(13.5, 1.8, -21.6), t: P(13.5, 2.1, -24.9), fov: 55 },
  { n: 'Personagens', p: P(-6, 2.2, -44), t: P(14, 1.6, -16), fov: 60 },
  { n: 'Resumo do caso', p: P(-40, 60, 120), t: P(10, 0, -20), fov: 50 },
  { n: 'Geral', p: P(70, 85, 170), t: P(0, 0, 0) },
  { n: 'Tática', p: P(0, 210, 0.1), t: P(0, 0, 0) },
];

export async function build(M: MapRuntime) {
  begin(M, 65); reseed(65); LREQ.length = 0;
  const G = M.G, b = new Builder(G);
  const inR = (x: number, z: number, x0: number, x1: number, z0: number, z1: number, mm = 0) => x > x0 - mm && x < x1 + mm && z > z0 - mm && z < z1 + mm;
  const NORTH0 = riverZ(0) + RIVER.w / 2 + 7; // início da Main St, logo depois da ponte
  setBuilt((x, z) => {
    const d = Math.max(0, Math.abs(x) - (EXT + 12), z - (RAIL + 14), (RIVER.z + 16) - z);
    const mill = Math.max(0, Math.max(MILL.x0 - 14 - x, x - MILL.x1 - 14, MILL.z0 - 10 - z, z - MILL.z1 - 30));
    return Math.max(1 - sm(0, 30, d), 1 - sm(0, 18, mill));
  });

  // ---------- ruas ----------
  const SOUTH = STATION.z0 - 2, len = SOUTH - NORTH0;
  b.road(0, (NORTH0 + SOUTH) / 2, 'z', len, 14, true, 0.034);
  b.road(0, (riverZ(0) - RIVER.w / 2 - 7 + MILL.z1 + 14) / 2, 'z', Math.abs(MILL.z1 + 14 - (riverZ(0) - RIVER.w / 2 - 7)), 9, true, 0.034);
  [KING, QUEEN].forEach(z => b.road(0, z, 'x', 2 * EXT, 10, true, 0.036));
  [ELM, BIRCH, CEDAR].forEach(x => b.road(x, 12, 'z', 210, 9, true, 0.04));
  b.road(-CEDAR, 40.5, 'z', 153, 9, true, 0.04); // a oeste, a rua para antes da igreja
  [MAPLE, SPRUCE].forEach(z => [[-EXT, -ROW0 - ROWD - 1], [ROW0 + ROWD + 1, EXT]].forEach(([a, c]) => b.road((a + c) / 2, z, 'x', c - a, 9, true, 0.038)));
  b.road(STATION.x0 - 8, (QUEEN + SOUTH) / 2 + 40, 'z', 80, 7, false, 0.04);
  // calçadas da Main St entre as ruas transversais
  [[NORTH0, KING - 5], [KING + 5, QUEEN - 5], [QUEEN + 5, SOUTH]].forEach(([a, c]) => [-1, 1].forEach(s => b.walk(s * (7 + 1.75), (a + c) / 2, 3.5, c - a)));
  [KING, QUEEN].forEach(z => [-1, 1].forEach(s => [[-EXT, -10.5], [10.5, EXT]].forEach(([a, c]) => b.walk((a + c) / 2, z + s * 6.5, c - a, 3))));

  // ---------- lojas de tijolo na Main St ----------
  const names = ['ASHDOWN & SON · TAILORS', 'BANK OF GREYWATER', 'CAPITOL', 'CENTRAL DRUGS', 'HARDWARE · QUINCAILLERIE', 'BARBER', 'BAKERY · BOULANGERIE', 'POST OFFICE · BUREAU DE POSTE', 'THE GREYWATER EXAMINER', 'GAUTHIER & FILS · FUNERAL HOME', 'FIVE & TEN', 'MEN\'S WEAR', 'GROCERY · ÉPICERIE', 'SHOE REPAIR', 'FOR RENT · À LOUER', 'LEGION HALL', 'JEWELLER · WATCHES', 'TAVERN'];
  const sc: Record<string, [string, string]> = { 'ASHDOWN & SON · TAILORS': ['#2a2a2a', '#c8b890'], 'GAUTHIER & FILS · FUNERAL HOME': ['#1a1a1e', '#d8d0b8'], 'BANK OF GREYWATER': ['#e8e0cc', '#2a3a2a'], 'CAPITOL': ['#1a1a1a', '#e8c060'] };
  let ni = 0;
  const fill = (c: number, ry: number, from: number, to: number) => {
    let t = from;
    while (to - t > 4) {
      let w = 7 + rnd() * 4; if (to - t - w < 5) w = to - t;
      const name = names[ni++ % names.length], z = t + w / 2;
      b.store(c, z, ry, { w, d: ROWD, name, brick: true, two: name === 'CAPITOL' || rnd() < 0.7, h: undefined, porch: rnd() < 0.5 ? 'awning' : 'none', signCol: sc[name], dark: name.startsWith('ASHDOWN') || name.startsWith('FOR RENT'), lit: 0.45 });
      t += w;
    }
  };
  fill(-ROW0, Math.PI / 2, NORTH0 + 4, KING - 6); fill(-ROW0, Math.PI / 2, KING + 6, QUEEN - 6); fill(-ROW0, Math.PI / 2, QUEEN + 6, QUEEN + 70);
  fill(ROW0, -Math.PI / 2, NORTH0 + 4, KING - 6); fill(ROW0, -Math.PI / 2, HOTEL.z1 + 0.5, QUEEN - 6); fill(ROW0, -Math.PI / 2, QUEEN + 6, QUEEN + 70);

  // ---------- casas de madeira ----------
  const busy = (x: number, z: number) =>
    inR(x, z, -ROW0 - ROWD - 3, ROW0 + ROWD + 3, NORTH0, QUEEN + 73) || inR(x, z, HOTEL.x0, HOTEL.x1, HOTEL.z0, HOTEL.z1, 8) || inR(x, z, MORGUE.x0, MORGUE.x1, MORGUE.z0, MORGUE.z1, 14) ||
    Math.hypot(x - CASA_EVA.x, z - CASA_EVA.z) < 13 || Math.hypot(x - CASA_MOREAU.x, z - CASA_MOREAU.z) < 13 ||
    inR(x, z, CHURCH.x - 12, CHURCH.x + 12, CHURCH.z - 14, CHURCH.z + 20) || inR(x, z, CEMETERY.x0, CEMETERY.x1, CEMETERY.z0, CEMETERY.z1, 6) ||
    inR(x, z, GAS.x - 10, DINER.x1 + 4, QUEEN + 5, DINER.z1 + 6) || inR(x, z, STATION.x0 - 14, STATION.x1 + 4, STATION.z0 - 8, RAIL + 4) || Math.abs(x) < 9;
  const streetTrees: Xf[] = [];
  const lot = (x: number, z: number, ry: number) => { if (busy(x, z)) return; b.house(x, z, ry, { w: 8 + rnd() * 3, d: 8 + rnd() * 2, ruin: rnd() < 0.06, two: rnd() < 0.4, lit: 0.25 }); if (rnd() < 0.6) { const p = new THREE.Vector3(rnd() * 6 - 3, 0, 9).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); streetTrees.push({ x: x + p.x, y: groundH(x + p.x, z + p.z) - 0.2, z: z + p.z, ry: rnd() * 6, s: 0.9 + rnd() * 0.4 }); } };
  const XS = [ELM, BIRCH, -CEDAR, CEDAR], ZS = [KING, QUEEN, MAPLE, SPRUCE];
  XS.forEach(xs => { for (let z = -96; z <= 112; z += 15 + rnd() * 3) { if (ZS.some(zz => Math.abs(z - zz) < 10)) continue; lot(xs + 11.5, z, -Math.PI / 2); lot(xs - 11.5, z, Math.PI / 2); } });
  ZS.forEach(zs => { for (let x = -EXT + 8; x <= EXT - 8; x += 15 + rnd() * 3) { if (XS.some(xx => Math.abs(x - xx) < 18)) continue; lot(x, zs - 13, 0); lot(x, zs + 13, Math.PI); } });
  // árvores peladas nas calçadas das ruas residenciais
  XS.forEach(xs => { for (let z = -94; z <= 114; z += 11 + rnd() * 4) [-1, 1].forEach(sd => { const x = xs + sd * 6.2; if (!ZS.some(zz => Math.abs(z - zz) < 8) && !busy(x, z) && rnd() < 0.7) streetTrees.push({ x, y: groundH(x, z) - 0.2, z, ry: rnd() * 6, s: 0.8 + rnd() * 0.3 }); }); });
  ZS.forEach(zs => { for (let x = -EXT + 4; x <= EXT - 4; x += 11 + rnd() * 4) [-1, 1].forEach(sd => { const z = zs + sd * 6.2; if (!XS.some(xx => Math.abs(x - xx) < 8) && !busy(x, z) && rnd() < 0.6) streetTrees.push({ x, y: groundH(x, z) - 0.2, z, ry: rnd() * 6, s: 0.8 + rnd() * 0.3 }); }); });

  // ---------- postes ----------
  const line = (ax: number, az: number, bx: number, bz: number, step = 30): [number, number][] => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)), out: [number, number][] = []; for (let i = 0; i <= n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); return out; };
  b.poles([line(-EXT, KING + 5.6, EXT, KING + 5.6), line(-EXT, QUEEN - 5.6, EXT, QUEEN - 5.6), line(-EXT, MAPLE + 5.2, -ROW0 - ROWD - 2, MAPLE + 5.2), line(ROW0 + ROWD + 2, MAPLE + 5.2, EXT, MAPLE + 5.2), line(-EXT, SPRUCE - 5.2, -ROW0 - ROWD - 2, SPRUCE - 5.2), line(ROW0 + ROWD + 2, SPRUCE - 5.2, EXT, SPRUCE - 5.2), line(ELM + 5.2, -96, ELM + 5.2, 118), line(BIRCH - 5.2, -96, BIRCH - 5.2, 118), line(-CEDAR + 5.2, -34, -CEDAR + 5.2, 118), line(CEDAR - 5.2, -96, CEDAR - 5.2, 118), line(-11.5, QUEEN + 76, -11.5, SOUTH)]);
  const sl: [number, number, number][] = [];
  for (let z = NORTH0 + 6; z < SOUTH; z += 22) { if (Math.abs(z - KING) < 7 || Math.abs(z - QUEEN) < 7) continue; sl.push([-7.6, z, Math.PI / 2], [7.6, z + 11, -Math.PI / 2]); }
  [-50, -30, 30, 50, 100, -100].forEach(x => { sl.push([x, KING - 5.6, 0], [x, QUEEN + 5.6, Math.PI]); });
  [ELM, BIRCH, -CEDAR, CEDAR].forEach(x => [-60, -20, 60, 100].filter(z => x !== -CEDAR || z > -30).forEach(z => sl.push([x - 5.2 * Math.sign(x), z, x < 0 ? -Math.PI / 2 : Math.PI / 2])));
  [MAPLE, SPRUCE].forEach(z => [-110, -50, 50, 110].forEach(x => sl.push([x, z + 5.2 * Math.sign(z), z < 0 ? 0 : Math.PI])));
  b.streetLights(sl, 3);

  const HO = await buildHotel(G);
  const MO = await buildMorgue(G);
  const L = await buildLandmarks(G);
  const CA = await buildCasas(G);
  await b.finish();
  M.lamps.push(...HO.lamps, ...MO.lamps, ...L.lamps, ...CA.lamps);
  M.npcs = moradores;
  M.docs = [...HO.docs, ...MO.docs, ...L.docs, ...CA.docs, ...buildRetratos(G)].map(d => ({ ...d, ...(PISTAS[d.n] || {}) }));
  M.notas = NOTAS;

  // ---------- natureza ----------
  const free = (x: number, z: number) => !busy(x, z) && !inR(x, z, MILL.x0 - 8, MILL.x1 + 8, MILL.z0 - 8, MILL.z1 + 20) && !(Math.abs(x) < EXT + 4 && ZS.some(zz => Math.abs(z - zz) < 22)) &&
    !(z > -100 && z < 120 && XS.some(xx => Math.abs(x - xx) < 22)) && Math.abs(x) > 12 && !inR(x, z, STATION.x0 - 20, STATION.x1 + 10, STATION.z0 - 10, RAIL + 5);
  const N = await buildNature(G, free, streetTrees);
  // o terreno é recortado em cima do porão do hotel (senão a grama tapa a escada que desce)
  { const tm = N.ground.material as THREE.MeshStandardMaterial, prev = tm.onBeforeCompile, f = (v: number) => v.toFixed(2);
    tm.customProgramCacheKey = () => 'terreno3-porao-canada';
    tm.onBeforeCompile = (sh, r) => { prev.call(tm, sh, r); sh.fragmentShader = sh.fragmentShader.replace('void main() {', `void main() {\n  if (vTUv.x > ${f(CELLAR.x0)} && vTUv.x < ${f(CELLAR.x1)} && -vTUv.y > ${f(CELLAR.z0)} && -vTUv.y < ${f(CELLAR.z1)}) discard;`); }; }

  // ---------- luzes que acompanham a câmera (como em Harlow) ----------
  const pool = Array.from({ length: Q.lights }, () => { const l = new THREE.PointLight(0xffffff, 0, 0, 2); G.add(l); const e = { l, d: 0, n: 0 }; M.lights.push(e); return e; });
  const alvo: (typeof LREQ[number] | null)[] = [];
  let lampF = 1, ultimaEscolha = -1; const posEscolha = new THREE.Vector3(1e9, 0, 0);
  const escolherLuzes = () => {
    const c = cam.position;
    const lista = LREQ.map(r => ({ r, s: Math.hypot(r.x - c.x, (r.y - c.y) * 2.5, r.z - c.z) - r.prio * 2 })).sort((a, b2) => a.s - b2.s).slice(0, pool.length);
    pool.forEach((e, i) => {
      const r = lista[i]?.r || null; alvo[i] = r;
      if (!r) { e.n = 0; e.l.intensity = 0; return; }
      e.l.position.set(r.x, r.y, r.z); e.l.color.setHex(r.color); e.n = r.n;
      // de dia as luzes de rua apagam, mas as de dentro (hotel, necrotério) ficam acesas fracas
      e.l.intensity = r.n * Math.max(lampF, dentro(r.x, r.z) ? 0.6 : 0);
    });
  };
  const dentro = (x: number, z: number) => inR(x, z, HOTEL.x0, HOTEL.x1, HOTEL.z0, HOTEL.z1) || inR(x, z, MORGUE.x0, MORGUE.x1, MORGUE.z0, MORGUE.z1) || DENTRO.some(r => inR(x, z, r[0], r[1], r[2], r[3]));
  escolherLuzes();

  // névoa baixa em sprites (rio e ruas)
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < (Q.lights > 8 ? 26 : 12); i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0xc8ccd0, transparent: true, depthWrite: false, opacity: 0.1 }));
    const s = 16 + rnd() * 14, onRiver = i % 3 === 0, x = (rnd() - 0.5) * 260, z = onRiver ? riverZ(x) : (rnd() - 0.5) * 240;
    sp.scale.set(s, s * 0.22, 1); sp.position.set(x, (onRiver ? RIVER.y + 0.6 : 0.3) + s * 0.06, z); sp.userData.v = 0.15 + rnd() * 0.2; sp.userData.ns = sp.userData.noExport = 1; G.add(sp); mist.push(sp); M.mist.push(sp);
  }

  // ---------- registro ----------
  M.walk.push(...N.floors, ...b.floors, ...HO.floors, ...MO.floors, ...L.floors, ...CA.floors);
  const solids = [...b.colliders, ...HO.solids, ...MO.solids, ...L.solids, ...CA.solids];
  M.solid = () => solids;
  M.layers = [...HO.layers, { n: 'Telhados', o: b.roofs, v: true }, { n: 'Telhados (marcos)', o: L.roofs, v: true }, { n: 'Telhado do necrotério', o: MO.roofs, v: true }, ...CA.layers, { n: 'Carros', o: L.cars, v: true }];
  M.views = VIEWS;
  M.shadowRadius = Q.lights > 8 ? 80 : 55;
  M.walkLimit = 260; M.camMax = 260; M.fogScale = 0.55;
  // os agentes chegam no trem da noite: plataforma da estação
  M.spawn = i => ({ x: STATION.x0 + 6 + (i % 3) * 1.1, z: STATION.z1 + 2 + Math.floor(i / 3) * 1.0, y: 0.3 });
  M.walkStart = { x: STATION.x0 + 8, z: STATION.z1 + 2 };
  M.sons = [
    { x: CHURCH.x, y: 14, z: CHURCH.z + CHURCH.d / 2 + 2.2, tipo: 'sino' },
    { x: HOTEL.x0, y: 1.4, z: HOTEL.z0 + 13, tipo: 'porta' },
    { x: MORGUE.x0 + 13.4, y: 1.4, z: MORGUE.z0 + 8, tipo: 'porta' },
    { x: CELLAR.x0 + 2.4, y: 0.2, z: CELLAR.z1 - 0.6, tipo: 'porta' },
  ];
  // exportação VTT: cada andar do hotel é uma área; os andares de cima somem conforme a área escolhida
  const hoGroups = HO.layers.map(l => l.o); // [telhado, 3º, 2º]
  M.vtt = {
    areas: [
      { n: 'Hotel Laurentian — térreo', b: [HOTEL.x0 - 4, HOTEL.x1 + 1, HOTEL.z0 - 4, HOTEL.z1 + 1], lv: 1 },
      { n: 'Hotel Laurentian — 2º andar', b: [HOTEL.x0 - 1, HOTEL.x1 + 1, HOTEL.z0 - 2, HOTEL.z1 + 1], lv: 1 },
      { n: 'Hotel Laurentian — 3º andar', b: [HOTEL.x0 - 1, HOTEL.x1 + 1, HOTEL.z0 - 2, HOTEL.z1 + 1], lv: 1 },
      { n: 'Necrotério', b: [MORGUE.x0 - 2, MORGUE.x1 + 2, MORGUE.z0 - 3, MORGUE.z1 + 10], lv: 1 },
      { n: 'Fábrica de papel (por dentro)', b: [MILL.x0 - 1, MILL.x1 + 1, MILL.z0 - 1, MILL.z1 + 4], lv: 1 },
      { n: 'Lanchonete', b: [DINER.x0 - 2, DINER.x1 + 2, DINER.z0 - 4, DINER.z1 + 1], lv: 1 },
      { n: 'Casa de Eva Pelletier', b: [CASA_EVA.x - 6, CASA_EVA.x + 9, CASA_EVA.z - 6, CASA_EVA.z + 6], lv: 1 },
      { n: 'Casa dos Moreau', b: [CASA_MOREAU.x - 9, CASA_MOREAU.x + 6, CASA_MOREAU.z - 6, CASA_MOREAU.z + 6], lv: 1 },
      { n: 'Igreja e cemitério', b: [CEMETERY.x0 - 3, CHURCH.x + 10, CEMETERY.z0 - 3, CHURCH.z + 20], lv: 1 },
      { n: 'Centro (Main St, King, Queen)', b: [-40, 40, -60, 60], lv: 1 },
      { n: 'Estação', b: [STATION.x0 - 20, STATION.x1 + 20, STATION.z0 - 10, RAIL + 6], lv: 1 },
      { n: 'Cidade inteira', b: [-140, 140, -150, 150], lv: 1 },
    ],
    walls: [...b.vtt, ...HO.vttWalls, ...MO.vttWalls, ...L.vttWalls, ...CA.vttWalls],
    portals: [...HO.portals, ...MO.portals, ...L.portals, ...CA.portals],
    lights: LREQ.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.color.toString(16).padStart(6, '0')] as [number, number, number, number, string]),
  };
  M.exportHide = () => {
    const sel = document.getElementById('xa') as HTMLSelectElement | null, n = sel?.selectedOptions[0]?.textContent || '';
    const out: THREE.Object3D[] = [b.roofs, L.roofs, MO.roofs, CA.roofs, hoGroups[0], L.cars];
    if (/térreo/.test(n)) out.push(hoGroups[1], hoGroups[2]); else if (/2º/.test(n)) out.push(hoGroups[1]);
    return out;
  };

  // ---------- animação ----------
  let fogBase = 0.012;
  M.onTime = p => { lampF = p.lamps; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; escolherLuzes(); };
  M.tick = (dt, t) => {
    if (Math.floor(t * 3) !== ultimaEscolha || cam.position.distanceToSquared(posEscolha) > 25) { ultimaEscolha = Math.floor(t * 3); posEscolha.copy(cam.position); escolherLuzes(); }
    pool.forEach((e, k) => {
      const r = alvo[k]; if (!r || !r.flick || !e.l.intensity) return;
      const base = r.n * Math.max(lampF, dentro(r.x, r.z) ? 0.6 : 0);
      if (r.flick === 3) { const on = Math.sin(t * 2.3) + Math.sin(t * 7.1) * 0.6 > -0.6; e.l.intensity = base * (on ? 0.9 + 0.1 * Math.sin(t * 40) : 0.08); }
      else if (r.flick === 4) e.l.intensity = base * (Math.sin(t * 2.0) > 0 ? 1 : 0.05);
      else e.l.intensity = base * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + k)) * (0.85 + 0.15 * Math.sin(t * 9.1)));
    });
    N.foam.offset.y = -t * 0.9;
    const low = cam.position.y < 30;
    mist.forEach(m => { m.visible = low; m.position.x += m.userData.v * dt; if (m.position.x > 150) m.position.x = -150; });
    L.smoke.forEach((s, i) => { const u = ((t * 0.05 + s.userData.k) % 1); s.position.set(s.userData.cx + u * 30 + Math.sin(t * 0.3 + i) * 2, s.userData.y0 + u * 22, s.userData.cz + u * 8); const k = 5 + u * 22; s.scale.set(k, k, 1); (s.material as THREE.SpriteMaterial).opacity = 0.32 * (1 - u) * Math.min(1, u * 8); });
    const f = S.fog as THREE.FogExp2 | null; if (f && f.isFogExp2) f.density = fogBase / (1 + Math.max(0, cam.position.y - 10) / 14);
  };
}
