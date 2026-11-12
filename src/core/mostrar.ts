// Mostrar imagem aos jogadores: pista, foto, carta, mapa desenhado… aparece por cima da cena (com efeito de
// papel opcional) e some com I. A imagem vai uma vez para a janela dos jogadores (espelho) e fica guardada lá.
import { $ } from './state';

export interface Imagem { id: string; data: string; papel: boolean; n: string }

const imagens: Imagem[] = [];
let atual = '';

export const mostrar = {
  get atual() { return atual; },
  get lista() { return imagens; },
  porId: (id: string) => imagens.find(i => i.id === id),
  /** avisado quando uma imagem nova entra na lista (o espelho manda para a outra janela) */
  aoNova: (_im: Imagem) => {},
};

/** Guarda (ou atualiza) uma imagem recebida/criada. Mantém as 8 últimas. */
export function guardarImagem(im: Imagem) {
  const i = imagens.findIndex(x => x.id === im.id);
  if (i >= 0) imagens[i] = im; else { imagens.unshift(im); if (imagens.length > 8) imagens.pop(); }
}

/** Lê um arquivo de imagem, reduz para no máximo 1600 px e guarda. */
export async function carregarImagem(f: File, papel: boolean): Promise<Imagem> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const im: Imagem = { id: 'i' + Date.now().toString(36), data: c.toDataURL('image/webp', 0.88), papel, n: f.name.replace(/\.[^.]+$/, '').slice(0, 40) };
    guardarImagem(im); mostrar.aoNova(im);
    return im;
  } finally { URL.revokeObjectURL(url); }
}

/** Mostra a imagem `id` (ou esconde com ''). */
export function exibir(id: string) {
  const el = $('handout') as HTMLElement, im = id ? mostrar.porId(id) : undefined;
  if (id && !im) return false;
  atual = im ? id : '';
  if (im) {
    const img = el.querySelector('img') as HTMLImageElement;
    if (img.dataset.id !== id) { img.src = im.data; img.dataset.id = id; }
    el.classList.toggle('papel', im.papel);
  }
  el.classList.toggle('on', !!im);
  return true;
}
