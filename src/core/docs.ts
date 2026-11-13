// Documentos da cena (cartas, relatórios, quadros, cartazes…): passar o mouse mostra a lupa; clicar abre o
// documento ampliado e legível. O mestre pode mandá-lo para os jogadores (vira uma "imagem mostrada", que
// também aparece na janela dos jogadores). Os mapas registram em `M.docs` os planos com textura de canvas.
import * as THREE from 'three';
import { cv, cam } from './engine';
import { st } from './state';
import { mostrar, exibir, guardarImagem } from './mostrar';
import { espelho } from './espelho';
import { CFG } from './config';
import { rodar } from './cinema';
import type { MapRuntime } from './types';

const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
let el: HTMLDivElement | null = null, aberto: { n: string; data: string; doc: Doc } | null = null;
const LONGE = 14; // metros: mais longe que isso não abre (evita clicar num papel do outro lado da cidade)

function alvo(e: { clientX: number; clientY: number }) {
  const M = st.MP; if (!M?.docs?.length) return null;
  const r = cv.getBoundingClientRect();
  m2.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(m2, cam); ray.far = LONGE;
  const objs = M.docs.filter(d => d.o.visible && d.o.parent).map(d => d.o);
  const h = ray.intersectObjects(objs, false)[0]; if (!h) return null;
  // parede na frente do papel? (raio contra as paredes do mapa)
  const w = ray.intersectObjects(M.solid(), false)[0];
  if (w && w.distance < h.distance - 0.05) return null;
  return M.docs.find(d => d.o === h.object) || null;
}

function imagemDe(o: THREE.Object3D): string | null {
  const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
  const img = mat?.map?.image as HTMLCanvasElement | HTMLImageElement | undefined;
  if (!img) return null;
  if ((img as HTMLCanvasElement).toDataURL) return (img as HTMLCanvasElement).toDataURL('image/webp', 0.9);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0); return c.toDataURL('image/webp', 0.9);
}

type Doc = NonNullable<MapRuntime['docs']>[number];

function montar() {
  el = document.createElement('div'); el.id = 'lupa'; el.hidden = true;
  el.innerHTML = '<div class="lupa-corpo"><figure><img alt=""><figcaption></figcaption></figure>'
    + '<aside><b>Nota do mestre</b><p></p><small>Só você vê esta nota (não vai para a tela dos jogadores).</small></aside></div>'
    + '<div class="row"><button class="pri" id="lupaj">Mostrar aos jogadores</button><button id="lupac">Levar a câmera até lá</button><button id="lupax">Fechar · Esc</button></div>';
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) fechar(); });
  (el.querySelector('#lupax') as HTMLButtonElement).onclick = fechar;
  (el.querySelector('#lupaj') as HTMLButtonElement).onclick = () => {
    if (!aberto) return;
    const id = 'doc-' + aberto.n.replace(/\W+/g, '-').slice(0, 40);
    const im = { id, data: aberto.data, papel: false, n: aberto.n };
    guardarImagem(im); mostrar.aoNova(im); exibir(id); fechar();
  };
  (el.querySelector('#lupac') as HTMLButtonElement).onclick = () => { const d = aberto?.doc; fechar(); if (d) irAte(d); };
  addEventListener('keydown', e => { if (e.code === 'Escape' && aberto) { e.stopPropagation(); fechar(); } }, true);
}
function abrir(d: Doc, data: string) {
  if (!el) montar();
  aberto = { n: d.n, data, doc: d };
  (el!.querySelector('img') as HTMLImageElement).src = data;
  (el!.querySelector('figcaption') as HTMLElement).textContent = d.onde ? d.n + ' · ' + d.onde : d.n;
  const aside = el!.querySelector('aside') as HTMLElement; aside.hidden = !d.pt; (aside.querySelector('p') as HTMLElement).textContent = d.pt || '';
  (el!.querySelector('#lupaj') as HTMLElement).hidden = CFG.ro;
  el!.hidden = false;
}
function fechar() { aberto = null; if (el) el.hidden = true; }

/** Abre um documento do mapa na lupa (sem mexer na câmera: os jogadores não percebem). */
export function abrirDoc(d: Doc) { const data = imagemDe(d.o); if (data) abrir(d, data); }

/** Leva a câmera (cinema, movimento suave) para enquadrar o documento na cena. */
export function irAte(d: Doc) {
  const o = d.o as THREE.Mesh; o.updateMatrixWorld(true);
  const g = o.geometry; g.computeBoundingBox();
  const c = g.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld);
  const sz = g.boundingBox!.getSize(new THREE.Vector3()), lado = Math.max(sz.x * o.scale.x, sz.y * o.scale.y, 0.25);
  const n = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
  const dist = Math.max(0.7, lado * 1.15);
  let p: THREE.Vector3;
  if (n.y > 0.7) { // papel deitado na mesa: olha de cima, um pouco de lado
    p = c.clone().add(new THREE.Vector3(0.15, dist + 0.2, 0.35 + dist * 0.25));
  } else p = c.clone().addScaledVector(n, dist).add(new THREE.Vector3(0, 0.05, 0));
  rodar({ p: p.toArray() as [number, number, number], t: c.toArray() as [number, number, number], fov: 50 }, 'suave');
}

/** Preenche a lista "Pistas do mapa" (painel do Mestre), agrupada por local. */
export function listarPistas(box: HTMLElement) {
  box.innerHTML = '';
  const docs = st.MP?.docs || [];
  if (!docs.length) { const v = document.createElement('div'); v.className = 'vazio'; v.textContent = 'Este mapa não tem documentos registrados.'; box.appendChild(v); return; }
  const grupos = new Map<string, Doc[]>();
  docs.forEach(d => { const k = d.onde || 'Outros'; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k)!.push(d); });
  grupos.forEach((L, onde) => {
    const h = document.createElement('div'); h.className = 'sub'; h.textContent = onde; box.appendChild(h);
    L.forEach(d => { const b = document.createElement('button'); b.textContent = d.n; b.title = d.pt || ''; b.onclick = () => abrirDoc(d); box.appendChild(b); });
  });
}

// ---------- notas do mestre por vista (cartão só na janela do mestre) ----------
let nota: HTMLDivElement | null = null, vistaAtual = '', fechadaEm = '';
function initNotas() {
  nota = document.createElement('div'); nota.id = 'nota'; nota.hidden = true;
  nota.innerHTML = '<header><b></b><button title="Esconder até mudar de vista" aria-label="Esconder">×</button></header><div class="txt"></div>';
  document.body.appendChild(nota);
  (nota.querySelector('button') as HTMLButtonElement).onclick = () => { fechadaEm = vistaAtual; nota!.hidden = true; };
  setInterval(() => {
    const v = (document.getElementById('bv')?.textContent || '').trim(), M = st.MP;
    if (v === vistaAtual && nota!.dataset.mapa === (M?.id || '')) return;
    vistaAtual = v; nota!.dataset.mapa = M?.id || '';
    const t = M?.notas?.[v];
    if (!t || fechadaEm === v) { nota!.hidden = true; return; }
    fechadaEm = '';
    (nota!.querySelector('b') as HTMLElement).textContent = 'Mestre · ' + v;
    (nota!.querySelector('.txt') as HTMLElement).textContent = t;
    nota!.hidden = false;
  }, 400);
}

/** Liga a lupa (chamar uma vez). Na janela dos jogadores não faz nada. */
// ganchos para o teste automático (tools/testar-lupa.mjs)
(window as any).__docsDbg = (x: number, y: number) => { const M = st.MP; const r = cv.getBoundingClientRect(); m2.set(((x - r.left) / r.width) * 2 - 1, (-(y - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, cam); ray.far = 100; const objs = (M?.docs || []).map(d => d.o); const h = ray.intersectObjects(objs, false)[0]; const w = ray.intersectObjects(M!.solid(), false)[0]; return { n: objs.length, vis: (M?.docs || []).filter(d => d.o.visible).length, cam: cam.position.toArray().map(v => +v.toFixed(1)), hit: h ? [+h.distance.toFixed(2), (M!.docs!.find(d => d.o === h.object) || { n: '?' }).n] : null, wall: w ? +w.distance.toFixed(2) : null }; };
(window as any).__docsAlvo = (x: number, y: number) => { const d = alvo({ clientX: x, clientY: y }); return d ? d.n : null; };
export function initDocs() {
  if (espelho.jogadores) return;
  initNotas();
  let down: { x: number; y: number; t: number } | null = null, lastHover = 0;
  cv.addEventListener('pointerdown', e => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  cv.addEventListener('pointerup', e => {
    const d = down; down = null;
    if (!d || !e.isPrimary || st.drag || document.body.classList.contains('picking')) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 450) return; // foi arrasto
    const doc = alvo(e); if (doc) abrirDoc(doc);
  });
  cv.addEventListener('pointermove', e => {
    if (e.buttons || e.pointerType !== 'mouse') return;
    const now = performance.now(); if (now - lastHover < 120) return; lastHover = now;
    cv.classList.toggle('lupa', !!alvo(e));
  });
}
