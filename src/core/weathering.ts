// Envelhecimento procedural de fachadas: sujeira/musgo subindo do chão e escorridos verticais de chuva.
// Calculado no shader em coordenadas do mundo (não precisa de textura nem de UV extra).
import type * as THREE from 'three';

export interface WeatherOpts { ground?: number; grime?: number; streaks?: number; moss?: number }

export function weather(mat: THREE.MeshStandardMaterial, o: WeatherOpts = {}) {
  if (mat.userData.weather) return mat;
  mat.userData.weather = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.uniforms.uWGround = { value: o.ground ?? 0 };
    sh.uniforms.uWGrime = { value: o.grime ?? 0.42 };
    sh.uniforms.uWStreak = { value: o.streaks ?? 0.32 };
    sh.uniforms.uWMoss = { value: o.moss ?? 0.5 };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos;
uniform float uWGround, uWGrime, uWStreak, uWMoss;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  float gy = vWPos.y - uWGround;
  float hcoord = vWPos.x + vWPos.z;
  float nb = wNoise(vec2(hcoord * 1.3, gy * 1.1)) * 0.6 + wNoise(vec2(hcoord * 4.0, gy * 3.0)) * 0.4;
  float grime = (1.0 - smoothstep(0.0, 1.2 + nb * 1.6, gy)) * uWGrime;
  float st = wNoise(vec2(hcoord * 5.0, gy * 0.18)) * wNoise(vec2(hcoord * 11.0, gy * 0.07 + 3.0));
  float streak = smoothstep(0.2, 0.55, st) * uWStreak * (0.4 + 0.6 * smoothstep(9.0, 3.0, gy));
  vec3 mossCol = diffuseColor.rgb * vec3(0.62, 0.74, 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, mossCol, grime * uWMoss * (0.5 + nb));
  // max(): sujeira + escorrido passavam de 1 e a cor ficava NEGATIVA — o tone mapping mostra negativo como BRANCO
  diffuseColor.rgb *= max(0.0, 1.0 - grime * 0.55 - streak * 0.5);
}`);
  };
  const key = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (key ? key() : '') + '|desgaste';
  mat.needsUpdate = true;
  return mat;
}
