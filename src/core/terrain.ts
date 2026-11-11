// Terreno: malha com relevo + material que mistura 3 conjuntos PBR (base, camada R, camada G) por uma máscara
// por vértice (atributo `splat`). Para colisão/raycast use `collider` (malha invisível de baixa resolução).
import * as THREE from 'three';
import { pbr } from './pbr';

// ---------- ruído (determinístico) ----------
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

export interface TerrainLayer { id: string; size: number }
export interface TerrainOpts {
  size: number; seg: number;
  height: (x: number, z: number) => number;
  /** máscara: [camada R (0..1), camada G (0..1)] */
  mask: (x: number, z: number) => [number, number];
  base: TerrainLayer; r: TerrainLayer; g: TerrainLayer;
  normalScale?: number;
}

export function terrainMaterial(o: TerrainOpts) {
  const B = pbr(o.base.id, { size: 1 }), Rl = pbr(o.r.id, { size: 1 }), Gl = pbr(o.g.id, { size: 1 });
  const m = new THREE.MeshStandardMaterial({ map: B.map, normalMap: B.normalMap, roughnessMap: B.roughnessMap, aoMap: B.aoMap, roughness: 1, envMapIntensity: 0.7 });
  m.normalScale.setScalar(o.normalScale ?? 1);
  m.customProgramCacheKey = () => 'terreno3';
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, {
      tBD: { value: B.map }, tBN: { value: B.normalMap }, tBA: { value: B.roughnessMap },
      tRD: { value: Rl.map }, tRN: { value: Rl.normalMap }, tRA: { value: Rl.roughnessMap },
      tGD: { value: Gl.map }, tGN: { value: Gl.normalMap }, tGA: { value: Gl.roughnessMap },
      uScale: { value: new THREE.Vector3(o.base.size, o.r.size, o.g.size) },
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 splat;\nvarying vec2 vSplat;\nvarying vec2 vTUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = splat;\nvTUv = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D tBD, tBN, tBA, tRD, tRN, tRA, tGD, tGN, tGA;
uniform vec3 uScale;
varying vec2 vSplat;
varying vec2 vTUv;`)
      .replace('#include <map_fragment>', `
vec2 uvB = vTUv / uScale.x, uvR = vTUv / uScale.y, uvG = vTUv / uScale.z;
vec4 cB = texture2D(tBD, uvB), cR = texture2D(tRD, uvR), cG = texture2D(tGD, uvG);
vec3 aB = texture2D(tBA, uvB).rgb, aR = texture2D(tRA, uvR).rgb, aG = texture2D(tGA, uvG).rgb;
// mistura "por altura": a textura com mais relevo (AO claro) vence nas transições
float hB = aB.r + 0.0, hR = aR.r + vSplat.x * 1.6 - 0.8, hG = aG.r + vSplat.y * 1.6 - 0.8;
vec3 w = vec3(1.0 - clamp(vSplat.x + vSplat.y, 0.0, 1.0), vSplat.x, vSplat.y);
w *= exp2(vec3(hB, hR, hG) * 6.0);
w /= (w.x + w.y + w.z + 1e-5);
diffuseColor.rgb *= cB.rgb * vec3(0.92, 0.97, 0.86) * w.x + cR.rgb * w.y + cG.rgb * w.z;
vec3 tArm = aB * w.x + aR * w.y + aG * w.z;`)
      .replace('#include <normal_fragment_maps>', `
vec3 nB = texture2D(tBN, uvB).xyz * 2.0 - 1.0, nR = texture2D(tRN, uvR).xyz * 2.0 - 1.0, nG = texture2D(tGN, uvG).xyz * 2.0 - 1.0;
vec3 mapN = normalize(nB * w.x + nR * w.y + nG * w.z);
mapN.xy *= normalScale;
normal = normalize( tbn * mapN );`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * tArm.g;')
      .replace('#include <aomap_fragment>', `
float ambientOcclusion = ( tArm.r - 1.0 ) * aoMapIntensity + 1.0;
reflectedLight.indirectDiffuse *= ambientOcclusion;
#if defined( USE_ENVMAP ) && defined( STANDARD )
  float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
  reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
#endif`);
  };
  return m;
}

export function makeTerrain(o: TerrainOpts) {
  const g = new THREE.PlaneGeometry(o.size, o.size, o.seg, o.seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, sp = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, o.height(x, z));
    uv.setXY(i, x, -z);
    const [a, b] = o.mask(x, z); sp[i * 2] = a; sp[i * 2 + 1] = b;
  }
  g.setAttribute('splat', new THREE.BufferAttribute(sp, 2));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, terrainMaterial(o));
  mesh.receiveShadow = true;
  // colisor simples para raycast (caminhar/arrastar): 1 vértice a cada ~4 m
  const cs = Math.max(8, Math.round(o.size / 4));
  const cg = new THREE.PlaneGeometry(o.size, o.size, cs, cs); cg.rotateX(-Math.PI / 2);
  const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) cp.setY(i, o.height(cp.getX(i), cp.getZ(i)));
  cg.computeBoundingSphere();
  const collider = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ visible: false }));
  collider.userData.ns = 1;
  return { mesh, collider };
}
