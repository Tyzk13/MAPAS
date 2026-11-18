// Cena de abertura: o ônibus intermunicipal chega pela rodovia na neblina, para no ponto em frente à delegacia,
// abre a porta e os agentes (fichas dos jogadores) aparecem descendo. Dispara quando o mestre escolhe a vista
// "Chegada (ônibus)"; a janela dos jogadores segue a câmera, então vê a mesma coisa. Sair da vista e voltar repete.
import * as THREE from 'three';
import { st } from '../../core/state';
import { setTarget, save } from '../../core/tokens';
import { espelho } from '../../core/espelho';
import { sign, HWY } from './common';
import { groundH } from './nature';

/** ponto de ônibus (acostamento sul da rodovia, em frente à delegacia) */
export const PONTO = { x: 16, z: HWY - 6 };
const PARA = PONTO.x + 4.5;          // x do centro do ônibus parado (porta na frente, perto da placa)
const FAIXA = HWY - 2.6;             // faixa de quem vai para oeste (mão direita = lado −z)
const INICIO = 230, DUR = 13;        // vem de x = 230 e leva 13 s até parar
export const VISTA_ONIBUS = { n: 'Chegada (ônibus)', p: [PONTO.x - 9, 1.7, PONTO.z - 0.8] as [number, number, number], t: [PONTO.x + 15, 1.9, FAIXA + 0.5] as [number, number, number], fov: 55 };

function bus() {
  const g = new THREE.Group(); g.name = 'onibus';
  const M = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.3, ...o });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  // frente para −x (vai para oeste); lado da porta = −z
  const L = 12, W = 2.55;
  box(L, 2.3, W, 0, 1.75, 0, M(0xb8bcc0, { metalness: 0.6, roughness: 0.35 }));           // carroceria de alumínio
  box(L - 0.4, 0.75, W + 0.02, 0.1, 2.25, 0, M(0x101418, { roughness: 0.1, metalness: 0.2 })); // faixa de janelas
  box(L + 0.02, 0.18, W + 0.03, 0, 1.25, 0, M(0x2a4a8a));                                   // faixa azul
  box(L, 0.2, W - 0.1, 0, 2.95, 0, M(0x9a9ea4));                                            // teto
  box(0.05, 1.2, W - 0.3, -L / 2 - 0.01, 2.2, 0, M(0x101418, { roughness: 0.08 }));        // para-brisa
  const porta = box(0.95, 2.1, 0.06, -L / 2 + 1.2, 1.55, -W / 2 - 0.03, M(0x1a2228, { roughness: 0.1 }));
  const farol = new THREE.MeshBasicMaterial({ color: 0xfff2d0, toneMapped: false });
  [-0.85, 0.85].forEach(z => box(0.06, 0.18, 0.4, -L / 2 - 0.02, 0.95, z, farol));
  const lanterna = new THREE.MeshBasicMaterial({ color: 0xff2010, toneMapped: false });
  [-1.0, 1.0].forEach(z => box(0.06, 0.25, 0.25, L / 2 + 0.02, 0.95, z, lanterna));
  const placa = sign('HARLOW', 1.6, 0.3, { bg: '#1a1408', fg: '#ffb030', font: 'bold 64px "Courier New", monospace' });
  placa.position.set(-L / 2 - 0.04, 2.75, 0); placa.rotation.y = -Math.PI / 2; g.add(placa);
  const roda = new THREE.CylinderGeometry(0.52, 0.52, 0.35, 18).rotateX(Math.PI / 2), mr = M(0x141414, { roughness: 0.9, metalness: 0 });
  const rodas: THREE.Mesh[] = [];
  [-L / 2 + 1.9, L / 2 - 2.6, L / 2 - 1.5].forEach(x => [-1, 1].forEach(s => { const r = new THREE.Mesh(roda, mr); r.position.set(x, 0.52, s * (W / 2 - 0.12)); g.add(r); rodas.push(r); }));
  // farol iluminando a estrada
  const luz = new THREE.SpotLight(0xffe8c0, 60, 45, 0.45, 0.6, 1.5); luz.position.set(-L / 2, 1.0, 0); luz.target.position.set(-L / 2 - 20, 0, 0); g.add(luz, luz.target);
  g.userData.noExport = 1;
  return { g, porta, rodas, luz };
}

export function buildOnibus(G: THREE.Group) {
  // ponto: placa, banco e cobertura simples
  const P = new THREE.Group(); P.name = 'ponto-de-onibus'; G.add(P);
  const y0 = groundH(PONTO.x, PONTO.z);
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.6, roughness: 0.5 }));
  poste.position.set(PONTO.x, y0 + 1.3, PONTO.z); P.add(poste);
  const ps = sign('BUS STOP', 0.7, 0.45, { bg: '#1c3a7a', fg: '#ffffff', sub: 'Greyline · Harlow' });
  ps.position.set(PONTO.x, y0 + 2.35, PONTO.z + 0.03); P.add(ps);
  const banco = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.9 }));
  banco.position.set(PONTO.x - 1.6, y0 + 0.45, PONTO.z - 0.6); banco.castShadow = true; P.add(banco);

  const B = bus(); G.add(B.g); B.g.visible = false;
  const yR = groundH(PARA, FAIXA);
  let t0 = -1, ativo = false, desceu = false;
  const pos = (u: number) => { // u 0→1 com desaceleração no fim
    const e = 1 - Math.pow(1 - Math.min(1, u), 2.2);
    return INICIO + (PARA - INICIO) * e;
  };
  return {
    lamps: [] as THREE.MeshBasicMaterial[],
    tick(dt: number, t: number, cam: THREE.Camera) {
      const perto = cam.position.distanceTo(new THREE.Vector3(...VISTA_ONIBUS.p)) < 0.6;
      if (perto && !ativo) { ativo = true; t0 = t; desceu = false; B.g.visible = true; }
      if (!perto && ativo && cam.position.distanceTo(new THREE.Vector3(...VISTA_ONIBUS.p)) > 6) ativo = false; // saiu: pode repetir
      if (!B.g.visible || t0 < 0) return;
      const u = (t - t0) / DUR, x = pos(u), x2 = pos(u + dt / DUR);
      B.g.position.set(x, groundH(x, FAIXA) * 0.5 + yR * 0.5, FAIXA);
      B.rodas.forEach(r => (r.rotation.z += (x2 - x) / 0.52));
      // porta abre 1 s depois de parar; agentes descem um a um
      const parado = t - t0 - DUR;
      B.porta.position.z = -2.55 / 2 - 0.03 - (parado > 1 ? Math.min(1, parado - 1) * 0.05 : 0);
      B.porta.position.x = -6 + 1.2 + (parado > 1 ? Math.min(1, parado - 1) * 0.9 : 0);
      if (parado > 2.2 && !desceu && !espelho.jogadores) {
        desceu = true;
        const jog = Object.values(st.T).filter(k => !k.npc && !k.custom);
        jog.forEach((k, i) => setTimeout(() => {
          const px = PARA - 6 + 1.2 - i * 0.9, pz = FAIXA - 2.0 - (i % 2) * 0.5;
          setTarget(k, px, pz, groundH(px, pz)); k.g.position.set(px, groundH(px, pz), FAIXA - 1.6); save(k, true);
        }, i * 900));
      }
    },
  };
}
