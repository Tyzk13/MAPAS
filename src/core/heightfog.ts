// Névoa por altura: a névoa exponencial do three passa a ser mais densa perto do chão e rala no alto.
// Substitui os trechos de shader de névoa (vale para todos os materiais criados depois da importação).
import * as THREE from 'three';

export const heightFog = { base: 0.0, falloff: 0.16, floor: 0.25 };

THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorld;
#endif`;
THREE.ShaderChunk.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = (inverse(viewMatrix) * mvPosition).xyz;
#endif`;
THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
THREE.ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float hf = exp(-max(0.0, vFogWorld.y - ${'HF_BASE'}) * ${'HF_FALL'});
    float dens = fogDensity * (${'HF_FLOOR'} + (1.0 - ${'HF_FLOOR'}) * hf);
    float fogFactor = 1.0 - exp(- dens * dens * vFogDepth * vFogDepth);
  #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif`
  .replace(/HF_BASE/g, heightFog.base.toFixed(3))
  .replace(/HF_FALL/g, heightFog.falloff.toFixed(3))
  .replace(/HF_FLOOR/g, heightFog.floor.toFixed(3));
