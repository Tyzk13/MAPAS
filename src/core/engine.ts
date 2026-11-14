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
// Trava de segurança para TODO material: cor negativa ou NaN antes do tone mapping vira branco em muitas placas
// (manchas brancas em postes/carros/tijolo na qualidade Baixa, que não usa o pós-processamento).
THREE.ShaderChunk.tonemapping_fragment = 'gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.0));\nif (any(isnan(gl_FragColor.rgb))) gl_FragColor.rgb = vec3(0.0);\n' + THREE.ShaderChunk.tonemapping_fragment;
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
