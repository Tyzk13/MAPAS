// Barud — a cidade: terreno, muralha, canal e pontes, ruas, casas geradas por bairro, lanternas, fumaça e objetos.
import * as THREE from 'three';
import { pbr } from '../../core/pbr';
import { halo } from '../../core/kit';
import {
  Batch, MAT, mtx, por, cx, telhado, cone, cil, coral, rnd, entre, pick, Q,
  MURO, dentroMuro, PORTAO_SUL, PORTAO_LESTE, CANAL, RUAS, PRACA, FORTALEZA, CORAL,
  dentroRet, cruzaRet, retRua, type Ret, signTexture,
} from './common';
import { barril, caixote, sacos, peca } from './mobilia';

export interface LReq { x: number; y: number; z: number; cor: number; n: number; dist: number; prio: number; vtt?: number }
export const LUZES: LReq[] = [];
export function luz(x: number, y: number, z: number, n = 6, prio = 1, cor = 0xff9a48, dist = 14, vtt?: number) { LUZES.push({ x, y, z, cor, n, dist, prio, vtt }); }

export interface Cidade {
  floors: THREE.Object3D[]; colliders: THREE.Object3D; roofs: THREE.Group; chamines: THREE.Vector3[];
  vttWalls: [number, number][][]; casas: { r: Ret; estilo: string }[]; lanternas: THREE.Vector3[];
}

/** zona → estilo das casas */
function estiloEm(x: number, z: number) {
  if (dentroRet(x, z, CORAL, 1)) return 'coral';
  if (z < -36) return 'rica';
  if (z > 44 || (z > 26 && Math.abs(x) > 60)) return rnd() < 0.12 ? 'ruina' : 'pobre';
  return rnd() < 0.04 ? 'ruina' : 'media';
}

export function construirCidade(G: THREE.Group, reservados: Ret[]): Cidade {
  const M = MAT(), B = new Batch('cidade'), BR = new Batch('telhados'), roofs = new THREE.Group(); roofs.name = 'Telhados';
  const floors: THREE.Object3D[] = [], chamines: THREE.Vector3[] = [], vttWalls: [number, number][][] = [], lanternas: THREE.Vector3[] = [];
  const colGeo: THREE.BufferGeometry[] = [];
  const colisor = (w: number, h: number, d: number, m: THREE.Matrix4, y = h / 2) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y, 0); g.applyMatrix4(m); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.index ? g.toNonIndexed() : g); };

  // ---------- terreno ----------
  const sh = (pts: [number, number][]) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  {
    const fora = sh([[-340, -340], [340, -340], [340, 340], [-340, 340]]);
    fora.holes.push(new THREE.Path(MURO.map(([x, z]) => new THREE.Vector2(x, -z)).reverse()));
    const g = new THREE.ShapeGeometry(fora, 2); g.rotateX(-Math.PI / 2); g.translate(0, -0.03, 0);
    const mo = pbr('withered_grass', { size: 5, color: 0x6a6656 });
    const me = new THREE.Mesh(g, mo); me.receiveShadow = true; G.add(me); floors.push(me);
    const dentro = sh(MURO);
    dentro.holes.push(new THREE.Path([[CANAL.x0, CANAL.z0], [CANAL.x1, CANAL.z0], [CANAL.x1, CANAL.z1], [CANAL.x0, CANAL.z1]].map(([x, z]) => new THREE.Vector2(x, -z))));
    const gi = new THREE.ShapeGeometry(dentro, 2); gi.rotateX(-Math.PI / 2);
    const mi = new THREE.Mesh(gi, M.terra); mi.receiveShadow = true; G.add(mi); floors.push(mi);
    // estrada de terra saindo dos portões
    const est = pbr('dry_ground_rocks', { size: 4, color: 0x7a7266 });
    for (const [x0, z0, x1, z1, w] of [[PORTAO_SUL.x, PORTAO_SUL.z, PORTAO_SUL.x + 8, 330, 7], [PORTAO_LESTE.x, PORTAO_LESTE.z, 330, PORTAO_LESTE.z - 20, 6]] as number[][]) {
      const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0);
      const g2 = new THREE.PlaneGeometry(w, L); g2.rotateX(-Math.PI / 2); g2.translate(0, -0.01, L / 2); g2.rotateY(a); g2.translate(x0, 0, z0);
      const uv = g2.attributes.uv, p = g2.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
      const e = new THREE.Mesh(g2, est); e.receiveShadow = true; G.add(e);
    }
  }

  // ---------- ruas de pedra ----------
  const ruaRets = RUAS.map(retRua);
  for (const r of RUAS) {
    const R = retRua(r), vert = r.x0 === r.x1;
    // pedaços dentro do muro (portões deixam a rua sair) e fora do canal
    const passo = 1, segs: [number, number][] = [];
    const a0 = vert ? R[2] : R[0], a1 = vert ? R[3] : R[1];
    let ini: number | null = null;
    for (let a = a0; a <= a1 + 0.001; a += passo) {
      const x = vert ? r.x0 : a, z = vert ? a : r.z0;
      const ok = (dentroMuro(x, z, 3) || (Math.hypot(x - PORTAO_SUL.x, z - PORTAO_SUL.z) < 8) || (Math.hypot(x - PORTAO_LESTE.x, z - PORTAO_LESTE.z) < 8))
        && !(vert && z > CANAL.z0 - 0.6 && z < CANAL.z1 + 0.6);
      if (ok && ini === null) ini = a; else if (!ok && ini !== null) { segs.push([ini, a - passo]); ini = null; }
    }
    if (ini !== null) segs.push([ini, a1]);
    for (const [s0, s1] of segs) {
      const L = s1 - s0 + passo; if (L < 1) continue;
      const g = new THREE.PlaneGeometry(vert ? r.w : L, vert ? L : r.w); g.rotateX(-Math.PI / 2);
      g.translate(vert ? r.x0 : (s0 + s1) / 2, r.beco ? 0.012 : 0.02, vert ? (s0 + s1) / 2 : r.z0);
      const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
      const me = new THREE.Mesh(g, M.calcada); me.receiveShadow = true; me.userData.ns = 1; G.add(me);
    }
  }
  // praça calçada
  {
    const [x0, x1, z0, z1] = PRACA, g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.025, (z0 + z1) / 2);
    const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
    const me = new THREE.Mesh(g, pbr('grey_stone_path', { size: 3, color: 0x8a847c })); me.receiveShadow = true; me.userData.ns = 1; G.add(me);
  }

  // ---------- muralha, torres e portões ----------
  const MH = 9, MT = 2.8;
  const muroSeg = (ax: number, az: number, bx: number, bz: number) => {
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.5) return;
    const a = Math.atan2(bx - ax, bz - az) - Math.PI / 2, m = mtx((ax + bx) / 2, 0, (az + bz) / 2, a);
    cx(B, M.pedra, L, MH, MT, 0, MH / 2, 0, 0xa49c90, m);
    // ameias: lado de fora (+z local depois da rotação aponta para fora? confere pelo centro da cidade)
    // eixo z local = (sen a, cos a): o lado de fora é o que se afasta do centro da cidade
    const sgn = ((ax + bx) / 2 * Math.sin(a) + (az + bz) / 2 * Math.cos(a)) > 0 ? 1 : -1;
    for (let s = -L / 2 + 0.6; s < L / 2 - 0.4; s += Q.merloes) cx(B, M.pedra, 0.9, 1.1, 0.6, s, MH + 0.55, sgn * (MT / 2 - 0.3), 0x726c64, m);
    cx(B, M.pedra, L, 0.5, 0.5, 0, MH + 0.25, -sgn * (MT / 2 - 0.25), 0x6a645c, m);
    colisor(L, MH, MT, m);
    vttWalls.push([[+ax.toFixed(2), +az.toFixed(2)], [+bx.toFixed(2), +bz.toFixed(2)]]);
  };
  for (let i = 0; i < MURO.length; i++) {
    const [ax, az] = MURO[i], [bx, bz] = MURO[(i + 1) % MURO.length];
    const portao = i === 2 ? PORTAO_SUL : i === 11 ? PORTAO_LESTE : null;
    if (portao) {
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, gw = 3.4;
      muroSeg(ax, az, portao.x - ux * gw, portao.z - uz * gw);
      muroSeg(portao.x + ux * gw, portao.z + uz * gw, bx, bz);
      // casa do portão: duas torres quadradas, arco, grade levadiça meio erguida
      const a = Math.atan2(ux, uz) - Math.PI / 2, m = mtx(portao.x, 0, portao.z, a);
      for (const s of [-1, 1]) {
        cx(B, M.pedra, 5.5, 15, 7.5, s * 6.2, 7.5, 0, 0x7a746c, m);
        for (let k = -2; k <= 2; k++) cx(B, M.pedra, 0.9, 1.1, 0.7, s * 6.2 + k * 1.1, 15.55, 3.5, 0x726c64, m);
        colisor(5.5, 15, 7.5, m.clone().multiply(mtx(s * 6.2, 0, 0)));
        const tp = new THREE.Vector3(s * 3.8, 4.2, 4.1).applyMatrix4(m); luz(tp.x, tp.y, tp.z, 9, 3, 0xff8a3a, 16, 10); halo(tp.x, tp.y, tp.z, 0.9); lanternas.push(tp);
        // tocha
        cx(B, M.madeira, 0.1, 0.7, 0.1, s * 3.8, 3.8, 3.9, 0x2a1a10, m); cx(B, M.aceso, 0.18, 0.3, 0.18, s * 3.8, 4.3, 3.9, 0xffffff, m);
      }
      cx(B, M.pedra, 6.9, 3, MT + 2, 0, 9.5, 0, 0x6e6860, m);                    // lintel
      cx(B, M.pedra, 6.9, 1.2, MT + 2, 0, 11.6, 0, 0x6e6860, m);
      for (let k = -3; k <= 3; k++) cx(B, M.ferro, 0.12, 3.2, 0.12, k * 0.95, 7.0, 0.8, 0xffffff, m);   // grade levadiça
      for (let k = 0; k < 4; k++) cx(B, M.ferro, 6.6, 0.12, 0.12, 0, 5.6 + k * 0.9, 0.8, 0xffffff, m);
      for (const s of [-1, 1]) cx(B, M.tabuas, 0.12, 6, 3.2, s * 3.3, 3, -2.8 - 1.4 * 0 + 0, 0x4a3424, m.clone().multiply(mtx(0, 0, 0, 0)));
      // estandartes de Lomatubar (vinho com orla dourada)
      for (const s of [-1, 1]) cx(B, M.tecido, 1.6, 4.2, 0.04, s * 6.2, 10.5, 3.78, 0x5a1420, m);
    }
    else muroSeg(ax, az, bx, bz);
  }
  MURO.forEach(([x, z], k) => {
    const arruinada = k === 7;  // a torre noroeste (perto do Bairro Coral) ruiu em parte
    const h = arruinada ? 9.5 : 14.5;
    cil(B, M.pedra, 4.4, h, x, 0, z, 0xa49c90, 16);
    if (!arruinada) {
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; cx(B, M.pedra, 1.0, 1.1, 0.6, x + Math.cos(a) * 4.0, h + 0.55, z + Math.sin(a) * 4.0, 0x726c64, undefined, -a + Math.PI / 2); }
      cone(B, M.ardosia, 4.8, 6.5, x, h + 1.1, z, 0x5a5a62, 16);
      const ang = Math.atan2(z, x), tx = x - Math.cos(ang) * 4.5, tz = z - Math.sin(ang) * 4.5;
      luz(tx, 3.2, tz, 6, 1, 0xff8a3a, 12); halo(tx, 3.2, tz, 0.7);
      cx(B, M.aceso, 0.6, 0.9, 0.15, x - Math.cos(ang) * 4.35, 6.5, z - Math.sin(ang) * 4.35, 0xffffff, undefined, -ang + Math.PI / 2);   // seteira acesa
    } else { for (let i = 0; i < 9; i++) cx(B, M.pedra, 0.8 + rnd(), 0.6 + rnd() * 2, 0.8 + rnd(), x + (rnd() - 0.5) * 9, h + rnd() * 0.5, z + (rnd() - 0.5) * 9, 0x6a645c); coral(B, x - 3, h - 2, z + 3, 2.2); coral(B, x - 4.5, 0, z + 1, 2.6); }
    const g = new THREE.CylinderGeometry(4.4, 4.4, h, 12); g.translate(x, h / 2, z); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.toNonIndexed());
  });

  // ---------- canal, cais e pontes ----------
  {
    const { x0, x1, z0, z1, fundo } = CANAL, L = x1 - x0;
    const ag = new THREE.PlaneGeometry(L, z1 - z0); ag.rotateX(-Math.PI / 2); ag.translate((x0 + x1) / 2, fundo + 0.35, (z0 + z1) / 2);
    const agua = new THREE.Mesh(ag, M.agua); agua.receiveShadow = true; agua.userData.ns = 1; G.add(agua);
    cx(B, M.escuro, L, 0.2, z1 - z0, (x0 + x1) / 2, fundo - 0.4, (z0 + z1) / 2);
    for (const z of [z0, z1]) { cx(B, M.pedra, L + 0.6, -fundo + 0.6, 0.6, (x0 + x1) / 2, (fundo - 0.6) / 2 + 0.0, z + (z === z0 ? -0.3 : 0.3), 0x6a645c); cx(B, M.pedra, L + 0.6, 0.25, 0.7, (x0 + x1) / 2, 0.12, z + (z === z0 ? -0.35 : 0.35), 0x5a544c); }
    for (const x of [x0, x1]) {
      cx(B, M.pedra, 0.6, -fundo + 0.6, z1 - z0 + 1.2, x + (x === x0 ? -0.3 : 0.3), (fundo - 0.6) / 2, (z0 + z1) / 2, 0x6a645c);
      cx(B, M.escuro, 0.1, 1.3, 4, x + (x === x0 ? 0.06 : -0.06), fundo + 0.9, (z0 + z1) / 2);  // boca do bueiro
      for (let k = -4; k <= 4; k++) cx(B, M.ferro, 0.08, 1.4, 0.08, x + (x === x0 ? 0.12 : -0.12), fundo + 0.9, (z0 + z1) / 2 + k * 0.45);
    }
    // escadas de pedra até a água (lavadeiras)
    for (const [x, s] of [[-30, 1], [30, -1], [62, 1]] as number[][]) for (let k = 0; k < 5; k++) cx(B, M.pedra, 2.4, 0.22, 0.35, x, -k * 0.22 - 0.11, (s > 0 ? z0 + 0.2 : z1 - 0.2) + s * k * 0.35, 0x6a645c);
    // barcos atracados
    for (const [x, z] of [[-60, 16.5], [38, 21.5], [-12, 21.3]] as number[][]) {
      const P = peca(B, new THREE.Matrix4(), x, fundo + 0.35, z, 0);
      P.cx(M.tabuas, 4.2, 0.45, 1.3, 0, 0.1, 0, 0x4a3424); P.cx(M.tabuas, 3.8, 0.08, 1.0, 0, 0.32, 0, 0x3a2a1c);
    }
    // pontes: a de pedra da Via Real, a do Templo e a de tábuas dos Curtidores
    const ponte = (x: number, w: number, pedra: boolean) => {
      const s = new THREE.Shape([new THREE.Vector2(z0 - 1.2, -0.5), new THREE.Vector2(z1 + 1.2, -0.5), new THREE.Vector2(z1 + 1.2, 0.05), new THREE.Vector2(z0 - 1.2, 0.05)]);
      // forma no plano (x da forma = z do mundo, y) e extrusão em z; girando −90° em y a extrusão vira x
      const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(x + w / 2, 0, 0);
      por(B, pedra ? M.pedra : M.tabuas, g, pedra ? 0x7a746c : 0x5a4030);
      if (pedra) { cx(B, M.pedra, w, -fundo, 1.2, x, fundo / 2, z0 + 0.6, 0x6a645c); cx(B, M.pedra, w, -fundo, 1.2, x, fundo / 2, z1 - 0.6, 0x6a645c); }
      for (const sx of [-1, 1]) cx(B, pedra ? M.pedra : M.madeira, pedra ? 0.45 : 0.12, pedra ? 1.0 : 1.05, z1 - z0 + 2.4, x + sx * (w / 2 - 0.2), 0.55, (z0 + z1) / 2, pedra ? 0x6e6860 : 0x4a3424);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, z1 - z0 + 2.4), new THREE.MeshBasicMaterial({ visible: false })); deck.position.set(x, 0.0, (z0 + z1) / 2); deck.userData.ns = 1; G.add(deck); floors.push(deck);
      // calçamento por cima
      const pg = new THREE.PlaneGeometry(w - 0.6, z1 - z0 + 2.4); pg.rotateX(-Math.PI / 2); pg.translate(x, 0.07, (z0 + z1) / 2);
      const uv = pg.attributes.uv, p = pg.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), -p.getZ(i));
      const pm = new THREE.Mesh(pg, pedra ? M.calcada : M.piso); pm.receiveShadow = true; pm.userData.ns = 1; G.add(pm);
    };
    ponte(0, 8, true); ponte(48, 5, true); ponte(-48, 3.2, false);
  }

  // ---------- casas ----------
  const casas: { r: Ret; estilo: string }[] = [];
  const ocupado = (r: Ret) =>
    reservados.some(q => cruzaRet(r, q, 1.2)) || ruaRets.some(q => cruzaRet(r, q, -0.1)) || casas.some(c => cruzaRet(r, c.r, 0.05)) ||
    cruzaRet(r, PRACA, 0.5) || cruzaRet(r, FORTALEZA, 2) || cruzaRet(r, [CANAL.x0 - 1, CANAL.x1 + 1, CANAL.z0 - 1, CANAL.z1 + 1], 0) ||
    ![[r[0], r[2]], [r[1], r[2]], [r[0], r[3]], [r[1], r[3]]].every(([x, z]) => dentroMuro(x, z, 4.5));
  for (const rua of RUAS) {
    const R = retRua(rua), vert = rua.x0 === rua.x1;
    const a0 = vert ? R[2] : R[0], a1 = vert ? R[3] : R[1];
    for (const lado of [-1, 1]) {
      let a = a0 + 0.5;
      let n = 0;
      while (a < a1 - 4) {
        const w = entre(5, 8.5), x = vert ? rua.x0 : a + w / 2, z = vert ? a + w / 2 : rua.z0;
        const est = estiloEm(x, z), d = est === 'rica' ? entre(9, 12) : est === 'pobre' ? entre(6, 8) : entre(7.5, 10);
        // frente na borda da rua; a casa fica do lado `lado`
        const fx = vert ? rua.x0 + lado * (rua.w / 2 + 0.25) : x, fz = vert ? z : rua.z0 + lado * (rua.w / 2 + 0.25);
        const cxx = vert ? fx + lado * d / 2 : fx, czz = vert ? fz : fz + lado * d / 2;
        const r: Ret = vert ? [Math.min(fx, fx + lado * d), Math.max(fx, fx + lado * d), a, a + w] : [a, a + w, Math.min(fz, fz + lado * d), Math.max(fz, fz + lado * d)];
        // frente da casa (local +z) aponta para a rua (−lado no eixo perpendicular)
        const ry = vert ? (lado > 0 ? -Math.PI / 2 : Math.PI / 2) : (lado > 0 ? Math.PI : 0);
        if (!ocupado(r) && !(rua.beco && rnd() < 0.15)) {
          casa(cxx, czz, ry, w - 0.06, d, est);
          casas.push({ r, estilo: est });
          n++;
          a += w + (n % (3 + ((rnd() * 3) | 0)) === 0 ? entre(1.8, 2.6) : 0.02);   // às vezes um beco entre as casas
        } else a += 1.5;
      }
    }
  }

  function casa(x: number, z: number, ry: number, w: number, d: number, estilo: string) {
    const m = mtx(x, 0, z, ry), tosco = estilo === 'pobre' || estilo === 'ruina' || estilo === 'coral';
    const mm = tosco ? m.clone().multiply(mtx(0, 0, 0, (rnd() - 0.5) * 0.04)) : m;
    const ruina = estilo === 'ruina' || estilo === 'coral';
    const andares = estilo === 'rica' ? 3 : estilo === 'pobre' ? (rnd() < 0.6 ? 1 : 2) : ruina ? (rnd() < 0.5 ? 1 : 2) : 2 + (rnd() < 0.35 ? 1 : 0);
    const h0 = estilo === 'pobre' ? 2.7 : 3.1, ha = 2.7;
    const corPedra = pick([0xb8b0a4, 0xa8a094, 0xc0b6a8, 0x9c948a]);
    const corReboco = pick([0xd8ccb4, 0xc8b8a0, 0xbcb4a6, 0xc4b4a0, 0xb0a494]);
    const corMad = pick([0x2e2018, 0x3a2a1e, 0x241a14]);
    let topo = h0, frente = d / 2, prof = d;
    // térreo
    if (estilo === 'pobre') cx(B, M.tabuas, w, h0, d, 0, h0 / 2, 0, pick([0x9a8468, 0x8a7458, 0xa48c6c]), mm);
    else if (ruina) {
      // paredes quebradas (alturas irregulares) sem telhado
      const hh = () => h0 * (0.45 + rnd() * 0.9);
      cx(B, M.muro, w, hh(), 0.4, 0, 0, d / 2 - 0.2, corPedra, mm); cx(B, M.muro, w, hh(), 0.4, 0, 0, -d / 2 + 0.2, corPedra, mm);
      cx(B, M.muro, 0.4, hh(), d, -w / 2 + 0.2, 0, 0, corPedra, mm); cx(B, M.muro, 0.4, hh(), d, w / 2 - 0.2, 0, 0, corPedra, mm);
      for (let i = 0; i < 6; i++) cx(B, M.muro, 0.3 + rnd() * 0.6, 0.2 + rnd() * 0.3, 0.3 + rnd() * 0.5, (rnd() - 0.5) * w, 0.1, (rnd() - 0.5) * d, corPedra, mm);
      for (let i = 0; i < 3; i++) cx(B, M.madeira, 0.15, 0.15, d * 0.9, (rnd() - 0.5) * w * 0.8, h0 * 0.7 + rnd(), 0, 0x1e160e, mm, (rnd() - 0.5) * 0.6);
      cx(B, M.escuro, 1.1, 2.0, 0.42, 0, 1.0, d / 2 - 0.2, 0xffffff, mm);
      if (estilo === 'coral') for (let i = 0; i < 4; i++) { const p = new THREE.Vector3((rnd() - 0.5) * w, rnd() * h0 * 0.6, (rnd() < 0.5 ? -1 : 1) * (d / 2 + 0.05)).applyMatrix4(mm); coral(B, p.x, p.y, p.z, 1 + rnd() * 1.5); }
      colisor(w, 2, d, mm);
      return;
    } else cx(B, M.muro, w, h0, d, 0, h0 / 2, 0, corPedra, mm);
    // andares de cima (enxaimel com balanço na frente) ou pedra (rica)
    for (let k = 1; k < andares; k++) {
      const j = estilo === 'media' ? 0.35 * k : 0, y = h0 + (k - 1) * ha;
      if (estilo === 'rica') { cx(B, M.muro, w, ha, d, 0, y + ha / 2, 0, corPedra, mm); cx(B, M.pedra, w + 0.15, 0.2, d + 0.15, 0, y, 0, 0x6a645c, mm); }
      else if (estilo === 'pobre') cx(B, M.tabuas, w, ha, d, 0, y + ha / 2, 0, pick([0x6a5440, 0x5a4a38]), mm);
      else {
        cx(B, M.reboco, w, ha, d + j, 0, y + ha / 2, j / 2, corReboco, mm);
        const fz = (d + j) / 2 + j / 2 + 0.04;
        cx(B, M.madeira, w + 0.08, 0.2, 0.12, 0, y + 0.1, fz, corMad, mm); cx(B, M.madeira, w + 0.08, 0.16, 0.12, 0, y + ha - 0.08, fz, corMad, mm);
        const np = Math.max(2, Math.round(w / 1.15));
        for (let i = 0; i <= np; i++) cx(B, M.madeira, 0.14, ha, 0.1, -w / 2 + 0.07 + i * (w - 0.14) / np, y + ha / 2, fz, corMad, mm);
        for (const s of [-1, 1]) { cx(B, M.madeira, 0.13, ha * 1.05, 0.1, s * (w / 2 - 0.55), y + ha / 2, fz + 0.01, corMad, mm, 0); const g = new THREE.BoxGeometry(0.12, Math.hypot(ha, 0.9), 0.1); g.rotateZ(s * 0.33); g.translate(s * (w / 2 - 0.5), y + ha / 2, fz + 0.02); por(B, M.madeira, g, corMad, mm); }
        for (const s of [-1, 1]) for (let i = 0; i <= 2; i++) cx(B, M.madeira, 0.1, ha, 0.14, s * (w / 2 + 0.04), y + ha / 2, -d / 2 + 0.1 + i * (d + j - 0.2) / 2 + j / 2 - j / 2, corMad, mm);
        // mísulas do balanço
        for (const s of [-1, 0, 1]) cx(B, M.madeira, 0.14, 0.14, 0.5, s * (w / 2 - 0.3), y - 0.08, fz - 0.3, corMad, mm, 0);
        frente = fz; prof = d + j;
      }
      topo = y + ha;
    }
    // janelas e porta (fachada)
    const fzz = (k: number) => estilo === 'media' && k > 0 ? (d + 0.35 * k) / 2 + 0.35 * k / 2 + 0.05 : d / 2 + 0.03;
    for (let k = 0; k < andares; k++) {
      const y = k === 0 ? 1.5 : h0 + (k - 1) * ha + 1.4, nj = Math.max(1, Math.floor((w - (k === 0 ? 1.6 : 0.6)) / 2));
      for (let i = 0; i < nj; i++) {
        let xx = -w / 2 + (i + 0.5) * w / nj; if (k === 0 && Math.abs(xx) < 0.9) xx += xx < 0 ? -0.9 : 0.9;
        if (Math.abs(xx) > w / 2 - 0.5) continue;
        const acesa = rnd() < (estilo === 'rica' ? 0.45 : estilo === 'pobre' ? 0.22 : 0.33);
        const hw = estilo === 'rica' ? 0.75 : 0.6, hh = estilo === 'rica' ? 1.3 : 0.95;
        cx(B, acesa ? M.aceso : M.escuro, hw, hh, 0.05, xx, y, fzz(k), 0xffffff, mm);
        cx(B, estilo === 'rica' ? M.pedra : M.madeira, hw + 0.14, 0.1, 0.12, xx, y - hh / 2 - 0.05, fzz(k) + 0.02, estilo === 'rica' ? 0x6a645c : corMad, mm);
        cx(B, M.madeira, 0.04, hh, 0.06, xx, y, fzz(k) + 0.02, corMad, mm); cx(B, M.madeira, hw, 0.04, 0.06, xx, y, fzz(k) + 0.02, corMad, mm);
        if (!acesa && rnd() < 0.5) for (const s of [-1, 1]) cx(B, M.tabuas, hw / 2 + 0.05, hh + 0.05, 0.05, xx + s * (hw * 0.75 + 0.03), y, fzz(k) + 0.03, pick([0x3a2a1e, 0x2a3028, 0x3a2024]), mm);
      }
    }
    cx(B, M.tabuas, 1.05, 2.05, 0.08, 0, 1.02, d / 2 + 0.04, 0x3a2618, mm); cx(B, M.pedra, 1.4, 0.15, 0.5, 0, 0.07, d / 2 + 0.25, 0x6a645c, mm);
    if (rnd() < 0.18) { cx(B, M.madeira, 0.08, 0.08, 0.7, 0.9, 2.5, d / 2 + 0.35, corMad, mm); }   // suporte de placa
    // telhado: cumeeira paralela à rua (empena de lado) ou empena para a rua
    const hr = (estilo === 'rica' ? 0.55 : 0.75) * Math.min(w, prof) / 2 + 0.6, mt = estilo === 'rica' ? M.ardosia : estilo === 'pobre' ? M.telha : (rnd() < 0.5 ? M.ardosia : M.telha);
    const ct = mt === M.ardosia ? pick([0x5a5a62, 0x4e4e56, 0x60606a]) : pick([0x7a4a3a, 0x6a4034, 0x5a3a30]);
    const zc = (frente - d / 2) / 2;
    if (rnd() < 0.55 || estilo === 'pobre') telhado(BR, mt, prof + 0.05, w + 0.05, hr * 0.85, topo, ct, mm.clone().multiply(mtx(0, 0, zc, Math.PI / 2)), 0.35, estilo === 'pobre' ? M.tabuas : M.reboco, estilo === 'rica' ? corPedra : corReboco);
    else telhado(BR, mt, w + 0.05, prof + 0.05, hr, topo, ct, mm.clone().multiply(mtx(0, 0, zc)), 0.35, estilo === 'rica' ? M.muro : estilo === 'pobre' ? M.tabuas : M.reboco, estilo === 'rica' ? corPedra : corReboco);
    // chaminé
    if (rnd() < 0.8) {
      const px = (rnd() < 0.5 ? -1 : 1) * (w / 2 - 0.7), pz = -d / 4, hc = topo + hr + 0.4;
      cx(B, M.pedra, 0.7, hc - topo + 0.6, 0.7, px, topo - 0.3 + (hc - topo + 0.6) / 2, pz, 0x5a544c, mm);
      chamines.push(new THREE.Vector3(px, hc + 0.3, pz).applyMatrix4(mm));
    }
    colisor(w, topo, prof, mm.clone().multiply(mtx(0, 0, (frente - d / 2) / 2)));
    vttWalls.push(retCantos(x, z, ry, w, d));
  }

  // ---------- Bairro Coral: barricadas, aviso, valas ----------
  {
    const [x0, x1, z0, z1] = CORAL;
    const barr = (ax: number, az: number, bx: number, bz: number, porta?: number) => {
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, a = Math.atan2(ux, uz) - Math.PI / 2;
      for (let s = 0; s < L; s += 0.9) {
        if (porta !== undefined && Math.abs(s - porta) < 1.8) continue;
        const x = ax + ux * s, z = az + uz * s;
        if (!dentroMuro(x, z, 2) || ruaRets.some(q => dentroRet(x, z, q, -0.2) && false)) continue;
        cx(B, M.tabuas, 1.0, 1.6 + rnd() * 0.9, 0.12, 0, 0, 0, pick([0x4a3a2a, 0x3a2e22, 0x5a4632]), mtx(x, 0.9, z, a + (rnd() - 0.5) * 0.25, 1, 1, 1, (rnd() - 0.5) * 0.12));
        if (rnd() < 0.25) caixote(B, mtx(x, 0, z + 0.5, a), 0, 0, 0, 0.7);
      }
      colisor(L, 2.2, 0.6, mtx((ax + bx) / 2, 0, (az + bz) / 2, a));
      vttWalls.push([[+ax.toFixed(2), +az.toFixed(2)], [+bx.toFixed(2), +bz.toFixed(2)]]);
    };
    barr(x1, z0, x1, z1, 46);          // ao longo da Rua dos Curtidores, com um portão de tábuas (fechado)
    barr(x0, z1, x1, z1);              // ao longo da Rua das Lanternas
    // portão de quarentena (fechado) e placa
    const pz = z0 + 46;
    cx(B, M.tabuas, 0.14, 2.4, 3.4, x1, 1.2, pz, 0x3a2a1e); for (const s of [-1, 1]) cx(B, M.madeira, 0.25, 3.2, 0.25, x1, 1.6, pz + s * 1.8, 0x2a1e14);
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: signTexture('QUARENTENA', { bg: '#cfc3a6', fg: '#6a1018', sub: 'por ordem da Coroa — Praga Coral', border: '#3a2a1a' }), roughness: 0.9 }));
    placa.position.set(x1 + 0.1, 2.0, pz); placa.rotation.y = Math.PI / 2; placa.userData.ns = 1; G.add(placa);
    coral(B, x1 - 1, 0, pz - 2, 1.4);
    // valas da praga (cal e cristais), marcos de madeira
    for (let i = 0; i < 3; i++) {
      const vx = -90 + i * 4.2, vz = -26;
      cx(B, M.plain, 3.2, 0.05, 6, vx, 0.03, vz, 0xb8b4a8); cx(B, M.escuro, 2.6, 0.06, 5.2, vx, 0.04, vz);
      for (let k = 0; k < 3; k++) coral(B, vx + (rnd() - 0.5) * 2, 0, vz + (rnd() - 0.5) * 4, 1.2 + rnd());
      cx(B, M.madeira, 0.1, 1.1, 0.1, vx, 0.55, vz - 3.3, 0x2a1e14); cx(B, M.madeira, 0.5, 0.1, 0.1, vx, 0.9, vz - 3.3, 0x2a1e14);
    }
  }

  // ---------- lanternas de rua ----------
  const poste = (x: number, z: number, lado: number, vert: boolean) => {
    const a = vert ? (lado > 0 ? Math.PI / 2 : -Math.PI / 2) : (lado > 0 ? 0 : Math.PI), m = mtx(x, 0, z, a);
    cx(B, M.madeira, 0.16, 3.4, 0.16, 0, 1.7, 0, 0x2a1e14, m); cx(B, M.ferro, 0.05, 0.05, 0.7, 0, 3.25, 0.35, 0xffffff, m);
    cx(B, M.ferro, 0.26, 0.36, 0.26, 0, 2.95, 0.66, 0xffffff, m); cx(B, M.aceso, 0.18, 0.26, 0.18, 0, 2.95, 0.66, 0xffffff, m);
    const p = new THREE.Vector3(0, 2.95, 0.66).applyMatrix4(m); lanternas.push(p); halo(p.x, p.y, p.z, 0.6); luz(p.x, p.y, p.z, 40, 2, 0xffa050, 18, 7);
  };
  for (const r of RUAS) {
    if (r.beco) continue;
    const vert = r.x0 === r.x1, R = retRua(r), a0 = vert ? R[2] : R[0], a1 = vert ? R[3] : R[1];
    const passo = r.n === 'Rua das Lanternas' ? 11 : 17;
    let lado = 1;
    for (let a = a0 + 5; a < a1 - 3; a += passo) {
      const x = vert ? r.x0 + lado * (r.w / 2 + 0.3) : a, z = vert ? a : r.z0 + lado * (r.w / 2 + 0.3);
      if (!dentroMuro(x, z, 5) || (vert && z > CANAL.z0 - 2 && z < CANAL.z1 + 2) || dentroRet(x, z, PRACA, 0) || casas.some(c => dentroRet(x, z, c.r, 0.2)) || reservados.some(q => dentroRet(x, z, q, 0.4))) { lado = -lado; continue; }
      poste(x, z, -lado, vert); lado = -lado;
    }
  }

  // ---------- objetos de rua: barris, caixas, sacos, carroças, varais ----------
  const livre = (x: number, z: number, m = 0.8) => dentroMuro(x, z, 5) && !casas.some(c => dentroRet(x, z, c.r, m)) && !reservados.some(q => dentroRet(x, z, q, m)) && !dentroRet(x, z, [CANAL.x0, CANAL.x1, CANAL.z0, CANAL.z1], 1);
  const I = new THREE.Matrix4();
  // no cais: cargas
  for (let i = 0; i < 26 * Q.props; i++) {
    const x = entre(-80, 80), z = rnd() < 0.5 ? 10.4 : 27.6;
    if (!livre(x, z, 0.3) || Math.abs(x) < 5 || Math.abs(Math.abs(x) - 48) < 4) continue;
    const t = rnd(); if (t < 0.4) barril(B, I, x, z); else if (t < 0.75) caixote(B, I, x, z, 0, 0.5 + rnd() * 0.3); else sacos(B, I, x, z, 3 + ((rnd() * 3) | 0));
  }
  // junto às casas (encostado na fachada)
  casas.forEach(c => {
    if (rnd() > 0.28 * Q.props) return;
    const x = c.r[0] + rnd() * (c.r[1] - c.r[0]), z = c.r[2] + rnd() * (c.r[3] - c.r[2]);
    // ponto na borda mais próxima de uma rua
    const ex = [c.r[0] - 0.5, c.r[1] + 0.5], ez = [c.r[2] - 0.5, c.r[3] + 0.5];
    const op = [[ex[0], z], [ex[1], z], [x, ez[0]], [x, ez[1]]].filter(([px, pz]) => ruaRets.some(q => dentroRet(px, pz, q, 0)) && livre(px, pz, 0.2) || false);
    if (!op.length) return; const [px, pz] = pick(op);
    if (c.estilo === 'coral') { coral(B, px, 0, pz, 1.5); return; }
    rnd() < 0.5 ? barril(B, I, px, pz) : caixote(B, I, px, pz, 0, 0.55);
  });
  // carroças
  const carroca = (x: number, z: number, ry: number, cavalo: boolean) => {
    const m = mtx(x, 0, z, ry);
    cx(B, M.tabuas, 1.6, 0.12, 3.0, 0, 0.85, 0, 0x5a4232, m);
    for (const s of [-1, 1]) cx(B, M.tabuas, 0.08, 0.5, 3.0, s * 0.78, 1.15, 0, 0x4a3628, m);
    cx(B, M.tabuas, 1.6, 0.5, 0.08, 0, 1.15, -1.48, 0x4a3628, m);
    for (const s of [-1, 1]) { const g = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 12); g.rotateZ(Math.PI / 2); g.translate(s * 0.9, 0.55, -0.3); por(B, M.madeira, g, 0x3a2818, m); }
    for (const s of [-1, 1]) cx(B, M.madeira, 0.08, 0.08, 2.0, s * 0.45, 0.8, 2.4, 0x3a2818, m);
    for (let i = 0; i < 3; i++) sacos(B, m.clone().multiply(mtx(0, 0.92, -0.6 + i * 0.6)), (rnd() - 0.5) * 0.4, 0, 2);
    if (cavalo) animal(m.clone().multiply(mtx(0, 0, 3.6)), 'cavalo');
  };
  const animal = (m: THREE.Matrix4, tipo: 'cavalo' | 'cao' | 'galinha') => {
    const P = peca(B, m, 0, 0, 0), c = tipo === 'cavalo' ? pick([0x3a2a20, 0x5a4030, 0x2a2420]) : tipo === 'cao' ? pick([0x4a3a2a, 0x2a2622]) : pick([0x8a6a4a, 0xd8d0c0, 0x3a2a20]);
    const s = tipo === 'cavalo' ? 1 : tipo === 'cao' ? 0.38 : 0.14;
    P.cx(M.plain, 0.55 * s, 0.6 * s, 1.6 * s, 0, 1.2 * s, 0, c);
    P.cx(M.plain, 0.3 * s, 0.75 * s, 0.35 * s, 0, 1.6 * s, 0.85 * s, c, 0, -0.5);
    P.cx(M.plain, 0.26 * s, 0.28 * s, 0.6 * s, 0, 1.95 * s, 1.15 * s, c);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cx(M.plain, 0.13 * s, 0.95 * s, 0.13 * s, sx * 0.18 * s, 0.47 * s, sz * 0.62 * s, c);
    if (tipo !== 'galinha') P.cx(M.plain, 0.08 * s, 0.6 * s, 0.08 * s, 0, 1.1 * s, -0.85 * s, 0x1a1410, 0, 0.5);
  };
  carroca(6.8, 50, Math.PI, true); carroca(-7.5, 88, 0.2, false); carroca(54, -16, -0.3, true); carroca(-56, 34, 1.4, false); carroca(31, 74, 2.8, false);
  // cães e galinhas nas áreas pobres
  for (let i = 0; i < 22 * Q.props; i++) {
    const x = entre(-85, 85), z = entre(30, 92); if (!livre(x, z, 0.4)) continue;
    animal(mtx(x, 0, z, rnd() * 6), rnd() < 0.3 ? 'cao' : 'galinha');
  }
  // varais de roupa nos becos pobres
  for (let i = 0; i < 10; i++) {
    const r = pick(RUAS.filter(r => r.beco)), vert = r.x0 === r.x1, R = retRua(r), t = entre(0.15, 0.85);
    const x = vert ? r.x0 : R[0] + t * (R[1] - R[0]), z = vert ? R[2] + t * (R[3] - R[2]) : r.z0;
    if (!dentroMuro(x, z, 5) || dentroRet(x, z, CORAL, 2)) continue;
    const a = vert ? 0 : Math.PI / 2, m = mtx(x, 3.6, z, a);
    cx(B, M.plain, r.w + 0.4, 0.02, 0.02, 0, 0, 0, 0x2a2420, m);
    for (let k = -2; k <= 2; k++) if (rnd() < 0.7) cx(B, M.tecido, 0.45, 0.6 + rnd() * 0.3, 0.02, k * 0.48, -0.35, 0, pick([0x8a8270, 0x5a2a2a, 0x3a4048, 0x7a6a50]), m);
  }

  // ---------- montagem ----------
  B.build(G);
  BR.build(roofs);
  G.add(roofs);
  const cg = mergeSimples(colGeo);
  const colliders = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); colliders.userData.ns = 1; colliders.userData.noExport = 1; G.add(colliders);
  return { floors, colliders, roofs, chamines, vttWalls, casas, lanternas };
}

/** cantos de um retângulo girado (para as paredes do VTT) */
export function retCantos(x: number, z: number, ry: number, w: number, d: number): [number, number][] {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]].map(([a, b]) => [+(x + a * c + b * s).toFixed(2), +(z - a * s + b * c).toFixed(2)] as [number, number]);
}
function mergeSimples(gs: THREE.BufferGeometry[]) {
  let n = 0; gs.forEach(g => (n += g.attributes.position.count));
  const p = new Float32Array(n * 3); let o = 0;
  gs.forEach(g => { p.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}
