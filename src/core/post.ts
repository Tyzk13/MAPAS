// Pós-processamento e predefinições de qualidade.
// Ordem: cena (HDR, meia-precisão) → AO (N8AO) → profundidade de campo → bloom + vinheta + gradação + tone mapping (AgX)
//        → SMAA. O tone mapping é feito aqui (o renderizador fica em NoToneMapping).
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, ToneMappingEffect, ToneMappingMode,
  SMAAEffect, SMAAPreset, BrightnessContrastEffect, HueSaturationEffect, DepthOfFieldEffect, NoiseEffect, BlendFunction,
  ChromaticAberrationEffect, ColorAverageEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { R, S, cam, ctl, onResize, setPixelRatioCap, fit } from './engine';
import { sun } from './sky';
import type { Quality } from './config';

export interface Grade { exposure: number; contrast: number; brightness: number; saturation: number; hue: number; bloom: number; vignette: number; tint: [number, number, number] }

/** Gradação padrão (cada clima pode sobrescrever via post.setGrade). */
export const DEFAULT_GRADE: Grade = { exposure: 1, contrast: 0.12, brightness: -0.02, saturation: -0.22, hue: 0, bloom: 0.55, vignette: 0.55, tint: [1, 1, 1] };

const QP = {
  baixa: { pr: 1, shadow: 1024, ao: false, aoHalf: false, aoQ: 'Performance', smaa: SMAAPreset.LOW, dof: false, grain: false },
  // (meia resolução do N8AO não funciona com o three r187 — usa render target múltiplo removido)
  media: { pr: 1.5, shadow: 2048, ao: true, aoHalf: false, aoQ: 'Low', smaa: SMAAPreset.MEDIUM, dof: false, grain: true },
  alta: { pr: 2, shadow: 4096, ao: true, aoHalf: false, aoQ: 'High', smaa: SMAAPreset.HIGH, dof: true, grain: true },
} as const;

let composer: EffectComposer, aoPass: any, dof: DepthOfFieldEffect, dofPass: EffectPass, bloom: BloomEffect, vig: VignetteEffect;
let bc: BrightnessContrastEffect, hs: HueSaturationEffect, tm: ToneMappingEffect, smaa: SMAAEffect, smaaPass: EffectPass, noise: NoiseEffect;
let tintFx: ColorAverageEffect;
const focusTarget = new THREE.Vector3();
let enabled = true;

export const post = {
  quality: 'media' as Quality,
  grade: { ...DEFAULT_GRADE },
  /** Foco da profundidade de campo: ponto do mundo (null = alvo da órbita). */
  focus: null as THREE.Vector3 | null,

  init(q: Quality) {
    R.toneMapping = THREE.NoToneMapping;
    composer = new EffectComposer(R, { frameBufferType: THREE.HalfFloatType, multisampling: 0, stencilBuffer: false });
    composer.addPass(new RenderPass(S, cam));

    aoPass = new N8AOPostPass(S, cam, innerWidth, innerHeight);
    Object.assign(aoPass.configuration, { aoRadius: 1.6, distanceFalloff: 0.6, intensity: 2.6, color: new THREE.Color(0, 0, 0), gammaCorrection: false, screenSpaceRadius: false });
    composer.addPass(aoPass);

    dof = new DepthOfFieldEffect(cam, { worldFocusDistance: 12, worldFocusRange: 18, bokehScale: 1.6, resolutionScale: 0.5 });
    dofPass = new EffectPass(cam, dof);
    composer.addPass(dofPass);

    bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, intensity: 0.55, radius: 0.7 });
    vig = new VignetteEffect({ offset: 0.32, darkness: 0.55 });
    bc = new BrightnessContrastEffect({ brightness: -0.02, contrast: 0.12 });
    hs = new HueSaturationEffect({ saturation: -0.22, hue: 0 });
    tm = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
    noise = new NoiseEffect({ premultiply: true, blendFunction: BlendFunction.SCREEN });
    noise.blendMode.opacity.value = 0.12;
    tintFx = new ColorAverageEffect(BlendFunction.SKIP);
    const ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0004), radialModulation: true, modulationOffset: 0.35 });
    // tone mapping antes da gradação de cor (contraste/saturação agem na imagem já em faixa de tela)
    composer.addPass(new EffectPass(cam, bloom, ca, tm, bc, hs, vig, noise, tintFx));

    smaa = new SMAAEffect({ preset: SMAAPreset.MEDIUM });
    smaaPass = new EffectPass(cam, smaa);
    composer.addPass(smaaPass);

    onResize((w, h) => { composer.setSize(w, h); aoPass.setSize?.(w * R.getPixelRatio(), h * R.getPixelRatio()); });
    this.setQuality(q);
  },

  setQuality(q: Quality) {
    this.quality = q;
    const p = QP[q];
    setPixelRatioCap(p.pr);
    if (sun.shadow.mapSize.x !== p.shadow) {
      sun.shadow.mapSize.set(p.shadow, p.shadow);
      sun.shadow.map?.dispose(); (sun.shadow as any).map = null;
    }
    aoPass.enabled = p.ao;
    aoPass.configuration.halfRes = p.aoHalf;
    aoPass.setQualityMode(p.aoQ);
    dofPass.enabled = p.dof;
    smaa.applyPreset(p.smaa);
    noise.blendMode.opacity.value = p.grain ? 0.1 : 0;
    fit();
  },

  /** Aplica a gradação de cor de um clima. */
  setGrade(g: Partial<Grade>) {
    const G = (this.grade = { ...DEFAULT_GRADE, ...g });
    R.toneMappingExposure = G.exposure;
    bc.brightness = G.brightness; bc.contrast = G.contrast;
    hs.saturation = G.saturation; hs.hue = G.hue;
    bloom.intensity = G.bloom;
    vig.darkness = G.vignette;
  },

  /** Liga/desliga todo o pós (a exportação VTT renderiza sem pós). */
  setEnabled(v: boolean) { enabled = v; R.toneMapping = v ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; },

  /** Quantos quadros renderizar antes de uma captura. */
  warmup() { return 3; },

  render(dt: number) {
    if (!enabled) { R.render(S, cam); return; }
    if (dofPass.enabled) {
      focusTarget.copy(this.focus || ctl.target);
      const d = cam.position.distanceTo(focusTarget);
      dof.cocMaterial.worldFocusDistance = d;
      dof.cocMaterial.worldFocusRange = Math.max(6, d * 1.6);
    }
    composer.render(dt);
  },
};
