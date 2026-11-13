// Resolução adaptativa: mede o FPS em janelas de ~2 s e reduz a resolução interna quando a cena fica
// lenta (até 50%); volta a subir aos poucos quando sobra folga. Desligado nas capturas e com ?auto=0.
import { renderScale, setRenderScale } from './engine';
import { CFG } from './config';

const ALVO_MIN = 40, ALVO_OK = 57, JANELA = 2000;
let n = 0, t0 = 0, folga = 0, ativo = false;

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
    if (!ativo || agora < t0) return;
    n++;
    const dt = agora - t0;
    if (dt < JANELA) return;
    const fps = (n * 1000) / dt;
    n = 0; t0 = agora;
    if (fps < ALVO_MIN && renderScale > 0.5) { setRenderScale(renderScale - (fps < 25 ? 0.15 : 0.1)); folga = 0; }
    else if (fps > ALVO_OK && renderScale < 1) { if (++folga >= 3) { setRenderScale(renderScale + 0.1); folga = 0; } }
    else folga = 0;
  },
  get escala() { return renderScale; },
};
