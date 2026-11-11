// Mapa-modelo: clareira na floresta com fogueira. Mostra o mínimo para criar um mapa novo
// (ver docs/NOVO-MAPA.md). Tudo que um mapa precisa: construir em M.G, registrar o chão em M.walk,
// e definir vistas, VTT e (opcionalmente) camadas, colisão, luzes e animação.
import * as THREE from 'three';
import type { MapRuntime } from '../core/types';
import { begin, halo } from '../core/kit';
import { makeTerrain, fbm } from '../core/terrain';
import { instance, instanceVariants, type Xf } from '../core/models';
import { grassField } from '../core/grass';
import { CFG } from '../core/config';

export async function build(M: MapRuntime) {
  begin(M, 11);
  const G = M.G;
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  // 1) terreno: plano na clareira, ondulado na mata
  const height = (x: number, z: number) => Math.max(0, Math.hypot(x, z) - 16) * 0.06 * fbm(x * 0.05, z * 0.05, 3) * 4;
  const ter = makeTerrain({
    size: 200, seg: 160, height,
    base: { id: 'leafy_grass', size: 3 }, r: { id: 'forest_ground_04', size: 2.5 }, g: { id: 'brown_mud_leaves_01', size: 2.5 },
    mask: (x, z) => { const d = Math.hypot(x, z + 3); return [Math.max(0, 1 - d / 3.5), Math.min(1, Math.max(0, (Math.hypot(x, z) - 14) / 10))]; },
  });
  G.add(ter.mesh, ter.collider);
  M.walk.push(ter.collider); // onde personagens pisam (malha simples de colisão)

  // gramado procedural (densidade pela qualidade), sem grama em volta da fogueira
  G.add(grassField({ count: { baixa: 4000, media: 15000, alta: 35000 }[CFG.quality], area: [-22, 22, -22, 22], height,
    allow: (x, z) => Math.min(1, Math.max(0, (Math.hypot(x, z + 3) - 2.2) / 2)) * (1 - Math.min(1, Math.max(0, (Math.hypot(x, z) - 16) / 8))) }));

  // 2) modelos espalhados com instancing
  const trees: Xf[] = [];
  for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, r = 20 + rnd() * 45; trees.push({ x: Math.cos(a) * r, y: height(Math.cos(a) * r, Math.sin(a) * r) - 0.1, z: Math.sin(a) * r, ry: rnd() * 6, s: 0.8 + rnd() * 0.4 }); }
  // fir_tree_01 tem 3 variantes (nós-raiz); `variant` escolhe uma
  for (let v = 0; v < 3; v++) (await instance('fir_tree_01', trees.filter((_, i) => i % 3 === v), G, { variant: v, wind: { amp: 0.22, freq: 0.7, flutter: 0.02 } })).forEach(m => (m.userData.canopy = 1));
  const rocks: Xf[] = []; for (let i = 0; i < 18; i++) { const a = rnd() * 6.283, rr = 6 + rnd() * 12; rocks.push({ x: Math.cos(a) * rr, y: 0, z: Math.sin(a) * rr, ry: rnd() * 6, s: 0.6 + rnd() * 0.8 }); }
  await instanceVariants('rock_moss_set_01', rocks, G);
  await instance('tree_stump_01', [{ x: 2.2, y: 0, z: -2, ry: 1 }, { x: -2.4, y: 0, z: -4.2, ry: 2 }], G);

  // 3) fogueira: brasas emissivas + luz pontual (n = intensidade quando as luzes estão acesas)
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  ember.position.set(0, 0.12, -3); ember.scale.y = 0.5; G.add(ember); M.lamps.push(ember.material);
  const fire = new THREE.PointLight(0xff8a3a, 0, 0, 2); fire.position.set(0, 0.8, -3); G.add(fire);
  M.lights.push({ l: fire, d: 0, n: 18 }); halo(0, 0.5, -3, 1.6);
  M.tick = (_dt, t) => { if (fire.intensity > 0) fire.intensity = 18 * (0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 6.7)); };

  // 4) vistas, VTT e região de sombra
  M.shadowRadius = 30;
  M.views = [{ n: 'Geral', p: [0, 14, 22], t: [0, 0, -2] }, { n: 'Tática', p: [0, 40, 0.1], t: [0, 0, 0] }];
  M.walkStart = { x: 0, z: 6 };
  M.vtt = { areas: [{ n: 'Clareira 40×40', b: [-20, 20, -20, 20], lv: 1 }], walls: [], portals: [], lights: [[0, -3, 6, 0.9, 'ff8a3a']] };
}
