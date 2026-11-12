// Recursos de imersão (pensados para a tela dos jogadores): congelar e escurecer a tela deles, lanterna na
// câmera, relâmpago (clarão + trovão), relâmpagos automáticos e o som ambiente. O estado vai para a janela dos
// jogadores no quadro do espelho; efeitos pontuais (relâmpago, sons do cinema) vão como eventos.
import * as THREE from 'three';
import { S, cam } from './engine';
import { st, $ } from './state';
import { hemi, sun } from './sky';
import { som } from './som';
import { CFG } from './config';

export type SomModo = 'off' | 'aqui' | 'jogadores';
export type Fx = 'susto' | 'corte' | 'suave' | 'raio';

export const imersao = {
  /** tela dos jogadores congelada (o mestre prepara sem eles verem) */
  congelado: false,
  /** tela dos jogadores preta */
  preto: false,
  lanterna: false,
  autoRaio: false,
  somModo: 'jogadores' as SomModo,
  volume: 0.6,
  /** esta janela é a dos jogadores (preenchido pelo espelho) */
  ehJogadores: false,
  /** há uma janela dos jogadores ligada (preenchido pelo espelho) */
  temJogadores: false,
  /** manda um efeito para a janela dos jogadores (preenchido pelo espelho) */
  aoEvento: (_e: Fx) => {},
};

// ---------- som ----------
/** O som toca nesta janela? (o mestre escolhe: desligado, nesta janela ou na dos jogadores) */
const somAqui = () => (imersao.ehJogadores ? imersao.somModo === 'jogadores' : imersao.somModo === 'aqui');
export function aplicarSom() { som.setVolume(imersao.volume); som.setAtivo(somAqui()); }

// ---------- lanterna ----------
let luz: THREE.SpotLight | null = null;
function garantirLuz() {
  if (luz) return luz;
  luz = new THREE.SpotLight(0xfff0d6, 0, 32, 0.34, 0.5, 2);
  luz.castShadow = false; luz.userData.noExport = 1;
  S.add(luz, luz.target);
  return luz;
}
// na qualidade Baixa a luz só entra quando usada (cada luz pesa em todo material)
export function prepararLanterna() { if (CFG.quality !== 'baixa') garantirLuz(); }
const fwd = new THREE.Vector3(), lado = new THREE.Vector3(), cima = new THREE.Vector3(0, 1, 0);

// ---------- relâmpago ----------
let raio: null | { t: number; pi: number; base: { h: number; e: number; b: number; s: number } } = null;
let proxAuto = 0, relogio = 0;
const PULSOS: [number, number][] = [[0, 1], [0.12, 0.55], [0.36, 0.85]];
function iniciarRaio() {
  if (raio) return;
  raio = { t: 0, pi: st.pi, base: { h: hemi.intensity, e: S.environmentIntensity, b: S.backgroundIntensity, s: sun.intensity } };
}

/** Dispara um efeito: visual nesta janela (relâmpago), som se for aqui, e manda para a janela dos jogadores. */
export function fx(e: Fx, o: { enviar?: boolean } = { enviar: true }) {
  if (e === 'raio') iniciarRaio();
  if (somAqui()) som.efeito(e);
  if (o.enviar && !imersao.ehJogadores) imersao.aoEvento(e);
}

/** A cada quadro (as duas janelas). */
export function tickImersao(dt: number) {
  relogio += dt;
  // lanterna presa à câmera (um pouco abaixo e à direita, como na mão)
  if (imersao.lanterna || (luz && luz.intensity > 0)) {
    const l = garantirLuz();
    cam.getWorldDirection(fwd); lado.crossVectors(fwd, cima).normalize();
    l.position.copy(cam.position).addScaledVector(lado, 0.22).addScaledVector(cima, -0.18);
    l.target.position.copy(cam.position).addScaledVector(fwd, 10);
    const alvo = imersao.lanterna ? 95 * (0.96 + 0.04 * Math.sin(relogio * 23) * Math.sin(relogio * 7)) : 0;
    l.intensity += (alvo - l.intensity) * Math.min(1, dt * 12);
    if (l.intensity < 0.05 && !imersao.lanterna) l.intensity = 0;
  }
  // relâmpago: três clarões rápidos somados à luz do céu
  if (raio) {
    if (st.pi !== raio.pi) { raio = null; } // clima mudou no meio: o novo clima já aplicou a luz
    else {
      raio.t += dt;
      let f = 0; for (const [t0, a] of PULSOS) if (raio.t > t0) f += a * Math.exp(-(raio.t - t0) * 16);
      const b = raio.base;
      if (raio.t > 1.3) { hemi.intensity = b.h; S.environmentIntensity = b.e; S.backgroundIntensity = b.b; sun.intensity = b.s; raio = null; }
      else { hemi.intensity = b.h + 2.6 * f; S.environmentIntensity = b.e * (1 + 3.5 * f); S.backgroundIntensity = b.b * (1 + 5 * f); sun.intensity = b.s + 1.2 * f; }
    }
  }
  // relâmpagos automáticos (só na janela do mestre, nos climas escuros)
  if (imersao.autoRaio && !imersao.ehJogadores && /Terror|Noite/.test(nomeClima())) {
    if (!proxAuto) proxAuto = relogio + 20 + Math.random() * 30;
    else if (relogio > proxAuto) { fx('raio'); proxAuto = relogio + 35 + Math.random() * 55; }
  }
  som.tick(dt);
}
let nomeClima = () => '';
export function setNomeClima(f: () => string) { nomeClima = f; }

// ---------- tela preta ----------
/** Aplica o "preto" nesta janela (na dos jogadores sempre; na do mestre só se não houver janela dos jogadores). */
export function aplicarPreto() {
  const v = imersao.ehJogadores ? imersao.preto : imersao.preto && !imersao.temJogadores;
  ($('preto') as HTMLElement).classList.toggle('on', v);
}
