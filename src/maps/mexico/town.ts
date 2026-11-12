// Núcleo urbano: ruas de paralelepípedo, calçadas, quadras de casas pintadas (térreas e sobrados) com
// janelas gradeadas, portas, toldos de telha, caixas-d'água no teto, placas pintadas, postes de luz e fios.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { instance, type Xf } from '../../core/models';
import { K, halo } from '../../core/kit';
import {
  Batch, MAT, mtx, rnd, pick, reseed, sign, FACADE, BASE, GRID, STREET, WALKW, CURB, BLOCK, BLK, TOWN, Q,
} from './common';

/** tetos planos: impermeabilizante vermelho, branco, cimento */
const ROOFC = [0x9a4a36, 0xa85a40, 0x8a3e30, 0xc8c2b8, 0x9a958c, 0x8a8580, 0xa05a44];

export interface Facing { x: number; z: number; ry: number }
/** Uma casa (frente para +z local) colocada em (x,z) com rotação ry. */
export interface HouseOpts {
  w: number; d: number; h?: number; color?: number; base?: number; two?: boolean;
  door?: 'wood' | 'shutter' | 'none'; tejaroz?: boolean; sign?: string; signColor?: [string, string];
  tinaco?: boolean; lit?: number; ruin?: boolean; mat?: THREE.Material;
}

export class Town {
  B = new Batch('casas');           // fachadas, tetos, molduras
  D = new Batch('detalhes');        // portas, grades, caixas-d'água (sem sombra própria em baixa)
  W = new Batch('vidros');          // janelas
  C = new Batch('colisao');         // caixas simples para colidir ao caminhar (barato no celular)
  colliders: THREE.Mesh[] = [];
  walls: THREE.Mesh[] = [];
  floors: THREE.Object3D[] = [];
  shutters: Xf[] = [];
  tanks: Xf[] = [];
  wallLamps: { x: number; y: number; z: number; ry: number }[] = [];
  signs: THREE.Mesh[] = [];
  vtt: [number, number][][] = [];
  constructor(public G: THREE.Group) {}

  /** caixa no referencial da casa (m) com UV de mundo */
  private bx(b: Batch, mat: THREE.Material, w: number, h: number, d: number, lx: number, ly: number, lz: number, col: number | THREE.Color, M: THREE.Matrix4, rx = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx);
    g.translate(lx, ly, lz); g.applyMatrix4(M); boxUV(g);
    b.add(mat, g, col);
  }

  house(x: number, z: number, ry: number, o: HouseOpts) {
    const m = MAT(), M = mtx(x, 0, z, ry);
    const h = o.h ?? (o.two ? 6.4 + rnd() * 0.6 : 3.3 + rnd() * 0.7), col = o.color ?? pick(FACADE), base = o.base ?? pick(BASE);
    const wall = o.mat || (o.ruin ? m.worn : m.plaster);
    // corpo maciço (parede da rua até o fundo)
    this.bx(this.B, wall, o.w, h, o.d, 0, h / 2, -o.d / 2, col, M);
    this.bx(this.C, MAT().plain, o.w, h, o.d, 0, h / 2, -o.d / 2, 0, M);
    // rodapé pintado (guardapolvo) e cornija com platibanda
    this.bx(this.B, wall, o.w + 0.02, 0.85 + rnd() * 0.25, 0.05, 0, 0.45, 0.02, base, M);
    this.bx(this.B, m.stone, o.w + 0.12, 0.22, 0.32, 0, h + 0.02, -0.1, 0xd8d0c0, M);
    this.bx(this.B, m.roof, o.w - 0.3, 0.05, o.d - 0.3, 0, h + 0.01, -o.d / 2, pick(ROOFC), M);
    if (o.two) this.bx(this.B, m.stone, o.w + 0.06, 0.14, 0.14, 0, 3.2, 0.03, 0xd8d0c0, M);
    // vãos ao longo da fachada
    const bays = Math.max(1, Math.round(o.w / 2.6)), bw = o.w / bays, doorBay = o.door === 'none' ? -1 : (rnd() * bays) | 0;
    const floors = o.two ? [0, 3.2] : [0];
    floors.forEach((fy, fl) => {
      for (let i = 0; i < bays; i++) {
        const cx = -o.w / 2 + bw * (i + 0.5);
        if (fl === 0 && i === doorBay) {
          if (o.door === 'shutter') { this.shutters.push(this.local(M, cx, 0, 0.06)); this.bx(this.B, m.stone, 2.6, 0.18, 0.12, cx, 2.62, 0.05, 0xcfc6b2, M); }
          else {
            this.bx(this.B, m.stone, 1.45, 2.5, 0.06, cx, 1.25, 0.03, 0xd6cdb8, M);
            this.bx(this.D, m.woodDark, 1.1, 2.25, 0.1, cx, 1.125, 0.05, pick([0x6a4a34, 0x3e5a52, 0x7a3a2a, 0x5a4a3a]), M);
            if (rnd() < 0.3) this.wallLamps.push({ ...this.local(M, cx + 1.0, 2.4, 0.18), ry: ry } as any);
          }
          continue;
        }
        if (o.ruin && rnd() < 0.3) continue;
        const ww = Math.min(1.1, bw * 0.55), wh = fl ? 1.6 : 1.35, sill = fy + (fl ? 0.55 : 0.95);
        this.bx(this.B, m.stone, ww + 0.26, wh + 0.26, 0.05, cx, sill + wh / 2, 0.025, 0xd8cfbc, M);
        const lit = !o.ruin && rnd() < (o.lit ?? 0.28);
        this.bx(this.W, lit ? m.lit : m.glass, ww, wh, 0.06, cx, sill + wh / 2, 0.035, 0xffffff, M);
        // grade de ferro (rejas)
        const nb = Math.round(ww / 0.14);
        for (let k = 1; k < nb; k++) this.bx(this.D, m.iron, 0.022, wh, 0.022, cx - ww / 2 + (ww / nb) * k, sill + wh / 2, 0.11, 0x222222, M);
        this.bx(this.D, m.iron, ww, 0.025, 0.025, cx, sill + wh * 0.66, 0.11, 0x222222, M);
        if (fl) { // sacada
          this.bx(this.B, m.stone, ww + 0.6, 0.1, 0.55, cx, fy + 0.5, 0.27, 0xcfc6b2, M);
          for (let k = 0; k <= 8; k++) this.bx(this.D, m.iron, 0.02, 0.9, 0.02, cx - (ww + 0.5) / 2 + ((ww + 0.5) / 8) * k, fy + 1.0, 0.5, 0x222222, M);
          this.bx(this.D, m.iron, ww + 0.55, 0.03, 0.03, cx, fy + 1.45, 0.5, 0x222222, M);
        }
      }
    });
    // toldo de telha sobre a porta/janelas (tejaroz) com mãos-francesas de madeira
    if (o.tejaroz) {
      const tw = o.w - 0.2;
      this.bx(this.B, m.tile, tw, 0.07, 1.05, 0, 2.85, 0.46, 0xc8b4a4, M, 0.32);
      for (let k = 0; k <= Math.floor(tw / 1.8); k++) this.bx(this.D, m.woodDark, 0.09, 0.09, 0.95, -tw / 2 + 0.1 + k * (tw - 0.2) / Math.max(1, Math.floor(tw / 1.8)), 2.78, 0.45, 0x5a4232, M, 0.32);
    }
    // caixa-d'água preta e às vezes botijão no teto
    if (o.tinaco ?? rnd() < 0.55) { const p = this.local(M, (rnd() - 0.5) * (o.w - 2), h + 0.05, -o.d * (0.3 + rnd() * 0.4)); this.tanks.push({ ...p, ry: rnd() * 6 }); }
    if (o.sign) {
      const s = sign(o.sign, Math.min(o.w - 0.4, 4.6), 0.75, { bg: o.signColor?.[0], fg: o.signColor?.[1], border: o.signColor?.[1] });
      const p = this.local(M, 0, o.two ? 2.85 : Math.min(h - 0.45, 2.75 + (o.tejaroz ? 0.45 : 0)), 0.06);
      if (o.tejaroz && !o.two) p.y = h - 0.42;
      s.position.set(p.x, p.y, p.z); s.rotation.y = ry; this.G.add(s); this.signs.push(s);
    }
    // contorno para a mesa virtual (linha de visão)
    const c = [[-o.w / 2, 0], [o.w / 2, 0], [o.w / 2, -o.d], [-o.w / 2, -o.d]].map(([a, b]) => { const p = this.local(M, a, 0, b); return [+p.x.toFixed(2), +p.z.toFixed(2)] as [number, number]; });
    this.vtt.push([...c, c[0]]);
  }
  local(M: THREE.Matrix4, x: number, y: number, z: number) { const v = new THREE.Vector3(x, y, z).applyMatrix4(M); return { x: v.x, y: v.y, z: v.z }; }

  /** fileira de casas ao longo de um lado de quadra (de a até b, na linha `edge`), frente para fora */
  row(side: 'N' | 'S' | 'E' | 'W', edge: number, a: number, b: number, depth: number, opts: (i: number) => Partial<HouseOpts> = () => ({})) {
    let t = a, i = 0;
    while (b - t > 3.5) {
      let w = 5 + rnd() * 4; if (b - t - w < 4.5) w = b - t;
      const mid = t + w / 2, d = depth - rnd() * 1.5;
      const o: HouseOpts = { w, d, two: rnd() < 0.22, tejaroz: rnd() < 0.3, ...opts(i) };
      if (side === 'S') this.house(mid, edge, 0, o);
      else if (side === 'N') this.house(-mid, edge, Math.PI, o);    // a..b medidos em -x
      else if (side === 'E') this.house(edge, -mid, Math.PI / 2, o); // a..b medidos em -z
      else this.house(edge, mid, -Math.PI / 2, o);
      t += w; i++;
    }
  }

  /** quadra comum: casas nos quatro lados, quintal no meio. skip = lados a não construir */
  block(cx: number, cz: number, skip: string[] = [], depth = 9) {
    const e = BLOCK / 2 - WALKW;
    if (!skip.includes('S')) this.row('S', cz + e, cx - e, cx + e, depth);
    if (!skip.includes('N')) this.row('N', cz - e, -cx - e, -cx + e, depth);
    const z0 = cz - e + (skip.includes('N') ? 0 : depth), z1 = cz + e - (skip.includes('S') ? 0 : depth);
    if (!skip.includes('E')) this.row('E', cx + e, -z1, -z0, depth);
    if (!skip.includes('W')) this.row('W', cx - e, z0, z1, depth);
  }

  /** ruas, calçadas, postes e fios */
  streets(skipWalk: (cx: number, cz: number) => boolean) {
    const m = MAT(), S = new Batch('ruas');
    const H = STREET / 2 + WALKW;      // meia-largura entre quadras (rua + 0 calçada; calçadas pertencem às quadras)
    void H;
    // paralelepípedo nas ruas internas (±19), terra nas externas (±57; feitas pelo terreno)
    const plane = (w: number, d: number, x: number, z: number) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(x, 0.025, z); boxUV(g); S.add(m.cobble, g, 0xffffff); };
    [-19, 19].forEach(c => {
      plane(TOWN * 2, STREET, 0, c);                                   // rua leste-oeste inteira
      [[-TOWN, -23], [-15, 15], [23, TOWN]].forEach(([a, b]) => plane(STREET, b - a, c, (a + b) / 2)); // norte-sul entre cruzamentos
    });
    // calçadas (anel em volta de cada quadra) e meio-fio
    BLK.forEach(cx => BLK.forEach(cz => {
      if (skipWalk(cx, cz)) return;
      const e = BLOCK / 2, w = WALKW;
      S.box(m.sidewalk, BLOCK, CURB, w, cx, CURB / 2, cz + e - w / 2, 0xb8b0a4);
      S.box(m.sidewalk, BLOCK, CURB, w, cx, CURB / 2, cz - e + w / 2, 0xb8b0a4);
      S.box(m.sidewalk, w, CURB, BLOCK - 2 * w, cx + e - w / 2, CURB / 2, cz, 0xb8b0a4);
      S.box(m.sidewalk, w, CURB, BLOCK - 2 * w, cx - e + w / 2, CURB / 2, cz, 0xb8b0a4);
      // pintura amarela gasta no meio-fio das esquinas
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        S.box(m.plain, 2.2, 0.03, 0.12, cx + sx * (e - 1.1), CURB + 0.005, cz + sz * (e - 0.06), 0xb89a3a);
        S.box(m.plain, 0.12, 0.03, 2.2, cx + sx * (e - 0.06), CURB + 0.005, cz + sz * (e - 1.1), 0xb89a3a);
      });
    }));
    const meshes = S.build(this.G, { shadow: false });
    meshes.forEach(x => { if (x.material !== m.cobble) this.floors.push(x); });
  }

  /** postes de madeira com cruzeta e fios caídos entre eles (linhas: baratas no celular) */
  poles(lines: [number, number][][]) {
    const m = MAT(), P = new Batch('postes'), wires: number[] = [];
    const top = 8.2;
    lines.forEach(line => {
      const pts = line.map(([x, z]) => new THREE.Vector3(x, 0, z));
      pts.forEach((p, i) => {
        const dir = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize(), ry = Math.atan2(dir.x, dir.z);
        const lean = (rnd() - 0.5) * 0.04;
        const g = new THREE.CylinderGeometry(0.11, 0.15, top, 7); g.translate(0, top / 2, 0); g.applyMatrix4(mtx(p.x, 0, p.z, 0, 1, 1, 1, lean, lean)); boxUV(g); P.add(m.wood, g, 0x8a7460);
        const arm = new THREE.BoxGeometry(1.8, 0.1, 0.1); arm.translate(0, top - 0.4, 0); arm.applyMatrix4(mtx(p.x, 0, p.z, ry + Math.PI / 2)); boxUV(arm); P.add(m.wood, arm, 0x7a6450);
        if (rnd() < 0.3) { const tr = new THREE.CylinderGeometry(0.28, 0.28, 0.75, 8); tr.translate(0.32, top - 1.4, 0); tr.applyMatrix4(mtx(p.x, 0, p.z, ry)); P.add(m.plain, tr, 0x6a6c6a); }
        if (i === 0) return;
        const a = pts[i - 1], b = p;
        [-0.8, 0, 0.8].forEach(off => {
          const n = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)).multiplyScalar(off), seg = 10, sag = 0.35 + rnd() * 0.25;
          for (let k = 0; k < seg; k++) {
            const t0 = k / seg, t1 = (k + 1) / seg;
            const q0 = a.clone().lerp(b, t0).add(n), q1 = a.clone().lerp(b, t1).add(n);
            wires.push(q0.x, top - 0.45 - sag * 4 * t0 * (1 - t0), q0.z, q1.x, top - 0.45 - sag * 4 * t1 * (1 - t1), q1.z);
          }
        });
      });
    });
    P.build(this.G);
    if (Q.wires) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
      const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x141414, transparent: true, opacity: 0.75 })); l.userData.noExport = 1; this.G.add(l);
    }
  }

  /** junta tudo e coloca os modelos repetidos */
  async finish() {
    this.walls = this.B.build(this.G);
    this.colliders = this.C.build(this.G, { shadow: false });
    this.colliders.forEach(c => { c.material = new THREE.MeshBasicMaterial({ visible: false }); c.userData.noExport = 1; });
    this.D.build(this.G, { shadow: K.M && Q.lights > 8 });
    this.W.build(this.G, { shadow: false });
    // vidros acesos seguem o clima (acendem à noite)
    K.M.glass.push(MAT().lit);
    const tank = new THREE.CylinderGeometry(0.55, 0.5, 1.1, 12); tank.translate(0, 0.55, 0);
    const tm = new THREE.InstancedMesh(tank, new THREE.MeshStandardMaterial({ color: 0x18191a, roughness: 0.55, envMapIntensity: 0.8 }), this.tanks.length), o = new THREE.Object3D();
    this.tanks.forEach((t, i) => { o.position.set(t.x, t.y, t.z); o.rotation.y = t.ry || 0; o.updateMatrix(); tm.setMatrixAt(i, o.matrix); });
    tm.castShadow = tm.receiveShadow = true; tm.computeBoundingSphere(); this.G.add(tm);
    await instance('rollershutter_door', this.shutters.map(s => ({ ...s, y: 0, s: 0.84 })), this.G).catch(() => {});
    // lanternas de parede (algumas com luz de verdade, o resto só brilho)
    await instance('street_lamp_02', this.wallLamps.map(l => ({ x: l.x, y: l.y - 0.9, z: l.z, ry: l.ry + Math.PI })), this.G).catch(() => {});
    this.wallLamps.forEach(l => halo(l.x, l.y - 0.35, l.z, 0.9));
  }
}

/** Faz uma rede de postes ao longo das ruas internas e externas. */
export function poleLines(): [number, number][][] {
  const L: [number, number][][] = [];
  const along = (fixed: number, a: number, b: number, axis: 'x' | 'z', off: number) => {
    const out: [number, number][] = []; for (let t = a; t <= b + 0.1; t += 19) out.push(axis === 'x' ? [t, fixed + off] : [fixed + off, t]); return out;
  };
  GRID.forEach(c => { L.push(along(c, -47.5, 47.5, 'x', STREET / 2 - 0.4)); L.push(along(c, -47.5, 47.5, 'z', -(STREET / 2 - 0.4))); });
  void reseed;
  return L;
}
