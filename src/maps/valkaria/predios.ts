// Valkaria — prédios com interior (casca genérica de Barud: paredes com vãos, pisos, escada, telhado na camada) e a
// mobília de cada um. Posições pela planta (ângulo e raio a partir da deusa); frente virada para o centro.
import * as THREE from 'three';
import { type Batch, MAT, cx, cil, cone } from '../barud/common';
import { type Predio, MATRIZ, SPEC } from '../barud/edificios';
import {
  mesa, banco, banqueta, cadeira, cama, bau, estante, prateleira, lareira, balcao, barril, caixote, sacos, vela, lustre,
  tapecaria, quadro, tapete, armario, caldeirao, forja, altar, bancoTemplo, armadura, cavalete, servico, peca,
} from '../barud/mobilia';
import { luz } from '../barud/cidade';
import { halo } from '../../core/kit';
import { PI, polar, paraCentro, rnd, pick } from './plano';
import { matsV } from './mats';

/** prédio posto pela planta: ângulo a, raio r (centro), frente para a deusa */
function em(a: number, r: number, p: Omit<Predio, 'x' | 'z' | 'ry'>): Predio { const [x, z] = polar(a, r); return { ...p, x: +x.toFixed(2), z: +z.toFixed(2), ry: paraCentro(x, z) }; }
const MARMORE = 0xe6e0ec, LILAS = 0xd8cce4, CREME = 0xe4d4bc;

export const PREDIOS_V: Predio[] = [
  em(-PI / 2, 74, { id: 'v-palacio', matExt: matsV().marmore, tipo: 'salao', w: 44, d: 30, h: 10, andares: 1, ext: 'pedra', corExt: MARMORE, telha: 'ardosia', base: 2.4,
    portas: [{ lado: 'f', c: 0, w: 3.6, h: 5.2 }, { lado: 't', c: 12 }], janelas: 4.4, vd: [0, 1.8, 13.5, 0, 3.2, -12] }),
  em(PI, 68, { id: 'v-catedral', matExt: matsV().marmore, tipo: 'templo', w: 22, d: 30, h: 13, andares: 1, ext: 'pedra', corExt: 0xe0d8ea, telha: 'ardosia',
    portas: [{ lado: 'f', c: 0, w: 3.4, h: 6 }, { lado: 'e', c: -8 }], janelas: 3.8, vd: [0, 1.75, 13.5, 0, 4, -12] }),
  em(0.42, 66, { id: 'v-biblioteca', matExt: matsV().marmore, w: 22, d: 14, h: 4.2, andares: 2, ext: 'muro', corExt: LILAS, telha: 'ardosia', portas: [{ lado: 'f', c: 0, w: 2.2, h: 2.8 }], janelas: 3,
    escada: { x: 8.6, z: -4.4, dir: 'z', s: 1 }, internas: [[-11, -1, 6.5, -1, 9, 1], [6.5, -7, 6.5, 7, 3, 1]], vd: [-9.5, 1.7, 5.8, 6, 1.2, -5] }),
  em(PI / 2 + 0.45, 70, { id: 'v-grifo', w: 16, d: 12, h: 3.6, andares: 2, ext: 'muro', corExt: CREME, telha: 'telha', portas: [{ lado: 'f', c: -2.5 }, { lado: 't', c: 4 }], janelas: 3,
    escada: { x: 6.3, z: -5.2, dir: 'x', s: -1 }, internas: [[-8, -3, 2, -3, 6, 0], [-8, -1, 8, -1, -1, 1], [-2.6, -1, -2.6, 6, 3.2, 1], [2.6, -1, 2.6, 6, 3.2, 1]] }),
  em(PI / 2 - 0.45, 70, { id: 'v-estalagem', w: 15, d: 12, h: 3.4, andares: 2, ext: 'muro', corExt: 0xdcd0c0, telha: 'telha', portas: [{ lado: 'f', c: 2.5 }], janelas: 3,
    escada: { x: -5.8, z: -5.2, dir: 'x', s: 1 }, internas: [[-7.5, -2.4, 7.5, -2.4, 11, 0], [-7.5, 0, 7.5, 0, -1, 1], [-2.5, 0, -2.5, 6, 3, 1], [2.5, 0, 2.5, 6, 3, 1]] }),
  em(PI / 2 + 0.3, 95, { id: 'v-botica', w: 9, d: 9, h: 3.4, andares: 1, ext: 'muro', corExt: 0xc8dcc8, telha: 'ardosia', portas: [{ lado: 'f', c: 1.5 }], janelas: 2.6, internas: [[-4.5, -1.6, 4.5, -1.6, 6.5, 0]] }),
  em(PI / 2 - 0.3, 95, { id: 'v-armaria', w: 11, d: 9, h: 3.8, andares: 1, ext: 'pedra', corExt: 0xb8b0b8, telha: 'ardosia', portas: [{ lado: 'f', c: -1.5, w: 2.2, h: 2.6 }, { lado: 't', c: 3 }], janelas: 3, internas: [[-5.5, -1.4, 5.5, -1.4, 7.6, 0]] }),
  em(PI + 0.5, 70, { id: 'v-guilda', w: 18, d: 13, h: 3.8, andares: 2, ext: 'muro', corExt: 0xd8ccb8, telha: 'telha', portas: [{ lado: 'f', c: 0, w: 1.8, h: 2.6 }], janelas: 3,
    escada: { x: 7, z: -5.6, dir: 'x', s: -1 }, internas: [[-9, -2.5, 9, -2.5, 4, 0], [-9, 0, 9, 0, -1, 1], [-3, 0, -3, 6.5, 3, 1], [3, 0, 3, 6.5, 3, 1]] }),
  em(-1.07, 72, { id: 'v-quartel', matExt: matsV().marmore, tipo: 'quartel', w: 18, d: 14, h: 3.8, andares: 1, ext: 'pedra', corExt: 0xd0cad8, telha: 'ardosia', portas: [{ lado: 'f', c: 0, w: 2.2, h: 2.8 }], janelas: 3.4,
    internas: [[-9, 0, 2, 0, 5, 0], [2, -7, 2, 7, 10.2, 0], [2, -2.5, 9, -2.5, 3, 0], [2, 2.5, 9, 2.5, 3, 0]], vd: [1.3, 1.7, 6.3, -7, 1.1, 1.2] }),
];

// ---------- mobília ----------
const luzI = (v: THREE.Vector3, n = 4, cor = 0xff9a48, dist = 9, prio = 4) => { luz(v.x, v.y, v.z, n * 18, prio, cor, dist * 1.5, 6); halo(v.x, v.y, v.z, 0.45); };
const OURO = 0xd8b048;

export function mobiliarV(B: Batch, id: string) {
  const m = MATRIZ[id], p = SPEC[id], M = MAT(), H = p.h;
  const W = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(m);
  switch (id) {
    case 'v-palacio': {
      // Sala do Trono: tapete púrpura da porta ao estrado, colunas, estandartes, braseiros, trono dourado
      tapete(B, m, 0, 3, 0, 3.2, 22); tapete(B, m, 0, -9.5, 0, 9, 5);
      { const P = peca(B, m, 0, 0, -11); P.cx(M.lajota, 12, 0.5, 6, 0, 0.25, 0, 0xd8d0e0); P.cx(M.lajota, 8, 0.5, 4, 0, 0.75, -0.5, 0xd8d0e0);
        P.cx(M.plain, 1.6, 0.7, 1.2, 0, 1.35, -1.2, OURO); P.cx(M.plain, 1.6, 2.8, 0.3, 0, 2.4, -1.75, OURO); P.cx(M.tecido, 1.2, 0.2, 1.0, 0, 1.75, -1.1, 0x5a2a8a); P.cx(M.tecido, 1.2, 2.2, 0.08, 0, 2.6, -1.58, 0x5a2a8a);
        P.esf(M.plain, 0.22, 0, 3.95, -1.75, OURO); for (const s of [-1, 1]) P.cx(M.plain, 0.18, 0.8, 1.1, s * 0.85, 1.75, -1.15, OURO); }
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const z = -9 + i * 4; cil(B, M.pedra, 0.55, H - 0.4, s * 9, 0, z, 0xe8e2ee, 16, m); cil(B, M.plain, 0.7, 0.4, s * 9, H - 0.6, z, OURO, 16, m); cil(B, M.pedra, 0.75, 0.4, s * 9, 0, z, 0xd0c8d8, 16, m);
        tapecaria(B, m, s * 21.7, 5.5, z + 2, s > 0 ? -PI / 2 : PI / 2, 1.8, 4.4, i % 2 ? 0x4a2a7a : 0x6a1a2a); }
      for (const [x, z] of [[-5, -6], [5, -6], [-5, 8], [5, 8]]) { const P = peca(B, m, x, 0, z); P.cil(M.ferro, 0.12, 1.1, 0, 0, 0, 0xffffff, 8); P.cil(M.ferro, 0.45, 0.25, 0, 1.1, 0, 0xffffff, 12, 0.3); luzI(caldeirao(B, m, x, z, 1.2), 7, 0xff8a3a, 12, 6); }
      for (const z of [-4, 6]) luzI(lustre(B, m, 0, H - 2.6, z, 0.9), 8, 0xffc070, 16, 5);
      for (const s of [-1, 1]) { armadura(B, m, s * 4.6, -9.6, 0); armadura(B, m, s * 2.2, 13.6, PI); }
      for (let i = 0; i < 4; i++) quadro(B, m, -15 + i * 10, 4.2, -14.75, 0, 2, 2.6);
      break;
    }
    case 'v-catedral': {
      // nave com bancos, altar elevado com a estátua da deusa (pequena), velas, lustres, vitrais (da casca)
      { const P = peca(B, m, 0, 0, -11.5); P.cx(M.lajota, 10, 0.6, 5, 0, 0.3, 0, 0xe0d8ea); altar(B, m, 0, -11, 0, 0.6);
        P.cil(M.pedra, 0.9, 1.0, 0, 0.6, -1.6, 0xe0d8ea, 12); P.cil(M.pedra, 0.55, 3.2, 0, 1.6, -1.6, 0xd8d0e8, 12, 0.35); P.esf(M.pedra, 0.32, 0, 5.0, -1.6, 0xe0d8ea); P.cx(M.plain, 1.6, 0.1, 0.1, 0, 3.6, -1.4, OURO); }
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) bancoTemplo(B, m, s * 3.4, -5 + i * 2.1, 0, 4.4);
      tapete(B, m, 0, 3, 0, 2.2, 22);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = -10 + i * 5.5; cil(B, M.pedra, 0.5, H - 0.5, s * 7, 0, z, 0xe8e2ee, 14, m); }
      for (const z of [-6, 2, 10]) luzI(lustre(B, m, 0, H - 4, z, 1.2), 5, 0xffb060, 14, 5);
      for (let i = 0; i < 24; i++) vela(B, m, -2.5 + (i % 12) * 0.45, 0.65 + ((i / 12) | 0) * 0.15, -9.2 - ((i / 12) | 0) * 0.3);
      luzI(W(0, 1.4, -9.4), 6, 0xffb060, 10, 6);
      for (const s of [-1, 1]) tapecaria(B, m, s * 10.75, 6, -11, s > 0 ? -PI / 2 : PI / 2, 2, 5, 0x5a3a8a);
      break;
    }
    case 'v-biblioteca': {
      // Grande Biblioteca da Academia Arcana: estantes altas, mesas de leitura, globo arcano, escadas
      for (let i = 0; i < 6; i++) { estante(B, m, -9 + i * 2.6, -6.6, 0, 2.2, 3.4); estante(B, m, -9 + i * 2.6, 6.6, PI, 2.2, 3.4); }
      for (const x of [-7, -3, 1]) { mesa(B, m, x, 1, 0, 2.4, 1.0); for (const s of [-1, 1]) { cadeira(B, m, x - 0.6, 1 + s * 0.8, s > 0 ? PI : 0); cadeira(B, m, x + 0.6, 1 + s * 0.8, s > 0 ? PI : 0); } vela(B, m, x, 0.8, 1); }
      for (const x of [-7, 1]) luzI(W(x, 1.2, 1), 2.5, 0xffc070, 7, 4);
      { const P = peca(B, m, 4.6, 0, 2); P.cil(M.madeira, 0.35, 0.9, 0, 0, 0, 0x3a2618, 10); P.esf(M.plain, 0.6, 0, 1.6, 0, 0x8a6aff); for (const r of [0, 1.1, 2.2]) P.cx(M.plain, 1.5, 0.03, 0.03, 0, 1.6, 0, OURO, r); luzI(W(4.6, 1.6, 2), 3, 0x9a7cff, 8, 5); }
      // em cima: salas de estudo e o gabinete do arquimago
      for (let i = 0; i < 4; i++) estante(B, m, -9.5 + i * 2.4, -6.6, 0, 2, 2.4, true, H);
      mesa(B, m, -4, 3, 0, 2.6, 1.2, H, 0x2a1a12); for (let i = 0; i < 3; i++) cadeira(B, m, -5 + i, 2, 0, H);
      mesa(B, m, 8.5, 3, PI / 2, 1.8, 1.0, H, 0x2a1a12); cadeira(B, m, 8.5, 1.9, 0, H); estante(B, m, 10.6, 3, -PI / 2, 2, 2.4, true, H);
      quadro(B, m, 8.5, H + 2, 6.75, PI, 1.2, 1.4); luzI(W(8.5, H + 1.2, 3), 2.5, 0x9a7cff, 6, 3); luzI(W(-4, H + 2.2, 3), 2.5, 0xffc070, 7, 3);
      tapete(B, m, -2, 2, 0, 6, 3, H);
      break;
    }
    case 'v-grifo': {
      // taverna do Grifo Dourado: balcão, lareira, mesas, um palco pequeno; quartos em cima
      luzI(lareira(B, m, -3.5, -2.7, 0, 0, 2.2), 8, 0xff7a30, 11, 6);
      balcao(B, m, 5, 1, -PI / 2, 4.4); prateleira(B, m, 7.75, 1, -PI / 2, 3.6, 1.3, 'garrafas'); prateleira(B, m, 7.75, 1, -PI / 2, 3.6, 2.0, 'garrafas');
      for (let i = 0; i < 4; i++) barril(B, m, 7.2, -1.2 + i * 0.8, 0, true);
      for (const [x, z] of [[-5.5, 1], [-5.5, 4], [-1.6, 2.4], [1.8, 4.6]]) { mesa(B, m, x, z, 0, 2.2, 0.9); banco(B, m, x, z - 0.75, 0, 2); banco(B, m, x, z + 0.75, PI, 2); servico(B, m, x - 0.4, 0.8, z); servico(B, m, x + 0.5, 0.8, z + 0.2); }
      for (const z of [0, 1.6, 3]) banqueta(B, m, 4.1, z);
      { const P = peca(B, m, -6.2, 0, -1.2); P.cx(M.tabuas, 3, 0.4, 2.2, 0, 0.2, 0, 0x5a4030); }
      luzI(lustre(B, m, -2, 3.1, 2.6, 0.9), 5, 0xffa050, 10, 5);
      { const P = peca(B, m, -3.5, 2.6, -2.9); P.cx(M.plain, 1.2, 0.8, 0.06, 0, 0, 0, OURO); P.cx(M.plain, 0.5, 0.6, 0.3, 0, 0.1, 0.15, 0xb08a30); }
      tapecaria(B, m, -7.75, 2.1, 3, PI / 2, 1.4, 1.8, 0x4a2a6a);
      caldeirao(B, m, 4, -4.8); mesa(B, m, 1.5, -5.2, 0, 1.6, 0.7); sacos(B, m, -1, -5.2, 4);
      for (const x of [-5.3, 0, 5.3]) { cama(B, m, x - 0.6, 3.5, 0, false, H); bau(B, m, x + 1.2, 5.2, PI, H); vela(B, m, x + 1.2, H + 0.5, 4.2); }
      luzI(W(0, H + 2.2, 2.8), 2.5, 0xffa050, 6, 3);
      break;
    }
    case 'v-estalagem': {
      // Estalagem da Deusa Adormecida: recepção, sala de estar, oito quartos em cima
      balcao(B, m, 3.5, -1.2, 0, 3); prateleira(B, m, 3.5, -2.2, 0, 3, 1.3, 'potes'); quadro(B, m, -2, 2.2, -2.2, 0, 1.2, 0.9);
      luzI(lareira(B, m, -5.5, 3, PI / 2, 0, 1.8), 6, 0xff7a30, 9, 5);
      for (const [x, z] of [[-2.5, 1.8], [-2.5, 4.4]]) { mesa(B, m, x, z, 0, 1.4, 0.9); cadeira(B, m, x - 0.9, z, PI / 2); cadeira(B, m, x + 0.9, z, -PI / 2); }
      tapete(B, m, -3, 3, 0, 4, 4); luzI(lustre(B, m, 0, 2.9, 2.5, 0.7), 4, 0xffb060, 9, 4);
      for (let i = 0; i < 6; i++) sacos(B, m, -6 + i * 2.2, -4.6, 2);
      for (const x of [-5, 0, 5]) { cama(B, m, x - 0.5, 3.2, 0, x === 0, H); bau(B, m, x + 1.3, 5.2, PI, H); }
      for (let i = 0; i < 3; i++) cama(B, m, -5 + i * 5, -4.2, PI, false, H);
      luzI(W(0, H + 2.2, 3), 2, 0xffa050, 6, 3);
      break;
    }
    case 'v-botica': {
      // botica do alquimista: prateleiras de frascos, caldeirão borbulhando, ervas
      balcao(B, m, 0, -0.6, 0, 4); prateleira(B, m, 0, -1.4 + 0, 0, 4, 1.3, 'potes');
      for (const x of [-3.9, 3.9]) { prateleira(B, m, x, 2, x < 0 ? PI / 2 : -PI / 2, 3, 1.2, 'ervas'); prateleira(B, m, x, 2, x < 0 ? PI / 2 : -PI / 2, 3, 1.9, 'potes'); }
      luzI(caldeirao(B, m, -2, -3), 5, 0x7aff8a, 7, 5); mesa(B, m, 1.5, -3.2, 0, 2, 0.8); for (let i = 0; i < 5; i++) vela(B, m, 0.8 + i * 0.35, 0.82, -3.2);
      luzI(W(0, 2.6, 2), 2.5, 0xffc070, 6, 3);
      break;
    }
    case 'v-armaria': {
      // armeiro anão: armaduras, cavaletes de armas, forja nos fundos
      for (let i = 0; i < 4; i++) armadura(B, m, -4.5 + i * 1.4, 1.2, PI);
      cavalete(B, m, 3.6, 2.5, -PI / 2); cavalete(B, m, 3.6, 0.4, -PI / 2); balcao(B, m, 0, 3.2, PI, 3);
      luzI(forja(B, m, -2, -3.4, 0), 8, 0xff5a20, 9, 6); barril(B, m, 2, -3.5); caixote(B, m, 3.5, -3.6, 0, 0.7);
      luzI(W(0, 2.8, 1.5), 2.5, 0xffb060, 6, 3);
      break;
    }
    case 'v-guilda': {
      // Guilda dos Aventureiros: quadro de missões, mesas, troféus; em cima, salas do mestre da guilda e dormitório
      { const P = peca(B, m, 0, 0, -2.3); P.cx(M.tabuas, 4, 2, 0.1, 0, 1.6, 0, 0x5a4030); for (let i = 0; i < 9; i++) P.cx(M.plain, 0.4, 0.5, 0.02, -1.6 + (i % 5) * 0.8, 1.2 + ((i / 5) | 0) * 0.8 + rnd() * 0.1, 0.07, pick([0xe0d4b4, 0xd0c4a0, 0xe8dcc0])); }
      for (const [x, z] of [[-5, 1.5], [-5, 4.5], [0, 3], [5, 1.5], [5, 4.5]]) { mesa(B, m, x, z, 0, 2, 0.9); banco(B, m, x, z - 0.7, 0, 1.8); banco(B, m, x, z + 0.7, PI, 1.8); servico(B, m, x, 0.8, z); }
      luzI(lareira(B, m, -8.6, 3, PI / 2, 0, 2), 7, 0xff7a30, 10, 5); luzI(lustre(B, m, 0, 3.3, 3, 1), 5, 0xffb060, 10, 5);
      for (const x of [-6, -2, 2, 6]) { const P = peca(B, m, x, 2.6, 6.25); P.esf(M.plain, 0.3, 0, 0, 0, pick([0x3a2a20, 0x5a4a3a, 0x2a2622]), 1.2); P.cx(M.madeira, 0.7, 0.6, 0.06, 0, 0, -0.1, 0x3a2818); }
      armadura(B, m, 8.2, 0.5, -PI / 2); balcao(B, m, 5, -4.2, 0, 3); estante(B, m, -6, -6, 0, 2, 2.2);
      mesa(B, m, -6, 3, 0, 2.2, 1.2, H, 0x2a1a12); for (let i = 0; i < 3; i++) cadeira(B, m, -7 + i, 2.1, 0, H); estante(B, m, -8.6, 3, PI / 2, 2, 2.2, true, H); bau(B, m, -4.5, 5.8, PI, H);
      for (let i = 0; i < 3; i++) cama(B, m, 0, 1.6 + i * 1.8, PI / 2, false, H);
      for (let i = 0; i < 3; i++) cama(B, m, 6, 1.6 + i * 1.8, -PI / 2, false, H);
      luzI(W(-6, H + 2.2, 3), 2.5, 0xffb060, 6, 3); luzI(W(3, H + 2.2, 3), 2, 0xffa050, 6, 3);
      break;
    }
    case 'v-quartel': {
      // Guarda Imperial: refeitório, arsenal, celas
      for (const x of [-6, -2]) { mesa(B, m, x, 3.5, 0, 2.6, 0.9); banco(B, m, x, 2.8, 0, 2.4); banco(B, m, x, 4.2, PI, 2.4); }
      luzI(lareira(B, m, -8.6, -3.5, PI / 2, 0, 1.8), 6, 0xff7a30, 9, 5);
      for (let i = 0; i < 5; i++) armadura(B, m, -8 + i * 1.6, -6.4, 0); cavalete(B, m, -2, -3, 0); cavalete(B, m, 0.5, -3, 0);
      for (let i = 0; i < 3; i++) { const z = -5 + i * 5; for (let k = -3; k <= 3; k++) cx(B, M.ferro, 0.06, 2.4, 0.06, 2.3, 1.2, z + k * 0.32, 0xffffff, m); cama(B, m, 7.5, z, PI / 2); }
      luzI(W(-4, 2.6, 2), 3, 0xffa050, 8, 4); luzI(W(5.5, 2.4, 0), 2, 0xff9a48, 6, 3);
      break;
    }
  }
  void cone; void caixote; void sacos;
}

/** marcos de cada prédio para fichas/vistas: ponto local → mundo */
export const mundoV = (id: string, x: number, z: number, y = 0) => new THREE.Vector3(x, y + (SPEC[id]?.base ?? 0), z).applyMatrix4(MATRIZ[id]);
