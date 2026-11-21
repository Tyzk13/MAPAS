// Tiberus — a capital dos minotauros: castro tapista em grade dentro de muralhas maciças (portões nos quatro eixos),
// cardo e decúmano com colunatas e braseiros, o fórum (Templo de Tauron no pódio, o colosso de bronze, a rostra, arco
// do triunfo, estátuas, fontes), a arena (anfiteatro com arcadas, arquibancadas e areia), termas, quartéis com campo
// de treino, mercado de escravos e gado, ínsulas de tijolo com lojas, casas ricas de travertino perto do fórum,
// aqueduto chegando do norte e a necrópole ao longo da estrada do sul (terror sutil).
import * as THREE from 'three';
import { pbr } from '../../core/pbr';
import { halo } from '../../core/kit';
import { MAT, mtx, por, cx, cil, cone, telhado } from '../barud/common';
import { barril, caixote, sacos, mesa, peca } from '../barud/mobilia';
import { type Predio } from '../barud/edificios';
import {
  type Ctx, type Estilo, type V, PI, rnd, entre, pick, caixa, novaCidade, colisor, colCil, chao, forma, pisoInvisivel, rampa, rua, desenharRuas,
  casasNasRuas, preencher, postesNasRuas, poste, arvore, objetosDeRua, muralha, terminar, luz,
} from '../gente/kit';
import { minotauro } from './predios';

export const L = 150; // meia largura do castro
const TRAV = 0xd8ccb4, VERM = 0x8a1a14, BRONZE = 0x9a6a3a;
export const FORUM = { x: 0, z: 0, w: 80, d: 60 };
export const ARENA = { x: 70, z: -70, rx: 38, rz: 30 };
export const MERCADO = { x: -80, z: 92, w: 30, d: 26 };
export const CAMPO = { x: -74, z: -98, w: 34, d: 20 };

export async function construirTiberus(G: THREE.Group, predios: Predio[]) {
  const M = MAT();
  const reservados = predios.map(p => {
    const fx = Math.sin(p.ry), fz = Math.cos(p.ry);
    if (p.id === 't-templo') return { id: p.id, B: caixa(p.x, p.z + 3, p.w + 8, p.d + 12, p.ry) };
    return { id: p.id, B: caixa(p.x + fx * 1.2, p.z + fz * 1.2, p.w + 2, p.d + 3.4, p.ry) };
  });
  reservados.push({ id: 'forum', B: caixa(FORUM.x, FORUM.z, FORUM.w, FORUM.d, 0) }, { id: 'arena', B: caixa(ARENA.x, ARENA.z, ARENA.rx * 2 + 4, ARENA.rz * 2 + 4, 0) },
    { id: 'mercado', B: caixa(MERCADO.x, MERCADO.z, MERCADO.w, MERCADO.d, 0) }, { id: 'campo', B: caixa(CAMPO.x, CAMPO.z, CAMPO.w, CAMPO.d, 0) }, { id: 'castelo-agua', B: caixa(-40, -110, 12, 12, 0) },
    { id: 'arco', B: caixa(0, 34, 22, 6, 0) });
  const c = novaCidade(G, { dentro: (x, z, m) => Math.abs(x) < L - m && Math.abs(z) < L - m, reservados });
  const { marmore, ouro } = c, B = c.B, BR = c.BR;
  const marcos: Record<string, THREE.Vector3> = {};

  // ---------- chão ----------
  chao(c, new THREE.PlaneGeometry(700, 700), pbr('leafy_grass', { size: 5, color: 0x8a8a5a }), -0.03);
  chao(c, new THREE.PlaneGeometry(L * 2, L * 2), pbr('gravel_floor_02', { size: 4, color: 0xc8b8a0 }), 0.0);
  chao(c, new THREE.PlaneGeometry(FORUM.w, FORUM.d), pbr('monastery_stone_floor', { size: 3.4, color: 0xe0d4bc }), 0.035);

  // ---------- muralha e portões ----------
  const pol: V[] = [[-L, -L], [L, -L], [L, L], [-L, L]];
  const portoes = muralha(c, pol, [[0, -L], [L, 0], [0, L], [-L, 0]], {
    h: 12, t: 5, cor: 0xb8ac98, ameia: 0x8a7e6e, torre: { lado: 10, h: 17 }, portao: { larg: 8, h: 20, cor: 0xa89c88 }, estandarte: VERM,
  });
  const nomesP = ['Porta Norte (do Aqueduto)', 'Porta Leste', 'Porta Triunfal (sul)', 'Porta Oeste'];
  portoes.forEach((p, i) => { marcos[nomesP[i] ?? 'Porta'] = new THREE.Vector3(p.x, 24, p.z); });
  for (const s of [-1, 1]) minotauro(B, mtx(0, 0, 0, 0), s * 13, L + 9, 13, PI, 0x8a8278, M.pedra);

  // ---------- ruas: cardo e decúmano largos, grade de ruas de 32 m, estradas fora ----------
  rua(c, 'Cardo Máximo', [[0, -L - 230], [0, L + 230]], 14, { fora: true, nobre: true });
  rua(c, 'Decúmano Máximo', [[-L - 230, 0], [L + 230, 0]], 14, { fora: true, nobre: true });
  const linhas = [-128, -96, -64, -32, 32, 64, 96, 128];
  for (const v of linhas) { rua(c, `Rua ${v < 0 ? 'Norte' : 'Sul'} ${Math.abs(v)}`, [[-L + 6, v], [L - 6, v]], 6); rua(c, `Rua ${v < 0 ? 'Oeste' : 'Leste'} ${Math.abs(v)}`, [[v, -L + 6], [v, L - 6]], 6); }
  for (const v of [-112, 112, -141, 141]) rua(c, 'Travessa', [[-L + 6, v], [L - 6, v]], 4.5, { beco: true });
  for (const v of [-112, 112, -141, 141]) rua(c, 'Travessa', [[v, -L + 6], [v, L - 6]], 4.5, { beco: true });
  for (const v of [-80, -48, 48, 80]) { rua(c, 'Viela', [[-L + 6, v], [L - 6, v]], 3.6, { beco: true }); rua(c, 'Viela', [[v, -L + 6], [v, L - 6]], 3.6, { beco: true }); }
  desenharRuas(c, { corPonte: 0xb8ac98 });

  // ---------- fórum: colosso, rostra, arco do triunfo, estátuas, fontes, colunatas ----------
  {
    minotauro(B, mtx(0, 0, 0, 0), 0, 2, 26, 0, BRONZE); colCil(c, 0, 2, 5, 6); halo(0, 22, 2, 5); luz(0, 4, 10, 30, 5, 0xffb060, 26, 16);
    // rostra (palanque dos oradores) com proas de bronze
    { const m = mtx(0, 0, 20, PI); cx(B, M.pedra, 14, 2.6, 5, 0, 1.3, 0, TRAV, m); for (let i = -2; i <= 2; i++) { const g = new THREE.ConeGeometry(0.5, 1.6, 6); g.rotateX(PI / 2); g.translate(i * 2.6, 1.6, 3); por(B, M.plain, g, BRONZE, m); } for (let k = 0; k < 6; k++) cx(B, M.pedra, 3, 0.22, 0.4, 0, 0.11 + k * 0.22 * 1.95, -2.5 - 2.4 + k * 0.4, TRAV, m); colisor(c, 14, 2.6, 5, m); pisoInvisivel(c, 14, 5, m, 2.6); rampa(c, 3, -4.9, -2.5, 2.6, m); }
    for (const [x, z] of [[-34, -24], [34, -24], [-34, 24], [34, 24], [-34, 0], [-17, 26], [17, 26]] as V[]) { minotauro(B, mtx(0, 0, 0, 0), x, z, 4.6, Math.atan2(-x, -z), 0xd8d0c0, marmore); colisor(c, 2, 5, 2, mtx(x, 0, z)); }
    for (const x of [-24, 24]) { cil(B, M.pedra, 3.6, 0.8, x, 0, 12, TRAV, 24); cil(B, M.agua, 3.2, 0.05, x, 0.75, 12, 0xffffff, 24); minotauro(B, mtx(0, 0, 0, 0), x, 12, 3, PI, BRONZE); colCil(c, x, 12, 3.6, 0.8); }
    // colunatas nos lados norte (frente do templo) e sul
    for (const z of [-28.5, 28.5]) for (let x = -38; x <= 38; x += 4) { if (Math.abs(x) < (z < 0 ? 15 : 9)) continue; cil(B, marmore, 0.45, 7, x, 0, z, 0xe8e0d0, 12); colCil(c, x, z, 0.45, 7); }
    for (const z of [-28.5, 28.5]) for (const s of [-1, 1]) { const w0 = z < 0 ? 15 : 9, w = 38.5 - w0 + 0.5; cx(BR, marmore, w, 0.9, 1.6, s * (w0 + w / 2 - 0.5), 7.45, z, TRAV); }
    // arco do triunfo atravessando o cardo no sul do fórum
    { const m = mtx(0, 0, 34, 0); for (const s of [-1, 1]) { cx(B, marmore, 5, 14, 5, s * 8, 7, 0, 0xe0d8c8, m); colisor(c, 5, 14, 5, m.clone().multiply(mtx(s * 8, 0, 0))); cil(B, marmore, 0.5, 11, s * 8 + s * 2.9, 0, 2.6, 0xe8e0d0, 10, m); cil(B, marmore, 0.5, 11, s * 8 + s * 2.9, 0, -2.6, 0xe8e0d0, 10, m); }
      cx(B, marmore, 21, 4.5, 5.4, 0, 16.25, 0, 0xe0d8c8, m); const ab = new THREE.CylinderGeometry(5.5, 5.5, 5.2, 18, 1, true, 0, PI); ab.rotateZ(PI / 2); ab.translate(0, 11, 0); por(B, marmore, ab, 0xd8d0c0, m);
      cx(B, M.plain, 6, 1.8, 0.1, 0, 16.3, 2.75, BRONZE, m); cx(B, M.plain, 6, 1.8, 0.1, 0, 16.3, -2.75, BRONZE, m); minotauro(B, mtx(0, 18.5, 34, 0), 0, 0, 5, PI, BRONZE); marcos.arco = new THREE.Vector3(0, 26, 34); }
    for (const [x, z] of [[-38, -28], [38, -28], [-38, 28], [38, 28], [-12, 28], [12, 28]] as V[]) poste(c, x, z, 0, 'braseiro');
    marcos.forum = new THREE.Vector3(0, 32, 2);
  }

  // ---------- Templo de Tauron por fora: pódio, escadaria, pórtico de colunas, frontão, touro no topo ----------
  {
    const p = predios.find(q => q.id === 't-templo')!, m = mtx(p.x, 0, p.z, p.ry), base = p.base ?? 3;
    cx(B, marmore, p.w + 4, base, p.d + 4, 0, base / 2, 0, 0xd8ccb8, m); colisor(c, p.w + 4, base, p.d + 4, m); pisoInvisivel(c, p.w + 4, p.d + 4, m, base);
    const z0 = p.d / 2 + 2, nd = 15; for (let k = 0; k < nd; k++) cx(B, marmore, 16, 0.2, 0.42, 0, 0.1 + k * 0.2, z0 + (nd - k) * 0.42 - 0.21, 0xe0d4c0, m);
    rampa(c, 16, z0 + nd * 0.42, z0, base, m);
    for (let i = 0; i < 6; i++) { const x = -10 + i * 4; cil(B, marmore, 0.8, 11, x, base, p.d / 2 + 1.2, 0xece4d4, 16, m); cil(B, ouro, 1.0, 0.5, x, base + 10.7, p.d / 2 + 1.2, 0xd8b048, 16, m); }
    cx(B, marmore, 24.5, 1.6, 3.2, 0, base + 11.9, p.d / 2 + 1.2, 0xe0d8c8, m);
    { const s = new THREE.Shape([new THREE.Vector2(-12.5, 0), new THREE.Vector2(12.5, 0), new THREE.Vector2(0, 4.8)]); const g = new THREE.ExtrudeGeometry(s, { depth: 3.2, bevelEnabled: false }); g.translate(0, base + 12.7, p.d / 2 - 0.4); por(BR, marmore, g, 0xe0d8c8, m); }
    for (const s of [-1, 1]) { const v = new THREE.Vector3(s * 9, base + 1.2, p.d / 2 + 2.4).applyMatrix4(m); luz(v.x, v.y, v.z, 14, 5, 0xff8a3a, 16, 10); halo(v.x, v.y, v.z, 1.0); poste(c, v.x, v.z, 0, 'braseiro'); }
    marcos['t-templo'] = new THREE.Vector3(p.x, 30, p.z);
  }
  // touro dourado no alto do frontão
  { const p = predios.find(q => q.id === 't-templo')!; minotauro(BR, mtx(p.x, (p.base ?? 3) + 17.4, p.z + p.d / 2 + 1, 0), 0, 0, 3.2, 0, 0xd8b048, ouro); }

  // ---------- termas por fora: cúpulas ----------
  { const p = predios.find(q => q.id === 't-termas')!, m = mtx(p.x, 0, p.z, p.ry); for (const [x, r] of [[-7, 5], [8, 4]]) { const d = new THREE.SphereGeometry(r, 18, 10, 0, PI * 2, 0, PI / 2); d.translate(x, p.h + p.w * 0.36 * 0 + 0.2, 0); por(BR, marmore, d, 0xd8ccb8, m); } }

  // ---------- arena: anfiteatro com arcadas, arquibancada em degraus, areia ----------
  {
    const { x: ax, z: az, rx, rz } = ARENA, H = 22, N = 56;
    const pt = (t: number, k = 1): V => [ax + Math.cos(t) * rx * k, az + Math.sin(t) * rz * k];
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * PI * 2, t1 = ((i + 1) / N) * PI * 2, [x0, z0] = pt(t0), [x1, z1] = pt(t1), Lg = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0) - PI / 2, m = mtx((x0 + x1) / 2, 0, (z0 + z1) / 2, a);
      const portao = i === 0 || i === N / 2 || i === N - 1 || i === N / 2 - 1;
      if (!portao) { cx(B, M.pedra, Lg + 0.1, H, 2.6, 0, H / 2, 0, 0xc8b8a0, m); colisor(c, Lg, H, 2.6, m); }
      else { cx(B, M.pedra, Lg + 0.1, H - 7, 2.6, 0, 7 + (H - 7) / 2, 0, 0xc8b8a0, m); }
      for (let k = 0; k < 3; k++) cx(B, M.escuro, Lg * 0.55, k === 2 ? 3 : 4.6, 0.1, 0, 3 + k * 6.6 + (portao && k === 0 ? 100 : 0), -1.31, 0xffffff, m);
      for (let k = 1; k < 4; k++) cx(B, M.pedra, Lg + 0.2, 0.5, 2.9, 0, k * 6.6 - 0.4, 0, 0xb0a088, m);
      // arquibancada: 6 degraus do muro até o pódio (uma pegada de cada degrau é piso)
      for (let k = 0; k < 6; k++) { const f = 0.94 - k * 0.055, [u0, w0] = pt(t0, f), [u1, w1] = pt(t1, f), L2 = Math.hypot(u1 - u0, w1 - w0), a2 = Math.atan2(u1 - u0, w1 - w0) - PI / 2, mm = mtx((u0 + u1) / 2, 0, (w0 + w1) / 2, a2); const hh = 14 - k * 2.2; cx(B, M.pedra, L2 + 0.2, hh, 2.2, 0, hh / 2, 0, k % 2 ? 0xb8a890 : 0xc8b8a0, mm); }
    }
    const areia = new THREE.Shape(); for (let i = 0; i <= 48; i++) { const [x, z] = pt((i / 48) * PI * 2, 0.6); i ? areia.lineTo(x, -z) : areia.moveTo(x, -z); }
    chao(c, new THREE.ShapeGeometry(areia, 4), pbr('sandy_gravel', { size: 3, color: 0xe0c8a0 }), 0.05);
    for (let i = 0; i < 40; i++) { const t = (i / 40) * PI * 2, [x0, z0] = pt(t, 0.61), [x1, z1] = pt(t + PI * 2 / 40, 0.61), Lg = Math.hypot(x1 - x0, z1 - z0), m = mtx((x0 + x1) / 2, 0, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0) - PI / 2); if (i === 0 || i === 20) continue; cx(B, M.pedra, Lg + 0.1, 3.4, 0.8, 0, 1.7, 0, 0x9a8a78, m); colisor(c, Lg, 3.4, 0.8, m); }
    for (const t of [PI * 0.5, PI * 1.5]) { const [x, z] = pt(t, 0.63); const m = mtx(x, 3.4, z, t > PI ? 0 : PI); cx(B, M.pedra, 6, 2, 2.4, 0, 1, 0, 0xc8b8a0, m); cx(B, M.tecido, 6, 1.6, 0.05, 0, 2.6, 1.3, VERM, m); }
    for (let i = 0; i < 8; i++) { const [x, z] = pt((i / 8) * PI * 2 + 0.2, 0.62); poste(c, x, z, 0, 'braseiro'); }
    for (let i = 0; i < 12; i++) { const [x, z] = pt((i / 12) * PI * 2, 1.02); cil(B, M.madeira, 0.15, 6, x, H, z, 0x4a3424, 6); cx(B, M.tecido, 0.05, 2.4, 1.6, x, H + 4.4, z, VERM, mtx(0, 0, 0, 0)); }
    marcos.arena = new THREE.Vector3(ax, 34, az);
  }

  // ---------- quartéis: campo de treino com postes, paliçada e estandartes ----------
  {
    const { x, z, w, d } = CAMPO; chao(c, new THREE.PlaneGeometry(w, d).translate(x, -z, 0), pbr('sandy_gravel', { size: 3, color: 0xd0bc98 }), 0.04);
    for (let i = 0; i < 10; i++) { const m = mtx(x - w / 2 + 3 + (i % 5) * 7, 0, z - 4 + ((i / 5) | 0) * 8); cil(B, M.madeira, 0.2, 1.9, 0, 0, 0, 0x5a4030, 6, m); cx(B, M.madeira, 1.2, 0.18, 0.18, 0, 1.4, 0, 0x5a4030, m); }
    for (let k = 0; k < 3; k++) { const m = mtx(x + w / 2 - 4, 0, z - 6 + k * 6); cil(B, M.madeira, 0.08, 4.5, 0, 0, 0, 0x3a2418, 6, m); cx(B, M.tecido, 1.3, 1.6, 0.04, 0, 3.4, 0, VERM, m); const g = new THREE.SphereGeometry(0.28, 8, 6); g.translate(0, 4.6, 0); por(B, ouro, g, 0xd8b048, m); }
    for (const s of [-1, 1]) for (let u = -w / 2; u <= w / 2; u += 0.5) cil(B, M.madeira, 0.13, 2.2 + rnd() * 0.3, x + u, 0, z + s * (d / 2 + 0.3), 0x6a5038, 5);
    marcos.campo = new THREE.Vector3(x, 8, z);
  }
  // casernas extras (só por fora) ao lado do quartel
  for (const zz of [-34, -86]) { const m = mtx(-74, 0, zz - 0, PI / 2); cx(B, M.pedra, 28, 4, 10, 0, 2, 0, 0xb8ac98, m); telhado(BR, M.telha, 28, 10, 2.6, 4, 0xa0502e, m, 0.4, M.pedra, 0xb8ac98); for (let i = 0; i < 8; i++) cx(B, M.escuro, 0.6, 0.9, 0.05, -12 + i * 3.4, 2.6, 5.03, 0xffffff, m); colisor(c, 28, 4, 10, m); c.ocup.ocupar(caixa(-74, zz, 10, 28, 0)); }

  // ---------- mercado de escravos e gado: estrado do leilão, jaulas, currais, barracas ----------
  {
    const { x, z, w, d } = MERCADO; chao(c, new THREE.PlaneGeometry(w, d).translate(x, -z, 0), pbr('dry_ground_rocks', { size: 4, color: 0xa89878 }), 0.04);
    { const m = mtx(x, 0, z - 6, 0); cx(B, M.tabuas, 8, 1.4, 5, 0, 0.7, 0, 0x5a4030, m); for (let k = 0; k < 5; k++) cx(B, M.tabuas, 2.4, 0.28, 0.4, 0, 0.14 + k * 0.28, 2.5 + 2 - k * 0.4, 0x5a4030, m); colisor(c, 8, 1.4, 5, m); pisoInvisivel(c, 8, 5, m, 1.4); rampa(c, 2.4, 4.5, 2.5, 1.4, m); cil(B, M.madeira, 0.12, 3.6, -3.4, 1.4, -2, 0x3a2418, 6, m); cil(B, M.madeira, 0.12, 3.6, 3.4, 1.4, -2, 0x3a2418, 6, m); cx(B, M.madeira, 7.2, 0.2, 0.2, 0, 4.9, -2, 0x3a2418, m); for (const s of [-1, 1]) { const v = new THREE.Vector3(s * 3.4, 3.2, -1.8).applyMatrix4(m); luz(v.x, v.y, v.z, 8, 3, 0xff8a3a, 10, 6); halo(v.x, v.y, v.z, 0.6); } }
    for (let i = 0; i < 4; i++) { const m = mtx(x - 11 + i * 5.5, 0, z + 6, 0); cx(B, M.madeira, 4, 0.2, 3, 0, 0.1, 0, 0x4a3424, m); cx(B, M.madeira, 4, 0.2, 3, 0, 2.6, 0, 0x4a3424, m); for (let k = 0; k <= 12; k++) { const u = -2 + (k / 12) * 4; cx(B, M.ferro, 0.06, 2.5, 0.06, u, 1.35, 1.5, 0xffffff, m); cx(B, M.ferro, 0.06, 2.5, 0.06, u, 1.35, -1.5, 0xffffff, m); } for (const s of [-1, 1]) for (let k = 0; k <= 8; k++) cx(B, M.ferro, 0.06, 2.5, 0.06, s * 2, 1.35, -1.5 + k * 3 / 8, 0xffffff, m); colisor(c, 4, 2.6, 3, m); }
    for (const [cx0, cz0] of [[x + 10, z - 8], [x + 10, z + 4]] as V[]) { for (let u = -4; u <= 4; u += 1) for (const s of [-1, 1]) cx(B, M.madeira, 0.1, 1.2, 0.1, cx0 + u, 0.6, cz0 + s * 3, 0x5a4030); for (const s of [-1, 1]) cx(B, M.madeira, 8, 0.1, 0.1, cx0, 1.0, cz0 + s * 3, 0x5a4030); for (let k = 0; k < 4; k++) { const P = peca(B, new THREE.Matrix4(), cx0 + (rnd() - 0.5) * 6, 0, cz0 + (rnd() - 0.5) * 4, rnd() * 6); P.cx(M.plain, 0.6, 0.7, 1.6, 0, 0.9, 0, pick([0x3a2a20, 0x5a4030, 0x8a7a6a])); P.cx(M.plain, 0.3, 0.35, 0.5, 0, 1.2, 0.9, 0x3a2a20); } }
    for (let i = 0; i < 6; i++) { const t = rnd(), xx = x - 13 + rnd() * 26, zz = z - 11 + rnd() * 4; t < 0.5 ? barril(B, new THREE.Matrix4(), xx, zz) : sacos(B, new THREE.Matrix4(), xx, zz, 3); }
    marcos.mercado = new THREE.Vector3(x, 8, z);
  }

  // ---------- aqueduto: arcos em dois andares chegando do norte até o castelo d'água ----------
  {
    const ax = -40, hTop = 16;
    for (let z = -L - 2; z > -340; z -= 8) { cx(B, M.pedra, 2.2, hTop, 2.4, ax, hTop / 2, z, 0xc0b4a0); cx(B, M.pedra, 2.6, 1.4, 8.1, ax, hTop + 0.7, z - 4, 0xb8ac98); colisor(c, 2.2, hTop, 2.4, mtx(ax, 0, z));
      for (const [yc, r] of [[hTop - 3, 2.9], [7.2, 2.9]]) { const g = new THREE.CylinderGeometry(r + 0.6, r + 0.6, 2.2, 14, 1, false, 0, PI); g.rotateZ(PI / 2); g.rotateY(PI / 2); g.translate(ax, yc, z - 4); const h2 = new THREE.CylinderGeometry(r, r, 2.4, 14, 1, false, 0, PI); void h2; por(B, M.pedra, g, 0xb8ac98); cx(B, M.pedra, 2.2, 0.9, 8.1, ax, yc + r + 0.3, z - 4, 0xb8ac98); } }
    cx(B, M.agua, 1.2, 0.05, 340 - L, ax, hTop + 1.45, -(340 + L) / 2, 0xffffff);
    cx(B, M.pedra, 2.6, 1.4, 16, ax, hTop + 0.7, -L + 6, 0xb8ac98);
    { const m = mtx(ax, 0, -110, 0); cx(B, M.pedra, 9, hTop + 2, 9, 0, (hTop + 2) / 2, 0, 0xb8ac98, m); cone(BR, M.telha, 7, 4, 0, hTop + 2, 0, 0xa0502e, 4, m.clone().multiply(mtx(0, 0, 0, PI / 4))); cx(B, M.escuro, 1.2, 2.2, 0.1, 0, 1.1, 4.55, 0xffffff, m); colisor(c, 9, hTop + 2, 9, m); marcos['castelo-agua'] = new THREE.Vector3(ax, hTop + 8, -110); }
  }

  // ---------- necrópole na estrada do sul (fora dos muros): mausoléus, estelas, ciprestes, velas ----------
  {
    for (let z = L + 24; z < 320; z += entre(9, 14)) for (const s of [-1, 1]) {
      if (rnd() < 0.2) continue; const x = s * (7 + 3 + entre(2, 6)), m = mtx(x, 0, z, s > 0 ? -PI / 2 : PI / 2);
      if (rnd() < 0.35) { const w = entre(3, 5), h = entre(3, 6); cx(B, M.pedra, w, h, w, 0, h / 2, 0, pick([0xb8ac98, 0xa89c88, 0xc8bca8]), m); cone(B, M.pedra, w * 0.75, h * 0.6, 0, h, 0, 0xa89c88, 4, m.clone().multiply(mtx(0, 0, 0, PI / 4))); cx(B, M.escuro, 0.9, 1.7, 0.05, 0, 0.85, w / 2 + 0.03, 0xffffff, m); colisor(c, w, h, w, m); if (rnd() < 0.3) { const v = new THREE.Vector3(0.6, 0.3, w / 2 + 0.3).applyMatrix4(m); cil(B, M.plain, 0.05, 0.25, v.x, 0, v.z, 0xe8dcc0, 6); halo(v.x, 0.35, v.z, 0.2); } }
      else for (let k = 0; k < 3; k++) cx(B, M.pedra, 0.6, 1.2 + rnd() * 0.6, 0.18, (k - 1) * 1.2, 0.6, (rnd() - 0.5) * 1.5, 0x9a9080, m, (rnd() - 0.5) * 0.2);
      if (rnd() < 0.4) arvore(c, x + s * 3, z + 2, 0.8, [0x2a4a2a, 0x334d2e], 'cipreste');
    }
    luz(10, 1.2, L + 70, 4, 1, 0x9ab4d8, 8, 4); marcos.necropole = new THREE.Vector3(0, 10, L + 80);
  }
  // ciprestes e oliveiras fora dos muros
  for (let i = 0; i < 70; i++) { const a = rnd() * PI * 2, r = L + 20 + rnd() * 160, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 14 || Math.abs(z) < 14 || Math.abs(x + 40) < 6) continue; arvore(c, x, z, 0.8 + rnd() * 0.4, rnd() < 0.5 ? [0x2a4a2a, 0x334d2e] : [0x6a7a4a, 0x7a8a5a, 0x5a6a3a], rnd() < 0.5 ? 'cipreste' : 'redonda'); }

  // ---------- colunatas do cardo e do decúmano (pórticos com braseiros) ----------
  for (const r of c.ruas) {
    if (r.w < 14) continue;
    for (const lado of [-1, 1]) {
      let ult: V | null = null;
      for (let s = 0; s < r.pts.length; s += 3) {
        const p = r.pts[s], q = r.pts[Math.min(r.pts.length - 1, s + 1)], tx = q[0] - p[0], tz = q[1] - p[1], Lq = Math.hypot(tx, tz) || 1, x = p[0] - tz / Lq * (r.w / 2 + 1.2) * lado, z = p[1] + tx / Lq * (r.w / 2 + 1.2) * lado;
        if (!c.dentro(x, z, 8) || !c.ocup.pontoLivre(x, z, 0.5)) { ult = null; continue; }
        cil(B, marmore, 0.35, 5, x, 0, z, 0xe0d8c8, 10); colCil(c, x, z, 0.35, 5);
        if (ult && Math.hypot(ult[0] - x, ult[1] - z) < 5) { const a = Math.atan2(x - ult[0], z - ult[1]), m = mtx((x + ult[0]) / 2, 5.2, (z + ult[1]) / 2, a); cx(BR, marmore, 0.6, 0.5, Math.hypot(ult[0] - x, ult[1] - z) + 0.4, 0, 0, 0, TRAV, m); }
        ult = [x, z];
      }
    }
  }

  // ---------- casas: casas ricas de travertino perto do fórum, ínsulas de tijolo, casas pobres perto do muro ----------
  const tijolo = pbr('red_brick', { size: 2 }), tij = (() => { const t = (tijolo as THREE.MeshStandardMaterial).clone(); t.vertexColors = true; return t; })();
  const insula: Estilo = { andares: [3, 5], h0: 3.4, ha: 3.0, parede: [tij, M.muro], cores: [0xe0a080, 0xd09070, 0xc88a68, 0xd8a888], base: 0x8a7a6a, friso: 0xd8ccb4,
    telhado: { mat: M.telha, cores: [0xa8502e, 0x9a4a2a, 0xb85a34], fator: 0.28 }, janela: { w: 0.8, h: 1.1, acesa: 0.3, moldura: 0xd8ccb4, venezianas: [0x6a3a2a, 0x3a4a3a, 0x5a2a2a] },
    toldo: { prob: 0.45, cores: [VERM, 0xc8a040, 0x8a6a4a, 0x3a5a2a] }, floreira: 0.15, sacada: 0.08, chamine: 0.4 };
  const rica: Estilo = { andares: [1, 2], h0: 4.2, ha: 3.4, parede: [marmore], cores: [0xe8dcc4, 0xe0d4bc, 0xf0e4cc], base: 0xa89a88, friso: 0xc8bca8,
    telhado: { mat: M.telha, cores: [0xa8502e, 0xb85a34] , fator: 0.26 }, janela: { w: 1.0, h: 1.6, acesa: 0.4, moldura: 0xd8ccb4 }, sacada: 0.2, chamine: 0.3, porta: 0x4a2418 };
  const pobre: Estilo = { andares: [1, 2], h0: 3, ha: 2.7, parede: [M.tabuas, M.muro], cores: [0xc8a888, 0xb8987a, 0xd0b090], telhado: { mat: M.telha, cores: [0x8a5a3a, 0x7a4a30] },
    janela: { w: 0.6, h: 0.9, acesa: 0.2, venezianas: [0x3a2a1e] }, chamine: 0.7, tosco: true };
  const escolher = (x: number, z: number) => { const r = Math.max(Math.abs(x), Math.abs(z)); return r < 52 ? { e: rica, w: [9, 13] as [number, number], d: [9, 12] as [number, number] } : r < 120 ? { e: insula, w: [9, 14] as [number, number], d: [8, 11] as [number, number] } : { e: rnd() < 0.5 ? pobre : insula, w: [6, 9] as [number, number], d: [7, 10] as [number, number] }; };
  casasNasRuas(c, escolher, { muro: 7 });
  preencher(c, 2500, [-L + 8, L - 8, -L + 8, L - 8], (x, z) => { const e = escolher(x, z); return { ...e, w: [e.w[0] * 0.7, e.w[1] * 0.8] as [number, number], d: [e.d[0] * 0.7, e.d[1] * 0.8] as [number, number] }; }, () => (rnd() < 0.5 ? 0 : PI / 2), 7);
  postesNasRuas(c, r => (r.w >= 14 ? 'braseiro' : r.beco ? null : 'madeira'));
  objetosDeRua(c, 240, (x, z) => Math.abs(x) > FORUM.w / 2 + 2 || Math.abs(z) > FORUM.d / 2 + 2);
  // cartazes de luta na frente da arena e carroças
  for (const [x, z, a] of [[30, -38, 0.3], [-20, 40, 1.2], [60, 4, 2.0], [-90, 20, 0.6]] as number[][]) { const m = mtx(x, 0, z, a); cx(B, M.tabuas, 1.6, 0.12, 3, 0, 0.85, 0, 0x5a4232, m); for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 12); g.rotateZ(PI / 2); g.translate(s * 0.9, 0.55, -0.3); por(B, M.madeira, g, 0x3a2818, m); } sacos(B, m, 0, 0, 3, 0.92); }
  void mesa; void caixote;

  const colliders = terminar(c);
  return { c, colliders, marcos, portoes };
}
