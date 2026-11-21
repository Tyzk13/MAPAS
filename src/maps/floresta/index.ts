// Mapa: Floresta Sombria — uma floresta só, bem detalhada, em escala de gente. Relevo de morros com a ravina de um
// riacho, trilha com ponte e ramais, mata de pinheiros, folhosas e árvores mortas (feitas em código e instanciadas
// por bloco), troncos caídos, cogumelos, samambaias, arbustos, pedras com musgo, capim, névoa baixa, vaga-lumes à
// noite e folhas caindo. Lugares: Acampamento Abandonado, Árvore Oca, Círculo de Pedras e Santuário em Ruínas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MapRuntime, View } from '../../core/types';
import { begin } from '../../core/kit';
import { makeTerrain } from '../../core/terrain';
import { pbr } from '../../core/pbr';
import { instance, instanceVariants, place, type Xf } from '../../core/models';
import { grassField } from '../../core/grass';
import { cam } from '../../core/engine';
import { Batch, MAT, mtx, por, rnd, reseed, Q } from '../barud/common';
import { LUZES, luz } from '../barud/cidade';
import { peca } from '../barud/mobilia';
import { montar } from '../gente/montagem';
import { L, H, mata, RIO, TRILHA, RAMAL_CAMPO, RAMAL_ARVORE, RAMAL_RUINA, ACAMPAMENTO, ARVORE, CIRCULO, RUINA, PONTE, nivelAgua, type Linha } from './plano';
import { LOCAIS_F, NPCS_F } from './dados';

const P3 = (x: number, y: number, z: number) => [+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)] as [number, number, number];
const naTerra = (x: number, z: number, dy: number) => P3(x, H(x, z) + dy, z);

// ---------- árvores em código ----------
function tubo(parts: THREE.BufferGeometry[], a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, lados = 6) {
  const L0 = a.distanceTo(b), g = new THREE.CylinderGeometry(r1, r0, L0, lados, 1, true); g.translate(0, L0 / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z);
  g.deleteAttribute('uv'); parts.push(g.toNonIndexed());
}
function colorir(g: THREE.BufferGeometry, f: (y: number, r: number, i: number) => THREE.Color) {
  const p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = f(p.getY(i), Math.hypot(p.getX(i), p.getZ(i)), i); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
/** pinheiro escuro (~150 tri) */
function pinheiro(v: number) {
  reseed(v * 17 + 43);
  const parts: THREE.BufferGeometry[] = [], h = 11 + rnd() * 7, tiers = 8;
  const tr = new THREE.CylinderGeometry(0.1, 0.34, h * 0.6, 6); tr.translate(0, h * 0.3, 0); parts.push(tr.toNonIndexed());
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), y0 = h * (0.2 + f * 0.6), r = (2.4 - f * 2) * (0.85 + rnd() * 0.3), ch = h * (0.2 - f * 0.05);
    const c = new THREE.ConeGeometry(r, ch, 9, 1, true); c.translate(0, y0 + ch / 2, 0);
    const p = c.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) < y0 + 0.01) { const a = Math.atan2(p.getZ(k), p.getX(k)), j = 0.8 + 0.4 * Math.abs(Math.sin(a * 4.5 + i * 1.7)); p.setXYZ(k, p.getX(k) * j, y0 - 0.4 * j - rnd() * 0.3, p.getZ(k) * j); }
    c.rotateY(rnd() * 3); parts.push(c.toNonIndexed());
  }
  const tip = new THREE.ConeGeometry(0.5, h * 0.1, 7); tip.translate(0, h * 0.84, 0); parts.push(tip.toNonIndexed());
  parts.forEach(p => p.deleteAttribute('uv'));
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const base = new THREE.Color().setHSL(0.3 + rnd() * 0.06, 0.14, 0.032), bark = new THREE.Color(0x2a2018), c = new THREE.Color();
  colorir(g, (y, r, i) => (y < h * 0.22 && r < 0.4 ? c.copy(bark) : c.copy(base).multiplyScalar(0.7 + 0.6 * (y / h) + 0.35 * Math.min(1, r / 2) + 0.1 * Math.sin(i * 1.3))));
  const centros: { c: THREE.Vector3; s: number }[] = [];
  for (let i = 0; i < tiers; i++) { const f = i / (tiers - 1), y0 = h * (0.2 + f * 0.6), r = (2.4 - f * 2) * 0.85; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + i; centros.push({ c: new THREE.Vector3(Math.cos(a) * r * 0.78, y0 - 0.1, Math.sin(a) * r * 0.78), s: Math.max(0.35, r * 0.32) }); } }
  return { tronco: g, copa: copaCartoes(centros, 2, 1.1, new THREE.Color().setHSL(0.3, 0.2, 0.09), h) };
}
/** textura de um cacho de folhas (canvas com alfa): folhas ovais em vários verdes e uns raminhos */
let _folhaTex: THREE.CanvasTexture | null = null;
function folhaTex() {
  if (_folhaTex) return _folhaTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  let s = 91; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = '#2a2016'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(20 + r() * 216, 20 + r() * 216); g.stroke(); }
  for (let i = 0; i < 170; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 110, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, l = 6 + r() * 9;
    const v = 0.75 + r() * 0.5; g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(185 * v)},${Math.round(120 * v)})`;
    g.save(); g.translate(x, y); g.rotate(r() * 6.283); g.beginPath(); g.ellipse(0, 0, l, l * 0.45, 0, 0, 6.283); g.fill(); g.restore();
  }
  _folhaTex = new THREE.CanvasTexture(c); _folhaTex.colorSpace = THREE.SRGBColorSpace; _folhaTex.anisotropy = 4; return _folhaTex;
}
/** copa de cartões de folhas em volta de cada centro (normais apontando para fora: luz macia de copa de verdade) */
function copaCartoes(centros: { c: THREE.Vector3; s: number }[], n: number, tam: number, base: THREE.Color, h: number) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], o = new THREE.Object3D(), v = new THREE.Vector3(), cc = new THREE.Color();
  for (const { c, s } of centros) for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1), r = s * Math.cbrt(rnd()) * 0.9, q = tam * (0.75 + rnd() * 0.5);
    const px = c.x + Math.sin(b) * Math.cos(a) * r, py = c.y + Math.cos(b) * r * 0.75, pz = c.z + Math.sin(b) * Math.sin(a) * r;
    o.position.set(px, py, pz); o.rotation.set(rnd() * 6.283, rnd() * 6.283, rnd() * 6.283); o.updateMatrix();
    const nn = new THREE.Vector3(px - c.x, (py - c.y) + s * 0.3, pz - c.z).normalize();
    const luz0 = 0.55 + 0.6 * ((py - h * 0.45) / h) + 0.25 * (r / s); cc.copy(base).multiplyScalar(luz0 * (0.85 + rnd() * 0.3));
    const cant = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
    for (const [x, y, u, w] of cant) { v.set(x * q / 2, y * q / 2, 0).applyMatrix4(o.matrix); pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uv.push(u, w); col.push(cc.r, cc.g, cc.b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
/** folhosa (carvalho/faia): tronco torto e galhos (geo) + copa de cartões de folhas (copa) */
function folhosa(v: number) {
  reseed(v * 29 + 7);
  const parts: THREE.BufferGeometry[] = [], h = 8 + rnd() * 5;
  let p = new THREE.Vector3(0, -0.3, 0), r = 0.36 + rnd() * 0.12; const topo: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) { const q = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.9, h * 0.55 / 4, (rnd() - 0.5) * 0.9)); tubo(parts, p, q, r, r * 0.82, 7); p = q; r *= 0.82; if (i >= 2) topo.push(q.clone()); }
  const copa: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const o = topo[i % topo.length], a = i * 1.05 + rnd() * 0.6, L0 = 1.8 + rnd() * 1.6;
    const e = o.clone().add(new THREE.Vector3(Math.cos(a) * L0, L0 * (0.5 + rnd() * 0.5), Math.sin(a) * L0)); tubo(parts, o, e, r * 0.7, 0.05, 5); copa.push(e);
  }
  copa.push(p.clone().add(new THREE.Vector3(0, 1.4, 0)));
  // galhinhos finos saindo das pontas (aparecem entre as folhas)
  for (const e of copa) for (let i = 0; i < 2; i++) { const a = rnd() * 6.283; tubo(parts, e, e.clone().add(new THREE.Vector3(Math.cos(a) * 1.2, 0.5 + rnd() * 0.6, Math.sin(a) * 1.2)), 0.05, 0.015, 3); }
  const gt = mergeGeometries(parts)!; gt.computeVertexNormals();
  const bark = new THREE.Color().setHSL(0.08, 0.12, 0.07), c = new THREE.Color(), base = new THREE.Color().setHSL(0.2 + rnd() * 0.08, 0.32, 0.17 + rnd() * 0.05);
  colorir(gt, y => c.copy(bark).multiplyScalar(0.8 + 0.4 * (y / h)));
  const gf = copaCartoes(copa.map(e => ({ c: e, s: 1.9 + rnd() * 1.1 })), 30, 1.5, base, h);
  return { tronco: gt, copa: gf };
}
/** árvore morta retorcida (~150 tri) */
function morta(v: number) {
  reseed(v * 31 + 11);
  const parts: THREE.BufferGeometry[] = [], h = 7 + rnd() * 5;
  let p = new THREE.Vector3(0, -0.3, 0), r = 0.32 + rnd() * 0.12; const topo: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) { const q = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 1.1, h / 5, (rnd() - 0.5) * 1.1)); tubo(parts, p, q, r, r * 0.78); if (i >= 2) topo.push(q.clone()); p = q; r *= 0.78; }
  for (let i = 0; i < 6; i++) {
    const o = topo[(rnd() * topo.length) | 0], a = rnd() * 6.283, L0 = 1.6 + rnd() * 2.6, e = o.clone().add(new THREE.Vector3(Math.cos(a) * L0, L0 * (0.3 + rnd() * 0.6), Math.sin(a) * L0));
    tubo(parts, o, e, 0.11, 0.03, 4);
    if (rnd() < 0.7) { const a2 = a + (rnd() - 0.5) * 1.6; tubo(parts, e, e.clone().add(new THREE.Vector3(Math.cos(a2) * L0 * 0.5, L0 * 0.3, Math.sin(a2) * L0 * 0.5)), 0.03, 0.01, 3); }
  }
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + rnd(); tubo(parts, new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(Math.cos(a) * 1.1, -0.15, Math.sin(a) * 1.1), 0.16, 0.05, 4); }
  const g = mergeGeometries(parts)!; g.computeVertexNormals();
  const base = new THREE.Color().setHSL(0.07 + rnd() * 0.04, 0.1, 0.06 + rnd() * 0.02), c = new THREE.Color();
  return colorir(g, (y, _r, i) => c.copy(base).multiplyScalar(0.75 + 0.45 * (y / h) + 0.12 * Math.sin(i * 0.7)));
}

/** fita no chão (trilha) que segue o relevo e some nas bordas */
function fita(lin: Linha, larg: number, mat: THREE.Material, inicio = 0) {
  const P = lin.pts, n = P.length, pos = new Float32Array(n * 4 * 3), uv = new Float32Array(n * 4 * 2), col = new Float32Array(n * 4 * 4), idx: number[] = [];
  const lado = [-1.9, -1, 1, 1.9], alfa = [0, 1, 1, 0];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
    const w = larg * (1 + 0.2 * Math.sin(i * 0.13));
    for (let k = 0; k < 4; k++) {
      const j = i * 4 + k, x = P[i].x + nx * lado[k] * w, z = P[i].z + nz * lado[k] * w;
      pos.set([x, H(x, z) + 0.04, z], j * 3); uv.set([x, -z], j * 2);
      const c = 0.85 + 0.2 * Math.sin(i * 0.37 + k); col.set([c, c * 0.96, c * 0.9, alfa[k] * Math.min(1, (i + 1 - inicio) / 4)], j * 4);
    }
    if (i < n - 1) for (let k = 0; k < 3; k++) { const a0 = i * 4 + k, b0 = a0 + 4; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.userData.ns = 1; return m;
}

export async function build(M: MapRuntime) {
  begin(M, 61); reseed(2024); LUZES.length = 0;
  const G = M.G, Mt = MAT(); M.lamps.push(Mt.aceso);
  const nivel = Q.luzes > 14 ? 2 : Q.luzes > 8 ? 1 : 0;
  const B = new Batch('floresta-props');
  const tempo = { value: 0 };

  // ---------- chão ----------
  const ter = makeTerrain({
    size: L * 2 + 40, seg: [150, 190, 230][nivel], height: H,
    mask: (x, z) => { const m = mata(x, z), r = RIO.dist(x, z); return [Math.max(0, 0.75 - m) * (r < 9 ? 0.3 : 1), r < 10 ? 1 - r / 10 : Math.max(0, 0.35 - 0.35 * m)]; },
    base: { id: 'forest_ground_04', size: 2.4 }, r: { id: 'leafy_grass', size: 3 }, g: { id: 'brown_mud_leaves_01', size: 2.4 },
  });
  (ter.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x80776a); ter.mesh.name = 'Chão da floresta'; G.add(ter.mesh, ter.collider);
  const matTrilha = pbr('dry_ground_rocks', { size: 3, color: 0xa8967a }).clone();
  matTrilha.vertexColors = true; matTrilha.transparent = true; matTrilha.depthWrite = false; matTrilha.polygonOffset = true; matTrilha.polygonOffsetFactor = -4;
  for (const [lin, w] of [[TRILHA, 1.15], [RAMAL_CAMPO, 0.8], [RAMAL_ARVORE, 0.75], [RAMAL_RUINA, 0.8]] as [Linha, number][]) G.add(fita(lin, w, matTrilha));

  // ---------- riacho (água com ondinhas que correm) ----------
  {
    const P = RIO.pts, n = P.length, pos = new Float32Array(n * 2 * 3), idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, y = nivelAgua(i), w = 3.4;
      pos.set([P[i].x - nx * w, y, P[i].z - nz * w], i * 6); pos.set([P[i].x + nx * w, y, P[i].z + nz * w], i * 6 + 3);
      if (i < n - 1) { const a0 = i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) { const ix = g.index!.array as unknown as number[]; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } g.index!.needsUpdate = true; g.computeVertexNormals(); }
    const mat = new THREE.MeshStandardMaterial({ color: 0x08100d, roughness: 0.16, metalness: 0.05, transparent: true, opacity: 0.92, envMapIntensity: 0.55 });
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = tempo;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nuniform float uT;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nvec2 q = vWp.xz;\nvec3 rp = vec3(sin(q.x * 1.9 - uT * 2.1 + sin(q.y * 1.3)) + sin(q.x * 4.3 + q.y * 2.7 - uT * 3.3) * 0.5, 0.0, cos(q.y * 2.2 - uT * 1.7 + sin(q.x * 0.9)) + cos(q.y * 5.1 - q.x * 1.9 - uT * 2.9) * 0.5);\nnormal = normalize(normal + (viewMatrix * vec4(rp * 0.07, 0.0)).xyz);');
    };
    mat.customProgramCacheKey = () => 'riacho-floresta';
    const agua = new THREE.Mesh(g, mat); agua.name = 'Riacho'; agua.renderOrder = 1; agua.userData.ns = 1; G.add(agua);
  }

  // ---------- ponte de madeira ----------
  {
    const y0 = nivelAgua(RIO.perto(PONTE.x, PONTE.z).i) + 2.75, P = peca(B, new THREE.Matrix4(), PONTE.x, y0, PONTE.z, PONTE.ry);
    for (let i = 0; i < 16; i++) P.cx(Mt.tabuas, 2.4, 0.08, 0.5, (rnd() - 0.5) * 0.06, 0, -5.6 + i * 0.75, 0x8a7a64, (rnd() - 0.5) * 0.03);
    for (const s of [-1, 1]) {
      P.cx(Mt.madeira, 0.18, 0.2, 12.4, s * 1.05, -0.15, 0, 0x5a4a3a);
      for (let k = 0; k < 5; k++) { P.cil(Mt.madeira, 0.07, 1.1, s * 1.15, 0, -5 + k * 2.5, 0x4a3c30, 6); P.cil(Mt.madeira, 0.12, 3.2, s * 1.05, -3.2, -3.75 + k * 1.9 * (k < 5 ? 1 : 0), 0x3a3028, 6); }
      P.cx(Mt.madeira, 0.1, 0.1, 11, s * 1.15, 1.05, 0, 0x5a4a3a);
    }
  }

  // ---------- Acampamento Abandonado ----------
  const A = ACAMPAMENTO, yA = H(A.x, A.z);
  {
    const tenda = (x: number, z: number, ry: number, cor: number, rasgada: boolean) => {
      const P = peca(B, new THREE.Matrix4(), x, H(x, z), z, ry), w = 2.2, h = 1.5, d = 2.6;
      for (const s of [-1, 1]) { const g = new THREE.PlaneGeometry(d, Math.hypot(w / 2, h)); g.rotateY(Math.PI / 2); g.rotateZ(s * (Math.PI / 2 - Math.atan2(h, w / 2))); g.translate(s * w / 4, h / 2, 0); if (!(rasgada && s > 0)) por(B, Mt.tecido, g, cor, P.m); else { const g2 = new THREE.PlaneGeometry(d * 0.55, Math.hypot(w / 2, h)); g2.rotateY(Math.PI / 2); g2.rotateZ(s * 0.45); g2.translate(s * w / 4 + 0.3, h / 2 - 0.4, d * 0.2); por(B, Mt.tecido, g2, cor, P.m); } }
      P.cil(Mt.madeira, 0.03, h + 0.15, 0, 0, d / 2, 0x4a3a2a, 5); P.cil(Mt.madeira, 0.03, h + 0.15, 0, 0, -d / 2, 0x4a3a2a, 5);
      P.cx(Mt.tecido, 0.7, 0.08, 1.9, 0, 0.05, 0, 0x4a4234); // saco de dormir
    };
    tenda(A.x - 4, A.z - 3, 0.5, 0x6a6650, false); tenda(A.x + 3.5, A.z - 4, -0.6, 0x5a5444, true);
    // fogueira: anel de pedras, lenha e brasas
    const P = peca(B, new THREE.Matrix4(), A.x, yA, A.z, 0);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; P.esf(Mt.pedra, 0.2 + rnd() * 0.06, Math.cos(a) * 0.65, 0.08, Math.sin(a) * 0.65, 0x6a665e, 0.6); }
    for (let i = 0; i < 4; i++) P.cil(Mt.madeira, 0.06, 0.9, 0, 0.15, 0, 0x2a2018, 6, 0.06, 1.2, i * 0.8);
    P.esf(Mt.aceso, 0.18, 0, 0.1, 0, 0xff8a3a, 0.4);
    luz(A.x, yA + 0.6, A.z, 26, 3, 0xff8a40, 13, 8);
    // troncos para sentar, caixotes, mochila
    for (const [dx, dz, ry] of [[-2.2, 1.2, 0.4], [2, 1.6, -0.5]]) P.cil(Mt.madeira, 0.22, 1.6, dx, 0.22, dz, 0x4a3c30, 8, 0.22, 0, Math.PI / 2 + ry);
    P.cx(Mt.tecido, 0.45, 0.6, 0.3, 0.6, 0.3, 2.4, 0x5a4a34, 0.3);
    luz(A.x - 2.5, yA + 2.2, A.z + 2.8, 12, 2, 0xffb060, 9, 5);
  }
  // ---------- Árvore Oca (a árvore-mãe) ----------
  const T = ARVORE, yT = H(T.x, T.z);
  {
    const parts: THREE.BufferGeometry[] = [], tronco = new THREE.CylinderGeometry(1.8, 3, 15, 22, 10, true), q = tronco.attributes.position;
    for (let k = 0; k < q.count; k++) { const x = q.getX(k), y = q.getY(k), z = q.getZ(k), a = Math.atan2(z, x), j = 1 + 0.16 * Math.sin(a * 5 + y * 0.4) + 0.08 * Math.sin(a * 11 - y), oca = (y < -4.5 && Math.abs(a - 1.57) < 0.42) ? 0.72 : 1; q.setXYZ(k, x * j * oca, y, z * j * oca); }
    tronco.translate(0, 7.5 - 0.4, 0); tronco.deleteAttribute('uv'); tronco.computeVertexNormals(); const tn = tronco.toNonIndexed(); parts.push(tn);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + 0.3; if (Math.abs(a - 1.57) < 0.5) continue; tubo(parts, new THREE.Vector3(Math.cos(a) * 1.8, 2.6, Math.sin(a) * 1.8), new THREE.Vector3(Math.cos(a) * 5.2, -0.4, Math.sin(a) * 5.2), 0.9, 0.2, 7); }
    const ramos: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, o = new THREE.Vector3(0, 11 + rnd() * 3, 0), e = new THREE.Vector3(Math.cos(a) * (6 + rnd() * 3), 15 + rnd() * 4, Math.sin(a) * (6 + rnd() * 3)); tubo(parts, o, e, 0.7, 0.18, 7); ramos.push(e); }
    const g = mergeGeometries(parts)!; const nrm = g.attributes.normal; if (!nrm) g.computeVertexNormals();
    // só os galhos/raízes recalculam normais (o tronco já veio liso)
    const c = new THREE.Color();
    colorir(g, (y, rr, i) => c.setHSL(0.07, 0.14, 0.075).multiplyScalar(0.75 + 0.25 * Math.sin(y * 3.1 + rr * 5) * Math.sin(i * 0.013) + y * 0.015));
    const arv = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.3, side: THREE.DoubleSide }));
    arv.position.set(T.x, yT, T.z); arv.rotation.y = 0.2; arv.castShadow = arv.receiveShadow = true; arv.name = 'Árvore Oca'; G.add(arv);
    const gf = copaCartoes([...ramos, new THREE.Vector3(0, 19, 0)].map(e => ({ c: e, s: 4 + rnd() * 1.5 })), 70, 2.4, new THREE.Color().setHSL(0.22, 0.3, 0.15), 22);
    const copa = new THREE.Mesh(gf, new THREE.MeshStandardMaterial({ map: folhaTex(), vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.35 }));
    copa.position.copy(arv.position); copa.rotation.y = 0.2; copa.castShadow = true; G.add(copa);
    // a fenda (escura) e as velas dentro dela
    const fx = T.x + Math.cos(1.57 + 0.2) * 0, fz = T.z;
    const P = peca(B, new THREE.Matrix4(), fx, yT, fz, -0.2);
    P.cx(Mt.escuro, 1.6, 2.6, 0.2, 0, 1.4, 1.95);
    for (let i = 0; i < 5; i++) { const x = -0.45 + i * 0.22; P.cil(Mt.plain, 0.03, 0.12 + rnd() * 0.1, x, 0.05, 2.25 + rnd() * 0.1, 0xe8dcc0, 6); P.esf(Mt.aceso, 0.018, x, 0.26, 2.3, 0xffc070, 1.6); }
    luz(fx, yT + 0.7, fz + 2.6, 8, 3, 0xffb060, 6, 4);
    // fitas vermelhas amarradas nos galhos e troncos em volta (alguém volta aqui)
    for (let i = 0; i < 14; i++) { const a = rnd() * 6.283, r = 5.5 + rnd() * 7, x = T.x + Math.cos(a) * r, z = T.z + Math.sin(a) * r, Pf = peca(B, new THREE.Matrix4(), x, H(x, z), z, a); Pf.cx(Mt.tecido, 0.05, 0.5 + rnd() * 0.4, 0.02, 0, 1.6 + rnd() * 0.8, 0, 0x7a1a14, 0.15); }
  }
  // ---------- Círculo de Pedras ----------
  const C = CIRCULO, yC = H(C.x, C.z);
  {
    const matRocha = pbr('marble_cliff_05', { size: 2.5 }).clone(); matRocha.vertexColors = true;
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * 6.283, r = 9.5, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, h = 2.6 + rnd() * 1.4, caida = i === 7;
      const g = new THREE.BoxGeometry(1.2 + rnd() * 0.3, h, 0.75, 4, 10, 3), q = g.attributes.position;
      for (let kk = 0; kk < q.count; kk++) { const px = q.getX(kk), py = q.getY(kk), pz = q.getZ(kk), u = (py + h / 2) / h, j = (1 - 0.35 * u * u) * (1 + 0.09 * Math.sin(px * 4 + i) * Math.cos(py * 1.9 + pz * 5) + 0.05 * Math.sin(py * 7 + i * 3)); q.setXYZ(kk, px * j, py + (u > 0.85 ? -Math.abs(px) * 0.4 : 0), pz * j); }
      g.computeVertexNormals(); if (caida) { g.rotateX(1.48); g.translate(0, 0.32, 0); } else g.translate(0, h / 2 - 0.25, 0);
      por(B, matRocha, g, 0x9a9890, mtx(x, H(x, z), z, -a + Math.PI / 2 + (rnd() - 0.5) * 0.25));
    }
    // altar: laje sobre duas pedras, velas que ninguém acendeu, um crânio de cervo
    const P = peca(B, new THREE.Matrix4(), C.x, yC, C.z, 0.3);
    P.cx(Mt.pedra, 0.5, 0.7, 0.9, -0.8, 0.35, 0, 0x7a786e); P.cx(Mt.pedra, 0.5, 0.7, 0.9, 0.8, 0.35, 0, 0x7a786e); P.cx(Mt.pedra, 2.4, 0.18, 1.2, 0, 0.79, 0, 0x8a887e);
    for (let i = 0; i < 7; i++) { const x = -0.95 + i * 0.32, z = (rnd() - 0.5) * 0.7, hh = 0.1 + rnd() * 0.2; P.cil(Mt.plain, 0.03, hh, x, 0.88, z, 0xe8dcc0, 6); P.esf(Mt.aceso, 0.02, x, 0.88 + hh + 0.03, z, 0xffc070, 1.6); }
    P.esf(Mt.plain, 0.13, 0, 1.0, 0.2, 0xd8ccb0, 0.8); P.cx(Mt.plain, 0.1, 0.08, 0.22, 0, 0.98, 0.38, 0xc8bca0);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P.cil(Mt.plain, 0.012, 0.28, s * (0.12 + k * 0.1), 1.08 + k * 0.08, 0.15, 0xc0b498, 4, 0.006, 0, s * (0.5 + k * 0.3));
    luz(C.x, yC + 1.4, C.z, 9, 3, 0xffb870, 8, 6);
  }
  // ---------- Santuário em Ruínas ----------
  const Rr = RUINA, yR = H(Rr.x, Rr.z);
  {
    const P = peca(B, new THREE.Matrix4(), Rr.x, yR, Rr.z, Rr.ry), w = 8, d = 11;
    P.cx(Mt.lajota, w + 0.6, 0.3, d + 0.6, 0, 0.0, 0, 0x8a867c);
    const muro = (x: number, z: number, comp: number, alt: number, rot: boolean) => { for (let i = 0; i < comp; i += 0.9) { const hh = alt * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + x))) ; P.cx(Mt.muro, rot ? 0.6 : 0.95, hh, rot ? 0.95 : 0.6, rot ? x : x - comp / 2 + i + 0.45, hh / 2 + 0.15, rot ? z - comp / 2 + i + 0.45 : z, 0x8a8478); } };
    muro(-w / 2, 0, d, 3.4, true); muro(w / 2, 1.5, d - 3, 2.6, true); muro(0, -d / 2, w, 3.8, false);
    for (const s of [-1, 1]) P.cx(Mt.muro, 0.8, 4.2, 0.8, s * 1.6, 2.25, d / 2, 0x7a7468);
    P.cx(Mt.muro, 4, 0.6, 0.8, -0.4, 4.4, d / 2, 0x8a8478, 0.08);
    for (let i = 0; i < 12; i++) P.cx(Mt.pedra, 0.5 + rnd() * 0.5, 0.35, 0.4 + rnd() * 0.4, (rnd() - 0.5) * (w + 4), 0.3, (rnd() - 0.5) * (d + 4), 0x7a766c, 0, rnd());
    P.cx(Mt.pedra, 1.6, 0.9, 0.8, 0, 0.6, -d / 2 + 1.2, 0x8a867c);
    for (let i = 0; i < 4; i++) { const x = -0.5 + i * 0.33; P.cil(Mt.plain, 0.035, 0.15, x, 1.05, -d / 2 + 1.2, 0xe8dcc0, 6); P.esf(Mt.aceso, 0.02, x, 1.24, -d / 2 + 1.2, 0xffc070, 1.6); }
    const v = P.pos(0, 1.4, -d / 2 + 1.3); luz(v.x, v.y, v.z, 8, 2, 0xffb870, 7, 5);
    const est = P.pos(0, 1.05, -d / 2 + 0.7); place('gothic_statue', est.x, est.y, est.z, Rr.ry, 1.1, G).catch(() => {});
  }

  // ---------- vistas (as câmeras baixas ficam livres de árvores) ----------
  const tA = TRILHA.em(0.02), tB = TRILHA.em(0.1), tM = TRILHA.em(0.62);
  const vistas: View[] = [
    { n: 'Geral', p: [150, 110, 190], t: [0, 0, 10], fov: 50 },
    { n: 'Entrada da trilha', p: naTerra(tA.x + 1.2, tA.z + 2, 1.7), t: naTerra(tB.x, tB.z, 1.5), fov: 62 },
    { n: 'Ponte do Riacho', p: naTerra(PONTE.x + 9, PONTE.z + 7, 2.2), t: naTerra(PONTE.x, PONTE.z, 0.5), fov: 58 },
    { n: 'Riacho', p: naTerra(RIO.em(0.62).x, RIO.em(0.62).z, 1.6), t: naTerra(RIO.em(0.72).x, RIO.em(0.72).z, 0.4), fov: 62 },
    { n: 'Acampamento Abandonado', p: naTerra(A.x - 7, A.z + 7, 2.2), t: P3(A.x, yA + 0.6, A.z - 1), fov: 58 },
    { n: 'Acampamento · fogueira', p: naTerra(A.x + 1.6, A.z + 2.4, 1.1), t: P3(A.x - 2, yA + 0.4, A.z - 2.5), fov: 64 },
    { n: 'Árvore Oca', p: naTerra(T.x + 2, T.z + 15, 2), t: P3(T.x, yT + 5, T.z), fov: 60 },
    { n: 'Árvore Oca · fenda', p: naTerra(T.x + 1.2, T.z + 8.5, 1.6), t: P3(T.x, yT + 1.2, T.z + 1.9), fov: 55 },
    { n: 'Trilha na mata', p: naTerra(tM.x + 1, tM.z + 1.5, 1.7), t: naTerra(TRILHA.em(0.7).x, TRILHA.em(0.7).z, 1.5), fov: 62 },
    { n: 'Círculo de Pedras', p: naTerra(C.x + 4, C.z + 16, 2.4), t: P3(C.x, yC + 1, C.z), fov: 60 },
    { n: 'Círculo · altar', p: naTerra(C.x + 1.5, C.z + 3.2, 1.5), t: P3(C.x, yC + 0.9, C.z), fov: 58 },
    { n: 'Santuário em Ruínas', p: naTerra(Rr.x + 6, Rr.z + 13, 2.2), t: P3(Rr.x, yR + 2, Rr.z), fov: 60 },
    { n: 'Do alto da mata', p: [-60, 45, 90], t: [0, 2, -10], fov: 55 },
    { n: 'Tática', p: [0, 330, 0.1], t: [0, 0, 0], fov: 50 },
  ];
  const camLivre = (x: number, z: number) => vistas.every(v => v.p[1] > 30 || Math.hypot(x - v.p[0], z - v.p[2]) > 6);

  // ---------- árvores ----------
  const N = [2600, 3900, 5400][nivel];
  type Arv = { x: number; z: number; s: number; r: number; v: number; k: 0 | 1 | 2 };
  const arv: Arv[] = [], grade = new Map<string, number[]>(), CEL = 4;
  const perto = (x: number, z: number, sp: number) => { const gx = Math.floor(x / CEL), gz = Math.floor(z / CEL); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of grade.get((gx + a) + ',' + (gz + b)) || []) if (Math.hypot(arv[i].x - x, arv[i].z - z) < sp) return true; return false; };
  for (let t = 0; t < N * 8 && arv.length < N; t++) {
    let x: number, z: number;
    if (t % 3 === 0) { const p = TRILHA.pts[(rnd() * TRILHA.pts.length) | 0], a = rnd() * 6.283, d = 3 + rnd() * 35; x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; }
    else { x = (rnd() * 2 - 1) * (L + 15); z = (rnd() * 2 - 1) * (L + 15); }
    const m = mata(x, z); if (m < 0.2 + rnd() * 0.5) continue;
    const s = 0.75 + rnd() * 0.55; if (!camLivre(x, z) || perto(x, z, 2.2 * s + 0.6)) continue;
    const dR = RIO.dist(x, z), dC = Math.hypot(x - C.x, z - C.z), alto = H(x, z) > 2.5;
    const k: 0 | 1 | 2 = rnd() < (dC < 40 ? 0.55 : 0.12) ? 2 : rnd() < (dR < 25 ? 0.75 : alto ? 0.2 : 0.45) ? 1 : 0;
    const k2 = Math.floor(x / CEL) + ',' + Math.floor(z / CEL); if (!grade.has(k2)) grade.set(k2, []); grade.get(k2)!.push(arv.length);
    arv.push({ x, z, s, r: rnd() * 6.283, v: (rnd() * 3) | 0, k });
  }
  const colGeo: THREE.BufferGeometry[] = [];
  for (const t of arv) if (TRILHA.dist(t.x, t.z) < 30) { const g = new THREE.CylinderGeometry(0.3 * t.s, 0.3 * t.s, 4, 6); g.translate(t.x, H(t.x, t.z) + 2, t.z); g.deleteAttribute('uv'); g.deleteAttribute('normal'); colGeo.push(g.toNonIndexed()); }
  const matArv = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.3, side: THREE.DoubleSide });
  const matMorta = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, envMapIntensity: 0.25 });
  const matFolha = new THREE.MeshStandardMaterial({ map: folhaTex(), vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, envMapIntensity: 0.35 });
  const Arvores = new THREE.Group(); Arvores.name = 'Árvores'; G.add(Arvores);
  for (const k of [0, 1, 2] as const) for (let v = 0; v < 3; v++) {
    const f = k === 1 ? folhosa(v) : k === 0 ? pinheiro(v) : null, pecas: [THREE.BufferGeometry, THREE.Material][] = k === 0 ? [[f!.tronco, matArv], [f!.copa, matFolha]] : k === 1 ? [[f!.tronco, matArv], [f!.copa, matFolha]] : [[morta(v), matMorta]];
    const lista = arv.filter(t => t.k === k && t.v === v), by = new Map<string, Arv[]>();
    lista.forEach(t => { const kk = Math.floor(t.x / 55) + ',' + Math.floor(t.z / 55); if (!by.has(kk)) by.set(kk, []); by.get(kk)!.push(t); });
    by.forEach(Ls => {
      const o = new THREE.Object3D(), ms = Ls.map(t => { o.position.set(t.x, H(t.x, t.z) - 0.15, t.z); o.rotation.set((rnd() - 0.5) * 0.06, t.r, (rnd() - 0.5) * 0.06); o.scale.setScalar(t.s); o.updateMatrix(); return o.matrix.clone(); });
      for (const [geo, mat] of pecas) {
        const im = new THREE.InstancedMesh(geo, mat, Ls.length); ms.forEach((m, i) => im.setMatrixAt(i, m));
        im.castShadow = nivel > 0; im.receiveShadow = true; im.computeBoundingSphere(); im.userData.cullDist = 420; im.userData.canopy = 1; im.userData.ns = 1; Arvores.add(im);
      }
    });
  }

  // ---------- troncos caídos com musgo e cogumelos ----------
  const espalha = (n: number, d0: number, d1: number, linhas: Linha[] = [TRILHA, RAMAL_CAMPO, RAMAL_ARVORE, RAMAL_RUINA], minMata = 0.3) => {
    const out: Xf[] = [];
    for (let t = 0; t < n * 30 && out.length < n; t++) {
      const lin = linhas[(rnd() * linhas.length) | 0], p = lin.pts[(rnd() * lin.pts.length) | 0], a = rnd() * 6.283, d = d0 + rnd() * (d1 - d0), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (mata(x, z) < minMata || !camLivre(x, z) || Math.abs(x) > L || Math.abs(z) > L) continue;
      out.push({ x, y: H(x, z) - 0.03, z, ry: rnd() * 6.283, s: 0.8 + rnd() * 0.5 });
    }
    return out;
  };
  for (const t of espalha(nivel ? 70 : 45, 3, 30)) {
    const comp = 4 + rnd() * 6, r = 0.25 + rnd() * 0.25, m = mtx(t.x, t.y + r * 0.7, t.z, t.ry!);
    const g = new THREE.CylinderGeometry(r * 0.85, r, comp, 9, 4); g.rotateZ(Math.PI / 2); const q = g.attributes.position;
    for (let k = 0; k < q.count; k++) q.setY(k, q.getY(k) * (1 + 0.1 * Math.sin(q.getX(k) * 2.3)));
    por(B, Mt.madeira, g, 0x4a3e30, m);
    const musgo = new THREE.BoxGeometry(comp * 0.8, 0.04, r * 1.1); musgo.translate(0, r * 0.95, 0); por(B, Mt.plain, musgo, 0x3a4a22, m);
    if (rnd() < 0.6) for (let c = 0; c < 4 + rnd() * 5; c++) { const P = peca(B, m, (rnd() - 0.5) * comp * 0.7, r * 0.6, r * (rnd() < 0.5 ? 1 : -1), rnd() * 6); P.cil(Mt.plain, 0.012, 0.06, 0, 0, 0, 0xd8ccb0, 5); P.esf(Mt.plain, 0.035 + rnd() * 0.03, 0, 0.07, 0, rnd() < 0.3 ? 0x8a3a20 : 0xb8a080, 0.45); }
  }
  // anel de cogumelos no Círculo (de dia comum; de noite brilha de leve)
  const matFungo = new THREE.MeshStandardMaterial({ color: 0xc8d8c0, roughness: 0.6, emissive: 0x4a8a7a, emissiveIntensity: 0 });
  {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 70; i++) { const a = i / 70 * 6.283 + rnd() * 0.05, r = 5.2 + rnd() * 0.4, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, y = H(x, z), s = 0.7 + rnd() * 0.6;
      const st = new THREE.CylinderGeometry(0.012 * s, 0.016 * s, 0.07 * s, 5); st.translate(x, y + 0.035 * s, z); const cap = new THREE.SphereGeometry(0.04 * s, 7, 4, 0, 6.283, 0, 1.6); cap.translate(x, y + 0.07 * s, z); parts.push(st.toNonIndexed(), cap.toNonIndexed()); }
    parts.forEach(p => p.deleteAttribute('uv')); const fung = new THREE.Mesh(mergeGeometries(parts)!, matFungo); fung.name = 'Anel de cogumelos'; G.add(fung);
  }

  B.build(G);

  // ---------- sub-bosque (modelos), pedras e capim ----------
  const k = [0.55, 1, 1.35][nivel], carga: Promise<unknown>[] = [], vai = (p: Promise<unknown>) => carga.push(p.catch(() => {}));
  const V = { amp: 0.04, freq: 1.4, flutter: 0.01 };
  vai(instanceVariants('fern_02', espalha(Math.round(300 * k), 2.3, 34), G, { shadow: false, wind: V, tile: 30, cullDist: 70 }));
  vai(instance('shrub_01', espalha(Math.round(50 * k), 3, 30), G, { shadow: false, wind: V, tile: 30, cullDist: 90 }));
  vai(instance('shrub_03', espalha(Math.round(60 * k), 3, 30), G, { shadow: false, wind: V, tile: 30, cullDist: 90 }));
  vai(instance('shrub_04', espalha(Math.round(40 * k), 3, 30), G, { shadow: false, wind: V, tile: 30, cullDist: 90 }));
  vai(instance('nettle_plant', espalha(Math.round(60 * k), 2.2, 14), G, { shadow: false, wind: V, tile: 30, cullDist: 50 }));
  vai(instance('moss_01', espalha(Math.round(70 * k), 2.5, 22), G, { shadow: false, tile: 30, cullDist: 50 }));
  vai(instance('root_cluster_01', espalha(Math.round(24 * k), 2.8, 18), G, { tile: 40, cullDist: 80 }));
  vai(instance('dry_branches_medium_01', espalha(Math.round(50 * k), 2.2, 18), G, { shadow: false, tile: 30, cullDist: 60 }));
  for (const id of ['island_tree_01_lod1', 'island_tree_02_lod1', 'island_tree_03_lod1']) vai(instance(id, espalha([8, 14, 20][nivel], 5, 16, [TRILHA, RAMAL_CAMPO, RAMAL_RUINA], 0.6).map(t => ({ ...t, s: 0.8 + rnd() * 0.4 })), G, { tile: 40, cullDist: 120, shadow: nivel > 0 }));
  vai(instance('tree_stump_01', espalha(26, 3, 26), G, { tile: 40, cullDist: 100 }));
  vai(instance('dead_tree_trunk', espalha(10, 4, 26), G, { tile: 40, cullDist: 140 }));
  vai(instanceVariants('rock_moss_set_01', espalha(Math.round(40 * k), 3, 30), G, { tile: 40, cullDist: 110 }));
  // pedras na beira do riacho
  vai(instanceVariants('rock_moss_set_01', espalha(Math.round(60 * k), 2.6, 6, [RIO], 0).map(t => ({ ...t, y: t.y - 0.25, s: 0.9 + rnd() * 0.9 })), G, { tile: 40, cullDist: 110 }));
  vai(instance('boulder_01', espalha(5, 8, 40).map(t => ({ ...t, s: 0.6 + rnd() * 0.5, y: t.y - 0.3 })), G, { tile: 50, cullDist: 160 }));
  vai(instance('wooden_crate_01', [{ x: A.x + 1.4, y: yA, z: A.z + 3.2, ry: 0.4 }, { x: A.x + 2.1, y: yA, z: A.z + 2.6, ry: 1.2, s: 0.8 }], G, {}));
  vai(place('wooden_lantern_01', A.x - 2.5, yA + 1.8, A.z + 2.8, 0, 1, G));
  if (Q.grama) G.add(grassField({
    count: [5000, 8000, 11000][nivel], area: [-L, L, -L, L], height: H, colors: [0x3e4a2a, 0x46502e, 0x384226, 0x50522e],
    allow: (x, z) => { const m = mata(x, z), dR = RIO.dist(x, z), dT = TRILHA.dist(x, z); if (dR < 3.6 || dT < 1.6) return 0; return dR < 9 || dT < 4 ? 0.9 : m < 0.5 ? 0.6 : 0.12; },
    tall: (x, z) => (RIO.dist(x, z) < 9 ? 1.8 : 1.2), cullDist: 45,
  }));
  await Promise.all(carga);

  // ---------- vaga-lumes (noite) e folhas caindo ----------
  const NV = nivel ? 380 : 220, vg = new THREE.BufferGeometry(), vp = new Float32Array(NV * 3), vb: number[] = [];
  for (let i = 0; i < NV; i++) { const lin = rnd() < 0.6 ? RIO : TRILHA, p = lin.pts[(rnd() * lin.pts.length) | 0], x = p.x + (rnd() - 0.5) * 18, z = p.z + (rnd() - 0.5) * 18; vb.push(x, H(x, z) + 0.4 + rnd() * 2.2, z); }
  vg.setAttribute('position', new THREE.BufferAttribute(vp, 3));
  const vMat = new THREE.PointsMaterial({ color: 0xc8f070, size: 0.09, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const vag = new THREE.Points(vg, vMat); vag.frustumCulled = false; vag.userData.ns = 1; vag.userData.noExport = 1; vag.name = 'Vaga-lumes'; G.add(vag);
  const NF = 260, fg = new THREE.BufferGeometry(), fp = new Float32Array(NF * 3), fo = Array.from({ length: NF }, () => [rnd() * 40 - 20, rnd() * 14, rnd() * 40 - 20, rnd() * 6.283]);
  fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fMat = new THREE.PointsMaterial({ color: 0x8a6a3a, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false });
  const folhas = new THREE.Points(fg, fMat); folhas.frustumCulled = false; folhas.userData.ns = 1; folhas.userData.noExport = 1; folhas.name = 'Folhas caindo'; G.add(folhas);

  // ---------- colisões, chão, fichas, luzes e animação (montagem comum) ----------
  const colisor = new THREE.Mesh(mergeGeometries(colGeo)!, new THREE.MeshBasicMaterial({ visible: false })); colisor.userData.ns = 1; G.add(colisor);
  M.solid = () => [colisor]; M.walk.push(ter.collider);
  const R4 = (c: { x: number; z: number; r: number }): [number, number, number, number] => [c.x - c.r - 3, c.x + c.r + 3, c.z - c.r - 3, c.z + c.r + 3];
  const areas: Record<string, [number, number, number, number]> = { acampamento: R4(A), arvore: R4(T), circulo: R4(C), ruina: R4(Rr), ponte: [PONTE.x - 9, PONTE.x + 9, PONTE.z - 9, PONTE.z + 9] };
  const marcas: Record<string, [number, number, number]> = { floresta: [0, 40, 0], acampamento: P3(A.x, yA + 6, A.z), arvore: P3(T.x, yT + 24, T.z), circulo: P3(C.x, yC + 7, C.z), ruina: P3(Rr.x, yR + 8, Rr.z), ponte: P3(PONTE.x, H(PONTE.x, PONTE.z) + 6, PONTE.z) };
  const nev: { x: number; z: number; y?: number; op?: number; cor?: number }[] = [];
  for (let i = 0; i < 26; i++) { const p = RIO.em(i / 25); nev.push({ x: p.x, z: p.z, y: nivelAgua(RIO.perto(p.x, p.z).i) + 0.3, op: 0.14, cor: 0xa8b0b8 }); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; nev.push({ x: C.x + Math.cos(a) * 12, z: C.z + Math.sin(a) * 12, y: yC, op: 0.12 }); }
  montar(M, {
    chamines: [], vistas, predios: [], locais: LOCAIS_F, npcs: NPCS_F, imgs: {}, prefixo: 'fl_', nevoa: nev,
    areaDe: id => areas[id], marcaDe: id => marcas[id],
    vtt: { areas: [{ n: 'Floresta inteira', b: [-L, L, -L, L], lv: 1 }, ...Object.entries(areas).map(([id, b]) => ({ n: LOCAIS_F.find(l => l.id === id)?.n ?? id, b, lv: 1 }))], walls: [], portals: [] },
    spawn: [tA.x + 0.5, tA.z - 2], luar: 0.7,
  });
  // os NPCs da floresta ficam no chão de verdade (montar os põe em y = 0)
  const npcs0 = M.npcs!; M.npcs = async () => (await npcs0()).map(d => (d.pos ? { ...d, pos: { ...d.pos, y: H(d.pos.x, d.pos.z) + 0.05 } } : d));
  M.spawn = i => { const x = tA.x + 0.5 + (i % 3) * 1.2, z = tA.z - 2 - Math.floor(i / 3) * 1.2; return { x, z, y: H(x, z) + 0.05 }; };
  let noite = 0;
  const onTime0 = M.onTime!, tick0 = M.tick!;
  M.onTime = p => { onTime0(p); noite = p.lamps > 0 ? 1 : 0; matFungo.emissiveIntensity = noite ? 0.9 : 0; };
  M.tick = (dt, t) => {
    tick0(dt, t); tempo.value = t;
    vMat.opacity += ((noite ? 0.95 : 0) - vMat.opacity) * Math.min(1, dt * 2);
    if (vMat.opacity > 0.01) for (let i = 0; i < NV; i++) { const f = t * 0.6 + i * 1.7; vp[i * 3] = vb[i * 3] + Math.sin(f) * 0.8; vp[i * 3 + 1] = vb[i * 3 + 1] + Math.sin(f * 1.3 + i) * 0.35; vp[i * 3 + 2] = vb[i * 3 + 2] + Math.cos(f * 0.8) * 0.8; }
    vg.attributes.position.needsUpdate = true;
    // folhas: um volume de 40 m em volta da câmera que se repete (caem girando devagar; seguem a altura da câmera)
    const c = cam.position;
    for (let i = 0; i < NF; i++) { const o = fo[i], y = 14 - ((t * 0.45 + o[1]) % 14), wx = c.x + ((o[0] - c.x) % 40 + 60) % 40 - 20, wz = c.z + ((o[2] - c.z) % 40 + 60) % 40 - 20;
      fp[i * 3] = wx + Math.sin(t * 0.8 + o[3]) * 0.6; fp[i * 3 + 2] = wz + Math.cos(t * 0.6 + o[3]) * 0.6; fp[i * 3 + 1] = c.y - 3 + y; }
    fg.attributes.position.needsUpdate = true;
  };
  M.layers = [{ n: 'Árvores', o: Arvores, v: true }];
  M.exportHide = () => [Arvores];
  M.shadowRadius = Q.luzes > 8 ? 70 : 50; M.walkLimit = L + 10; M.camMax = 420; M.fogScale = 0.85;
}
