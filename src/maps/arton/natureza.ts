// Sul de Arton — natureza do mapa regional: árvores (instanciadas por bloco), manadas, navios que balançam,
// o monstro do Mar Negro (sombras sob a água e um tentáculo), recifes com espuma.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from '../../core/config';
import { noise2, fbm } from '../../core/terrain';
import { addWind } from '../../core/anim';
import {
  type P, Y, Ysolo, rnd, reseed, sdPoly, TOLLON, DEHEON, LOMATUBAR, UIVANTES, BB, ILHAS, ilhaD, TAIGAS, BOA_SORTE, MANADAS,
  LUGARES, CLAREIRAS, ESTRADAS, TRILHAS, PERFIS, campo, W, LIM, smooth,
} from './geo';

const Q = CFG.quality;
type Anim = (t: number) => void;

// ---------- grade de vizinhança (rios, estradas, trilhas, lugares) para não plantar em cima ----------
function hashDe(listas: P[][], cel = 3) { const m = new Map<string, P[]>(); listas.forEach(L => L.forEach(p => { const k = Math.floor(p[0] / cel) + ',' + Math.floor(p[1] / cel); if (!m.has(k)) m.set(k, []); m.get(k)!.push(p); })); return { m, cel }; }
function perto(h: ReturnType<typeof hashDe>, x: number, z: number, r: number) { const cx = Math.floor(x / h.cel), cz = Math.floor(z / h.cel); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const p of h.m.get((cx + a) + ',' + (cz + b)) || []) if (Math.hypot(p[0] - x, p[1] - z) < r) return true; return false; }

// ---------- formas das árvores (cor por vértice) ----------
function pinta(g: THREE.BufferGeometry, f: (x: number, y: number, z: number) => [number, number, number]) {
  const x = g.index ? g.toNonIndexed() : g, p = x.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) c.set(f(p.getX(i), p.getY(i), p.getZ(i)), i * 3);
  x.setAttribute('color', new THREE.BufferAttribute(c, 3)); x.deleteAttribute('uv'); return x;
}
/** árvore de Tollon: tronco negro como pedra e copa escura e fechada */
function tollonGeo(v: number) {
  reseed(v * 7 + 3);
  const h = 2.3 + rnd() * 0.8, tr = new THREE.CylinderGeometry(0.06, 0.12, h * 0.7, 5, 1, true); tr.translate(0, h * 0.35, 0);
  const partes = [pinta(tr, () => [0.05, 0.05, 0.06])];
  for (let i = 0; i < 2; i++) { const c = new THREE.IcosahedronGeometry(0.66 - i * 0.16, 0); c.scale(1, 1.35, 1); c.translate((rnd() - 0.5) * 0.25, h * (0.66 + i * 0.22), (rnd() - 0.5) * 0.25); partes.push(pinta(c, (_x, y) => { const k = 0.7 + 0.55 * (y / h); return [0.06 * k, 0.12 * k, 0.045 * k]; })); }
  const g = mergeGeometries(partes)!; g.computeVertexNormals(); return g;
}
/** conífera (taiga): três saias de cone; nas Uivantes com neve na ponta */
function coniferaGeo(v: number, neve: boolean) {
  reseed(v * 11 + 5);
  const h = 1.6 + rnd() * 0.7, tr = new THREE.CylinderGeometry(0.04, 0.07, h * 0.4, 4, 1, true); tr.translate(0, h * 0.2, 0);
  const partes = [pinta(tr, () => [0.18, 0.12, 0.08])];
  for (let i = 0; i < 3; i++) { const r = 0.55 - i * 0.14, ch = h * 0.42, c = new THREE.ConeGeometry(r, ch, 6, 1, true); c.translate(0, h * (0.25 + i * 0.22) + ch / 2, 0); partes.push(pinta(c, (_x, y) => (neve && y > h * (0.32 + i * 0.22) + ch * 0.55 ? [0.92, 0.95, 1.0] : [0.06, 0.14, 0.09]))); }
  const g = mergeGeometries(partes)!; g.computeVertexNormals(); return g;
}
/** árvore de folhas (Deheon, Lomatubar, Boa Sorte) */
function folhaGeo(v: number, cor: [number, number, number]) {
  reseed(v * 13 + 1);
  const h = 1.2 + rnd() * 0.5, tr = new THREE.CylinderGeometry(0.04, 0.07, h * 0.6, 4, 1, true); tr.translate(0, h * 0.3, 0);
  const partes = [pinta(tr, () => [0.22, 0.15, 0.1])];
  for (let i = 0; i < 2; i++) { const c = new THREE.IcosahedronGeometry(0.5 - i * 0.1, 0); c.translate((rnd() - 0.5) * 0.3, h * (0.75 + i * 0.18), (rnd() - 0.5) * 0.3); partes.push(pinta(c, (_x, y) => { const k = 0.8 + 0.4 * (y / h); return [cor[0] * k, cor[1] * k, cor[2] * k]; })); }
  const g = mergeGeometries(partes)!; g.computeVertexNormals(); return g;
}
/** cipreste da costa oeste */
function cipresteGeo() { const tr = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 4); tr.translate(0, 0.15, 0); const c = new THREE.ConeGeometry(0.22, 1.5, 6); c.translate(0, 0.95, 0); const g = mergeGeometries([pinta(tr, () => [0.2, 0.14, 0.1]), pinta(c, () => [0.1, 0.18, 0.1])])!; g.computeVertexNormals(); return g; }

type Inst = { x: number; z: number; s: number; r: number; c?: number };
/** versão de longe: um cone só, com a cor média da árvore */
function longe(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox(); const bb = geo.boundingBox!, h = bb.max.y, r = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
  const c = geo.attributes.color, m = [0, 0, 0]; for (let i = 0; i < c.count; i++) { m[0] += c.getX(i); m[1] += c.getY(i); m[2] += c.getZ(i); }
  const cone = new THREE.ConeGeometry(r * 0.9, h * 0.85, 5, 1, true); cone.translate(0, h * 0.15 + h * 0.425, 0);
  return pinta(cone, () => [m[0] / c.count, m[1] / c.count, m[2] / c.count]);
}
function plantar(Gr: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, lista: Inst[], sombra: boolean, nome: string, bloco = 80) {
  const far = longe(geo);
  const by = new Map<string, Inst[]>(); lista.forEach(t => { const k = Math.floor(t.x / bloco) + ',' + Math.floor(t.z / bloco); if (!by.has(k)) by.set(k, []); by.get(k)!.push(t); });
  const o = new THREE.Object3D(), c = new THREE.Color();
  by.forEach(L => {
    const im = new THREE.InstancedMesh(geo, mat, L.length); im.name = nome;
    L.forEach((t, i) => { o.position.set(t.x, Ysolo(t.x, t.z) - 0.08, t.z); o.rotation.set(0, t.r, 0); o.scale.setScalar(t.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); c.setScalar(t.c ?? 1); im.setColorAt(i, c); });
    im.castShadow = sombra; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.ns = 1; im.userData.cullDist = 1e5; im.userData.lod = { d: 130, near: geo, far }; Gr.add(im);
  });
}

export function construirNatureza(Gr: THREE.Group, M: { lamps: THREE.MeshBasicMaterial[] }) {
  const anim: Anim[] = [], grupo = new THREE.Group(); grupo.name = 'Natureza'; Gr.add(grupo);
  reseed(2024);
  const caminhos = hashDe([...ESTRADAS, ...TRILHAS], 3), rios = hashDe(PERFIS.map(R => R.pts), 3);
  const livre = (x: number, z: number, folga = 1) => Y(x, z) > 0.32 && !perto(caminhos, x, z, 0.75 * folga) && !perto(rios, x, z, 1.8 * folga) && !CLAREIRAS.some(c => Math.hypot(c.x - x, c.z - z) < c.r) && !LUGARES.some(l => l.tipo !== 'nada' && Math.hypot(l.x - x, l.z - z) < (l.tam ?? 1) * (['valkaria', 'giluk', 'tiberus'].includes(l.tipo) ? 15 : ['barud', 'malpetrim'].includes(l.tipo) ? 8.5 : 4.2));
  const sombra = Q === 'alta', matArv = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.04, envMapIntensity: 0.32 });
  addWind(matArv, { amp: 0.05, freq: 1.0, flutter: 0.004, height: 2.6 }, true); // copas balançando ao vento
  const passo = { baixa: 2.0, media: 1.55, alta: 1.25 }[Q];
  // Floresta de Tollon (densa)
  { const t: Inst[] = []; const [x0, x1, z0, z1] = BB.T;
    for (let z = z0; z < z1; z += passo) for (let x = x0; x < x1; x += passo) { const px = x + (rnd() - 0.5) * passo * 0.9, pz = z + (rnd() - 0.5) * passo * 0.9; if (sdPoly(TOLLON, px, pz, BB.T) < 0.6 + noise2(px * 0.3, pz * 0.3) * 1.5 || !livre(px, pz)) continue; t.push({ x: px, z: pz, s: 0.85 + rnd() * 0.45, r: rnd() * 6.28, c: 0.8 + rnd() * 0.45 }); }
    for (let v = 0; v < 3; v++) plantar(grupo, tollonGeo(v), matArv, t.filter((_a, i) => i % 3 === v), sombra, 'Árvores de Tollon'); }
  // taigas das Uivantes (abrigadas nos vales) e coníferas soltas
  { const t: Inst[] = [];
    for (const T of TAIGAS) for (let i = 0; i < T.r * T.r * 1.3 / (passo * passo) * 2.2; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * T.r * 1.15, x = T.x + Math.cos(a) * r, z = T.z + Math.sin(a) * r; if (livre(x, z, 0.7)) t.push({ x, z, s: 0.8 + rnd() * 0.5, r: rnd() * 6.28, c: 0.85 + rnd() * 0.3 }); }
    for (let i = 0; i < (Q === 'baixa' ? 260 : 600); i++) { const x = LIM.x0 + rnd() * (LIM.x1 - LIM.x0), z = LIM.z0 + rnd() * 270; const d = sdPoly(UIVANTES, x, z, BB.U); if (d > 3 && Y(x, z) < 9.5 && Y(x, z) > 0.5 && rnd() < 0.7 && livre(x, z, 0.7)) t.push({ x, z, s: 0.7 + rnd() * 0.4, r: rnd() * 6.28 }); }
    for (let v = 0; v < 2; v++) plantar(grupo, coniferaGeo(v, true), matArv, t.filter((_a, i) => i % 2 === v), sombra, 'Taiga'); }
  // Bosque da Boa Sorte (verde vivo) e bosques de Deheon, Lomatubar, oeste e ilhas
  { const verde: Inst[] = [], outono: Inst[] = [], cipr: Inst[] = [], ilhas: Inst[] = [];
    for (let i = 0; i < BOA_SORTE.r * BOA_SORTE.r * 3; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * BOA_SORTE.r, x = BOA_SORTE.x + Math.cos(a) * r, z = BOA_SORTE.z + Math.sin(a) * r; if (livre(x, z, 0.6)) verde.push({ x, z, s: 0.9 + rnd() * 0.5, r: rnd() * 6.28, c: 1.15 + rnd() * 0.2 }); }
    const pD = passo * 1.5;
    for (let z = LIM.z0; z < LIM.z1; z += pD) for (let x = LIM.x0; x < LIM.x1; x += pD) {
      const px = x + (rnd() - 0.5) * pD, pz = z + (rnd() - 0.5) * pD, h = Y(px, pz); if (h < 0.35) continue;
      const mata = fbm(px * 0.035 + 20, pz * 0.035, 3);
      if (sdPoly(DEHEON, px, pz, BB.D) > 1) { if ((mata > 0.6 || rnd() < 0.03) && livre(px, pz)) (rnd() < 0.7 ? verde : outono).push({ x: px, z: pz, s: 0.8 + rnd() * 0.5, r: rnd() * 6.28, c: 0.8 + rnd() * 0.3 }); continue; }
      if (sdPoly(LOMATUBAR, px, pz, BB.L) > 1) { if ((mata > 0.68 || rnd() < 0.012) && livre(px, pz)) outono.push({ x: px, z: pz, s: 0.75 + rnd() * 0.4, r: rnd() * 6.28, c: 0.9 }); continue; }
      if (sdPoly(UIVANTES, px, pz, BB.U) > -2 || sdPoly(TOLLON, px, pz, BB.T) > -1) continue;
      let naIlha = false; for (const I of ILHAS) if (ilhaD(I, px, pz) > 0.8) { naIlha = true; break; }
      if (naIlha) { if (rnd() < 0.45 && Y(px, pz) < 9 && livre(px, pz, 0.6)) ilhas.push({ x: px, z: pz, s: 0.7 + rnd() * 0.4, r: rnd() * 6.28 }); continue; }
      const c = campo(px, pz);
      if (c.mW > 0.3 && rnd() < 0.3 && livre(px, pz)) cipr.push({ x: px, z: pz, s: 0.8 + rnd() * 0.5, r: rnd() * 6.28 });
      else if (pz < -230 && rnd() < 0.15 && livre(px, pz)) outono.push({ x: px, z: pz, s: 0.8, r: rnd() * 6.28, c: 0.7 });
    }
    for (let v = 0; v < 2; v++) plantar(grupo, folhaGeo(v, [0.16, 0.3, 0.1]), matArv, verde.filter((_a, i) => i % 2 === v), sombra, 'Bosques', 150);
    plantar(grupo, folhaGeo(5, [0.36, 0.26, 0.09]), matArv, outono, sombra, 'Bosques secos', 220);
    plantar(grupo, cipresteGeo(), matArv, cipr, sombra, 'Ciprestes', 220);
    plantar(grupo, coniferaGeo(7, false), matArv, ilhas, sombra, 'Pinheiros das ilhas', 220); }

  // ---------- manadas (miniaturas pequenas) ----------
  const bicho = (esp: string) => {
    const pts: THREE.BufferGeometry[] = [], cor = (r: number, g: number, b: number) => () => [r, g, b] as [number, number, number];
    const corpo = (rx: number, ry: number, rz: number, y: number, c: [number, number, number]) => { const s = new THREE.SphereGeometry(1, 7, 5); s.scale(rx, ry, rz); s.translate(0, y, 0); pts.push(pinta(s, cor(...c))); };
    const perna = (x: number, z: number, h: number, r: number, c: [number, number, number]) => { const p = new THREE.CylinderGeometry(r, r, h, 4); p.translate(x, h / 2, z); pts.push(pinta(p, cor(...c))); };
    const cab = (y: number, z: number, r: number, c: [number, number, number]) => { const s = new THREE.SphereGeometry(r, 5, 4); s.translate(0, y, z); pts.push(pinta(s, cor(...c))); };
    const chifre = (x: number, y: number, z: number, L: number, rz: number, rx: number, c: [number, number, number]) => { const g = new THREE.ConeGeometry(0.025, L, 4); g.rotateZ(rz); g.rotateX(rx); g.translate(x, y, z); pts.push(pinta(g, cor(...c))); };
    if (esp === 'mamute') { const c: [number, number, number] = [0.32, 0.2, 0.13]; corpo(0.32, 0.3, 0.45, 0.5, c); cab(0.62, 0.42, 0.2, c); for (const s of [-1, 1]) { perna(s * 0.15, 0.22, 0.32, 0.07, c); perna(s * 0.15, -0.22, 0.32, 0.07, c); chifre(s * 0.1, 0.45, 0.6, 0.45, s * 0.6, 1.9, [0.95, 0.92, 0.85]); } const tr = new THREE.CylinderGeometry(0.03, 0.05, 0.4, 4); tr.translate(0, 0.35, 0.6); pts.push(pinta(tr, cor(...c))); }
    else if (esp === 'rinoceronte') { const c: [number, number, number] = [0.3, 0.26, 0.22]; corpo(0.25, 0.22, 0.4, 0.38, c); cab(0.38, 0.4, 0.15, c); chifre(0, 0.52, 0.55, 0.25, 0, 0.4, [0.8, 0.76, 0.7]); for (const s of [-1, 1]) { perna(s * 0.13, 0.2, 0.24, 0.06, c); perna(s * 0.13, -0.2, 0.24, 0.06, c); } }
    else if (esp === 'bisao') { const c: [number, number, number] = [0.2, 0.13, 0.08]; corpo(0.2, 0.22, 0.35, 0.38, c); corpo(0.17, 0.2, 0.15, 0.48, c); cab(0.36, 0.36, 0.12, c); for (const s of [-1, 1]) { perna(s * 0.1, 0.18, 0.26, 0.04, c); perna(s * 0.1, -0.18, 0.26, 0.04, c); chifre(s * 0.08, 0.45, 0.38, 0.12, s * 1.2, 0, [0.85, 0.8, 0.7]); } }
    else if (esp === 'alce' || esp === 'rena') { const c: [number, number, number] = esp === 'alce' ? [0.3, 0.2, 0.12] : [0.55, 0.5, 0.45]; corpo(0.13, 0.13, 0.28, 0.48, c); const n = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 4); n.rotateX(-0.6); n.translate(0, 0.62, 0.25); pts.push(pinta(n, cor(...c))); cab(0.75, 0.36, 0.07, c); for (const s of [-1, 1]) { perna(s * 0.07, 0.17, 0.36, 0.025, c); perna(s * 0.07, -0.17, 0.36, 0.025, c); for (let k = 0; k < 3; k++) chifre(s * (0.06 + k * 0.05), 0.88 + k * 0.03, 0.34, 0.18, s * (0.5 + k * 0.3), 0, [0.85, 0.78, 0.62]); } }
    else if (esp === 'lobo') { const c: [number, number, number] = [0.42, 0.42, 0.44]; corpo(0.08, 0.08, 0.2, 0.22, c); cab(0.28, 0.2, 0.06, c); const f = new THREE.ConeGeometry(0.03, 0.12, 4); f.rotateX(Math.PI / 2); f.translate(0, 0.27, 0.28); pts.push(pinta(f, cor(...c))); for (const s of [-1, 1]) { perna(s * 0.05, 0.12, 0.16, 0.02, c); perna(s * 0.05, -0.12, 0.16, 0.02, c); } const tl = new THREE.ConeGeometry(0.03, 0.18, 4); tl.rotateX(-1.9); tl.translate(0, 0.2, -0.26); pts.push(pinta(tl, cor(...c))); }
    else if (esp === 'cavalo') { const c: [number, number, number] = [0.32, 0.2, 0.12]; corpo(0.1, 0.11, 0.24, 0.38, c); const n = new THREE.CylinderGeometry(0.03, 0.05, 0.22, 4); n.rotateX(-0.5); n.translate(0, 0.5, 0.2); pts.push(pinta(n, cor(...c))); cab(0.6, 0.28, 0.05, c); for (const s of [-1, 1]) { perna(s * 0.05, 0.14, 0.28, 0.02, c); perna(s * 0.05, -0.14, 0.28, 0.02, c); } }
    else { const c: [number, number, number] = [0.9, 0.88, 0.84]; corpo(0.1, 0.1, 0.2, 0.26, c); cab(0.32, 0.22, 0.06, [0.3, 0.25, 0.2]); for (const s of [-1, 1]) { perna(s * 0.05, 0.12, 0.18, 0.02, c); perna(s * 0.05, -0.12, 0.18, 0.02, c); } }
    const g = mergeGeometries(pts)!; g.computeVertexNormals(); return g;
  };
  const matB = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const porEsp = new Map<string, Inst[]>();
  for (const m of MANADAS) for (let i = 0; i < m.n; i++) { const a = rnd() * 6.28, r = 0.6 + rnd() * (m.esp === 'lobo' ? 1.6 : 3.2), x = m.x + Math.cos(a) * r, z = m.z + Math.sin(a) * r; if (Y(x, z) < 0.4) continue; if (!porEsp.has(m.esp)) porEsp.set(m.esp, []); porEsp.get(m.esp)!.push({ x, z, s: m.esp === 'mamute' ? 1.6 : m.esp === 'rinoceronte' ? 1.4 : 1.3, r: rnd() * 6.28 }); }
  const cav = (id: string, n: number, raio: number) => { const l = LUGARES.find(q => q.id === id)!; for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = 1 + rnd() * raio; if (!porEsp.has('cavalo')) porEsp.set('cavalo', []); porEsp.get('cavalo')!.push({ x: l.x + Math.cos(a) * r, z: l.z + Math.sin(a) * r, s: 1.3, r: rnd() * 6.28 }); } };
  cav('centauros', 14, 4); cav('ancora', 3, 1.6); cav('nimbarann', 4, 5);
  for (let i = 0; i < 60; i++) { const l = LUGARES.filter(q => q.tipo === 'vila-deh')[i % 9]; if (!l) continue; const a = rnd() * 6.28, r = 4 + rnd() * 4, x = l.x + Math.cos(a) * r, z = l.z + Math.sin(a) * r; if (Y(x, z) < 0.5) continue; if (!porEsp.has('vaca')) porEsp.set('vaca', []); porEsp.get('vaca')!.push({ x, z, s: 1.2, r: rnd() * 6.28 }); }
  porEsp.forEach((L, esp) => plantar(grupo, bicho(esp), matB, L, false, 'Animais: ' + esp, 500));

  // ---------- Mar Negro: navios, monstro, recifes ----------
  const matN = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  const navio = (pirata: boolean, s: number) => {
    const ps: THREE.BufferGeometry[] = [], cc = (c: [number, number, number]) => () => c;
    const sh = new THREE.Shape(); sh.moveTo(0, 1.4); sh.quadraticCurveTo(0.42, 0.6, 0.38, -1.1); sh.lineTo(-0.38, -1.1); sh.quadraticCurveTo(-0.42, 0.6, 0, 1.4);
    const casco = new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: false }); casco.rotateX(Math.PI / 2); casco.translate(0, 0.32, 0); ps.push(pinta(casco, cc(pirata ? [0.12, 0.08, 0.06] : [0.32, 0.22, 0.14])));
    const conves = new THREE.BoxGeometry(0.5, 0.06, 1.2); conves.translate(0, 0.34, -0.5); ps.push(pinta(conves, cc([0.4, 0.3, 0.2])));
    for (const [z, h] of [[0.3, 2.0], [-0.5, 1.6]]) { const m = new THREE.CylinderGeometry(0.03, 0.04, h, 5); m.translate(0, 0.3 + h / 2, z); ps.push(pinta(m, cc([0.25, 0.18, 0.1]))); for (let k = 0; k < 2; k++) { const v = new THREE.PlaneGeometry(0.9 - k * 0.25, 0.55, 4, 1), a = v.attributes.position; for (let i = 0; i < a.count; i++) a.setZ(i, Math.cos(a.getX(i) * 2.2) * 0.12); v.translate(0, 0.75 + k * 0.62 + (h - 1.6) * 0.5, z + 0.05); ps.push(pinta(v, cc(pirata ? [0.06, 0.05, 0.05] : [0.85, 0.8, 0.68]))); } }
    const bd = new THREE.PlaneGeometry(0.28, 0.16); bd.translate(0.14, 2.25, 0.3); ps.push(pinta(bd, cc(pirata ? [0.05, 0.05, 0.05] : [0.7, 0.15, 0.1])));
    const g = mergeGeometries(ps)!; g.computeVertexNormals(); g.scale(s, s, s); return g;
  };
  const navios: { m: THREE.Mesh; c: P; r: number; v: number; f: number }[] = [];
  const esteiraG = new THREE.BufferGeometry(); esteiraG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1.0, -2.2, 0, -7.5, 2.2, 0, -7.5, 0, 0, -1.0, 0, 0, -5.5, -2.2, 0, -7.5], 3));
  esteiraG.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0.55, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0.55, 1, 1, 1, 0.1, 1, 1, 1, 0], 4));
  const esteiraM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const pos = (px: number, py: number) => W(px, py);
  ([[pos(400, 1420), true, 7], [pos(560, 1452), true, 9], [pos(300, 1392), true, 6], [pos(722, 1462), true, 8], [pos(176, 1232), false, 2], [pos(150, 1228), false, 1.5], [pos(760, 1252), false, 3], [pos(470, 1352), false, 5]] as [P, boolean, number][]).forEach(([c, pirata, r], i) => {
    const m = new THREE.Mesh(navio(pirata, pirata ? 1.25 : 1.0), matN); m.castShadow = true; m.userData.ns = 1; grupo.add(m); navios.push({ m, c, r, v: (pirata ? 0.012 : 0.004) * (i % 2 ? 1 : -1), f: rnd() * 6.28 });
    const est = new THREE.Mesh(esteiraG, esteiraM); est.position.y = 0.04; est.userData.ns = 1; est.userData.noExport = 1; est.renderOrder = 1; m.add(est); // esteira de espuma
  });
  anim.push(t => navios.forEach(n => { const a = n.f + t * n.v; n.m.position.set(n.c[0] + Math.cos(a) * n.r, 0.02 + Math.sin(t * 1.3 + n.f) * 0.06, n.c[1] + Math.sin(a) * n.r); n.m.rotation.set(Math.sin(t * 1.1 + n.f) * 0.04, -a + (n.v > 0 ? 0 : Math.PI), Math.sin(t * 0.9 + n.f) * 0.06); }));
  // sombras enormes sob a água
  const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 512; const g2 = cvs.getContext('2d')!; g2.filter = 'blur(14px)'; g2.fillStyle = '#000';
  g2.beginPath(); g2.ellipse(128, 230, 62, 170, 0, 0, 6.3); g2.fill(); g2.beginPath(); g2.moveTo(128, 380); g2.lineTo(60, 480); g2.lineTo(128, 440); g2.lineTo(196, 480); g2.fill();
  g2.beginPath(); g2.ellipse(50, 220, 50, 18, -0.5, 0, 6.3); g2.fill(); g2.beginPath(); g2.ellipse(206, 220, 50, 18, 0.5, 0, 6.3); g2.fill();
  const tsom = new THREE.CanvasTexture(cvs), sombras: { m: THREE.Mesh; c: P; f: number }[] = [];
  ([[pos(480, 1505), 22], [pos(722, 1335), 16], [pos(130, 1338), 14]] as [P, number][]).forEach(([c, s], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.5, s), new THREE.MeshBasicMaterial({ map: tsom, transparent: true, opacity: 0.42, depthWrite: false, fog: false })); m.rotation.x = -Math.PI / 2; m.position.set(c[0], 0.04, c[1]); m.renderOrder = 1; m.userData.ns = 1; m.userData.noExport = 1; grupo.add(m); sombras.push({ m, c, f: i * 2.1 }); });
  anim.push(t => sombras.forEach(s => { const a = s.f + t * 0.02; s.m.position.x = s.c[0] + Math.cos(a) * 6; s.m.position.z = s.c[1] + Math.sin(a) * 4; s.m.rotation.z = -a + 1.57; }));
  // um tentáculo rompendo a superfície
  { const [tx, tz] = pos(470, 1500), curva = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0.3, 2, 0.2), new THREE.Vector3(1.0, 3.8, -0.2), new THREE.Vector3(2.0, 4.6, 0.3), new THREE.Vector3(2.6, 4.0, 0.6)]);
    const tg = new THREE.TubeGeometry(curva, 30, 0.42, 8), p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const k = Math.max(0.18, 1 - (i / p.count) * 0.85); p.setXYZ(i, p.getX(i) * 1, p.getY(i), p.getZ(i)); void k; }
    const tm = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0x3a2440, roughness: 0.35, metalness: 0.05, emissive: 0x120612 })); tm.position.set(tx, 0, tz); tm.castShadow = true; tm.userData.ns = 1; grupo.add(tm);
    const anel = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.6, 24), new THREE.MeshBasicMaterial({ color: 0xdfe8e8, transparent: true, opacity: 0.5, depthWrite: false })); anel.rotation.x = -Math.PI / 2; anel.position.set(tx, 0.05, tz); anel.userData.ns = 1; grupo.add(anel);
    anim.push(t => { tm.rotation.set(Math.sin(t * 0.6) * 0.12, Math.sin(t * 0.25) * 0.4, Math.sin(t * 0.8) * 0.1); const s = 1 + Math.sin(t * 1.4) * 0.08; anel.scale.set(s, s, s); }); }
  // recifes das sereias e dos elfos-do-mar (pedras, coral colorido e espuma)
  { const ps: THREE.BufferGeometry[] = [];
    for (const [px, py] of [[380, 1455], [590, 1500], [100, 1292], [520, 1395]]) { const [x, z] = pos(px, py); for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = rnd() * 3.5, d = new THREE.DodecahedronGeometry(0.25 + rnd() * 0.35); d.translate(x + Math.cos(a) * r, 0.05 + rnd() * 0.1, z + Math.sin(a) * r); ps.push(pinta(d, () => [0.25, 0.27, 0.28])); }
      for (let i = 0; i < 10; i++) { const a = rnd() * 6.28, r = rnd() * 3, h = 0.3 + rnd() * 0.5, c = new THREE.ConeGeometry(0.06, h, 5); c.translate(x + Math.cos(a) * r, h / 2, z + Math.sin(a) * r); const cor: [number, number, number] = [[0.2, 0.7, 0.65], [0.55, 0.3, 0.7], [0.85, 0.45, 0.55]][i % 3] as [number, number, number]; ps.push(pinta(c, () => cor)); }
      const esp = new THREE.Mesh(new THREE.RingGeometry(2.6, 4.6, 32), new THREE.MeshBasicMaterial({ color: 0xe8f0f0, transparent: true, opacity: 0.22, depthWrite: false })); esp.rotation.x = -Math.PI / 2; esp.position.set(x, 0.04, z); esp.userData.ns = 1; grupo.add(esp); }
    const g = mergeGeometries(ps)!; g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })); m.userData.ns = 1; m.receiveShadow = true; grupo.add(m); }
  // brilhos mágicos piscando dentro de Tollon
  { const n = 26, pts: number[] = []; for (let i = 0; i < n * 8 && pts.length < n * 3; i++) { const [a, b, c, d] = BB.T, x = a + rnd() * (b - a), z = c + rnd() * (d - c); if (sdPoly(TOLLON, x, z, BB.T) > 3) pts.push(x, Ysolo(x, z) + 1.2 + rnd() * 1.5, z); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const m = new THREE.PointsMaterial({ color: 0xb8ffd8, size: 0.35, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }); const p = new THREE.Points(g, m); p.userData.ns = 1; p.userData.noExport = 1; grupo.add(p);
    anim.push(t => { m.opacity = 0.35 + 0.45 * Math.abs(Math.sin(t * 0.7)) * (0.6 + 0.4 * Math.sin(t * 2.3)); m.size = 0.3 + 0.15 * Math.sin(t * 1.7); }); }
  // geada girando em volta do covil de Beluhga
  { const l = LUGARES.find(q => q.id === 'beluhga')!, n = 220, pos2 = new Float32Array(n * 3), fase = Array.from({ length: n }, () => [rnd() * 6.28, 6 + rnd() * 6, rnd() * 8]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    const m = new THREE.PointsMaterial({ color: 0xe8f8ff, size: 0.28, transparent: true, opacity: 0.85, depthWrite: false }); const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.ns = 1; p.userData.noExport = 1; grupo.add(p);
    const y0 = Y(l.x, l.z);
    anim.push(t => { for (let i = 0; i < n; i++) { const [a0, r, h] = fase[i], a = a0 + t * (0.25 + (i % 5) * 0.03); pos2[i * 3] = l.x + Math.cos(a) * r; pos2[i * 3 + 1] = y0 - 4 + ((h + t * 0.4) % 8); pos2[i * 3 + 2] = l.z + Math.sin(a) * r; } g.attributes.position.needsUpdate = true; }); }
  void smooth; void M;
  return { grupo, anim };
}
