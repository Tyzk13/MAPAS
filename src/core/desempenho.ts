// Resolução adaptativa: mede o FPS em janelas de ~2 s e reduz a resolução interna quando a cena fica
// lenta (até 50%); volta a subir aos poucos quando sobra folga. Desligado nas capturas e com ?auto=0.
import { renderScale, setRenderScale } from './engine';
import { CFG } from './config';

// ALVO_MIN baixo o bastante para celulares a 30–40 fps não perderem resolução à toa; ALVO_OK alcançável
// (antes 57: no celular quase nunca voltava a subir). Quadros > TRAVADA ms (carregar céu/HDRI, sonda de
// ambiente, compilar shader) descartam a janela: não são lentidão do aparelho.
const ALVO_MIN = 30, ALVO_OK = 48, JANELA = 2000, TRAVADA = 250;
let n = 0, t0 = 0, folga = 0, ativo = false, ultimo = 0;

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
    n++;
    const dt = agora - t0;
    if (dt < JANELA) return;
    const fps = (n * 1000) / dt;
    n = 0; t0 = agora;
    if (fps < ALVO_MIN && renderScale > 0.5) { setRenderScale(renderScale - (fps < 25 ? 0.15 : 0.1)); folga = 0; }
    else if (fps > ALVO_OK && renderScale < 1) { if (++folga >= 2) { setRenderScale(renderScale + 0.1); folga = 0; } }
    else folga = 0;
  },
  get escala() { return renderScale; },
};
