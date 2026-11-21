// Kit de cidade em escala de gente (1 m = 1 quadrado; chão em y = 0), aprendido em Barud e Valkaria e usado pelos mapas
// de cidade da campanha (Tiberus, Malpetrim, Giluk…): pegadas e ruas sem sobreposição (Ocupacao), ruas desenhadas com
// pontes sobre água, casas por estilo (paleta, andares, janelas, sacadas, toldos, telhado, chaminé), muralha com torres
// e portões, postes, árvores leves em código, objetos de rua, colisores e paredes do VTT. Os prédios com interior vêm
// de barud/edificios.ts (construirPredio) e a luz do conjunto de luzes de barud/cidade.ts (luz/LUZES).
import * as THREE from 'three';
import { pbr } from '../../core/pbr';
import { halo } from '../../core/kit';
import { Batch, MAT, mtx, por, cx, cil, cone, telhado, Q } from '../barud/common';
import { barril, caixote, sacos } from '../barud/mobilia';
import { luz } from '../barud/cidade';
import { type V, type Caixa, type Rua, PI, rnd, entre, pick, reseed, caixa, cantos, distCaixa, reamostra, aCada, Ocupacao } from '../valkaria/plano';

export { type V, type Caixa, type Rua, PI, rnd, entre, pick, reseed, caixa, cantos, distCaixa, reamostra, aCada, Ocupacao };
export type Mat = THREE.Material;

/** contexto de uma cidade em construção */
export interface Ctx {
  G: THREE.Group; B: Batch; BR: Batch; roofs: THREE.Group; ocup: Ocupacao;
  floors: THREE.Object3D[]; colGeo: THREE.BufferGeometry[]; vttWalls: V[][]; lanternas: THREE.Vector3[]; chamines: THREE.Vector3[];
  ruas: Rua[]; reservados: { id: string; B: Caixa }[];
  /** ponto dentro da cidade com folga m (muralha) */
  dentro: (x: number, z: number, m: number) => boolean;
  /** água (rio, canal, mar) no ponto, com folga m */
  agua: (x: number, z: number, m: number) => boolean;
  marmore: Mat; ouro: Mat;
}
export function novaCidade(G: THREE.Group, o: { dentro: Ctx['dentro']; agua?: Ctx['agua']; reservados?: Ctx['reservados'] }): Ctx {
  const roofs = new THREE.Group(); roofs.name = 'Telhados';
  const vc = (m: Mat) => { const c = (m as THREE.MeshStandardMaterial).clone(); c.vertexColors = true; return c; };
  const ctx: Ctx = {
    G, B: new Batch('cidade'), BR: new Batch('telhados'), roofs, ocup: new Ocupacao(o.dentro, o.agua ?? (() => false)), floors: [], colGeo: [], vttWalls: [], lanternas: [], chamines: [], ruas: [],
    reservados: o.reservados ?? [], dentro: o.dentro, agua: o.agua ?? (() => false),
    marmore: vc(pbr('painted_plaster_wall', { size: 4 })), ouro: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.85, roughness: 0.32 }),
  };
  ctx.reservados.forEach(r => ctx.ocup.ocupar(r.B));
  return ctx;
}

// ---------- colisão e chão ----------
export function colisor(c: Ctx, w: number, h: number, d: number, m: THREE.Matrix4, y = h / 2) { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y, 0); g.applyMatrix4(m); g.deleteAttribute('uv'); g.deleteAttribute('normal'); c.colGeo.push(g.index ? g.toNonIndexed() : g); }
export function colCil(c: Ctx, x: number, z: number, r: number, h: number, y0 = 0) { const g = new THREE.CylinderGeometry(r, r, h, 12); g.translate(x, y0 + h / 2, z); g.deleteAttribute('uv'); g.deleteAttribute('normal'); c.colGeo.push(g.toNonIndexed()); }
/** malha plana (forma no plano x,−z) deitada em y, UV em metros; entra nos pisos de caminhar */
export function chao(c: Ctx, g: THREE.BufferGeometry, mat: Mat, y: number, pisavel = true) {
  g.rotateX(-PI / 2); g.translate(0, y, 0);
  const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
  const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.userData.ns = 1; c.G.add(me); if (pisavel) c.floors.push(me); return me;
}
export const forma = (pts: V[]) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
/** piso invisível (pisar/arrastar personagens) */
export function pisoInvisivel(c: Ctx, w: number, d: number, m: THREE.Matrix4, y: number) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), new THREE.MeshBasicMaterial({ visible: false })); f.applyMatrix4(m); f.position.y = y; f.userData.ns = 1; c.G.add(f); c.floors.push(f); }
/** rampa invisível (escadaria) de (0,0,z0) até (0,h,z1) em coordenadas de m */
export function rampa(c: Ctx, w: number, z0: number, z1: number, h: number, m: THREE.Matrix4) {
  const L = Math.hypot(z1 - z0, h), g = new THREE.PlaneGeometry(w, L); g.rotateX(-PI / 2); g.rotateX(Math.atan2(h, z0 - z1)); g.translate(0, h / 2, (z0 + z1) / 2);
  const r = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); r.applyMatrix4(m); r.userData.ns = 1; c.G.add(r); c.floors.push(r);
}
const resv = (c: Ctx, x: number, z: number, m: number) => c.reservados.some(r => distCaixa(r.B, x, z) < m);

// ---------- ruas ----------
/** corta uma polilinha nos trechos livres (dentro da cidade, fora dos prédios reservados e dos círculos bloqueados) */
export function cortar(c: Ctx, pts: V[], w: number, o: { fora?: boolean; folga?: number } = {}): V[][] {
  const out: V[][] = []; let cur: V[] = [];
  const fecha = () => { if (cur.length > 1) { let L = 0; for (let i = 1; i < cur.length; i++) L += Math.hypot(cur[i][0] - cur[i - 1][0], cur[i][1] - cur[i - 1][1]); if (L > 3) out.push(cur); } cur = []; };
  for (const p of reamostra(pts, 1.2)) {
    const ok = (o.fora || c.dentro(p[0], p[1], 4)) && !resv(c, p[0], p[1], w / 2 + (o.folga ?? 1.2)) && !c.ocup.circ.some(([x, z, r]) => Math.hypot(p[0] - x, p[1] - z) < r + w / 2 - 0.5);
    if (ok) cur.push(p); else fecha();
  }
  fecha(); return out;
}
export function rua(c: Ctx, n: string, pts: V[], w: number, o: { fora?: boolean; nobre?: boolean; beco?: boolean; folga?: number } = {}) { for (const t of cortar(c, pts, w, o)) { c.ruas.push({ n, pts: t, w, nobre: o.nobre, beco: o.beco }); c.ocup.rua(t, w); } }
/** desenha as ruas (fita calçada) e faz pontes onde passam sobre água */
export function desenharRuas(c: Ctx, o: { mat?: Mat; matFora?: Mat; corPonte?: number; ponte?: (x: number, z: number, ry: number, w: number, L: number) => void } = {}) {
  const M = MAT(), terra = o.matFora ?? pbr('dry_ground_rocks', { size: 4, color: 0x9a9080 });
  for (const r of c.ruas) {
    const p = reamostra(r.pts, 1.5), pos: number[] = [], idx: number[] = []; let ponte: V[] = [];
    const fim = () => { if (ponte.length > 1) { const [ax, az] = ponte[0], [bx, bz] = ponte[ponte.length - 1]; (o.ponte ?? pontePadrao)((ax + bx) / 2, (az + bz) / 2, Math.atan2(bx - ax, bz - az), r.w, Math.hypot(bx - ax, bz - az) + 5); } ponte = []; };
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1, nx = -tz / L * r.w / 2, nz = tx / L * r.w / 2;
      const sobre = c.agua(p[i][0], p[i][1], 1.2), y = sobre ? 0.42 : r.beco ? 0.012 : 0.025;
      pos.push(p[i][0] + nx, y, p[i][1] + nz, p[i][0] - nx, y, p[i][1] - nz);
      if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
      if (sobre) ponte.push(p[i]); else fim();
    }
    fim();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const uv = new Float32Array((pos.length / 3) * 2); for (let i = 0; i < pos.length / 3; i++) { uv[i * 2] = pos[i * 3]; uv[i * 2 + 1] = -pos[i * 3 + 2]; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const foraDaCidade = !c.dentro(r.pts[Math.floor(r.pts.length / 2)][0], r.pts[Math.floor(r.pts.length / 2)][1], 0);
    const me = new THREE.Mesh(g, foraDaCidade ? terra : o.mat ?? M.calcada); me.receiveShadow = true; me.userData.ns = 1; c.G.add(me); c.floors.push(me);
  }
  function pontePadrao(x: number, z: number, ry: number, w: number, L: number) {
    const m = mtx(x, 0, z, ry), cor = o.corPonte ?? 0xb8b0a4;
    cx(c.B, M.pedra, w + 0.6, 0.6, L, 0, 0.1, 0, cor, m);
    for (const s of [-1, 1]) cx(c.B, M.pedra, 0.5, 1.0, L, s * (w / 2 + 0.05), 0.9, 0, cor, m);
    const ra = 7, g = new THREE.CylinderGeometry(ra, ra, w + 0.4, 18, 1, true, 0, PI); g.rotateZ(PI / 2); g.translate(0, -0.6 - ra, 0); por(c.B, M.pedra, g, cor, m);
    pisoInvisivel(c, w, L, m, 0.4);
  }
}

// ---------- casas por estilo ----------
export interface Estilo {
  andares: [number, number]; h0: number; ha: number; parede: Mat[]; cores: number[]; base?: number;
  telhado: { mat: Mat; cores: number[]; fator?: number; plano?: boolean }; janela?: { w: number; h: number; acesa: number; moldura?: number; venezianas?: number[] };
  friso?: number; ouro?: boolean; sacada?: number; floreira?: number; toldo?: { prob: number; cores: number[] }; chamine?: number; porta?: number; tosco?: boolean;
}
/** casa genérica (frente local +z): corpo, frisos, janelas na frente e nos fundos, porta, toldo de loja, sacadas, telhado */
export function casa(c: Ctx, x: number, z: number, ry: number, w: number, d: number, e: Estilo) {
  const M = MAT(), m = mtx(x, 0, z, ry + (e.tosco ? (rnd() - 0.5) * 0.04 : 0));
  const andares = Math.round(entre(e.andares[0], e.andares[1] + 0.99) - 0.49), h0 = e.h0, ha = e.ha, hTot = h0 + (andares - 1) * ha;
  const matP = pick(e.parede), cor = pick(e.cores);
  cx(c.B, matP, w, hTot, d, 0, hTot / 2, 0, cor, m);
  if (e.base !== undefined) cx(c.B, M.pedra, w + 0.2, 0.5, d + 0.2, 0, 0.25, 0, e.base, m);
  for (let k = 1; k < andares; k++) { const y = h0 + (k - 1) * ha; if (e.friso !== undefined) cx(c.B, M.pedra, w + 0.16, 0.22, d + 0.16, 0, y, 0, e.friso, m); if (e.ouro && k === 1) cx(c.B, c.ouro, w + 0.18, 0.08, 0.06, 0, y + 0.16, d / 2 + 0.1, 0xd8b048, m); }
  const J = e.janela ?? { w: 0.7, h: 1.0, acesa: 0.3 };
  for (let k = 0; k < andares; k++) {
    const y = k === 0 ? 1.6 : h0 + (k - 1) * ha + 1.4, nj = Math.max(1, Math.floor((w - 1.2) / (J.w + 1.3)));
    for (let i = 0; i < nj; i++) {
      let xx = -w / 2 + (i + 0.5) * w / nj; if (k === 0 && Math.abs(xx) < 1.1) xx += xx < 0 ? -1.1 : 1.1; if (Math.abs(xx) > w / 2 - 0.6) continue;
      for (const f of [1, -1]) {
        if (f < 0 && rnd() < 0.5) continue; const acesa = f > 0 && rnd() < J.acesa;
        cx(c.B, acesa ? M.aceso : M.escuro, J.w, J.h, 0.05, xx, y, f * (d / 2 + 0.03), 0xffffff, m);
        cx(c.B, M.madeira, J.w + 0.2, 0.12, 0.16, xx, y - J.h / 2 - 0.06, f * (d / 2 + 0.06), J.moldura ?? 0x3a2a1e, m);
        if (!acesa && J.venezianas && rnd() < 0.6) for (const sx of [-1, 1]) cx(c.B, M.tabuas, J.w / 2 + 0.05, J.h + 0.05, 0.05, xx + sx * (J.w * 0.75 + 0.03), y, f * (d / 2 + 0.06), pick(J.venezianas), m);
      }
      if (k > 0 && e.sacada && rnd() < e.sacada) { cx(c.B, M.pedra, J.w + 0.8, 0.14, 0.8, xx, y - J.h / 2 - 0.15, d / 2 + 0.45, e.friso ?? 0xb0a898, m); for (let b = -2; b <= 2; b++) cx(c.B, e.ouro ? c.ouro : M.ferro, 0.04, 0.8, 0.04, xx + b * (J.w + 0.6) / 4, y - J.h / 2 + 0.3, d / 2 + 0.82, e.ouro ? 0xd8b048 : 0xffffff, m); }
      else if (k > 0 && e.floreira && rnd() < e.floreira) { cx(c.B, M.madeira, J.w + 0.2, 0.22, 0.32, xx, y - J.h / 2 - 0.05, d / 2 + 0.2, 0x4a3424, m); for (let f2 = 0; f2 < 3; f2++) { const g = new THREE.SphereGeometry(0.12, 5, 4); g.translate(xx - J.w / 2 + 0.1 + f2 * J.w / 2.5, y - J.h / 2 + 0.12, d / 2 + 0.22); por(c.B, M.plain, g, pick([0xc83a3a, 0xe8d040, 0xd86a2a, 0x8a5ab0]), m); } }
    }
  }
  const loja = e.toldo && rnd() < e.toldo.prob;
  if (loja) { cx(c.B, M.escuro, w * 0.6, 2.2, 0.06, 0, 1.15, d / 2 + 0.04, 0xffffff, m); const g = new THREE.BoxGeometry(w * 0.7, 0.05, 1.4); g.rotateX(0.3); g.translate(0, 2.7, d / 2 + 0.6); por(c.B, M.tecido, g, pick(e.toldo!.cores), m); for (let i = 0; i < 3; i++) { const t = rnd(); const v = new THREE.Vector3((i - 1) * w * 0.25, 0, d / 2 + 0.9).applyMatrix4(m); t < 0.5 ? barril(c.B, new THREE.Matrix4(), v.x, v.z) : caixote(c.B, new THREE.Matrix4(), v.x, v.z, 0, 0.5); } }
  else { cx(c.B, M.tabuas, 1.1, 2.2, 0.08, 0, 1.1, d / 2 + 0.05, e.porta ?? 0x3a2618, m); cx(c.B, M.pedra, 1.6, 0.16, 0.6, 0, 0.08, d / 2 + 0.3, 0x8a847a, m); }
  const ct = pick(e.telhado.cores), hr = e.telhado.plano ? 0 : Math.min(w, d) * (e.telhado.fator ?? 0.38) + 0.4;
  if (e.telhado.plano) { cx(c.BR, e.telhado.mat, w + 0.3, 0.3, d + 0.3, 0, hTot + 0.15, 0, ct, m); cx(c.BR, matP, w + 0.3, 0.6, 0.25, 0, hTot + 0.45, d / 2, cor, m); cx(c.BR, matP, w + 0.3, 0.6, 0.25, 0, hTot + 0.45, -d / 2, cor, m); }
  else if (rnd() < 0.5) telhado(c.BR, e.telhado.mat, d + 0.05, w + 0.05, hr, hTot, ct, m.clone().multiply(mtx(0, 0, 0, PI / 2)), 0.4, matP, cor);
  else telhado(c.BR, e.telhado.mat, w + 0.05, d + 0.05, hr, hTot, ct, m, 0.4, matP, cor);
  if (rnd() < (e.chamine ?? 0.6)) { const px = (rnd() < 0.5 ? -1 : 1) * (w / 2 - 0.7), pz = -d / 4, hc = hTot + hr + 0.4; cx(c.B, M.pedra, 0.7, hc - hTot + 0.6, 0.7, px, hTot - 0.3 + (hc - hTot + 0.6) / 2, pz, 0x8a847a, m); c.chamines.push(new THREE.Vector3(px, hc + 0.3, pz).applyMatrix4(m)); }
  colisor(c, w, hTot, d, m);
  c.vttWalls.push(cantos(caixa(x, z, w, d, ry)));
  return { m, hTot };
}
/** casas ao longo de todas as ruas: estiloEm(x,z) escolhe estilo e tamanho */
export function casasNasRuas(c: Ctx, escolher: (x: number, z: number, r: Rua) => { e: Estilo; w: [number, number]; d: [number, number] } | null, o: { muro?: number } = {}) {
  let n = 0;
  for (const r of c.ruas) {
    const p = r.pts, acc = [0]; for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const tot = acc[acc.length - 1];
    const noPonto = (s: number) => { let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const L = acc[i] - acc[i - 1] || 1e-6, f = (s - acc[i - 1]) / L; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f, (p[i][0] - p[i - 1][0]) / L, (p[i][1] - p[i - 1][1]) / L]; };
    for (const lado of [-1, 1]) {
      let s = 1;
      while (s < tot - 3) {
        const [x0, z0] = noPonto(s), es = escolher(x0, z0, r); if (!es) { s += 3; continue; }
        const w = entre(...es.w), d = entre(...es.d), [px, pz, tx, tz] = noPonto(s + w / 2), nx = -tz * lado, nz = tx * lado, off = r.w / 2 + 0.3 + d / 2;
        const x = px + nx * off, z = pz + nz * off, ry = Math.atan2(-nx, -nz), Bx = caixa(x, z, w, d, ry);
        if (c.ocup.livre(Bx, 0.15, o.muro ?? 6) && cantos(Bx).every(([u, v]) => c.dentro(u, v, o.muro ?? 6)) && !cantos(Bx).some(([u, v]) => c.agua(u, v, 2)) && !resv(c, x, z, Math.max(w, d) / 2 + 1)) {
          c.ocup.ocupar(Bx); casa(c, x, z, ry, w - 0.06, d, es.e); n++; s += w + (n % 5 === 0 ? entre(2, 3) : 0.05);
        } else s += 1.5;
      }
    }
  }
  return n;
}

/** casas soltas nos fundos de quarteirão (pontos sorteados em [x0,x1]×[z0,z1]; ry escolhe a orientação) */
export function preencher(c: Ctx, n: number, caixaArea: [number, number, number, number], escolher: (x: number, z: number) => { e: Estilo; w: [number, number]; d: [number, number] } | null, ry: (x: number, z: number) => number, muro = 6) {
  let k = 0;
  for (let i = 0; i < n; i++) {
    const x = entre(caixaArea[0], caixaArea[1]), z = entre(caixaArea[2], caixaArea[3]), es = escolher(x, z); if (!es) continue;
    const w = entre(...es.w), d = entre(...es.d), a = ry(x, z), Bx = caixa(x, z, w, d, a);
    if (!c.ocup.livre(Bx, 0.3, muro) || !cantos(Bx).every(([u, v]) => c.dentro(u, v, muro)) || resv(c, x, z, Math.max(w, d) / 2 + 1)) continue;
    c.ocup.ocupar(Bx); casa(c, x, z, a, w - 0.06, d, es.e); k++;
  }
  return k;
}

// ---------- postes, árvores, objetos ----------
export type TipoPoste = 'ferro' | 'madeira' | 'braseiro';
export function poste(c: Ctx, x: number, z: number, ry: number, tipo: TipoPoste = 'madeira') {
  const M = MAT(), m = mtx(x, 0, z, ry); let p: THREE.Vector3;
  if (tipo === 'ferro') { cx(c.B, M.ferro, 0.18, 4.2, 0.18, 0, 2.1, 0, 0xffffff, m); cil(c.B, M.pedra, 0.35, 0.5, 0, 0, 0, 0xc8c0b8, 8, m); cx(c.B, M.ferro, 0.42, 0.55, 0.42, 0, 4.35, 0, 0xffffff, m); cx(c.B, M.aceso, 0.32, 0.42, 0.32, 0, 4.35, 0, 0xffffff, m); p = new THREE.Vector3(0, 4.35, 0).applyMatrix4(m); }
  else if (tipo === 'braseiro') { cil(c.B, M.pedra, 0.45, 1.6, 0, 0, 0, 0x8a7a6a, 8, m); cil(c.B, M.ferro, 0.55, 0.35, 0, 1.6, 0, 0xffffff, 10, m, 0.4); for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(0.12, 0.45, 5); g.translate((rnd() - 0.5) * 0.4, 2.1, (rnd() - 0.5) * 0.4); por(c.B, M.aceso, g, 0xffffff, m); } p = new THREE.Vector3(0, 2.2, 0).applyMatrix4(m); }
  else { cx(c.B, M.madeira, 0.16, 3.4, 0.16, 0, 1.7, 0, 0x2a1e14, m); cx(c.B, M.ferro, 0.05, 0.05, 0.7, 0, 3.25, 0.35, 0xffffff, m); cx(c.B, M.ferro, 0.26, 0.36, 0.26, 0, 2.95, 0.66, 0xffffff, m); cx(c.B, M.aceso, 0.18, 0.26, 0.18, 0, 2.95, 0.66, 0xffffff, m); p = new THREE.Vector3(0, 2.95, 0.66).applyMatrix4(m); }
  c.lanternas.push(p); halo(p.x, p.y, p.z, tipo === 'braseiro' ? 0.9 : 0.65); luz(p.x, p.y, p.z, 40, 2, tipo === 'braseiro' ? 0xff8a3a : 0xffb060, 18, 7);
}
export function postesNasRuas(c: Ctx, tipo: (r: Rua) => TipoPoste | null) {
  for (const r of c.ruas) {
    const t = tipo(r); if (!t) continue; const passo = r.w >= 9 ? 15 : r.w >= 6 ? 19 : 26;
    aCada(r.pts, passo).forEach((q, i) => {
      if (c.agua(q.x, q.z, 2) || !c.dentro(q.x, q.z, 6)) return;
      const lado = i % 2 ? 1 : -1, x = q.x - q.tz * (r.w / 2 + 0.5) * lado, z = q.z + q.tx * (r.w / 2 + 0.5) * lado;
      if (!c.ocup.pontoLivre(x, z, 0.3) || resv(c, x, z, 0.8)) return;
      poste(c, x, z, Math.atan2(q.tx, q.tz), t);
    });
  }
}
/** árvore leve (tronco + copa de icosaedros); cores da copa à escolha (jacarandá, cipreste, oliveira…) */
export function arvore(c: Ctx, x: number, z: number, s = 1, cores = [0x4a6a3a, 0x5a7a40, 0x3a5a32], forma: 'redonda' | 'cipreste' = 'redonda') {
  const M = MAT(), m = mtx(x, 0, z, rnd() * 6);
  cil(c.B, M.madeira, 0.22 * s, 3.2 * s, 0, 0, 0, 0x4a3a30, 6, m, 0.14 * s);
  if (forma === 'cipreste') { const g = new THREE.ConeGeometry(1.1 * s, 8 * s, 7); g.translate(0, 6 * s, 0); por(c.B, M.plain, g, pick(cores), m); return; }
  for (let k = 0; k < 4; k++) { const g = new THREE.IcosahedronGeometry((1.3 + rnd() * 0.6) * s, 0); g.scale(1, 0.75, 1); g.translate((rnd() - 0.5) * 2 * s, (3.4 + rnd() * 1.2) * s, (rnd() - 0.5) * 2 * s); por(c.B, M.plain, g, pick(cores), m); }
}
/** barris, caixas e sacos encostados nas ruas comuns */
export function objetosDeRua(c: Ctx, n: number, longe = (_x: number, _z: number) => true) {
  const I = new THREE.Matrix4();
  for (let i = 0; i < n * Q.props; i++) {
    const r = pick(c.ruas); if (r.nobre && rnd() < 0.6) continue; const q = pick(r.pts), lado = rnd() < 0.5 ? -1 : 1, a = rnd() * PI * 2;
    const x = q[0] + Math.cos(a) * (r.w / 2 + 0.7) * lado, z = q[1] + Math.sin(a) * (r.w / 2 + 0.7) * lado;
    if (!c.ocup.pontoLivre(x, z, 0.4) || resv(c, x, z, 0.6) || !longe(x, z)) continue;
    const t = rnd(); t < 0.4 ? barril(c.B, I, x, z) : t < 0.75 ? caixote(c.B, I, x, z, 0, 0.5 + rnd() * 0.3) : sacos(c.B, I, x, z, 3);
  }
}

// ---------- muralha com torres e portões ----------
export interface OpMuralha { h: number; t: number; mat?: Mat; cor: number; ameia?: number; torre: { r?: number; lado?: number; h: number; teto?: { mat: Mat; cor: number; h: number }; cada?: number }; portao: { larg: number; h: number; cor?: number; teto?: { mat: Mat; cor: number } }; estandarte?: number }
/** muralha ao longo de um polígono fechado; portões nos pontos pedidos (no meio de uma aresta) */
export function muralha(c: Ctx, pol: V[], portoes: V[], o: OpMuralha) {
  const M = MAT(), mat = o.mat ?? M.pedra, ameia = o.ameia ?? 0x7a7268;
  const cx0 = pol.reduce((a, p) => a + p[0], 0) / pol.length, cz0 = pol.reduce((a, p) => a + p[1], 0) / pol.length;
  const seg = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.5) return;
    const a = Math.atan2(bx - ax, bz - az) - PI / 2, m = mtx((ax + bx) / 2, 0, (az + bz) / 2, a), mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const sobreAgua = c.agua(mx, mz, 1);
    if (sobreAgua) { cx(c.B, mat, L, o.h - 3.2, o.t, 0, 3.2 + (o.h - 3.2) / 2, 0, o.cor, m); for (let k = -5; k <= 5; k++) cx(c.B, M.ferro, 0.14, 4.6, 0.14, k * L / 11, 0.9, 0, 0xffffff, m); }
    else { cx(c.B, mat, L, o.h, o.t, 0, o.h / 2, 0, o.cor, m); colisor(c, L, o.h, o.t, m); c.vttWalls.push([[+ax.toFixed(2), +az.toFixed(2)], [+bx.toFixed(2), +bz.toFixed(2)]]); }
    const sgn = ((mx - cx0) * Math.sin(a) + (mz - cz0) * Math.cos(a)) > 0 ? 1 : -1;
    for (let s = -L / 2 + 0.7; s < L / 2 - 0.5; s += Q.merloes) cx(c.B, mat, 1.0, 1.2, 0.7, s, o.h + 0.6, sgn * (o.t / 2 - 0.35), ameia, m);
    cx(c.B, M.pedra, L, 0.5, 0.5, 0, o.h + 0.25, -sgn * (o.t / 2 - 0.25), ameia, m);
  };
  const torre = (x: number, z: number) => {
    if (c.agua(x, z, 4)) return; const T = o.torre;
    if (T.lado) { const m = mtx(x, 0, z, Math.atan2(x - cx0, z - cz0)); cx(c.B, mat, T.lado, T.h, T.lado, 0, T.h / 2, 0, o.cor, m); for (let i = 0; i < 4; i++) for (let k = -1; k <= 1; k++) { const mm = m.clone().multiply(mtx(0, 0, 0, i * PI / 2)); cx(c.B, mat, 1, 1.2, 0.7, k * T.lado / 3, T.h + 0.6, T.lado / 2 - 0.35, ameia, mm); } colisor(c, T.lado, T.h, T.lado, m); if (T.teto) cone(c.BR, T.teto.mat, T.lado * 0.75, T.teto.h, 0, T.h + 1.2, 0, T.teto.cor, 4, m.clone().multiply(mtx(0, 0, 0, PI / 4))); }
    else { const r = T.r ?? 5; cil(c.B, mat, r, T.h, x, 0, z, o.cor, 18); for (let i = 0; i < 12; i++) { const a = i * PI / 6; cx(c.B, mat, 1.1, 1.2, 0.7, x + Math.cos(a) * (r - 0.4), T.h + 0.6, z + Math.sin(a) * (r - 0.4), ameia, undefined, -a + PI / 2); } if (T.teto) cone(c.BR, T.teto.mat, r + 0.6, T.teto.h, x, T.h + 1.2, z, T.teto.cor, 18); colCil(c, x, z, r, T.h); }
    const ang = Math.atan2(z - cz0, x - cx0), tx = x - Math.cos(ang) * ((T.r ?? (T.lado ?? 8) / 2) + 0.3), tz = z - Math.sin(ang) * ((T.r ?? (T.lado ?? 8) / 2) + 0.3); luz(tx, 3.4, tz, 6, 1, 0xff9a48, 12);
  };
  const gates: { x: number; z: number; a: number }[] = [];
  for (let i = 0; i < pol.length; i++) {
    const [ax, az] = pol[i], [bx, bz] = pol[(i + 1) % pol.length], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const gs = portoes.map(([gx, gz]) => ({ t: (gx - ax) * ux + (gz - az) * uz, d: Math.abs((gx - ax) * -uz + (gz - az) * ux) })).filter(g => g.t > 4 && g.t < L - 4 && g.d < 6).sort((p, q) => p.t - q.t);
    let s = 0; const gw = o.portao.larg / 2 + 0.5;
    for (const g of gs) {
      seg(ax + ux * s, az + uz * s, ax + ux * (g.t - gw), az + uz * (g.t - gw)); s = g.t + gw;
      const px = ax + ux * g.t, pz = az + uz * g.t, a = Math.atan2(ux, uz) - PI / 2, m = mtx(px, 0, pz, a), tw = Math.max(5, o.t + 2);
      for (const sd of [-1, 1]) {
        cx(c.B, mat, tw, o.portao.h, tw + 2, sd * (gw + tw / 2), o.portao.h / 2, 0, o.portao.cor ?? o.cor, m); colisor(c, tw, o.portao.h, tw + 2, m.clone().multiply(mtx(sd * (gw + tw / 2), 0, 0)));
        for (let k = -1; k <= 1; k++) cx(c.B, mat, 1, 1.2, 0.7, sd * (gw + tw / 2) + k * tw / 3, o.portao.h + 0.6, (tw + 2) / 2 - 0.35, ameia, m);
        if (o.portao.teto) { const gg = new THREE.ConeGeometry(tw * 0.8, tw * 0.9, 4); gg.rotateY(PI / 4); gg.translate(sd * (gw + tw / 2), o.portao.h + tw * 0.45, 0); por(c.BR, o.portao.teto.mat, gg, o.portao.teto.cor, m); }
        const lp = new THREE.Vector3(sd * (gw - 0.4), 4.2, (tw + 2) / 2 + 0.3).applyMatrix4(m); luz(lp.x, lp.y, lp.z, 9, 3, 0xff9a48, 16, 10); halo(lp.x, lp.y, lp.z, 0.9); c.lanternas.push(lp);
        if (o.estandarte !== undefined) cx(c.B, M.tecido, 1.8, 5, 0.05, sd * (gw + tw / 2), o.portao.h - 3.5, (tw + 2) / 2 + 0.05, o.estandarte, m);
      }
      cx(c.B, mat, o.portao.larg + 1, o.portao.h - (o.portao.h * 0.62), tw, 0, o.portao.h * 0.62 + (o.portao.h * 0.38) / 2, 0, o.portao.cor ?? o.cor, m);
      for (let k = -3; k <= 3; k++) cx(c.B, M.ferro, 0.12, 2.6, 0.12, k * o.portao.larg / 7, o.portao.h * 0.62 - 1.3, 0.6, 0xffffff, m);
      gates.push({ x: px, z: pz, a: Math.atan2(pz - cz0, px - cx0) });
    }
    seg(ax + ux * s, az + uz * s, bx, bz);
  }
  const cada = o.torre.cada ?? 1;
  pol.forEach(([x, z], k) => { if (k % cada === 0) torre(x, z); });
  // torres extras no meio das arestas longas
  for (let i = 0; i < pol.length; i++) { const [ax, az] = pol[i], [bx, bz] = pol[(i + 1) % pol.length], L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / 48); for (let k = 1; k < n + 1 && n > 0; k++) { const t = k / (n + 1), x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (!gates.some(g => Math.hypot(g.x - x, g.z - z) < o.portao.larg + 14)) torre(x, z); } }
  return gates;
}

// ---------- fim: lotes viram malhas, colisores juntam ----------
export function terminar(c: Ctx) {
  c.B.build(c.G); c.BR.build(c.roofs); c.G.add(c.roofs);
  let n = 0; c.colGeo.forEach(g => (n += g.attributes.position.count));
  const cp = new Float32Array(n * 3); let o = 0; c.colGeo.forEach(g => { cp.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3; });
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.computeBoundingSphere(); cg.computeBoundingBox();
  const col = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); col.userData.ns = 1; col.userData.noExport = 1; c.G.add(col);
  return col;
}

/** luzes de mapa de cidade: N PointLights vão para as luzes pedidas mais perto da câmera (escolha a cada 1/3 s) */
export { luz };
