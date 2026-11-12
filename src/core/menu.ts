// Menus suspensos do dock: abre um painel acima do botão, fecha ao escolher, ao clicar fora ou com Esc.
import { $ } from './state';

let aberto: { pop: HTMLElement; btn: HTMLElement } | null = null;

export function fecharMenu() {
  if (!aberto) return;
  aberto.pop.hidden = true; aberto.btn.classList.remove('open'); aberto.btn.setAttribute('aria-expanded', 'false');
  aberto = null;
}

function posicionar(pop: HTMLElement, btn: HTMLElement) {
  const r = btn.getBoundingClientRect();
  pop.style.bottom = Math.round(innerHeight - r.top + 8) + 'px';
  pop.style.top = 'auto';
  const w = pop.offsetWidth;
  pop.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px';
}

/** Liga um botão do dock a um painel. `preencher` (opcional) monta o conteúdo a cada abertura. */
export function menu(btnId: string, popId: string, preencher?: (pop: HTMLElement) => void) {
  const btn = $(btnId) as HTMLElement, pop = $(popId) as HTMLElement;
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const mesmo = aberto?.btn === btn;
    fecharMenu();
    if (mesmo) return;
    preencher?.(pop);
    pop.hidden = false; btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    aberto = { pop, btn };
    posicionar(pop, btn);
    (pop.querySelector('button.cur') as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
  });
}

/** Preenche um painel com uma lista de opções (a atual fica marcada). */
export function lista(pop: HTMLElement, titulo: string, itens: { n: string; cur: boolean; go: () => void }[]) {
  pop.innerHTML = '';
  const h = document.createElement('div'); h.className = 'h'; h.textContent = titulo; pop.appendChild(h);
  for (const it of itens) {
    const b = document.createElement('button'); b.textContent = it.n; b.setAttribute('role', 'menuitemradio');
    b.setAttribute('aria-checked', String(it.cur)); if (it.cur) b.className = 'cur';
    b.onclick = () => { fecharMenu(); it.go(); };
    pop.appendChild(b);
  }
}

export function initMenus() {
  addEventListener('pointerdown', e => {
    if (!aberto) return;
    const t = e.target as Node;
    if (!aberto.pop.contains(t) && !aberto.btn.contains(t)) fecharMenu();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
  addEventListener('resize', fecharMenu);
}
