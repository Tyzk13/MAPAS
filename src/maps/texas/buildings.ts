// Geradores: lojas do centro (fachada falsa de faroeste ou tijolo, vitrine, toldo/varanda sobre a calçada),
// casas de madeira (telhado de duas águas, varanda com cadeira de balanço, cerca de estacas), ruas de asfalto
// com faixas, calçadas, postes de luz e de fios.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { K, halo } from '../../core/kit';
import { instance, type Xf } from '../../core/models';
import { Batch, mtx, rnd, pick, sign, TM, SIDING, STORE, bxM, gableRoof, Q, light } from './common';

export interface StoreOpts { w: number; d: number; h?: number; brick?: boolean; two?: boolean; name?: string; signCol?: [string, string]; color?: number; porch?: 'awning' | 'boardwalk' | 'none'; lit?: number; dark?: boolean }
export interface HouseOpts { w: number; d: number; color?: number; porch?: boolean; fence?: boolean; ruin?: boolean; two?: boolean; lit?: number }

export class Builder {
  B = new Batch('predios'); D = new Batch('detalhes'); W = new Batch('vidros'); C = new Batch('colisao'); R = new Batch('telhados'); F = new Batch('pisos');
  colliders: THREE.Mesh[] = []; floors: THREE.Mesh[] = []; walls: THREE.Mesh[] = [];
  roofs = new THREE.Group();
  vtt: [number, number][][] = [];
  rockers: Xf[] = []; lamps: Xf[] = []; mail: Xf[] = [];
  constructor(public G: THREE.Group) { this.roofs.name = 'telhados'; G.add(this.roofs); }

  private L(M: THREE.Matrix4, x: number, y: number, z: number) { const v = new THREE.Vector3(x, y, z).applyMatrix4(M); return v; }
  private outline(M: THREE.Matrix4, w: number, d: number) {
    const c = [[-w / 2, 0], [w / 2, 0], [w / 2, -d], [-w / 2, -d]].map(([a, b]) => { const p = this.L(M, a, 0, b); return [+p.x.toFixed(2), +p.z.toFixed(2)] as [number, number]; });
    this.vtt.push([...c, c[0]]);
  }
  private window(M: THREE.Matrix4, cx: number, sill: number, ww: number, wh: number, lit: boolean, trim: number, shutters = false) {
    const m = TM();
    bxM(this.D, m.plain, ww + 0.2, wh + 0.2, 0.06, cx, sill + wh / 2, 0.03, trim, M);
    bxM(this.W, lit ? m.lit : m.glass, ww, wh, 0.07, cx, sill + wh / 2, 0.04, 0xffffff, M);
    bxM(this.D, m.plain, 0.05, wh, 0.05, cx, sill + wh / 2, 0.09, trim, M);
    bxM(this.D, m.plain, ww, 0.05, 0.05, cx, sill + wh / 2, 0.09, trim, M);
    bxM(this.D, m.plain, ww + 0.35, 0.07, 0.14, cx, sill - 0.04, 0.08, trim, M);
    if (shutters) [-1, 1].forEach(s => bxM(this.D, m.boards, ww * 0.45, wh + 0.1, 0.04, cx + s * (ww / 2 + ww * 0.25 + 0.1), sill + wh / 2, 0.04, pick([0x2e3e34, 0x3a2a24, 0x2a3a4a, 0x5a2a24]), M));
  }

  /** loja do centro, frente para +z local em z=0 */
  store(x: number, z: number, ry: number, o: StoreOpts) {
    const m = TM(), M = mtx(x, 0, z, ry), two = o.two ?? rnd() < 0.45, h = o.h ?? (two ? 7.6 : 4.6) + rnd() * 0.6;
    const wall = o.brick ? m.brick : m.boards, col = o.color ?? (o.brick ? pick([0xd8b8a8, 0xc8a898, 0xe8c8b8, 0xb89888]) : pick(STORE));
    const front = h + 1.2 + rnd() * 1.4; // fachada falsa mais alta que o corpo
    bxM(this.B, wall, o.w, h, o.d, 0, h / 2, -o.d / 2, col, M);
    bxM(this.C, m.plain, o.w, h, o.d, 0, h / 2, -o.d / 2, 0, M);
    bxM(this.B, wall, o.w, front - h, 0.3, 0, h + (front - h) / 2, -0.15, col, M);
    // cornija e telhado de zinco quase plano
    bxM(this.D, m.plain, o.w + 0.2, 0.3, 0.45, 0, front, 0.0, 0xe0d8c8, M);
    if (rnd() < 0.5) bxM(this.D, m.plain, o.w * 0.4, 0.5, 0.25, 0, front + 0.35, -0.05, 0xe0d8c8, M);
    bxM(this.R, m.tin, o.w - 0.3, 0.08, o.d - 0.4, 0, h + 0.1, -o.d / 2 - 0.1, 0xb0a8a0, M, 0.04);
    // vitrine com rodapé, porta recuada e vidro superior (transom)
    const lit = !o.dark && rnd() < (o.lit ?? 0.5);
    const dw = 1.1, sw = Math.max(1.2, (o.w - dw - 1.4) / 2);
    [-1, 1].forEach(s => {
      const cx = s * (dw / 2 + sw / 2 + 0.25);
      bxM(this.D, m.woodDark, sw + 0.2, 0.7, 0.12, cx, 0.35, 0.06, 0x3a2e26, M);
      bxM(this.W, lit ? m.lit : m.glass, sw, 2.0, 0.06, cx, 1.75, 0.04, 0xffffff, M);
      bxM(this.D, m.woodDark, sw + 0.2, 0.12, 0.1, cx, 2.78, 0.06, 0x3a2e26, M);
      bxM(this.W, m.glass, sw, 0.5, 0.06, cx, 3.1, 0.04, 0xffffff, M);
    });
    bxM(this.D, m.woodDark, dw, 2.4, 0.1, 0, 1.2, -0.4, o.dark ? 0x2a2420 : 0x4a3a2e, M);
    bxM(this.W, lit ? m.lit : m.glass, dw * 0.6, 1.0, 0.04, 0, 1.6, -0.33, 0xffffff, M);
    if (two) for (let i = 0; i < Math.max(2, Math.round(o.w / 2.6)); i++) { const n = Math.max(2, Math.round(o.w / 2.6)), cx = -o.w / 2 + (o.w / n) * (i + 0.5); this.window(M, cx, h - 3.0, 0.95, 1.6, !o.dark && rnd() < 0.2, o.brick ? 0xe0d8c8 : 0xd8d0c0); }
    // letreiro
    if (o.name) { const s = sign(o.name, Math.min(o.w - 0.5, 7), Math.min(1.1, (front - h) + 0.6), { bg: o.signCol?.[0] || '#e8dcc0', fg: o.signCol?.[1] || '#5a2a20', border: o.signCol?.[1], font: '"Rockwell", "Georgia", serif' });
      const p = this.L(M, 0, two ? h + (front - h) / 2 : 3.75, 0.08); s.position.copy(p); s.rotation.y = ry; this.G.add(s); }
    // varanda coberta sobre a calçada (postes de madeira) ou toldo de lona
    const porch = o.porch ?? (o.brick ? 'awning' : 'boardwalk');
    if (porch === 'boardwalk') {
      const ph = 3.6, pd = 3.0;
      bxM(this.R, m.tin, o.w + 0.1, 0.07, pd + 0.3, 0, ph, pd / 2, 0xa8a098, M, 0.12);
      for (let k = 0; k <= Math.round(o.w / 3); k++) { const px = -o.w / 2 + 0.15 + (o.w - 0.3) * (k / Math.round(o.w / 3)); bxM(this.D, m.wood, 0.16, ph - 0.1, 0.16, px, ph / 2 - 0.05, pd - 0.1, 0x8a7460, M); }
      bxM(this.D, m.wood, o.w, 0.18, 0.16, 0, ph - 0.12, pd - 0.1, 0x7a6450, M);
      if (rnd() < 0.5) this.lamps.push({ ...this.L(M, 0, ph - 0.3, pd * 0.5), ry } as Xf);
    } else if (porch === 'awning') {
      const ac = pick([0x8a2a26, 0x2a4a3a, 0x2a3a5a, 0x6a5a4a]);
      bxM(this.D, m.plain, o.w - 0.3, 0.04, 1.6, 0, 3.4, 0.75, ac, M, 0.38);
      bxM(this.D, m.plain, o.w - 0.3, 0.32, 0.03, 0, 3.0, 1.5, ac, M);
    }
    this.outline(M, o.w, o.d);
  }

  /** casa de madeira, frente para +z local em z=0 (a frente fica recuada da rua) */
  house(x: number, z: number, ry: number, o: HouseOpts) {
    const m = TM(), M = mtx(x, 0, z, ry), col = o.color ?? pick(SIDING), trim = 0xece6da;
    const base = 0.6, h = o.two ? 5.6 : 2.9, rise = o.two ? 2.6 : 2.0 + rnd() * 0.6, y0 = base;
    // fundação de pilares e corpo
    bxM(this.B, m.concrete, o.w, base, o.d, 0, base / 2, -o.d / 2, 0x8a8278, M);
    bxM(this.B, m.siding, o.w, h, o.d, 0, y0 + h / 2, -o.d / 2, col, M);
    bxM(this.C, m.plain, o.w, h + base, o.d, 0, (h + base) / 2, -o.d / 2, 0, M);
    // empenas (triângulos) nas laterais e telhado de duas águas (cumeeira ao longo de z local)
    const tri = new THREE.Shape([new THREE.Vector2(-o.d / 2, 0), new THREE.Vector2(o.d / 2, 0), new THREE.Vector2(0, rise)]);
    [-1, 1].forEach(s => { const g = new THREE.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(s * o.w / 2 - (s > 0 ? 0.1 : 0), y0 + h, -o.d / 2); g.applyMatrix4(M); boxUV(g); this.B.add(m.siding, g, col); });
    const rc = o.ruin ? 0x8a8070 : pick([0x8a8a88, 0x6a6460, 0x9a8a7a, 0x5a5a60]);
    const rg = new Batch(); gableRoof(rg, m.shingle, rc, -o.w / 2, -o.d, o.w / 2, 0, y0 + h, rise, 'x', 0.45);
    rg.parts.forEach(gs => gs.forEach(g => { g.applyMatrix4(M); boxUV(g); this.R.add(m.shingle, g, rc); }));
    if (rnd() < 0.6) bxM(this.B, m.brick, 0.7, rise + 1.4, 0.7, o.w / 2 - 1.2, y0 + h + rise / 2 + 0.6, -o.d * 0.6, 0xc8a898, M);
    // janelas e porta
    const n = Math.max(2, Math.round(o.w / 2.8)), door = (rnd() * n) | 0;
    for (let i = 0; i < n; i++) {
      const cx = -o.w / 2 + (o.w / n) * (i + 0.5);
      if (i === door) { bxM(this.D, m.plain, 1.2, 2.3, 0.06, cx, y0 + 1.15, 0.03, trim, M); bxM(this.D, m.woodDark, 0.95, 2.15, 0.08, cx, y0 + 1.08, 0.05, pick([0x5a2a24, 0x2a3a2a, 0x3a3a4a, 0xd8d0c0]), M); }
      else this.window(M, cx, y0 + 0.85, 0.9, 1.45, !o.ruin && rnd() < (o.lit ?? 0.3), trim, rnd() < 0.5);
      if (o.two) this.window(M, cx, y0 + 3.6, 0.85, 1.3, !o.ruin && rnd() < 0.15, trim, false);
    }
    // varanda: piso, degraus, colunas, telhado de alpendre e cadeira de balanço
    if (o.porch ?? rnd() < 0.75) {
      const pd = 2.4;
      bxM(this.F, m.wood, o.w, 0.12, pd, 0, base - 0.06, pd / 2, 0x9a8a78, M);
      bxM(this.B, m.concrete, o.w, base - 0.12, pd, 0, (base - 0.12) / 2, pd / 2, 0x8a8278, M);
      [1, 2, 3].forEach(k => bxM(this.F, m.wood, 1.4, base * k / 4, 0.3, -o.w / 2 + (o.w / n) * (door + 0.5), base * k / 8, pd + 0.15 + (3 - k) * 0.3, 0x8a7a68, M));
      for (let k = 0; k <= 3; k++) bxM(this.D, m.plain, 0.12, 2.5, 0.12, -o.w / 2 + 0.15 + (o.w - 0.3) * k / 3, base + 1.25, pd - 0.1, trim, M);
      bxM(this.R, m.shingle, o.w + 0.3, 0.08, pd + 0.4, 0, base + 2.6, pd / 2 - 0.05, 0x7a7670, M, 0.18);
      for (let k = 0; k < 14; k++) bxM(this.D, m.plain, 0.04, 0.7, 0.04, -o.w / 2 + 0.3 + (o.w - 0.6) * k / 13, base + 0.35, pd - 0.1, trim, M);
      bxM(this.D, m.plain, o.w, 0.06, 0.08, 0, base + 0.72, pd - 0.1, trim, M);
      if (rnd() < 0.5) { const p = this.L(M, -o.w / 2 + 1.0, base, pd * 0.5); this.rockers.push({ x: p.x, y: p.y, z: p.z, ry: ry + Math.PI + (rnd() - 0.5) }); }
    }
    // cerca de estacas e caixa de correio
    if (o.fence ?? rnd() < 0.5) {
      const fz = 6.5; for (let k = 0; k < Math.round(o.w * 1.4 / 0.18); k++) { const fx = -o.w * 0.7 + k * 0.18; if (Math.abs(fx) < 0.7) continue; bxM(this.D, m.plain, 0.08, 0.9, 0.03, fx, 0.45, fz, 0xe8e2d8, M); }
      [0.3, 0.7].forEach(yy => bxM(this.D, m.plain, o.w * 1.4, 0.06, 0.03, 0, yy, fz - 0.04, 0xe0dad0, M));
    }
    const mb = this.L(M, o.w / 2 - 0.5, 0, 7.2); this.mail.push({ x: mb.x, y: 0, z: mb.z, ry });
    this.outline(M, o.w, o.d);
  }

  /** faixa de asfalto (centro, direção, comprimento, largura) com linha amarela tracejada */
  road(x: number, z: number, along: 'x' | 'z', len: number, w: number, dashes = true, y = 0.03) {
    const m = TM(), g = new THREE.PlaneGeometry(along === 'x' ? len : w, along === 'x' ? w : len); g.rotateX(-Math.PI / 2); g.translate(x, y, z); boxUV(g);
    this.F.add(m.asphalt, g, 0xffffff);
    if (dashes) for (let t = -len / 2 + 2; t < len / 2 - 2; t += 6) {
      const d = new THREE.PlaneGeometry(along === 'x' ? 3 : 0.16, along === 'x' ? 0.16 : 3); d.rotateX(-Math.PI / 2);
      d.translate(along === 'x' ? x + t : x, y + 0.006, along === 'x' ? z : z + t); this.D.add(m.plain, d, 0xc8a030);
    }
  }
  /** calçada elevada */
  walk(x: number, z: number, w: number, d: number) { this.F.box(TM().sidewalk, w, 0.16, d, x, 0.08, z, 0xb8b2a8); }

  /** postes de madeira com fios entre eles */
  poles(lines: [number, number][][]) {
    const m = TM(), P = new Batch('postes'), wires: number[] = [], top = 8.6;
    lines.forEach(line => line.forEach((p, i) => {
      const [x, z] = p, nx = line[Math.min(i + 1, line.length - 1)], pv = line[Math.max(i - 1, 0)], ry = Math.atan2(nx[0] - pv[0], nx[1] - pv[1]);
      const g = new THREE.CylinderGeometry(0.11, 0.15, top, 7); g.translate(x, top / 2, z); boxUV(g); P.add(m.wood, g, 0x7a6450);
      const arm = new THREE.BoxGeometry(2.0, 0.1, 0.1); arm.applyMatrix4(mtx(x, top - 0.4, z, ry + Math.PI / 2)); boxUV(arm); P.add(m.wood, arm, 0x6a5440);
      if (rnd() < 0.25) { const tr = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8); tr.translate(x + 0.3, top - 1.5, z); P.add(m.plain, tr, 0x6a6c6a); }
      if (!i) return;
      const a = line[i - 1];
      [-0.85, 0, 0.85].forEach(off => {
        const nxv = Math.cos(ry) * off, nzv = -Math.sin(ry) * off, sag = 0.4 + rnd() * 0.3;
        for (let k = 0; k < 10; k++) {
          const t0 = k / 10, t1 = (k + 1) / 10, ax = a[0] + (x - a[0]) * t0 + nxv, az = a[1] + (z - a[1]) * t0 + nzv, bx = a[0] + (x - a[0]) * t1 + nxv, bz = a[1] + (z - a[1]) * t1 + nzv;
          wires.push(ax, top - 0.45 - sag * 4 * t0 * (1 - t0), az, bx, top - 0.45 - sag * 4 * t1 * (1 - t1), bz);
        }
      });
    }));
    P.build(this.G);
    if (Q.wires) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x141414, transparent: true, opacity: 0.75 })); l.userData.noExport = 1; this.G.add(l); }
  }

  /** postes de iluminação de rua (braço com luminária) */
  streetLights(pts: [number, number, number][], prio = 3) {
    const m = TM();
    pts.forEach(([x, z, ry], i) => {
      const M = mtx(x, 0, z, ry);
      bxM(this.D, m.iron, 0.14, 6.5, 0.14, 0, 3.25, 0, 0x4a4a48, M);
      bxM(this.D, m.iron, 0.08, 0.08, 2.2, 0, 6.4, 1.05, 0x4a4a48, M);
      bxM(this.D, m.iron, 0.36, 0.14, 0.7, 0, 6.35, 2.1, 0x3a3a38, M);
      const p = new THREE.Vector3(0, 6.2, 2.1).applyMatrix4(M);
      halo(p.x, p.y, p.z, 1.6); light(p.x, p.y - 0.2, p.z, 10, prio + (i % 3 === 0 ? 1 : 0), 0xffc890, { vtt: 9 });
    });
  }

  async finish() {
    this.walls = this.B.build(this.G);
    this.colliders = this.C.build(this.G, { shadow: false });
    this.colliders.forEach(c => { c.material = new THREE.MeshBasicMaterial({ visible: false }); c.userData.noExport = 1; });
    this.D.build(this.G, { shadow: Q.lights > 8 });
    this.W.build(this.G, { shadow: false });
    this.R.build(this.roofs);
    this.floors = this.F.build(this.G, { shadow: false });
    K.M.glass.push(TM().lit);
    await instance('Rockingchair_01', this.rockers, this.G).catch(() => {});
    await instance('hanging_industrial_lamp', this.lamps.map(l => ({ ...l, y: l.y - 1.0, s: 0.7 })), this.G).catch(() => {});
    this.lamps.forEach(l => halo(l.x, l.y - 0.85, l.z, 0.7));
    // caixas de correio (poste + caixa arredondada)
    const mbB = new Batch('correio');
    this.mail.forEach(t => { bxM(mbB, TM().wood, 0.08, 1.1, 0.08, 0, 0.55, 0, 0x6a5a48, mtx(t.x, 0, t.z, t.ry)); const g = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10, 1, false, 0, Math.PI); g.rotateX(Math.PI / 2); g.translate(0, 1.15, 0); g.applyMatrix4(mtx(t.x, 0, t.z, t.ry)); mbB.add(TM().paint, g, pick([0x5a5a5a, 0x2a3a5a, 0x8a2a24, 0x2a2a2a])); bxM(mbB, TM().paint, 0.28, 0.14, 0.5, 0, 1.1, 0, pick([0x5a5a5a, 0x2a3a5a]), mtx(t.x, 0, t.z, t.ry)); });
    mbB.build(this.G, { shadow: false });
  }
}
