// Materiais PBR a partir das texturas em src/assets/textures/<id>/{diff,nor,arm}.webp (Poly Haven, CC0).
// As UVs das peças são geradas em metros (projeção por caixa), então `size` = quantos metros a textura cobre.
import * as THREE from 'three';
import { R } from './engine';

const FILES = import.meta.glob('@assets/textures/*/*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const fileFor = (suffix: string) => Object.entries(FILES).find(([k]) => k.endsWith(suffix))?.[1];
const loader = new THREE.TextureLoader();
const texCache: Record<string, THREE.Texture> = {};

function tex(id: string, map: 'diff' | 'nor' | 'arm') {
  const key = id + '/' + map;
  if (texCache[key]) return texCache[key];
  const url = fileFor(`/textures/${id}/${map}.webp`);
  if (!url) return null;
  const t = loader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
  t.colorSpace = map === 'diff' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return (texCache[key] = t);
}

export interface PbrOpts {
  /** metros cobertos por uma repetição da textura */
  size?: number;
  color?: number | string;
  roughness?: number;
  metalness?: number;
  normalScale?: number;
  aoIntensity?: number;
  envMapIntensity?: number;
  side?: THREE.Side;
  /** usar o canal de metal do mapa ARM (falso para quase tudo) */
  metalMap?: boolean;
  /** false = sem mapa de cor (só relevo/rugosidade; a cor vem de `color`) */
  map?: boolean;
}
const matCache: Record<string, THREE.MeshStandardMaterial> = {};

/** Material PBR (com cache por id+opções). */
export function pbr(id: string, o: PbrOpts = {}) {
  const key = id + JSON.stringify(o);
  if (matCache[key]) return matCache[key];
  const size = o.size ?? 2;
  const rep = (t: THREE.Texture | null) => { if (!t) return null; const c = t.clone(); c.repeat.set(1 / size, 1 / size); return c; };
  const arm = rep(tex(id, 'arm'));
  const m = new THREE.MeshStandardMaterial({
    map: o.map === false ? null : rep(tex(id, 'diff')),
    normalMap: rep(tex(id, 'nor')),
    roughnessMap: arm, aoMap: arm, metalnessMap: o.metalMap ? arm : null,
    color: o.color ?? 0xffffff,
    roughness: o.roughness ?? 1, metalness: o.metalness ?? 0,
    aoMapIntensity: o.aoIntensity ?? 1,
    envMapIntensity: o.envMapIntensity ?? 1,
    side: o.side ?? THREE.FrontSide,
  });
  m.normalScale.setScalar(o.normalScale ?? 1);
  return (matCache[key] = m);
}

/**
 * Gera UVs em metros por projeção de caixa (usa a normal de cada vértice para escolher o plano).
 * Chamar depois de montar a geometria e antes de aplicar a escala do objeto.
 */
export function boxUV<T extends THREE.BufferGeometry>(g: T, ox = 0, oy = 0, oz = 0): T {
  const p = g.attributes.position, n = g.attributes.normal;
  if (!n) g.computeVertexNormals();
  const nn = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + ox, y = p.getY(i) + oy, z = p.getZ(i) + oz;
    const ax = Math.abs(nn.getX(i)), ay = Math.abs(nn.getY(i)), az = Math.abs(nn.getZ(i));
    let u: number, v: number;
    if (ay >= ax && ay >= az) { u = x; v = z; }
    else if (ax >= az) { u = z * Math.sign(nn.getX(i) || 1); v = y; }
    else { u = x * -Math.sign(nn.getZ(i) || 1); v = y; }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
