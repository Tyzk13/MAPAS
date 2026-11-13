// Documentos da cena (cartas, relatórios, quadros, cartazes…): passar o mouse mostra a lupa; clicar abre o
// documento ampliado e legível. O mestre pode mandá-lo para os jogadores (vira uma "imagem mostrada", que
// também aparece na janela dos jogadores). Os mapas registram em `M.docs` os planos com textura de canvas.
import * as THREE from 'three';
import { cv, cam } from './engine';
import { st } from './state';
import { mostrar, exibir, guardarImagem } from './mostrar';
import { espelho } from './espelho';
import { CFG } from './config';

const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
let el: HTMLDivElement | null = null, aberto: { n: string; data: string } | null = null;
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

function montar() {
  el = document.createElement('div'); el.id = 'lupa'; el.hidden = true;
  el.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><div class="row"><button class="pri" id="lupaj">Mostrar aos jogadores</button><button id="lupax">Fechar · Esc</button></div>';
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) fechar(); });
  (el.querySelector('#lupax') as HTMLButtonElement).onclick = fechar;
  (el.querySelector('#lupaj') as HTMLButtonElement).onclick = () => {
    if (!aberto) return;
    const id = 'doc-' + aberto.n.replace(/\W+/g, '-').slice(0, 40);
    const im = { id, data: aberto.data, papel: false, n: aberto.n };
    guardarImagem(im); mostrar.aoNova(im); exibir(id); fechar();
  };
  addEventListener('keydown', e => { if (e.code === 'Escape' && aberto) { e.stopPropagation(); fechar(); } }, true);
}
function abrir(n: string, data: string) {
  if (!el) montar();
  aberto = { n, data };
  (el!.querySelector('img') as HTMLImageElement).src = data;
  (el!.querySelector('figcaption') as HTMLElement).textContent = n;
  (el!.querySelector('#lupaj') as HTMLElement).hidden = CFG.ro;
  el!.hidden = false;
}
function fechar() { aberto = null; if (el) el.hidden = true; }

/** Liga a lupa (chamar uma vez). Na janela dos jogadores não faz nada. */
// ganchos para o teste automático (tools/testar-lupa.mjs)
(window as any).__docsDbg = (x: number, y: number) => { const M = st.MP; const r = cv.getBoundingClientRect(); m2.set(((x - r.left) / r.width) * 2 - 1, (-(y - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, cam); ray.far = 100; const objs = (M?.docs || []).map(d => d.o); const h = ray.intersectObjects(objs, false)[0]; const w = ray.intersectObjects(M!.solid(), false)[0]; return { n: objs.length, vis: (M?.docs || []).filter(d => d.o.visible).length, cam: cam.position.toArray().map(v => +v.toFixed(1)), hit: h ? [+h.distance.toFixed(2), (M!.docs!.find(d => d.o === h.object) || { n: '?' }).n] : null, wall: w ? +w.distance.toFixed(2) : null }; };
(window as any).__docsAlvo = (x: number, y: number) => { const d = alvo({ clientX: x, clientY: y }); return d ? d.n : null; };
export function initDocs() {
  if (espelho.jogadores) return;
  let down: { x: number; y: number; t: number } | null = null, lastHover = 0;
  cv.addEventListener('pointerdown', e => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  cv.addEventListener('pointerup', e => {
    const d = down; down = null;
    if (!d || !e.isPrimary || st.drag || document.body.classList.contains('picking')) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 450) return; // foi arrasto
    const doc = alvo(e); if (!doc) return;
    const data = imagemDe(doc.o); if (data) abrir(doc.n, data);
  });
  cv.addEventListener('pointermove', e => {
    if (e.buttons || e.pointerType !== 'mouse') return;
    const now = performance.now(); if (now - lastHover < 120) return; lastHover = now;
    cv.classList.toggle('lupa', !!alvo(e));
  });
}
