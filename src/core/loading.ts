// Tela de carregamento com barra de progresso (etapas do código + arquivos baixados).
import * as THREE from 'three';
import { st } from './state';

const bar = () => document.getElementById('lp') as HTMLElement;
const txt = () => document.getElementById('lt') as HTMLElement;
let base = 0, files = { done: 0, total: 0 };
function draw() {
  const el = bar(); if (!el) return; // a tela de carregamento já foi removida
  const f = files.total ? files.done / files.total : 1;
  el.style.width = Math.round(Math.min(1, base * 0.5 + f * 0.5) * 100) + '%';
}
const mgr = THREE.DefaultLoadingManager;
mgr.onProgress = (_u, done, total) => { files = { done, total }; draw(); };

export const loading = {
  step(label: string, p: number) { base = p; const t = txt(); if (t) t.textContent = label; draw(); },
  /** Espera todos os arquivos pendentes (texturas, modelos) e as imagens dos personagens. */
  async waitTextures(timeout = 60000) {
    const t0 = performance.now();
    while (performance.now() - t0 < timeout) {
      const pend = files.total > files.done;
      const toks = Object.values(st.T).some(t => !t.mesh);
      if (!pend && !toks) return;
      await new Promise(r => setTimeout(r, 100));
    }
  },
  done() { base = 1; draw(); const el = document.getElementById('load')!; el.classList.add('done'); setTimeout(() => el.remove(), 800); },
  error(msg: string) { const t = txt(); if (t) t.textContent = 'Erro: ' + msg; else console.error(msg); },
};
