// Aparição: introdução sinistra quando o mestre REVELA um personagem oculto (botão Mostrar) ou adiciona um vilão já
// visível. Tela cheia ~4,6 s: chiado de TV, lampejos da imagem, a figura surge avermelhada tremendo com "glitch",
// avanço brusco no rosto com clarão, corte para o preto — e então ela está na cena. Toca nas duas janelas (a dos
// jogadores recebe pelo espelho) com o som 'aparicao'.
import { st } from './state';

let estilo = false;
function css() {
  if (estilo) return; estilo = true;
  const s = document.createElement('style');
  s.textContent = `#apar{position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;pointer-events:none;opacity:1;transition:opacity .5s}
#apar canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;mix-blend-mode:screen}
#apar img{position:absolute;left:50%;top:50%;height:92vh;max-width:96vw;object-fit:contain;transform:translate(-50%,-50%);opacity:0;will-change:transform,opacity,filter}
#apar .vin{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 35%,rgba(40,0,0,.85) 80%,#000 100%)}
#apar .lin{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 2px,rgba(0,0,0,0) 2px 4px)}
#apar .clr{position:absolute;inset:0;background:#fff;opacity:0}`;
  document.head.appendChild(s);
}

let ativo = 0;
/** Mostra a aparição do personagem `id` nesta janela. */
export function aparicao(id: string) {
  const t = st.T[id]; const src = t?.img; if (!src) return;
  css(); const n = ++ativo;
  document.getElementById('apar')?.remove();
  const el = document.createElement('div'); el.id = 'apar';
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 90;
  const a = new Image(), b = new Image(); a.src = b.src = src;
  b.style.mixBlendMode = 'screen';
  const vin = document.createElement('div'); vin.className = 'vin';
  const lin = document.createElement('div'); lin.className = 'lin';
  const clr = document.createElement('div'); clr.className = 'clr';
  el.append(cv, a, b, vin, lin, clr); document.body.appendChild(el);
  const g = cv.getContext('2d')!, img = g.createImageData(160, 90);
  const ruido = (k: number) => { for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 * k; img.data[i] = v; img.data[i + 1] = v * 0.9; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); };
  const T = 4.6, t0 = performance.now();
  const passo = () => {
    if (n !== ativo) return;
    const s = (performance.now() - t0) / 1000;
    const jit = (k: number) => `translate(calc(-50% + ${(Math.random() - 0.5) * k}px), calc(-50% + ${(Math.random() - 0.5) * k}px))`;
    if (s < 0.7) { // chiado com lampejos da figura
      ruido(1); cv.style.opacity = '1';
      const lamp = (s > 0.22 && s < 0.27) || (s > 0.52 && s < 0.56);
      a.style.opacity = lamp ? '0.9' : '0'; a.style.filter = 'grayscale(1) contrast(2) brightness(1.4)'; a.style.transform = jit(30) + ' scale(1.15)'; b.style.opacity = '0';
    } else if (s < 3.15) { // surge avermelhada, tremendo, com glitch
      const u = (s - 0.7) / 2.45, fl = Math.random() < 0.08 ? 0.35 : 1;
      ruido(0.5); cv.style.opacity = String(0.45 - u * 0.25);
      a.style.opacity = String(Math.min(1, u * 1.6) * fl);
      a.style.filter = `sepia(1) saturate(${3 + u * 3}) hue-rotate(-38deg) brightness(${0.55 + u * 0.5}) contrast(1.35)`;
      a.style.transform = jit(4 + u * 6) + ` scale(${1.18 - u * 0.12})`;
      const gl = Math.random() < 0.18;
      b.style.opacity = gl ? '0.55' : '0'; b.style.filter = 'grayscale(1) brightness(2) sepia(1) hue-rotate(140deg) saturate(6)';
      b.style.transform = `translate(calc(-50% + ${(Math.random() - 0.5) * 40}px), -50%) scale(${1.18 - u * 0.12})`;
    } else if (s < 3.7) { // avanço brusco no rosto + clarão
      const u = (s - 3.15) / 0.55;
      a.style.opacity = '1'; a.style.filter = 'sepia(1) saturate(7) hue-rotate(-40deg) brightness(1.15) contrast(1.6)';
      a.style.transform = jit(26) + ` scale(${1.06 + u * 1.7})`; a.style.transformOrigin = '50% 18%';
      b.style.opacity = '0'; cv.style.opacity = '0.25'; ruido(0.6);
      clr.style.opacity = s < 3.24 ? '0.85' : '0';
    } else { // corte para o preto e some
      a.style.opacity = '0'; b.style.opacity = '0'; cv.style.opacity = '0'; clr.style.opacity = '0';
      if (s > 3.9) el.style.opacity = '0';
    }
    if (s < T) requestAnimationFrame(passo); else el.remove();
  };
  requestAnimationFrame(passo);
}
