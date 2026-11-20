// Órbita pelo teclado e duplo clique (vale para todos os mapas):
//  · WASD (ou com Shift, mais rápido): desliza a mesa; Q/E: gira em volta do ponto; Z/X: aproxima/afasta;
//  · duplo clique no chão: com um personagem selecionado, ele anda até lá; sem personagem, a câmera voa até o ponto.
// As teclas só valem na órbita (fora da câmera livre/caminhar e do cinema) e fora de campos de texto.
import * as THREE from 'three';
import { cam, ctl, cv } from './engine';
import { st } from './state';
import { CFG } from './config';
import { pick, wk, selT, setTarget, freeSpot, save, marcarDestino, ultimoSelecionado, type Token } from './tokens';

const teclas: Record<string, number> = {};
const V3 = THREE.Vector3, off = new V3(), fr = new V3(), di = new V3();
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
/** a órbita está ativa (o main informa: fora do caminhar/livre/cinema/janela dos jogadores) */
let ativa = () => true;

export function initOrbita(estaAtiva: () => boolean) {
  ativa = estaAtiva;
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^Key[WASDQEZX]$|^Shift/.test(e.code) && ativa()) { teclas[e.code] = 1; }
  });
  addEventListener('keyup', e => { delete teclas[e.code]; });
  addEventListener('blur', () => { for (const k in teclas) delete teclas[k]; });
  cv.addEventListener('dblclick', e => {
    if (!ativa()) return;
    const r = cv.getBoundingClientRect(); m2.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, cam);
    // duplo clique num personagem: só seleciona (o foco já vem do botão)
    const ht = ray.intersectObjects(pick.filter(m => (m.userData.t as Token).g.visible), false)[0];
    if (ht) { selT(ht.object.userData.t as Token); return; }
    const h = ray.intersectObjects(wk(), false)[0]; if (!h) return;
    const t = st.sel || ultimoSelecionado(450);
    if (t && !CFG.ro) {
      selT(t); const [x, z] = freeSpot(t, h.point.x, h.point.z, h.point.y);
      setTarget(t, x, z, h.point.y); save(t, true); marcarDestino(t.target.x, h.point.y, t.target.y);
      return;
    }
    // sem personagem: a câmera voa até o ponto (mantendo o ângulo; não chega mais perto que 6)
    off.copy(cam.position).sub(ctl.target); const d = Math.min(off.length(), Math.max(6, off.length() * 0.6)); off.setLength(d);
    st.anim = { tp: h.point.clone(), cp: h.point.clone().add(off) };
  });
}

/** Chamado a cada quadro na órbita: teclas mexem a câmera de forma suave e independente dos quadros/s. */
export function tickOrbita(dt: number) {
  if (!ativa()) { for (const k in teclas) delete teclas[k]; return false; }
  const k = teclas, fw = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), sd = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), gi = (k.KeyQ ? 1 : 0) - (k.KeyE ? 1 : 0), zo = (k.KeyX ? 1 : 0) - (k.KeyZ ? 1 : 0);
  if (!fw && !sd && !gi && !zo) return false;
  st.anim = null;
  const rapido = k.ShiftLeft || k.ShiftRight ? 2.6 : 1;
  off.copy(cam.position).sub(ctl.target); const dist = off.length();
  if (fw || sd) { // desliza no plano do chão, na direção para onde a câmera olha
    fr.set(-off.x, 0, -off.z).normalize(); di.set(-fr.z, 0, fr.x);
    const v = Math.max(2, dist * 0.9) * rapido * dt, mv = fr.multiplyScalar(fw * v).addScaledVector(di, sd * v);
    ctl.target.add(mv); cam.position.add(mv);
  }
  if (gi) { off.applyAxisAngle(new V3(0, 1, 0), gi * 1.5 * rapido * dt); cam.position.copy(ctl.target).add(off); }
  if (zo) { const nd = Math.max(ctl.minDistance, Math.min(ctl.maxDistance, dist * Math.exp(zo * 1.4 * rapido * dt))); off.setLength(nd); cam.position.copy(ctl.target).add(off); }
  return true;
}
