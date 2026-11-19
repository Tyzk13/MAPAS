// Renderizador, cena, câmera e controles de órbita (compartilhados por todos os mapas).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CFG } from './config';

export const cv = document.getElementById('c') as HTMLCanvasElement;

export const R = new THREE.WebGLRenderer({
  canvas: cv,
  antialias: false, // o anti-serrilhado vem do pós-processamento (SMAA)
  powerPreference: 'high-performance',
  preserveDrawingBuffer: CFG.capture,
  stencil: false,
});
R.outputColorSpace = THREE.SRGBColorSpace;
R.toneMapping = THREE.ACESFilmicToneMapping;
// Trava de segurança para TODO material, antes do tone mapping e da gravação no buffer de meia precisão:
// - NaN/infinito: teste pelos BITS do float (isnan() é removido pelo otimizador de várias placas/ANGLE-D3D);
// - cor negativa vira 0; acima de 60000 estoura o half-float (65504) e vira infinito → mancha branca/preta no bloom.
// `?nan=1` pinta os pixels problemáticos (magenta = NaN, ciano = infinito, amarelo = estouro, vermelho = negativo).
const GUARDA = /* glsl */ `
{
  uvec3 gb = floatBitsToUint(gl_FragColor.rgb) & 0x7f800000u;
  bvec3 ruim = equal(gb, uvec3(0x7f800000u));
  #ifdef DIAG_NAN
    uvec3 gm = floatBitsToUint(gl_FragColor.rgb) & 0x007fffffu;
    if (any(ruim) && any(notEqual(gm * uvec3(ruim), uvec3(0u)))) gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    else if (any(ruim)) gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
    else if (any(greaterThan(gl_FragColor.rgb, vec3(6e4)))) gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    else if (any(lessThan(gl_FragColor.rgb, vec3(0.0)))) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  #else
    gl_FragColor.rgb = any(ruim) ? vec3(0.0) : clamp(gl_FragColor.rgb, vec3(0.0), vec3(6e4));
  #endif
}
`;
THREE.ShaderChunk.tonemapping_fragment = (CFG.nan ? '#define DIAG_NAN\n' : '') + GUARDA + THREE.ShaderChunk.tonemapping_fragment;
R.toneMappingExposure = 1;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFShadowMap; // no three atual o PCF já é suave

export const S = new THREE.Scene();
S.fog = new THREE.Fog(0xa4a9a8, 26, 150);

export const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 700);
cam.position.set(-16, 6.5, 52);

export const ctl = new OrbitControls(cam, cv);
ctl.enableDamping = true;
ctl.maxPolarAngle = 1.78; // permite olhar um pouco para cima (interiores)
ctl.minDistance = 1.5;
ctl.maxDistance = 95;
ctl.target.set(-2, 6, 8);

type ResizeFn = (w: number, h: number) => void;
const resizers: ResizeFn[] = [];
export function onResize(f: ResizeFn) { resizers.push(f); }

export let pixelRatioCap = 2;
export function setPixelRatioCap(v: number) { pixelRatioCap = v; fit(); }

/** Escala dinâmica da resolução (0.5–1), ajustada por core/desempenho.ts quando o FPS cai. */
export let renderScale = 1;
export function setRenderScale(v: number) {
  v = Math.max(0.5, Math.min(1, v));
  if (Math.abs(v - renderScale) < 0.01) return;
  renderScale = v; fit();
}

export function fit() {
  const w = innerWidth, h = innerHeight;
  R.setPixelRatio(Math.max(0.5, Math.min(devicePixelRatio, pixelRatioCap) * renderScale));
  R.setSize(w, h, false);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
  resizers.forEach(f => f(w, h));
}
addEventListener('resize', fit);
