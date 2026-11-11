// Lista de mapas disponíveis. Para adicionar um mapa, crie src/maps/<id>.ts com `export function build(M)`
// e acrescente uma linha aqui (ver docs/NOVO-MAPA.md). O núcleo não precisa ser alterado.
import type { MapModule } from '../core/types';

export const MAPS: Record<string, MapModule> = {
  igreja: { id: 'igreja', n: 'Igreja', build: async M => (await import('./igreja/index')).build(M) },
  mexico: { id: 'mexico', n: 'San Judas (México)', build: async M => (await import('./mexico/index')).build(M) },
  campo: { id: 'campo', n: 'Campo aberto', build: async M => (await import('./campo')).build(M) },
};
