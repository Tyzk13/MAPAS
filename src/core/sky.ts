// Céu (HDRI), luz ambiente/reflexos (PMREM do HDRI), sol/lua, névoa e predefinições de clima.
// Cada clima carrega seu HDRI sob demanda; a cor da névoa é tirada do horizonte do próprio HDRI.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { R, S } from './engine';
import { st } from './state';
import type { Grade } from './post';
import { litGlass } from './models';
import { fetchBinary } from './binario';

export interface Preset {
  n: string;
  hdr: string;
  /** brilho do céu visível e da luz ambiente/reflexos vinda do HDRI */
  bg: number; env: number; blur: number;
  /** rotação do HDRI (rad) */
  rot: number;
  /** sol/lua: cor, intensidade, direção (azimute°, elevação°) */
  sc: number; si: number; az: number; el: number;
  /** preenchimento do chão (hemisfério) */
  hs: number; hg: number; hi: number;
  /** névoa: densidade e multiplicador/tingimento da cor tirada do horizonte */
  fogD: number; fogK: number; fogTint?: number;
  /** tinge o próprio HDRI (céu visível, reflexos e cor da névoa juntos). Ex.: noite azulada. */
  skyTint?: number;
  /** luzes artificiais (lampiões, velas, porta): 0 = apagadas, 1 = normal */
  lamps: number;
  /** vitrais vistos de fora: brilho */
  win: number;
  grade: Partial<Grade>;
}

export const PRE: Preset[] = [
  { n: 'Terror', hdr: 'overcast_soil_puresky', bg: 0.05, env: 0.2, blur: 0.02, rot: 0, sc: 0x9db0d0, si: 0.35, az: 320, el: 38, hs: 0x55657d, hg: 0x15130f, hi: 0.12, fogD: 0.022, fogK: 0.75, fogTint: 0x8fa0b8, lamps: 1, win: 1.05, grade: { exposure: 1.15, saturation: -0.3, contrast: 0.16, brightness: -0.02, bloom: 0.75, vignette: 0.62 } },
  { n: 'Anoitecer', hdr: 'kloppenheim_07_puresky', bg: 0.22, env: 0.45, blur: 0.0, rot: 2.2, sc: 0xffd6b8, si: 0.7, az: 300, el: 10, hs: 0x7787a3, hg: 0x1b1814, hi: 0.18, fogD: 0.013, fogK: 0.95, lamps: 1, win: 0.95, grade: { exposure: 1.05, saturation: -0.2, contrast: 0.14, bloom: 0.6, vignette: 0.5 } },
  { n: 'Crepúsculo', hdr: 'qwantani_dusk_2_puresky', bg: 0.3, env: 0.5, blur: 0, rot: 0.6, sc: 0xffa070, si: 1.1, az: 290, el: 5, hs: 0x8a7fa0, hg: 0x1c1512, hi: 0.2, fogD: 0.0075, fogK: 0.9, lamps: 1, win: 1.1, grade: { exposure: 1.0, saturation: -0.12, contrast: 0.17, bloom: 0.55, vignette: 0.5 } },
  { n: 'Nublado', hdr: 'kloofendal_overcast_puresky', bg: 0.6, env: 0.75, blur: 0, rot: 0, sc: 0xe8eef5, si: 1.4, az: 200, el: 50, hs: 0xc8d0da, hg: 0x2a2620, hi: 0.25, fogD: 0.006, fogK: 0.88, lamps: 0, win: 0.35, grade: { exposure: 0.95, saturation: -0.18, contrast: 0.16, bloom: 0.35, vignette: 0.4 } },
  { n: 'Noite', hdr: 'qwantani_night_puresky', bg: 0.11, env: 0.13, blur: 0, rot: 0, sc: 0x9fb6ff, si: 0.45, az: 160, el: 42, hs: 0x34456e, hg: 0x08090c, hi: 0.2, fogD: 0.017, fogK: 0.5, skyTint: 0x8aa2ff, lamps: 1, win: 1.15, grade: { exposure: 1.2, saturation: -0.18, contrast: 0.18, brightness: -0.03, bloom: 0.85, vignette: 0.65 } },
];

const HDR_URLS = import.meta.glob('@assets/hdri/*.hdr', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const hdrUrl = (id: string) => Object.entries(HDR_URLS).find(([k]) => k.includes('/' + id + '_'))?.[1];

const pmrem = new THREE.PMREMGenerator(R);
const cache: Record<string, Promise<{ tex: THREE.DataTexture; env: THREE.Texture; horizon: THREE.Color }>> = {};
const raw: Record<string, Promise<any>> = {};
function loadHdr(id: string, tint?: number) {
  return (cache[id + '|' + (tint ?? '')] ||= (async () => {
    const url = hdrUrl(id);
    if (!url) throw new Error('HDRI não encontrado: ' + id);
    const src: any = await (raw[id] ||= fetchBinary(url).then(b => new HDRLoader().setDataType(THREE.HalfFloatType).parse(b)));
    const d = tint == null ? src : { ...src, data: tintHalf(src.data, new THREE.Color(tint)) };
    const tex = new THREE.DataTexture(d.data, d.width, d.height, THREE.RGBAFormat, d.type);
    tex.colorSpace = THREE.LinearSRGBColorSpace; tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false; tex.flipY = true; tex.needsUpdate = true;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    // A luz ambiente (PMREM) sai de uma cópia SEM os pontos superbrilhantes (lua, sol, brilho de cidade). Em algumas
    // placas a leitura da luz difusa pega um nível pouco borrado do PMREM: com a lua a 84° (90× o céu) tudo o que
    // está virado para cima ficava BRANCO (chão, telhados, copas — relato do dono em Greywater, Noite).
    const envTex = new THREE.DataTexture(limitarBrilho(d.data), d.width, d.height, THREE.RGBAFormat, d.type);
    envTex.colorSpace = THREE.LinearSRGBColorSpace; envTex.minFilter = envTex.magFilter = THREE.LinearFilter;
    envTex.generateMipmaps = false; envTex.flipY = true; envTex.needsUpdate = true;
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose();
    return { tex, env, horizon: horizonColor(tex) };
  })());
}
/** Cópia dos dados (meia precisão RGBA) multiplicada por uma cor linear. */
function tintHalf(data: Uint16Array, c: THREE.Color) {
  const o = new Uint16Array(data.length), k = [c.r, c.g, c.b], H = THREE.DataUtils;
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) o[i + j] = H.toHalfFloat(H.fromHalfFloat(data[i + j]) * k[j]);
    o[i + 3] = data[i + 3];
  }
  return o;
}
/** Cópia com cada pixel limitado a ~3× o brilho médio do céu (mantém a cor; corta lua/sol/brilho de cidade). */
export function limitarBrilho(data: Uint16Array) {
  const H = THREE.DataUtils, o = new Uint16Array(data.length);
  let soma = 0, n = 0;
  for (let i = 0; i < data.length; i += 16) { soma += H.fromHalfFloat(data[i]) + H.fromHalfFloat(data[i + 1]) + H.fromHalfFloat(data[i + 2]); n++; }
  const teto = Math.max(0.3, (soma / n / 3) * 3);
  for (let i = 0; i < data.length; i += 4) {
    const r = H.fromHalfFloat(data[i]), g = H.fromHalfFloat(data[i + 1]), b = H.fromHalfFloat(data[i + 2]);
    const m = Math.max(r, g, b), k = m > teto ? teto / m : 1;
    if (k < 1 || !(m >= 0)) { o[i] = H.toHalfFloat((r >= 0 ? r : 0) * k); o[i + 1] = H.toHalfFloat((g >= 0 ? g : 0) * k); o[i + 2] = H.toHalfFloat((b >= 0 ? b : 0) * k); }
    else { o[i] = data[i]; o[i + 1] = data[i + 1]; o[i + 2] = data[i + 2]; }
    o[i + 3] = data[i + 3];
  }
  return o;
}
/** Média de uma faixa logo acima do horizonte (linear). */
function horizonColor(tex: THREE.DataTexture) {
  const { data, width, height } = tex.image as { data: Uint16Array; width: number; height: number };
  const c = new THREE.Color(0, 0, 0), y0 = Math.floor(height * 0.44), y1 = Math.floor(height * 0.5);
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < width; x += 4) {
    const i = (y * width + x) * 4;
    c.r += THREE.DataUtils.fromHalfFloat(data[i]); c.g += THREE.DataUtils.fromHalfFloat(data[i + 1]); c.b += THREE.DataUtils.fromHalfFloat(data[i + 2]); n++;
  }
  return c.multiplyScalar(1 / n);
}

export const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.3); S.add(hemi);
export const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 200 });
S.add(sun); S.add(sun.target);
S.fog = new THREE.FogExp2(0x808890, 0.01);

/** Cúpula vazia mantida para compatibilidade (a exportação VTT a esconde). O céu é S.background. */
export const dome = new THREE.Object3D();
export const env = { hdr: null as THREE.Texture | null };

export function setShadowRadius(r: number) {
  Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, far: Math.max(200, r * 4) });
  sun.shadow.camera.updateProjectionMatrix();
}

let userHdr: { tex: THREE.Texture; env: THREE.Texture } | null = null;
/** HDRI escolhido pelo usuário (Importar 3D → HDRI). null volta ao HDRI do clima. */
export function applyHdr(tex: THREE.Texture | null) {
  env.hdr = tex;
  userHdr = tex ? { tex, env: pmrem.fromEquirectangular(tex).texture } : null;
  if (tex) tex.mapping = THREE.EquirectangularReflectionMapping;
  setTime(st.pi);
}

let reqId = 0, baseRot = 0;
/** Nuvens andando: gira o céu bem devagar (o ambiente/luz não gira). */
export function driftSky(t: number) { S.backgroundRotation.y = baseRot + t * 0.0035; }
export const timeHooks: ((p: Preset) => void)[] = [];

export async function setTime(i: number) {
  const p = PRE[i], my = ++reqId;
  const h = await loadHdr(p.hdr, p.skyTint);
  if (my !== reqId) return; // outro clima foi pedido enquanto carregava
  const tex = userHdr?.tex || h.tex, envT = userHdr?.env || h.env;
  S.background = tex; S.environment = envT;
  S.backgroundIntensity = p.bg; S.environmentIntensity = p.env; S.backgroundBlurriness = p.blur;
  S.backgroundRotation.set(0, p.rot, 0); S.environmentRotation.set(0, p.rot, 0); baseRot = p.rot;
  const fog = S.fog as THREE.FogExp2;
  fog.color.copy(h.horizon).multiplyScalar(p.bg * p.fogK);
  if (p.fogTint != null) fog.color.multiply(new THREE.Color(p.fogTint));
  fog.density = p.fogD * (st.MP?.fogScale ?? 1);
  const az = THREE.MathUtils.degToRad(p.az), el = THREE.MathUtils.degToRad(p.el);
  sun.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(80);
  sun.color.set(p.sc); sun.intensity = p.si;
  hemi.color.set(p.hs); hemi.groundColor.set(p.hg); hemi.intensity = p.hi;
  const M = st.MP;
  if (M) {
    M.glass.forEach((m: any) => { if (m.emissive) m.emissiveIntensity = p.win; else m.color.setScalar(p.win); });
    M.mist.forEach(s => (s.material.opacity = 0.08));
  }
  aplicarLuzes();
  R.shadowMap.needsUpdate = true;
  timeHooks.forEach(f => f(p));
}

/** Luzes artificiais forçadas (null = as do clima; 0 = apagadas, "a luz caiu"). */
let luzesForcadas: number | null = null;
/**
 * Acende/apaga as luzes artificiais do mapa (lâmpadas, velas, auréolas, vidros acesos).
 * `rapido` = só as intensidades (para piscar); sem ele chama também o `onTime` do mapa (sondas de reflexo etc.).
 */
export function aplicarLuzes(k?: number, rapido = false) {
  const p0 = PRE[st.pi], lamps = k ?? luzesForcadas ?? p0.lamps, p = { ...p0, lamps }, M = st.MP;
  if (M) {
    M.lights.forEach(l => (l.l.intensity = l.n * lamps));
    M.lamps.forEach(m => { const b = (m.userData.base ||= m.color.clone()); m.color.copy(b).multiplyScalar(lamps ? Math.max(0.15, lamps) : 0.15); });
    M.halos.forEach(s => (s.material.opacity = 0.22 * lamps));
    if (M.onTime && !rapido) M.onTime(p);
  }
  litGlass.forEach(m => (m.emissiveIntensity = (m.userData.litBase ?? 1.4) * (lamps ? lamps : 0.02)));
  R.shadowMap.needsUpdate = true;
}
export function forcarLuzes(k: number | null) { luzesForcadas = k; aplicarLuzes(); }

/** Pré-carrega os HDRIs dos climas (em segundo plano). */
export function preloadSkies() { PRE.forEach(p => loadHdr(p.hdr, p.skyTint).catch(() => {})); }
