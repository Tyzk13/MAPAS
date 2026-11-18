// Cenas (fichas de cena): o mestre grava clima, tomada da câmera, estilo, legenda, luzes, névoa, lanterna e a
// posição dos personagens criados (vilões/NPCs, com "oculto"); depois passa de uma para outra como slides
// (. e , ou Page Down/Up). Ficam neste navegador, por mapa.
import { st } from './state';
import type { Tomada, Estilo } from './cinema';

export interface Cena {
  n: string; clima: number; tom: Tomada; est: Estilo; cap: string;
  showC: boolean; apagao: boolean; nevoa: boolean; lant: boolean;
  /** posições dos personagens criados: id → {x,z,y,h,f,o} */
  npcs: Record<string, any>;
}

const chave = () => 'mapa3d:cenas:' + st.curMap;
const mem: Record<string, Cena[]> = {};
export function listaCenas(): Cena[] {
  try { const l = JSON.parse(localStorage.getItem(chave()) || 'null'); if (Array.isArray(l)) return l; } catch { /* sem armazenamento */ }
  return mem[st.curMap] || [];
}
function guardar(l: Cena[]) { mem[st.curMap] = l; try { localStorage.setItem(chave(), JSON.stringify(l)); } catch { /* fica só nesta sessão */ } }
export function gravarCena(c: Omit<Cena, 'n'>) {
  const l = listaCenas(); let i = l.length + 1; while (l.some(x => x.n === 'Cena ' + i)) i++;
  l.push({ n: 'Cena ' + i, ...c }); guardar(l); return l;
}
export function apagarCena(i: number) { const l = listaCenas(); l.splice(i, 1); guardar(l); return l; }
