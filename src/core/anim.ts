// Animações sutis feitas na GPU: vento na vegetação, poeira no ar e feixes de luz (volumétricos falsos).
// O tempo é um uniform compartilhado (anim.time), atualizado pelo laço principal.
import * as THREE from 'three';

export const anim = { time: { value: 0 } };

export interface WindOpts { amp: number; freq: number; flutter?: number; height: number }

const WIND_GLSL = /* glsl */ `
#ifdef USE_INSTANCING
  vec3 wOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
#else
  vec3 wOrigin = vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
#endif
float wh = clamp(transformed.y / uWindH, 0.0, 1.5);
float wph = dot(wOrigin.xz, vec2(0.13, 0.17));
float wg = 0.65 + 0.35 * sin(uTime * 0.21 + wOrigin.x * 0.02);   // rajadas lentas
float wb = (sin(uTime * uWindF + wph) * 0.6 + sin(uTime * uWindF * 2.27 + wph * 1.7) * 0.25) * uWindA * wg * wh * wh;
transformed.x += wb; transformed.z += wb * 0.55;
#ifdef WIND_FLUTTER
  float wf = sin(uTime * 6.3 + dot(transformed, vec3(9.1, 7.3, 8.7))) * uWindFl * wh * wg;
  transformed += vec3(0.35, 1.0, 0.25) * wf;
#endif
`;

function inject(shader: THREE.WebGLProgramParametersWithUniforms, o: WindOpts, flutter: boolean) {
  shader.uniforms.uTime = anim.time;
  shader.uniforms.uWindA = { value: o.amp };
  shader.uniforms.uWindF = { value: o.freq };
  shader.uniforms.uWindFl = { value: o.flutter ?? 0 };
  shader.uniforms.uWindH = { value: Math.max(0.1, o.height) };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\nuniform float uTime, uWindA, uWindF, uWindFl, uWindH;${flutter ? '\n#define WIND_FLUTTER' : ''}`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + WIND_GLSL);
}

/** Aplica vento a um material (uma vez). Folhagem ganha também o tremor das folhas. */
export function addWind(mat: THREE.Material, o: WindOpts, foliage: boolean) {
  const m = mat as THREE.Material & { userData: any };
  if (m.userData.wind) return;
  m.userData.wind = o;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { prev?.call(m, sh, r); inject(sh, o, foliage); };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => (key ? key() : '') + '|vento' + (foliage ? 'F' : '');
  m.needsUpdate = true;
}

/** Material de profundidade (sombra) com o mesmo vento, para a sombra acompanhar o movimento. */
export function windDepth(mat: THREE.MeshStandardMaterial, o: WindOpts, foliage: boolean) {
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.alphaTest > 0 ? mat.map : null, alphaTest: mat.alphaTest, side: mat.side });
  d.onBeforeCompile = sh => inject(sh, o, foliage);
  d.customProgramCacheKey = () => 'vento-prof' + (foliage ? 'F' : '') + (mat.alphaTest > 0 ? 'A' : '');
  return d;
}

// ---------- poeira em suspensão ----------
/** Partículas finas flutuando dentro de uma caixa (visíveis contra a luz). */
export function dustMotes(box: THREE.Box3, n = 400, color = 0xffe2b8) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n);
  const sz = box.getSize(new THREE.Vector3());
  for (let i = 0; i < n; i++) {
    pos[i * 3] = box.min.x + Math.random() * sz.x; pos[i * 3 + 1] = box.min.y + Math.random() * sz.y; pos[i * 3 + 2] = box.min.z + Math.random() * sz.z;
    seed[i] = Math.random() * 100;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: anim.time, uColor: { value: new THREE.Color(color) }, uInt: { value: 0.5 }, uMin: { value: box.min }, uSize: { value: sz } },
    vertexShader: /* glsl */ `
      attribute float seed; uniform float uTime; uniform vec3 uMin, uSize; varying float vA;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.07 + seed) * 0.6 + sin(uTime * 0.19 + seed * 3.1) * 0.15;
        p.z += cos(uTime * 0.05 + seed * 1.3) * 0.6;
        p.y = uMin.y + mod(p.y - uMin.y + uTime * 0.025 * (0.5 + fract(seed)), uSize.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(9.0 / -mv.z, 0.8, 2.6);
        vA = 0.55 + 0.45 * sin(uTime * 0.8 + seed * 7.0);
        vA *= smoothstep(0.0, 0.08, (p.y - uMin.y) / uSize.y) * smoothstep(1.0, 0.85, (p.y - uMin.y) / uSize.y);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uInt; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(uColor * a * vA * uInt, 1.0); }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.ns = 1; pts.renderOrder = 2;
  return pts;
}

// ---------- feixes de luz ----------
const shaftGeo = (() => { const g = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1); g.translate(0.5, 0, 0); return g; })();
/**
 * Feixe de luz: caixa aditiva que começa em `from` e segue em `dir` por `len` m, com seção w×h.
 * Some suavemente ao longo do comprimento, nas bordas e quando visto de lado.
 */
export function lightShaft(from: THREE.Vector3, dir: THREE.Vector3, len: number, w: number, h: number, color: number) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: anim.time, uColor: { value: new THREE.Color(color) }, uInt: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vL; varying vec3 vN; varying vec3 vV;
      void main() { vL = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uInt, uTime; varying vec3 vL; varying vec3 vN; varying vec3 vV;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float along = pow(1.0 - clamp(vL.x, 0.0, 1.0), 1.6);
        float edge = smoothstep(0.5, 0.05, abs(vL.y)) * smoothstep(0.5, 0.05, abs(vL.z));
        float facing = pow(abs(dot(vN, vV)), 3.0);
        float dust = 0.75 + 0.25 * n2(vL.yz * 6.0 + vec2(uTime * 0.05, uTime * 0.03));
        float a = along * edge * facing * dust * uInt;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(shaftGeo, mat);
  m.position.copy(from); m.scale.set(len, h, w);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
  m.userData.ns = 1; m.renderOrder = 3; m.frustumCulled = false;
  return m;
}
