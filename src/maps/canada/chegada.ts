// Introdução: os agentes chegam a Greywater Falls à noite — dois numa moto, um num carro. Vêm da estrada do norte,
// atravessam a ponte da Falls com os faróis na neblina, descem a Main Street e param em frente ao Hotel Laurentian.
// Dispara quando o mestre escolhe a vista "Chegada (moto e carro)"; a janela dos jogadores segue a câmera e roda a
// mesma animação. As fichas dos jogadores 1 e 2 vão na moto, a 3 dirige o carro; no fim descem para a calçada.
import * as THREE from 'three';
import { st } from '../../core/state';
import { setTarget, save } from '../../core/tokens';
import { espelho } from '../../core/espelho';
import { Batch, TM, riverZ, RIVER } from './common';
import { IM } from './interior';
import { car } from './landmarks';
import { groundH } from './nature';

const LANE = 3.4;                 // faixa da direita de quem desce a Main St para o sul (+z)
const Z0 = -190;                  // de onde vêm (estrada da fábrica)
const STOP_MOTO = -21.5, STOP_CAR = -30.5;
const T_MOTO = 15, T_CAR = 17, ATRASO_CAR = 3.5;
export const VISTA_CHEGADA = { n: 'Chegada (moto e carro)', p: [7.2, 1.55, -12.5] as [number, number, number], t: [0, 2.2, -75] as [number, number, number], fov: 50 };

function moto() {
  const g = new THREE.Group(); g.name = 'moto';
  const I = IM(), m = TM(), B = new Batch('moto');
  // frente = +z local
  const roda = (z: number) => { const t = new THREE.TorusGeometry(0.31, 0.09, 8, 20); t.rotateY(Math.PI / 2); t.translate(0, 0.4, z); B.add(m.iron, t, 0x141414); const c = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8); c.rotateZ(Math.PI / 2); c.translate(0, 0.4, z); B.add(I.steel, c, 0xc8c8c0); };
  roda(0.72); roda(-0.72);
  const bx = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, c: number, rx = 0) => { const q = new THREE.BoxGeometry(w, h, d); if (rx) q.rotateX(rx); q.translate(x, y, z); B.add(mat, q, c); };
  bx(0.12, 0.1, 1.2, 0, 0.62, 0, m.iron, 0x1a1a1a);                    // quadro
  bx(0.32, 0.22, 0.5, 0, 0.88, 0.25, m.paint, 0x5a1410);               // tanque (vermelho escuro)
  bx(0.3, 0.12, 0.7, 0, 0.86, -0.32, I.cloth, 0x141210);               // banco comprido (dois)
  bx(0.34, 0.3, 0.4, 0, 0.56, 0.05, m.iron, 0x3a3a3a);                 // motor
  bx(0.06, 0.06, 0.7, 0.12, 0.42, -0.4, I.steel, 0xb8b8b0, 0.1);       // escapamento
  bx(0.05, 0.62, 0.05, 0, 0.75, 0.68, I.steel, 0xb8b8b0, -0.35);       // garfo
  bx(0.7, 0.04, 0.04, 0, 1.08, 0.58, I.steel, 0xb8b8b0);               // guidão
  { const h = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12); h.rotateX(Math.PI / 2); h.translate(0, 0.98, 0.78); B.add(m.lit, h, 0xffffff); }
  bx(0.1, 0.06, 0.04, 0, 0.82, -0.72, m.paint, 0xb01a10);              // lanterna
  B.build(g, { shadow: true });
  const luz = new THREE.SpotLight(0xffe8c8, 40, 40, 0.38, 0.6, 1.5); luz.position.set(0, 0.98, 0.85); luz.target.position.set(0, 0, 14); g.add(luz, luz.target);
  g.userData.noExport = 1; return g;
}
function carro() {
  const g = new THREE.Group(); g.name = 'carro-agente'; const B = new Batch('carro-agente');
  car(B, 0, 0, -Math.PI / 2, 0x1e2630); // frente para +z
  B.build(g, { shadow: true });
  const luz = new THREE.SpotLight(0xffe8c8, 50, 45, 0.45, 0.6, 1.5); luz.position.set(0, 0.7, 2.7); luz.target.position.set(0, 0, 16); g.add(luz, luz.target);
  g.userData.noExport = 1; return g;
}
/** altura da pista: ponte (tabuleiro) ou chão */
const pista = (x: number, z: number) => { const zc = riverZ(0), L = RIVER.w + 14; return Math.abs(z - zc) < L / 2 ? 0.37 : Math.max(0.04, groundH(x, z) + 0.04); };

export function buildChegada(G: THREE.Group) {
  const M = moto(), C = carro(); G.add(M, C); M.visible = C.visible = false;
  let t0 = -1, ativo = false, desceu = false;
  const pv = new THREE.Vector3(...VISTA_CHEGADA.p);
  // posição ao longo da rua com desaceleração no fim (u 0→1)
  const zAt = (u: number, stop: number) => { const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 2.4); return Z0 + (stop - Z0) * e; };
  return {
    tick(dt: number, t: number, cam: THREE.Camera) {
      const d = cam.position.distanceTo(pv);
      if (d < 0.6 && !ativo) { ativo = true; t0 = t; desceu = false; M.visible = C.visible = true; }
      if (ativo && d > 6) { ativo = false; } // saiu da vista: pode repetir
      if (!M.visible || t0 < 0) return;
      const um = (t - t0) / T_MOTO, uc = (t - t0 - ATRASO_CAR) / T_CAR;
      const zm = zAt(um, STOP_MOTO), zc = zAt(uc, STOP_CAR);
      const lean = um < 1 ? Math.sin((t - t0) * 1.7) * 0.03 : 0;
      M.position.set(LANE + Math.sin((t - t0) * 0.6) * 0.15 * (1 - Math.min(1, um)), pista(LANE, zm), zm); M.rotation.set(0, 0, lean);
      C.position.set(LANE + 0.3, pista(LANE, zc), zc); C.visible = uc > -0.01;
      // fichas dos jogadores: 1 e 2 na moto, 3 no carro (enquanto andam, seguem os veículos — nas duas janelas)
      const jog = Object.values(st.T).filter(k => !k.npc && !k.custom);
      const naMoto = um < 1.05, noCarro = uc < 1.05;
      jog.forEach((k, i) => {
        if (desceu) return;
        if (i < 2 && naMoto) { k.target.set(M.position.x, zm - 0.1 - i * 0.45); k.ty = M.position.y + 0.1; k.g.position.set(k.target.x, k.ty, k.target.y); }
        else if (i === 2 && noCarro) { k.target.set(C.position.x - 0.3, zc + 0.3); k.ty = C.position.y - 0.5; k.g.position.set(k.target.x, k.ty, k.target.y); }
      });
      // parados: descem para a calçada em frente ao hotel (só a janela do mestre grava)
      if (um > 1.15 && uc > 1.1 && !desceu) {
        desceu = true;
        if (!espelho.jogadores) {
          const alvo: [number, number][] = [[8.6, -21.0], [8.6, -22.2], [8.6, -30.0]];
          jog.slice(0, 3).forEach((k, i) => setTimeout(() => { const [x, z] = alvo[i]; setTarget(k, x, z, groundH(x, z) + 0.16); save(k, true); }, i * 700));
        }
      }
    },
  };
}
