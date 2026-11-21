// Tiberus — prédios com interior (casca de Barud) e a mobília de cada um. Castro em grade: x = leste, z = sul; frente
// local +z. O fórum fica no cruzamento do cardo (norte–sul) com o decúmano (leste–oeste).
import * as THREE from 'three';
import { type Batch, MAT, cx, cil } from '../barud/common';
import { type Predio, MATRIZ, SPEC } from '../barud/edificios';
import {
  mesa, banco, banqueta, cadeira, cama, bau, estante, prateleira, lareira, balcao, barril, caixote, sacos, vela, lustre,
  tapecaria, tapete, caldeirao, forja, altar, armadura, cavalete, servico, peca,
} from '../barud/mobilia';
import { luz } from '../barud/cidade';
import { halo } from '../../core/kit';
import { PI, rnd, pick } from '../gente/kit';
import { matsV } from '../valkaria/mats';

const TRAV = 0xd8ccb4, VERM = 0x8a1a14, BRONZE = 0x9a6a3a;
export const PREDIOS_T: Predio[] = [
  { id: 't-templo', tipo: 'templo', x: 0, z: -52, ry: 0, w: 24, d: 34, h: 14, andares: 1, ext: 'pedra', matExt: matsV().marmore, corExt: 0xe0d8c8, telha: 'telha', base: 3,
    portas: [{ lado: 'f', c: 0, w: 4, h: 7 }], janelas: 4.2 },
  { id: 't-curia', tipo: 'salao', x: -54, z: -12, ry: PI / 2, w: 20, d: 26, h: 10, andares: 1, ext: 'pedra', corExt: TRAV, telha: 'telha', base: 0.8, portas: [{ lado: 'f', c: 0, w: 3, h: 5 }], janelas: 4 },
  { id: 't-basilica', tipo: 'salao', x: 56, z: 0, ry: -PI / 2, w: 50, d: 22, h: 11, andares: 1, ext: 'pedra', corExt: 0xd0c4ac, telha: 'telha', portas: [{ lado: 'f', c: -12, w: 3, h: 5 }, { lado: 'f', c: 12, w: 3, h: 5 }, { lado: 'f', c: 0, w: 3.6, h: 6 }], janelas: 4 },
  { id: 't-termas', tipo: 'salao', x: 74, z: 74, ry: PI, w: 30, d: 22, h: 8, andares: 1, ext: 'muro', corExt: 0xc88a6a, telha: 'telha', portas: [{ lado: 'f', c: 0, w: 3, h: 3.4 }], janelas: 4 },
  { id: 't-quartel', tipo: 'quartel', x: -74, z: -58, ry: PI / 2, w: 28, d: 14, h: 4, andares: 1, ext: 'pedra', corExt: 0xb8ac98, telha: 'telha', portas: [{ lado: 'f', c: 0, w: 2.4, h: 2.8 }],
    janelas: 3.4, internas: [[-14, -1, 4, -1, 6, 0], [4, -7, 4, 7, 9, 0], [4, -2, 14, -2, 4, 0]] },
  { id: 't-taverna', x: -30, z: 13, ry: PI, w: 16, d: 12, h: 3.6, andares: 2, ext: 'muro', corExt: 0xc8a888, telha: 'telha', portas: [{ lado: 'f', c: -2.5, w: 1.6, h: 2.4 }, { lado: 't', c: 4 }], janelas: 3,
    escada: { x: 6.3, z: -5.2, dir: 'x', s: -1 }, internas: [[-8, -3, 2, -3, 6, 0], [-8, -1, 8, -1, -1, 1], [-2.6, -1, -2.6, 6, 3.2, 1], [2.6, -1, 2.6, 6, 3.2, 1]] },
  { id: 't-domus', x: -42, z: 78, ry: 0, w: 24, d: 20, h: 4.6, andares: 1, ext: 'muro', corExt: 0xe0c8a8, telha: 'telha', portas: [{ lado: 'f', c: 0, w: 2, h: 2.8 }], janelas: 5,
    internas: [[-12, 4, -4, 4, 4, 0], [4, 4, 12, 4, 4, 0], [-12, -4, -4, -4, 4, 0], [4, -4, 12, -4, 4, 0], [-4, -10, -4, -4, -1, 0], [4, -10, 4, -4, -1, 0]] },
  { id: 't-forja', x: 13, z: -96, ry: -PI / 2, w: 12, d: 10, h: 4.2, andares: 1, ext: 'pedra', corExt: 0x9a8c7a, telha: 'telha', portas: [{ lado: 'f', c: -1, w: 4.4, h: 3.2 }], janelas: 4 },
  { id: 't-ergastulo', x: -88, z: 58, ry: PI / 2, w: 16, d: 10, h: 3.4, andares: 1, ext: 'pedra', corExt: 0x8a7e6e, telha: 'telha', portas: [{ lado: 'f', c: 0, w: 1.4, h: 2.2 }], janelas: 4, internas: [[-8, -0.5, 8, -0.5, 4, 0]] },
];

const luzI = (v: THREE.Vector3, n = 4, cor = 0xff9a48, dist = 9, prio = 4) => { luz(v.x, v.y, v.z, n * 18, prio, cor, dist * 1.5, 6); halo(v.x, v.y, v.z, 0.45); };
const braseiro = (B: Batch, m: THREE.Matrix4, x: number, z: number, y = 0) => { const M = MAT(), P = peca(B, m, x, y, z); P.cil(M.ferro, 0.1, 1.1, 0, 0, 0, 0xffffff, 8); P.cil(M.ferro, 0.5, 0.3, 0, 1.1, 0, 0xffffff, 12, 0.32); luzI(caldeirao(B, m, x, z, y + 1.15), 7, 0xff7a30, 11, 6); };
/** bronze das estátuas (metal com pátina) */
let _bronze: THREE.Material | null = null;
export const bronzeMat = () => (_bronze ||= new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.72, roughness: 0.36 }));
/** estátua de minotauro de pé com lança (bronze ou pedra), em coordenadas locais; h = altura até a ponta dos chifres */
export function minotauro(B: Batch, m: THREE.Matrix4, x: number, z: number, h: number, ry = 0, cor = BRONZE, mat?: THREE.Material) {
  const M = MAT(), P = peca(B, m, x, 0, z, ry), k = h / 5, mt = mat ?? bronzeMat(), esc = (cor & 0xfefefe) >> 1;
  const add = (g: THREE.BufferGeometry, c = cor, mm = mt) => { g.applyMatrix4(P.m); B.add(mm, g, c); };
  const cilG = (r1: number, r2: number, hh: number, x0: number, y0: number, z0: number, rx = 0, rz = 0, lados = 10) => { const g = new THREE.CylinderGeometry(r2 * k, r1 * k, hh * k, lados); g.translate(0, hh * k / 2, 0); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x0 * k, y0 * k, z0 * k); return g; };
  // pedestal com degrau
  P.cx(M.pedra, 2.2 * k, 0.45 * k, 2.0 * k, 0, 0.225 * k, 0, 0x8a8070); P.cx(M.pedra, 1.9 * k, 0.3 * k, 1.7 * k, 0, 0.6 * k, 0, 0x9a9080);
  const y0 = 0.75;
  for (const s of [-1, 1]) {
    add(cilG(0.17, 0.2, 0.18, s * 0.32, y0, 0.05), esc);                                  // casco
    add(cilG(0.16, 0.24, 0.85, s * 0.33, y0 + 0.16, 0.02, 0, -s * 0.05));                // canela
    add(cilG(0.24, 0.32, 0.95, s * 0.36, y0 + 0.98, 0, 0, -s * 0.06));                    // coxa
  }
  add(cilG(0.78, 0.6, 0.7, 0, y0 + 1.75, 0, 0, 0, 12), esc);                                // saiote (pteruges)
  { const g = new THREE.CylinderGeometry(0.98 * k, 0.62 * k, 1.35 * k, 12); g.scale(1.15, 1, 0.8); g.translate(0, (y0 + 2.4 + 0.675) * k, 0); add(g); } // tronco largo em cima
  add(cilG(0.6, 0.52, 0.12, 0, y0 + 2.36, 0, 0, 0, 12), esc);                                // cinturão
  for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(0.42 * k, 10, 8); g.translate(s * 0.98 * k, (y0 + 3.62) * k, 0); add(g); }
  add(cilG(0.36, 0.3, 0.4, 0, y0 + 3.7, 0.05));                                              // pescoço grosso
  { const g = new THREE.SphereGeometry(0.42 * k, 12, 10); g.scale(0.9, 1.0, 1.15); g.translate(0, (y0 + 4.25) * k, 0.05 * k); add(g); } // cabeça
  { const g = new THREE.BoxGeometry(0.42 * k, 0.36 * k, 0.5 * k); g.translate(0, (y0 + 4.1) * k, 0.45 * k); add(g); } // focinho
  for (const s of [-1, 1]) {
    const ch = new THREE.TorusGeometry(0.42 * k, 0.07 * k, 6, 10, PI * 0.75); ch.rotateY(PI / 2); ch.rotateZ(s * 0.3); ch.translate(s * 0.4 * k, (y0 + 4.5) * k, 0); if (s < 0) ch.rotateY(0); add(ch, 0xd8c8a0, mat ?? M.plain);
    const or = new THREE.ConeGeometry(0.09 * k, 0.28 * k, 5); or.rotateZ(s * 1.3); or.translate(s * 0.42 * k, (y0 + 4.3) * k, -0.05 * k); add(or);
  }
  // braços: direito segura a lança em pé, esquerdo apoia o escudo
  add(cilG(0.22, 0.26, 1.0, 1.2, y0 + 2.75, 0, 0, 0.12)); add(cilG(0.18, 0.22, 0.95, 1.3, y0 + 1.85, 0.25, -0.5, 0.05));
  add(cilG(0.22, 0.26, 1.0, -1.2, y0 + 2.75, 0, 0, -0.12)); add(cilG(0.18, 0.22, 0.9, -1.28, y0 + 1.95, 0.2, -0.4, -0.05));
  add(cilG(0.06, 0.06, 4.6, 1.42, y0 + 0.2, 0.55, 0, 0, 6), esc); { const g = new THREE.ConeGeometry(0.14 * k, 0.6 * k, 6); g.translate(1.42 * k, (y0 + 5.1) * k, 0.55 * k); add(g, 0xd8c8a0); }
  { const g = new THREE.CylinderGeometry(0.75 * k, 0.75 * k, 0.12 * k, 16); g.rotateZ(PI / 2); g.translate(-1.5 * k, (y0 + 2.1) * k, 0.25 * k); add(g, esc); }
}

export function mobiliarT(B: Batch, id: string) {
  const m = MATRIZ[id], p = SPEC[id], M = MAT(), H = p.h;
  const W = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(m);
  switch (id) {
    case 't-templo': {
      // cela do Templo de Tauron: colunas, o grande touro de bronze no fundo, altar de sacrifício, braseiros, estandartes
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) cil(B, M.pedra, 0.6, H - 0.5, s * 8, 0, -13 + i * 5, 0xe0d8c8, 14, m);
      { const P = peca(B, m, 0, 0, -13.5); P.cx(M.pedra, 9, 1.2, 5, 0, 0.6, 0, 0xc8bca8); } minotauro(B, m, 0, -13.5, 9.5, 0, BRONZE);
      altar(B, m, 0, -8.5, 0); { const P = peca(B, m, 0, 0, -8.5); P.cx(M.plain, 1.6, 0.05, 0.9, 0, 1.0, 0, 0x5a0a0a); }
      for (const [x, z] of [[-4, -10], [4, -10], [-4, 4], [4, 4], [-4, 12], [4, 12]]) braseiro(B, m, x, z);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tapecaria(B, m, s * 11.75, 6, -10 + i * 9, s > 0 ? -PI / 2 : PI / 2, 2, 6, VERM);
      tapete(B, m, 0, 4, 0, 3, 22);
      break;
    }
    case 't-curia': {
      // Cúria (Senado): bancadas em degraus dos dois lados, a cadeira do cônsul no fundo, a estátua da Vitória, braseiros
      for (const s of [-1, 1]) for (let r = 0; r < 3; r++) { const x = s * (5.5 + r * 1.4), P = peca(B, m, x, r * 0.45, 0); P.cx(M.pedra, 1.4, 0.45, 20, 0, -0.225 + 0.45, 0, 0xc8bca8); for (let k = 0; k < 7; k++) banco(B, m, x, -9 + k * 3, PI / 2 * s, 2.4, r * 0.45 + 0.45); }
      { const P = peca(B, m, 0, 0, -11.2); P.cx(M.pedra, 5, 0.6, 2.4, 0, 0.3, 0, 0xd8ccb8); P.cx(M.madeira, 1.3, 0.6, 1.0, 0, 0.9, 0, 0x3a2418); P.cx(M.madeira, 1.3, 1.6, 0.2, 0, 1.6, -0.45, 0x3a2418); P.cx(M.tecido, 1.1, 0.12, 0.9, 0, 1.25, 0, VERM); }
      minotauro(B, m, 0, -12.2, 4.5, 0, 0xd8d0c0, M.pedra); tapete(B, m, 0, 1, 0, 3, 18);
      for (const [x, z] of [[-2.5, -8], [2.5, -8], [-2.5, 8], [2.5, 8]]) braseiro(B, m, x, z);
      for (const s of [-1, 1]) tapecaria(B, m, s * 9.75, 6, -6, s > 0 ? -PI / 2 : PI / 2, 2, 4, VERM);
      break;
    }
    case 't-basilica': {
      // Basílica: duas colunatas, abside do tribunal com a cadeira do magistrado, mesas de cambistas e advogados
      for (const s of [-1, 1]) for (let i = 0; i < 11; i++) cil(B, M.pedra, 0.5, H - 0.4, -22 + i * 4.4, 0, s * 5, 0xd8ccb8, 12, m);
      { const P = peca(B, m, -22.5, 0, 0); P.cx(M.pedra, 4, 0.8, 9, 0, 0.4, 0, 0xc8bca8); P.cx(M.madeira, 1.2, 0.7, 1.2, 0.5, 1.15, 0, 0x3a2418); P.cx(M.madeira, 0.2, 1.6, 1.2, -0.1, 1.6, 0, 0x3a2418); }
      mesa(B, m, -19, 0, PI / 2, 3, 1); for (let i = 0; i < 3; i++) cadeira(B, m, -18, -1 + i, -PI / 2);
      for (let i = 0; i < 6; i++) { const x = -12 + i * 6, z = (i % 2 ? 1 : -1) * 8; mesa(B, m, x, z, 0, 2.2, 0.9); banqueta(B, m, x - 0.5, z + (z > 0 ? -0.8 : 0.8)); for (let k = 0; k < 4; k++) { const P = peca(B, m, x - 0.8 + k * 0.5, 0.8, z); P.cil(M.plain, 0.05, 0.04 + rnd() * 0.06, 0, 0, 0, 0xd8b048, 8); } caixote(B, m, x + 1.4, z, 0, 0.5); }
      for (const x of [-15, 0, 15]) luzI(lustre(B, m, x, H - 3, 0, 1.0), 6, 0xffb060, 14, 5);
      for (const x of [-20, 20]) tapecaria(B, m, x, 6, -10.75, 0, 2.2, 5, VERM);
      break;
    }
    case 't-termas': {
      // Termas: piscina quente e fria (água no chão), colunas, bancos de pedra, braseiros, vapor (fumaça no telhado)
      for (const [x, w, cor] of [[-7, 12, 0x3a6a7a], [8, 10, 0x2a4a5a]] as [number, number, number][]) { const P = peca(B, m, x, 0, 0); P.cx(M.pedra, w + 1.2, 0.5, 12, 0, 0.25, 0, 0xd8ccb8); P.cx(M.agua, w, 0.06, 10.8, 0, 0.5, 0, cor); }
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) cil(B, M.pedra, 0.45, H - 0.4, -12 + i * 6, 0, s * 8.6, 0xe0d4c0, 12, m);
      for (let i = 0; i < 6; i++) banco(B, m, -12 + i * 5, -10, 0, 2.6);
      for (const [x, z] of [[-14, 8], [14, 8], [0, -9]]) braseiro(B, m, x, z);
      luzI(W(0, 5, 0), 5, 0xffb070, 14, 5);
      break;
    }
    case 't-quartel': {
      // quartel da legião: dormitório com beliches, refeitório, arsenal com armaduras e o estandarte do touro
      for (let i = 0; i < 6; i++) { cama(B, m, -12 + i * 2.6, -4.6, 0); cama(B, m, -12 + i * 2.6, -4.6, 0, false, 1.1); bau(B, m, -12 + i * 2.6, -2.6, 0); }
      for (const x of [-9, -3]) { mesa(B, m, x, 3.8, 0, 3, 0.9); banco(B, m, x, 3.1, 0, 2.8); banco(B, m, x, 4.5, PI, 2.8); servico(B, m, x, 0.8, 3.8); }
      luzI(lareira(B, m, -13.6, 3.5, PI / 2, 0, 1.8), 6, 0xff7a30, 9, 5);
      for (let i = 0; i < 5; i++) armadura(B, m, 5.5 + i * 1.7, -6.4, 0); cavalete(B, m, 9, 0.5, -PI / 2); cavalete(B, m, 9, 3, -PI / 2);
      { const P = peca(B, m, 12.5, 0, 4.5); P.cil(M.madeira, 0.06, 3.4, 0, 0, 0, 0x3a2418, 6); P.cx(M.tecido, 1.0, 1.3, 0.03, 0, 2.6, 0, VERM); P.esf(M.plain, 0.2, 0, 3.5, 0, 0xd8b048); }
      luzI(W(-4, 2.8, 2), 3, 0xffa050, 8, 4); luzI(W(9, 2.8, 0), 2.5, 0xffa050, 7, 3);
      break;
    }
    case 't-taverna': {
      // O Chifre de Bronze: balcão, lareira, mesas compridas para minotauros, chifre de bronze na parede, quartos em cima
      luzI(lareira(B, m, -3.5, -2.7, 0, 0, 2.4), 8, 0xff7a30, 11, 6);
      balcao(B, m, 5, 1, -PI / 2, 4.4); prateleira(B, m, 7.75, 1, -PI / 2, 3.6, 1.3, 'garrafas');
      for (let i = 0; i < 4; i++) barril(B, m, 7.2, -1.2 + i * 0.8, 0, true, 1.1);
      for (const [x, z] of [[-5.5, 1.2], [-5.5, 4.2], [-1.4, 2.6], [2, 4.8]]) { mesa(B, m, x, z, 0, 2.6, 1.0); banco(B, m, x, z - 0.8, 0, 2.4); banco(B, m, x, z + 0.8, PI, 2.4); servico(B, m, x - 0.5, 0.8, z); servico(B, m, x + 0.6, 0.8, z + 0.2); }
      { const P = peca(B, m, -3.5, 2.9, -2.95); const g = new THREE.TorusGeometry(0.7, 0.12, 6, 14, PI * 0.9); g.applyMatrix4(P.m); B.add(M.plain, g, BRONZE); }
      luzI(lustre(B, m, -2, 3.1, 2.6, 0.9), 5, 0xffa050, 10, 5); tapecaria(B, m, -7.75, 2.1, 3, PI / 2, 1.4, 1.8, VERM);
      caldeirao(B, m, 4, -4.8); sacos(B, m, -1, -5.2, 4);
      for (const x of [-5.3, 0, 5.3]) { cama(B, m, x - 0.6, 3.5, 0, false, H); bau(B, m, x + 1.2, 5.2, PI, H); vela(B, m, x + 1.2, H + 0.5, 4.2); }
      luzI(W(0, H + 2.2, 2.8), 2.5, 0xffa050, 6, 3);
      break;
    }
    case 't-domus': {
      // casa do senador: átrio com implúvio (tanque) e colunas, triclínio (sofás), escritório com o cofre das cartas
      { const P = peca(B, m, 0, 0, 0); P.cx(M.pedra, 5.2, 0.3, 5.2, 0, 0.15, 0, 0xd8ccb8); P.cx(M.agua, 4.4, 0.05, 4.4, 0, 0.3, 0, 0x3a5a6a); for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) P.cil(M.pedra, 0.25, H - 0.3, x, 0, z, 0xe0d4c0, 12); }
      tapete(B, m, 0, 6.5, 0, 3, 4); for (const s of [-1, 1]) { const P = peca(B, m, s * 8, 0, -7); P.cx(M.tecido, 3, 0.6, 1.2, 0, 0.3, 0, VERM); P.cx(M.tecido, 3, 0.6, 0.3, 0, 0.6, -0.5, VERM); mesa(B, m, s * 8, -5.6, 0, 1.2, 0.6, 0, 0x2a1a12); servico(B, m, s * 8, 0.8, -5.6); }
      mesa(B, m, 8, 7, 0, 1.8, 0.9, 0, 0x2a1a12); cadeira(B, m, 8, 6, 0); estante(B, m, 11.6, 7, -PI / 2, 2, 2.2); bau(B, m, 10.5, 9, PI);
      for (const v of [W(0, 2.6, 0), W(-8, 2.4, -7), W(8, 2.4, 7)]) luzI(v, 2.5, 0xffb060, 7, 4);
      for (const s of [-1, 1]) tapecaria(B, m, s * 11.75, 2.2, 0, s > 0 ? -PI / 2 : PI / 2, 1.6, 2.4, VERM);
      break;
    }
    case 't-forja': {
      luzI(forja(B, m, -2.2, -2.8, 0), 9, 0xff5a20, 10, 6);
      for (let i = 0; i < 4; i++) armadura(B, m, 4.6, -3.4 + i * 1.4, -PI / 2); cavalete(B, m, 2.6, -4.1, 0); barril(B, m, -4.6, 3.6); caixote(B, m, -4.6, 2.4, 0, 0.7);
      for (let i = 0; i < 8; i++) { const P = peca(B, m, -4 + i * 0.5, 0.82, 1); P.cx(M.ferro, 0.08, 0.02, 0.9, 0, 0, 0, 0xffffff); } mesa(B, m, -2.5, 1, 0, 4, 0.9);
      break;
    }
    case 't-ergastulo': {
      // ergástulo: celas de grades onde os escravos esperam o leilão (terror sutil: correntes, palha, uma vela)
      for (let i = 0; i < 4; i++) { const x = -6 + i * 4; for (let k = -6; k <= 6; k++) cx(B, M.ferro, 0.06, 3.0, 0.06, x + k * 0.28, 1.5, -0.6, 0xffffff, m); for (let k = 0; k < 4; k++) { const P = peca(B, m, x + (rnd() - 0.5) * 2.4, 0.05, -2.5 - rnd() * 1.6); P.cx(M.plain, 0.6, 0.06, 0.4, 0, 0, 0, 0xb8a060); } }
      for (let i = 0; i < 6; i++) { const P = peca(B, m, -7 + i * 2.6, 1.4, -4.85); P.cx(M.ferro, 0.04, 1.2, 0.04, 0, 0, 0, 0xffffff); P.cx(M.ferro, 0.3, 0.08, 0.08, 0, -0.6, 0.06, 0xffffff); }
      mesa(B, m, 4, 3, 0, 1.6, 0.8); banqueta(B, m, 4, 2.2); vela(B, m, 4, 0.82, 3); luzI(W(4, 1.2, 3), 1.5, 0xffa050, 5, 3); bau(B, m, -6, 4, PI);
      break;
    }
  }
  void pick; void lustre; void estante;
}
