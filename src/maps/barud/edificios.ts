// Barud — prédios com interior: casca genérica (paredes com vãos reais, pisos, escada, telhado na camada Telhados)
// e a mobília de cada lugar. Coordenadas locais: frente do prédio em +z; y = 0 no piso térreo.
import * as THREE from 'three';
import {
  Batch, MAT, mtx, por, cx, telhado, cone, cil, coral, rnd, pick, type Ret, signTexture, FORTALEZA,
} from './common';
import {
  mesa, banco, banqueta, cadeira, cama, bau, estante, prateleira, lareira, balcao, barril, caixote, sacos, vela, lustre,
  tapecaria, quadro, tapete, armario, caldeirao, forja, altar, bancoTemplo, armadura, cavalete, servico, peca,
} from './mobilia';
import { luz } from './cidade';
import { halo } from '../../core/kit';
import { retCantos } from './cidade';

type Lado = 'f' | 't' | 'e' | 'd';
export interface Vao { lado: Lado; c: number; w?: number; h?: number; y?: number }
export interface Predio {
  id: string; x: number; z: number; ry: number; w: number; d: number; h: number; andares: 1 | 2;
  ext: 'pedra' | 'muro' | 'enxaimel' | 'tabuas'; telha: 'ardosia' | 'telha' | null; base?: number;
  portas: Vao[]; janelas?: number; escada?: { x: number; z: number; dir: 'x' | 'z'; s: 1 | -1 };
  /** paredes internas: [x0,z0,x1,z1, porta (distância do início) | -1, andar] */
  internas?: [number, number, number, number, number, number][];
  ruina?: boolean; corExt?: number;
  /** vista interna em coordenadas locais [px,py,pz, tx,ty,tz] (padrão: canto da frente olhando o fundo) */
  vd?: [number, number, number, number, number, number];
}

export interface Construido { m: THREE.Matrix4; floors: THREE.Object3D[]; solids: THREE.Object3D[]; vtt: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[] }
export const MATRIZ: Record<string, THREE.Matrix4> = {};
export const SPEC: Record<string, Predio> = {};
/** ponto local de um prédio → mundo */
export function mundo(id: string, x: number, z: number, y = 0) { const v = new THREE.Vector3(x, y + (SPEC[id]?.base ?? 0), z).applyMatrix4(MATRIZ[id]); return v; }
/** retângulo ocupado no mundo (para a cidade não pôr casas por cima) */
export function retDe(p: Predio): Ret {
  const c = Math.abs(Math.cos(p.ry)), s = Math.abs(Math.sin(p.ry)), hx = (p.w * c + p.d * s) / 2, hz = (p.w * s + p.d * c) / 2;
  return [p.x - hx, p.x + hx, p.z - hz, p.z + hz];
}

// ---------- lista de prédios (posições na planta) ----------
const PI = Math.PI;
export const PREDIOS: Predio[] = [
  { id: 'javali', x: 13, z: 77, ry: -PI / 2, w: 14, d: 12, h: 3.6, andares: 2, ext: 'enxaimel', telha: 'telha', portas: [{ lado: 'f', c: -2 }, { lado: 't', c: 4 }], janelas: 3.2, escada: { x: 5.2, z: -4.6, dir: 'x', s: -1 },
    internas: [[-7, -2.5, 1, -2.5, 4.6, 0], [1, -2.5, 1, -6, -1, 0], [-7, -1, 7, -1, -1, 1], [-2.5, -1, -2.5, 6, 3.2, 1], [2.5, -1, 2.5, 6, 3.2, 1]] },
  { id: 'lanterna', x: -34, z: 34, ry: PI, w: 12, d: 10, h: 3.3, andares: 2, ext: 'tabuas', telha: 'telha', portas: [{ lado: 'f', c: 2.5 }, { lado: 'e', c: -2 }], janelas: 3.4, escada: { x: -4.4, z: -3.6, dir: 'x', s: 1 },
    internas: [[-6, -1.8, 6, -1.8, 9, 0], [-6, 0, 6, 0, -1, 1], [0, 0, 0, 5, 1.2, 1]] },
  { id: 'calice', x: 13, z: -52, ry: 0, w: 14, d: 12, h: 4.2, andares: 2, ext: 'muro', telha: 'ardosia', portas: [{ lado: 'f', c: 0, w: 1.6, h: 2.8 }, { lado: 't', c: -4 }], janelas: 2.6, escada: { x: 5.4, z: -2.6, dir: 'z', s: -1 },
    internas: [[-7, -3.5, 3.6, -3.5, 2, 0], [-7, 1, 3.6, 1, 2.4, 1], [-1.5, 1, -1.5, 6, 2, 1], [-1.5, -6, -1.5, 1, 2.4, 1]] },
  { id: 'forja', x: -11, z: 36, ry: PI / 2, w: 10, d: 9, h: 4.0, andares: 1, ext: 'pedra', telha: 'telha', portas: [{ lado: 'f', c: -1, w: 4.2, h: 3.2 }, { lado: 'd', c: 2 }], janelas: 4 },
  { id: 'botica', x: 30, z: 0, ry: -PI / 2, w: 9, d: 9, h: 3.4, andares: 1, ext: 'enxaimel', telha: 'ardosia', portas: [{ lado: 'f', c: 1.5 }], janelas: 2.6, internas: [[-4.5, -1.6, 4.5, -1.6, 6.5, 0]] },
  { id: 'emporio', x: -30, z: 0, ry: PI / 2, w: 10, d: 9, h: 3.6, andares: 1, ext: 'muro', telha: 'telha', portas: [{ lado: 'f', c: -1.5, w: 2.2, h: 2.6 }, { lado: 't', c: 3 }], janelas: 3, internas: [[-5, -1.4, 5, -1.4, 7.6, 0]] },
  { id: 'templo', x: 36, z: -25, ry: -PI / 2, w: 22, d: 16, h: 10.5, andares: 1, ext: 'pedra', telha: 'ardosia', portas: [{ lado: 'f', c: 0, w: 2.6, h: 4.6 }, { lado: 'e', c: -5 }], janelas: 3.6 },
  { id: 'quartel', x: -36, z: -24, ry: PI / 2, w: 16, d: 14, h: 3.8, andares: 1, ext: 'pedra', telha: 'ardosia', portas: [{ lado: 'f', c: 0, w: 2.2, h: 2.8 }], janelas: 3.4,
    internas: [[-8, 0, 2, 0, 5, 0], [2, -7, 2, 7, 10.2, 0], [2, -2.5, 8, -2.5, 3, 0], [2, 2.5, 8, 2.5, 3, 0]], vd: [1.3, 1.7, 6.3, -6.5, 1.1, 1.2] },
  { id: 'salao', x: 0, z: -68, ry: 0, w: 22, d: 14, h: 8, andares: 1, ext: 'pedra', telha: 'ardosia', base: 2.6, portas: [{ lado: 'f', c: 0, w: 2.8, h: 4.2 }, { lado: 't', c: 6 }], janelas: 3.6 },
  { id: 'mercador', x: -17, z: -52, ry: 0, w: 12, d: 11, h: 3.4, andares: 2, ext: 'muro', telha: 'ardosia', portas: [{ lado: 'f', c: -2.5 }], janelas: 2.4, escada: { x: -4.7, z: -3.8, dir: 'x', s: 1 },
    internas: [[0, -5.5, 0, 5.5, 4, 0], [-6, -1.6, 0, -1.6, 4.2, 0], [0, -5.5, 0, 5.5, 2.2, 1], [-6, 0.5, 0, 0.5, 4.4, 1]], vd: [-0.6, 1.7, 5, -5.2, 1.1, -1] },
  { id: 'artesao', x: 30, z: 35, ry: PI, w: 8, d: 9, h: 3.0, andares: 2, ext: 'enxaimel', telha: 'telha', portas: [{ lado: 'f', c: 1.6 }], janelas: 2.6, escada: { x: -3.1, z: -3.2, dir: 'x', s: 1 },
    internas: [[-4, -1, 4, -1, 0.6, 0], [0, -4.5, 0, 4.5, 6.4, 1]] },
  { id: 'casebre', x: -56.5, z: 69, ry: PI, w: 7, d: 6, h: 2.6, andares: 1, ext: 'tabuas', telha: 'telha', portas: [{ lado: 'f', c: -1.6 }], janelas: 3 },
  { id: 'lazareto', x: -72, z: -41, ry: PI / 2, w: 16, d: 13, h: 4.2, andares: 1, ext: 'muro', telha: 'telha', portas: [{ lado: 'f', c: 0, w: 2, h: 2.6 }, { lado: 't', c: -5 }], janelas: 2.8, ruina: true,
    internas: [[-8, -2.5, 3, -2.5, 5.5, 0], [3, -6.5, 3, 6.5, 9, 0]], vd: [2.3, 1.75, 5.8, -7, 0.6, -1.2] },
];

// ---------- construção da casca ----------
const corDe = (p: Predio) => p.corExt ?? (p.ext === 'pedra' ? 0xa8a094 : p.ext === 'muro' ? 0xb4aa9c : p.ext === 'enxaimel' ? 0xd0c4ac : 0x9a8468);
/** parede local de (ax,az) a (bx,bz) com vãos (c = distância do início até o centro do vão) */
function parede(B: Batch, mat: THREE.Material, cor: number, m: THREE.Matrix4, ax: number, az: number, bx: number, bz: number, y0: number, h: number, t: number,
  vaos: { c: number; w: number; y: number; h: number }[], dentro?: { mat: THREE.Material; cor: number; lado: 1 | -1 }) {
  const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, a = Math.atan2(ux, uz) - Math.PI / 2;
  const seg = (s0: number, s1: number, yb: number, yt: number) => {
    if (s1 - s0 < 0.02 || yt - yb < 0.02) return;
    const c = (s0 + s1) / 2, mm = m.clone().multiply(mtx(ax + ux * c, 0, az + uz * c, a));
    cx(B, mat, s1 - s0, yt - yb, t, 0, y0 + (yb + yt) / 2, 0, cor, mm);
    if (dentro) cx(B, dentro.mat, s1 - s0, yt - yb, 0.02, 0, y0 + (yb + yt) / 2, dentro.lado * (t / 2 + 0.011), dentro.cor, mm);
  };
  const vs = vaos.slice().sort((p, q) => p.c - q.c);
  let s = 0;
  for (const v of vs) {
    const v0 = Math.max(0, v.c - v.w / 2), v1 = Math.min(L, v.c + v.w / 2);
    seg(s, v0, 0, h); seg(v0, v1, 0, v.y); seg(v0, v1, v.y + v.h, h); s = v1;
  }
  seg(s, L, 0, h);
}

export function construirPredio(B: Batch, BR: Batch, G: THREE.Group, p: Predio): Construido {
  const M = MAT(), y0 = p.base ?? 0, m = mtx(p.x, y0, p.z, p.ry); MATRIZ[p.id] = m; SPEC[p.id] = p;
  const floors: THREE.Object3D[] = [], solids: THREE.Object3D[] = [], vtt: [number, number][][] = [], portals: Construido['portals'] = [];
  const t = 0.4, hw = p.w / 2, hd = p.d / 2, cor = corDe(p);
  const matExt = p.ext === 'pedra' ? M.pedra : p.ext === 'muro' ? M.muro : p.ext === 'enxaimel' ? M.reboco : M.tabuas;
  const dentroMat = p.ext === 'tabuas' ? { mat: M.tabuas, cor: 0x5a4636 } : { mat: M.reboco, cor: p.ext === 'pedra' && p.id !== 'templo' ? 0x8e8476 : 0xa69a86 };
  const W = (x: number, z: number) => { const v = new THREE.Vector3(x, 0, z).applyMatrix4(m); return [+v.x.toFixed(2), +v.z.toFixed(2)] as [number, number]; };
  const lados: Record<Lado, [number, number, number, number]> = { f: [-hw, hd, hw, hd], t: [hw, -hd, -hw, -hd], e: [-hw, -hd, -hw, hd], d: [hw, hd, hw, -hd] };
  for (let k = 0; k < p.andares; k++) {
    const ya = k * p.h;
    (Object.keys(lados) as Lado[]).forEach(l => {
      const [ax, az, bx, bz] = lados[l], L = Math.hypot(bx - ax, bz - az);
      const vaos: { c: number; w: number; y: number; h: number }[] = [];
      if (k === 0) for (const v of p.portas.filter(q => q.lado === l)) {
        const c = L / 2 + (l === 'f' || l === 'e' ? v.c : -v.c), w = v.w ?? 1.1, h = v.h ?? 2.15;
        vaos.push({ c, w, y: 0, h });
        // portal (VTT) e porta de madeira entreaberta
        const ux = (bx - ax) / L, uz = (bz - az) / L, px = ax + ux * c, pz = az + uz * c;
        portals.push({ p: W(px, pz), a: W(px - ux * w / 2, pz - uz * w / 2), b: W(px + ux * w / 2, pz + uz * w / 2) });
        if (w < 3) { const a = Math.atan2(ux, uz) - Math.PI / 2, dm = m.clone().multiply(mtx(px - ux * w / 2, 0, pz - uz * w / 2, a - 1.2)); cx(B, M.tabuas, w * 0.95, h - 0.05, 0.07, w * 0.475, h / 2, 0, 0x3a2618, dm); }
      }
      const esp = p.janelas ?? 3;
      const nj = Math.floor((L - 1.2) / esp);
      for (let i = 0; i < nj; i++) {
        const c = (L - (nj - 1) * esp) / 2 + i * esp;
        if (vaos.some(v => Math.abs(v.c - c) < v.w / 2 + 0.9)) continue;
        if (p.id === 'templo') { vaos.push({ c, w: 1.1, y: 3.2, h: 4.6 }); continue; }
        if (p.id === 'quartel' && l !== 'f') { vaos.push({ c, w: 0.25, y: 1.6, h: 0.9 }); continue; }   // seteiras
        vaos.push({ c, w: 0.95, y: k === 0 ? 1.0 : 0.9, h: 1.2 });
      }
      parede(B, matExt, cor, m, ax, az, bx, bz, ya, p.h, t, vaos, { ...dentroMat, lado: -1 });
      // vigas do enxaimel por fora
      if (p.ext === 'enxaimel') {
        const ux = (bx - ax) / L, uz = (bz - az) / L, a = Math.atan2(ux, uz) - Math.PI / 2;
        for (let s = 0.1; s < L; s += 1.2) if (!vaos.some(v => Math.abs(v.c - s) < v.w / 2 + 0.05)) cx(B, M.madeira, 0.13, p.h, 0.06, 0, ya + p.h / 2, t / 2 + 0.03, 0x2a1e16, m.clone().multiply(mtx(ax + ux * s, 0, az + uz * s, a)));
        for (const yy of [ya + 0.1, ya + p.h - 0.08]) cx(B, M.madeira, L, 0.16, 0.06, 0, yy, t / 2 + 0.03, 0x2a1e16, m.clone().multiply(mtx((ax + bx) / 2, 0, (az + bz) / 2, a)));
      }
      // molduras/folhas das janelas (por fora)
      for (const v of vaos) if (v.y > 0.5 && v.w > 0.5) {
        const ux = (bx - ax) / L, uz = (bz - az) / L, a = Math.atan2(ux, uz) - Math.PI / 2, mm = m.clone().multiply(mtx(ax + ux * v.c, 0, az + uz * v.c, a));
        cx(B, M.madeira, v.w + 0.12, 0.1, 0.18, 0, ya + v.y - 0.05, t / 2, 0x2a1e16, mm);
        if (p.id !== 'templo') { cx(B, M.madeira, 0.05, v.h, 0.05, 0, ya + v.y + v.h / 2, 0, 0x2a1e16, mm); cx(B, M.madeira, v.w, 0.05, 0.05, 0, ya + v.y + v.h / 2, 0, 0x2a1e16, mm); }
        else { cx(B, M.vitral, v.w - 0.05, v.h - 0.05, 0.03, 0, ya + v.y + v.h / 2, 0, 0xffffff, mm); for (let k2 = 1; k2 < 4; k2++) cx(B, M.ferro, v.w, 0.04, 0.05, 0, ya + v.y + k2 * v.h / 4, 0, 0xffffff, mm); cx(B, M.ferro, 0.04, v.h, 0.05, 0, ya + v.y + v.h / 2, 0, 0xffffff, mm); }  // vitral aceso (âmbar, por dentro de velas)
        if (!p.ruina && rnd() < 0.6 && p.id !== 'templo') cx(B, M.tabuas, v.w / 2, v.h, 0.05, v.w * 0.75, ya + v.y + v.h / 2, t / 2 + 0.1, 0x3a2a1e, mm, 0.6);
      }
      vtt.push([W(ax, az), W(bx, bz)]);
    });
    // piso deste andar
    const yp = ya + 0.05;
    if (k === 0) {
      const g = new THREE.BoxGeometry(p.w - 0.1, 0.1, p.d - 0.1); g.translate(0, yp - 0.05 + 0.0, 0);
      const mat = ['templo', 'salao', 'quartel', 'lazareto', 'forja'].includes(p.id) ? M.lajota : p.id === 'casebre' ? M.tabuas : M.piso;
      por(B, mat, g, p.id === 'forja' ? 0x6a645c : 0xffffff, m);
      const f = new THREE.Mesh(new THREE.BoxGeometry(p.w - 0.2, 0.1, p.d - 0.2), new THREE.MeshBasicMaterial({ visible: false })); f.position.set(0, 0.0, 0); f.applyMatrix4(m); f.userData.ns = 1; G.add(f); floors.push(f);
      if (y0 > 0.1) { /* plataforma: o chão da fortaleza já está na altura */ }
    } else {
      // laje com vão da escada
      const e = p.escada!, hx0 = e.dir === 'x' ? Math.min(e.x, e.x + e.s * 4.4) : e.x - 0.65, hx1 = e.dir === 'x' ? Math.max(e.x, e.x + e.s * 4.4) : e.x + 0.65;
      const hz0 = e.dir === 'z' ? Math.min(e.z, e.z + e.s * 4.4) : e.z - 0.65, hz1 = e.dir === 'z' ? Math.max(e.z, e.z + e.s * 4.4) : e.z + 0.65;
      const pedacos: [number, number, number, number][] = [[-hw, hx0, -hd, hd], [hx1, hw, -hd, hd], [hx0, hx1, -hd, hz0], [hx0, hx1, hz1, hd]];
      for (const [a0, a1, b0, b1] of pedacos) {
        if (a1 - a0 < 0.05 || b1 - b0 < 0.05) continue;
        const g = new THREE.BoxGeometry(a1 - a0, 0.22, b1 - b0); g.translate((a0 + a1) / 2, ya - 0.06, (b0 + b1) / 2); por(B, M.piso, g, 0xffffff, m);
        const f = new THREE.Mesh(new THREE.BoxGeometry(a1 - a0, 0.1, b1 - b0), new THREE.MeshBasicMaterial({ visible: false })); f.position.set((a0 + a1) / 2, ya, (b0 + b1) / 2); f.applyMatrix4(m); f.userData.ns = 1; f.userData.l = 1; G.add(f); floors.push(f);
      }
      // vigas do teto do térreo
      for (let s = -hw + 1; s < hw; s += 1.4) cx(B, M.madeira, 0.18, 0.22, p.d - 0.4, s, ya - 0.28, 0, 0x2a1e16, m);
      // escada: degraus + rampa invisível para pisar
      const n = Math.round(p.h / 0.2), run = 4.4;
      for (let i = 0; i < n; i++) {
        const sx = e.dir === 'x' ? e.x + e.s * (i + 0.5) * run / n : e.x, sz = e.dir === 'z' ? e.z + e.s * (i + 0.5) * run / n : e.z;
        cx(B, M.madeira, e.dir === 'x' ? run / n : 1.1, 0.12, e.dir === 'x' ? 1.1 : run / n, sx, (i + 1) * p.h / n - 0.06, sz, 0x4a3424, m);
      }
      const ang = Math.atan2(p.h, run), comp = Math.hypot(run, p.h);
      const rg = new THREE.PlaneGeometry(e.dir === 'x' ? comp : 1.1, e.dir === 'x' ? 1.1 : comp); rg.rotateX(-Math.PI / 2);
      if (e.dir === 'x') rg.rotateZ(e.s * ang); else rg.rotateX(-e.s * ang);
      rg.translate(e.dir === 'x' ? e.x + e.s * run / 2 : e.x, p.h / 2, e.dir === 'z' ? e.z + e.s * run / 2 : e.z);
      const rampa = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
      rampa.applyMatrix4(m); rampa.userData.ns = 1; G.add(rampa); floors.push(rampa);
    }
  }
  // paredes internas
  for (const [ax, az, bx, bz, porta, andar] of p.internas ?? []) {
    const vaos = porta >= 0 ? [{ c: porta, w: 1.0, y: 0, h: 2.1 }] : [];
    parede(B, p.ext === 'tabuas' ? M.tabuas : M.reboco, p.ext === 'tabuas' ? 0x5a4636 : 0xa69a86, m, ax, az, bx, bz, andar * p.h, p.h - (andar === 0 && p.andares === 2 ? 0.2 : 0), 0.16, vaos);
    vtt.push([W(ax, az), W(bx, bz)]);
    if (porta >= 0) { const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, px = ax + ux * porta, pz = az + uz * porta; if (andar === 0) portals.push({ p: W(px, pz), a: W(px - ux * 0.5, pz - uz * 0.5), b: W(px + ux * 0.5, pz + uz * 0.5) }); }
  }
  // telhado (camada) e beiral
  const topo = p.andares * p.h;
  if (p.telha) {
    const hr = Math.min(p.w, p.d) * (p.id === 'templo' || p.id === 'salao' ? 0.42 : 0.36);
    const mt = p.telha === 'ardosia' ? M.ardosia : M.telha, ct = p.telha === 'ardosia' ? 0x56565e : 0x6a4034;
    if (p.ruina) {
      // telhado meio desabado: só uma água e caibros expostos
      telhado(BR, mt, p.w, p.d * 0.45, hr, topo, ct, m.clone().multiply(mtx(0, 0, -p.d * 0.27)), 0.3, matExt, cor);
      for (let s = -p.d / 2 + 1; s < p.d * 0.1; s += 1.1) for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(0.14, 0.14, Math.hypot(p.w / 2, hr)); g.rotateX(Math.PI / 2); g.rotateZ(sx * (Math.PI / 2 - Math.atan2(hr, p.w / 2))); g.translate(sx * p.w / 4, topo + hr / 2, s + p.d * 0.2); por(BR, M.madeira, g, 0x1e160e, m); }
    } else telhado(BR, mt, p.w, p.d, hr, topo, ct, m, 0.4, matExt, cor);
    // teto liso por dentro (para o interior não mostrar o céu)
    if (!p.ruina) { const g = new THREE.BoxGeometry(p.w - 0.1, 0.08, p.d - 0.1); g.translate(0, topo + 0.04, 0); por(BR, M.madeira, g, 0x3a2a1e, m); }
  }
  // colisor do prédio (só as paredes: por dentro dá para entrar)
  const cg = new THREE.Mesh(new THREE.BoxGeometry(p.w, topo, p.d), new THREE.MeshBasicMaterial({ visible: false })); cg.position.y = topo / 2; cg.applyMatrix4(m); cg.userData.ns = 1; cg.visible = false;
  solids.push(cg);
  void retCantos;
  return { m, floors, solids, vtt, portals };
}

// ---------- interiores ----------
/** acende uma luz de interior (pede uma PointLight ao gerenciador) e põe auréola */
const luzI = (v: THREE.Vector3, n = 4, cor = 0xff9a48, dist = 9, prio = 4) => { luz(v.x, v.y, v.z, n * 18, prio, cor, dist * 1.5, 6); halo(v.x, v.y, v.z, 0.45); };

export function mobiliar(B: Batch, G: THREE.Group, id: string, docs: { o: THREE.Object3D; n: string; pt?: string; onde?: string }[]) {
  const m = MATRIZ[id], p = SPEC[id], M = MAT(), H = p.h;
  const W = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(m);
  switch (id) {
    case 'javali': {
      // salão: lareira grande no fundo, balcão, mesas compridas de cavaleiros, troféu de javali, estandartes
      luzI(lareira(B, m, -3, -2.2, 0, 0, 2.4), 9, 0xff7a30, 12, 6);
      balcao(B, m, 4.2, 1.2, -Math.PI / 2, 4);
      prateleira(B, m, 6.75, 1.2, -Math.PI / 2, 3.4, 1.3, 'garrafas');
      for (let i = 0; i < 4; i++) barril(B, m, 6.3, -0.8 + i * 0.8 + 0.4, 0, true);
      for (const [x, z] of [[-4.5, 1.2], [-4.5, 4.2], [-0.6, 2.6], [-0.6, 5.2]]) { mesa(B, m, x, z, 0, 2.4, 0.9); banco(B, m, x, z - 0.75, 0, 2.2); banco(B, m, x, z + 0.75, Math.PI, 2.2); servico(B, m, x - 0.5, 0.8, z); servico(B, m, x + 0.6, 0.8, z + 0.2); }
      for (const z of [0.5, 2.2, 4]) banqueta(B, m, 3.4, z);
      luzI(lustre(B, m, -2.5, 3.1, 2.8, 0.8), 5, 0xffa050, 10, 5);
      tapecaria(B, m, -6.75, 2.1, 1.6, Math.PI / 2, 1.2, 1.8, 0x5a1420); tapecaria(B, m, -6.75, 2.1, 4.6, Math.PI / 2, 1.2, 1.8, 0x3a2a1a);
      { const P = peca(B, m, -3, 2.9, -2.45); P.cx(M.madeira, 0.9, 0.7, 0.08, 0, 0, 0, 0x3a2818); P.esf(M.plain, 0.32, 0, 0, 0.25, 0x3a2a20, 0.9); P.cx(M.plain, 0.05, 0.25, 0.05, -0.18, 0.05, 0.5, 0xd8d0c0, 0, -0.8); P.cx(M.plain, 0.05, 0.25, 0.05, 0.18, 0.05, 0.5, 0xd8d0c0, 0, -0.8); }
      armadura(B, m, -6.2, -0.6, Math.PI / 2); cavalete(B, m, 0.4, -1.95, 0);
      // cozinha (fundos, à direita do corredor)
      luzI(caldeirao(B, m, 4, -4.2), 5, 0xff7a30, 7, 4);
      mesa(B, m, 2.6, -5.2, 0, 1.6, 0.7); prateleira(B, m, 2.6, -5.75, 0, 2, 1.3, 'potes'); sacos(B, m, 6, -5.2, 5); caixote(B, m, 1.8, -3.4, 0, 0.6);
      // estoque sob a escada e quartos para viajantes (andar de cima): 3 quartos
      for (const x of [-4.7, 0, 4.7]) { cama(B, m, x - 0.6, 3.5, 0, false, H); bau(B, m, x + 1.2, 5.2, Math.PI, H); vela(B, m, x + 1.2, H + 0.5, 4.2); }
      luzI(W(0, H + 2.2, 2.8), 2.5, 0xffa050, 6, 3);
      for (let i = 0; i < 5; i++) barril(B, m, -6.2 + i * 0.75, -5.3, H);
      break;
    }
    case 'lanterna': {
      // taverna do cais: escura, baixa, redes de pesca, mesas de jogo, fundos para contrabando (alçapão)
      balcao(B, m, -2, -0.6, 0, 3.6); prateleira(B, m, -2, -1.6, 0, 3.2, 1.2, 'garrafas');
      luzI(lareira(B, m, 5.5, 2.5, -Math.PI / 2, 0, 1.6), 6, 0xff7a30, 9, 5);
      for (const [x, z] of [[-4, 2.4], [-1, 3.6], [2.4, 2.2]]) { mesa(B, m, x, z, rnd(), 1.1, 1.1); for (let i = 0; i < 3; i++) banqueta(B, m, x + Math.cos(i * 2.1) * 0.9, z + Math.sin(i * 2.1) * 0.9); servico(B, m, x, 0.8, z); }
      for (const v of [W(-4, 1.0, 2.4), W(2.4, 1.0, 2.2)]) luzI(v, 2, 0xffa050, 5, 4);
      for (let i = 0; i < 3; i++) vela(B, m, -4 + i * 3.2, 0.82, 2.4 + (i % 2) * 1.2);
      { const P = peca(B, m, 0, 2.6, 4.7); for (let i = 0; i < 9; i++) P.cx(M.plain, 0.02, 1.2, 0.02, -4 + i, 0, 0, 0x2a2420); P.cx(M.tecido, 8, 1.1, 0.02, 0, -0.1, 0.02, 0x3a3a30); }
      // fundos (estoque/contrabando): caixas, barris, alçapão
      for (let i = 0; i < 6; i++) caixote(B, m, -4.6 + i * 0.9, -3.8, 0, 0.6 + rnd() * 0.2);
      for (let i = 0; i < 3; i++) barril(B, m, 3 + i * 0.8, -3.6);
      { const P = peca(B, m, 1.5, 0.06, -3.2); P.cx(M.tabuas, 1.0, 0.04, 1.0, 0, 0, 0, 0x2a1e14); P.cx(M.ferro, 0.2, 0.03, 0.05, 0, 0.03, 0.3); }
      // quartos de cima (baratos)
      cama(B, m, -3, 2.6, Math.PI / 2, false, H); cama(B, m, 3, 2.6, Math.PI / 2, false, H); bau(B, m, -4.8, 4.2, 0, H); luzI(W(0, H + 1.9, 2.5), 2, 0xffa050, 6, 3);
      for (let i = 0; i < 4; i++) sacos(B, m, -4 + i * 2.6, -3.5, 3, H);
      break;
    }
    case 'calice': {
      // casa de vinhos da nobreza: tapetes, quadros, lustre, mesas com toalha, adega nos fundos, salas privadas em cima
      luzI(lustre(B, m, -1.5, 3.6, 2.5, 0.9), 6, 0xffb060, 12, 6);
      luzI(lareira(B, m, -4, -3.3, 0, 0, 2.0), 6, 0xff7a30, 10, 5);
      for (const [x, z] of [[-4.6, 0.8], [-4.6, 3.8], [-0.6, 2.2], [-0.6, 4.8]]) { mesa(B, m, x, z, 0, 1.4, 1.0, 0, 0x2a1a12); cadeira(B, m, x - 0.9, z, Math.PI / 2); cadeira(B, m, x + 0.9, z, -Math.PI / 2); vela(B, m, x, 0.83, z); servico(B, m, x + 0.3, 0.8, z - 0.2); const P = peca(B, m, x, 0.8, z); P.cx(M.tecido, 1.5, 0.01, 1.1, 0, 0.02, 0, 0x6a1a24); }
      tapete(B, m, -2.6, 2.6, 0, 6, 4.6); balcao(B, m, 4.6, 2.6, -Math.PI / 2, 3);
      prateleira(B, m, 6.75, 2.6, -Math.PI / 2, 3, 1.2, 'garrafas'); prateleira(B, m, 6.75, 2.6, -Math.PI / 2, 3, 1.9, 'garrafas');
      for (const x of [-6.75]) for (const z of [0, 3.5]) quadro(B, m, x, 2.1, z, Math.PI / 2, 0.9, 1.2);
      // adega (fundos)
      for (let i = 0; i < 7; i++) barril(B, m, -6 + i * 1.3, -5, 0, true, 1.1);
      for (let i = 0; i < 6; i++) barril(B, m, -6 + i * 1.3, -4.1, 0, true, 0.9);
      // salas privadas em cima: mesa de conselho secreto, estante, sofá
      mesa(B, m, -4.2, 3.4, 0, 2.2, 1.2, H, 0x2a1a12); for (let i = 0; i < 3; i++) { cadeira(B, m, -5 + i * 0.8, 2.4, 0, H); cadeira(B, m, -5 + i * 0.8, 4.4, Math.PI, H); }
      estante(B, m, -6.6, 1.6, Math.PI / 2, 1.6, 2.2, true, H); luzI(W(-4.2, H + 2.4, 3.4), 3, 0xffb060, 7, 4); tapecaria(B, m, -4.2, H + 2.1, 5.75, Math.PI, 2, 1.6, 0x4a141c);
      cama(B, m, 2.5, 3.5, Math.PI / 2, true, H); armario(B, m, 5.8, 4.8, -Math.PI / 2, H);
      break;
    }
    case 'forja': {
      luzI(forja(B, m, -2.2, -2.8, 0), 9, 0xff5a20, 10, 6);
      cavalete(B, m, 2.6, -4.1, 0); armadura(B, m, 4.2, -3.4, -Math.PI / 2); armadura(B, m, 4.2, -1.8, -Math.PI / 2);
      mesa(B, m, 2.5, -1.2, 0, 2, 0.8); for (let i = 0; i < 6; i++) { const P = peca(B, m, 1.7 + i * 0.3, 0.8, -1.2); P.cx(M.ferro, 0.05, 0.03, 0.6, 0, 0.02, 0); }
      barril(B, m, -3.8, -0.6); barril(B, m, -3.8, 0.4); caixote(B, m, 3.8, 2.5, 0, 0.7); sacos(B, m, -3.6, 3, 4);
      { const P = peca(B, m, -0.6, 0, -3.4); P.cil(M.madeira, 0.5, 0.5, 0, 0, 0, 0x4a3424, 12); P.cil(M.agua, 0.42, 0.02, 0, 0.48, 0, 0xffffff, 12); }   // tina de têmpera
      break;
    }
    case 'botica': {
      balcao(B, m, 0, 0.8, 0, 4); for (let i = 0; i < 3; i++) prateleira(B, m, 0, -1.35, 0, 7, 1.0 + i * 0.55, i === 1 ? 'potes' : i === 2 ? 'ervas' : 'garrafas');
      estante(B, m, -4.2, 2.5, Math.PI / 2, 1.6, 2.2); estante(B, m, 4.2, 2.5, -Math.PI / 2, 1.6, 2.2, false);
      luzI(vela(B, m, -0.8, 1.12, 0.9), 2.5, 0xffb060, 6, 5); vela(B, m, 0.9, 1.12, 0.8);
      // laboratório atrás (alambique)
      mesa(B, m, 0, -3, 0, 2.4, 0.9); { const P = peca(B, m, 0.4, 0.8, -3); P.esf(M.plain, 0.18, 0, 0.18, 0, 0x5a6a5a); P.cil(M.plain, 0.03, 0.5, 0, 0.3, 0, 0x6a7a6a, 6); P.cx(M.plain, 0.6, 0.03, 0.03, 0.3, 0.75, 0, 0x6a7a6a, -0.4); }
      luzI(caldeirao(B, m, -2.6, -3.3), 3, 0x7aff9a, 5, 4);   // caldeirão com chama esverdeada
      prateleira(B, m, 2.8, -4.05, 0, 2.6, 1.3, 'potes'); bau(B, m, 3, -2.6, Math.PI);
      break;
    }
    case 'emporio': {
      balcao(B, m, 1, 0.3, 0, 5); for (let i = 0; i < 3; i++) prateleira(B, m, 0, -1.2, 0, 8, 0.9 + i * 0.6, i === 0 ? 'potes' : 'garrafas');
      for (let i = 0; i < 8; i++) sacos(B, m, -4 + (i % 4) * 1.1, 2.4 + Math.floor(i / 4) * 1.4, 3);
      for (let i = 0; i < 4; i++) barril(B, m, 4.2, 1 + i * 0.8);
      { const P = peca(B, m, -2, 0, 3.6); for (let i = 0; i < 5; i++) P.cx(M.madeira, 0.05, 0.05, 1.6, -1 + i * 0.5, 2.6, 0, 0x2a1e14); for (let i = 0; i < 8; i++) P.cx(M.plain, 0.12, 0.5, 0.12, -1 + (i % 5) * 0.5, 2.2, -0.6 + (i % 3) * 0.6, pick([0x6a3a2a, 0x8a6a40, 0x5a4a30])); }  // presuntos e réstias penduradas
      luzI(W(0, 2.8, 1.5), 3, 0xffa050, 8, 4);
      // depósito
      for (let i = 0; i < 10; i++) caixote(B, m, -4.2 + (i % 5) * 1.0, -3.2 - Math.floor(i / 5) * 0.9, 0, 0.75);
      for (let i = 0; i < 4; i++) caixote(B, m, -4.2 + i, -3.2, 0.75, 0.7);
      break;
    }
    case 'templo': {
      // nave com bancos, altar de Lena, vitrais, colunas, estátua (modelo), velas votivas, lápides no chão
      for (let i = 0; i < 7; i++) { bancoTemplo(B, m, -3.3, 6.8 - i * 1.6, 0, 4.4); bancoTemplo(B, m, 3.3, 6.8 - i * 1.6, 0, 4.4); }
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) cil(B, M.pedra, 0.45, 10.4, s * 5.8, 0, 8 - i * 4, 0x8a8278, 12, m);
      const vs = altar(B, m, 0, -8.6, 0); vs.forEach((v, i) => { if (i % 2 === 0) luzI(v, 2.5, 0xffb060, 8, 6); });
      { const P = peca(B, m, 0, 0, -10.4); P.cx(M.pedra, 3, 0.5, 1.2, 0, 0.25, 0, 0x8a8278); P.cx(M.pedra, 1.6, 0.4, 0.8, 0, 0.7, 0, 0x8a8278); }
      tapecaria(B, m, 0, 5.5, -10.75, 0, 2.4, 4, 0xd8cfb8); tapecaria(B, m, 0, 5.6, -10.73, 0, 1.0, 1.0, 0x8a6a2a);
      tapete(B, m, 0, 0, 0, 1.6, 18);
      // velas votivas (oferendas pelos mortos da Praga)
      for (let i = 0; i < 18; i++) { const v = vela(B, m, -7 + (i % 6) * 0.3, 0.9 + Math.floor(i / 6) * 0.25, -6 + (i % 3) * 0.2); if (i === 4) luzI(v, 2, 0xffb060, 6, 5); }
      { const P = peca(B, m, -7, 0, -6); P.cx(M.madeira, 1.9, 0.9, 0.8, 0, 0.45, 0, 0x3a2818); P.cx(M.madeira, 1.9, 0.5, 0.4, 0, 1.05, -0.2, 0x3a2818); }
      for (let i = 0; i < 6; i++) { const P = peca(B, m, (i % 2 ? 1.6 : -1.6), 0.06, 4 - i * 2.4); P.cx(M.pedra, 0.8, 0.02, 1.6, 0, 0, 0, 0x6a645c); }
      luzI(lustre(B, m, 0, 8.5, -2, 1.0), 5, 0xffb060, 14, 5); luzI(lustre(B, m, 0, 8.5, 4.5, 0.9), 4, 0xffb060, 12, 5); luzI(W(0, 1.4, -9.6), 4, 0xffb060, 10, 6);
      // torre do sino nos fundos (por fora)
      cx(B, M.pedra, 4.2, 20, 4.2, 6.2, 10, -9, 0x7e786e, m); cone(B, M.ardosia, 3.3, 7, 6.2, 20, -9, 0x56565e, 4, m);
      cx(B, M.escuro, 1.2, 2.2, 4.25, 6.2, 16.5, -9, 0xffffff, m);
      break;
    }
    case 'quartel': {
      // sala da guarda (frente), sala do capitão, celas (fundos com grades)
      mesa(B, m, -3, 3.4, 0, 2.6, 1.0); for (let i = 0; i < 3; i++) { banco(B, m, -3, 2.6, 0, 2.4); banco(B, m, -3, 4.2, Math.PI, 2.4); }
      cavalete(B, m, -7.2, 3, Math.PI / 2); cavalete(B, m, -7.2, 5, Math.PI / 2); armadura(B, m, -7.2, 1.2, Math.PI / 2);
      luzI(lareira(B, m, -1, 6.6, Math.PI, 0, 1.6), 5, 0xff7a30, 9, 5);
      // quadro de procurados (mestre troca os cartazes)
      { const P = peca(B, m, -5.2, 1.6, 0.2, 0); P.cx(M.madeira, 2.4, 1.4, 0.06, 0, 0, 0, 0x4a3424); }
      // sala do capitão
      mesa(B, m, -5, -3.5, 0, 1.8, 0.9, 0, 0x2a1a12); cadeira(B, m, -5, -4.4, 0); estante(B, m, -7.6, -3.5, Math.PI / 2, 1.6); bau(B, m, -2.6, -6.3, 0);
      tapecaria(B, m, -5, 2.0, -6.75, 0, 1.4, 2, 0x5a1420); luzI(vela(B, m, -4.6, 0.83, -3.4), 2.5, 0xffb060, 6, 5);
      // celas
      for (const [z0, z1] of [[-7, -2.5], [-2.5, 2.5], [2.5, 7]]) {
        for (let s = z0 + 0.3; s < z1 - 0.2; s += 0.22) if (Math.abs(s - (z0 + z1) / 2) > 0.5 || z0 !== -2.5) cx(B, M.ferro, 0.05, 3.6, 0.05, 2.2, 1.8, s, 0xffffff, m);
        const P = peca(B, m, 7, 0, (z0 + z1) / 2); P.cx(M.tabuas, 0.8, 0.4, 2, 0, 0.2, 0, 0x4a3424); P.cx(M.plain, 0.6, 0.06, 0.4, -0.2, 0.05, 1.2, 0x8a7a60);
      }
      luzI(W(3.4, 2.6, 0), 2, 0xff9a48, 7, 3);
      break;
    }
    case 'salao': {
      // salão do conselho/trono: colunas, tapete vinho, trono em degraus, estandartes, mesa do conselho, braseiros
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) cil(B, M.pedra, 0.55, 7.9, s * 7, 0, 4.5 - i * 3.2, 0x7e786e, 12, m);
      tapete(B, m, 0, 0.5, 0, 2.4, 12.5);
      { const P = peca(B, m, 0, 0, -5.6); P.cx(M.pedra, 6, 0.3, 2.4, 0, 0.15, 0, 0x6a645c); P.cx(M.pedra, 4, 0.3, 1.6, 0, 0.45, -0.3, 0x6a645c);
        P.cx(M.madeira, 1.3, 0.5, 0.9, 0, 0.85, -0.4, 0x2a1a12); P.cx(M.madeira, 1.3, 2.2, 0.15, 0, 1.7, -0.85, 0x2a1a12); P.cx(M.tecido, 1.0, 0.1, 0.7, 0, 1.12, -0.35, 0x5a1420); P.cx(M.tecido, 1.0, 1.4, 0.03, 0, 1.8, -0.76, 0x5a1420); }
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tapecaria(B, m, s * 10.75, 4.2, 3.5 - i * 4, -s * Math.PI / 2, 1.6, 4.4, i === 1 ? 0x3a2a1a : 0x5a1420);
      tapecaria(B, m, 0, 5.2, -6.75, 0, 4.2, 3.4, 0x5a1420);
      mesa(B, m, 0, 1.4, Math.PI / 2, 5, 1.4, 0, 0x2a1a12); for (let i = 0; i < 5; i++) { cadeira(B, m, -0.95, -0.6 + i, Math.PI / 2); cadeira(B, m, 0.95, -0.6 + i, -Math.PI / 2); }
      { const P = peca(B, m, 0, 0.8, 1.4); P.cx(M.plain, 1.6, 0.01, 1.0, 0, 0.02, 0, 0xc8b890); }   // mapa de Lomatubar sobre a mesa
      for (const [x, z] of [[-4.5, -4], [4.5, -4], [-4.5, 5], [4.5, 5]]) { const P = peca(B, m, x, 0, z); P.cil(M.ferro, 0.12, 1.0, 0, 0, 0, 0xffffff, 8); P.cil(M.ferro, 0.4, 0.25, 0, 1.0, 0, 0xffffff, 10, 0.25); for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(0.1, 0.35, 5); g.translate((rnd() - 0.5) * 0.3, 1.4, (rnd() - 0.5) * 0.3); por(B, M.aceso, g, 0xffffff, P.m); } luzI(P.pos(0, 1.5, 0), 5, 0xff8a3a, 10, 5); }
      armadura(B, m, -9.8, -5.5, Math.PI / 4); armadura(B, m, 9.8, -5.5, -Math.PI / 4);
      break;
    }
    case 'mercador': {
      // térreo: sala com lareira, escritório de contas (cofre), cozinha; em cima: quarto do casal, quarto da filha
      luzI(lareira(B, m, -3, -1.4, Math.PI, 0, 1.8), 5, 0xff7a30, 9, 5);
      tapete(B, m, -3, 2.6, 0, 3, 2.2); cadeira(B, m, -4, 2.2, 0.6); cadeira(B, m, -2, 2.2, -0.6); mesa(B, m, -3, 3.4, 0, 1.2, 0.7);
      quadro(B, m, -5.75, 2.0, 2.5, Math.PI / 2, 0.8, 1.0); armario(B, m, -5.5, 4.8, Math.PI / 2);
      // escritório (direita): mesa de contas, cofre, livros-caixa
      mesa(B, m, 3, 1.5, 0, 1.8, 0.9, 0, 0x2a1a12); cadeira(B, m, 3, 0.6, 0); estante(B, m, 5.6, 1.6, -Math.PI / 2, 1.6); bau(B, m, 4.6, -4.6, 0);
      { const P = peca(B, m, 2.6, 0.8, 1.5); for (let i = 0; i < 4; i++) P.cx(M.plain, 0.3, 0.06, 0.22, -0.4 + i * 0.32, 0.03 + (i % 2) * 0.06, 0, pick([0x3a2a1a, 0x5a1a1a])); }
      luzI(vela(B, m, 3.6, 0.83, 1.6), 2.5, 0xffb060, 6, 5);
      // cozinha (fundos à esquerda)
      luzI(caldeirao(B, m, -4.6, -4.6), 3, 0xff7a30, 6, 4); mesa(B, m, -2, -4.2, 0, 1.4, 0.7); prateleira(B, m, -3, -5.35, 0, 3, 1.3, 'potes');
      // andar de cima
      cama(B, m, -3, -3.6, 0, true, H); bau(B, m, -1.2, -4.7, 0, H); armario(B, m, -5.5, -1, Math.PI / 2, H); tapete(B, m, -3, -2.6, 0, 2.4, 1.6, H);
      cama(B, m, 3.2, 3.6, Math.PI, false, H); estante(B, m, 5.6, 2.6, -Math.PI / 2, 1.2, 1.8, true, H); quadro(B, m, 1, H + 1.8, 5.25, Math.PI, 0.5, 0.6);
      luzI(W(-2, H + 2.2, -2), 2, 0xffa050, 6, 3);
      break;
    }
    case 'artesao': {
      // carpinteiro/entalhador: oficina no térreo, cozinha nos fundos, quarto e quarto das crianças em cima
      mesa(B, m, 0, 2, 0, 2.6, 1.0); for (let i = 0; i < 5; i++) { const P = peca(B, m, -1 + i * 0.5, 0.8, 2); P.cx(M.madeira, 0.3, 0.06, 0.08, 0, 0.03, (rnd() - 0.5) * 0.4, 0x6a5040); }
      prateleira(B, m, -3.75, 2, Math.PI / 2, 2.4, 1.3, 'potes'); for (let i = 0; i < 6; i++) { const P = peca(B, m, 3.2, 0, 1 + i * 0.5); P.cx(M.madeira, 0.1, 1.8, 0.1, 0, 0.9, 0, 0x6a5040, 0.15); }
      cadeira(B, m, -1.6, 3.4, 0.5); luzI(W(0, 2.4, 2), 2.5, 0xffa050, 6, 4);
      luzI(lareira(B, m, 1.5, -4.2, 0, 0, 1.4), 4, 0xff7a30, 7, 4); mesa(B, m, -1.6, -2.6, 0, 1.4, 0.8); cadeira(B, m, -1.6, -3.3, 0); cadeira(B, m, -1.6, -1.9, Math.PI);
      cama(B, m, -2, -3.2, 0, false, H); bau(B, m, -2, -0.5, Math.PI, H); cama(B, m, 2.3, -2.6, 0, false, H); cama(B, m, 2.3, 2.6, Math.PI, false, H);
      { const P = peca(B, m, 2.3, H + 0.6, 1.0); P.cx(M.plain, 0.25, 0.3, 0.18, 0, 0, 0, 0x8a6a4a); }   // boneca de pano
      luzI(W(0, H + 2, 0), 2, 0xffa050, 5, 3);
      break;
    }
    case 'casebre': {
      // um cômodo só: catre, fogareiro, mesa tosca, baú, imagem de santo, rachaduras e frio
      cama(B, m, -2.2, -1.4, 0, false); luzI(caldeirao(B, m, 2.2, -1.8), 3, 0xff7a30, 5, 4);
      mesa(B, m, 1, 1.4, 0.2, 1.1, 0.7); banqueta(B, m, 0.3, 1.8); banqueta(B, m, 1.7, 1.9); bau(B, m, -2.6, 2, Math.PI / 2);
      prateleira(B, m, 3.2, 0.8, -Math.PI / 2, 1.2, 1.4, 'potes'); vela(B, m, -2.8, 1.2, -2.6);
      { const P = peca(B, m, -2.8, 1.3, -2.85); P.cx(M.madeira, 0.3, 0.4, 0.04, 0, 0, 0, 0x6a5030); }
      break;
    }
    case 'lazareto': {
      // casa de cura abandonada na Praga: catres em fileira, lençóis, coral crescendo do chão, mesa do curandeiro
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
        if (rnd() < 0.15) continue;
        const x = -6.6 + i * 1.6, z = s > 0 ? 4.6 : 0.6;
        const P = peca(B, m, x, 0, z, (rnd() - 0.5) * 0.3); P.cx(M.madeira, 0.8, 0.45, 1.9, 0, 0.22, 0, 0x3a2a1e); P.cx(M.plain, 0.75, 0.08, 1.8, 0, 0.5, 0, 0x8a8270);
        if (rnd() < 0.45) { const v = P.pos(0, 0.5, 0); coral(B, v.x, v.y, v.z, 1.1 + rnd()); }
      }
      for (let i = 0; i < 9; i++) { const v = W(-7 + rnd() * 14, 0, -6 + rnd() * 12); coral(B, v.x, 0, v.z, 0.8 + rnd() * 1.8); }
      mesa(B, m, 5, -4.4, 0, 1.6, 0.8); prateleira(B, m, 5.4, -6.15, 0, 2, 1.3, 'potes'); estante(B, m, 7.6, -1.2, -Math.PI / 2, 1.4, 2, true);
      { const P = peca(B, m, 4.6, 0.8, -4.4); P.cx(M.plain, 0.4, 0.04, 0.3, 0, 0.02, 0, 0xc8b890); }   // diário do curandeiro
      luzI(W(5, 1.6, -4.4), 1.5, 0xff4a4a, 5, 3);   // brilho avermelhado do coral
      for (let i = 0; i < 5; i++) barril(B, m, -7.2 + i * 0.8, -5.8, 0, rnd() < 0.5);
      break;
    }
  }
  void docs; void M; void signTexture; void FORTALEZA;
}

/** fortaleza: plataforma elevada, muralha baixa com ameias, escadaria, torre de menagem e duas torres de canto */
export function construirFortaleza(B: Batch, BR: Batch, G: THREE.Group) {
  const M = MAT(), [x0, x1, z0, z1] = FORTALEZA, hP = 2.6, floors: THREE.Object3D[] = [], solids: THREE.Object3D[] = [];
  const cxw = (x0 + x1) / 2, czw = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  cx(B, M.pedra, w, hP, d, cxw, hP / 2, czw, 0x6e6860);
  { const g = new THREE.PlaneGeometry(w - 1, d - 1); g.rotateX(-Math.PI / 2); g.translate(cxw, hP + 0.01, czw); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i)); const me = new THREE.Mesh(g, MAT().calcada); me.receiveShadow = true; me.userData.ns = 1; G.add(me); floors.push(me); }
  // escadaria frontal (sul), centrada na Via Real
  const n = 13; for (let i = 0; i < n; i++) cx(B, M.pedra, 8, (i + 1) * hP / n, 0.42, 0, (i + 1) * hP / n / 2, z1 + 0.21 + (n - 1 - i) * 0.42, 0x6a645c);
  { const r = new THREE.Mesh(new THREE.PlaneGeometry(8, Math.hypot(hP, n * 0.42)), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); r.geometry.rotateX(-Math.PI / 2 + Math.atan2(hP, n * 0.42)); r.position.set(0, hP / 2, z1 + n * 0.42 / 2); r.userData.ns = 1; G.add(r); floors.push(r); }
  // muralha baixa em volta da plataforma (com vão na escadaria)
  const mur = (ax: number, az: number, bx: number, bz: number) => { const L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az) - Math.PI / 2, m = mtx((ax + bx) / 2, hP, (az + bz) / 2, a); cx(B, M.pedra, L, 2.2, 0.7, 0, 1.1, 0, 0x726c64, m); for (let s = -L / 2 + 0.5; s < L / 2; s += 1.6) cx(B, M.pedra, 0.7, 0.6, 0.7, s, 2.5, 0, 0x6a645c, m); };
  mur(x0 + 0.4, z0 + 0.4, x1 - 0.4, z0 + 0.4); mur(x0 + 0.4, z0 + 0.4, x0 + 0.4, z1 - 0.4); mur(x1 - 0.4, z0 + 0.4, x1 - 0.4, z1 - 0.4);
  mur(x0 + 0.4, z1 - 0.4, -4.5, z1 - 0.4); mur(4.5, z1 - 0.4, x1 - 0.4, z1 - 0.4);
  for (const [x, z] of [[x0 + 2, z1 - 2], [x1 - 2, z1 - 2]]) { cil(B, M.pedra, 3, 11, x, hP, z, 0x7a746c, 14); cone(B, M.ardosia, 3.4, 5.5, x, hP + 11, z, 0x56565e, 14); luz(x, hP + 4, z + 3.2, 6, 2, 0xff8a3a, 12); halo(x, hP + 4, z + 3.2, 0.7); }
  // torre de menagem (fundos)
  cx(B, M.pedra, 14, 26, 13, 0, hP + 13, z0 + 9, 0x7a746c);
  for (let i = -6; i <= 6; i += 1.5) for (const s of [-1, 1]) { cx(B, M.pedra, 0.8, 1.1, 0.6, i, hP + 26.55, z0 + 9 + s * 6.3, 0x6e6860); cx(B, M.pedra, 0.6, 1.1, 0.8, s * 6.8, hP + 26.55, z0 + 9 + i * 0.9, 0x6e6860); }
  for (let k = 0; k < 4; k++) for (const s of [-3, 0, 3]) cx(B, k > 1 ? M.aceso : M.escuro, 0.7, 1.4, 0.06, s, hP + 7 + k * 5, z0 + 15.53, 0xffffff);
  cx(B, M.tecido, 2.6, 6, 0.05, 0, hP + 18, z0 + 15.56, 0x5a1420);   // estandarte do reino
  { const P = peca(B, new THREE.Matrix4(), 0, hP + 27.1, z0 + 9); P.cx(M.madeira, 0.12, 5, 0.12, 4, 2.5, 4); P.cx(M.tecido, 2.2, 1.3, 0.03, 5.1, 4.2, 4, 0x5a1420); }
  const cg = new THREE.Mesh(new THREE.BoxGeometry(14, 26, 13), new THREE.MeshBasicMaterial({ visible: false })); cg.position.set(0, hP + 13, z0 + 9); cg.visible = false; solids.push(cg);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(w, hP, d), new THREE.MeshBasicMaterial({ visible: false })); pl.position.set(cxw, hP / 2, czw); pl.visible = false; solids.push(pl);
  void BR;
  return { floors, solids, base: hP };
}
