// Estado compartilhado entre os módulos do núcleo.
import type * as THREE from 'three';
import type { MapRuntime, View } from './types';
import type { Token } from './tokens';

export const st = {
  MP: null as MapRuntime | null,
  curMap: '',
  /** índice do clima atual (PRE) */
  pi: 0,
  vi: 0,
  V: [] as View[],
  anim: null as null | { cp: THREE.Vector3; tp: THREE.Vector3 },
  T: {} as Record<string, Token>,
  sel: null as Token | null,
  drag: null as Token | null,
  showC: true,
  /** esta janela é a tela dos jogadores (segundo monitor) */
  jogadores: false,
  snap: true,
  /** posições conhecidas: `${mapa}__${id}` → {x,z,y,h,f} */
  pos: {} as Record<string, any>,
};

export const $ = (id: string) => document.getElementById(id) as any;
