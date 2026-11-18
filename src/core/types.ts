import type * as THREE from 'three';
import type { Preset } from './sky';

export interface View { n: string; p: [number, number, number]; t: [number, number, number]; fov?: number }
export interface Layer { n: string; o: THREE.Object3D; v: boolean }

/** Dados para exportar à mesa virtual (Universal VTT). Coordenadas em metros/quadrados do mundo (x, z). */
export interface VttData {
  areas: { n: string; b: [number, number, number, number]; lv: number }[];
  walls: [number, number][][];
  portals: { p: [number, number]; a: [number, number]; b: [number, number] }[];
  /** [x, z, alcance, intensidade, 'rrggbb'] */
  lights: [number, number, number, number, string][];
}

/** Luz pontual registrada pelo mapa: d = intensidade de dia, n = intensidade de noite. */
export interface MapLight { l: THREE.Light; d: number; n: number }

/** Estado de um mapa carregado. Preenchido pela função build() de cada módulo de mapa. */
export interface MapRuntime {
  id: string;
  G: THREE.Group;
  layers: Layer[];
  views: View[];
  loft: THREE.Object3D | null;
  walk: THREE.Object3D[];
  lights: MapLight[];
  glass: THREE.Material[];
  halos: (THREE.Object3D & { material: THREE.Material })[];
  mist: THREE.Sprite[];
  lamps: THREE.MeshBasicMaterial[];
  puddle: THREE.Material | null;
  spawn: (i: number) => { x: number; z: number; y?: number };
  /** NPCs móveis do mapa (viram personagens arrastáveis; o mestre pode ocultar/mover) */
  npcs?: () => Promise<import('./tokens').TokenDef[]>;
  solid: () => THREE.Object3D[];
  walkStart: { x: number; z: number };
  vtt: VttData;
  exportHide: () => THREE.Object3D[];
  tick: ((dt: number, t: number) => void) | null;
  onTime: ((p: Preset) => void) | null;
  /** Limites do mapa para a câmera de sombra do sol. */
  shadowRadius: number;
  /** opcionais para mapas grandes: limite do caminhar (|x|,|z|), distância máx. da câmera, multiplicador da névoa */
  walkLimit?: number;
  /** fontes de som no lugar (velas crepitando, sino, porta que range quando a câmera passa) */
  sons?: { x: number; y: number; z: number; tipo: 'velas' | 'sino' | 'porta' }[];
  /** documentos legíveis na cena: clicar abre ampliado (core/docs.ts) */
  docs?: { o: THREE.Object3D; n: string; /** tradução/nota para o mestre (só na janela dele) */ pt?: string; /** local, para agrupar na lista */ onde?: string }[];
  /** notas do mestre por nome de vista: aparecem num cartão só na janela do mestre */
  notas?: Record<string, string>;
  camMax?: number;
  fogScale?: number;
}

export interface MapModule {
  id: string;
  n: string;
  build: (M: MapRuntime) => void | Promise<void>;
}
