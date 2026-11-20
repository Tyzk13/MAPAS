// Sul de Arton — as cidades e vilas, cada uma com a sua planta (ruas, bairros, praças e prédios que contam história):
//  · Barud segue o mapa detalhado: Via Real, Rua das Lanternas, canal com cais e pontes, Praça do Mercado, Fortaleza no
//    alto, Templo de Lena, quartel da legião, tavernas do Javali e da Lanterna, forja, e o Bairro Coral isolado.
//  · Valkaria: a deusa colossal na praça do Panteão, avenidas até os portões, bulevares em anel, palácio, Academia
//    Arcana, Arena Imperial, Grande Mercado, rio com cais e pontes, torres dos nobres e o cinturão de barracos.
//  · Giluk: terraços na encosta com muros de arrimo, escadaria, Salão do Jarl, círculo de runas e totem, forja, curral.
//  · Nova Malpetrim: cidade branca na falésia, Mirante, Macaco Caolho, feira de Marah, Arena de Gideon, circo, porto.
//  · Tiberus: castro tapista em grade, fórum com o Templo de Tauron e o colosso, arena, quartéis, termas e aqueduto.
//  · Nimbarann, Porto de Deheon e as vilas de cada povo (lavouras, moinhos, igrejas, vinhedos, cais de pesca).
import * as THREE from 'three';
import { type Lugar, LUGARES, MUROS, PERFIS, Y, Ysolo, rnd, reseed, dentroMuro, ocupar } from './geo';
import { MM, type Mini, comLote, cristais, chao, pertoDeRio } from './miniaturas';
import {
  type V, type Est, type Portao, Cid, BC, BD, CM, iniciarKit, terminarKit, pick, Pc, det, geo, plano, cone, cupula, fumo, luz, brilho,
  piso, telhado, casa, casasNaRua, preencher, portoes, muralha, palicada, torreVigia, bandeira, poco, chafariz, estatua, barraca, lampiao,
  lampioesNaRua, arvore, carroca, barris, fogueira, lenha, tenda, templo, castelo, salaoLongo, armazem, arena, moinho, navio, barco, cais,
  guindaste, lavoura, cerca, cercaRet, pomar, vinhedo, arco, caixa,
} from './cidades-kit';

const muroDe = (id: string) => MUROS.find(m => m.id === id)!;
const dist = (a: number, b: number, c: number, d: number) => Math.hypot(a - c, b - d);
/** andares conforme a distância ao centro */
const andares = (d: number, r2: number, r3 = -1) => (d < r3 ? (rnd() < 0.5 ? 3 : 2) : d < r2 ? (rnd() < 0.7 ? 2 : 1) : rnd() < 0.2 ? 2 : 1);
const OURO = 0xd8b048;

// ============================================================ BARUD ============================================================
function barud(L: Lugar) {
  const m = muroDe('barud'), c = new Cid(L.x, L.z, m), k = 0.0641, A = (u: number, v: number): V => [L.x + u * k, L.z + v * k];
  reseed(565);
  const gates = portoes(m);
  muralha(m, gates, { h: 1.0, esp: 0.34, cor: 0x5e5a54, torre: { r: 0.4, h: 1.55, teto: 0x5a2420, cada: 99 }, portao: { larg: 0.62, teto: 0x5a2420 }, bandeira: 0xa01a14 });
  const gS = gates.length ? gates.reduce((a, b) => (b.z > a.z ? b : a)) : null, gE = gates.length ? gates.reduce((a, b) => (b.x > a.x ? b : a)) : null;
  // marcos (reservados antes das casas)
  const [fx, fz] = A(0, -73); castelo(fx, fz, 0, 1.3, { cor: 0x6a6660, teto: 0x3e2a26, bandeira: 0xa01a14, S: 1.35 }); c.reservar(fx, fz, 3.9, 3.9);
  { const p = Pc(fx, Ysolo(fx, fz + 2.1), fz + 2.1); for (let i = 0; i < 5; i++) p.cx(MM.pedra, 0.7 - i * 0.04, 0.06, 0.16, 0, i * 0.05, -i * 0.12, 0x7a746a); } // escadaria
  const [px, pz] = A(0, -15); piso(px, pz, { w: 2.82, d: 2.43 }, CM.lajota, 0xc8bcac); c.reservar(px, pz, 2.82, 2.43);
  poco(px, pz); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283, bx = px + Math.cos(a) * 0.95, bz = pz + Math.sin(a) * 0.82; barraca(bx, bz, Math.atan2(px - bx, pz - bz), pick([0xa83a2a, 0xd8a838, 0x3a6a9a, 0x5a8a3a, 0xc86a2a])); }
  carroca(px + 1.1, pz - 0.9, 0.4); barris(px - 1.15, pz + 0.95); luz(px, Ysolo(px, pz) + 1.2, pz, 0xffb060, 16, 6);
  // canal com margens de pedra, barcos e pontes
  const [cx, cz] = A(0, 19); piso(cx, cz, { w: 11, d: 0.62 }, CM.agua, 0xffffff, 0.06); c.reservar(cx, cz, 11.2, 0.66);
  for (const s of [-1, 1]) { const p = Pc(cx, Ysolo(cx, cz) - 0.02, cz + s * 0.34); p.cx(MM.pedra, 11.1, 0.1, 0.07, 0, 0.03, 0, 0x6a645a); }
  for (const u of [0, 48, -48]) { const [bx, bz] = A(u, 19), p = Pc(bx, Ysolo(bx, bz) + 0.05, bz); p.cx(MM.pedra, 0.42, 0.06, 0.9, 0, 0.02, 0, 0x8a847a); for (const s of [-1, 1]) p.cx(MM.pedra, 0.04, 0.07, 0.9, s * 0.2, 0.08, 0, 0x7a746a); }
  for (const u of [-70, -30, 22, 66]) { const [bx, bz] = A(u, 19), p = Pc(bx, Ysolo(bx, bz) + 0.04, bz, Math.PI / 2 + (rnd() - 0.5) * 0.3); p.cx(MM.madeira, 0.12, 0.04, 0.34, 0, 0.02, 0, 0x4a3424); }
  // ruas da planta
  const R = (pts: V[], w: number) => c.rua(pts, w, CM.calcada, { cor: 0xb0a49a });
  const via = R([gS ? [gS.x, gS.z] : A(0, 100), A(0, 80), A(0, -45)], 0.42);
  const lant = R([A(-94, -10), A(80, -10), gE ? [gE.x, gE.z] : A(101, -10)], 0.34);
  const ruas = [via, lant, R([A(-84, 11.5), A(84, 11.5)], 0.22), R([A(-84, 26.5), A(84, 26.5)], 0.22), R([A(-74, 62), A(74, 62)], 0.28), R([A(-64, -42), A(64, -42)], 0.28),
    R([A(48, -62), A(48, 84)], 0.28), R([A(-48, -62), A(-48, 84)], 0.28), R([A(-24, 29), A(-24, 59)], 0.16), R([A(24, 29), A(24, 59)], 0.16), R([A(-44, 82), A(44, 82)], 0.16),
    R([A(-76, 29), A(-76, 72)], 0.16), R([A(72, 29), A(72, 72)], 0.16)];
  const larg = [0.42, 0.34, 0.22, 0.22, 0.28, 0.28, 0.28, 0.28, 0.16, 0.16, 0.16, 0.16, 0.16];
  lampioesNaRua(via, 0.42, 1.3); lampioesNaRua(lant, 0.34, 1.5);
  // prédios com nome (do mapa detalhado)
  const coral = (x: number, z: number) => { const u = (x - L.x) / k, v = (z - L.z) / k; return u < -51 && v > -66 && v < -12; };
  { const [x, z] = A(36, -25); templo(x, z, Math.PI / 2, 0.85, { parede: 0xd8d0c0, teto: 0x4a4e5a, torre: 'agulha' }); c.reservar(x, z, 1.9, 1.4, Math.PI / 2); }
  { const [x, z] = A(-36, -24), p = armazem(x, z, -Math.PI / 2, 1.1, 0.8, 0x6a645a, 0x3e3a40); bandeira(p, 0.55, 0.5, 0.1, 0.5, 0xa01a14, 0.8); bandeira(p, -0.55, 0.5, 0.1, 0.5, 0xa01a14, 0.8); c.reservar(x, z, 1.2, 0.9, -Math.PI / 2); }
  { const [x, z] = A(-17, -52); casa(x, z, 0, 0.78, 0.66, 'barud', { and: 2, luz: 0.8, cor: 0xd0c4b0 }); c.reservar(x, z, 0.8, 0.7); arvore(x + 0.6, z + 0.1, 0.8); arvore(x - 0.6, z, 0.7); }
  { const [x, z] = A(13, 77); const p = casa(x, z, -Math.PI / 2, 0.9, 0.75, 'barud', { and: 2, luz: 1, loja: 0x8a2a1a }); c.reservar(x, z, 0.9, 0.78, -Math.PI / 2); const v = p.pos(0, 0.5, 0.5); luz(v.x, v.y, v.z, 0xffa050, 18, 7); brilho(v.x, v.y, v.z, 1.1); barris(x - 0.3, z + 0.6); }
  { const [x, z] = A(-34, 34); const p = casa(x, z, Math.PI, 0.78, 0.64, 'barud', { and: 2, luz: 1, loja: 0x3a4a2a }); c.reservar(x, z, 0.8, 0.66, Math.PI); const v = p.pos(0.25, 0.45, 0.42); lampiao(v.x, v.z); luz(v.x, v.y, v.z, 0xffb060, 14, 6); }
  { const [x, z] = A(-11, 36); const p = casa(x, z, Math.PI / 2, 0.66, 0.58, 'barud', { luz: 0.2 }); c.reservar(x, z, 0.68, 0.6, Math.PI / 2); plano(BD, p.m, CM.forja, 0.16, 0.1, 0, 0.09, 0.3, 0, 0xffffff); const v = p.pos(0, 0.15, 0.45); brilho(v.x, v.y, v.z, 0.9); luz(v.x, v.y, v.z, 0xff7a30, 10, 4); fumo(p.pos(0.2, 0.9, 0), 1); }
  { const [x, z] = A(-72, -41); casa(x, z, Math.PI / 2, 1.0, 0.84, 'ruina', { cor: 0x8a7a6a }); c.reservar(x, z, 1.0, 0.86, Math.PI / 2); comLote(BC, () => { for (let i = 0; i < 6; i++) cristais(x + (rnd() - 0.5) * 0.8, z + (rnd() - 0.5) * 0.7, 0.45); }); }
  // casas ao longo de todas as ruas (geminadas, dois andares no miolo)
  ruas.forEach((r, i) => casasNaRua(c, r, larg[i], {
    w: [0.42, 0.6], d: [0.38, 0.5], gap: [0.01, 0.05], prob: 0.96,
    casa: (x, z, ry, w, d) => { const cr = coral(x, z); if (cr) { casa(x, z, ry, w, d, rnd() < 0.7 ? 'ruina' : 'barud', { luz: 0 }); if (rnd() < 0.4) comLote(BC, () => cristais(x, z, 0.4)); } else casa(x, z, ry, w, d, 'barud', { and: andares(dist(x, z, L.x, L.z), 3.6), luz: z > L.z + 2.4 ? 0.7 : 0.35, loja: i < 2 && rnd() < 0.25 ? pick([0x8a2a1a, 0x3a5a2a, 0x2a3a6a, 0x8a6a1a]) : undefined, fumo: 0.12 }); },
    vazio: (x, z) => arvore(x, z, 0.65),
  }));
  preencher(c, 420, () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 6.2; return [L.x + Math.cos(a) * r, L.z + Math.sin(a) * r]; }, { w: [0.36, 0.5], d: [0.32, 0.44], casa: (x, z, ry, w, d) => casa(x, z, ry, w, d, coral(x, z) ? 'ruina' : 'barud', { luz: 0.25, fumo: 0.08 }) });
  // Bairro Coral: barricadas e cristais vermelhos
  const B = (u: number, v: number) => A(u, v);
  cerca([B(-51, -64), B(-51, -12), B(-98, -12)], 0x2a2018, 0.2);
  comLote(BC, () => { for (let i = 0; i < 16; i++) { const [x, z] = A(-60 - rnd() * 34, -60 + rnd() * 44); if (dentroMuro(m, x, z) > 0.4) cristais(x, z, 0.5); } });
  // luzes da cidade
  luz(L.x, Ysolo(L.x, L.z) + 2, L.z + 3, 0xffa050, 24, 10);
  for (let i = 0; i < 8; i++) fumo(new THREE.Vector3(L.x + (rnd() - 0.5) * 9, Ysolo(L.x, L.z) + 1.3, L.z + (rnd() - 0.5) * 9), 1);
}

// =========================================================== VALKARIA ==========================================================
function estatuaValkaria(x: number, z: number) {
  const y0 = Ysolo(x, z), p = Pc(x, y0, z, 0.25, 1.75), lil = 0xd8d0e8, cin = 0xc8ccd8, V2 = THREE.Vector2;
  const manto = new THREE.LatheGeometry([[0, 0], [2.6, 0], [2.4, 1.5], [2.1, 4], [1.8, 7], [1.5, 9.5], [1.3, 11.5], [1.55, 13], [1.7, 14.2], [1.3, 15.4], [0.7, 16.2], [0, 16.4]].map(([a, b]) => new V2(a, b)), 20);
  geo(BC, MM.marmore, manto, lil, p.m);
  for (const hh of [1.5, 4, 7, 9.5]) { const t = new THREE.TorusGeometry(2.6 - hh * 0.12, 0.09, 6, 28); t.rotateX(Math.PI / 2); t.translate(0, hh, 0); geo(BC, MM.ouro, t, OURO, p.m); }
  const esp = new THREE.TorusGeometry(1.65, 0.07, 6, 30, Math.PI * 1.4); esp.rotateX(Math.PI / 2); esp.rotateZ(0.3); esp.translate(0, 12.4, 0); geo(BC, MM.ouro, esp, OURO, p.m);
  p.esf(MM.marmore, 1.0, 0, 17.3, 0, cin, 1.12);
  const cab = new THREE.ConeGeometry(1.05, 3.2, 12); cab.translate(0, 15.8, -0.35); geo(BC, MM.marmore, cab, lil, p.m);
  const coroa = new THREE.TorusGeometry(0.85, 0.12, 6, 16); coroa.rotateX(Math.PI / 2); coroa.translate(0, 18.1, 0); geo(BC, MM.ouro, coroa, OURO, p.m);
  for (const s of [-1, 1]) { const b = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 1.5, 14.4, 0), new THREE.Vector3(s * 1.7, 12.6, 0.5), new THREE.Vector3(s * 0.5, 11.6, 1.3)]), 8, 0.36, 8); geo(BC, MM.marmore, b, lil, p.m); }
  p.cx(MM.marmore, 0.32, 9.6, 0.12, 0, 6.6, 1.7, 0xe8ecf4); p.cx(MM.ouro, 1.8, 0.3, 0.3, 0, 11.3, 1.6, OURO); p.cil(MM.ouro, 0.14, 1.0, 0, 11.4, 1.6, OURO, 6);
  brilho(x, y0 + 14, z, 14); brilho(x, y0 + 30, z, 7); luz(x, y0 + 6, z + 4, 0xffc070, 50, 20);
}
function valkaria(L: Lugar) {
  const m = muroDe('valkaria'), c = new Cid(L.x, L.z, m), { x, z } = L, y0 = Ysolo(x, z); reseed(790);
  const P = (a: number, r: number): V => [x + Math.cos(a) * r, z + Math.sin(a) * r];
  // a deusa e a praça do Panteão
  estatuaValkaria(x, z); c.bloquear(x, z, 7.5); piso(x, z, { r: 7.4 }, CM.lajota, 0xeae4ee);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.283, [sx, sz] = P(a, 6.3); estatua(sx, sz, 1.5, i % 3 ? 0xd8d2e4 : OURO, i % 3 ? MM.marmore : MM.ouro, Math.atan2(x - sx, z - sz)); }
  for (const a of [0.4, 2.0, 3.5, 5.1]) { const [fx, fz] = P(a, 5.2); chafariz(fx, fz, 0.45); }
  for (let i = 0; i < 24; i++) { const [lx, lz] = P((i / 24) * 6.283 + 0.13, 7.2); lampiao(lx, lz); }
  // muralha branca, torres de telhado azul, portões de telhado dourado
  const gates = portoes(m);
  muralha(m, gates, { h: 1.3, esp: 0.42, cor: 0xe0dcea, mat: MM.marmore, torre: { r: 0.5, h: 2.0, teto: 0x5a6a98, tetoMat: MM.ardosia, cada: 4.4 }, portao: { larg: 0.95, teto: OURO }, bandeira: 0x5a3a9a });
  // avenidas (dos portões até a praça) e radiais extras
  const angG = gates.map(g => Math.atan2(g.z - z, g.x - x)), radiais = [...angG];
  for (const a of [-Math.PI / 2 - 0.5, 0.15, 2.4, -2.5]) if (!radiais.some(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.45)) radiais.push(a);
  const perto = (a: number, lim: number) => radiais.some(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < lim);
  // prédios grandes (reservados)
  const marcos: [string, number, number][] = [['palacio', -1.25, 9.3], ['academia', -2.05, 9.4], ['arena', 1.95, 12.6], ['mercado', 1.52, 12.2], ['jardim', 0.75, 9.2], ['jardim2', -0.55, 9.2], ['jardim3', 2.75, 9.2]];
  const ajusta = (a: number) => { for (let k = 0; k < 20 && perto(a, 0.28); k++) a += 0.06; return a; };
  const pos: Record<string, V> = {}; for (const [n, a, r] of marcos) pos[n] = P(ajusta(a), r);
  { const [px, pz] = pos.palacio, ry = Math.atan2(x - px, z - pz); castelo(px, pz, ry, 1.15, { mat: MM.marmore, cor: 0xece6f2, teto: 0x4a5a98, bandeira: 0x5a3a9a, S: 1.25 }); c.reservar(px, pz, 3.2, 3.2, ry); const p = Pc(px, Ysolo(px, pz), pz, ry); cupula(p, MM.ouro, 0.55, 0, 3.45, -0.35, OURO, 1.3); }
  { const [ax, az] = pos.academia, p = Pc(ax, chao(ax, az, 0.6), az, rnd()), q = det(p); p.cil(MM.marmore, 0.5, 5.2, 0, -0.2, 0, 0xe0d8f0, 12, 0.36); cone(p, MM.ardosia, 0.55, 1.6, 0, 5.0, 0, 0x3a2a6a, 12); for (let k = 0; k < 6; k++) plano(BD, q.m, CM.arcano, 0.08, 0.16, Math.sin(k * 1.1) * 0.39, 1.2 + k * 0.62, Math.cos(k * 1.1) * 0.39, k * 1.1, 0xffffff); const g = new THREE.TorusGeometry(0.62, 0.035, 5, 24); g.rotateX(Math.PI / 2); g.translate(0, 4.2, 0); geo(BC, CM.arcano, g, 0xffffff, p.m); brilho(ax, Ysolo(ax, az) + 5.5, az, 3.2); luz(ax, Ysolo(ax, az) + 4.4, az, 0x9a7cff, 18, 8); for (const s of [-1, 1]) casa(ax + s * 0.95, az + 0.5, Math.atan2(x - ax, z - az), 0.7, 0.55, 'valk', { and: 2, luz: 0.8, cor: 0xd8d0ec }); c.bloquear(ax, az, 1.6); }
  { const [ax, az] = pos.arena, ry = Math.atan2(x - ax, z - az); arena(ax, az, ry, 2.0, 1.55, 0xd8d0c4, 4); c.reservar(ax, az, 4.6, 3.6, ry); for (const s of [-1, 1]) { const p = Pc(ax, Ysolo(ax, az), az, ry); bandeira(p, s * 2.1, 1.1, 0, 0.6, 0x5a3a9a); } }
  { const [mx, mz] = pos.mercado; piso(mx, mz, { r: 1.35 }, CM.lajota, 0xd8ccb8); c.bloquear(mx, mz, 1.45); chafariz(mx, mz, 0.3); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283, bx = mx + Math.cos(a) * 1.0, bz = mz + Math.sin(a) * 1.0; barraca(bx, bz, Math.atan2(mx - bx, mz - bz), pick([0xa83a6a, 0xd8a838, 0x3a6a9a, 0x5a8a3a, 0xc86a2a, 0x7a3a9a])); } carroca(mx + 1.5, mz, 1.2); luz(mx, Ysolo(mx, mz) + 1, mz, 0xffb060, 14, 6); }
  for (const n of ['jardim', 'jardim2', 'jardim3']) { const [gx, gz] = pos[n]; piso(gx, gz, { r: 1.0 }, CM.campo, 0x5a8a3a); c.bloquear(gx, gz, 1.05); chafariz(gx, gz, 0.22); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; arvore(gx + Math.cos(a) * 0.72, gz + Math.sin(a) * 0.72, 0.75, pick([0x4a7a3a, 0x5a8a40, 0x3a6a32, 0x8a6aa0])); } }
  // torres dos nobres com jardins suspensos e viadutos
  const torres: THREE.Vector3[] = [];
  for (let i = 0; i < 7; i++) { const a = ajusta((i / 7) * 6.283 + 0.5); const [tx, tz] = P(a, 8.4); if (Object.values(pos).some(([u, v]) => dist(u, v, tx, tz) < 1.8) || pertoDeRio(tx, tz, 1)) continue; const h = 6 + rnd() * 5, q = Pc(tx, Ysolo(tx, tz) - 0.2, tz, a), qd = det(q);
    q.cx(MM.marmore, 1.0, h, 1.0, 0, h / 2, 0, i % 2 ? 0xd8d0e8 : 0xc8ccd8); cone(q, MM.ouro, 0.75, 1.3, 0, h, 0, OURO, 6);
    q.cx(MM.plain, 1.2, 0.2, 1.2, 0, h * 0.62, 0, 0x4a7a3a); for (let k = 0; k < 5; k++) q.esf(MM.plain, 0.18, (rnd() - 0.5) * 1.0, h * 0.62 + 0.18, (rnd() - 0.5) * 1.0, 0x3a6a32);
    for (let k = 0; k < 5; k++) plano(BD, qd.m, MM.aceso, 0.07, 0.11, (k % 3 - 1) * 0.25, h * (0.25 + k * 0.1), 0.506, 0, 0xffffff);
    torres.push(new THREE.Vector3(tx, Ysolo(tx, tz) + h * 0.5, tz)); c.reservar(tx, tz, 1.1, 1.1, a); }
  for (let i = 0; i < torres.length - 1; i++) { const a = torres[i], b = torres[i + 1], mm = a.clone().add(b).multiplyScalar(0.5), L2 = a.distanceTo(b); if (L2 > 8) continue; const q = Pc(mm.x, Math.min(a.y, b.y), mm.z, Math.atan2(b.x - a.x, b.z - a.z)); q.cx(MM.marmore, 0.4, 0.2, L2, 0, 0, 0, 0xe0dcec); for (const s of [-1, 1]) det(q).cx(MM.marmore, 0.04, 0.12, L2, s * 0.18, 0.15, 0, 0xd0ccdc); }
  // ruas: avenidas, bulevares em anel e travessas
  const av = radiais.map(a => { const g = gates.find(gg => Math.abs(Math.atan2(gg.z - z, gg.x - x) - a) < 1e-6); return c.rua([P(a, 7.3), g ? [g.x, g.z] : P(a, 15.3)], 0.62, CM.calcada, { cor: 0xe6ded6, ponte: 0xd8d0e0 }); });
  av.forEach(r => lampioesNaRua(r, 0.62, 1.1));
  const anel1 = c.rua(arco(x, z, 10.9, 0, 6.283, 0.35), 0.44, CM.calcada, { cor: 0xd8d0c8, ponte: 0xd8d0e0 }), anel2 = c.rua(arco(x, z, 13.7, 0, 6.283, 0.35), 0.36, CM.calcada, { cor: 0xd0c8c0, ponte: 0xd8d0e0 });
  lampioesNaRua(anel1, 0.44, 1.6);
  const trav: V[][] = [];
  for (let a = 0; a < 6.283; a += 0.2) { if (perto(a, 0.12)) continue; if (rnd() < 0.85) trav.push(c.rua([P(a, 11.1), P(a, 13.5)], 0.22, CM.calcada, { cor: 0xc8c0b8 })); if (rnd() < 0.85) trav.push(c.rua([P(a + 0.1, 13.9), P(a + 0.1, 15.6)], 0.22, CM.calcada, { cor: 0xc8c0b8 })); }
  // o rio: cais de pedra nas margens, barcos
  const rio = PERFIS[6];
  rio.pts.forEach(([rx, rz], i) => { if (dist(rx, rz, x, z) > 15.6 || i % 2) return; const nx = rio.pts[Math.min(rio.pts.length - 1, i + 1)], tx = nx[0] - rx, tz = nx[1] - rz, LL = Math.hypot(tx, tz) || 1, o = rio.larg[i] * 1.12 + 0.1; for (const s of [-1, 1]) { const qx = rx - (tz / LL) * o * s, qz = rz + (tx / LL) * o * s, p = Pc(qx, rio.y[i] - 0.15, qz, Math.atan2(tx, tz)); p.cx(MM.marmore, 0.14, Math.max(0.3, Ysolo(qx, qz) - rio.y[i] + 0.35), LL * 2.05, 0, 0.1, 0, 0xc8c0cc); } if (i % 8 === 0) { const b = Pc(rx, rio.y[i] + 0.02, rz, Math.atan2(tx, tz) + 0.2); b.cx(MM.madeira, 0.16, 0.06, 0.42, 0, 0.03, 0, 0x5a4030); } });
  // casas: nobres no anel de dentro, sobrados nos de fora
  const todas = [...av.map(r => [r, 0.62] as const), [anel1, 0.44] as const, [anel2, 0.36] as const, ...trav.map(r => [r, 0.22] as const)];
  for (const [r, lg] of todas) casasNaRua(c, r, lg, {
    w: [0.55, 0.85], d: [0.5, 0.68], gap: [0.02, 0.08], prob: 0.95,
    casa: (hx, hz, ry, w, d) => { const dd = dist(hx, hz, x, z); casa(hx, hz, ry, w, d, 'valk', { and: andares(dd, 13.2, 11.2), luz: 0.6, loja: lg > 0.5 && rnd() < 0.3 ? pick([0x7a3a9a, 0x3a5a9a, 0xa83a3a, 0xd8a838]) : undefined, fumo: 0.06 }); },
    vazio: (hx, hz) => arvore(hx, hz, 0.7, 0x4a7a3a),
  });
  preencher(c, 900, () => { const a = rnd() * 6.283, r = 7.6 + rnd() * 8; return P(a, r); }, { w: [0.5, 0.75], d: [0.45, 0.6], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'valk', { and: andares(dist(hx, hz, x, z), 12.5), luz: 0.5, fumo: 0.05 }) });
  // fora dos muros: barracos, hortas, campos e moinhos
  const f = new Cid(x, z, null); f.estradasPerto(26); f.area = (hx, hz, r) => dentroMuro(m, hx, hz) < -0.9 - r && dist(hx, hz, x, z) < 19.8;
  preencher(f, 520, () => P(rnd() * 6.283, 16.6 + rnd() * 3.2), { w: [0.32, 0.48], d: [0.28, 0.4], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'barraco', { luz: 0.3 }) });
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, r = 20.5 + rnd() * 4.5, [lx, lz] = P(a, r); if (!f.bom(lx, lz, 1.2) && !(dist(lx, lz, x, z) > 19.8)) continue; if (f.livre(caixa(lx, lz, 1.2, 0.8, a), 0.2)) { f.reservar(lx, lz, 2.4, 1.6, a); lavoura(lx, lz, 2.3, 1.5, a, pick([0xe8c860, 0x9ab850, 0xb08860, 0xd8b850]), rnd() < 0.5 ? 3 : 0); } }
  for (const a of [0.9, 2.9, 4.4]) { const [mx, mz] = P(a, 21); if (Y(mx, mz) > 0.4 && !pertoDeRio(mx, mz, 1)) moinho(mx, mz, rnd() * 6, 1.1); }
  for (let i = 0; i < 10; i++) fumo(new THREE.Vector3(x + (rnd() - 0.5) * 28, y0 + 2, z + (rnd() - 0.5) * 28), 1);
  luz(x + 10, y0 + 2, z + 6, 0xffb060, 20, 10); luz(x - 9, y0 + 2, z - 6, 0xffb060, 20, 10);
}

// ============================================================ GILUK ============================================================
function giluk(L: Lugar) {
  const m = muroDe('giluk'), c = new Cid(L.x, L.z, m), { x, z } = L; reseed(733);
  const gates = portoes(m); palicada(m, gates, { h: 0.75, cor: 0x5a4532 });
  for (let a = 0.3; a < 6.283; a += 1.05) { const r = 10.1, tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r; if (!gates.some(g => dist(g.x, g.z, tx, tz) < 1.5)) torreVigia(tx, tz, 1.6); }
  // Salão do Jarl no alto (norte), pátio com fogueira e estandartes
  const hz = z - 7.2; salaoLongo(x, hz, 0, 3.6, 1.5, { cor: 0x5a3e28, neve: true, dragoes: true }); c.reservar(x, hz, 4.0, 1.9);
  piso(x, hz + 1.5, { w: 3.0, d: 1.0 }, CM.terra, 0x8a7a68); c.reservar(x, hz + 1.5, 3.0, 1.0); fogueira(x - 0.9, hz + 1.5, 1.3, true); fogueira(x + 0.9, hz + 1.5, 1.3);
  for (const s of [-1, 1]) bandeira(Pc(x + s * 1.9, Ysolo(x + s * 1.9, hz + 1.0), hz + 1.0), 0, 0, 0, 1.4, 0x2a4a7a, 1.2);
  // círculo de runas com totem no meio da escadaria
  const rz = z + 0.5; c.bloquear(x, rz, 1.05); piso(x, rz, { r: 1.0 }, CM.lajota, 0x9a9690);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, sx = x + Math.cos(a) * 0.82, sz = rz + Math.sin(a) * 0.82, p = Pc(sx, Ysolo(sx, sz), sz, -a); p.cx(MM.pedra, 0.14, 0.32 + rnd() * 0.12, 0.06, 0, 0.12, 0, 0x7a7670); plano(BD, p.m, CM.arcano, 0.05, 0.12, 0, 0.18, 0.031, 0, 0xffffff); }
  { const p = Pc(x, Ysolo(x, rz), rz); p.cil(MM.madeira, 0.07, 1.4, 0, 0, 0, 0x5a3e28, 6); for (let k = 0; k < 3; k++) p.esf(MM.madeira, 0.1, 0, 0.5 + k * 0.32, 0, k === 2 ? 0xa07a50 : 0x6a4a30, 0.8); for (const s of [-1, 1]) p.cx(MM.madeira, 0.3, 0.04, 0.04, s * 0.12, 1.25, 0, 0x5a3e28, s * 0.4); fogueira(x + 0.55, rz + 0.55, 0.9); fogueira(x - 0.55, rz + 0.55, 0.9); }
  // terraços (ruas em curva de nível), escadaria central e ligações aos portões
  const ruas: V[][] = [];
  for (const zt of [6.4, 3.4, 0.5, -2.4, -5.2]) { const w = Math.sqrt(Math.max(1, 10.5 * 10.5 - zt * zt)) - 0.9; ruas.push(c.rua(Array.from({ length: 13 }, (_, i) => { const u = -w + (2 * w * i) / 12; return [x + u, z + zt + 0.012 * u * u] as V; }), 0.34, CM.terra, { cor: 0x9a8e84 })); }
  const gS = gates.reduce((a, b) => (b.z > a.z ? b : a), gates[0] ?? { x, z: z + 10, tx: 0, tz: 1 });
  const esc = c.rua([[gS.x, gS.z], [x, z + 6.4], [x, z - 5.4]], 0.4, CM.lajota, { cor: 0xa8a49c });
  for (let s = 0.2; s < 11.6; s += 0.22) { const zz = z + 6.4 - s; if (zz < z - 5.4) break; det(Pc(x, Ysolo(x, zz), zz)).cx(MM.pedra, 0.38, 0.03, 0.05, 0, 0.06, 0, 0x8a8680); }
  for (const g of gates) { if (g === gS) continue; const alvo = ruas.flat().reduce((a, b) => (dist(b[0], b[1], g.x, g.z) < dist(a[0], a[1], g.x, g.z) ? b : a)); c.rua([[g.x, g.z], alvo], 0.32, CM.terra, { cor: 0x9a8e84 }); }
  // casas de pedra e tronco nos terraços; uma forja
  ruas.forEach(r => casasNaRua(c, r, 0.34, { w: [0.75, 1.1], d: [0.55, 0.7], gap: [0.06, 0.25], prob: 0.92, casa: (hx, hz2, ry, w, d) => casa(hx, hz2, ry, w, d, 'giluk', { and: hz2 < z - 3 && rnd() < 0.4 ? 2 : 1, luz: 0.7, fumo: 0.35 }), vazio: (hx, hz2, ry) => lenha(hx, hz2, ry) }));
  casasNaRua(c, esc, 0.4, { w: [0.7, 0.95], d: [0.55, 0.7], gap: [0.08, 0.3], prob: 0.8, casa: (hx, hz2, ry, w, d) => casa(hx, hz2, ry, w, d, 'giluk', { luz: 0.7, fumo: 0.35 }) });
  { const fx = x + 4.2, fz = z + 3.4 + 0.8, p = Pc(fx, chao(fx, fz, 0.5), fz); if (c.livre(caixa(fx, fz, 0.45, 0.35, 0))) { p.cx(MM.pedra, 0.8, 0.4, 0.6, 0, 0.1, 0, 0x6a6660); telhado(p, MM.neve, 0.8, 0.6, 0.35, 0.3, 0xeef4ff); plano(BD, p.m, CM.forja, 0.24, 0.12, 0, 0.12, 0.306, 0, 0xffffff); const v = p.pos(0, 0.2, 0.5); brilho(v.x, v.y, v.z, 1.0); luz(v.x, v.y, v.z, 0xff7a30, 10, 4); fumo(p.pos(0, 0.8, 0), 1); } }
  // muros de arrimo entre os terraços
  for (const zm of [4.9, 1.95, -0.95, -3.8]) for (let u = -9; u <= 9; u += 0.42) { const wx = x + u, wz = z + zm + 0.012 * u * u; if (dentroMuro(m, wx, wz) < 0.6) continue; const B = caixa(wx, wz, 0.21, 0.07, 0); if (!c.livre(B, 0)) continue; c.ocupar(B); Pc(wx, Ysolo(wx, wz) - 0.2, wz).cx(MM.pedra, 0.45, 0.31, 0.12, 0, 0.155, 0, 0xb0aaa0); }
  preencher(c, 200, () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 9.6; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }, { w: [0.4, 0.6], d: [0.35, 0.5], casa: (hx, hz2, ry, w, d) => (rnd() < 0.5 ? lenha(hx, hz2, ry) : casa(hx, hz2, ry, w, d, 'giluk', { luz: 0.5, fumo: 0.2 })) });
  // curral dos mamutes e varais de peles fora da paliçada
  const ex = x + 12.5, ez = z + 5; if (Y(ex, ez) > 0.5) { cercaRet(ex, ez, 3.2, 2.2, 0.3, 0x4a3828); ocupar(ex, ez, 2); for (let i = 0; i < 3; i++) cone(Pc(ex + (rnd() - 0.5) * 2, Ysolo(ex, ez), ez + (rnd() - 0.5) * 1.4), MM.palha, 0.14, 0.22, 0, 0, 0, 0xb8a060, 6); }
  for (let i = 0; i < 4; i++) { const a = 1.2 + i * 0.25, vx = x + Math.cos(a) * 11.4, vz = z + Math.sin(a) * 11.4, q = det(Pc(vx, Ysolo(vx, vz), vz, a)); for (const s of [-1, 1]) q.cx(MM.madeira, 0.03, 0.4, 0.03, s * 0.3, 0.2, 0, 0x4a3828); q.cx(MM.madeira, 0.64, 0.02, 0.02, 0, 0.38, 0, 0x4a3828); q.cx(MM.plain, 0.22, 0.2, 0.01, -0.12, 0.26, 0, 0x8a6a4a); q.cx(MM.plain, 0.2, 0.22, 0.01, 0.15, 0.25, 0, 0xc8b8a0); }
  luz(x, Ysolo(x, z) + 2, z + 2, 0xff9a50, 24, 10);
}

// ======================================================= NOVA MALPETRIM =========================================================
function malpetrim(L: Lugar) {
  const m = muroDe('malpetrim'), c = new Cid(L.x, L.z, m), { x, z } = L; reseed(165);
  const A = (u: number, v: number): V => [x + u, z + v];
  const gates = portoes(m);
  muralha(m, gates, { h: 0.85, esp: 0.32, cor: 0xe8e0d0, mat: MM.reboco, torre: { r: 0.36, h: 1.3, teto: 0xc8683a, cada: 3.6 }, portao: { larg: 0.7, teto: 0xc8683a }, bandeira: 0x2a6ac8 });
  // marcos
  const [mx, mz] = A(0.2, -0.7); piso(mx, mz, { r: 1.2 }, CM.lajota, 0xe8e0d0); c.bloquear(mx, mz, 1.25); chafariz(mx, mz, 0.3, 0xf0e8dc, MM.reboco);
  for (let i = 0; i < 6; i++) lampiao(mx + Math.cos(i * 1.05) * 1.1, mz + Math.sin(i * 1.05) * 1.1);
  { const [tx, tz] = A(0.2, -2.55); templo(tx, tz, 0, 0.7, { mat: MM.reboco, parede: 0xf4f0e6, tetoMat: MM.telha, teto: 0xc8683a, torre: 'cupula' }); c.reservar(tx, tz, 0.9, 1.9); }
  { const [ex, ez] = A(2.3, -0.9), p = casa(ex, ez, -Math.PI / 2 + 0.2, 0.95, 0.75, 'oeste', { and: 2, luz: 1, loja: 0xd8a040, cor: 0xe8c890 }); c.reservar(ex, ez, 1.0, 0.8, -Math.PI / 2 + 0.2); const v = p.pos(0, 0.5, 0.5); luz(v.x, v.y, v.z, 0xffa050, 20, 8); brilho(v.x, v.y, v.z, 1.1); barris(ex + 0.6, ez + 0.3); }
  { const [fx, fz] = A(-5.4, -7.2); piso(fx, fz, { r: 1.3 }, CM.areia, 0xe8d8b0); c.bloquear(fx, fz, 1.35); for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283 + rnd() * 0.2, r = 0.45 + (i % 2) * 0.5; tenda(fx + Math.cos(a) * r, fz + Math.sin(a) * r, 0.2 + rnd() * 0.08, pick([0xc83a2a, 0xe8c040, 0x2a6ac8, 0x3a9a4a, 0xe86a20])); } }
  { const [ax, az] = A(6.3, -7.0); arena(ax, az, 0.2, 1.55, 1.15, 0xe0d8c8, 3); c.reservar(ax, az, 3.6, 2.8, 0.2); }
  { const [tx, tz] = A(-7.6, -2.4); const p = tenda(tx, tz, 1.0, 0xd8261e, 0xf2ece0); bandeira(p, 0, 1.2, 0, 0.5, 0xe8c040, 0.8); for (let i = 0; i < 4; i++) tenda(tx + 1.2 * Math.cos(i * 1.6), tz + 1.1 * Math.sin(i * 1.6), 0.22, pick([0x2a6ac8, 0xe8c040])); c.bloquear(tx, tz, 1.6); }
  // ruas: avenida do portão norte, rua do Mirante na beira da falésia, grade
  const gN = gates.reduce((a, b) => (b.z < a.z ? b : a), gates[0] ?? { x, z: z - 11, tx: 0, tz: -1 }), gE = gates.reduce((a, b) => (b.x > a.x ? b : a), gates[0] ?? { x: x + 10, z, tx: 1, tz: 0 });
  const R = (pts: V[], w: number) => c.rua(pts, w, CM.calcada, { cor: 0xd8d0c4 });
  const ruas: [V[], number][] = [];
  ruas.push([R([[gN.x, gN.z], [gN.x, z - 3.4], A(0.2, -1.9)], 0.46), 0.46]);
  ruas.push([R([A(-8.6, 0.2), A(-3, 0.25), A(0.2, 0.55), A(4, 0.6), A(8, 1.0), A(9.6, 1.7)], 0.36), 0.36]);
  ruas.push([R([[gE.x, gE.z], [x + 6, gE.z], [gN.x, gE.z]], 0.4), 0.4]);
  for (const v of [-3.6, -6.4, -9.0]) ruas.push([R([A(-9.4 + Math.abs(v) * 0.15, v), A(9.4 - Math.abs(v) * 0.1, v)], 0.24), 0.24]);
  for (const u of [-6.5, -3.4, 3.2, 6.6]) ruas.push([R([A(u, -10.2 + Math.abs(u) * 0.2), A(u, 0.1)], 0.24), 0.24]);
  ruas.forEach(([r, w], i) => { if (i < 3) lampioesNaRua(r, w, 1.3); casasNaRua(c, r, w, { w: [0.5, 0.75], d: [0.45, 0.6], gap: [0.02, 0.08], prob: 0.93, ok: (hx, hz) => Y(hx, hz) > 3.6, casa: (hx, hz, ry, w2, d) => casa(hx, hz, ry, w2, d, 'oeste', { and: andares(dist(hx, hz, mx, mz), 4.5), luz: 0.55, loja: i < 3 && rnd() < 0.25 ? pick([0x2a6ac8, 0xd8a040, 0xc83a2a]) : undefined, fumo: 0.08 }), vazio: (hx, hz) => arvore(hx, hz, 0.6, 0x3a5a2a) }); });
  preencher(c, 340, () => A((rnd() - 0.5) * 20, -11 + rnd() * 11.5), { w: [0.45, 0.65], d: [0.4, 0.55], ok: (hx, hz) => Y(hx, hz) > 3.6, casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'oeste', { luz: 0.4, fumo: 0.05 }) });
  // escadaria pela falésia até o porto
  let sx = x + 0.4, sz = z + 0.9, dir = 1; for (let i = 0; i < 22; i++) { const yy = Math.max(0.15, Y(sx, sz)); Pc(sx, yy, sz, 0.3).cx(MM.pedra, 0.36, 0.07, 0.22, 0, 0.02, 0, 0xe0d8c8); sx += 0.2 * dir; sz += 0.17; if (i % 6 === 5) dir = -dir; if (i % 6 === 2) lampiao(sx + 0.25, sz); }
  // porto: cais de pedra, píeres, navios, armazéns e guindastes
  const qz = z + 4.45, pq = Pc(x, 0, qz); pq.cx(MM.pedra, 15, 0.42, 0.9, 0, 0.0, 0, 0xc8c0b0); for (let k = 0; k < 14; k++) det(pq).cx(MM.pedra, 0.08, 0.06, 0.08, -7 + k * 1.08, 0.24, 0.42, 0xa8a090);
  for (const u of [-6.2, -3.1, 0, 3.1, 6.2]) { cais(x + u, qz + 0.4, 0, 2.4, 0.36); if (rnd() < 0.85) navio(x + u + 0.6, qz + 1.9, (rnd() - 0.5) * 0.15, 0.95, pick([0x5a3e28, 0x4a3222, 0x6a4a30])); barco(x + u - 0.45, qz + 1.4, 0.2); }
  for (const u of [-5.2, -2.0, 2.0, 5.0]) { const p = Pc(x + u, 0.21, qz - 0.1), q = det(p); p.cx(MM.madeira, 1.2, 0.5, 0.5, 0, 0.25, 0, 0xc8b89a); telhado(p, MM.telha, 1.2, 0.5, 0.2, 0.5, 0xc8683a, { cumeeira: 'x' }); plano(BD, q.m, MM.madeira, 0.24, 0.3, 0, 0.15, 0.256, 0, 0x3a2a1e); }
  for (const u of [-3.8, 1.2, 4.6]) { guindaste(x + u, qz + 0.3, Math.PI); }
  for (let k = 0; k < 8; k++) lampiao(x - 7 + k * 2, qz + 0.38);
  luz(x, 1.2, qz + 0.5, 0xffa050, 20, 10); luz(x, Ysolo(x, z) + 2, z - 3, 0xffa050, 24, 10);
  // vinhedos e oliveiras no planalto ao norte
  for (let i = 0; i < 10; i++) { const vx = x + (rnd() - 0.5) * 24, vz = z - 13 - rnd() * 6; if (Y(vx, vz) > 1 && dentroMuro(m, vx, vz) < -1.2 && !ocupadoPorEstrada(vx, vz)) (rnd() < 0.6 ? vinhedo(vx, vz, 2.0, 1.4, rnd() * 0.6) : pomar(vx, vz, 2, 1.5, rnd(), 0x6a7a4a)); }
}
function ocupadoPorEstrada(x: number, z: number) { const f = new Cid(x, z, null); return f.estradasPerto(2.5).length > 0; }

// ============================================================ TIBERUS ============================================================
function minotauroEstatua(x: number, z: number, h: number, ry = 0) {
  const p = Pc(x, Ysolo(x, z), z, ry, h / 5), c = 0x8a8278;
  p.cx(MM.pedra, 1.6, 0.6, 1.6, 0, 0.3, 0, 0x6a6058); for (const s of [-1, 1]) p.cil(MM.marmore, 0.28, 1.6, s * 0.35, 0.6, 0, c, 6, 0.22);
  p.cx(MM.marmore, 1.3, 1.6, 0.8, 0, 3.0, 0, c); p.esf(MM.marmore, 0.38, 0, 4.1, 0.15, c, 1.15);
  for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(0.1, 0.8, 5); g.rotateZ(-s * 1.2); g.translate(s * 0.55, 4.45, 0.1); geo(BC, MM.marmore, g, 0xb8b0a0, p.m); p.cil(MM.marmore, 0.18, 1.5, s * 0.85, 2.2, 0, c, 6); }
  p.cx(MM.marmore, 0.12, 2.6, 0.12, 0.95, 3.0, 0.3, 0x9a9488); p.cx(MM.marmore, 0.9, 0.5, 0.08, 0.95, 4.2, 0.3, 0x9a9488);
}
function tiberus(L: Lugar) {
  const m = muroDe('tiberus'), c = new Cid(L.x, L.z, m), { x, z } = L, S = 9.5; reseed(88);
  const A = (u: number, v: number): V => [x + u, z + v];
  const gates: Portao[] = [...portoes(m)];
  for (const [u, v, tx, tz] of [[0, -S, 0, -1], [S, 0, 1, 0], [-S, 0, -1, 0], [0, S, 0, 1]]) if (!gates.some(g => dist(g.x, g.z, x + u, z + v) < 2)) gates.push({ x: x + u, z: z + v, tx, tz });
  muralha(m, gates, { h: 1.5, esp: 0.6, cor: 0x8a7a6a, torre: { r: 0.6, h: 2.1, quadrada: true, cada: 4.75 }, portao: { larg: 1.0 }, bandeira: 0x9a1a14 });
  const gS = gates.reduce((a, b) => (b.z > a.z ? b : a)); for (const s of [-1, 1]) minotauroEstatua(gS.x + s * 2.3, gS.z + 1.4, 3.6, Math.PI);
  // fórum: praça, Templo de Tauron, colosso, basílica
  piso(x, z, { w: 4.4, d: 3.8 }, CM.lajota, 0xd8ccb8); c.reservar(x, z, 4.4, 3.8);
  minotauroEstatua(x, z + 0.3, 5.5, Math.PI);
  { const tz = z - 3.0, p = Pc(x, chao(x, tz, 1), tz), q = det(p); p.cx(MM.marmore, 2.2, 0.35, 1.7, 0, 0.0, 0, 0xd8d0c4); p.cx(MM.marmore, 1.5, 1.1, 1.1, 0, 0.7, -0.2, 0xe0d8cc);
    for (let i = 0; i < 6; i++) p.cil(MM.marmore, 0.07, 1.05, -0.95 + i * 0.38, 0.17, 0.72, 0xeee8dc, 8); telhado(p, MM.telha, 2.1, 1.7, 0.42, 1.22, 0xb05030, { cumeeira: 'z', parede: [MM.marmore, 0xe0d8cc] });
    p.cx(MM.marmore, 2.1, 0.1, 1.6, 0, 1.18, 0, 0xd8d0c4); plano(BD, q.m, CM.vitral, 0.3, 0.5, 0, 0.62, 0.351, 0, 0xffffff); const v = p.pos(0, 0.8, 1); brilho(v.x, v.y, v.z, 1.3); luz(v.x, v.y, v.z, 0xff9a50, 18, 7); c.reservar(x, tz, 2.3, 1.8); }
  { const bx = x + 3.3, p = Pc(bx, chao(bx, z, 0.8), z, -Math.PI / 2); p.cx(MM.marmore, 2.4, 0.75, 1.0, 0, 0.27, 0, 0xd8ccb8); telhado(p, MM.telha, 2.4, 1.0, 0.3, 0.65, 0xb85a30, { cumeeira: 'x', parede: [MM.marmore, 0xd8ccb8] }); for (let i = 0; i < 8; i++) p.cil(MM.marmore, 0.05, 0.65, -1.05 + i * 0.3, 0, 0.56, 0xeee8dc, 6); c.reservar(bx, z, 2.5, 1.2, -Math.PI / 2); }
  // ruas em grade (cardo e decúmano largos)
  const R = (pts: V[], w: number) => c.rua(pts, w, CM.calcada, { cor: 0xc0b4a4 });
  const ruas: [V[], number][] = [[R([[gS.x, gS.z], A(0, -S)], 0.62), 0.62], [R([A(-S, 0), A(S, 0)], 0.62), 0.62]];
  for (const v of [-6.4, -3.2, 3.2, 6.4]) ruas.push([R([A(-S + 0.4, v), A(S - 0.4, v)], 0.3), 0.3]);
  for (const u of [-6.4, -3.2, 3.2, 6.4]) ruas.push([R([A(u, -S + 0.4), A(u, S - 0.4)], 0.3), 0.3]);
  lampioesNaRua(ruas[0][0], 0.62, 1.2); lampioesNaRua(ruas[1][0], 0.62, 1.2);
  // arena (nordeste), quartéis e campo de treino (noroeste), termas (sudeste)
  { const [ax, az] = A(4.8, -4.8); arena(ax, az, 0, 1.3, 1.05, 0xa89c8c, 3); c.reservar(ax, az, 2.9, 2.4); }
  { const [qx, qz] = A(-4.8, -4.8); piso(qx, qz + 0.75, { w: 2.3, d: 1.1 }, CM.areia, 0xd8c8a0); c.reservar(qx, qz + 0.75, 2.3, 1.1); for (let i = 0; i < 6; i++) det(Pc(qx - 0.9 + (i % 3) * 0.9, Ysolo(qx, qz), qz + 0.5 + ((i / 3) | 0) * 0.5)).cil(MM.madeira, 0.03, 0.2, 0, 0, 0, 0x6a5038, 5); for (const v of [-0.85, -0.25]) { armazem(qx, qz + v, 0, 2.3, 0.45, 0x8a7a6a, 0x9a4a30); c.reservar(qx, qz + v, 2.4, 0.5); } bandeira(Pc(qx + 1.25, Ysolo(qx, qz), qz), 0, 0, 0, 1.2, 0x9a1a14); }
  { const [bx, bz] = A(4.8, 4.8), p = Pc(bx, chao(bx, bz, 1), bz); p.cx(CM.tijolo, 2.2, 0.6, 2.0, 0, 0.2, 0, 0xc88068); cupula(p, MM.marmore, 0.75, 0, 0.5, 0, 0xd8d0c4, 0.7); for (const s of [-1, 1]) cupula(p, MM.marmore, 0.4, s * 0.75, 0.5, 0.55, 0xd8d0c4, 0.7); c.reservar(bx, bz, 2.3, 2.1); fumo(p.pos(0.8, 0.8, -0.6), 1); }
  // ínsulas (sobrados de tijolo com lojas no térreo)
  ruas.forEach(([r, w]) => casasNaRua(c, r, w, { w: [0.6, 0.95], d: [0.55, 0.8], gap: [0.0, 0.04], prob: 0.97, casa: (hx, hz, ry, w2, d) => casa(hx, hz, ry, w2, d, 'tap', { and: rnd() < 0.5 ? 3 : 2, luz: 0.45 }) }));
  preencher(c, 300, () => A((rnd() - 0.5) * 18, (rnd() - 0.5) * 18), { w: [0.5, 0.8], d: [0.5, 0.7], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'tap', { and: 2, luz: 0.3 }) });
  for (let v = -8; v <= 8; v += 1.6) if (Math.abs(v) > 2.2) { cone(Pc(x - 0.5, Ysolo(x - 0.5, z + v), z + v), MM.plain, 0.12, 0.6, 0, 0, 0, 0x2a4a2a, 6); cone(Pc(x + 0.5, Ysolo(x + 0.5, z + v), z + v), MM.plain, 0.12, 0.6, 0, 0, 0, 0x2a4a2a, 6); }
  // aqueduto chegando do norte
  const yTop = Ysolo(x, z) + 1.25, ax = x - 2.0;
  for (let v = -S - 0.5; v > -S - 10; v -= 0.7) { const az = z + v, yb = Ysolo(ax, az); if (yb > yTop - 0.2) continue; if (yTop - yb > 2.4) break; const p = Pc(ax, yb - 0.2, az); p.cx(MM.pedra, 0.2, yTop - yb + 0.2, 0.2, 0, (yTop - yb + 0.2) / 2, 0, 0xc0b4a0); Pc(ax, yTop, az - 0.35).cx(MM.pedra, 0.28, 0.14, 0.72, 0, 0.07, 0, 0xb0a490); }
  luz(x, Ysolo(x, z) + 2.5, z + 1.5, 0xff9a50, 26, 12);
  for (let i = 0; i < 6; i++) fumo(new THREE.Vector3(x + (rnd() - 0.5) * 15, Ysolo(x, z) + 1.6, z + (rnd() - 0.5) * 15), 1);
}

// =========================================================== NIMBARANN ===========================================================
function nimbarann(L: Lugar) {
  const m = muroDe('nimbarann'), c = new Cid(L.x, L.z, m), { x, z } = L; reseed(470);
  const gates = portoes(m); palicada(m, gates, { h: 0.6 });
  for (const a of [0.8, 2.3, 3.9, 5.5]) { const tx = x + Math.cos(a) * 4.5, tz = z + Math.sin(a) * 4.5; if (!gates.some(g => dist(g.x, g.z, tx, tz) < 1.2)) torreVigia(tx, tz, 1.4); }
  piso(x, z, { r: 0.95 }, CM.terra, 0xa89a88); c.bloquear(x, z, 1.0); poco(x, z); barraca(x + 0.6, z - 0.5, 2.3, 0xc8a040); barraca(x - 0.65, z - 0.4, -2.3, 0x8a3a2a); carroca(x + 0.5, z + 0.65, 0.8);
  { const tx = x - 1.6, tz = z - 1.6; templo(tx, tz, Math.atan2(x - tx, z - tz), 0.55, { parede: 0xc8b898, teto: 0x7a3e2a, tetoMat: MM.telha, torre: 'quadrada' }); c.bloquear(tx, tz, 1.0); }
  const ruas: V[][] = gates.map(g => c.rua([[g.x, g.z], [x + (g.x - x) * 0.25, z + (g.z - z) * 0.25]], 0.3, CM.terra, { cor: 0xa89a88 }));
  ruas.push(c.rua(arco(x, z, 2.75, 0, 6.283, 0.3), 0.24, CM.terra, { cor: 0xa89a88 }));
  ruas.forEach(r => casasNaRua(c, r, 0.3, { w: [0.5, 0.7], d: [0.42, 0.55], gap: [0.05, 0.2], prob: 0.9, casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'lom', { luz: 0.55, fumo: 0.2 }), vazio: (hx, hz) => arvore(hx, hz, 0.6, 0x8a8a3a) }));
  preencher(c, 80, () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 4.3; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }, { w: [0.4, 0.55], d: [0.35, 0.45], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'lom', { luz: 0.4, fumo: 0.15 }) });
  campos(x, z, 6, 10, 9, 'lom');
  moinho(x + 6.5, z + 3.2, 2.5, 1);
  luz(x, Ysolo(x, z) + 1.5, z, 0xffa050, 18, 7);
}

// ========================================================= PORTO DE DEHEON =======================================================
function porto(L: Lugar) {
  const m = muroDe('porto'), c = new Cid(L.x, L.z, m), { x, z } = L; reseed(752);
  const A = (u: number, v: number): V => [x + u, z + v];
  c.area = (hx, hz, r) => dist(hx, hz, x, z) < 6.2 - r && Y(hx, hz) > 0.8;
  const gates = portoes(m), g = gates[0] ?? { x: x + 1, z: z - 4.6, tx: 0, tz: -1 };
  const ruas: [V[], number][] = [];
  ruas.push([c.rua([[g.x, g.z], A(1.6, -1.0), A(1.8, 3.2)], 0.4, CM.calcada, { cor: 0xb0a698 }), 0.4]);
  ruas.push([c.rua([A(-5, -1.2), A(-1.4, -1.1), A(1.6, -1.0), A(5.2, -0.6)], 0.34, CM.calcada, { cor: 0xb0a698, ponte: 0x8a847a }), 0.34]);
  ruas.push([c.rua([A(0.6, 3.4), A(5.6, 3.2)], 0.34, CM.calcada, { cor: 0xb0a698 }), 0.34]);
  ruas.push([c.rua([A(-4.6, -4.6), A(-4.4, 2.2)], 0.26, CM.terra, { cor: 0xa89a88 }), 0.26]);
  lampioesNaRua(ruas[0][0], 0.4, 1.2); lampioesNaRua(ruas[2][0], 0.34, 1.0);
  // torre do porto com farolete, armazéns, cais e navios
  { const [tx, tz] = A(5.9, 3.0), p = Pc(tx, chao(tx, tz, 0.4), tz), q = det(p); p.cil(MM.pedra, 0.38, 1.9, 0, -0.2, 0, 0x8a847a, 10, 0.32); for (let k = 0; k < 8; k++) q.cx(MM.pedra, 0.09, 0.09, 0.09, Math.cos(k * 0.785) * 0.3, 1.74, Math.sin(k * 0.785) * 0.3, 0x8a847a); q.cil(MM.aceso, 0.08, 0.12, 0, 1.7, 0, 0xffffff, 6); const v = p.pos(0, 1.8, 0); brilho(v.x, v.y, v.z, 2.2); luz(v.x, v.y, v.z, 0xffc070, 18, 9); bandeira(p, 0, 1.7, 0, 0.6, 0x5a3a9a); c.bloquear(tx, tz, 0.5); }
  for (const u of [1.2, 3.0, 4.6]) { const [wx, wz] = A(u, 2.4); if (c.livre(caixa(wx, wz, 0.55, 0.3, 0))) { armazem(wx, wz, 0, 1.1, 0.55, 0xd8ccb0, 0xa84a32); c.reservar(wx, wz, 1.15, 0.6); } }
  for (const u of [1.0, 2.8, 4.6]) { cais(x + u, z + 3.9, 0, 2.0, 0.34); navio(x + u + 0.55, z + 5.4, 0.1, 0.85); }
  for (let i = 0; i < 3; i++) barco(x - 1.4 + (rnd() - 0.5) * 0.4, z - 2.5 + i * 1.2, 0.1 + rnd() * 0.3);
  guindaste(x + 2, z + 3.6, Math.PI);
  ruas.forEach(([r, w]) => casasNaRua(c, r, w, { w: [0.5, 0.72], d: [0.45, 0.6], gap: [0.03, 0.12], prob: 0.92, casa: (hx, hz, ry, w2, d) => casa(hx, hz, ry, w2, d, 'deh', { and: rnd() < 0.5 ? 2 : 1, luz: 0.55, fumo: 0.15 }) }));
  preencher(c, 60, () => A((rnd() - 0.5) * 11, (rnd() - 0.5) * 9), { w: [0.45, 0.6], d: [0.4, 0.5], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, 'deh', { luz: 0.4, fumo: 0.1 }) });
  moinho(x - 5.6, z - 5.6, 0.6, 1);
  campos(x, z + -2, 7, 11, 6, 'deh');
  luz(x + 2, Ysolo(x, z) + 1.5, z + 2, 0xffa050, 20, 8);
}

// ============================================================= VILAS ============================================================
/** lavouras em volta (retalhos em várias cores; fardos de feno; cercas) */
function campos(x: number, z: number, r0: number, r1: number, n: number, povo: 'lom' | 'deh' | 'oeste') {
  const cores = povo === 'lom' ? [0xe8c860, 0xd8b050, 0xc8a040, 0xb89a60] : povo === 'deh' ? [0xe0c860, 0x9ab850, 0x7aa048, 0xb08860, 0xc8b070] : [0xc8b070, 0xb0a060];
  const f = new Cid(x, z, null); f.estradasPerto(r1 + 3); f.area = () => true;
  for (let i = 0, k = 0; i < n * 5 && k < n; i++) {
    const a = rnd() * 6.283, r = r0 + rnd() * (r1 - r0), cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r, w = 1.4 + rnd() * 1.2, d = 0.9 + rnd() * 0.8, ry = a + (rnd() - 0.5) * 0.4;
    if (Y(cx, cz) < 0.45 || pertoDeRio(cx, cz, 1) || !f.livre(caixa(cx, cz, w / 2 + 0.1, d / 2 + 0.1, ry), 0.15)) continue;
    f.reservar(cx, cz, w + 0.2, d + 0.2, ry);
    if (povo === 'oeste') vinhedo(cx, cz, w, d, ry); else { lavoura(cx, cz, w, d, ry, pick(cores), rnd() < 0.4 ? 2 + ((rnd() * 3) | 0) : 0); if (rnd() < 0.35) cercaRet(cx, cz, w + 0.1, d + 0.1, ry); }
    k++;
  }
}
function vila(L: Lugar, est: Est, povo: 'lom' | 'deh' | 'oeste') {
  const { x, z } = L, R = 2.7 * (L.tam ?? 1), c = new Cid(x, z, null); reseed(Math.round(Math.abs(x * 131 + z * 977)) + 11);
  c.area = (hx, hz, r) => dist(hx, hz, x, z) < R + 0.6 - r * 0.5;
  let ruas = c.estradasPerto(R + 2).map(r => [r, 0.62] as [V[], number]);
  if (!ruas.length) { const a = rnd() * Math.PI; ruas = [[c.rua([[x - Math.cos(a) * R, z - Math.sin(a) * R], [x + Math.cos(a) * R, z + Math.sin(a) * R]], 0.28, CM.terra, { cor: 0xa89a88 }), 0.28]]; }
  // praça da vila: poço, igreja/capela/santuário
  const [r0] = ruas, acc = r0[0], meio = acc.reduce((a, b) => (dist(b[0], b[1], x, z) < dist(a[0], a[1], x, z) ? b : a));
  const i0 = acc.indexOf(meio), t = acc[Math.min(acc.length - 1, i0 + 1)], tx = t[0] - meio[0], tz = t[1] - meio[1], TL = Math.hypot(tx, tz) || 1, nx = -tz / TL, nz = tx / TL;
  const px = meio[0] + nx * 1.0, pz = meio[1] + nz * 1.0;
  piso(px, pz, { r: 0.6 }, CM.terra, 0xa89a88); c.bloquear(px, pz, 0.65); poco(px, pz);
  const ix = meio[0] - nx * 1.25, iz = meio[1] - nz * 1.25, ry = Math.atan2(nx, nz);
  if (povo === 'deh') { templo(ix, iz, ry, 0.5, { parede: 0xe0d8c8, teto: 0x4a4a56, torre: 'agulha' }); c.bloquear(ix, iz, 0.75); }
  else if (povo === 'oeste') { templo(ix, iz, ry, 0.42, { mat: MM.reboco, parede: 0xf4f0e6, tetoMat: MM.telha, teto: 0xc8683a, torre: 'quadrada' }); c.bloquear(ix, iz, 0.65); }
  else if (rnd() < 0.6) { templo(ix, iz, ry, 0.42, { mat: MM.reboco, parede: 0xc8b090, tetoMat: MM.palha, teto: 0xa89058, torre: null }); c.bloquear(ix, iz, 0.65); }
  // casas ao longo da estrada (a estrada é a rua da vila) e uma travessa
  ruas.push([c.rua([[meio[0] + nx * 0.35, meio[1] + nz * 0.35], [meio[0] + nx * R * 0.9, meio[1] + nz * R * 0.9]], 0.22, CM.terra, { cor: 0xa89a88 }), 0.22]);
  { const a = Math.atan2(nz, nx) + (rnd() < 0.5 ? 0.6 : -0.6); ruas.push([c.rua([[meio[0] - nx * 0.35, meio[1] - nz * 0.35], [meio[0] + Math.cos(a + Math.PI) * R * 0.85, meio[1] + Math.sin(a + Math.PI) * R * 0.85]], 0.22, CM.terra, { cor: 0xa89a88 }), 0.22]); }
  ruas.forEach(([r, w]) => casasNaRua(c, r, w, { w: [0.48, 0.7], d: [0.4, 0.55], gap: [0.05, 0.22], recuo: 0.08, prob: 0.92,
    casa: (hx, hz, ry2, w2, d) => { casa(hx, hz, ry2, w2, d, povo === 'lom' && rnd() < 0.12 ? 'ruina' : est, { and: est === 'deh' && rnd() < 0.3 ? 2 : 1, luz: 0.5, fumo: 0.15 }); if (rnd() < 0.35) { const bx = hx - Math.sin(ry2) * (d / 2 + 0.3), bz = hz - Math.cos(ry2) * (d / 2 + 0.3); if (c.livre(caixa(bx, bz, 0.25, 0.18, ry2))) { piso(bx, bz, { w: 0.5, d: 0.34, ry: ry2 }, CM.campo, 0x6a8a3a, 0.035); cercaRet(bx, bz, 0.52, 0.36, ry2); } } },
    vazio: (hx, hz) => (rnd() < 0.5 ? arvore(hx, hz, 0.6, povo === 'oeste' ? 0x3a5a2a : 0x5a8a3a) : barris(hx, hz, 2)) }));
  preencher(c, 40, () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * R; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }, { w: [0.42, 0.6], d: [0.36, 0.5], casa: (hx, hz, ry, w, d) => casa(hx, hz, ry, w, d, est, { luz: 0.4, fumo: 0.1 }) });
  if (rnd() < 0.5) carroca(meio[0] + nx * 0.5, meio[1] + nz * 0.5 + 0.3, rnd() * 6);
  campos(x, z, R + 0.6, R + 4.5, povo === 'oeste' ? 3 : 5, povo);
  if (povo === 'deh' && rnd() < 0.8) { const a = rnd() * 6.283; moinho(x + Math.cos(a) * (R + 1.6), z + Math.sin(a) * (R + 1.6), rnd() * 6, 0.9); }
  if (povo !== 'oeste' && rnd() < 0.5) { const a = rnd() * 6.283; pomar(x + Math.cos(a) * (R + 2.2), z + Math.sin(a) * (R + 2.2), 1.6, 1.1, a, povo === 'lom' ? 0x8a8a3a : 0x5a8a3a); }
  if (povo === 'oeste') for (let i = 0; i < 5; i++) { const a = rnd() * 6.283, r = R + rnd() * 1.5; cone(Pc(x + Math.cos(a) * r, Ysolo(x + Math.cos(a) * r, z + Math.sin(a) * r), z + Math.sin(a) * r), MM.plain, 0.1, 0.55, 0, 0, 0, 0x2a4a2a, 6); }
  ocupar(x, z, R + 0.5);
  luz(px, Ysolo(px, pz) + 1, pz, 0xffa050, 12, 5);
}
function aldeiaGelo(L: Lugar) {
  const { x, z } = L, c = new Cid(x, z, null); reseed(Math.round(Math.abs(x * 37 + z * 91)) + 3);
  c.area = (hx, hz, r) => dist(hx, hz, x, z) < 2.6 - r * 0.3; c.estradasPerto(4.5);
  c.bloquear(x, z, 0.7); fogueira(x, z, 1.4, true);
  preencher(c, 40, () => { const a = rnd() * 6.283, r = 1.0 + rnd() * 1.6; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }, { w: [0.6, 0.9], d: [0.45, 0.6], casa: (hx, hz, ry, w, d) => { const ry2 = Math.atan2(x - hx, z - hz); casa(hx, hz, ry2, w, d, 'giluk', { luz: 0.6, fumo: 0.4 }); void ry; } });
  for (let i = 0; i < 3; i++) { const a = rnd() * 6.283; lenha(x + Math.cos(a) * 0.9, z + Math.sin(a) * 0.9, a); }
  const q = det(Pc(x + 1.2, Ysolo(x + 1.2, z - 1), z - 1)); for (const s of [-1, 1]) q.cx(MM.madeira, 0.03, 0.4, 0.03, s * 0.3, 0.2, 0, 0x4a3828); q.cx(MM.madeira, 0.64, 0.02, 0.02, 0, 0.38, 0, 0x4a3828); q.cx(MM.plain, 0.22, 0.2, 0.01, 0, 0.26, 0, 0x8a6a4a);
  ocupar(x, z, 3);
}
function pescadores(L: Lugar) {
  const { x, z } = L, c = new Cid(x, z, null); reseed(Math.round(Math.abs(x * 53 + z * 17)) + 5);
  let melhor = 0, mz = 1e9; for (let a = 0; a < 6.28; a += 0.2) { const h = Y(x + Math.cos(a) * 4, z + Math.sin(a) * 4); if (h < mz) { mz = h; melhor = a; } }
  c.area = (hx, hz, r) => dist(hx, hz, x, z) < 3 - r * 0.3 && Y(hx, hz) > 0.32;
  preencher(c, 50, () => { const a = melhor + (rnd() - 0.5) * 3, r = 0.6 + rnd() * 2.4; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }, { w: [0.5, 0.7], d: [0.4, 0.5], casa: (hx, hz, _ry, w, d) => casa(hx, hz, Math.atan2(Math.cos(melhor), Math.sin(melhor)), w, d, 'ilha', { luz: 0.5, fumo: 0.25 }) });
  for (const off of [-0.9, 0.9]) { const cx = x + Math.cos(melhor) * 2.6 - Math.sin(melhor) * off, cz = z + Math.sin(melhor) * 2.6 + Math.cos(melhor) * off; cais(cx, cz, Math.PI / 2 - melhor, 2.4, 0.3); barco(cx + Math.cos(melhor) * 1.8 + 0.3, cz + Math.sin(melhor) * 1.8, Math.PI / 2 - melhor + 0.3); }
  for (let i = 0; i < 3; i++) { const a = melhor + Math.PI + (rnd() - 0.5) * 1.5, r = 1.2 + rnd(), vx = x + Math.cos(a) * r, vz = z + Math.sin(a) * r, q = det(Pc(vx, Ysolo(vx, vz), vz, a)); for (const s of [-1, 1]) q.cx(MM.madeira, 0.02, 0.32, 0.02, s * 0.25, 0.16, 0, 0x4a3828); q.cx(MM.plain, 0.5, 0.2, 0.005, 0, 0.2, 0, 0x6a6a5a); }
  fogueira(x - Math.cos(melhor) * 0.6, z - Math.sin(melhor) * 0.6, 0.9);
  ocupar(x, z, 3);
}

// ============================================================ TUDO ============================================================
export const TIPOS_CIDADE = ['barud', 'valkaria', 'giluk', 'malpetrim', 'tiberus', 'nimbarann', 'porto', 'vila-lom', 'vila-deh', 'vila', 'aldeia-gelo', 'pesca'];
export function construirCidades(Gr: THREE.Group, M: { lamps: THREE.MeshBasicMaterial[] }, out: Mini) {
  iniciarKit(out, M.lamps);
  for (const L of LUGARES) {
    switch (L.tipo) {
      case 'barud': barud(L); break; case 'valkaria': valkaria(L); break; case 'giluk': giluk(L); break; case 'malpetrim': malpetrim(L); break;
      case 'tiberus': tiberus(L); break; case 'nimbarann': nimbarann(L); break; case 'porto': porto(L); break;
      case 'vila-lom': vila(L, 'lom', 'lom'); break; case 'vila-deh': vila(L, 'deh', 'deh'); break; case 'vila': vila(L, 'oeste', 'oeste'); break;
      case 'aldeia-gelo': aldeiaGelo(L); break; case 'pesca': pescadores(L); break;
    }
  }
  return terminarKit(Gr);
}
