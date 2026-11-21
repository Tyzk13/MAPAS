// Passagem entre mapas (vale para qualquer mapa): um lugar do mapa grande que tem mapa próprio em escala de gente.
//  · no mapa grande (M.passagens): chegando perto do lugar (alvo da câmera dentro do raio e câmera abaixo de `dist`),
//    aparece o botão "Entrar em …"; ele escurece a tela, carrega o outro mapa e abre na vista pedida;
//  · no mapa de dentro (M.volta): o botão "◂ …" leva de volta ao mapa grande, na vista do lugar.
// Só na janela do mestre (a dos jogadores acompanha a troca pelo espelho); some na tela limpa e no cinema.
import { cam, ctl } from './engine';
import { st, $ } from './state';
import { MAPS } from '../maps/manifest';
import type { Passagem } from './types';

let carregar: (id: string) => Promise<void> = async () => {};
let irVista: (nome: string) => boolean = () => false;
let ocupado = false, atual: Passagem | null = null, ultMapa = '';

/** liga a passagem ao carregador de mapas e ao "ir para a vista" do main (sem dependência circular) */
export function initPassagem(o: { loadMap: (id: string) => Promise<void>; vista: (nome: string) => boolean }) {
  carregar = o.loadMap; irVista = o.vista;
  ($('bpass') as HTMLButtonElement).onclick = () => {
    const M = st.MP; if (!M) return;
    if (atual) trocar(atual.mapa, atual.vista);
    else if (M.volta) trocar(M.volta.mapa, M.volta.vista);
  };
}

/** escurece, troca de mapa, vai para a vista e clareia */
export async function trocar(mapa: string, vista?: string) {
  if (ocupado || !MAPS[mapa]) return; ocupado = true;
  const f = $('fade') as HTMLElement, b = $('bpass') as HTMLElement;
  b.classList.remove('on');
  f.style.transition = 'opacity .45s'; f.style.opacity = '1';
  await new Promise(r => setTimeout(r, 480));
  try {
    if (mapa !== st.curMap) await carregar(mapa);
    if (vista) { const i = st.V.findIndex(v => v.n === vista); if (i >= 0) { const v = st.V[i]; st.vi = i; $('bv').textContent = v.n; st.anim = null; cam.position.set(...v.p); ctl.target.set(...v.t); if (v.fov) { cam.fov = v.fov; cam.updateProjectionMatrix(); } ctl.update(); irVista(vista); } }
  } finally {
    f.style.opacity = '0'; setTimeout(() => { f.style.transition = ''; }, 600);
    ocupado = false; atual = null; ultMapa = '';
  }
}

/** a cada quadro (barato): mostra/esconde o botão conforme a câmera */
export function tickPassagem() {
  const M = st.MP, b = $('bpass') as HTMLElement | null; if (!M || !b || ocupado) return;
  let p: Passagem | null = null;
  if (M.passagens) {
    const t = ctl.target, d = cam.position.distanceTo(t);
    for (const q of M.passagens) if (MAPS[q.mapa] && d < q.dist && Math.hypot(t.x - q.x, t.z - q.z) < q.r) { p = q; break; }
  }
  const txt = p ? `Entrar em ${p.n} ▸` : M.volta && MAPS[M.volta.mapa] ? `◂ ${M.volta.n}` : '';
  const chave = M.id + '|' + txt;
  if (chave !== ultMapa) { ultMapa = chave; b.textContent = txt; b.title = p ? `Abre o mapa de ${p.n} em escala de gente` : M.volta ? `Volta para o mapa ${M.volta.n}` : ''; }
  atual = p; b.classList.toggle('on', !!txt); b.classList.toggle('volta', !p && !!txt);
}
