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
  /** mapa grande: um NPC só aparece perto da câmera / na mesma cena (economiza desenho) */
  npcVisivel?: (t: import('./tokens').Token) => boolean;
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
  /** formata uma distância do mapa (em unidades) para a régua ao arrastar e o painel de locais (ex.: km e dias de viagem) */
  medida?: (d: number) => string;
  /** lugares com mapa próprio em escala de gente: chegando perto aparece "Entrar em …" (core/passagem.ts) */
  passagens?: Passagem[];
  /** neste mapa de dentro, o botão "◂ n" volta para `mapa`, na vista `vista` */
  volta?: { mapa: string; vista: string; n: string };
  /** painel de locais e fichas do mestre */
  locais?: LocalInfo[];
  fichas?: NpcInfo[];
}

/** passagem para o mapa detalhado de um lugar: alvo da câmera a menos de r de (x, z) e câmera a menos de dist */
export interface Passagem { n: string; mapa: string; x: number; z: number; r: number; dist: number; /** vista de chegada no outro mapa */ vista?: string }

/** ficha de um local (painel do mestre, core/locais.ts) */
export interface LocalInfo {
  id: string; n: string; cat: string; tipo: string; vista: string; dentro?: string; publico: string;
  dono: string; funcao: string; npcs: string[]; narrativa: string; rumores: string[]; pistas: string[]; objetos: string[]; segredos: string[]; obs: string;
  /** retângulo no mundo [x0,x1,z0,z1] (duplo clique abre a ficha) e ponto do marcador [x,y,z] */
  area?: [number, number, number, number]; marca?: [number, number, number];
  /** id de outro mapa com este lugar em detalhe (botão "Abrir mapa detalhado"; ex.: Barud dentro do mapa regional) */
  mapa?: string;
}
/** ficha de NPC; tok = id do personagem no mapa (para selecionar) */
export interface NpcInfo {
  id: string; n: string; raca: string; ocupacao: string; local: string; aparencia: string; personalidade: string; historia: string;
  sabe: string[]; rumores: string[]; relacoes: string[]; mestre: string; img?: string; tok?: string;
}

export interface MapModule {
  id: string;
  n: string;
  /** sistema de RPG (agrupa o menu de mapas): 'Ordem Paranormal', 'Tormenta 20'… */
  sis?: string;
  build: (M: MapRuntime) => void | Promise<void>;
}
