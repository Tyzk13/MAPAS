// Lista de mapas disponíveis. Para adicionar um mapa, crie src/maps/<id>.ts com `export function build(M)`
// e acrescente uma linha aqui (ver docs/NOVO-MAPA.md). O núcleo não precisa ser alterado.
import type { MapModule } from '../core/types';

const OP = 'Ordem Paranormal', T20 = 'Tormenta 20';
export const MAPS: Record<string, MapModule> = {
  igreja: { id: 'igreja', sis: OP, n: 'Igreja', build: async M => (await import('./igreja/index')).build(M) },
  mexico: { id: 'mexico', sis: OP, n: 'San Judas (México)', build: async M => (await import('./mexico/index')).build(M) },
  texas: { id: 'texas', sis: OP, n: 'Harlow (Texas)', build: async M => (await import('./texas/index')).build(M) },
  canada: { id: 'canada', sis: OP, n: 'Greywater Falls (Canadá, 1975)', build: async M => (await import('./canada/index')).build(M) },
  barud: { id: 'barud', sis: T20, n: 'Barud (Lomatubar)', build: async M => (await import('./barud/index')).build(M) },
  arton: { id: 'arton', sis: T20, n: 'Sul de Arton (mapa da região)', build: async M => (await import('./arton/index')).build(M) },
  campo: { id: 'campo', sis: OP, n: 'Campo aberto', build: async M => (await import('./campo')).build(M) },
};
