// Som ambiente gerado na hora (Web Audio, sem arquivos): vento, zumbido grave, trovões distantes e grilos,
// conforme o clima; e efeitos curtos para o cinema (susto, corte, suave) e o relâmpago. Tudo sutil.
// O navegador só libera o áudio depois de um clique/tecla na janela: chame `som.desbloquear()` num gesto.

type Efeito = 'susto' | 'corte' | 'suave' | 'raio';
interface Nivel { vento: number; zumbido: number; trovao: boolean; grilos: number }
const NIVEIS: Record<string, Nivel> = {
  Terror: { vento: 0.55, zumbido: 0.6, trovao: true, grilos: 0 },
  Anoitecer: { vento: 0.35, zumbido: 0.3, trovao: false, grilos: 0.25 },
  Crepúsculo: { vento: 0.3, zumbido: 0.25, trovao: false, grilos: 0.15 },
  Nublado: { vento: 0.45, zumbido: 0.12, trovao: false, grilos: 0 },
  Noite: { vento: 0.25, zumbido: 0.45, trovao: true, grilos: 0.6 },
};

let ctx: AudioContext | null = null, mestre: GainNode, ventoG: GainNode, zumbG: GainNode, ruido: AudioBuffer;
let nivel: Nivel = NIVEIS.Terror, ativo = false, volume = 0.6, proxTrovao = 0, proxGrilo = 0, relogio = 0;

function montar() {
  const c = new AudioContext();
  ctx = c;
  mestre = c.createGain(); mestre.gain.value = 0; mestre.connect(c.destination);
  // ruído branco (2 s, em laço) — base do vento, trovões e chiados
  ruido = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // vento: ruído em passa-banda com a frequência e o volume oscilando devagar (rajadas)
  const src = c.createBufferSource(); src.buffer = ruido; src.loop = true;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.8;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  ventoG = c.createGain(); ventoG.gain.value = 0;
  const raj = c.createGain(); raj.gain.value = 0.5;
  src.connect(bp).connect(lp).connect(raj).connect(ventoG).connect(mestre);
  lfo(0.07, 260, bp.frequency); lfo(0.043, 0.35, raj.gain); src.start();
  // zumbido grave: duas ondas desafinadas num passa-baixa, respirando devagar
  zumbG = c.createGain(); zumbG.gain.value = 0;
  const zf = c.createBiquadFilter(); zf.type = 'lowpass'; zf.frequency.value = 260;
  const resp = c.createGain(); resp.gain.value = 0.06;
  zf.connect(resp).connect(zumbG).connect(mestre); lfo(0.031, 0.025, resp.gain);
  for (const f of [55, 55.35, 82.6]) { const o = c.createOscillator(); o.type = f > 80 ? 'sine' : 'triangle'; o.frequency.value = f; o.connect(zf); o.start(); }
}
/** Oscilador lento somado a um parâmetro (modulação). */
function lfo(freq: number, prof: number, alvo: AudioParam) {
  const o = ctx!.createOscillator(), g = ctx!.createGain(); o.frequency.value = freq; g.gain.value = prof; o.connect(g).connect(alvo); o.start();
}
function env(g: GainNode, t0: number, pico: number, ataque: number, queda: number) {
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pico, t0 + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ataque + queda);
}
function rajadaRuido(t0: number, dur: number, filtro: BiquadFilterType, freq: number, pico: number, ataque: number, q = 0.7) {
  const c = ctx!, s = c.createBufferSource(); s.buffer = ruido; s.loop = true;
  const f = c.createBiquadFilter(); f.type = filtro; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); env(g, t0, pico, ataque, dur - ataque);
  s.connect(f).connect(g).connect(mestre); s.start(t0, Math.random()); s.stop(t0 + dur + 0.1);
  return f;
}
function tom(t0: number, tipo: OscillatorType, f0: number, f1: number, dur: number, pico: number, ataque = 0.01, corte = 0) {
  const c = ctx!, o = c.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain(); env(g, t0, pico, ataque, dur - ataque);
  if (corte) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = corte; o.connect(f).connect(g); } else o.connect(g);
  g.connect(mestre); o.start(t0); o.stop(t0 + dur + 0.1);
}

function trovao(atraso = 0, forte = 0.5) {
  const t0 = ctx!.currentTime + atraso;
  rajadaRuido(t0, 0.5, 'lowpass', 900, forte * 0.5, 0.02);            // estalo
  const f = rajadaRuido(t0 + 0.05, 4.5, 'lowpass', 160, forte, 0.5);  // ronco
  f.frequency.setValueAtTime(220, t0); f.frequency.exponentialRampToValueAtTime(70, t0 + 4);
}
function grilo() {
  const t0 = ctx!.currentTime, f = 4200 + Math.random() * 500, n = 2 + ((Math.random() * 3) | 0);
  for (let i = 0; i < n; i++) tom(t0 + i * 0.09, 'sine', f, f, 0.05, 0.02 * nivel.grilos, 0.005);
}

export const som = {
  get ativo() { return ativo; },
  /** Chame num clique/tecla: cria/retoma o áudio (exigência do navegador). */
  desbloquear() {
    try { if (!ctx) montar(); if (ctx!.state === 'suspended') ctx!.resume(); } catch { /* sem áudio */ }
    aplicar();
  },
  setAtivo(v: boolean) { ativo = v; if (v) this.desbloquear(); else aplicar(); },
  setVolume(v: number) { volume = Math.max(0, Math.min(1, v)); aplicar(); },
  get volume() { return volume; },
  /** Clima atual (nome do preset): muda o ambiente com transição de 3 s. */
  setClima(nome: string) { nivel = NIVEIS[nome] || NIVEIS.Terror; aplicar(3); },
  efeito(e: Efeito) {
    if (!ctx || !ativo || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    if (e === 'susto') {
      rajadaRuido(t0, 0.45, 'highpass', 2200, 0.35, 0.005);
      tom(t0, 'sine', 75, 32, 1.4, 0.9, 0.01);
      for (const f of [220, 233, 311]) tom(t0, 'sawtooth', f, f * 0.97, 1.9, 0.05, 0.02, 1600);
    } else if (e === 'corte') {
      const f = rajadaRuido(t0, 0.55, 'bandpass', 300, 0.22, 0.25, 1.2); f.frequency.exponentialRampToValueAtTime(2200, t0 + 0.45);
    } else if (e === 'suave') {
      tom(t0, 'sine', 110, 108, 4.5, 0.06, 1.6); tom(t0, 'sine', 164.8, 162, 4.5, 0.04, 2);
    } else if (e === 'raio') {
      trovao(0.7 + Math.random() * 1.4, 0.7);
    }
  },
  /** A cada quadro: trovões distantes e grilos ao acaso. */
  tick(dt: number) {
    if (!ctx || !ativo || ctx.state !== 'running') return;
    relogio += dt;
    if (nivel.trovao && relogio > proxTrovao) { if (proxTrovao) trovao(0, 0.25 + Math.random() * 0.2); proxTrovao = relogio + 25 + Math.random() * 45; }
    if (nivel.grilos && relogio > proxGrilo) { grilo(); proxGrilo = relogio + 0.4 + Math.random() * 1.6; }
  },
};

function aplicar(trans = 0.8) {
  if (!ctx) return;
  const t = ctx.currentTime;
  mestre.gain.cancelScheduledValues(t); mestre.gain.setTargetAtTime(ativo ? volume : 0, t, 0.3);
  ventoG.gain.setTargetAtTime(nivel.vento, t, trans); zumbG.gain.setTargetAtTime(nivel.zumbido, t, trans);
}
