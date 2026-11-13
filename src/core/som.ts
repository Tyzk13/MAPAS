// Som ambiente gerado na hora (Web Audio, sem arquivos): vento, zumbido grave, trovões distantes e grilos,
// conforme o clima; efeitos curtos para o cinema (susto, corte, suave) e o relâmpago; sons do mestre (batida,
// passos, sussurro, rangido, sino); e fontes no lugar (velas crepitando, sino da torre, porta que range quando a
// câmera passa), com volume e lado conforme a posição da câmera. Tudo sutil.
// O navegador só libera o áudio depois de um clique/tecla na janela: chame `som.desbloquear()` num gesto.

export type Efeito = 'susto' | 'corte' | 'suave' | 'raio' | 'batida' | 'passos' | 'sussurro' | 'rangido' | 'sino' | 'trovao';
export type Fonte = { x: number; y: number; z: number; tipo: 'velas' | 'sino' | 'porta' };
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
  criarFontes(fontesPendentes);
}
/** Oscilador lento somado a um parâmetro (modulação). */
function lfo(freq: number, prof: number, alvo: AudioParam) {
  const o = ctx!.createOscillator(), g = ctx!.createGain(); o.frequency.value = freq; g.gain.value = prof; o.connect(g).connect(alvo); o.start();
}
function env(g: GainNode, t0: number, pico: number, ataque: number, queda: number) {
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pico, t0 + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ataque + queda);
}
function rajadaRuido(t0: number, dur: number, filtro: BiquadFilterType, freq: number, pico: number, ataque: number, q = 0.7, saida: AudioNode = mestre) {
  const c = ctx!, s = c.createBufferSource(); s.buffer = ruido; s.loop = true;
  const f = c.createBiquadFilter(); f.type = filtro; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); env(g, t0, pico, ataque, Math.max(0.01, dur - ataque));
  s.connect(f).connect(g).connect(saida); s.start(t0, Math.random()); s.stop(t0 + dur + 0.1);
  return f;
}
function tom(t0: number, tipo: OscillatorType, f0: number, f1: number, dur: number, pico: number, ataque = 0.01, corte = 0, saida: AudioNode = mestre) {
  const c = ctx!, o = c.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain(); env(g, t0, pico, ataque, dur - ataque);
  if (corte) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = corte; o.connect(f).connect(g); } else o.connect(g);
  g.connect(saida); o.start(t0); o.stop(t0 + dur + 0.1);
}

// ---------- sons do mestre ----------
function batida(t0: number) {
  for (const [dt, k] of [[0, 1], [0.27, 0.9], [0.52, 1.1], [1.6, 0.8], [1.85, 1]] as [number, number][]) {
    tom(t0 + dt, 'sine', 95, 55, 0.18, 0.55 * k, 0.003);
    rajadaRuido(t0 + dt, 0.09, 'lowpass', 900, 0.35 * k, 0.002);
  }
}
function passos(t0: number) {
  for (let i = 0; i < 7; i++) {
    const t = t0 + i * 0.58 + (Math.random() - 0.5) * 0.05, k = 0.15 + i * 0.07;
    rajadaRuido(t, 0.11, 'lowpass', 520 + Math.random() * 150, k, 0.004);
    rajadaRuido(t + 0.03, 0.06, 'bandpass', 1500, k * 0.25, 0.003, 2);
    if (Math.random() < 0.35) tom(t + 0.04, 'triangle', 340 + Math.random() * 80, 300, 0.25, k * 0.05, 0.02, 900); // tábua rangendo
  }
}
function sussurro(t0: number) {
  const c = ctx!, pan = c.createStereoPanner(); pan.pan.value = Math.random() < 0.5 ? -0.7 : 0.7; pan.connect(mestre);
  pan.pan.linearRampToValueAtTime(-pan.pan.value * 0.6, t0 + 3);
  let t = t0;
  for (let i = 0; i < 9; i++) {
    const d = 0.12 + Math.random() * 0.22;
    const f = rajadaRuido(t, d, 'bandpass', 1400 + Math.random() * 1600, 0.09 + Math.random() * 0.05, d * 0.35, 4, pan);
    f.frequency.linearRampToValueAtTime(900 + Math.random() * 2400, t + d);
    t += d + (Math.random() < 0.25 ? 0.25 : 0.04);
  }
}
function rangido(t0: number, saida: AudioNode = mestre, forte = 1) {
  const c = ctx!, o = c.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(70, t0); o.frequency.linearRampToValueAtTime(115, t0 + 0.8); o.frequency.linearRampToValueAtTime(85, t0 + 1.6);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9; bp.frequency.setValueAtTime(650, t0); bp.frequency.linearRampToValueAtTime(1300, t0 + 1.2);
  const tr = c.createGain(); tr.gain.value = 0.5; // "agarra e solta" da dobradiça
  const lf = c.createOscillator(); lf.type = 'square'; lf.frequency.setValueAtTime(18, t0); lf.frequency.linearRampToValueAtTime(34, t0 + 1.4);
  const lg = c.createGain(); lg.gain.value = 0.5; lf.connect(lg).connect(tr.gain);
  const g = c.createGain(); env(g, t0, 0.12 * forte, 0.15, 1.5);
  o.connect(bp).connect(tr).connect(g).connect(saida); o.start(t0); lf.start(t0); o.stop(t0 + 1.8); lf.stop(t0 + 1.8);
}
function sino(t0: number, saida: AudioNode = mestre, vezes = 3) {
  const f = 196, parc: [number, number, number][] = [[0.5, 0.35, 9], [1, 0.5, 7], [1.19, 0.3, 5], [1.5, 0.22, 4], [2, 0.18, 3.5], [2.52, 0.12, 2.5], [3.01, 0.08, 2]];
  for (let v = 0; v < vezes; v++) for (const [r, a, d] of parc) tom(t0 + v * 3.2, 'sine', f * r, f * r * 0.999, d, a * 0.5, 0.004, 0, saida);
}

// ---------- som no lugar ----------
interface FonteViva extends Fonte { pan: PannerNode; prox: number; perto: boolean }
let fontes: FonteViva[] = [], fontesPendentes: Fonte[] = [];
const ouv = { x: 0, y: 0, z: 0 };
function criarFontes(l: Fonte[]) {
  fontes.forEach(f => f.pan.disconnect());
  fontes = l.map(f => {
    const p = ctx!.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse';
    p.refDistance = f.tipo === 'sino' ? 8 : 1.2; p.rolloffFactor = f.tipo === 'sino' ? 0.6 : 1.4; p.maxDistance = 200;
    p.positionX.value = f.x; p.positionY.value = f.y; p.positionZ.value = f.z; p.connect(mestre);
    return { ...f, pan: p, prox: 0, perto: false };
  });
}
function crepitar(f: FonteViva, t0: number) {
  const n = 1 + ((Math.random() * 3) | 0);
  for (let i = 0; i < n; i++) rajadaRuido(t0 + i * 0.012, 0.006 + Math.random() * 0.02, 'bandpass', 2200 + Math.random() * 3000, 0.04 + Math.random() * 0.12, 0.001, 1.5, f.pan);
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
    } else if (e === 'trovao') trovao(0, 0.75);
    else if (e === 'batida') batida(t0);
    else if (e === 'passos') passos(t0);
    else if (e === 'sussurro') sussurro(t0);
    else if (e === 'rangido') rangido(t0);
    else if (e === 'sino') { const f = fontes.find(x => x.tipo === 'sino'); sino(t0, f ? f.pan : mestre, 3); }
  },
  /** A cada quadro: trovões distantes e grilos ao acaso. */
  tick(dt: number) {
    if (!ctx || !ativo || ctx.state !== 'running') return;
    relogio += dt;
    if (nivel.trovao && relogio > proxTrovao) { if (proxTrovao) trovao(0, 0.25 + Math.random() * 0.2); proxTrovao = relogio + 25 + Math.random() * 45; }
    if (nivel.grilos && relogio > proxGrilo) { grilo(); proxGrilo = relogio + 0.4 + Math.random() * 1.6; }
    for (const f of fontes) {
      const d = Math.hypot(f.x - ouv.x, f.y - ouv.y, f.z - ouv.z);
      if (f.tipo === 'velas') { if (d < 16 && relogio > f.prox) { crepitar(f, ctx.currentTime); f.prox = relogio + 0.04 + Math.random() * 0.22; } }
      else if (f.tipo === 'sino') { if (!f.prox) f.prox = relogio + 60 + Math.random() * 60; else if (relogio > f.prox) { sino(ctx.currentTime, f.pan, 2); f.prox = relogio + 120 + Math.random() * 120; } }
      else if (f.tipo === 'porta') { const perto = d < 3.2; if (perto && !f.perto && relogio > f.prox) { rangido(ctx.currentTime, f.pan, 1.6); f.prox = relogio + 20; } f.perto = perto; }
    }
  },
  /** Fontes de som do mapa (trocam com o mapa). */
  setFontes(l: Fonte[]) { fontesPendentes = l; if (ctx) criarFontes(l); },
  /** Ouvinte = câmera (chamar a cada quadro). */
  ouvinte(p: { x: number; y: number; z: number }, frente: { x: number; y: number; z: number }) {
    ouv.x = p.x; ouv.y = p.y; ouv.z = p.z;
    if (!ctx || !ativo) return;
    const L = ctx.listener;
    if (L.positionX) {
      L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z;
      L.forwardX.value = frente.x; L.forwardY.value = frente.y; L.forwardZ.value = frente.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(p.x, p.y, p.z); L.setOrientation(frente.x, frente.y, frente.z, 0, 1, 0); }
  },
};

function aplicar(trans = 0.8) {
  if (!ctx) return;
  const t = ctx.currentTime;
  mestre.gain.cancelScheduledValues(t); mestre.gain.setTargetAtTime(ativo ? volume : 0, t, 0.3);
  ventoG.gain.setTargetAtTime(nivel.vento, t, trans); zumbG.gain.setTargetAtTime(nivel.zumbido, t, trans);
}
