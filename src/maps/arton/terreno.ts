// Sul de Arton — terreno do mapa regional: relevo (3 texturas aéreas + cor por bioma), mar com espuma e ondas,
// lago, rios, estradas, trilhas, pontes (cruzamentos), fronteiras que brilham, moldura de pergaminho e a mesa.
import * as THREE from 'three';
import { terrainMaterial } from '../../core/terrain';
import { pbr } from '../../core/pbr';
import { CFG } from '../../core/config';
import {
  type P, LIM, G, Y, Ysolo, construirGrade, PERFIS, LAGO, ESTRADAS, TRILHAS, UIVANTES, TOLLON, LOMATUBAR, DEHEON,
  suaviza, KM_POR_UNIDADE, clamp,
} from './geo';

const Q = CFG.quality;
export const tempo = { value: 0 };

// ---------- fita (estradas, rios, fronteiras, rotas) ----------
/** fita deitada sobre o relevo: y(x,z,i) dá a altura de cada vértice */
export function fita(pts: P[], larg: number | ((i: number) => number), y: (x: number, z: number, i: number) => number, tracejado?: [number, number]) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let acc = 0, base = -1;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1;
    const nx = -tz / L, nz = tx / L, hw = (typeof larg === 'number' ? larg : larg(i)) / 2, [x, z] = pts[i];
    if (i) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    const vis = !tracejado || (acc % (tracejado[0] + tracejado[1])) < tracejado[0];
    const x1 = x + nx * hw, z1 = z + nz * hw, x2 = x - nx * hw, z2 = z - nz * hw;
    pos.push(x1, y(x1, z1, i), z1, x2, y(x2, z2, i), z2); uv.push(acc, 0, acc, 1);
    const k = pos.length / 3 - 2;
    if (base >= 0 && vis) idx.push(base, k, base + 1, base + 1, k, k + 1);
    base = k;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- pontes: onde estradas/trilhas cruzam rios ----------
export interface Ponte { x: number; z: number; a: number; L: number; y: number; trilha: boolean }
export const PONTES: Ponte[] = [];
function acharPontes() {
  PONTES.length = 0;
  const hash = new Map<string, { x: number; z: number; w: number }[]>(), K = (x: number, z: number) => Math.floor(x / 2) + ',' + Math.floor(z / 2);
  PERFIS.forEach(R => R.pts.forEach(([x, z], i) => { const k = K(x, z); if (!hash.has(k)) hash.set(k, []); hash.get(k)!.push({ x, z, w: R.larg[i] }); }));
  const busca = (lista: P[][], trilha: boolean) => lista.forEach(rua => {
    let ini = -1, wmax = 0;
    for (let i = 0; i <= rua.length; i++) {
      let hit = false;
      if (i < rua.length) {
        const [x, z] = rua[i], cx = Math.floor(x / 2), cz = Math.floor(z / 2);
        for (let a = -1; a <= 1 && !hit; a++) for (let b = -1; b <= 1 && !hit; b++) for (const p of hash.get((cx + a) + ',' + (cz + b)) || []) if (Math.hypot(p.x - x, p.z - z) < p.w + 0.6) { hit = true; wmax = Math.max(wmax, p.w); break; }
      }
      if (hit && ini < 0) ini = i;
      if (!hit && ini >= 0) {
        const m = Math.floor((ini + i - 1) / 2), [x, z] = rua[m], A = rua[Math.max(0, ini - 2)], B = rua[Math.min(rua.length - 1, i + 1)];
        const L = Math.hypot(B[0] - A[0], B[1] - A[1]) + 1.6, y = Math.max(Ysolo(A[0], A[1]), Ysolo(B[0], B[1])) + 0.12;
        if (!PONTES.some(p => Math.hypot(p.x - x, p.z - z) < 3)) PONTES.push({ x, z, a: Math.atan2(B[0] - A[0], B[1] - A[1]), L: Math.max(L, wmax * 2 + 2.4), y, trilha });
        ini = -1; wmax = 0;
      }
    }
  });
  busca(ESTRADAS, false); busca(TRILHAS, true);
}
/** altura de estrada: sobe para o tabuleiro perto das pontes */
function yRua(x: number, z: number, ergue: number) {
  let y = Ysolo(x, z) + ergue;
  for (const p of PONTES) { const d = Math.hypot(p.x - x, p.z - z); if (d < p.L / 2 + 1.5) y = Math.max(y, p.y + 0.18 - Math.max(0, d - p.L / 2) * 0.12); }
  return y;
}

// ---------- relevo ----------
export function construirRelevo(Gr: THREE.Group) {
  const g0 = construirGrade(), { cols, rows, passo } = g0, n = cols * rows;
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i, x = LIM.x0 + i * passo, z = LIM.z0 + j * passo; pos[k * 3] = x; pos[k * 3 + 1] = g0.h[k]; pos[k * 3 + 2] = z; uv[k * 2] = x; uv[k * 2 + 1] = -z; }
  const idx = new Uint32Array((cols - 1) * (rows - 1) * 6); let o = 0;
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(g0.cor, 3)); geo.setAttribute('splat', new THREE.BufferAttribute(g0.splat, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const mat = terrainMaterial({ size: 0, seg: 0, height: () => 0, mask: () => [0, 0], base: { id: 'aerial_grass_rock', size: 9 }, r: { id: 'marble_cliff_05', size: 12 }, g: { id: 'snow_02', size: 7 }, normalScale: 1.25 });
  mat.vertexColors = true; mat.envMapIntensity = 0.55;
  const me = new THREE.Mesh(geo, mat); me.receiveShadow = true; me.castShadow = true; me.name = 'Relevo'; me.userData.ns = 1; Gr.add(me);
  // colisor leve (arrastar personagens, duplo clique, caminhar)
  const cs = 4, cc = Math.round((LIM.x1 - LIM.x0) / cs) + 1, cr = Math.round((LIM.z1 - LIM.z0) / cs) + 1;
  const cg = new THREE.PlaneGeometry(LIM.x1 - LIM.x0, LIM.z1 - LIM.z0, cc - 1, cr - 1); cg.rotateX(-Math.PI / 2);
  const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setY(i, Y(cp.getX(i), cp.getZ(i)));
  cg.computeBoundingSphere(); cg.computeBoundingBox();
  const col = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false })); col.userData.ns = 1; col.userData.noExport = 1; Gr.add(col);
  // superfície do mar para os personagens não afundarem
  const sp = new THREE.PlaneGeometry(LIM.x1 - LIM.x0, LIM.z1 - LIM.z0); sp.rotateX(-Math.PI / 2);
  const piso = new THREE.Mesh(sp, new THREE.MeshBasicMaterial({ visible: false })); piso.userData.ns = 1; piso.userData.noExport = 1; Gr.add(piso);
  acharPontes();
  return { relevo: me, colisores: [col, piso] };
}

// ---------- mar ----------
const GLSL_RUIDO = /* glsl */ `
float hs2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hs2(i), hs2(i + vec2(1, 0)), u.x), mix(hs2(i + vec2(0, 1)), hs2(i + vec2(1, 1)), u.x), u.y); }`;
export function construirMar(Gr: THREE.Group) {
  // textura com a distância até a terra (0 na costa, 1 a 26 unidades ou mais)
  const N = Q === 'baixa' ? 192 : 288, Mz = Math.round(N * (LIM.z1 - LIM.z0) / (LIM.x1 - LIM.x0)), sx = (LIM.x1 - LIM.x0) / N, sz = (LIM.z1 - LIM.z0) / Mz;
  const d = new Float32Array(N * Mz);
  for (let j = 0; j < Mz; j++) for (let i = 0; i < N; i++) d[j * N + i] = Y(LIM.x0 + (i + 0.5) * sx, LIM.z0 + (j + 0.5) * sz) > 0.02 ? 0 : 1e9;
  const pass = (fwd: boolean) => { // chanfro 3-4 (aproxima a distância euclidiana)
    for (let jj = 0; jj < Mz; jj++) for (let ii = 0; ii < N; ii++) {
      const j = fwd ? jj : Mz - 1 - jj, i = fwd ? ii : N - 1 - ii, k = j * N + i, s = fwd ? -1 : 1; let v = d[k];
      const ok = (a: number, b: number) => a >= 0 && a < N && b >= 0 && b < Mz;
      if (ok(i + s, j)) v = Math.min(v, d[j * N + i + s] + 1); if (ok(i, j + s)) v = Math.min(v, d[(j + s) * N + i] + 1);
      if (ok(i + s, j + s)) v = Math.min(v, d[(j + s) * N + i + s] + 1.414); if (ok(i - s, j + s)) v = Math.min(v, d[(j + s) * N + i - s] + 1.414);
      d[k] = v;
    }
  };
  pass(true); pass(false);
  const data = new Uint8Array(N * Mz); for (let k = 0; k < d.length; k++) data[k] = Math.round(clamp((d[k] * sx) / 26) * 255);
  const tex = new THREE.DataTexture(data, N, Mz, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const g = new THREE.PlaneGeometry(LIM.x1 - LIM.x0, LIM.z1 - LIM.z0, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: 0x0e3036, roughness: 0.3, metalness: 0.04, envMapIntensity: 0.42 });
  m.customProgramCacheKey = () => 'mar-arton';
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = tempo; sh.uniforms.tD = { value: tex }; sh.uniforms.uLim = { value: new THREE.Vector4(LIM.x0, LIM.z0, LIM.x1 - LIM.x0, LIM.z1 - LIM.z0) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMar;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvMar = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uT; uniform sampler2D tD; uniform vec4 uLim; varying vec3 vMar; float espuma = 0.0;\n${GLSL_RUIDO}`)
      .replace('#include <color_fragment>', `
  vec2 pm = vMar.xz; vec2 uvd = (pm - uLim.xy) / uLim.zw;
  float dl = texture2D(tD, uvd).r;
  float nn = vn(pm * 0.16 + uT * 0.04);
  float banda = smoothstep(0.72, 1.0, sin(dl * 62.0 - uT * 1.3 + nn * 5.0) * 0.5 + 0.5) * smoothstep(0.17, 0.03, dl);
  espuma = clamp(smoothstep(0.05, 0.0, dl) * 0.9 + banda * 0.6, 0.0, 1.0);
  vec3 raso = vec3(0.05, 0.17, 0.17), fundo = vec3(0.008, 0.04, 0.05), azul = vec3(0.004, 0.012, 0.045);
  vec3 cm = mix(raso, fundo, smoothstep(0.0, 0.42, dl));
  float man = vn(pm * 0.017 + 3.0) * 0.6 + vn(pm * 0.05) * 0.4;
  cm = mix(cm, azul, smoothstep(0.48, 0.74, man) * smoothstep(0.25, 0.8, dl));
  diffuseColor.rgb = mix(cm, vec3(0.86, 0.9, 0.9), espuma);`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(roughness, 0.85, espuma);')
      .replace('#include <normal_fragment_maps>', `
  { vec2 q = vMar.xz; vec2 gr = vec2(0.0);
    gr += 0.050 * 0.55 * cos(dot(q, vec2(0.80, 0.60)) * 0.55 + uT * 0.9) * vec2(0.80, 0.60);
    gr += 0.040 * 0.90 * cos(dot(q, vec2(-0.45, 0.89)) * 0.90 + uT * 1.3) * vec2(-0.45, 0.89);
    gr += 0.025 * 1.70 * cos(dot(q, vec2(0.97, -0.24)) * 1.70 + uT * 1.9) * vec2(0.97, -0.24);
    gr += 0.015 * 3.10 * cos(dot(q, vec2(-0.7, -0.71)) * 3.10 + uT * 2.6) * vec2(-0.7, -0.71);
    vec3 nW = normalize(vec3(-gr.x, 1.0, -gr.y));
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }`);
  };
  const mar = new THREE.Mesh(g, m); mar.receiveShadow = true; mar.userData.ns = 1; mar.name = 'Mar Negro'; Gr.add(mar);
  // lago de montanha (meio congelado: borda branca)
  const lg = new THREE.CircleGeometry(1, 48); lg.rotateX(-Math.PI / 2); lg.scale(LAGO.rx * 1.15, 1, LAGO.rz * 1.15); lg.translate(LAGO.x, LAGO.nivel, LAGO.z);
  const lp = lg.attributes.position, lc = new Float32Array(lp.count * 3);
  for (let i = 0; i < lp.count; i++) { const e = Math.hypot((lp.getX(i) - LAGO.x) / LAGO.rx, (lp.getZ(i) - LAGO.z) / LAGO.rz), k = clamp((e - 0.55) / 0.5); lc.set([0.25 + 0.7 * k, 0.4 + 0.58 * k, 0.48 + 0.52 * k], i * 3); }
  lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const lago = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.1, envMapIntensity: 1.2 })); lago.receiveShadow = true; lago.userData.ns = 1; Gr.add(lago);
  return mar;
}

// ---------- rios, estradas, trilhas ----------
export function construirAguasEcaminhos(Gr: THREE.Group) {
  const agua = new THREE.MeshStandardMaterial({ color: 0x143840, roughness: 0.14, metalness: 0.05, envMapIntensity: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const rios = new THREE.Group(); rios.name = 'Rios';
  PERFIS.forEach(R => { const g = fita(R.pts, i => R.larg[i] * 2.1, (_x, _z, i) => R.y[i] - 0.08); const m = new THREE.Mesh(g, agua); m.receiveShadow = true; m.userData.ns = 1; rios.add(m); });
  Gr.add(rios);
  const terra = pbr('dry_ground_rocks', { size: 3, color: 0x8a7458 }).clone(); terra.polygonOffset = true; terra.polygonOffsetFactor = -4; terra.polygonOffsetUnits = -4;
  const trilhaM = pbr('dry_ground_rocks', { size: 3, color: 0xa08a68 }).clone(); trilhaM.polygonOffset = true; trilhaM.polygonOffsetFactor = -4; trilhaM.polygonOffsetUnits = -4;
  const ruas = new THREE.Group(); ruas.name = 'Estradas';
  const add = (gs: THREE.BufferGeometry[], m: THREE.Material) => gs.forEach(g => { const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.userData.ns = 1; ruas.add(me); });
  add(ESTRADAS.map(r => fita(r, 0.62, (x, z) => yRua(x, z, 0.06))), terra);
  add(TRILHAS.map(r => fita(r, 0.36, (x, z) => yRua(x, z, 0.05))), trilhaM);
  Gr.add(ruas);
  return { rios, ruas };
}

// ---------- fronteiras pintadas que brilham ----------
const insete = (P: P[], d: number): P[] => {
  let area = 0; for (let i = 0; i < P.length; i++) { const [a, b] = P[i], [c, e] = P[(i + 1) % P.length]; area += a * e - c * b; }
  const s = area > 0 ? 1 : -1;
  return P.map((p, i) => {
    const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length], n1 = [-(p[1] - a[1]), p[0] - a[0]], n2 = [-(b[1] - p[1]), b[0] - p[0]];
    const l1 = Math.hypot(n1[0], n1[1]) || 1, l2 = Math.hypot(n2[0], n2[1]) || 1, nx = n1[0] / l1 + n2[0] / l2, nz = n1[1] / l1 + n2[1] / l2, ln = Math.hypot(nx, nz) || 1;
    return [p[0] + (s * nx / ln) * d, p[1] + (s * nz / ln) * d] as P;
  });
};
export const CORES_REGIAO = { uiv: [0.55, 0.88, 1.7], tollon: [0.3, 1.7, 0.45], lom: [1.8, 1.4, 0.22], deh: [1.15, 0.45, 1.7] } as const;
export function construirFronteiras(Gr: THREE.Group) {
  const grupo = new THREE.Group(); grupo.name = 'Fronteiras';
  const regs: [P[], keyof typeof CORES_REGIAO][] = [[UIVANTES, 'uiv'], [TOLLON, 'tollon'], [LOMATUBAR, 'lom'], [DEHEON, 'deh']];
  for (const [poly, k] of regs) {
    const c = CORES_REGIAO[k], P = insete(poly, -1.1);
    // quebra onde a linha corre pela borda do mapa
    const trechos: P[][] = []; let cur: P[] = [];
    for (let i = 0; i <= P.length; i++) { const p = P[i % P.length], naBorda = p[0] > LIM.x1 - 3 || p[0] < LIM.x0 + 3; if (naBorda) { if (cur.length > 1) trechos.push(cur); cur = []; } else cur.push(p); }
    if (cur.length > 1) trechos.push(cur);
    const nucleo = new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    const brilho = new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] * 0.6, c[1] * 0.6, c[2] * 0.6), transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
    for (const t of trechos) {
      const s = suaviza(t, 0.6, 0.9), alt = (x: number, z: number) => Math.max(Y(x, z), 0) + 0.32;
      const a = new THREE.Mesh(fita(s, 0.5, alt), nucleo), b = new THREE.Mesh(fita(s, 2.4, (x, z) => alt(x, z) - 0.05), brilho);
      a.renderOrder = 3; b.renderOrder = 2; a.userData.ns = b.userData.ns = 1; a.userData.noExport = b.userData.noExport = 1; grupo.add(a, b);
    }
  }
  Gr.add(grupo);
  return grupo;
}

// ---------- rótulos (nomes em letra serifada) ----------
export function rotulo(txt: string, alt: number, o: { cor?: string; borda?: string; esp?: number; italico?: boolean; peso?: string } = {}) {
  const fs = 96, c = document.createElement('canvas'), g = c.getContext('2d')!, fonte = `${o.italico ? 'italic ' : ''}${o.peso ?? '600'} ${fs}px Georgia, 'Times New Roman', serif`;
  g.font = fonte; const esp = (o.esp ?? 0) * fs, letras = [...txt], wl = letras.map(l => g.measureText(l).width), W0 = wl.reduce((a, b) => a + b, 0) + esp * (letras.length - 1);
  c.width = Math.ceil(W0 + 48); c.height = Math.ceil(fs * 1.45);
  g.font = fonte; g.textBaseline = 'middle'; g.lineJoin = 'round';
  let x = 24; const y = c.height / 2;
  g.strokeStyle = o.borda ?? 'rgba(30,20,10,0.85)'; g.lineWidth = fs * 0.16; for (let i = 0; i < letras.length; i++) { g.strokeText(letras[i], x, y); x += wl[i] + esp; }
  x = 24; g.fillStyle = o.cor ?? '#f3e6c8'; for (let i = 0; i < letras.length; i++) { g.fillText(letras[i], x, y); x += wl[i] + esp; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, fog: false }));
  s.center.set(0.5, 0); s.scale.set((alt * c.width) / c.height, alt, 1); s.renderOrder = 20; s.userData.ns = 1; s.userData.noExport = 1; s.userData.base = alt; s.userData.asp = c.width / c.height;
  return s;
}

// ---------- moldura de pergaminho, bandeja de madeira e mesa ----------
export const MOLD = { x0: LIM.x0 - 22, x1: LIM.x1 + 22, z0: LIM.z0 - 38, z1: LIM.z1 + 48, y: 1.15 };
export function desenharMoldura(canvas: HTMLCanvasElement, kmPorUn = KM_POR_UNIDADE) {
  const g = canvas.getContext('2d')!, Wc = canvas.width, Hc = canvas.height, sx = Wc / (MOLD.x1 - MOLD.x0), U = (x: number) => (x - MOLD.x0) * sx, V = (z: number) => (z - MOLD.z0) * sx;
  let sd = 77; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  // papel envelhecido
  const grd = g.createRadialGradient(Wc / 2, Hc / 2, Wc * 0.2, Wc / 2, Hc / 2, Wc * 0.85); grd.addColorStop(0, '#e2d2ac'); grd.addColorStop(0.7, '#d2bc8c'); grd.addColorStop(1, '#9c7f52');
  g.fillStyle = grd; g.fillRect(0, 0, Wc, Hc);
  for (let i = 0; i < 260; i++) { const x = r() * Wc, y = r() * Hc, rad = (8 + r() * 90) * sx / 4; const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, `rgba(110,80,40,${0.03 + r() * 0.07})`); rg.addColorStop(1, 'rgba(110,80,40,0)'); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.strokeStyle = 'rgba(90,60,30,0.07)'; g.lineWidth = 1; for (let i = 0; i < 900; i++) { const x = r() * Wc, y = r() * Hc; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 6); g.stroke(); }
  for (let i = 0; i < 3; i++) { const x = r() * Wc, y = r() < 0.5 ? r() * V(LIM.z0) : V(LIM.z1) + r() * (Hc - V(LIM.z1)), rad = (14 + r() * 10) * sx; g.strokeStyle = 'rgba(100,62,28,0.18)'; g.lineWidth = rad * 0.08; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.stroke(); } // manchas de caneca
  const queim = g.createLinearGradient(0, 0, 0, Hc); queim.addColorStop(0, 'rgba(60,35,15,0.45)'); queim.addColorStop(0.03, 'rgba(60,35,15,0)'); queim.addColorStop(0.97, 'rgba(60,35,15,0)'); queim.addColorStop(1, 'rgba(60,35,15,0.45)'); g.fillStyle = queim; g.fillRect(0, 0, Wc, Hc);
  // bordas duplas e graduação em volta do mapa
  const ix0 = U(LIM.x0), ix1 = U(LIM.x1), iz0 = V(LIM.z0), iz1 = V(LIM.z1), m = 2.2 * sx;
  g.strokeStyle = '#3e2a16'; g.lineWidth = 0.9 * sx; g.strokeRect(ix0 - m, iz0 - m, ix1 - ix0 + 2 * m, iz1 - iz0 + 2 * m);
  g.lineWidth = 0.35 * sx; g.strokeRect(ix0 - m * 2.6, iz0 - m * 2.6, ix1 - ix0 + 5.2 * m, iz1 - iz0 + 5.2 * m);
  g.fillStyle = '#3e2a16'; for (let x = LIM.x0; x <= LIM.x1; x += 10) { const k = Math.round((x - LIM.x0) / 10) % 2; if (k) { g.fillRect(U(x), iz0 - m * 2.6, 10 * sx, m * 1.6); g.fillRect(U(x), iz1 + m, 10 * sx, m * 1.6); } }
  for (let z = LIM.z0; z <= LIM.z1; z += 10) { const k = Math.round((z - LIM.z0) / 10) % 2; if (k) { g.fillRect(ix0 - m * 2.6, V(z), m * 1.6, 10 * sx); g.fillRect(ix1 + m, V(z), m * 1.6, 10 * sx); } }
  // título
  const cx = Wc / 2, ty = V(LIM.z0) - 21 * sx;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3a2412';
  g.font = `600 ${16 * sx}px Georgia, serif`; const tit = 'S U L   D E   A R T O N'; g.fillText(tit, cx, ty);
  g.font = `italic ${5.2 * sx}px Georgia, serif`; g.fillStyle = '#5a3a1c'; g.fillText('Uivantes · Floresta de Tollon · Lomatubar · Deheon · Costa Oeste · Mar Negro', cx, ty + 12 * sx);
  g.strokeStyle = '#5a3a1c'; g.lineWidth = 0.4 * sx; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 70 * sx, ty); g.lineTo(cx + s * 120 * sx, ty); g.stroke(); g.beginPath(); g.arc(cx + s * 124 * sx, ty, 2 * sx, 0, 6.3); g.stroke(); }
  g.font = `${4.5 * sx}px Georgia, serif`; g.textAlign = 'right'; g.fillText('Tormenta 20', U(LIM.x1), ty - 9 * sx);
  // rosa dos ventos (canto inferior esquerdo)
  const rx = U(LIM.x0) + 34 * sx, ry = V(LIM.z1) + 26 * sx, R = 18 * sx;
  g.save(); g.translate(rx, ry);
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, L = i % 4 === 0 ? R : i % 2 === 0 ? R * 0.62 : R * 0.4, wdt = i % 4 === 0 ? R * 0.16 : R * 0.1;
    for (const lado of [0, 1]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * L, -Math.cos(a) * L); g.lineTo(Math.sin(a + (lado ? 1 : -1) * 1.57) * wdt, -Math.cos(a + (lado ? 1 : -1) * 1.57) * wdt); g.closePath(); g.fillStyle = lado ? '#3a2412' : '#c9ad7a'; g.fill(); g.strokeStyle = '#3a2412'; g.lineWidth = 0.15 * sx; g.stroke(); } }
  g.beginPath(); g.arc(0, 0, R * 0.72, 0, 6.3); g.lineWidth = 0.25 * sx; g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.12, 0, 6.3); g.fillStyle = '#7a1c14'; g.fill();
  g.fillStyle = '#3a2412'; g.font = `600 ${5.5 * sx}px Georgia, serif`; g.textAlign = 'center';
  g.fillText('N', 0, -R - 4 * sx); g.fillText('S', 0, R + 4.5 * sx); g.fillText('L', R + 4.5 * sx, 0); g.fillText('O', -R - 4.5 * sx, 0);
  g.restore();
  // legenda (centro)
  const lx = cx - 46 * sx, ly = V(LIM.z1) + 13 * sx, it = [['Uivantes', '#9fd0ff'], ['Floresta de Tollon', '#4cd36a'], ['Lomatubar', '#f2c534'], ['Deheon', '#b25ce6']];
  g.textAlign = 'left'; g.font = `${4.6 * sx}px Georgia, serif`; g.fillStyle = '#3a2412'; g.fillText('Legenda', lx, ly - 5 * sx);
  it.forEach(([n, c], i) => { const yy = ly + 3 * sx + i * 7 * sx; g.fillStyle = c; g.fillRect(lx, yy - 1.2 * sx, 9 * sx, 2.4 * sx); g.strokeStyle = '#3a2412'; g.lineWidth = 0.15 * sx; g.strokeRect(lx, yy - 1.2 * sx, 9 * sx, 2.4 * sx); g.fillStyle = '#3a2412'; g.fillText(n, lx + 12 * sx, yy); });
  const it2 = [['Capital', '#f0d040', 'estrela'], ['Cidade ou vila', '#c43a2a', 'pino'], ['Campo de batalha', '#3a2412', 'x'], ['Rota de viagem', '#2a7fd0', 'traco']];
  it2.forEach(([n, c, k], i) => { const xx = lx + 52 * sx, yy = ly + 3 * sx + i * 7 * sx; g.fillStyle = c; g.strokeStyle = c;
    if (k === 'pino') { g.beginPath(); g.arc(xx + 4 * sx, yy, 1.8 * sx, 0, 6.3); g.fill(); }
    else if (k === 'estrela') { g.beginPath(); for (let q = 0; q < 10; q++) { const a = (q * Math.PI) / 5, rr = q % 2 ? 1 * sx : 2.4 * sx; g.lineTo(xx + 4 * sx + Math.sin(a) * rr, yy - Math.cos(a) * rr); } g.fill(); }
    else if (k === 'x') { g.lineWidth = 0.5 * sx; g.beginPath(); g.moveTo(xx + 2 * sx, yy - 2 * sx); g.lineTo(xx + 6 * sx, yy + 2 * sx); g.moveTo(xx + 6 * sx, yy - 2 * sx); g.lineTo(xx + 2 * sx, yy + 2 * sx); g.stroke(); }
    else { g.lineWidth = 0.6 * sx; g.setLineDash([1.6 * sx, 1 * sx]); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 9 * sx, yy); g.stroke(); g.setLineDash([]); }
    g.fillStyle = '#3a2412'; g.fillText(n, xx + 12 * sx, yy); });
  // escala (canto inferior direito), com valores reais na escala atual
  const ex = U(LIM.x1) - 92 * sx, ey = V(LIM.z1) + 24 * sx, seg = 10, nSeg = 6;
  g.font = `${4.4 * sx}px Georgia, serif`; g.textAlign = 'center'; g.fillStyle = '#3a2412';
  for (let i = 0; i < nSeg; i++) { g.fillStyle = i % 2 ? '#e8dcc0' : '#3a2412'; g.fillRect(ex + i * seg * sx, ey, seg * sx, 2.2 * sx); }
  g.strokeStyle = '#3a2412'; g.lineWidth = 0.25 * sx; g.strokeRect(ex, ey, nSeg * seg * sx, 2.2 * sx);
  g.fillStyle = '#3a2412'; for (let i = 0; i <= nSeg; i += 2) g.fillText(String(Math.round(i * seg * kmPorUn)), ex + i * seg * sx, ey + 6.5 * sx);
  g.fillText('quilômetros', ex + (nSeg * seg * sx) / 2, ey + 13 * sx); g.font = `italic ${3.6 * sx}px Georgia, serif`; g.fillText(`1 légua ≈ 6 km · a pé ~30 km/dia · a cavalo ~50 km/dia`, ex + (nSeg * seg * sx) / 2, ey - 5 * sx);
}
export function construirMoldura(Gr: THREE.Group) {
  const grupo = new THREE.Group(); grupo.name = 'Moldura';
  const fora = new THREE.Shape([new THREE.Vector2(MOLD.x0, -MOLD.z0), new THREE.Vector2(MOLD.x1, -MOLD.z0), new THREE.Vector2(MOLD.x1, -MOLD.z1), new THREE.Vector2(MOLD.x0, -MOLD.z1)]);
  const b = 1.4; fora.holes.push(new THREE.Path([new THREE.Vector2(LIM.x0 + b, -(LIM.z0 + b)), new THREE.Vector2(LIM.x0 + b, -(LIM.z1 - b)), new THREE.Vector2(LIM.x1 - b, -(LIM.z1 - b)), new THREE.Vector2(LIM.x1 - b, -(LIM.z0 + b))]));
  const g = new THREE.ShapeGeometry(fora, 1); g.rotateX(-Math.PI / 2); g.translate(0, MOLD.y, 0);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - MOLD.x0) / (MOLD.x1 - MOLD.x0), 1 - (p.getZ(i) - MOLD.z0) / (MOLD.z1 - MOLD.z0));
  const cv = document.createElement('canvas'); cv.width = Q === 'alta' ? 2048 : Q === 'media' ? 1536 : 1024; cv.height = Math.round(cv.width * (MOLD.z1 - MOLD.z0) / (MOLD.x1 - MOLD.x0));
  desenharMoldura(cv);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const pap = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, envMapIntensity: 0.5 })); pap.receiveShadow = true; pap.userData.ns = 1; grupo.add(pap);
  // bandeja de madeira (borda elevada) e o bloco até a mesa
  const mad = pbr('dark_wood', { size: 12, color: 0x8a6a4a }), tabua = pbr('dark_wooden_planks', { size: 140, color: 0x9a7a5a });
  const W = MOLD.x1 - MOLD.x0, D = MOLD.z1 - MOLD.z0, cxm = (MOLD.x0 + MOLD.x1) / 2, czm = (MOLD.z0 + MOLD.z1) / 2, e = 5, hb = 3.2, base = -16;
  const caixa = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => { const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); bx.position.set(x, y, z); bx.castShadow = bx.receiveShadow = true; grupo.add(bx); return bx; };
  caixa(W + 2 * e, hb - base, e, cxm, (hb + base) / 2, MOLD.z0 - e / 2, mad); caixa(W + 2 * e, hb - base, e, cxm, (hb + base) / 2, MOLD.z1 + e / 2, mad);
  caixa(e, hb - base, D, MOLD.x0 - e / 2, (hb + base) / 2, czm, mad); caixa(e, hb - base, D, MOLD.x1 + e / 2, (hb + base) / 2, czm, mad);
  caixa(W, 4, D, cxm, base + 2, czm, mad);
  const mesa = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), tabua); mesa.rotation.x = -Math.PI / 2; mesa.position.y = base; mesa.receiveShadow = true; mesa.userData.ns = 1; grupo.add(mesa);
  Gr.add(grupo);
  return { grupo, canvas: cv, tex: t };
}
