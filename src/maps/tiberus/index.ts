// Mapa: Tiberus, capital do Império de Tauron (Tormenta 20) — em escala de gente, no nível de Barud: fórum com o
// colosso, Templo de Tauron, cúria, basílica, arena, termas, quartéis, mercado de escravos, ínsulas, aqueduto,
// necrópole; nove prédios com interior, fichas, NPCs (artes do dono) e o povo minotauro. Passagem com o Sul de Arton.
import * as THREE from 'three';
import type { MapRuntime, View } from '../../core/types';
import { begin } from '../../core/kit';
import { Batch, MAT, Q } from '../barud/common';
import { LUZES } from '../barud/cidade';
import { construirPredio, retDe } from '../barud/edificios';
import { PREDIOS_T, mobiliarT } from './predios';
import { construirTiberus, L, FORUM, ARENA, MERCADO, CAMPO } from './cidade';
import { LOCAIS_T, NPCS_T, IMG_T } from './dados';
import { montar, vistaFora, vistaDentro, P3 } from '../gente/montagem';
import { reseed, type V } from '../gente/kit';

export async function build(M: MapRuntime) {
  begin(M, 53); reseed(88); LUZES.length = 0;
  const G = M.G, Mt = MAT(); M.lamps.push(Mt.aceso, Mt.vitral);
  const B = new Batch('predios-tiberus'), BR = new Batch('telhados-predios'), roofs = new THREE.Group(); roofs.name = 'Telhados dos prédios';
  const floors: THREE.Object3D[] = [], solids: THREE.Object3D[] = [], walls: V[][] = [], portals: NonNullable<MapRuntime['vtt']['portals']> = [];
  for (const p of PREDIOS_T) { const c = construirPredio(B, BR, G, p); floors.push(...c.floors); solids.push(...c.solids); walls.push(...c.vtt); portals.push(...c.portals); mobiliarT(B, p.id); }
  const T = await construirTiberus(G, PREDIOS_T);
  B.build(G); BR.build(roofs); G.add(roofs);
  floors.push(...T.c.floors); walls.push(...T.c.vttWalls);
  const solidos = [...solids, T.colliders];
  M.solid = () => solidos; M.walk.push(...floors);
  M.layers = [{ n: 'Telhados', o: T.c.roofs, v: true }, { n: 'Telhados dos prédios', o: roofs, v: true }];

  const ps = T.portoes, sul = ps.find(p => p.z > L - 10)!;
  const vistas: View[] = [
    { n: 'Geral', p: [170, 160, 240], t: [0, 10, 0], fov: 50 },
    { n: 'Cinema', p: [-60, 22, 120], t: [0, 14, 0], fov: 45 },
    { n: 'Fórum', p: [30, 4, 25], t: [-6, 6, -16], fov: 64 },
    { n: 'O colosso', p: [26, 10, 30], t: [0, 14, 2], fov: 58 },
    vistaFora('Templo de Tauron', 't-templo', 22, 5), vistaDentro('Templo · cela', 't-templo', [0, 1.8, 15.5], [0, 4.5, -12], 64),
    vistaFora('Cúria', 't-curia', 14, 3), vistaDentro('Cúria · plenário', 't-curia', [0, 1.8, 11.8], [0, 2, -10], 66),
    vistaFora('Basílica', 't-basilica', 14, 4), vistaDentro('Basílica · nave', 't-basilica', [22, 1.8, 0], [-22, 3, 0], 64),
    { n: 'Arena', p: [ARENA.x - 70, 30, ARENA.z + 50], t: [ARENA.x, 6, ARENA.z], fov: 55 },
    { n: 'Arena · areia', p: [ARENA.x - 18, 1.8, ARENA.z + 4], t: [ARENA.x + 20, 6, ARENA.z - 4], fov: 66 },
    vistaFora('Termas', 't-termas', 14, 3), vistaDentro('Termas · piscinas', 't-termas', [-13, 1.8, 9], [8, 1.2, -4], 66),
    { n: 'Quartéis', p: [CAMPO.x + 6, 24, CAMPO.z + 34], t: [CAMPO.x, 2, CAMPO.z - 2], fov: 58 }, vistaDentro('Quartel · dormitório', 't-quartel', [-13, 1.7, 6], [6, 1.2, -4], 66),
    { n: 'Mercado de Escravos', p: [MERCADO.x + 22, 4, MERCADO.z - 18], t: [MERCADO.x, 1.2, MERCADO.z], fov: 58 },
    vistaFora('Ergástulo', 't-ergastulo', 10, 2.2), vistaDentro('Ergástulo · celas', 't-ergastulo', [6.5, 1.7, 4], [-6, 1.2, -3], 66),
    vistaFora('Chifre de Bronze', 't-taverna', 12, 2.2), vistaDentro('Chifre de Bronze · salão', 't-taverna', [6.5, 1.7, 5], [-6, 1.2, -1.5], 66),
    vistaFora('Casa de Varro', 't-domus', 12, 2.5), vistaDentro('Casa de Varro · átrio', 't-domus', [0, 1.7, 9.4], [0, 1.4, -8], 66),
    vistaFora('Forja da Legião', 't-forja', 10, 2.2), vistaDentro('Forja · oficina', 't-forja', [4.5, 1.7, 4], [-3, 1.2, -3], 66),
    { n: 'Porta Triunfal', p: P3([sul.x + 10, 2.2, sul.z + 36]), t: P3([sul.x, 10, sul.z]), fov: 58 },
    { n: 'Necrópole', p: [16, 3, L + 60], t: [-4, 2, L + 110], fov: 60 },
    { n: 'Aqueduto', p: [-10, 6, -L - 60], t: [-40, 12, -L - 20], fov: 58 },
    { n: 'Muralha', p: [L + 50, 20, L + 60], t: [0, 8, 0], fov: 55 },
    { n: 'Tática', p: [0, 320, 0.1], t: [0, 0, 0], fov: 50 },
  ];

  const R = (x: number, z: number, w: number, d: number): [number, number, number, number] => [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
  montar(M, {
    chamines: T.c.chamines, vistas, predios: PREDIOS_T, locais: LOCAIS_T, npcs: NPCS_T, imgs: IMG_T, prefixo: 'tb_',
    nevoa: [...Array.from({ length: 10 }, (_, i) => ({ x: (i - 5) * 9, z: L + 60 + i * 14, op: 0.12, cor: 0xb0b4c0 })), ...Array.from({ length: 10 }, (_, i) => ({ x: (i % 5 - 2) * 50, z: (Math.floor(i / 5) - 0.5) * 120, op: 0.05 }))],
    areaDe: id => id === 'forum' ? R(0, 0, FORUM.w, FORUM.d) : id === 'arena' ? R(ARENA.x, ARENA.z, ARENA.rx * 2, ARENA.rz * 2) : id === 'mercado' ? R(MERCADO.x, MERCADO.z, MERCADO.w, MERCADO.d) : id === 'necropole' ? R(0, L + 100, 40, 160) : id === 'cidade' ? undefined : undefined,
    marcaDe: id => (T.marcos[id] ? P3(T.marcos[id]) : id === 'cidade' ? [0, 40, 0] : id === 'necropole' ? P3(T.marcos.necropole) : undefined),
    povo: {
      n: 52, dist: 110,
      grupos: [
        { imgs: ['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm10', 'm16', 'm17', 'm19', 'm20', 'a4-02', 'a4-04', 'a4-06', 'a4-08', 'a4-10', 'a4-12'], nome: 'Cidadão minotauro', h: 2.3, peso: 6 },
        { imgs: ['s01', 's03', 's07', 's10', 's04'], nome: 'Legionário', h: 2.35, peso: 2.5 },
        { imgs: ['w10', 'm12', 'v11', 'w16', 'w24', 'm11'], nome: 'Escravo humano', h: 1.72, peso: 2 },
        { imgs: ['c1-03', 'c1-05', 'a2-02', 'a2-04'], nome: 'Mercador anão', h: 1.35, peso: 0.6 },
        { imgs: ['a3-02', 'a3-05', 'c2-03', 'c2-06'], nome: 'Goblin', h: 1.0, peso: 0.5 },
      ],
      lugares: [[0, 10, 30], [ARENA.x, ARENA.z + ARENA.rz + 8, 14], [MERCADO.x, MERCADO.z, 12], [CAMPO.x, CAMPO.z, 12], [0, 70, 6], [-70, 0, 8], [70, 30, 8], [0, -90, 6]],
    },
    vtt: {
      areas: [
        { n: 'Cidade inteira', b: [-L - 8, L + 8, -L - 8, L + 8], lv: 1 }, { n: 'Fórum', b: R(0, 0, FORUM.w + 10, FORUM.d + 10), lv: 1 },
        { n: 'Arena', b: R(ARENA.x, ARENA.z, ARENA.rx * 2 + 6, ARENA.rz * 2 + 6), lv: 1 }, { n: 'Mercado de Escravos', b: R(MERCADO.x, MERCADO.z, MERCADO.w + 8, MERCADO.d + 8), lv: 1 },
        { n: 'Necrópole', b: R(0, L + 100, 50, 170), lv: 1 },
        ...PREDIOS_T.map(p => { const r = retDe(p); return { n: LOCAIS_T.find(l => l.id === p.id)?.n ?? p.id, b: [r[0] - 2, r[1] + 2, r[2] - 2, r[3] + 2] as [number, number, number, number], lv: 1 }; }),
      ], walls, portals,
    },
    volta: { mapa: 'arton', vista: 'Tiberus', n: 'Sul de Arton' }, spawn: [sul.x + 3, sul.z - 12],
  });
  M.exportHide = () => [T.c.roofs, roofs];
  M.shadowRadius = Q.luzes > 8 ? 110 : 75; M.walkLimit = 330; M.camMax = 460; M.fogScale = 0.4;
}
