// Resolução adaptativa: mede o FPS em janelas de ~2 s e reduz a resolução interna quando a cena fica
// lenta (até 50%); volta a subir aos poucos quando sobra folga. Desligado nas capturas e com ?auto=0.
import { renderScale, setRenderScale } from './engine';
import { CFG } from './config';

// ALVO_MIN baixo o bastante para celulares a 30–40 fps não perderem resolução à toa; ALVO_OK alcançável
// (antes 57: no celular quase nunca voltava a subir). Quadros > TRAVADA ms (carregar céu/HDRI, sonda de
// ambiente, compilar shader) descartam a janela: não são lentidão do aparelho.
const ALVO_MIN = 30, ALVO_OK = 48, JANELA = 2000, TRAVADA = 250;
let n = 0, t0 = 0, folga = 0, ativo = false, ultimo = 0;

// ---------- economia: mestrar sem travar o PC ----------
// Limite de quadros (monitor de 144 Hz não precisa desenhar 144 vezes), janela do mestre leve quando a TV dos
// jogadores está aberta (a TV fica com a qualidade cheia), desenho lento quando ninguém mexe há 20 s e o modo
// leve (sem oclusão de ambiente/profundidade de campo, sombra recalculada menos vezes). Fica salvo no navegador.
const CHAVE = 'mapa3d:desempenho';
export const economia = { cap: 60, leve: false, tvLeve: true, parado: true };
try { Object.assign(economia, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch { /* sem armazenamento: padrão */ }
export function salvarEconomia() { try { localStorage.setItem(CHAVE, JSON.stringify(economia)); } catch { /* */ } }
let ultimoToque = performance.now(), proximo = 0, alvoAtual = 0, qN = 0, qT = performance.now();
/** qualquer toque, tecla, roda ou movimento do mouse acorda a janela */
export const marcarAtividade = () => { ultimoToque = performance.now(); };
if (typeof addEventListener === 'function') for (const e of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(e, marcarAtividade, { passive: true, capture: true });
export const estadoEconomia = { motivo: '', parado: false, qps: 0, alvo: 0 };
/**
 * Decide se este quadro é desenhado. jogadores = esta é a janela dos jogadores; tvAberta = (na do mestre) a janela
 * dos jogadores está ligada; ocupado = câmera em movimento (transição, cinema, caminhar) — aí nunca fica lento.
 */
export function desenharQuadro(ts: number, o: { jogadores: boolean; tvAberta: boolean; ocupado: boolean }) {
  if (CFG.capture) return true;
  let f = economia.cap > 0 ? economia.cap : 0, motivo = '';
  const lim = (v: number, m: string) => { if (!f || v < f) { f = v; motivo = m; } };
  if (economia.leve) lim(30, 'modo leve');
  if (!o.jogadores && o.tvAberta && economia.tvLeve) lim(24, 'TV aberta: o mestre fica leve');
  const parado = !o.jogadores && economia.parado && !o.ocupado && performance.now() - ultimoToque > 20000;
  if (parado) lim(10, 'parado (mexa para voltar)');
  estadoEconomia.motivo = motivo; estadoEconomia.parado = parado; estadoEconomia.alvo = alvoAtual = f;
  if (f) {
    const iv = 1000 / f;
    if (ts < proximo - 1) return false;
    proximo += iv; if (proximo < ts) proximo = ts + iv; // atrasou (aba escondida, travada): ressincroniza
  }
  if (++qN >= 10) { const agora = performance.now(); estadoEconomia.qps = Math.round((qN * 1000) / Math.max(1, agora - qT)); qN = 0; qT = agora; }
  return true;
}

export const desempenho = {
  /** Liga o ajuste automático (chamar depois que o mapa terminou de carregar). */
  iniciar() {
    if (CFG.capture || !CFG.auto) return;
    ativo = true; n = 0; t0 = performance.now();
    // ao voltar para a aba, a janela de medição recomeça (o navegador pausa a animação em segundo plano)
    document.addEventListener('visibilitychange', () => { n = 0; t0 = performance.now(); });
  },
  /** Recomeça a medição (ex.: depois de trocar de mapa ou de qualidade, que travam alguns quadros). */
  reiniciar() { n = 0; t0 = performance.now() + 1500; folga = 0; },
  /** Chamar uma vez por quadro. */
  quadro(agora: number) {
    const dq = agora - ultimo; ultimo = agora;
    if (!ativo || agora < t0) return;
    if (dq > TRAVADA) { n = 0; t0 = agora + 500; return; } // travada pontual: recomeça a medição
    if (alvoAtual && alvoAtual < 20) { n = 0; t0 = agora + 500; return; } // desenhando devagar de propósito: não mede
    n++;
    const dt = agora - t0;
    if (dt < JANELA) return;
    const fps = (n * 1000) / dt;
    n = 0; t0 = agora;
    // com limite de quadros, "lento" é bem abaixo do limite (a 30 qps de propósito não é lentidão)
    const minimo = alvoAtual ? Math.min(ALVO_MIN, alvoAtual * 0.82) : ALVO_MIN, ok = alvoAtual ? Math.min(ALVO_OK, alvoAtual * 0.93) : ALVO_OK;
    if (fps < minimo && renderScale > 0.5) { setRenderScale(renderScale - (fps < minimo * 0.83 ? 0.15 : 0.1)); folga = 0; }
    else if (fps > ok && renderScale < 1) { if (++folga >= 2) { setRenderScale(renderScale + 0.1); folga = 0; } }
    else folga = 0;
  },
  get escala() { return renderScale; },
};
