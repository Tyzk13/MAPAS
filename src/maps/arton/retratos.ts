// Artes dos personagens de Arton (folhas do dono, fora do git): npcs-local/arton/usar/<id>.webp, embutidas no build
// (vite.config: assetsInlineLimit). Módulo pequeno para o Sul de Arton e os mapas das cidades (Valkaria…) usarem
// as mesmas imagens sem duplicar o pacote. Sem a pasta, devolve undefined (ninguém aparece; nada quebra).
const IMG = import.meta.glob('../../../npcs-local/arton/usar/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const retratoArton = (id: string): string | undefined => Object.entries(IMG).find(([k]) => k.endsWith('/' + id + '.webp'))?.[1];
