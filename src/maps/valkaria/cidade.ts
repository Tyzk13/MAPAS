// Valkaria — a cidade em volta dos prédios com interior: chão, rio com cais e pontes, muralha branca com torres de
// telhado azul e portões dourados, praça do Panteão com a deusa colossal e os deuses menores, ruas e avenidas,
// casas por bairro (nobres de mármore no miolo, sobrados no meio, casas simples perto do muro), Palácio, Catedral,
// Academia Arcana, Grande Mercado, torres dos nobres com jardins suspensos, jardins de jacarandás, postes e objetos.
import * as THREE from 'three';
import { pbr } from '../../core/pbr';
import { halo } from '../../core/kit';
import { Batch, MAT, mtx, por, cx, cil, cone, telhado, Q } from '../barud/common';
import type { Predio } from '../barud/edificios';
import { matsV } from './mats';
import { barril, caixote, sacos, peca, mesa } from '../barud/mobilia';
import { luz } from '../barud/cidade';
import {
  type V, type Rua, type Caixa, PI, rnd, entre, pick, R_MURO, MURO, N_MURO, PRACA_R, ANEL1, ANEL2, ANEL3, AVENIDAS, NOMES_AV,
  polar, paraCentro, RIO, rioX, margem, noRio, caixa, cantos, distCaixa, reamostra, arco, dentroMuro, Ocupacao, aCada,
} from './plano';

export interface CidadeV {
  floors: THREE.Object3D[]; colliders: THREE.Object3D; roofs: THREE.Group; chamines: THREE.Vector3[]; vttWalls: V[][];
  lanternas: THREE.Vector3[]; ruas: Rua[]; portoes: { n: string; x: number; z: number; a: number }[]; marcos: Record<string, THREE.Vector3>;
}
const OURO = 0xd8b048, MARMORE = 0xe8e2ee, LILAS = 0xd4c8e2, AZUL = 0x5a6a9a;

export async function construirCidadeV(G: THREE.Group, ocup: Ocupacao, reservados: { id: string; B: Caixa }[], predios: Predio[]): Promise<CidadeV> {
  const M = MAT(), B = new Batch('valkaria'), BR = new Batch('telhados'), roofs = new THREE.Group(); roofs.name = 'Telhados';
  const { marmore, deusa, ouro } = matsV();
  const vidro = new THREE.MeshBasicMaterial({ color: 0xb89aff }); // brilho violeta da Academia
  const floors: THREE.Object3D[] = [], chamines: THREE.Vector3[] = [], vttWalls: V[][] = [], lanternas: THREE.Vector3[] = [];
  const colGeo: THREE.BufferGeometry[] = [], marcos: Record<string, THREE.Vector3> = {};
  const colisor = (w: number, h: number, d: number, m: THREE.Matrix4, y = h / 2) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y, 0); g.applyMatrix4(m); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.index ? g.toNonIndexed() : g); };
  const colCil = (x: number, z: number, r: number, h: number) => { const g = new THREE.CylinderGeometry(r, r, h, 12); g.translate(x, h / 2, z); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.toNonIndexed()); };
  const plano = (g: THREE.BufferGeometry, mat: THREE.Material, y: number, chao = true) => { g.rotateX(-PI / 2); g.translate(0, y, 0); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i)); const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.userData.ns = 1; G.add(me); if (chao) floors.push(me); return me; };
  const sh = (pts: V[]) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const resv = (x: number, z: number, m = 0) => reservados.some(r => distCaixa(r.B, x, z) < m);

  // ---------- chão: campo fora, cascalho claro dentro; o rio corta tudo ----------
  {
    const grama = pbr('leafy_grass', { size: 5, color: 0x7a8a5a }), dentro = pbr('gravel_floor_02', { size: 4, color: 0xc8c0b8 });
    const esq = margem(-1), dir = margem(1);
    plano(new THREE.ShapeGeometry(sh([[-340, -340], ...esq, [-340, 340]]), 2), grama, -0.03);
    plano(new THREE.ShapeGeometry(sh([...dir, [340, 340], [340, -340]]), 2), grama, -0.03);
    const circ = Array.from({ length: 112 }, (_, k) => { const a = (k / 112) * PI * 2; return polar(a, R_MURO * Math.cos(PI / N_MURO) - 1); });
    const oeste = circ.map(([x, z]) => [Math.min(x, rioX(z) - RIO.larg / 2), z] as V), leste = circ.map(([x, z]) => [Math.max(x, rioX(z) + RIO.larg / 2), z] as V);
    plano(new THREE.ShapeGeometry(sh(oeste), 2), dentro, 0.0);
    plano(new THREE.ShapeGeometry(sh(leste), 2), dentro, 0.0);
  }

  // ---------- o rio: água, leito, cais de pedra dos dois lados, escadas e barcos ----------
  {
    const pts = margem(-1, -340, 340, 6), n = pts.length, pos: number[] = [], idx: number[] = [];
    for (let i = 0; i < n; i++) { const z = pts[i][1], x = rioX(z); pos.push(x - RIO.larg / 2 - 0.4, RIO.agua, z, x + RIO.larg / 2 + 0.4, RIO.agua, z); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k, k - 1, k + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const agua = new THREE.Mesh(g, M.agua); agua.receiveShadow = true; agua.userData.ns = 1; G.add(agua);
    const leito = g.clone(); leito.translate(0, RIO.fundo - RIO.agua, 0); const ml = new THREE.Mesh(leito, M.escuro); ml.userData.ns = 1; G.add(ml);
    for (const lado of [-1, 1] as const) {
      const L = margem(lado, -335, 335, 6);
      for (let i = 1; i < L.length; i++) {
        const [ax, az] = L[i - 1], [bx, bz] = L[i], len = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az), m = mtx((ax + bx) / 2 + lado * 0.4, 0, (az + bz) / 2, a);
        const dentroCid = Math.hypot((ax + bx) / 2, (az + bz) / 2) < R_MURO + 4;
        cx(B, M.pedra, 0.8, -RIO.fundo + 0.3, len + 0.05, 0, (RIO.fundo + 0.3) / 2, 0, dentroCid ? 0xd8d0dc : 0x9a948a, m);
        if (dentroCid) { cx(B, M.pedra, 1.1, 0.25, len + 0.05, lado * 0.15, 0.32, 0, 0xc8c0cc, m); if (i % 3 === 0) cx(B, M.ferro, 0.08, 0.9, 0.08, lado * 0.45, 0.65, 0, 0xffffff, m); }
      }
    }
    // escadas até a água e barcos atracados
    for (const z of [-140, -60, 40, 120]) for (const lado of [-1, 1]) { const x = rioX(z) + lado * (RIO.larg / 2 - 0.8); for (let k = 0; k < 6; k++) cx(B, M.pedra, 0.5, 0.22, 2.4, x - lado * k * 0.5, -k * 0.22 - 0.11, z, 0xc8c0cc); }
    for (const z of [-150, -95, -30, 20, 65, 100, 145]) {
      const x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (RIO.larg / 2 - 2.2), P = peca(B, new THREE.Matrix4(), x, RIO.agua, z, (rnd() - 0.5) * 0.2);
      P.cx(M.tabuas, 1.5, 0.45, 5.2, 0, 0.1, 0, 0x5a4030); P.cx(M.tabuas, 1.2, 0.08, 4.6, 0, 0.32, 0, 0x3a2a1c); if (rnd() < 0.5) { P.cil(M.madeira, 0.07, 4.5, 0, 0.3, 0.5, 0x3a2a1c, 6); P.cx(M.tecido, 0.04, 2.6, 2.2, 0, 2.6, 0.5, pick([0xe8e0d0, 0x8a3a6a, 0x5a3a9a])); }
    }
  }

  // ---------- ruas (as de quarteirão param nos prédios grandes e na praça) ----------
  const ruas: Rua[] = [];
  const RES_FOLGA = 1.2;
  /** corta uma polilinha nos trechos livres (dentro do muro, fora da praça e dos prédios reservados) */
  const cortar = (pts: V[], w: number, o: { portao?: boolean; anel1?: boolean } = {}): V[][] => {
    const out: V[][] = []; let cur: V[] = [];
    const fecha = () => { if (cur.length > 1) { const L = cur.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - cur[i - 1][0], p[1] - cur[i - 1][1]) : 0), 0); if (L > 3) out.push(cur); } cur = []; };
    for (const p of reamostra(pts, 1.2)) {
      const r = Math.hypot(p[0], p[1]), dm = dentroMuro(p[0], p[1]);
      const ok = (o.portao || dm > 5) && (o.anel1 || r > ANEL1.r + ANEL1.w / 2 - 0.5) && !resv(p[0], p[1], w / 2 + RES_FOLGA);
      if (ok) cur.push(p); else fecha();
    }
    fecha(); return out;
  };
  const addRua = (n: string, pts: V[], w: number, o: { portao?: boolean; anel1?: boolean; nobre?: boolean; beco?: boolean } = {}) => { for (const t of cortar(pts, w, o)) { ruas.push({ n, pts: t, w, nobre: o.nobre, beco: o.beco }); ocup.rua(t, w); } };
  addRua('Anel do Panteão', arco(ANEL1.r, 0, PI * 2, 2), ANEL1.w, { anel1: true, nobre: true });
  AVENIDAS.forEach((a, i) => addRua(NOMES_AV[i], [polar(a, ANEL1.r + 2), polar(a, R_MURO + 175)], 12, { portao: true, nobre: true }));
  addRua('Bulevar das Torres', arco(ANEL2.r, 0, PI * 2, 2), ANEL2.w, { nobre: true });
  addRua('Anel dos Ofícios', arco(ANEL3.r, 0, PI * 2, 2.5), ANEL3.w);
  const nomesCard = ['Rua do Cais', 'Rua do Mercado', 'Rua da Catedral', 'Rua do Palácio'];
  [0, PI / 2, PI, -PI / 2].forEach((a, i) => addRua(nomesCard[i], [polar(a, ANEL2.r + 3), polar(a, R_MURO - 6)], 7));
  const perto = (a: number, lim: number) => [...AVENIDAS, 0, PI / 2, PI, -PI / 2, PI * 2, -PI].some(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < lim);
  let nT = 0;
  for (let a = 0; a < PI * 2 - 0.01; a += PI / 12) { if (perto(a, 0.14)) continue; nT++; addRua('Travessa ' + nT, [polar(a, ANEL2.r + 3), polar(a + 0.03, R_MURO - 6)], 4.5, { beco: nT % 3 === 0 }); }
  for (let a = PI / 16; a < PI * 2; a += PI / 8) { if (perto(a, 0.12)) continue; addRua('Rua dos Nobres', [polar(a, ANEL1.r + 4), polar(a, ANEL2.r - 3)], 5, { nobre: true }); }
  // desenho: fita calçada sobre o chão; sobre o rio vira ponte de pedra
  const pontes: { pts: V[]; w: number }[] = [];
  for (const r of ruas) {
    const p = reamostra(r.pts, 1.5), pos: number[] = [], idx: number[] = [];
    let ponte: V[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1, nx = -tz / L * r.w / 2, nz = tx / L * r.w / 2;
      const sobre = noRio(p[i][0], p[i][1], 1.2), y = sobre ? 0.42 : r.beco ? 0.012 : 0.025;
      pos.push(p[i][0] + nx, y, p[i][1] + nz, p[i][0] - nx, y, p[i][1] - nz);
      if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
      if (sobre) ponte.push(p[i]); else if (ponte.length) { pontes.push({ pts: ponte, w: r.w }); ponte = []; }
    }
    if (ponte.length) pontes.push({ pts: ponte, w: r.w });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const uv = new Float32Array((pos.length / 3) * 2); for (let i = 0; i < pos.length / 3; i++) { uv[i * 2] = pos[i * 3] / 1; uv[i * 2 + 1] = -pos[i * 3 + 2] / 1; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const me = new THREE.Mesh(g, Math.hypot(r.pts[0][0], r.pts[0][1]) > R_MURO + 8 ? pbr('dry_ground_rocks', { size: 4, color: 0x9a9080 }) : M.calcada); me.receiveShadow = true; me.userData.ns = 1; G.add(me); floors.push(me);
  }
  for (const pn of pontes) {
    const [ax, az] = pn.pts[0], [bx, bz] = pn.pts[pn.pts.length - 1], L = Math.hypot(bx - ax, bz - az) + 5, a = Math.atan2(bx - ax, bz - az), m = mtx((ax + bx) / 2, 0, (az + bz) / 2, a);
    cx(B, M.pedra, pn.w + 0.6, 0.6, L, 0, 0.1, 0, 0xd8d0dc, m);
    for (const s of [-1, 1]) { cx(B, M.pedra, 0.5, 1.0, L, s * (pn.w / 2 + 0.05), 0.9, 0, 0xe0d8e4, m); for (let k = -1; k <= 1; k += 2) cx(B, M.plain, 0.6, 0.5, 0.6, s * (pn.w / 2 + 0.05), 1.6, k * L / 2.6, OURO, m); }
    const ra = RIO.larg / 2 + 1, arcoG = new THREE.CylinderGeometry(ra, ra, pn.w + 0.4, 18, 1, true, 0, PI); arcoG.rotateZ(PI / 2); arcoG.translate(0, -0.6 - ra, 0); por(B, M.pedra, arcoG, 0xc8c0cc, m);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(pn.w, 0.1, L), new THREE.MeshBasicMaterial({ visible: false })); deck.applyMatrix4(m); deck.position.y = 0.4; deck.userData.ns = 1; G.add(deck); floors.push(deck);
    for (const s of [-1, 1]) { const p = new THREE.Vector3(s * (pn.w / 2 + 0.05), 2.3, 0).applyMatrix4(m); poste(p.x, p.z, 0.4, true); }
  }

  // ---------- praça do Panteão: lajotas claras, deuses menores, chafarizes, canteiros e lampiões ----------
  {
    const lj = pbr('monastery_stone_floor', { size: 3.2, color: 0xe2dae8 });
    plano(new THREE.CircleGeometry(PRACA_R + 1, 72), lj, 0.03);
    for (let k = 0; k < 3; k++) { const g = new THREE.RingGeometry(14 + k * 9, 14.6 + k * 9, 72); g.rotateX(-PI / 2); g.translate(0, 0.045, 0); por(B, M.plain, g, k === 1 ? OURO : 0xb8a8d0); }
    ocup.bloquear(0, 0, PRACA_R + 0.5);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * PI * 2 + 0.08, [x, z] = polar(a, 36), m = mtx(x, 0, z, paraCentro(x, z) + PI), dourado = i % 5 === 0;
      cx(B, marmore, 2.2, 2.4, 2.2, 0, 1.2, 0, 0xc8c0d0, m); cx(B, marmore, 2.6, 0.3, 2.6, 0, 2.45, 0, 0xd8d0e0, m);
      const mat = dourado ? ouro : deusa, c = dourado ? OURO : 0xece6f2;
      cil(B, mat, 0.7, 3.0, 0, 2.6, 0, c, 10, m, 0.45); const cab = new THREE.SphereGeometry(0.42, 10, 8); cab.translate(0, 6.0, 0); por(B, mat, cab, c, m);
      const br = new THREE.BoxGeometry(0.28, 1.6, 0.28); br.rotateZ(0.5 + (i % 3) * 0.4); br.translate(0.6, 5.0, 0.2); por(B, mat, br, c, m);
      if (i % 4 === 1) { const e = new THREE.BoxGeometry(0.12, 2.2, 0.12); e.translate(-0.7, 4.6, 0.3); por(B, M.ferro, e, 0xffffff, m); }
      colisor(2.2, 6, 2.2, m);
    }
    for (const a of [PI / 4, 3 * PI / 4, -PI / 4, -3 * PI / 4]) {
      const [x, z] = polar(a, 25); cil(B, M.pedra, 3.4, 0.7, x, 0, z, 0xd8d0e0, 24); cil(B, M.agua, 3.0, 0.05, x, 0.62, z, 0xffffff, 24); cil(B, M.pedra, 0.5, 2.2, x, 0, z, 0xe0d8e4, 10); cil(B, ouro, 1.1, 0.25, x, 2.2, z, OURO, 14); cil(B, M.pedra, 0.25, 1.0, x, 2.4, z, 0xe0d8e4, 8);
      colCil(x, z, 3.4, 0.7);
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + PI / 8, [x, z] = polar(a, 30); cil(B, M.pedra, 2.2, 0.45, x, 0, z, 0xd0c8d8, 18); cil(B, M.plain, 2.0, 0.1, x, 0.42, z, 0x3a5a2a, 18); for (let k = 0; k < 7; k++) { const g = new THREE.SphereGeometry(0.35 + rnd() * 0.2, 6, 5); g.translate(x + (rnd() - 0.5) * 3, 0.65, z + (rnd() - 0.5) * 3); por(B, M.plain, g, pick([0x8a5ab0, 0xc8a0d8, 0xe8e0f0, 0x5a7a3a, 0xd8b048])); } }
    for (let i = 0; i < 28; i++) { const [x, z] = polar((i / 28) * PI * 2 + 0.05, PRACA_R - 1.2); poste(x, z, paraCentro(x, z), true); }
    marcos.praca = new THREE.Vector3(0, 0, 0);
  }

  // ---------- a deusa colossal (a cidade inteira vive aos pés dela) ----------
  {
    const lil = 0xe4def2, cin = 0xd8dae6, Vt = THREE.Vector2;
    for (let k = 0; k < 4; k++) cil(B, marmore, 17 - k * 0.9, 1.6, 0, k * 1.6, 0, k % 2 ? 0xd8d0e0 : 0xc8c0d0, 48);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * PI * 2, [x, z] = polar(a, 15.6); cil(B, ouro, 0.35, 0.9, x, 6.4, z, OURO, 8); }
    // manto com dobras (raio ondulado embaixo), cintura, peito, ombros; cabeça, cabelo, coroa; braços segurando a espada
    const S = 6.4, manto = new THREE.LatheGeometry([[0, 0], [14.5, 0], [14, 3], [12.2, 15], [10.4, 30], [8.6, 44], [7.0, 53], [7.4, 58], [8.4, 64], [10.4, 71], [10.8, 74.5], [7.6, 78.2], [3.4, 80.4], [0, 81]].map(([a, b]) => new Vt(a, b)), 64);
    { const p = manto.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ang = Math.atan2(z, x), f = y < 50 ? 1 + 0.04 * Math.sin(ang * 16) * (1 - y / 50) : 1; p.setX(i, x * f); p.setZ(i, z * f); } manto.computeVertexNormals(); }
    manto.translate(0, S, 0); por(B, deusa, manto, lil);
    for (const [hh, rr] of [[3, 14.1], [15, 12.3], [53, 7.1]]) { const t = new THREE.TorusGeometry(rr + 0.15, 0.4, 8, 64); t.rotateX(PI / 2); t.translate(0, S + hh, 0); por(B, ouro, t, OURO); }
    const faixa = new THREE.TorusGeometry(8.9, 0.35, 8, 60, PI * 1.2); faixa.rotateX(PI / 2.6); faixa.rotateY(0.6); faixa.translate(0, S + 64, 0); por(B, ouro, faixa, OURO);
    const pesc = new THREE.CylinderGeometry(2.6, 3.2, 4, 16); pesc.translate(0, S + 81.5, 0); por(B, deusa, pesc, cin);
    const cab = new THREE.SphereGeometry(5.0, 24, 18); cab.scale(1, 1.16, 1); cab.translate(0, S + 87.5, 0.4); por(B, deusa, cab, cin);
    const cabelo = new THREE.SphereGeometry(5.5, 20, 14, 0, PI * 2, 0, PI * 0.62); cabelo.scale(1, 1.2, 1.05); cabelo.translate(0, S + 87.5, -0.6); por(B, deusa, cabelo, lil);
    const tranca = new THREE.ConeGeometry(3.0, 16, 14); tranca.rotateX(-0.12); tranca.translate(0, S + 78, -4.6); por(B, deusa, tranca, lil);
    const coroa = new THREE.TorusGeometry(4.5, 0.55, 8, 28); coroa.rotateX(PI / 2); coroa.translate(0, S + 93, -0.2); por(B, ouro, coroa, OURO);
    for (let k = 0; k < 9; k++) { const a = (k / 9) * PI * 2, g = new THREE.ConeGeometry(0.55, 2.8, 6); g.translate(Math.cos(a) * 4.5, S + 94.6, Math.sin(a) * 4.5 - 0.2); por(B, ouro, g, OURO); }
    for (const sx of [-1, 1]) {
      const braco = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 9.6, S + 73.5, 0), new THREE.Vector3(sx * 11.4, S + 66, 1.2), new THREE.Vector3(sx * 10.6, S + 59, 4.4), new THREE.Vector3(sx * 3.2, S + 61.5, 8.6)]), 20, 2.1, 12);
      por(B, deusa, braco, lil); const mao = new THREE.SphereGeometry(1.7, 10, 8); mao.translate(sx * 1.6, S + 61.5, 9.2); por(B, deusa, mao, cin);
    }
    cx(B, deusa, 1.9, 46, 0.6, 0, S + 37, 9.6, 0xe8ecf4); cx(B, ouro, 9, 1.4, 1.4, 0, S + 60.4, 9.4, OURO); cil(B, ouro, 0.7, 4.6, 0, S + 61, 9.4, OURO, 8); { const g = new THREE.SphereGeometry(1.1, 10, 8); g.translate(0, S + 66.4, 9.4); por(B, ouro, g, OURO); }
    colCil(0, 0, 17, 10); colCil(0, 0, 13, 88);
    for (const y of [20, 60, 92]) halo(0, y, 0, 8 + y * 0.05);
    luz(0, 9, 22, 60, 9, 0xffc070, 46, 30); luz(0, 9, -22, 50, 8, 0xffc070, 40); luz(22, 9, 0, 50, 8, 0xffc070, 40); luz(-22, 9, 0, 50, 8, 0xffc070, 40);
    marcos.deusa = new THREE.Vector3(0, 60, 0);
  }

  // ---------- muralha branca, torres azuis e portões dourados ----------
  const portoes: CidadeV['portoes'] = [];
  {
    const MH = 13, MT = 4;
    const muroSeg = (ax: number, az: number, bx: number, bz: number) => {
      const L = Math.hypot(bx - ax, bz - az); if (L < 0.5) return;
      const a = Math.atan2(bx - ax, bz - az) - PI / 2, m = mtx((ax + bx) / 2, 0, (az + bz) / 2, a);
      // trecho sobre o rio: arco com grade (a água passa por baixo)
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (noRio(mx, mz, 1)) { cx(B, marmore, L, MH - 3.2, MT, 0, 3.2 + (MH - 3.2) / 2, 0, MARMORE, m); for (let k = -5; k <= 5; k++) cx(B, M.ferro, 0.14, 4.6, 0.14, k * L / 11, 0.9, 0, 0xffffff, m); }
      else { cx(B, marmore, L, MH, MT, 0, MH / 2, 0, MARMORE, m); colisor(L, MH, MT, m); vttWalls.push([[+ax.toFixed(2), +az.toFixed(2)], [+bx.toFixed(2), +bz.toFixed(2)]]); }
      const sgn = (mx * Math.sin(a) + mz * Math.cos(a)) > 0 ? 1 : -1;
      for (let s = -L / 2 + 0.7; s < L / 2 - 0.5; s += Q.merloes) cx(B, M.pedra, 1.0, 1.2, 0.7, s, MH + 0.6, sgn * (MT / 2 - 0.35), 0xd0c8d8, m);
      cx(B, ouro, L, 0.25, 0.2, 0, MH - 0.6, sgn * (MT / 2 + 0.05), OURO, m);
    };
    for (let i = 0; i < N_MURO; i++) {
      const [ax, az] = MURO[i], [bx, bz] = MURO[(i + 1) % N_MURO];
      const aG = AVENIDAS.find(a => { const g = polar(a, R_MURO); const L = Math.hypot(bx - ax, bz - az), t = ((g[0] - ax) * (bx - ax) + (g[1] - az) * (bz - az)) / (L * L); return t > 0.05 && t < 0.95 && Math.hypot(ax + (bx - ax) * t - g[0], az + (bz - az) * t - g[1]) < 6; });
      if (aG === undefined) { muroSeg(ax, az, bx, bz); continue; }
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, g = polar(aG, R_MURO), t = (g[0] - ax) * ux + (g[1] - az) * uz, px = ax + ux * t, pz = az + uz * t, gw = 4.4;
      muroSeg(ax, az, px - ux * gw, pz - uz * gw); muroSeg(px + ux * gw, pz + uz * gw, bx, bz);
      const a = Math.atan2(ux, uz) - PI / 2, m = mtx(px, 0, pz, a);
      for (const s of [-1, 1]) {
        cx(B, marmore, 6.5, 18, 8.5, s * 7.6, 9, 0, 0xe0d8e8, m); colisor(6.5, 18, 8.5, m.clone().multiply(mtx(s * 7.6, 0, 0)));
        { const g = new THREE.ConeGeometry(5.4, 6.5, 4); g.rotateY(PI / 4); g.translate(s * 7.6, 18 + 3.25, 0); por(B, ouro, g, OURO, m); }
        const lp = new THREE.Vector3(s * 4.6, 4.4, 5).applyMatrix4(m); luz(lp.x, lp.y, lp.z, 9, 3, 0xff9a48, 16, 10); halo(lp.x, lp.y, lp.z, 0.9); lanternas.push(lp);
        cx(B, M.tecido, 2, 6, 0.05, s * 7.6, 11, 4.3, 0x5a3a9a, m); cx(B, ouro, 2.1, 0.2, 0.1, s * 7.6, 14.1, 4.3, OURO, m);
      }
      cx(B, marmore, 8.8, 4, MT + 3, 0, 11.6, 0, 0xd8d0e0, m);
      cx(B, ouro, 3.6, 1.2, 0.2, 0, 12, (MT + 3) / 2 + 0.1, OURO, m);
      for (let k = -4; k <= 4; k++) cx(B, M.ferro, 0.12, 2.6, 0.12, k * 0.95, 8.6, 1.6, 0xffffff, m);
      const nome = ['Portão da Coroa', 'Portão dos Magos', 'Portão das Barcas', 'Portão dos Peregrinos'][AVENIDAS.indexOf(aG)];
      portoes.push({ n: nome, x: px, z: pz, a: aG }); marcos[nome] = new THREE.Vector3(px, 20, pz);
    }
    MURO.forEach(([x, z], k) => {
      if (k % 2 || noRio(x, z, 6)) return;
      const h = 20; cil(B, marmore, 5.2, h, x, 0, z, MARMORE, 18);
      for (let i = 0; i < 12; i++) { const a = i * PI / 6; cx(B, M.pedra, 1.1, 1.2, 0.7, x + Math.cos(a) * 4.8, h + 0.6, z + Math.sin(a) * 4.8, 0xd0c8d8, undefined, -a + PI / 2); }
      cone(B, M.ardosia, 5.8, 8, x, h + 1.2, z, AZUL, 18); cil(B, ouro, 0.25, 3, x, h + 9.1, z, OURO, 6);
      const ang = Math.atan2(z, x), tx = x - Math.cos(ang) * 5.4, tz = z - Math.sin(ang) * 5.4; cx(B, M.aceso, 0.7, 1.0, 0.15, x - Math.cos(ang) * 5.25, 8, z - Math.sin(ang) * 5.25, 0xffffff, undefined, -ang + PI / 2);
      luz(tx, 3.4, tz, 6, 1, 0xff9a48, 12); colCil(x, z, 5.2, h);
    });
  }

  // ---------- os grandes prédios por fora (a casca com interior vem de predios.ts) ----------
  const pr = (id: string) => predios.find(p => p.id === id)!;
  // Palácio: terraço, escadaria, pórtico de colunas com frontão, torres de canto com cúpulas douradas, cúpula central
  {
    const P = pr('v-palacio'), ry = P.ry, m = mtx(P.x, 0, P.z, ry), w = P.w, d = P.d;
    cx(B, marmore, w + 10, 2.4, d + 10, 0, 1.2, 0, 0xd8d0e0, m); colisor(w + 10, 2.4, d + 10, m);
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 10, 0.1, d + 10), new THREE.MeshBasicMaterial({ visible: false })); top.applyMatrix4(m); top.position.y = 2.4; top.userData.ns = 1; G.add(top); floors.push(top);
    for (let k = 0; k < 12; k++) cx(B, M.pedra, 16, 0.2, 0.62, 0, 0.1 + k * 0.2, d / 2 + 5 + 7.4 - k * 0.62, 0xe0d8e8, m);
    const rg = new THREE.PlaneGeometry(16, Math.hypot(2.4, 7.4)); rg.rotateX(-PI / 2); rg.rotateX(-Math.atan2(2.4, 7.4)); rg.translate(0, 1.2, d / 2 + 5 + 3.7); const rp = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); rp.applyMatrix4(m); rp.userData.ns = 1; G.add(rp); floors.push(rp);
    for (let i = 0; i < 8; i++) { const x = -10.5 + i * 3; cil(B, deusa, 0.75, 10, x, 2.4, d / 2 + 3.2, 0xf0eaf4, 14, m); cil(B, ouro, 0.95, 0.5, x, 12.2, d / 2 + 3.2, OURO, 14, m); }
    cx(B, marmore, 25, 1.2, 4.2, 0, 13.0, d / 2 + 2.6, 0xe8e2ee, m);
    { const s = new THREE.Shape([new THREE.Vector2(-13, 0), new THREE.Vector2(13, 0), new THREE.Vector2(0, 4.2)]); const g = new THREE.ExtrudeGeometry(s, { depth: 4.2, bevelEnabled: false }); g.translate(0, 13.6, d / 2 + 0.6); por(BR, marmore, g, 0xe8e2ee, m); cx(BR, ouro, 3, 3, 0.3, 0, 15.2, d / 2 + 4.85, OURO, m); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = sx * (w / 2 + 1.5), z = sz * (d / 2 + 1.5); cil(B, marmore, 4, 22, x, 2.4, z, MARMORE, 18, m); const dm = new THREE.SphereGeometry(4.3, 18, 10, 0, PI * 2, 0, PI / 2); dm.translate(x, 24.4, z); por(BR, ouro, dm, OURO, m); cil(BR, ouro, 0.2, 3.5, x, 28.4, z, OURO, 6, m); const tp = new THREE.Vector3(x, 26, z).applyMatrix4(m); colCil(tp.x, tp.z, 4, 24.4); }
    { cil(BR, marmore, 7.5, 5, 0, 2.4 + 10 + 5.2, -2, MARMORE, 24, m); const dm = new THREE.SphereGeometry(8, 24, 12, 0, PI * 2, 0, PI / 2); dm.translate(0, 22.6, -2); por(BR, ouro, dm, OURO, m); cil(BR, ouro, 0.3, 5, 0, 30.5, -2, OURO, 6, m); }
    for (const s of [-1, 1]) { const v = new THREE.Vector3(s * 9.6, 4.6, d / 2 + 4.8).applyMatrix4(m); luz(v.x, v.y, v.z, 12, 4, 0xffc070, 18, 10); halo(v.x, v.y, v.z, 1.1); cx(B, M.tecido, 2.4, 7, 0.06, s * 15, 9, d / 2 + 0.25, 0x5a3a9a, m); }
    marcos['v-palacio'] = new THREE.Vector3(P.x, 34, P.z);
  }
  // Catedral: duas torres com agulhas, rosácea, contrafortes com pináculos
  {
    const P = pr('v-catedral'), ry = P.ry, m = mtx(P.x, 0, P.z, ry), w = P.w, d = P.d;
    for (const s of [-1, 1]) { const x = s * (w / 2 + 1.5); cx(B, marmore, 5, 28, 5, x, 14, d / 2 - 1, 0xe4dcec, m); cone(BR, M.ardosia, 3.6, 14, x, 28, d / 2 - 1, AZUL, 8, m); cil(BR, ouro, 0.2, 3, x, 42, d / 2 - 1, OURO, 6, m); for (let k = 0; k < 3; k++) cx(B, M.vitral, 1.2, 3.2, 0.1, x, 8 + k * 7, d / 2 + 1.55, 0xffffff, m); const tp = new THREE.Vector3(x, 0, d / 2 - 1).applyMatrix4(m); colisor(5, 28, 5, mtx(tp.x, 0, tp.z, ry)); }
    { const g = new THREE.CircleGeometry(2.6, 24); g.translate(0, 9.5, d / 2 + 0.24); por(B, M.vitral, g, 0xffffff, m); const t = new THREE.TorusGeometry(2.7, 0.25, 6, 28); t.translate(0, 9.5, d / 2 + 0.26); por(B, M.pedra, t, 0xd8d0e0, m); }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = -d / 2 + 3 + i * (d - 8) / 4; cx(B, marmore, 1.6, 9, 2.4, s * (w / 2 + 0.8), 4.5, z, 0xd8d0e0, m); cone(B, marmore, 0.7, 3.4, s * (w / 2 + 0.8), 9, z, 0xd8d0e0, 4, m); }
    cil(BR, ouro, 0.18, 4, 0, 13 + w * 0.42 + 0.2, 0, OURO, 6, m);
    marcos['v-catedral'] = new THREE.Vector3(P.x, 45, P.z);
  }
  // Academia Arcana: torre de luz violeta, cristal no alto, anel flutuante; observatório de cúpula
  {
    const [tx, tz] = polar(0, 64); const h = 58;
    cil(B, marmore, 8.2, h, tx, 0, tz, 0xe0d8f0, 24, undefined, 6.2); cone(B, M.ardosia, 7.4, 12, tx, h, tz, 0x3a2a6a, 24);
    for (let k = 0; k < 10; k++) { const a = k * 1.3, y = 6 + k * 5, r = 8.15 - (y / h) * 2; const g = new THREE.PlaneGeometry(0.9, 2.2); g.translate(0, y, 0); g.rotateY(-a + PI / 2); g.translate(tx + Math.cos(a) * (r + 0.06), 0, tz + Math.sin(a) * (r + 0.06)); por(B, vidro, g, 0xffffff); }
    const cr = new THREE.OctahedronGeometry(2.6, 0); cr.scale(1, 1.8, 1); cr.translate(tx, h + 17, tz); por(B, vidro, cr, 0xffffff);
    const an = new THREE.TorusGeometry(6.5, 0.3, 6, 40); an.rotateX(PI / 2.3); an.translate(tx, h - 6, tz); por(B, vidro, an, 0xffffff);
    halo(tx, h + 17, tz, 9); halo(tx, h - 6, tz, 4); luz(tx, h - 4, tz, 30, 5, 0x9a7cff, 40, 20); luz(tx - 9, 3, tz, 10, 3, 0x9a7cff, 14, 8);
    colCil(tx, tz, 8.2, h); ocup.bloquear(tx, tz, 9.5); marcos.academia = new THREE.Vector3(tx, h + 20, tz);
    const [ox, oz] = polar(-0.42, 66); cil(B, marmore, 6, 9, ox, 0, oz, LILAS, 20); const dm = new THREE.SphereGeometry(6.2, 20, 10, 0, PI * 2, 0, PI / 2); dm.translate(ox, 9, oz); por(BR, M.ardosia, dm, 0x3a2a6a); cx(B, M.ferro, 0.8, 0.8, 7, 0, 13.5, 0, 0xffffff, mtx(ox, 0, oz, 0.6, 1, 1, 1, -0.5)); colCil(ox, oz, 6, 9); ocup.bloquear(ox, oz, 7);
  }
  // Grande Mercado: lajotas, barracas em fileiras, chafariz, carroças
  {
    const [mx, mz] = polar(PI / 2, 70), m = mtx(mx, 0, mz, 0);
    plano(new THREE.PlaneGeometry(30, 22).translate(mx, -mz, 0), pbr('monastery_stone_floor', { size: 3, color: 0xd8ccbc }), 0.035);
    const barraca = (x: number, z: number, ry: number, cor: number) => { const bm = m.clone().multiply(mtx(x, 0, z, ry)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cx(B, M.madeira, 0.1, sz > 0 ? 2.2 : 2.6, 0.1, sx * 1.3, sz > 0 ? 1.1 : 1.3, sz * 0.9, 0x3a2818, bm); const g = new THREE.BoxGeometry(2.9, 0.04, 2.2); g.rotateX(-0.18); g.translate(0, 2.45, 0); g.applyMatrix4(bm); B.add(M.tecido, g, cor); mesa(B, bm, 0, 0.5, 0, 2.4, 0.9); const Pq = peca(B, bm, 0, 0.8, 0.5); for (let i = 0; i < 7; i++) Pq.cx(M.plain, 0.2 + rnd() * 0.15, 0.12 + rnd() * 0.12, 0.2, -1 + i * 0.32, 0.08, (rnd() - 0.5) * 0.4, pick([0x8a3a6a, 0x6a7a3a, 0xd8a040, 0x5a4a30, 0x7a2a9a, 0xc86a2a])); if (rnd() < 0.5) caixote(B, bm, 1.6, -0.6, 0, 0.55); };
    const cores = [0x7a3a9a, 0xd8a838, 0x3a6a9a, 0x5a8a3a, 0xa83a6a, 0xc86a2a];
    let k = 0; for (const z of [-7, -2.5, 3.5, 8]) for (const x of [-11, -6, 6, 11]) barraca(x, z, z < 0 ? 0 : PI, cores[k++ % cores.length]);
    cil(B, M.pedra, 2.6, 0.6, mx, 0, mz, 0xd8d0e0, 20); cil(B, M.agua, 2.3, 0.05, mx, 0.55, mz, 0xffffff, 20); cil(B, ouro, 0.4, 2.0, mx, 0, mz, OURO, 8); colCil(mx, mz, 2.6, 0.6);
    luz(mx, 3, mz, 14, 3, 0xffb060, 18, 10); marcos.mercado = new THREE.Vector3(mx, 6, mz);
    for (let i = 0; i < 10 * Q.props; i++) { const x = mx + (rnd() - 0.5) * 26, z = mz + (rnd() - 0.5) * 18; if (Math.abs(x - mx) < 3 && Math.abs(z - mz) < 3) continue; const t = rnd(); t < 0.4 ? barril(B, new THREE.Matrix4(), x, z) : t < 0.7 ? caixote(B, new THREE.Matrix4(), x, z, 0, 0.6) : sacos(B, new THREE.Matrix4(), x, z, 3); }
  }
  // praças de frente (catedral, academia) e jardim do palácio com jacarandás
  const arvores: { x: number; y: number; z: number; s: number; ry: number }[] = [];
  {
    const lj = pbr('monastery_stone_floor', { size: 3, color: 0xe0d8e4 });
    for (const [a, r, w2, d2] of [[PI, 52.5, 18, 7], [0, 52.5, 16, 7]] as number[][]) { const [x, z] = polar(a, r); plano(new THREE.PlaneGeometry(d2, w2).translate(x, -z, 0), lj, 0.035); }
    const jardim = (a: number, r: number, rr: number) => {
      const [x, z] = polar(a, r); plano(new THREE.CircleGeometry(rr, 32).translate(x, -z, 0), pbr('leafy_grass', { size: 3, color: 0x6a8a4a }), 0.04); ocup.bloquear(x, z, rr);
      cil(B, M.pedra, 1.8, 0.5, x, 0, z, 0xd8d0e0, 16); cil(B, M.agua, 1.6, 0.04, x, 0.47, z, 0xffffff, 16); cil(B, ouro, 0.3, 1.6, x, 0, z, OURO, 8);
      for (let i = 0; i < 9; i++) { const b = (i / 9) * PI * 2 + rnd() * 0.3, d = rr * (0.55 + rnd() * 0.3); arvores.push({ x: x + Math.cos(b) * d, y: 0, z: z + Math.sin(b) * d, s: 0.55 + rnd() * 0.25, ry: rnd() * 6 }); }
      for (let i = 0; i < 24; i++) { const b = (i / 24) * PI * 2; cx(B, M.plain, 1.6, 0.8, 0.7, x + Math.cos(b) * (rr - 0.5), 0.4, z + Math.sin(b) * (rr - 0.5), 0x3a5a2a, undefined, -b); }
    };
    jardim(-2.11, 72, 9.5); jardim(2.62, 66, 8);
  }
  // torres dos nobres com jardins suspensos, ligadas por viadutos
  {
    const tor: THREE.Vector3[] = [];
    for (let a = 0.35; a < PI * 2; a += 0.72) {
      const r = 108, [x, z] = polar(a, r), Bx = caixa(x, z, 9, 9, a);
      if (!ocup.livre(Bx, 1, 8)) continue; ocup.ocupar(Bx);
      const h = 34 + rnd() * 22, m = mtx(x, 0, z, a);
      cx(B, marmore, 7, h, 7, 0, h / 2, 0, tor.length % 2 ? 0xe4dcec : 0xd8d0e4, m); cone(BR, ouro, 5.2, 7, 0, h, 0, OURO, 4, m.clone().multiply(mtx(0, 0, 0, PI / 4)));
      cx(B, M.pedra, 9, 0.8, 9, 0, h * 0.64, 0, 0xd0c8d8, m); for (let k = 0; k < 6; k++) { const g = new THREE.SphereGeometry(0.9 + rnd() * 0.5, 7, 6); g.translate((rnd() - 0.5) * 7, h * 0.64 + 1, (rnd() - 0.5) * 7); por(B, M.plain, g, pick([0x3a6a32, 0x4a7a3a, 0x8a5ab0])); }
      for (let k = 0; k < 9; k++) cx(B, rnd() < 0.5 ? M.aceso : M.escuro, 0.8, 1.4, 0.06, ((k % 3) - 1) * 2, 6 + Math.floor(k / 3) * (h / 3.4), 3.53, 0xffffff, m);
      cx(B, M.tabuas, 1.6, 2.6, 0.1, 0, 1.3, 3.55, 0x3a2618, m);
      colisor(7, h, 7, m); vttWalls.push(cantos(caixa(x, z, 7, 7, a)));
      tor.push(new THREE.Vector3(x, h * 0.64 + 0.4, z));
    }
    for (let i = 0; i < tor.length; i++) { const a = tor[i], b = tor[(i + 1) % tor.length], L = a.distanceTo(b); if (L > 90) continue; const mm = a.clone().add(b).multiplyScalar(0.5), m = mtx(mm.x, Math.min(a.y, b.y), mm.z, Math.atan2(b.x - a.x, b.z - a.z)); cx(B, M.pedra, 2.6, 0.7, L - 8, 0, 0, 0, 0xe0dcec, m); for (const s of [-1, 1]) cx(B, M.pedra, 0.25, 0.9, L - 8, s * 1.2, 0.8, 0, 0xd0ccdc, m); }
  }

  // ---------- casas ----------
  const estiloEm = (x: number, z: number) => { const r = Math.hypot(x, z); if (x > rioX(z)) return 'cais'; if (r < ANEL2.r + 6) return 'nobre'; if (r < ANEL3.r + 4) return rnd() < 0.15 ? 'nobre' : 'media'; return rnd() < 0.25 ? 'media' : 'pobre'; };
  let nCasas = 0;
  for (const rua of ruas) {
    if (Math.hypot(rua.pts[0][0], rua.pts[0][1]) > R_MURO + 4 && Math.hypot(rua.pts[rua.pts.length - 1][0], rua.pts[rua.pts.length - 1][1]) > R_MURO + 4) continue;
    const p = rua.pts, acc = [0]; for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const tot = acc[acc.length - 1];
    const noPonto = (s: number) => { let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const L = acc[i] - acc[i - 1] || 1e-6, f = (s - acc[i - 1]) / L; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f, (p[i][0] - p[i - 1][0]) / L, (p[i][1] - p[i - 1][1]) / L]; };
    for (const lado of [-1, 1]) {
      let s = 1;
      while (s < tot - 3) {
        const [cx0, cz0] = noPonto(s); const est = estiloEm(cx0, cz0);
        const w = est === 'nobre' ? entre(8, 12) : est === 'pobre' ? entre(5, 7.5) : est === 'cais' ? entre(8, 13) : entre(6, 9), d = est === 'nobre' ? entre(10, 14) : est === 'pobre' ? entre(6, 8) : est === 'cais' ? entre(9, 12) : entre(8, 11);
        const [px, pz, tx, tz] = noPonto(s + w / 2), nx = -tz * lado, nz = tx * lado, off = rua.w / 2 + 0.3 + d / 2;
        const x = px + nx * off, z = pz + nz * off, ry = Math.atan2(-nx, -nz), Bx = caixa(x, z, w, d, ry);
        if (ocup.livre(Bx, 0.15, 7) && !resv(x, z, Math.max(w, d) / 2 + 1)) { ocup.ocupar(Bx); casa(x, z, ry, w - 0.06, d, est); nCasas++; s += w + (nCasas % 5 === 0 ? entre(2, 3) : 0.05); }
        else s += 1.5;
      }
    }
  }

  function casa(x: number, z: number, ry: number, w: number, d: number, estilo: string) {
    const m = mtx(x, 0, z, ry), nobre = estilo === 'nobre', pobre = estilo === 'pobre', cais = estilo === 'cais';
    const andares = nobre ? 3 + (rnd() < 0.3 ? 1 : 0) : pobre ? (rnd() < 0.6 ? 1 : 2) : cais ? (rnd() < 0.5 ? 1 : 2) : 2 + (rnd() < 0.4 ? 1 : 0);
    const h0 = nobre ? 3.6 : cais ? 4.4 : 3.1, ha = nobre ? 3.3 : 2.8;
    const cor = nobre ? pick([0xece6f2, 0xe2dae8, 0xd8d0e4, 0xe8e0d4]) : pobre ? pick([0xd8c8a8, 0xc8b8a0, 0xbcae98, 0xd0c0a0]) : cais ? pick([0xb8aa98, 0xa89a88, 0xc0b4a0]) : pick([0xe0d4c0, 0xd8ccd8, 0xe4dccc, 0xd4c8b8, 0xccd0dc]);
    const matP = nobre ? marmore : pobre ? (rnd() < 0.4 ? M.tabuas : M.muro) : rnd() < 0.6 ? M.reboco : M.muro;
    const hTot = h0 + (andares - 1) * ha;
    cx(B, matP, w, hTot, d, 0, hTot / 2, 0, matP === M.tabuas ? pick([0x9a8468, 0x8a7458]) : cor, m);
    // faixas de pedra entre os andares (nobre: friso dourado)
    for (let k = 1; k < andares; k++) { const y = h0 + (k - 1) * ha; cx(B, M.pedra, w + 0.16, 0.22, d + 0.16, 0, y, 0, nobre ? 0xc8c0d0 : 0xb0a898, m); if (nobre && k === 1) cx(B, ouro, w + 0.18, 0.08, 0.06, 0, y + 0.16, d / 2 + 0.1, OURO, m); }
    cx(B, M.pedra, w + 0.2, 0.5, d + 0.2, 0, 0.25, 0, nobre ? 0xc8c0d0 : 0x9a948a, m);
    // janelas (frente e fundos) e porta
    for (let k = 0; k < andares; k++) {
      const y = k === 0 ? 1.6 : h0 + (k - 1) * ha + 1.4, nj = Math.max(1, Math.floor((w - 1.2) / (nobre ? 2.2 : 2)));
      for (let i = 0; i < nj; i++) {
        let xx = -w / 2 + (i + 0.5) * w / nj; if (k === 0 && Math.abs(xx) < 1.1) xx += xx < 0 ? -1.1 : 1.1; if (Math.abs(xx) > w / 2 - 0.6) continue;
        const acesa = rnd() < (nobre ? 0.45 : pobre ? 0.22 : 0.33), hw = nobre ? 0.9 : 0.65, hh = nobre ? 1.6 : 1.0;
        for (const f of [1, -1]) {
          if (f < 0 && rnd() < 0.5) continue;
          cx(B, acesa && f > 0 ? M.aceso : M.escuro, hw, hh, 0.05, xx, y, f * (d / 2 + 0.03), 0xffffff, m);
          cx(B, nobre ? M.pedra : M.madeira, hw + 0.2, 0.12, 0.16, xx, y - hh / 2 - 0.06, f * (d / 2 + 0.06), nobre ? 0xd8d0e0 : 0x3a2a1e, m);
          if (nobre) cx(B, M.pedra, hw + 0.24, 0.14, 0.14, xx, y + hh / 2 + 0.1, f * (d / 2 + 0.06), 0xd8d0e0, m);
          else if (!acesa && rnd() < 0.6) for (const sx of [-1, 1]) cx(B, M.tabuas, hw / 2 + 0.05, hh + 0.05, 0.05, xx + sx * (hw * 0.75 + 0.03), y, f * (d / 2 + 0.06), pick([0x5a6a8a, 0x3a5a4a, 0x6a3a5a, 0x3a2a1e]), m);
        }
        if (nobre && k > 0 && rnd() < 0.35) { cx(B, M.pedra, hw + 0.8, 0.14, 0.8, xx, y - hh / 2 - 0.15, d / 2 + 0.45, 0xd8d0e0, m); for (let b = -2; b <= 2; b++) cx(B, ouro, 0.04, 0.8, 0.04, xx + b * (hw + 0.6) / 4, y - hh / 2 + 0.3, d / 2 + 0.82, OURO, m); }
        else if (!pobre && k > 0 && rnd() < 0.25) { cx(B, M.madeira, hw + 0.2, 0.22, 0.32, xx, y - hh / 2 - 0.05, d / 2 + 0.2, 0x4a3424, m); for (let f2 = 0; f2 < 3; f2++) { const g = new THREE.SphereGeometry(0.12, 5, 4); g.translate(xx - hw / 2 + 0.1 + f2 * hw / 2.5, y - hh / 2 + 0.12, d / 2 + 0.22); por(B, M.plain, g, pick([0xc83a6a, 0x8a5ab0, 0xe8d040, 0xd86a2a]), m); } }
      }
    }
    if (cais) { cx(B, M.tabuas, 2.8, 3.2, 0.1, 0, 1.6, d / 2 + 0.05, 0x4a3424, m); cx(B, M.madeira, 0.15, 0.15, 1.8, 0, hTot + 0.4, d / 2 + 0.6, 0x3a2a1e, m); }
    else { cx(B, M.tabuas, 1.1, 2.2, 0.08, 0, 1.1, d / 2 + 0.05, nobre ? 0x3a2a4a : 0x3a2618, m); cx(B, M.pedra, 1.6, 0.16, 0.6, 0, 0.08, d / 2 + 0.3, 0x9a948a, m); if (nobre) { cx(B, M.pedra, 1.6, 0.25, 0.25, 0, 2.4, d / 2 + 0.12, 0xd8d0e0, m); cx(B, ouro, 0.3, 0.3, 0.06, 0, 2.6, d / 2 + 0.26, OURO, m); } }
    // telhado: ardósia azul (nobre e meio), telha de barro (pobre e cais)
    const mt = nobre || (!pobre && !cais && rnd() < 0.6) ? M.ardosia : M.telha, ct = mt === M.ardosia ? pick([AZUL, 0x4e5a8a, 0x5a6aa0, 0x6a6a8a]) : pick([0xa85a3a, 0x9a4a32, 0xb8643e]);
    const hr = Math.min(w, d) * (nobre ? 0.34 : 0.4) + 0.4;
    if (rnd() < 0.5) telhado(BR, mt, d + 0.05, w + 0.05, hr, hTot, ct, m.clone().multiply(mtx(0, 0, 0, PI / 2)), 0.4, matP, cor);
    else telhado(BR, mt, w + 0.05, d + 0.05, hr, hTot, ct, m, 0.4, matP, cor);
    if (nobre && rnd() < 0.3) { cil(BR, ouro, 0.12, 1.6, 0, hTot + hr, 0, OURO, 6, m); }
    if (!nobre && rnd() < 0.75) { const px = (rnd() < 0.5 ? -1 : 1) * (w / 2 - 0.7), pz = -d / 4, hc = hTot + hr + 0.4; cx(B, M.pedra, 0.7, hc - hTot + 0.6, 0.7, px, hTot - 0.3 + (hc - hTot + 0.6) / 2, pz, 0x8a847a, m); chamines.push(new THREE.Vector3(px, hc + 0.3, pz).applyMatrix4(m)); }
    colisor(w, hTot, d, m);
    vttWalls.push(cantos(caixa(x, z, w, d, ry)));
  }

  // ---------- postes: ferro e vidro nas avenidas e anéis, mais simples nas travessas ----------
  function poste(x: number, z: number, ry: number, rico: boolean) {
    const m = mtx(x, 0, z, ry);
    if (rico) { cx(B, M.ferro, 0.18, 4.2, 0.18, 0, 2.1, 0, 0xffffff, m); cil(B, M.pedra, 0.35, 0.5, 0, 0, 0, 0xd8d0e0, 8, m); cx(B, M.ferro, 0.42, 0.55, 0.42, 0, 4.35, 0, 0xffffff, m); cx(B, M.aceso, 0.32, 0.42, 0.32, 0, 4.35, 0, 0xffffff, m); cone(B, ouro, 0.34, 0.4, 0, 4.62, 0, OURO, 4, m); }
    else { cx(B, M.madeira, 0.16, 3.4, 0.16, 0, 1.7, 0, 0x2a1e14, m); cx(B, M.ferro, 0.05, 0.05, 0.7, 0, 3.25, 0.35, 0xffffff, m); cx(B, M.ferro, 0.26, 0.36, 0.26, 0, 2.95, 0.66, 0xffffff, m); cx(B, M.aceso, 0.18, 0.26, 0.18, 0, 2.95, 0.66, 0xffffff, m); }
    const p = new THREE.Vector3(0, rico ? 4.35 : 2.95, rico ? 0 : 0.66).applyMatrix4(m); lanternas.push(p); halo(p.x, p.y, p.z, rico ? 0.75 : 0.6); luz(p.x, p.y, p.z, 40, 2, 0xffb060, 18, 7);
  }
  for (const r of ruas) {
    if (r.beco) continue;
    const passo = r.w >= 9 ? 15 : r.w >= 6 ? 19 : 26;
    aCada(r.pts, passo).forEach((q, i) => {
      if (noRio(q.x, q.z, 2) || dentroMuro(q.x, q.z) < 6) return;
      const lado = i % 2 ? 1 : -1, tx = q.tx, tz = q.tz;
      const x = q.x - tz * (r.w / 2 + 0.5) * lado, z = q.z + tx * (r.w / 2 + 0.5) * lado;
      if (!ocup.pontoLivre(x, z, 0.3) || resv(x, z, 0.8)) return;
      poste(x, z, Math.atan2(tx, tz), !!r.nobre);
      if (r.w >= 9) { const x2 = q.x + tz * (r.w / 2 + 1.6) * lado, z2 = q.z - tx * (r.w / 2 + 1.6) * lado; if (ocup.pontoLivre(x2, z2, 0.8) && !resv(x2, z2, 2)) arvores.push({ x: x2, y: 0, z: z2, s: 0.5 + rnd() * 0.2, ry: rnd() * 6 }); }
    });
  }
  // jacarandás (lilás, a cor de Valkaria) nas avenidas e jardins
  // (o jacarandá do catálogo tem 65 mil triângulos por árvore: aqui são feitos em código, leves)
  for (const t of arvores) {
    const s = t.s * 1.7, m = mtx(t.x, 0, t.z, t.ry);
    cil(B, M.madeira, 0.22 * s, 3.2 * s, 0, 0, 0, 0x4a3a30, 6, m, 0.14 * s);
    for (let k = 0; k < 4; k++) { const g = new THREE.IcosahedronGeometry((1.3 + rnd() * 0.6) * s, 0); g.scale(1, 0.75, 1); g.translate((rnd() - 0.5) * 2 * s, (3.4 + rnd() * 1.2) * s, (rnd() - 0.5) * 2 * s); por(B, M.plain, g, pick([0x8a6ab8, 0x9a78c8, 0xa888d0, 0x7a5aa8, 0x6a8a4a]), m); }
  }

  // ---------- fora dos muros: barracos ao longo das estradas, hortas ----------
  {
    for (const a of AVENIDAS) for (let r = R_MURO + 12; r < R_MURO + 120; r += entre(9, 14)) for (const lado of [-1, 1]) {
      if (rnd() < 0.3) continue;
      const [px, pz] = polar(a, r), nx = -Math.sin(a) * lado, nz = Math.cos(a) * lado, off = 6 + 0.3 + 3.5, x = px + nx * off, z = pz + nz * off;
      if (noRio(x, z, 4)) continue;
      const w = entre(4.5, 6.5), d = entre(5, 7), ry = Math.atan2(-nx, -nz), m = mtx(x, 0, z, ry + (rnd() - 0.5) * 0.06);
      cx(B, M.tabuas, w, 2.6, d, 0, 1.3, 0, pick([0x8a7458, 0x9a8468, 0x7a6448]), m); telhado(BR, M.telha, w + 0.05, d + 0.05, 1.3, 2.6, pick([0x8a5a3a, 0x7a4a32]), m, 0.3, M.tabuas, 0x8a7458); cx(B, M.escuro, 1, 1.9, 0.06, 0, 0.95, d / 2 + 0.04, 0xffffff, m);
      colisor(w, 2.6, d, m);
    }
  }

  // ---------- objetos de rua ----------
  {
    const I = new THREE.Matrix4();
    for (let i = 0; i < 260 * Q.props; i++) {
      const r = pick(ruas); if (r.nobre && rnd() < 0.6) continue; const q = pick(r.pts), lado = rnd() < 0.5 ? -1 : 1, a = rnd() * PI * 2;
      const x = q[0] + Math.cos(a) * (r.w / 2 + 0.7) * lado, z = q[1] + Math.sin(a) * (r.w / 2 + 0.7) * lado;
      if (!ocup.pontoLivre(x, z, 0.4) || resv(x, z, 0.6) || Math.hypot(x, z) < PRACA_R + 2) continue;
      const t = rnd(); t < 0.4 ? barril(B, I, x, z) : t < 0.75 ? caixote(B, I, x, z, 0, 0.5 + rnd() * 0.3) : sacos(B, I, x, z, 3);
    }
  }

  // ---------- montagem ----------
  B.build(G); BR.build(roofs); G.add(roofs);
  let n = 0; colGeo.forEach(g => (n += g.attributes.position.count));
  const cp = new Float32Array(n * 3); let o = 0; colGeo.forEach(g => { cp.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3; });
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.computeBoundingSphere(); cg.computeBoundingBox();
  const colliders = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); colliders.userData.ns = 1; colliders.userData.noExport = 1; G.add(colliders);
  void nCasas;
  return { floors, colliders, roofs, chamines, vttWalls, lanternas, ruas, portoes, marcos };
}
