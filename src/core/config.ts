// Configuração lida da URL.
// ?room=nome  ?map=igreja|campo  ?time=0..4  ?ui=0  ?ro=1  ?walk=1  ?chars=0  ?ws=wss://servidor  ?key=chave  ?q=baixa|media|alta
// Só para as capturas automáticas: ?capture=1 (desliga o laço contínuo e expõe window.__cap)
const Q = new URLSearchParams(location.search);

export type Quality = 'baixa' | 'media' | 'alta';

function defaultQuality(): Quality {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches;
  return coarse ? 'baixa' : 'media';
}

const q = (Q.get('q') || '').toLowerCase();

export const CFG = {
  room: (Q.get('room') || 'mesa1').replace(/[^a-zA-Z0-9-]/g, '-'),
  ws: Q.get('ws') || (window as any).IGREJA_WS || '',
  /** chave de edição do servidor (quando ele exige EDIT_KEY) */
  key: Q.get('key') || '',
  ro: Q.get('ro') === '1',
  time: Math.max(0, +(Q.get('time') || 0) || 0),
  map: Q.get('map') || (window as any).MAPA_PADRAO || 'igreja',
  ui: Q.get('ui') !== '0',
  walk: Q.get('walk') === '1',
  chars: Q.get('chars') !== '0',
  capture: Q.get('capture') === '1',
  quality: (['baixa', 'media', 'alta'].includes(q) ? q : defaultQuality()) as Quality,
};
