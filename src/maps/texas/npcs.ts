// Moradores de Harlow em pé no mapa (figuras 2D que giram para a câmera), cada um num lugar que combina com ele.
// As imagens são artes de terceiros da pasta do mestre no Pinterest: NÃO vão para o git (repositório público).
// `node tools/baixar-npcs.mjs` baixa para npcs-local/NN.*; sem elas, cada NPC vira uma silhueta escura.
import * as THREE from 'three';
import { groundH } from './nature';

const IMG = import.meta.glob('../../../npcs-local/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const img = (n: number) => Object.entries(IMG).find(([k]) => k.split('/').pop()!.startsWith(String(n).padStart(2, '0') + '.'))?.[1];

export interface Npc {
  /** número da imagem na pasta (01 é o logo do Instagram) */
  i: number; nome: string; papel: string; onde: string;
  x: number; z: number; y?: number; h?: number;
  /** recorte da imagem em frações [x0, y0, x1, y1] (tirar marcas d'água, quadros extras) */
  crop?: [number, number, number, number];
}

// pousada: chão 0.3; delegacia: chão ~0
export const NPCS: Npc[] = [
  { i: 2, nome: 'Wren', papel: 'adolescente que mora no vagão; conhece os túneis e a trilha', onde: 'Vagão', x: -60.5, z: -99 },
  { i: 3, nome: 'Becky Hale', papel: 'irmã da Lily (15); o curativo esconde marcas de dedos frios', onde: 'Praça', x: 8, z: 15.2, h: 1.62 },
  { i: 4, nome: 'Gil Navarro', papel: 'radialista da KHRL; tem as fitas do Night Line', onde: 'Quarto 3 da pousada', x: -130.2, z: 21.2, y: 0.3, h: 1.78 },
  { i: 5, nome: 'Earl Hale', papel: 'fazendeiro, pai da Lily; viu "a menina no milho"', onde: 'Fazenda', x: 152, z: 22, h: 1.85 },
  { i: 6, nome: 'Dep. Manuel Garza', papel: 'pai do Tommy; desespero contido, quer ir à floresta', onde: 'Delegacia · Agentes', x: 22.5, z: 77.5, y: 0.02, h: 1.8 },
  { i: 7, nome: 'Ray Collins', papel: 'vendedor sumido em 1986; reaparece achando que é 1987', onde: 'Motel · porta do quarto 7', x: 69.5, z: 84, h: 1.8, crop: [0, 0, 1, 0.94] },
  { i: 8, nome: 'Frank Kowalski', papel: 'filho da Irene, ex-boxeador; caça a coisa à noite', onde: 'Quarto 5 da pousada', x: -122.4, z: 21, y: 0.3, h: 1.8 },
  { i: 9, nome: 'Sarah Boone', papel: 'mãe do Danny; atende ligações "da filha"', onde: 'Cemitério', x: -70, z: -80, h: 1.66 },
  { i: 10, nome: 'Walt Hutto', papel: 'investigador de 1986, pai do xerife; está nas fotos antigas… e às vezes na estação', onde: 'Estação', x: 9, z: -88.5, h: 1.8, crop: [0, 0, 1, 0.97] },
  { i: 11, nome: '"Tank" McCready', papel: 'dono do saloon; tentou sair de moto e voltou pela outra ponta', onde: 'Saloon', x: -47.5, z: -25.5, h: 1.92, crop: [0, 0, 0.73, 1] },
  { i: 12, nome: 'Irene Kowalski', papel: 'rádio da delegacia; passa o registro às escondidas', onde: 'Delegacia · Rádio', x: 11.8, z: 88.4, y: 0.02, h: 1.62 },
  { i: 13, nome: 'Dep. Tasha Boone', papel: 'quer agir e desobedece o xerife', onde: 'Delegacia · frente', x: 6.5, z: 70.5, h: 1.72 },
  { i: 14, nome: 'Xerife Dale Hutto', papel: 'quer o caso fechado; risca o calendário', onde: 'Sala do xerife', x: 12.4, z: 74.6, y: 0.02, h: 1.83 },
  { i: 15, nome: 'Vivienne "Vee" Laroche', papel: 'fotógrafa presa no laço; fotos com datas impossíveis', onde: 'Quarto 1 da pousada', x: -138.4, z: 21.2, y: 0.3, h: 1.7, crop: [0, 0, 1, 0.97] },
  { i: 16, nome: 'Prefeito Harold Briggs', papel: 'nega tudo; marcou reunião para quinta', onde: 'Praça · tribunal', x: -2, z: 19, h: 1.75, crop: [0, 0, 1, 0.98] },
  { i: 17, nome: 'Juniper Fox', papel: 'ervas e fitas; linha de sal na porta', onde: 'Quarto 4 da pousada', x: -126.3, z: 21.4, y: 0.3, h: 1.7 },
  { i: 18, nome: 'Elias Pruitt Jr.', papel: 'quer fechar o círculo', onde: 'Fazenda · ritual', x: 162.5, z: 34.5, h: 1.76 },
  { i: 19, nome: 'Amos Kell Sr.', papel: 'último vivo da Irmandade do Véu; sabe as palavras', onde: 'Igreja (porta)', x: -44, z: -68.6, h: 1.72 },
  { i: 20, nome: 'Ellen Price', papel: 'dona da pousada; "ela sabe meu nome"', onde: 'Pousada · Recepção', x: -128.6, z: 12.6, y: 0.3, h: 1.66 },
  { i: 21, nome: 'Dusty', papel: 'frentista; vende o mapa da estrada que termina em Harlow dos dois lados', onde: 'Posto', x: -27, z: 86, h: 1.78, crop: [0, 0, 1, 0.92] },
  { i: 22, nome: 'Otis Grant', papel: 'vigia noturno da cooperativa; tem a chave dos silos', onde: 'Silos', x: 40.5, z: -109, h: 1.9 },
  // saloon Lone Star (mandados depois pelo mestre)
  { i: 23, nome: '"Rooster" Doyle', papel: 'motoqueiro, parceiro do Tank; conta da noite em que a estrada "dobrou"', onde: 'Saloon (balcão)', x: -45.5, z: -23.5, h: 1.85, crop: [0, 0, 1, 0.96] },
  { i: 24, nome: 'Spike Calhoun', papel: 'punk de 19 anos; jura que viu um carro de 2025 na rodovia', onde: 'Saloon (sinuca)', x: -43.5, z: -29, h: 1.78, crop: [0, 0, 1, 0.95] },
  { i: 25, nome: 'Jack Mercer', papel: 'barman; serve sempre a mesma dose "da quarta-feira"', onde: 'Saloon (atrás do balcão)', x: -49.5, z: -23, h: 1.85, crop: [0, 0, 1, 0.96] },
  { i: 26, nome: 'Old Hob', papel: 'bêbado da cidade; conta os dias 20 nos dedos e erra de propósito', onde: 'Saloon (mesa do fundo)', x: -50.5, z: -32, h: 1.76, crop: [0, 0, 1, 0.97] },
  { i: 27, nome: '"Big Red" Haskins', papel: 'caminhoneiro preso na cidade; o caminhão está no posto há "dois dias"', onde: 'Saloon (porta)', x: -40.5, z: -26.5, h: 1.95 },
  // igreja
  { i: 28, nome: 'Padre Thomas Kell', papel: 'pastor, filho do Amos; reza o terço toda noite de dia 20', onde: 'Igreja (altar)', x: -46, z: -83.5, h: 1.86 },
  { i: 29, nome: 'Irmã Ruth Abernathy', papel: 'pregadora; lê em voz alta o livro da Irmandade e aponta para a floresta', onde: 'Igreja (nave)', x: -43.2, z: -79, h: 1.72 },
];

/** apaga o fundo liso (branco/cinza) a partir das bordas e corta a sobra transparente */
function cutout(im: HTMLImageElement, crop = [0, 0, 1, 1]) {
  const sx = Math.round(crop[0] * im.width), sy = Math.round(crop[1] * im.height);
  let w = Math.round((crop[2] - crop[0]) * im.width), h = Math.round((crop[3] - crop[1]) * im.height);
  const k = Math.min(1, 512 / h); w = Math.max(1, Math.round(w * k)); h = Math.round(h * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(im, sx, sy, (crop[2] - crop[0]) * im.width, (crop[3] - crop[1]) * im.height, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  // já tem transparência? então só corta
  let transp = 0; for (let i = 3; i < p.length; i += 40) if (p[i] < 20) transp++;
  if (transp < p.length / 400) {
    const seen = new Uint8Array(w * h), st: number[] = [];
    const ref = [p[0], p[1], p[2]];
    for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
    while (st.length) {
      const q = st.pop()!; if (seen[q]) continue; seen[q] = 1;
      const o = q * 4, dr = p[o] - ref[0], dg = p[o + 1] - ref[1], db = p[o + 2] - ref[2];
      const near = dr * dr + dg * dg + db * db < 1600 || (p[o] > 232 && p[o + 1] > 232 && p[o + 2] > 232);
      if (!near) continue;
      p[o + 3] = 0; const x = q % w, y = (q / w) | 0;
      if (x > 0) st.push(q - 1); if (x < w - 1) st.push(q + 1); if (y > 0) st.push(q - w); if (y < h - 1) st.push(q + w);
    }
  }
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  g.putImageData(d, 0, 0);
  if (x1 <= x0 || y1 <= y0) return c;
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d')!.drawImage(c, -x0, -y0); return o;
}

/** silhueta neutra (quando a imagem não foi baixada) */
function silhouette() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 360; const g = c.getContext('2d')!;
  g.fillStyle = '#1c1a18'; g.beginPath(); g.arc(64, 34, 24, 0, 7); g.fill();
  g.beginPath(); g.moveTo(30, 70); g.lineTo(98, 70); g.lineTo(108, 200); g.lineTo(90, 205); g.lineTo(88, 352); g.lineTo(68, 352); g.lineTo(64, 230); g.lineTo(60, 352); g.lineTo(40, 352); g.lineTo(38, 205); g.lineTo(20, 200); g.closePath(); g.fill();
  return c;
}

export function buildNpcs(G: THREE.Group) {
  const O = new THREE.Group(); O.name = 'npcs'; G.add(O);
  const bills: THREE.Object3D[] = [];
  for (const n of NPCS) {
    const h = n.h ?? 1.75, y = n.y ?? groundH(n.x, n.z);
    const piv = new THREE.Group(); piv.position.set(n.x, y, n.z); piv.name = 'npc:' + n.nome; O.add(piv); bills.push(piv);
    const put = (cv: HTMLCanvasElement) => {
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(h * cv.width / cv.height, h), new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1, metalness: 0 }));
      m.position.y = h / 2; // sem sombra: com 28 figuras recortadas a sombra pesava demais (screenshot do teste estourava)
      m.userData.noExport = 1; piv.clear(); piv.add(m);
    };
    put(silhouette());
    const u = img(n.i);
    if (u) { const im = new Image(); im.onload = () => put(cutout(im, n.crop)); im.src = u; }
  }
  const v = new THREE.Vector3();
  return {
    group: O,
    /** gira as figuras para a câmera (só no eixo Y) */
    face(cam: THREE.Camera) { cam.getWorldPosition(v); for (const b of bills) b.rotation.y = Math.atan2(v.x - b.position.x, v.z - b.position.z); },
  };
}
