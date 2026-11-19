// Painel de locais e fichas do mestre (genérico: qualquer mapa que preencha M.locais / M.fichas).
// Lista com busca e categorias, ficha do local (texto para ler em voz alta separado dos segredos), fichas de NPC
// com retrato, marcadores com o nome dos lugares sobre a cena e duplo clique num prédio para abrir a ficha.
// Só existe na janela do mestre (nunca na tela dos jogadores nem na tela limpa).
import * as THREE from 'three';
import { cam, cv } from './engine';
import { st } from './state';
import { espelho } from './espelho';
import { selT, setTarget, save, freeSpot } from './tokens';
import { loadMap } from './maps';
import { MAPS } from '../maps/manifest';
import type { LocalInfo, NpcInfo } from './types';

let painel: HTMLDivElement | null = null, marcas: HTMLDivElement | null = null, btn: HTMLButtonElement | null = null;
let irVista: (nome: string) => void = () => {};
const estado = { aba: 'locais' as 'locais' | 'npcs', cat: '', busca: '', segredos: false, marcadores: true, sel: null as null | { t: 'l' | 'n'; id: string } };
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const L = () => st.MP?.locais ?? [], N = () => st.MP?.fichas ?? [];
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
try { estado.segredos = false; estado.marcadores = localStorage.getItem('mapa3d:marcas') !== '0'; } catch { /* */ }

function silhueta() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#1b1714"/><circle cx="30" cy="27" r="13" fill="#3a322b"/><path d="M8 80c0-16 10-28 22-28s22 12 22 28z" fill="#3a322b"/></svg>');
}

export function initLocais(ir: (nome: string) => void) {
  if (espelho.jogadores) return;
  irVista = ir;
  // botão no dock (antes de Personagens)
  btn = document.createElement('button'); btn.id = 'mloc'; btn.title = 'Locais e fichas do mestre'; btn.hidden = true;
  btn.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5h6.5a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H4zM20 4.5h-6.5a2 2 0 0 0-2 2V20a1.5 1.5 0 0 1 1.5-1.5H20z"/></svg><span class="lbl">Locais</span>';
  document.getElementById('mc')?.before(btn);
  btn.onclick = e => { e.stopPropagation(); alternar(); };
  painel = document.createElement('div'); painel.id = 'locais'; painel.hidden = true; document.body.appendChild(painel);
  painel.addEventListener('pointerdown', e => e.stopPropagation());
  painel.addEventListener('keydown', e => e.stopPropagation());
  marcas = document.createElement('div'); marcas.id = 'marcas'; document.body.appendChild(marcas);
  // duplo clique num prédio → ficha
  cv.addEventListener('dblclick', e => {
    const M = st.MP; if (!M?.locais?.length) return;
    const r = cv.getBoundingClientRect(), v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(v, cam);
    const hit = ray.intersectObjects([...M.walk, ...M.solid()], false)[0]; const p = hit?.point ?? (() => { const t = -ray.ray.origin.y / ray.ray.direction.y; return t > 0 ? ray.ray.origin.clone().addScaledVector(ray.ray.direction, t) : null; })();
    if (!p) return;
    const achado = M.locais.filter(l => l.area && p.x > l.area[0] && p.x < l.area[1] && p.z > l.area[2] && p.z < l.area[3]).sort((a, b) => (a.area![1] - a.area![0]) * (a.area![3] - a.area![2]) - (b.area![1] - b.area![0]) * (b.area![3] - b.area![2]))[0];
    if (achado) { estado.aba = 'locais'; estado.sel = { t: 'l', id: achado.id }; abrir(); }
  });
  setInterval(atualizarBotao, 700);
  requestAnimationFrame(loopMarcas);
}

function atualizarBotao() { if (!btn) return; const tem = L().length > 0; btn.hidden = !tem; if (!tem && painel && !painel.hidden) fechar(); }
function alternar() { painel!.hidden ? abrir() : fechar(); }
function abrir() { painel!.hidden = false; btn?.classList.add('open'); desenhar(); }
function fechar() { painel!.hidden = true; btn?.classList.remove('open'); }

function desenhar() {
  if (!painel) return;
  const M = st.MP, cats = [...new Set(L().map(l => l.cat))];
  const titulo = M?.locais?.find(l => l.id === 'cidade')?.n ?? (M ? MAPS[M.id]?.n : '') ?? 'Locais';
  let h = `<header><b>${esc(titulo)}</b><button class="x" title="Fechar" aria-label="Fechar">×</button></header>`;
  h += `<div class="tg2"><button data-a="locais" class="${estado.aba === 'locais' ? 'on' : ''}">Locais</button><button data-a="npcs" class="${estado.aba === 'npcs' ? 'on' : ''}">NPCs</button>
    <span class="esp"></span><button class="sw ${estado.marcadores ? 'on' : ''}" data-sw="marcadores" title="Nomes dos lugares sobre o mapa">Marcadores</button>
    <button class="sw seg ${estado.segredos ? 'on' : ''}" data-sw="segredos" title="Mostrar/esconder segredos do mestre">${estado.segredos ? 'Segredos visíveis' : 'Segredos ocultos'}</button></div>`;
  if (estado.sel) h += ficha();
  else {
    h += `<input class="busca" placeholder="Buscar por nome, dono, rumor…" value="${esc(estado.busca)}">`;
    if (estado.aba === 'locais') {
      h += `<div class="cats"><button data-c="" class="${estado.cat ? '' : 'on'}">Todos</button>${cats.map(c => `<button data-c="${esc(c)}" class="${estado.cat === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>`;
      const q = norm(estado.busca);
      const itens = L().filter(l => (!estado.cat || l.cat === estado.cat) && (!q || norm([l.n, l.tipo, l.dono, l.publico, ...l.rumores].join(' ')).includes(q)));
      h += '<ul class="lista">' + itens.map(l => `<li><button data-l="${l.id}"><b>${esc(l.n)}</b><small>${esc(l.tipo)}</small></button></li>`).join('') + (itens.length ? '' : '<li class="vazio">Nada encontrado.</li>') + '</ul>';
    } else {
      const q = norm(estado.busca);
      const itens = N().filter(n => !q || norm([n.n, n.ocupacao, n.raca, n.aparencia, ...n.rumores].join(' ')).includes(q));
      h += '<ul class="lista npcs">' + itens.map(n => `<li><button data-n="${n.id}"><img src="${n.img || silhueta()}" alt=""><span><b>${esc(n.n)}</b><small>${esc(n.raca)} · ${esc(n.ocupacao)}</small></span></button></li>`).join('') + '</ul>';
    }
  }
  painel.innerHTML = h;
  const q = <T extends Element = HTMLElement>(s: string) => painel!.querySelectorAll<T & HTMLElement>(s);
  (painel.querySelector('.x') as HTMLElement).onclick = fechar;
  q('[data-a]').forEach(b => (b.onclick = () => { estado.aba = b.dataset.a as any; estado.sel = null; desenhar(); }));
  q('[data-sw]').forEach(b => (b.onclick = () => { const k = b.dataset.sw as 'marcadores' | 'segredos'; estado[k] = !estado[k]; if (k === 'marcadores') try { localStorage.setItem('mapa3d:marcas', estado.marcadores ? '1' : '0'); } catch { /* */ } desenhar(); }));
  q('[data-c]').forEach(b => (b.onclick = () => { estado.cat = b.dataset.c!; desenhar(); }));
  q('[data-l]').forEach(b => (b.onclick = () => { estado.sel = { t: 'l', id: b.dataset.l! }; desenhar(); painel!.scrollTop = 0; }));
  q('[data-n]').forEach(b => (b.onclick = () => { estado.sel = { t: 'n', id: b.dataset.n! }; desenhar(); painel!.scrollTop = 0; }));
  q('[data-v]').forEach(b => (b.onclick = () => irVista(b.dataset.v!)));
  q('[data-tok]').forEach(b => (b.onclick = () => { const t = st.T[b.dataset.tok!]; if (t) { selT(t); } }));
  q('[data-mapa]').forEach(b => (b.onclick = () => { fechar(); loadMap(b.dataset.mapa!); }));
  q('[data-grupo]').forEach(b => (b.onclick = () => { const l = L().find(x => x.id === b.dataset.grupo); if (l) levarGrupo(l); }));
  const vb = painel.querySelector('.volta') as HTMLElement | null; if (vb) vb.onclick = () => { estado.sel = null; desenhar(); };
  const bi = painel.querySelector('.busca') as HTMLInputElement | null;
  if (bi) { bi.oninput = () => { estado.busca = bi.value; const pos = bi.selectionStart; desenhar(); const nb = painel!.querySelector('.busca') as HTMLInputElement; nb.focus(); nb.setSelectionRange(pos, pos); }; }
}

const lista = (t: string, xs: string[]) => xs.length ? `<h4>${t}</h4><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const par = (t: string, x: string) => x ? `<h4>${t}</h4><p>${esc(x)}</p>` : '';
function segredo(html: string) {
  if (!html) return '';
  return estado.segredos ? `<div class="segredo"><div class="tit">Só o mestre</div>${html}</div>` : `<div class="segredo fechado">Segredos ocultos — toque em <b>Segredos ocultos</b> acima para ver.</div>`;
}
function ficha(): string {
  const s = estado.sel!;
  if (s.t === 'l') {
    const l = L().find(x => x.id === s.id); if (!l) return '';
    const npcs = l.npcs.map(id => N().find(n => n.id === id)).filter(Boolean) as NpcInfo[];
    return `<button class="volta">‹ Lista</button><div class="ficha">
      <h3>${esc(l.n)}</h3><div class="tipo">${esc(l.tipo)} · ${esc(l.cat)}</div>
      <div class="acoes">${l.vista ? `<button data-v="${esc(l.vista)}">Ir até lá</button>` : ''}${l.dentro ? `<button data-v="${esc(l.dentro)}">Ver por dentro</button>` : ''}${l.mapa && MAPS[l.mapa] ? `<button data-mapa="${esc(l.mapa)}" title="Troca para o outro mapa deste lugar">Abrir mapa: ${esc(MAPS[l.mapa].n)}</button>` : ''}${l.marca || l.dentro ? `<button data-grupo="${l.id}" title="Teleporta os personagens dos jogadores para este lugar">Levar o grupo para cá</button>` : ''}</div>
      <div class="ler"><div class="tit">Para ler em voz alta</div>${esc(l.publico)}</div>
      ${par('Responsável', l.dono)}${par('Função', l.funcao)}
      ${npcs.length ? `<h4>NPCs presentes</h4><div class="chips">${npcs.map(n => `<button data-n="${n.id}">${esc(n.n)}</button>`).join('')}</div>` : ''}
      ${par('História do lugar', l.narrativa)}${lista('Rumores que circulam', l.rumores)}${lista('Pistas', l.pistas)}${lista('Objetos importantes', l.objetos)}
      ${distancias(l)}${segredo(lista('Segredos', l.segredos) + par('Observações', l.obs))}</div>`;
  }
  const n = N().find(x => x.id === s.id); if (!n) return '';
  const loc = L().find(l => l.id === n.local);
  return `<button class="volta">‹ Lista</button><div class="ficha npc">
    <div class="topo"><img src="${n.img || silhueta()}" alt=""><div><h3>${esc(n.n)}</h3><div class="tipo">${esc(n.raca)} · ${esc(n.ocupacao)}</div>
    ${loc ? `<div class="chips"><button data-l="${loc.id}">${esc(loc.n)}</button></div>` : ''}</div></div>
    <div class="acoes">${loc?.dentro || loc?.vista ? `<button data-v="${esc(loc.dentro || loc.vista)}">Ir até o local</button>` : ''}${st.T[n.tok || ''] ? `<button data-tok="${n.tok}">Selecionar no mapa</button>` : ''}</div>
    ${par('Aparência', n.aparencia)}${par('Personalidade', n.personalidade)}${par('História', n.historia)}
    ${lista('O que sabe', n.sabe)}${lista('Rumores que pode contar', n.rumores)}${lista('Relações', n.relacoes)}
    ${segredo(par('Informações do mestre', n.mestre))}
    ${n.img ? '' : '<p class="dica">Imagem: ponha um PNG em <code>npcs-local/</code> (ver docs) e ele aparece aqui e na ficha do mapa.</p>'}</div>`;
}

/** distâncias em linha reta até os outros lugares (só em mapas com escala: M.medida) */
function distancias(l: LocalInfo) {
  const M = st.MP; if (!M?.medida || !l.marca) return '';
  const xs = L().filter(o => o.id !== l.id && o.marca && o.cat !== 'Região').map(o => ({ o, d: Math.hypot(o.marca![0] - l.marca![0], o.marca![2] - l.marca![2]) })).sort((a, b) => a.d - b.d).slice(0, 12);
  if (!xs.length) return '';
  return `<h4>Distâncias (em linha reta)</h4><ul class="dist">${xs.map(({ o, d }) => `<li><button data-l="${o.id}">${esc(o.n)}</button><span>${esc(M.medida!(d))}</span></li>`).join('')}</ul>`;
}
/** teleporta os personagens dos jogadores (não os NPCs) para o lugar: dentro, se houver interior; senão, junto do marcador */
function levarGrupo(l: LocalInfo) {
  const M = st.MP; if (!M) return;
  const vd = l.dentro ? st.V.find(v => v.n === l.dentro) : null;
  const alvo = vd ? new THREE.Vector3(...vd.t) : l.marca ? new THREE.Vector3(l.marca[0], l.marca[1], l.marca[2]) : null; if (!alvo) return;
  const ray = new THREE.Raycaster(new THREE.Vector3(alvo.x, alvo.y + (vd ? 2 : 60), alvo.z), new THREE.Vector3(0, -1, 0), 0, vd ? 30 : 400);
  const chao = ray.intersectObjects(M.walk, false)[0]; const y = chao ? chao.point.y : alvo.y;
  const grupo = Object.values(st.T).filter(t => !t.npc && t.g.visible);
  grupo.forEach((t, i) => { const [x, z] = freeSpot(t, alvo.x - 1.2 + (i % 3) * 1.2, alvo.z + (vd ? 0 : 3) + Math.floor(i / 3) * 1.2, y); setTarget(t, x, z, y); t.g.position.set(t.target.x, y, t.target.y); save(t, true); });
  irVista(vd ? vd.n : l.vista);
}

// ---------- marcadores (nomes sobre os prédios), só na janela do mestre ----------
const v3 = new THREE.Vector3();
function loopMarcas() {
  requestAnimationFrame(loopMarcas);
  if (!marcas) return;
  const M = st.MP, ls = (M?.locais ?? []).filter(l => l.marca);
  if (!estado.marcadores || !ls.length || document.body.classList.contains('limpa') || document.body.classList.contains('nu') || document.body.classList.contains('cine')) { if (marcas.childElementCount) marcas.innerHTML = ''; return; }
  if (marcas.dataset.mapa !== M!.id) { marcas.dataset.mapa = M!.id; marcas.innerHTML = ls.map(l => `<button data-l="${l.id}">${esc(l.n)}</button>`).join(''); marcas.querySelectorAll<HTMLElement>('button').forEach(b => (b.onclick = () => { estado.aba = 'locais'; estado.sel = { t: 'l', id: b.dataset.l! }; abrir(); })); }
  const w = innerWidth, h = innerHeight, els = marcas.children;
  ls.forEach((l, i) => {
    const el = els[i] as HTMLElement; if (!el) return;
    v3.set(l.marca![0], l.marca![1], l.marca![2]);
    const d = v3.distanceTo(cam.position); v3.project(cam);
    const vis = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 && d < 260 && d > 4;
    el.style.display = vis ? '' : 'none';
    if (vis) { el.style.transform = `translate(${((v3.x + 1) / 2 * w).toFixed(0)}px,${((1 - v3.y) / 2 * h).toFixed(0)}px) translate(-50%,-100%)`; el.style.opacity = String(Math.max(0.35, Math.min(1, 1.4 - d / 200))); }
  });
}
