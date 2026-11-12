// Lugares marcantes: praça com coreto, paróquia (com interior), cantina (com interior), mercado municipal,
// portal de lojas, panteão (cemitério) com velas e cempasúchil, fazenda abandonada, caixa-d'água e ponte.
import * as THREE from 'three';
import { boxUV } from '../../core/pbr';
import { lod } from './common';
import { place, instance, instanceVariants, type Xf } from '../../core/models';
import { halo } from '../../core/kit';
import { wallGeo, roundArch, circle, type Hole } from '../igreja/common';
import { Town } from './town';
import { groundH, exported } from './nature';
import {
  Batch, MAT, mtx, rnd, pick, reseed, sign, signTexture, CURB, PLAZA, KIOSCO, CHURCH, ATRIO, CANTINA, MARKET, PORTAL,
  PANTEON, HACIENDA, TOWER_W, ARROYO, ROAD_S, Q,
} from './common';

/** Luz pedida pelo mapa; só as de maior prioridade viram PointLight (limite pela qualidade). */
export interface LightReq { x: number; y: number; z: number; n: number; color: number; prio: number; flick?: number; dist?: number; vtt?: number }
export const LREQ: LightReq[] = [];
const light = (x: number, y: number, z: number, n: number, prio: number, color = 0xffa860, o: Partial<LightReq> = {}) => LREQ.push({ x, y, z, n, prio, color, ...o });

export interface Landmarks { solids: THREE.Object3D[]; floors: THREE.Object3D[]; roofs: THREE.Object3D; vttWalls: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[]; doors: THREE.Object3D[]; candles: THREE.Vector3[] }

/** parede (wallGeo) posicionada: (x,z) = início da face, ry = rotação; vãos em coordenadas da parede */
function wall(B: Batch, mat: THREE.Material, w: number, h: number, d: number, holes: Hole[], x: number, y: number, z: number, ry: number, col: number, top?: THREE.Vector2[]) {
  const g = wallGeo(w, h, d, holes, top);
  g.applyMatrix4(mtx(x, y, z, ry)); boxUV(g); B.add(mat, g, col);
}
const rect = (w: number, h: number) => [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)];

export async function buildLandmarks(G: THREE.Group, T: Town): Promise<Landmarks> {
  reseed(77);
  const m = MAT();
  const B = new Batch('marcos');            // paredes e estruturas (colidem)
  const D = new Batch('marcos-detalhes');   // detalhes sem colisão
  const F = new Batch('pisos');             // pisos onde se pisa
  const R = new Batch('telhados');          // tetos/telhados (camada "Telhado")
  const roofs = new THREE.Group(); roofs.name = 'telhados'; G.add(roofs);
  const vttWalls: [number, number][][] = [], portals: Landmarks['portals'] = [], doors: THREE.Object3D[] = [];
  const candles: THREE.Vector3[] = [];
  const P: Promise<unknown>[] = [];
  const later = (p: Promise<unknown>) => P.push(p.catch(() => {}));

  // =====================================================================================
  // PRAÇA (zócalo) com coreto, jardineiras, bancos, postes e papel picado
  // =====================================================================================
  {
    const E = PLAZA;
    F.box(m.sidewalk, E * 2, CURB, E * 2, 0, CURB / 2, 0, 0xb8b0a4);
    // piso de lajotas: faixas em cruz e diagonais, o resto vira jardim
    const tiles = new THREE.PlaneGeometry(E * 2 - 0.3, E * 2 - 0.3); tiles.rotateX(-Math.PI / 2); tiles.translate(0, CURB + 0.004, 0); boxUV(tiles); F.add(m.terracotta, tiles);
    // jardineiras (4 quadrantes em L), mureta de pedra e terra
    const beds: [number, number, number, number][] = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      beds.push([sx * 9, sz * 3.6, 9.5, 2.6], [sx * 3.6 + sx * 0.0, sz * 9.6, 2.6, 8.6]);
      beds.push([sx * 10.4, sz * 10.4, 5.8, 5.8]);
    });
    beds.forEach(([x, z, w, d]) => {
      B.box(m.stone, w, 0.45, d, x, CURB + 0.225, z, 0xcfc4b0);
      D.box(m.plain, w - 0.2, 0.02, d - 0.2, x, CURB + 0.455, z, 0x4a3a2a);
    });
    // árvores da praça (laurel da Índia e jacarandá) e plantas
    const tr: Xf[] = [[10.4, 10.4], [-10.4, 10.4], [10.4, -10.4], [-10.4, -10.4]].map(([x, z]) => ({ x, y: CURB + 0.45, z, ry: rnd() * 6, s: 1.05 }));
    later(instance(lod('island_tree_01'), tr.slice(0, 2).map(t => ({ ...t, s: 0.42 })), G, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).then(ms => ms.forEach(x => (x.userData.canopy = 1))));
    later(instance(lod('island_tree_02'), tr.slice(2).map(t => ({ ...t, s: 0.5 })), G, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).then(ms => ms.forEach(x => (x.userData.canopy = 1))));
    const shr: Xf[] = []; beds.slice(0, 8).forEach(([x, z, w, d], i) => { for (let k = 0; k < (Q.bushes >= 1 ? 3 : 1); k++) shr.push({ x: x + (rnd() - 0.5) * (w - 1), y: CURB + 0.45, z: z + (rnd() - 0.5) * (d - 1), ry: rnd() * 6, s: 0.6 + rnd() * 0.3 }); void i; });
    later(instance('shrub_02', shr, G, { wind: { amp: 0.04, freq: 1.3, flutter: 0.01 } }));
    if (exported.place && exported.agave) exported.place(exported.agave, beds.slice(0, 8).map(([x, z]) => ({ x, y: CURB + 0.45, z, ry: rnd() * 6, s: 0.8 })), false);
    // bancos voltados para o coreto
    const benches: Xf[] = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      benches.push({ x: sx * 6.2, y: CURB, z: sz * 2.2, ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }, { x: sx * 2.2, y: CURB, z: sz * 6.2, ry: sz > 0 ? Math.PI : 0 });
    });
    later(instance('painted_wooden_bench', benches.map(b => ({ ...b, s: 1.3 })), G));
    // postes de luz da praça
    const lamps: Xf[] = [[13.6, 13.6], [-13.6, 13.6], [13.6, -13.6], [-13.6, -13.6], [13.6, 0], [-13.6, 0], [0, 13.6], [0, -13.6]].map(([x, z]) => ({ x, y: CURB, z, ry: Math.atan2(x, z) }));
    later(instance('street_lamp_01', lamps, G));
    lamps.forEach((l, i) => { halo(l.x, 3.7, l.z, 1.2); light(l.x, 3.55, l.z, 9, i < 4 ? 6 : 4, 0xffb070, { vtt: 8 }); });

    // ---------- coreto (kiosco) octogonal ----------
    const KR = KIOSCO.r, KH = KIOSCO.h;
    const plat = new THREE.CylinderGeometry(KR, KR + 0.15, KH, 8); plat.translate(0, CURB + KH / 2, 0); boxUV(plat); B.add(m.stone, plat, 0xd2c6b0);
    const top = new THREE.CylinderGeometry(KR + 0.2, KR + 0.2, 0.12, 8); top.translate(0, CURB + KH + 0.06, 0); boxUV(top); F.add(m.terracotta, top, 0xd0b8a0);
    for (let s = 0; s < 4; s++) F.box(m.stone, 2.2, (s + 1) * KH / 4, 0.38, 0, CURB + (s + 1) * KH / 8, KR + 1.55 - s * 0.38, 0xd2c6b0);
    const colH = 3.3, cy = CURB + KH + 0.12;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * (KR - 0.25), z = Math.sin(a) * (KR - 0.25);
      const c = new THREE.CylinderGeometry(0.08, 0.1, colH, 8); c.translate(x, cy + colH / 2, z); D.add(m.iron, c, 0x2e3a34);
      // grade entre as colunas (menos na escada, ao sul)
      const a2 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8, x2 = Math.cos(a2) * (KR - 0.25), z2 = Math.sin(a2) * (KR - 0.25);
      const mid = (a + a2) / 2; if (Math.abs(Math.sin(mid) - 1) < 0.05) continue;
      const len = Math.hypot(x2 - x, z2 - z), ry = Math.atan2(x2 - x, z2 - z) + Math.PI / 2;
      [0.25, 0.95].forEach(h => { const r = new THREE.BoxGeometry(len, 0.04, 0.04); r.applyMatrix4(mtx((x + x2) / 2, cy + h, (z + z2) / 2, ry)); D.add(m.iron, r, 0x2e3a34); });
      for (let k = 1; k < 10; k++) { const t = k / 10, b = new THREE.BoxGeometry(0.02, 0.7, 0.02); b.translate(x + (x2 - x) * t, cy + 0.6, z + (z2 - z) * t); D.add(m.iron, b, 0x2e3a34); }
    }
    // cobertura: friso + telhado octogonal de telha + lanternim
    const fr = new THREE.CylinderGeometry(KR + 0.1, KR + 0.1, 0.45, 8, 1, true); fr.translate(0, cy + colH + 0.22, 0); boxUV(fr); R.add(m.plaster, fr, 0xe5dccb);
    const rf = new THREE.ConeGeometry(KR + 0.75, 2.0, 8); rf.translate(0, cy + colH + 1.45, 0); boxUV(rf); R.add(m.tile, rf, 0xb8a090);
    const ln = new THREE.CylinderGeometry(0.5, 0.55, 0.7, 8); ln.translate(0, cy + colH + 2.6, 0); R.add(m.plaster, ln, 0xe5dccb);
    const lc = new THREE.ConeGeometry(0.75, 0.7, 8); lc.translate(0, cy + colH + 3.3, 0); R.add(m.tile, lc, 0xb8a090);
    const ceil = new THREE.CircleGeometry(KR + 0.1, 8); ceil.rotateX(Math.PI / 2); ceil.translate(0, cy + colH + 0.02, 0); D.add(m.woodDark, ceil, 0x6a5040);
    light(0, cy + colH - 0.4, 0, 12, 9, 0xffb070, { vtt: 7 }); halo(0, cy + colH - 0.3, 0, 1.4);
    later(place('lantern_chandelier_01', 0, cy + colH - 0.05, 0, 0, 1, G));

    // ---------- papel picado (bandeirinhas recortadas) ----------
    const flags: { p: THREE.Vector3; ry: number }[] = [];
    const strand = (a: THREE.Vector3, b: THREE.Vector3, sag: number, wire: number[]) => {
      const n = Math.max(6, Math.round(a.distanceTo(b) / 0.55 * Q.papel)), ry = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
      for (let i = 0; i <= 16; i++) { const t0 = i / 16, t1 = (i + 1) / 16; if (i === 16) break; const p0 = a.clone().lerp(b, t0), p1 = a.clone().lerp(b, t1); p0.y -= sag * 4 * t0 * (1 - t0); p1.y -= sag * 4 * t1 * (1 - t1); wire.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); }
      for (let i = 1; i < n; i++) { const t = i / n, p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t) + 0.22; flags.push({ p, ry }); }
    };
    const wire: number[] = [], Ht = cy + colH + 0.3;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const s = new THREE.Vector3(Math.cos(a) * (KR + 0.3), Ht, Math.sin(a) * (KR + 0.3)); const e = new THREE.Vector3(Math.cos(a) * 19, 3.7, Math.sin(a) * 19); strand(s, e, 0.6, wire); }
    // sobre as ruas em volta da praça
    [-1, 1].forEach(sg => { for (let t = -12; t <= 12; t += 8) { strand(new THREE.Vector3(t, 4.4, sg * 15.2), new THREE.Vector3(t, 4.4, sg * 23.2), 0.4, wire); strand(new THREE.Vector3(sg * 15.2, 4.4, t), new THREE.Vector3(sg * 23.2, 4.4, t), 0.4, wire); } });
    const fg = new THREE.PlaneGeometry(0.34, 0.42);
    const fm = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8, alphaTest: 0.5, map: papelTex(), envMapIntensity: 0.4 });
    const fi = new THREE.InstancedMesh(fg, fm, flags.length), o = new THREE.Object3D(), C = [0xd23a6a, 0xf0a020, 0x2a9ad0, 0x7ac040, 0xa040c0, 0xe85a2a, 0xf2f2f2], col = new THREE.Color();
    flags.forEach((f, i) => { o.position.copy(f.p); o.rotation.set((rnd() - 0.5) * 0.25, f.ry, (rnd() - 0.5) * 0.1); o.updateMatrix(); fi.setMatrixAt(i, o.matrix); fi.setColorAt(i, col.setHex(C[i % C.length])); });
    fi.castShadow = true; fi.userData.ns = 1; fi.userData.flags = 1; fi.computeBoundingSphere(); G.add(fi);
    const wl = new THREE.BufferGeometry(); wl.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
    G.add(Object.assign(new THREE.LineSegments(wl, new THREE.LineBasicMaterial({ color: 0x222222 })), { userData: { noExport: 1 } }));
  }

  // =====================================================================================
  // PARÓQUIA de San Judas Tadeo (fachada barroca simples, duas torres, interior com retábulo)
  // =====================================================================================
  {
    const W = CHURCH.w, hw = W / 2, Z0 = CHURCH.front, Z1 = CHURCH.z1, H = CHURCH.wallH, T = 0.8, FL = 0.25;
    const ochre = 0xd9a85e, trim = 0xe9dfcc, L = Z0 - Z1;
    // fachada com porta em arco, janela do coro redonda e frontão curvo
    const gable: THREE.Vector2[] = [new THREE.Vector2(-hw, 0), new THREE.Vector2(hw, 0), new THREE.Vector2(hw, H + 1.6)];
    for (let i = 0; i <= 16; i++) { const t = i / 16, x = hw - t * W; gable.push(new THREE.Vector2(x, H + 1.6 + Math.sin(t * Math.PI) * 2.4 + (Math.abs(x) < 1.2 ? 0.6 : 0))); }
    gable.push(new THREE.Vector2(-hw, H + 1.6));
    wall(B, m.plaster, W, H, T, [{ pts: roundArch(2.6, 4.6), x: 0, y: 0 }, { pts: circle(0.95, 20), x: 0, y: 7.2 }], 0, 0, Z0 - T, 0, ochre, gable);
    // moldura da porta (cantaria) e pilastras
    const arcF = wallGeo(3.6, 5.4, 0.12, [{ pts: roundArch(2.6, 4.6), x: 0, y: 0 }], [new THREE.Vector2(-1.8, 0), new THREE.Vector2(1.8, 0), new THREE.Vector2(1.8, 5.4), new THREE.Vector2(-1.8, 5.4)]);
    arcF.translate(0, 0, Z0); boxUV(arcF); B.add(m.stone, arcF, trim);
    [-1, 1].forEach(s => { B.box(m.stone, 0.5, H + 1.4, 0.3, s * (hw - 0.25), (H + 1.4) / 2, Z0 + 0.12, trim); B.box(m.stone, 0.4, 6.2, 0.22, s * 2.3, 3.1, Z0 + 0.1, trim); });
    B.box(m.stone, W + 0.3, 0.35, 0.4, 0, H + 1.55, Z0 + 0.1, trim);
    // nicho com santo sobre a porta e relógio parado no frontão
    D.box(m.plain, 0.9, 1.5, 0.2, 0, 5.55, Z0 + 0.02, 0x2a2420);
    later(place('gothic_statue', 0, 4.85, Z0 + 0.15, 0, 0.5, G));
    { const ck = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6 })); ck.position.set(0, H + 2.9, Z0 + 0.03); G.add(ck); }
    // paredes laterais com janelas altas e contrafortes; parede do fundo
    const sideHoles = (sgn: number): Hole[] => [7, 13, 18].map(d => ({ pts: roundArch(1.1, 2.4), x: sgn * (d - L / 2), y: 5.6 }));
    wall(B, m.plaster, L, H, T, sideHoles(1), hw, 0, Z0 - L / 2, Math.PI / 2, ochre);
    wall(B, m.plaster, L, H, T, sideHoles(1), -hw - T, 0, Z0 - L / 2, Math.PI / 2, ochre);
    B.box(m.plaster, W + 2 * T, H, T, 0, H / 2, Z1 - T / 2, ochre);
    [-1, 1].forEach(s => [4, 10, 16].forEach(d => B.box(m.plaster, 0.9, H - 1, 1.2, s * (hw + T + 0.45), (H - 1) / 2, Z0 - d, ochre)));
    vttWalls.push([[-1.3, Z0], [-hw - T, Z0], [-hw - T, Z1 - T], [hw + T, Z1 - T], [hw + T, Z0], [1.3, Z0]]);
    portals.push({ p: [0, Z0 - T / 2], a: [-1.3, Z0 - T / 2], b: [1.3, Z0 - T / 2] });
    // torres: base maciça, campanário vazado, cúpula e cruz
    [-1, 1].forEach(s => {
      const tx = s * (hw + 2.0), tw = 4, tz = Z0 - 2;
      B.box(m.plaster, tw, H + 2.2, tw, tx, (H + 2.2) / 2, tz, ochre);
      B.box(m.stone, tw + 0.4, 0.35, tw + 0.4, tx, H + 2.35, tz, trim);
      const by = H + 2.5, bh = 3.6;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => B.box(m.plaster, 0.8, bh, 0.8, tx + a * (tw / 2 - 0.4), by + bh / 2, tz + b * (tw / 2 - 0.4), ochre));
      B.box(m.stone, tw + 0.3, 0.4, tw + 0.3, tx, by + bh + 0.2, tz, trim);
      F.box(m.stone, tw - 0.2, 0.2, tw - 0.2, tx, by + 0.1, tz, trim);
      const bell = new THREE.CylinderGeometry(0.25, 0.55, 0.9, 12, 1, true); bell.translate(tx, by + bh - 1.1, tz); D.add(m.rust, bell, 0x8a6a40);
      const dome = new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(tx, by + bh + 0.4, tz); boxUV(dome); R.add(m.tile, dome, 0xd8c8b0);
      D.box(m.iron, 0.07, 1.1, 0.07, tx, by + bh + 2.4, tz, 0x222222); D.box(m.iron, 0.55, 0.07, 0.07, tx, by + bh + 2.6, tz, 0x222222);
      vttWalls.push([[tx - tw / 2, tz - tw / 2], [tx + tw / 2, tz - tw / 2], [tx + tw / 2, tz + tw / 2], [tx - tw / 2, tz + tw / 2], [tx - tw / 2, tz - tw / 2]]);
    });
    // teto plano + cúpula sobre o presbitério
    R.box(m.roof, W + 2 * T, 0.3, L + T, 0, H + 0.15, Z0 - L / 2 - T / 2 + 0.4, 0xb0a898);
    const drum = new THREE.CylinderGeometry(3.2, 3.2, 1.8, 16); drum.translate(0, H + 1.2, Z1 + 5); boxUV(drum); R.add(m.plaster, drum, ochre);
    const cup = new THREE.SphereGeometry(3.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); cup.translate(0, H + 2.1, Z1 + 5); boxUV(cup); R.add(m.tile, cup, 0x9ab0a8);
    // interior: piso, degrau do presbitério, bancos, retábulo dourado, velas
    F.box(m.terracotta, W, FL, L - T, 0, FL / 2, Z0 - T - (L - T) / 2, 0xb09080);
    F.box(m.stone, W, 0.45, 4.5, 0, FL + 0.225, Z1 + 2.25, 0xcfc4b0);
    const ceil = new THREE.PlaneGeometry(W, L); ceil.rotateX(Math.PI / 2); ceil.translate(0, H - 0.01, Z0 - L / 2); D.add(m.plaster, ceil, 0xe0d6c4);
    for (let r = 0; r < 8; r++) [-1, 1].forEach(s => {
      const z = Z0 - T - 3 - r * 1.35, x = s * 3.2;
      D.box(m.woodDark, 4.2, 0.07, 0.42, x, FL + 0.45, z, 0x9a7a60);
      D.box(m.woodDark, 4.2, 0.55, 0.06, x, FL + 0.75, z + 0.22, 0x9a7a60);
      [-2, 0, 2].forEach(k => D.box(m.woodDark, 0.06, 0.45, 0.42, x + k, FL + 0.22, z, 0x4a3326));
    });
    // retábulo: painel dourado com colunas e nichos escuros
    const gold = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.9, roughness: 0.38, envMapIntensity: 1.2 });
    const Rt = new THREE.Group(); G.add(Rt);
    const ret = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = gold) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; Rt.add(b); };
    ret(8.5, 7.5, 0.3, 0, FL + 0.45 + 3.75, Z1 + 0.15);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.9 });
    [[-2.6, 2.4], [0, 2.4], [2.6, 2.4], [-2.6, 5.4], [2.6, 5.4], [0, 5.9]].forEach(([x, y]) => ret(1.3, 2.0, 0.12, x, FL + 0.45 + y, Z1 + 0.32, dark));
    for (let k = -2; k <= 2; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 7.2, 10), gold); c.position.set(k * 1.3 + (k ? Math.sign(k) * 0.0 : 0), FL + 0.45 + 3.6, Z1 + 0.42); if (k !== 0) Rt.add(c); }
    later(place('gothic_statue', 0, FL + 0.45 + 1.45, Z1 + 0.42, 0, 0.62, G));
    // altar, cruz e velas
    D.box(m.stone, 2.6, 1.0, 1.0, 0, FL + 0.45 + 0.5, Z1 + 2.6, 0xe6ddcc);
    D.box(m.plain, 2.7, 0.02, 1.1, 0, FL + 0.45 + 1.01, Z1 + 2.6, 0xe8e2d4);
    for (let i = -3; i <= 3; i++) if (i) candles.push(new THREE.Vector3(i * 0.35, FL + 0.45 + 1.02, Z1 + 2.35));
    for (let i = 0; i < 18; i++) candles.push(new THREE.Vector3(-hw + 0.8 + (rnd() * 0.6), FL + 0.05 + (i % 3) * 0.25, Z1 + 6 + i * 0.25)); // veladoras a um santo lateral
    D.box(m.stone, 0.8, 0.75, 4.8, -hw + 1.1, FL + 0.375, Z1 + 8.2, 0xd6cdb8);
    light(0, FL + 2.4, Z1 + 3.2, 7, 8, 0xffa040, { flick: 1, vtt: 6 }); light(-hw + 1.2, FL + 1.4, Z1 + 8.2, 4, 5, 0xff8a30, { flick: 1, vtt: 4 });
    // lustres de velas na nave
    [Z0 - 7, Z0 - 14].forEach((z, i) => { later(place('Chandelier_03', 0, H - 2.6, z, 0, 1, G)); D.box(m.iron, 0.03, 1.6, 0.03, 0, H - 0.8, z, 0x222222); light(0, H - 2.9, z, 10, 6 - i, 0xffb067, { flick: 1, vtt: 8 }); halo(0, H - 2.8, z, 1.6); });
    // porta de madeira entreaberta
    [-1, 1].forEach(s => { const d = new THREE.Mesh(boxUV(new THREE.BoxGeometry(1.28, 3.3, 0.1)), m.woodDark); d.geometry.translate(-s * 0.64, 1.65, 0); d.position.set(s * 1.3, FL, Z0 - T + 0.1); d.rotation.y = s * (s > 0 ? 1.25 : 0.45); d.castShadow = d.receiveShadow = true; G.add(d); doors.push(d); });
    // átrio: muro com portão, cruz atrial, caminho de pedra
    const A0 = ATRIO.z0, e = 13.4;
    const aw = (x0: number, z0: number, x1: number, z1: number) => { const len = Math.hypot(x1 - x0, z1 - z0); B.box(m.plaster, Math.abs(x1 - x0) + 0.4 || 0.4, 1.9, Math.abs(z1 - z0) + 0.4 || 0.4, (x0 + x1) / 2, 0.95, (z0 + z1) / 2, 0xe2d6c0); void len; vttWalls.push([[x0, z0], [x1, z1]]); };
    aw(-e, A0, -2.2, A0); aw(2.2, A0, e, A0); aw(-e, A0, -e, -51.4); aw(e, A0, e, -51.4); aw(-e, -51.4, e, -51.4);
    for (let x = -e; x <= e + 0.1; x += 2.2) if (Math.abs(x) > 2.4) { const c = new THREE.ConeGeometry(0.22, 0.6, 4); c.translate(x, 2.2, A0); B.add(m.plaster, c, 0xe2d6c0); }
    [-1, 1].forEach(s => { B.box(m.stone, 0.9, 3.6, 0.9, s * 2.65, 1.8, A0, 0xe9dfcc); const pin = new THREE.ConeGeometry(0.35, 0.9, 4); pin.translate(s * 2.65, 4.05, A0); B.add(m.stone, pin, 0xe9dfcc); });
    const arcG = new THREE.TorusGeometry(2.65, 0.16, 6, 20, Math.PI); arcG.translate(0, 3.5, A0); D.add(m.stone, arcG, 0xe9dfcc);
    const pth = new THREE.PlaneGeometry(3.4, A0 - Z0); pth.rotateX(-Math.PI / 2); pth.translate(0, 0.03, (A0 + Z0) / 2); boxUV(pth); D.add(m.cobble as THREE.Material, pth);
    B.box(m.stone, 1.4, 1.2, 1.4, -6.5, 0.6, -28.5, 0xcfc4b0); B.box(m.stone, 0.32, 2.6, 0.32, -6.5, 2.5, -28.5, 0xcfc4b0); B.box(m.stone, 1.5, 0.3, 0.32, -6.5, 3.2, -28.5, 0xcfc4b0);
    later(instance(lod('island_tree_03'), [{ x: 8.5, y: 0, z: -28.5, ry: 1, s: 0.45 }], G, { wind: { amp: 0.08, freq: 0.9, flutter: 0.015 } }).then(ms => ms.forEach(x => (x.userData.canopy = 1))));
    const sg = sign('PARROQUIA DE SAN JUDAS TADEO', 6, 0.6, { bg: '#e9dfcc', fg: '#5a3a20' }); sg.position.set(0, 9.1, Z0 + 0.06); G.add(sg);
  }

  // =====================================================================================
  // CANTINA "El Último Trago" (interior com balcão, mesas, luminárias)
  // =====================================================================================
  {
    const { x0, x1, z0, z1, h } = CANTINA, T = 0.35, col = 0x9a3a32, w = z1 - z0, d = x1 - x0;
    // frente (voltada para a praça, -x): porta vaivém + 2 janelas
    wall(B, m.plaster, w, h, T, [{ pts: rect(1.7, 2.6), x: 0, y: 0 }, { pts: rect(1.6, 1.4), x: -3.8, y: 1.0 }, { pts: rect(1.6, 1.4), x: 3.8, y: 1.0 }], x0 + T, 0, (z0 + z1) / 2, -Math.PI / 2, col);
    B.box(m.plaster, d, h, T, (x0 + x1) / 2, h / 2, z0 + T / 2, col);
    wall(B, m.plaster, d, h, T, [{ pts: rect(1.0, 2.2), x: 3.5, y: 0 }], (x0 + x1) / 2, 0, z1 - T, 0, col);
    B.box(m.plaster, T, h, w, x1 - T / 2, h / 2, (z0 + z1) / 2, col);
    B.box(m.plaster, 0.06, 0.95, w, x0 - 0.02, 0.48, (z0 + z1) / 2, 0x3a2a24);
    B.box(m.stone, 0.4, 0.25, w + 0.2, x0 + 0.05, h + 0.05, (z0 + z1) / 2, 0xd8d0c0);
    R.box(m.roof, d, 0.2, w, (x0 + x1) / 2, h + 0.1, (z0 + z1) / 2, 0x9a958c);
    // toldo de telha e placa
    const tj = new THREE.BoxGeometry(1.2, 0.07, w - 0.4); tj.rotateZ(-0.32); tj.translate(x0 - 0.5, 3.15, (z0 + z1) / 2); boxUV(tj); R.add(m.tile, tj, 0xc8b4a4);
    const sg = sign('CANTINA  EL ÚLTIMO TRAGO', 5.6, 0.8, { bg: '#1e3a2e', fg: '#e8c070', border: '#e8c070' }); sg.position.set(x0 - 0.04, h - 0.6, (z0 + z1) / 2); sg.rotation.y = -Math.PI / 2; G.add(sg);
    // interior
    F.box(m.floor as THREE.Material, d - 2 * T, 0.05, w - 2 * T, (x0 + x1) / 2, 0.025, (z0 + z1) / 2);
    const ceil = new THREE.PlaneGeometry(d, w); ceil.rotateX(Math.PI / 2); ceil.translate((x0 + x1) / 2, h - 0.01, (z0 + z1) / 2); D.add(m.woodDark, ceil, 0x4a3a30);
    const bx = x1 - 2.4;
    B.box(m.woodDark, 0.6, 1.1, 7.5, bx, 0.55, (z0 + z1) / 2 - 1.2, 0x5a3a28); D.box(m.woodDark, 0.8, 0.06, 7.7, bx, 1.13, (z0 + z1) / 2 - 1.2, 0x3a2418);
    D.box(m.woodDark, 0.4, 2.2, 7, x1 - T - 0.2, 2.2, (z0 + z1) / 2 - 1.2, 0x4a3020);
    [1.6, 2.3, 3.0].forEach(y => D.box(m.woodDark, 0.45, 0.04, 7, x1 - T - 0.35, y, (z0 + z1) / 2 - 1.2, 0x3a2418));
    // garrafas na prateleira
    const bottles: THREE.Matrix4[] = [], bc: number[] = [];
    [1.62, 2.32, 3.02].forEach(y => { for (let z = z0 + 1.5; z < z1 - 3; z += 0.16 + rnd() * 0.08) { bottles.push(mtx(x1 - T - 0.35, y + 0.15, z, 0, 1, 0.8 + rnd() * 0.5)); bc.push([0x2a5a2a, 0x6a3a10, 0x8a8a7a, 0x3a2a1a, 0xa07020][(rnd() * 5) | 0]); } });
    const bg = new THREE.CylinderGeometry(0.035, 0.04, 0.3, 6), bm = new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, envMapIntensity: 1.3, transparent: true, opacity: 0.85 });
    const bi = new THREE.InstancedMesh(bg, bm, bottles.length); bottles.forEach((mm, i) => { bi.setMatrixAt(i, mm); bi.setColorAt(i, new THREE.Color(bc[i])); }); bi.computeBoundingSphere(); G.add(bi);
    // mesas com cadeiras de plástico, banquetas no balcão
    const tables: Xf[] = [], chairs: Xf[] = [];
    [[x0 + 2.3, z0 + 2.2], [x0 + 2.3, z1 - 2.2], [x0 + 5.3, z0 + 2.0], [x0 + 5.3, z1 - 2.6], [x0 + 5.0, 0.2]].forEach(([x, z]) => {
      tables.push({ x, y: 0.05, z, ry: rnd() * 0.3, s: 0.62, sy: 1.35 } as Xf);
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(); chairs.push({ x: x + Math.cos(a) * 0.85, y: 0.05, z: z + Math.sin(a) * 0.85, ry: -a - Math.PI / 2 + (rnd() - 0.5) * 0.6 }); }
    });
    later(instance('WoodenTable_01', tables, G));
    later(instance('plastic_monobloc_chair_01', chairs, G));
    const hang: Xf[] = [{ x: x0 + 3.4, y: h - 0.8, z: -2.2, ry: 0 }, { x: x0 + 3.4, y: h - 0.8, z: 2.6, ry: 0 }, { x: bx, y: h - 0.8, z: -1.2, ry: Math.PI / 2 }];
    later(instance('caged_hanging_light', hang.map(x => ({ ...x, s: 0.8 })), G));
    hang.forEach((l, i) => { halo(l.x, l.y - 0.15, l.z, 0.8); light(l.x, l.y - 0.3, l.z, 6, i < 2 ? 8 : 6, 0xffa050, { flick: i === 1 ? 2 : 0, vtt: 6 }); });
    later(instance('Barrel_01', [{ x: x1 - 1.0, y: 0, z: z1 - 1.0, ry: 1 }, { x: x1 - 1.0, y: 0, z: z1 - 1.8, ry: 2 }], G));
    // portas vaivém
    [-1, 1].forEach(s => { const g = boxUV(new THREE.BoxGeometry(0.05, 1.1, 0.8)); g.translate(0, 0, -s * 0.4); const dd = new THREE.Mesh(g, m.woodDark); dd.position.set(x0 + 0.18, 1.45, s * 0.83); dd.castShadow = true; dd.userData.swing = s; G.add(dd); doors.push(dd); });
    portals.push({ p: [x0 + T / 2, 0], a: [x0 + T / 2, -0.85], b: [x0 + T / 2, 0.85] });
    vttWalls.push([[x0, -0.85], [x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, 0.85]]);
    light(x0 - 0.8, 2.9, 0, 5, 7, 0xffa050, { vtt: 5 });
  }

  // =====================================================================================
  // MERCADO MUNICIPAL (galpão com arcos, bancas com lonas coloridas)
  // =====================================================================================
  {
    const { x0, x1, z0, z1, h } = MARKET, T = 0.4, col = 0xc7c0ae, w = z1 - z0, d = x1 - x0;
    const arches: Hole[] = [-6, -2, 2, 6].map(z => ({ pts: roundArch(2.6, 3.6), x: z, y: 0 }));
    wall(B, m.plaster, w, h, T, arches, x1, 0, (z0 + z1) / 2, Math.PI / 2, col);
    B.box(m.plaster, T, h, w, x0 + T / 2, h / 2, 0, col);
    [z0 + T / 2, z1 - T / 2].forEach(z => wall(B, m.plaster, d, h, T, [{ pts: roundArch(2.2, 3.0), x: 0, y: 0 }], (x0 + x1) / 2, 0, z - T / 2, 0, col));
    B.box(m.plaster, 0.06, 1.0, w, x1 + T + 0.03, 0.5, 0, 0x5f7a6a);
    B.box(m.stone, 0.6, 0.35, w + 0.3, x1 + 0.2, h + 0.1, 0, 0xe2d6c0);
    // telhado de chapa enferrujada em duas águas
    [-1, 1].forEach(s => { const g = new THREE.BoxGeometry(d / 2 + 0.6, 0.06, w + 0.8); g.rotateZ(s * 0.28); g.translate((x0 + x1) / 2 + s * d / 4, h + 0.9, 0); boxUV(g); R.add(m.rust, g, 0x9a8070); });
    const gb = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, 1.75)]);
    [z0, z1].forEach(z => { const g = new THREE.ExtrudeGeometry(gb, { depth: 0.3, bevelEnabled: false }); g.translate((x0 + x1) / 2, h, z - 0.15); boxUV(g); R.add(m.plaster, g, col); });
    for (let z = z0 + 2; z < z1; z += 4) D.box(m.woodDark, d, 0.18, 0.18, (x0 + x1) / 2, h - 0.1, z, 0x4a3a30);
    F.box(m.terracotta as THREE.Material, d - T, 0.05, w - 2 * T, (x0 + x1) / 2 + T / 2, 0.025, 0, 0xa09080);
    const sg = sign('MERCADO MUNICIPAL', 7, 0.9, { bg: '#e2d6c0', fg: '#2e4e44' }); sg.position.set(x1 + T + 0.03, h - 0.75, 0); sg.rotation.y = Math.PI / 2; G.add(sg);
    // bancas
    const crates: Xf[] = [], barrels: Xf[] = [], vases: Xf[] = [];
    const LC = [0xd04a7a, 0x3a8ac0, 0x6aa040, 0xe0a030, 0xc05030];
    [-5.3, -1.8, 1.8, 5.3].forEach((z, i) => [x0 + 2.4, x0 + 7.4].forEach((x, j) => {
      D.box(m.wood, 2.6, 0.08, 1.4, x, 0.85, z, 0x9a8070);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => D.box(m.wood, 0.07, 2.4, 0.07, x + a * 1.25, 1.2, z + b * 0.65, 0x7a6050));
      const lona = new THREE.PlaneGeometry(3.0, 1.9); lona.rotateX(-Math.PI / 2 + 0.18); lona.translate(x, 2.45, z); D.add(m.plain, lona, LC[(i + j * 2) % LC.length]);
      for (let k = 0; k < 3; k++) crates.push({ x: x + (k - 1) * 0.8, y: 0.89, z, ry: rnd() * 0.3, s: 0.55 });
      if (rnd() < 0.6) barrels.push({ x: x + 1.6, y: 0, z: z + 0.6, ry: rnd() * 6, s: 0.8 });
      if (rnd() < 0.7) vases.push({ x: x - 1.6, y: 0, z: z - 0.5, ry: rnd() * 6, s: 1.4 });
    }));
    crates.forEach(c => D.box(m.wood, 0.5, 0.32, 0.36, c.x, c.y + 0.16, c.z, pick([0xb09070, 0x9a7a5a, 0xc0a080]), c.ry)); later(instance('Barrel_01', barrels, G));
    { const pr = [0.05, 0.12, 0.2, 0.24, 0.22, 0.14, 0.11, 0.13].map((r, i) => new THREE.Vector2(r, i * 0.07)); const pot = new THREE.LatheGeometry(pr, 10); vases.forEach(v => { const g = pot.clone(); g.applyMatrix4(mtx(v.x, v.y, v.z, 0, (v.s ?? 1) * 1.1)); D.add(m.plain, g, pick([0xa0583a, 0x8a4a30, 0xb06a44])); }); }
    light((x0 + x1) / 2, h - 0.8, 0, 7, 5, 0xffc080, { vtt: 9 }); halo((x0 + x1) / 2, h - 0.6, 0, 0.6);
    vttWalls.push([[x1, z0], [x0, z0], [x0, z1], [x1, z1]]);
  }

  // =====================================================================================
  // PORTAL de lojas (arcada voltada para a praça)
  // =====================================================================================
  {
    const z0 = PORTAL.z, dz = PORTAL.depth, z1 = z0 + dz, e = 13.4, H = 4.6;
    const arches: Hole[] = []; for (let i = 0; i < 7; i++) arches.push({ pts: roundArch(2.8, 3.7), x: -e + 26.8 * (i + 0.5) / 7, y: 0 });
    wall(B, m.plaster, 26.8, H, 0.5, arches, 0, CURB, z0, 0, 0xd8b070);
    B.box(m.stone, 27.2, 0.3, 0.7, 0, CURB + H + 0.1, z0 + 0.2, 0xe9dfcc);
    F.box(m.terracotta as THREE.Material, 26.8, 0.04, dz, 0, CURB + 0.02, z0 + dz / 2, 0xb09080);
    F.box(m.sidewalk, 26.8, CURB, dz, 0, CURB / 2, z0 + dz / 2, 0xb8b0a4);
    R.box(m.roof, 26.8, 0.25, dz + 0.5, 0, CURB + H + 0.12, z0 + dz / 2, 0x9a958c);
    const ce = new THREE.PlaneGeometry(26.8, dz); ce.rotateX(Math.PI / 2); ce.translate(0, CURB + H - 0.2, z0 + dz / 2); D.add(m.woodDark, ce, 0x6a5040);
    const shops: [string, string, string][] = [['FARMACIA SAN JUDAS', '#e8efe6', '#2a6a3a'], ['ABARROTES LUPITA', '#f0d050', '#8a2a20'], ['TORTILLERÍA LA GUADALUPANA', '#e8e0d0', '#2a4a8a'], ['PAPELERÍA Y REGALOS', '#d0e8f0', '#6a2a6a']];
    let x = -e; shops.forEach(([n, bgc, fgc], i) => {
      const w = 26.8 / 4;
      T.house(x + w / 2, z1, Math.PI, { w, d: 8, h: 5.2, color: [0xd8b070, 0xc9796a, 0x8fa8b0, 0xe2d6c0][i], door: i === 1 || i === 3 ? 'shutter' : 'wood', tinaco: true, lit: 0.5 });
      const s = sign(n, w - 1.2, 0.7, { bg: bgc, fg: fgc, border: fgc }); s.position.set(x + w / 2, CURB + 3.3, z1 - 0.07); s.rotation.y = Math.PI; G.add(s);
      x += w;
    });
    for (let i = 0; i < 7; i += 2) light(-e + 26.8 * (i + 0.5) / 7, CURB + 3.9, z0 + dz / 2, 4, i === 2 ? 5 : 2, 0xffc070, { vtt: 5 });
    for (let i = 0; i < 7; i++) halo(-e + 26.8 * (i + 0.5) / 7, CURB + 4.0, z0 + dz / 2, 0.5);
    vttWalls.push([[-e, z1], [e, z1]]);
  }

  // =====================================================================================
  // PANTEÓN municipal (cemitério) — túmulos coloridos, cempasúchil, velas, capela
  // =====================================================================================
  {
    const { x0, x1, z0, z1 } = PANTEON, H = 2.4, wc = 0xe6ded0, gate = -19;
    const pw = (ax: number, az: number, bx: number, bz: number) => { B.box(m.plaster, Math.abs(bx - ax) + 0.4, H, Math.abs(bz - az) + 0.4, (ax + bx) / 2, H / 2, (az + bz) / 2, wc); vttWalls.push([[ax, az], [bx, bz]]); };
    pw(x0, z0, x1, z0); pw(x0, z1, x1, z1); pw(x1, z0, x1, z1); pw(x0, z0, x0, gate - 2.2); pw(x0, gate + 2.2, x0, z1);
    [-1, 1].forEach(s => { B.box(m.plaster, 1.0, 4.2, 1.0, x0, 2.1, gate + s * 2.6, wc); const c = new THREE.BoxGeometry(0.2, 0.9, 0.2); c.translate(x0, 4.65, gate + s * 2.6); B.add(m.stone, c, wc); });
    D.box(m.plaster, 1.0, 0.6, 6.2, x0, 4.0, gate, wc);
    const sg = sign('PANTEÓN MUNICIPAL', 4.4, 0.55, { bg: '#e6ded0', fg: '#3a3a3a' }); sg.position.set(x0 - 0.52, 4.0, gate); sg.rotation.y = -Math.PI / 2; G.add(sg);
    later(place('large_iron_gate', x0, 0, gate - 1.45, Math.PI / 2 + 0.5, 1, G));
    later(place('large_iron_gate', x0, 0, gate + 1.45, -Math.PI / 2 - 0.2, 1, G).then(g => g.scale.set(-1, 1, 1)));
    // túmulos em fileiras
    const C = [0xd8a0b8, 0x8ac0d0, 0x60b0a0, 0xe8e0d0, 0xd0c070, 0xe0e8f0, 0xa090c8, 0xd88a6a];
    const flowers: Xf[] = [];
    for (let gx = x0 + 6; gx < x1 - 6; gx += 3.4) for (let gz = z0 + 4; gz < z1 - 3; gz += 3.0) {
      if (Math.abs(gz - gate) < 2.2) continue;              // corredor principal
      if (gx > x1 - 14 && Math.abs(gz - (z0 + z1) / 2) < 6) continue; // capela
      if (rnd() < 0.12) continue;
      const c = C[(rnd() * C.length) | 0], x = gx + (rnd() - 0.5) * 0.4, z = gz + (rnd() - 0.5) * 0.3, tilt = (rnd() - 0.5) * 0.08, kind = rnd();
      const M = mtx(x, 0, z, Math.PI / 2 + (rnd() - 0.5) * 0.1, 1, 1, 1, tilt, tilt);
      const add = (bt: Batch, mat: THREE.Material, w: number, h: number, d: number, lx: number, ly: number, lz: number, cc: number) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(lx, ly, lz); g.applyMatrix4(M); boxUV(g); bt.add(mat, g, cc); };
      add(B, m.plaster, 1.0, 0.45, 2.1, 0, 0.225, 0, c);
      if (kind < 0.45) { add(D, m.plaster, 0.14, 1.5, 0.14, 0, 1.0, -0.95, c); add(D, m.plaster, 0.7, 0.14, 0.14, 0, 1.4, -0.95, c); }
      else if (kind < 0.75) add(D, m.plaster, 0.9, 1.1, 0.16, 0, 0.95, -0.95, c);
      else { // capelinha
        add(B, m.plaster, 1.1, 1.6, 1.0, 0, 1.25, -0.6, c);
        const r = new THREE.ConeGeometry(0.85, 0.6, 4); r.rotateY(Math.PI / 4); r.translate(0, 2.35, -0.6); r.applyMatrix4(M); B.add(m.plaster, r, 0xc8b4a4);
        add(D, m.plaster, 0.5, 0.7, 0.04, 0, 1.0, -0.08, 0x2a2420);
      }
      if (rnd() < 0.55) for (let k = 0; k < 6; k++) { const p = new THREE.Vector3((rnd() - 0.5) * 0.8, 0.5, (rnd() - 0.5) * 1.6).applyMatrix4(M); flowers.push({ x: p.x, y: p.y, z: p.z, s: 0.7 + rnd() * 0.6 }); }
      if (rnd() < 0.35) { const p = new THREE.Vector3((rnd() - 0.5) * 0.6, 0.47, 0.8).applyMatrix4(M); candles.push(p); }
    }
    // cempasúchil: bolinhas laranja instanciadas
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0xf08a10, roughness: 0.8, emissive: 0x3a1800 }), flowers.length);
    const o3 = new THREE.Object3D(); flowers.forEach((f, i) => { o3.position.set(f.x, f.y, f.z); o3.scale.setScalar(f.s ?? 1); o3.updateMatrix(); fl.setMatrixAt(i, o3.matrix); }); fl.computeBoundingSphere(); fl.userData.ns = 1; G.add(fl);
    // pétalas no corredor (caminho de cempasúchil que guia as almas)
    const pet: Xf[] = []; for (let i = 0; i < 260; i++) { const x = x0 - 3 + rnd() * (x1 - x0 - 8), z = gate + (rnd() - 0.5) * 1.6 * (0.6 + rnd()); pet.push({ x, y: groundH(x, z) + 0.02, z, s: 0.4 + rnd() * 0.4 }); }
    const pm = new THREE.InstancedMesh(new THREE.CircleGeometry(0.05, 5).rotateX(-Math.PI / 2), fl.material, pet.length);
    pet.forEach((f, i) => { o3.position.set(f.x, f.y, f.z); o3.scale.setScalar(f.s ?? 1); o3.updateMatrix(); pm.setMatrixAt(i, o3.matrix); }); pm.computeBoundingSphere(); pm.userData.ns = 1; G.add(pm);
    // capela no fundo
    const cx = x1 - 8, cz = (z0 + z1) / 2, cw = 6, cd = 7, ch = 4.8;
    wall(B, m.plaster, cw, ch, 0.4, [{ pts: roundArch(1.6, 2.8), x: 0, y: 0 }], cx - cd / 2, 0, cz, -Math.PI / 2, 0xd8d0c0, [new THREE.Vector2(-cw / 2, 0), new THREE.Vector2(cw / 2, 0), new THREE.Vector2(cw / 2, ch), new THREE.Vector2(0, ch + 1.6), new THREE.Vector2(-cw / 2, ch)]);
    B.box(m.plaster, cd, ch, 0.4, cx, ch / 2, cz - cw / 2 + 0.2, 0xd8d0c0); B.box(m.plaster, cd, ch, 0.4, cx, ch / 2, cz + cw / 2 - 0.2, 0xd8d0c0); B.box(m.plaster, 0.4, ch, cw, cx + cd / 2 - 0.2, ch / 2, cz, 0xd8d0c0);
    [-1, 1].forEach(s => { const g = new THREE.BoxGeometry(cd + 0.4, 0.12, cw / 2 + 0.9); g.rotateX(s * -0.55); g.translate(cx, ch + 0.75, cz + s * (cw / 4 + 0.05)); boxUV(g); R.add(m.tile, g, 0xb8a090); });
    D.box(m.iron, 0.08, 1.2, 0.08, cx - cd / 2 - 0.25, ch + 2.1, cz, 0x222222); D.box(m.iron, 0.08, 0.08, 0.6, cx - cd / 2 - 0.25, ch + 2.3, cz, 0x222222);
    F.box(m.stone, cd - 0.8, 0.1, cw - 0.8, cx, 0.05, cz, 0x9a9690);
    D.box(m.stone, 1.4, 0.9, 0.7, cx + cd / 2 - 1.0, 0.45, cz, 0xd6cdb8);
    for (let i = 0; i < 9; i++) candles.push(new THREE.Vector3(cx + cd / 2 - 1.2 + (rnd() - 0.5) * 0.6, 0.92, cz + (rnd() - 0.5) * 1.0));
    light(cx + cd / 2 - 1.6, 1.4, cz, 4, 7, 0xff9a40, { flick: 1, vtt: 4 });
    light(x0 + 12, 0.9, gate + 4, 3, 4, 0xff9a40, { flick: 1, vtt: 4 });
    vttWalls.push([[cx - cd / 2, cz - 0.8], [cx - cd / 2, cz - cw / 2], [cx + cd / 2, cz - cw / 2], [cx + cd / 2, cz + cw / 2], [cx - cd / 2, cz + cw / 2], [cx - cd / 2, cz + 0.8]]);
    later(instance('dead_tree_trunk', [{ x: x0 + 5, y: 0, z: z0 + 4, ry: 1, s: 1.2 }, { x: x1 - 4, y: 0, z: z1 - 3, ry: 3, s: 1 }], G));
  }

  // =====================================================================================
  // FAZENDA abandonada (Hacienda) — pátio com poço, corredor com colunas, cômodos arruinados
  // =====================================================================================
  {
    const { x: hx, z: hz } = HACIENDA, OW = 30, OD = 26, Wd = 7, H = 4.4, T = 0.55, c = 0xb89a80;
    const xa = hx - OW / 2, xb = hx + OW / 2, za = hz - OD / 2, zb = hz + OD / 2;
    const gy = groundH(hx, hz);
    // muro externo com portão (frente leste, voltada para a estrada)
    const outer = (w: number, holes: Hole[], x: number, z: number, ry: number) => wall(B, m.worn, w, H, T, holes, x, gy, z, ry, 0xc9a684, ruinTop(w, H));
    outer(OD, [{ pts: roundArch(3.2, 3.6), x: 0, y: 0 }], xb, hz, Math.PI / 2);
    outer(OD, [{ pts: rect(1.0, 1.0), x: -6, y: 1.8 }, { pts: rect(1.0, 1.0), x: 6, y: 1.8 }], xa - T, hz, Math.PI / 2);
    outer(OW, [{ pts: rect(1.0, 1.0), x: -8, y: 1.8 }, { pts: rect(1.0, 1.0), x: 4, y: 1.8 }], hx, za - T, 0);
    outer(OW, [{ pts: rect(1.0, 1.0), x: -4, y: 1.8 }, { pts: rect(1.0, 1.0), x: 9, y: 1.8 }], hx, zb, 0);
    // alas (oeste, norte e sul) com paredes internas e portas
    const inner = (w: number, holes: Hole[], x: number, z: number, ry: number) => wall(B, m.worn, w, H, 0.4, holes, x, gy, z, ry, 0xd2c2ae, ruinTop(w, H));
    inner(OD - 2 * Wd, [{ pts: rect(1.2, 2.3), x: -2, y: 0 }, { pts: rect(1.2, 2.3), x: 3, y: 0 }], xa + Wd, hz, Math.PI / 2);
    inner(OW - Wd, [{ pts: rect(1.2, 2.3), x: -3, y: 0 }, { pts: rect(1.2, 2.3), x: 5, y: 0 }, { pts: rect(1.2, 2.3), x: 10, y: 0 }], hx + Wd / 2, za + Wd, 0);
    inner(OW - Wd, [{ pts: rect(1.2, 2.3), x: -6, y: 0 }, { pts: rect(1.2, 2.3), x: 1, y: 0 }, { pts: rect(1.2, 2.3), x: 8, y: 0 }], hx + Wd / 2, zb - Wd - 0.4, 0);
    // divisórias entre cômodos
    [[xa + 9, za, za + Wd], [xa + 17, za, za + Wd], [xa + 9, zb - Wd, zb], [xa + 20, zb - Wd, zb], [xa, hz - 1, hz - 1]].forEach(([x, z1_, z2]) => {
      if (z1_ === z2) { B.box(m.worn, Wd, H * 0.8, 0.35, xa + Wd / 2, gy + H * 0.4, z1_, 0xd2c2ae); return; }
      wall(B, m.worn, z2 - z1_, H * 0.85, 0.35, [{ pts: rect(1.0, 2.2), x: 0, y: 0 }], x, gy, (z1_ + z2) / 2, Math.PI / 2, 0xd2c2ae);
    });
    // corredor: colunas e vigas (telhado caído em partes)
    for (let x = xa + Wd + 2; x < xb - 1; x += 3) [za + Wd + 1.6, zb - Wd - 1.6].forEach(z => { B.box(m.adobe, 0.5, 3.4, 0.5, x, gy + 1.7, z, c); });
    const beams: [number, number, number, number][] = [];
    for (let x = xa + 1; x < xb; x += 1.6) { if (rnd() < 0.35) continue; beams.push([x, za + Wd / 2, Wd + 1.8, 0], [x, zb - Wd / 2, Wd + 1.8, 0]); }
    for (let z = za + Wd + 1; z < zb - Wd; z += 1.6) if (rnd() > 0.4) beams.push([xa + Wd / 2, z, Wd, 1]);
    beams.forEach(([x, z, L, rot]) => { const fall = rnd() < 0.15; const g = new THREE.BoxGeometry(0.16, 0.18, L); if (rot) g.rotateY(Math.PI / 2); if (fall) g.rotateZ(0.5); g.translate(x, gy + (fall ? 1.4 : H - 0.15), z); boxUV(g); D.add(m.woodDark, g, 0x5a4a3a); });
    // pedaços de telhado que restaram
    [[xa + 4, za + 3.5, 7, 6], [xb - 6, zb - 3.5, 9, 6], [xa + 3.5, hz + 5, 6, 6]].forEach(([x, z, w, d]) => R.box(m.tile, w, 0.12, d, x, gy + H + 0.1, z, 0xa89080));
    // pisos de terra batida e pátio
    F.box(m.dirt, OW - 0.6, 0.06, OD - 0.6, hx, gy + 0.03, hz, 0xa89480);
    // poço no pátio
    const pc = hx + 3, pz = hz;
    const ring = new THREE.CylinderGeometry(1.1, 1.15, 0.9, 16, 1, true); ring.translate(pc, gy + 0.45, pz); boxUV(ring); B.add(m.adobe, ring, c);
    const hole = new THREE.CircleGeometry(1.05, 16); hole.rotateX(-Math.PI / 2); hole.translate(pc, gy + 0.3, pz); D.add(m.plain, hole, 0x050505);
    [-1, 1].forEach(s => D.box(m.woodDark, 0.14, 2.4, 0.14, pc + s * 1.0, gy + 1.2, pz, 0x4a3a2a)); D.box(m.woodDark, 2.3, 0.14, 0.14, pc, gy + 2.35, pz, 0x4a3a2a);
    later(place('wine_barrel_01', pc + 1.8, gy, pz + 0.9, 0.4, 0.7, G));
    // o quarto do ritual: círculo de giz, velas derretidas (o gancho do mistério)
    const rx = xa + 4.5, rz = zb - 3.5;
    const rit = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: sigilTex(), transparent: true, depthWrite: false, roughness: 1 }));
    rit.position.set(rx, gy + 0.075, rz); rit.userData.ns = 1; G.add(rit);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; candles.push(new THREE.Vector3(rx + Math.cos(a) * 1.55, gy + 0.07, rz + Math.sin(a) * 1.55)); }
    light(rx, gy + 0.6, rz, 3, 6, 0xff8a30, { flick: 1, vtt: 4 });
    later(place('GothicCabinet_01', xa + 0.9, gy, za + 1.8, Math.PI / 2, 1, G));
    later(instance('WoodenChair_01', [{ x: xa + 3, y: gy, z: za + 3, ry: 1.2 }, { x: xa + 5.5, y: gy, z: zb - 5.5, ry: 2.8, tilt: 1.45 } as Xf], G));
    [[xb - 3, za + 2, 0.4, 0], [xb - 3.6, za + 2.9, 1.1, 0], [xb - 2.9, za + 2.3, 0.2, 0.8]].forEach(([x, z, r, y]) => D.box(m.wood, 0.8, 0.8, 0.8, x, gy + y + 0.4, z, 0x9a7a5a, r));
    later(instance('Lantern_01', [{ x: xb - 1.2, y: gy, z: hz + 2.4, ry: 0 }], G)); light(xb - 1.2, gy + 0.5, hz + 2.4, 4, 3, 0xffa050, { flick: 1, vtt: 4 });
    later(instance('dead_tree_trunk', [{ x: hx - 3, y: gy, z: hz + 1, ry: 2, s: 1.3 }], G));
    vttWalls.push([[xb, hz - 1.6], [xb, za], [xa, za], [xa, zb], [xb, zb], [xb, hz + 1.6]]);
    portals.push({ p: [xb, hz], a: [xb, hz - 1.6], b: [xb, hz + 1.6] });
  }

  // =====================================================================================
  // CAIXA-D'ÁGUA elevada e PONTE sobre o arroio
  // =====================================================================================
  {
    const { x, z } = TOWER_W, gy = groundH(x, z), Hh = 14;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
      const g = new THREE.CylinderGeometry(0.12, 0.16, Hh, 6); g.applyMatrix4(mtx(x + a * 2.2, gy + Hh / 2, z + b * 2.2, 0, 1, 1, 1, b * 0.06, -a * 0.06)); D.add(m.rust, g, 0x8a7a6a);
      for (let y = 3; y < Hh; y += 3.5) D.box(m.rust, 4.4, 0.08, 0.08, x, gy + y, z + b * (2.35 - y * 0.008), 0x7a6a5a);
    });
    const tank = new THREE.CylinderGeometry(3.1, 3.1, 4.2, 20, 1, false);
    const tm = new THREE.MeshStandardMaterial({ map: signTexture('SAN JUDAS DE LAS ÁNIMAS', { bg: '#a8a090', fg: '#6a3a30', w: 1024, h: 128 }), roughness: 0.7, metalness: 0.4, envMapIntensity: 0.6 });
    const tk = new THREE.Mesh(tank, [tm, m.rust, m.rust]); tk.position.set(x, gy + Hh + 2.1, z); tk.castShadow = tk.receiveShadow = true; G.add(tk);
    const cap = new THREE.ConeGeometry(3.3, 1.4, 20); cap.translate(x, gy + Hh + 4.9, z); R.add(m.rust, cap, 0x9a8a7a);
    for (let y = 0.5; y < Hh; y += 0.4) D.box(m.iron, 0.6, 0.03, 0.03, x + 3.0, gy + y, z, 0x333333);
    [-0.3, 0.3].forEach(s => D.box(m.iron, 0.04, Hh, 0.04, x + 3.0, gy + Hh / 2, z + s, 0x333333));
    vttWalls.push([[x - 2.3, z - 2.3], [x + 2.3, z - 2.3], [x + 2.3, z + 2.3], [x - 2.3, z + 2.3], [x - 2.3, z - 2.3]]);
  }
  {
    const zc = ARROYO(ROAD_S), L = 26, x = ROAD_S;
    F.box(m.stone, 7, 0.4, L, x, 0.05, zc, 0xa8a090);
    [-1, 1].forEach(s => { B.box(m.stone, 0.3, 0.9, L, x + s * 3.35, 0.7, zc, 0xb0a898); });
    [-6, 0, 6].forEach(dz => B.box(m.stone, 6, 3.5, 1.2, x, -1.6, zc + dz, 0x8a8478));
    vttWalls.push([[x - 3.35, zc - L / 2], [x - 3.35, zc + L / 2]], [[x + 3.35, zc - L / 2], [x + 3.35, zc + L / 2]]);
  }

  // ---------- montar ----------
  const solids = B.build(G);
  D.build(G, { shadow: Q.lights > 8 });
  const floors = F.build(G, { shadow: false });
  R.build(roofs);
  await Promise.all(P);
  return { solids, floors, roofs, vttWalls, portals, doors, candles };
}

// ---------- texturas por código ----------
function papelTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 80; const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 6, 64, 74);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * 8, 80); g.lineTo(i * 8 + 4, 72); g.lineTo(i * 8 + 8, 80); g.fill(); }
  const cut = (x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  cut(32, 36, 9); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cut(32 + Math.cos(a) * 18, 36 + Math.sin(a) * 18, 3.5); }
  for (let x = 8; x < 64; x += 12) { g.fillRect(x, 60, 5, 5); g.fillRect(x - 2, 14, 4, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function clockTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#2a2420'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#2a2420'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(64 + Math.cos(a) * 50 - 2, 64 + Math.sin(a) * 50 - 2, 4, 4); }
  // parado às 3:07
  g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 30, 64 + 4); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 18, 64 - 40); g.stroke();
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,60,40,${rnd() * 0.15})`; g.fillRect(rnd() * 128, rnd() * 128, 6, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** círculo de giz no chão (símbolos inventados, discretos) */
function sigilTex() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(235,228,215,0.75)'; g.lineCap = 'round';
  const ring = (r: number, w: number) => { g.lineWidth = w; g.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2, rr = r + (rnd() - 0.5) * 3; i ? g.lineTo(S / 2 + Math.cos(a) * rr, S / 2 + Math.sin(a) * rr) : g.moveTo(S / 2 + Math.cos(a) * rr, S / 2 + Math.sin(a) * rr); } g.stroke(); };
  ring(230, 5); ring(205, 3); ring(110, 4);
  g.lineWidth = 3;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2, b = (i + 2) / 5 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(S / 2 + Math.cos(a) * 205, S / 2 + Math.sin(a) * 205); g.lineTo(S / 2 + Math.cos(b) * 205, S / 2 + Math.sin(b) * 205); g.stroke(); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = S / 2 + Math.cos(a) * 218, y = S / 2 + Math.sin(a) * 218; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(-6, 6); g.lineTo(0, -7); g.lineTo(6, 6); if (i % 2) { g.moveTo(-6, 0); g.lineTo(6, 0); } g.stroke(); g.restore(); }
  g.strokeStyle = 'rgba(120,20,15,0.55)'; g.lineWidth = 4; g.beginPath(); g.arc(S / 2, S / 2, 40, 0, 7); g.stroke(); g.beginPath(); g.moveTo(S / 2 - 30, S / 2 + 30); g.lineTo(S / 2 + 30, S / 2 - 30); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** topo irregular de parede em ruína */
function ruinTop(w: number, h: number) {
  const pts = [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0)];
  const n = Math.max(4, Math.round(w / 1.5));
  for (let i = n; i >= 0; i--) { const x = -w / 2 + (w * i) / n, drop = rnd() < 0.25 ? 0.6 + rnd() * 1.8 : rnd() * 0.25; pts.push(new THREE.Vector2(x, h - drop)); }
  return pts;
}
void instanceVariants;
