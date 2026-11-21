// Diagnóstico das manchas brancas/pretas (só aparecem em algumas placas de vídeo; o navegador de teste não mostra).
// Tecla F9 abre um painel com chaves que desligam UMA coisa por vez. O mestre vai clicando até as manchas sumirem e
// diz qual foi. A escolha fica salva neste navegador (localStorage) e é aplicada sozinha nas próximas vezes.
import * as THREE from 'three';
import { R, S } from './engine';
import { sun, hemi } from './sky';
import { post } from './post';
import { st } from './state';

type Chave = { id: string; n: string; on: (v: boolean) => void };
const salvo: Record<string, boolean> = (() => { try { return JSON.parse(localStorage.getItem('mapa3d:diag') || '{}'); } catch { return {}; } })();
const guardar = () => { try { localStorage.setItem('mapa3d:diag', JSON.stringify(salvo)); } catch { /* sem armazenamento */ } };
let envGuardado: THREE.Texture | null = null, fogGuardada: THREE.Fog | THREE.FogExp2 | null = null;
const recompilar = () => S.traverse(o => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => (x.needsUpdate = true)); });

const CHAVES: Chave[] = [
  { id: 'sombra', n: 'Sombras do sol/lua', on: v => { R.shadowMap.enabled = v; sun.castShadow = v; recompilar(); } },
  { id: 'sol', n: 'Luz do sol/lua', on: v => { sun.visible = v; } },
  { id: 'ceu', n: 'Luz do céu (hemisfério e luar das cidades)', on: v => { hemi.visible = v; S.traverse(o => { if ((o as THREE.HemisphereLight).isHemisphereLight) o.visible = v; }); } },
  { id: 'env', n: 'Reflexos do céu (HDRI)', on: v => { if (!v) { if (S.environment) envGuardado = S.environment; S.environment = null; } else if (envGuardado) S.environment = envGuardado; } },
  { id: 'pontos', n: 'Luzes de postes e lâmpadas', on: v => { st.MP?.lights.forEach(e => (e.l.visible = v)); } },
  { id: 'nevoa', n: 'Névoa', on: v => { if (!v) { if (S.fog) fogGuardada = S.fog as THREE.FogExp2; S.fog = null; } else if (fogGuardada) S.fog = fogGuardada; recompilar(); } },
  { id: 'pos', n: 'Efeitos de imagem (pós)', on: v => { post.setEnabled(v); } },
];

/** aplica as chaves salvas (chamar depois de cada troca de mapa/clima) */
export function aplicarDiag() { for (const c of CHAVES) if (salvo[c.id] === false) c.on(false); }

export function initDiag() {
  addEventListener('keydown', e => { if (e.key === 'F9') { e.preventDefault(); abrir(); } });
  const b = document.getElementById('bdiag'); if (b) b.onclick = () => abrir();
  setTimeout(aplicarDiag, 1500);
}
function abrir() {
  let p = document.getElementById('diag');
  if (p) { p.remove(); return; }
  p = document.createElement('div'); p.id = 'diag';
  p.style.cssText = 'position:fixed;right:12px;top:60px;z-index:9000;background:#141210ee;color:#e8e0d0;font:13px system-ui;padding:10px 12px;border-radius:10px;border:1px solid #e8c27a55;max-width:300px';
  p.innerHTML = '<b style="color:#e8c27a">Diagnóstico das manchas (F9)</b><div style="opacity:.75;margin:4px 0 8px">Desligue uma de cada vez até as manchas sumirem e me diga qual foi. Fica salvo neste navegador.</div>';
  for (const c of CHAVES) {
    const l = document.createElement('label'); l.style.cssText = 'display:flex;gap:8px;align-items:center;padding:3px 0;cursor:pointer';
    const i = document.createElement('input'); i.type = 'checkbox'; i.checked = salvo[c.id] !== false;
    i.onchange = () => { salvo[c.id] = i.checked; guardar(); c.on(i.checked); };
    l.append(i, document.createTextNode(c.n)); p.appendChild(l);
  }
  const info = document.createElement('div'); info.style.cssText = 'opacity:.6;margin-top:6px;font-size:11px';
  const gl = R.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  info.textContent = 'Placa: ' + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?') + ' · precisão: ' + R.capabilities.precision;
  p.appendChild(info);
  const fechar = document.createElement('button'); fechar.textContent = 'Fechar'; fechar.style.cssText = 'margin-top:8px;padding:4px 10px;border-radius:6px;background:#e8c27a;color:#141210;border:0;cursor:pointer';
  fechar.onclick = () => p!.remove(); p.appendChild(fechar);
  document.body.appendChild(p);
}
