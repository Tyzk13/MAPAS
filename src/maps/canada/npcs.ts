// Moradores de Greywater Falls (1975): personagens móveis do mapa com as aparências da pasta do mestre no Pinterest,
// e cartazes/retratos feitos com as mesmas imagens (cartaz de DESAPARECIDO do Moreau, "In memoriam" de Margaret no
// saguão, foto do casamento no 304, foto do Jean na casa dos Moreau).
// As imagens são de terceiros: NÃO vão para o git (repositório público). Baixar e recortar:
//   node tools/baixar-npcs.mjs https://pin.it/6FDe5jQ5t npcs-local/canada   → depois o recorte vai para npcs-local/canada/cut/NN.png
// Sem elas, cada um vira uma silhueta escura e os cartazes ficam só com o texto.
import * as THREE from 'three';
import type { TokenDef } from '../../core/tokens';
import { cutout, silhouette } from '../texas/npcs';
import { groundH } from './nature';
import { docPlane } from './interior';
import { rnd } from './common';

const IMG = import.meta.glob('../../../npcs-local/canada/cut/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const url = (n: number) => Object.entries(IMG).find(([k]) => k.split('/').pop() === String(n).padStart(2, '0') + '.png')?.[1];
const cache = new Map<number, Promise<HTMLImageElement | null>>();
export const imagem = (n: number) => { if (!cache.has(n)) cache.set(n, new Promise(r => { const u = url(n); if (!u) return r(null); const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = u; })); return cache.get(n)!; };

export interface Morador { i: number; nome: string; papel: string; onde: string; x: number; z: number; y?: number; h?: number; oculto?: boolean }
// hotel: térreo y 0,2 · 2º andar 4,4 · 3º andar 8,0 (origem do hotel em x 10,5 / z −32)
export const MORADORES: Morador[] = [
  { i: 15, nome: 'William Ashdown', papel: 'dono do Hotel Laurentian; ex-alfaiate; bebe no próprio bar e fala sozinho ("sim, Maggie")', onde: 'Hotel · Beverage room', x: 19.1, z: -11.2, y: 0.2, h: 1.8 },
  { i: 3, nome: 'Margaret Ashdown', papel: 'a esposa morta; entidade de Conhecimento. COMEÇA OCULTA (só o mestre vê) no quarto 307', onde: 'Hotel · Quarto 307', x: 24.6, z: -10.6, y: 8.0, h: 1.65, oculto: true },
  { i: 2, nome: 'Dr. Harold Finch', papel: 'legista do distrito; mora no 204; desconfia do próprio laudo de 1974', onde: 'Necrotério · Gabinete', x: -31.5, z: 41.6, y: 0.35, h: 1.78 },
  { i: 14, nome: 'Sra. Agathe Doucette', papel: 'viúva do 303; ouve tudo pela parede; olhos cinza-esverdeados (a próxima)', onde: 'Hotel · Quarto 303', x: 13.6, z: -16.4, y: 8.0, h: 1.6 },
  { i: 6, nome: 'Émile Brodeur', papel: 'recepcionista da noite (19); viu William subir com "um tapete enrolado"', onde: 'Hotel · Recepção', x: 20.2, z: -16.8, y: 0.2, h: 1.72 },
  { i: 22, nome: 'Lucien Gauthier', papel: 'gerente do hotel; quer evitar escândalo; irmão do agente funerário', onde: 'Hotel · Escritório', x: 25.0, z: -27.4, y: 0.2, h: 1.76 },
  { i: 20, nome: 'Sophie Ste-Marie', papel: 'camareira; não limpa mais o 304 ("cheiro de gelo e de lírios")', onde: 'Hotel · 3º andar', x: 20.5, z: -24.0, y: 8.0, h: 1.66 },
  { i: 7, nome: 'Marcel Lavoie', papel: 'operário da fábrica; amigo do Moreau; bebe no Laurentian toda noite', onde: 'Hotel · Beverage room', x: 14.4, z: -11.9, y: 0.2, h: 1.82 },
  { i: 16, nome: '"Big Gus" Bouchard', papel: 'operário; acha que o Moreau "fugiu da Lise"', onde: 'Hotel · Beverage room', x: 17.0, z: -11.4, y: 0.2, h: 1.84 },
  { i: 17, nome: 'Pete Ouellet', papel: 'operário jovem; o Ashdown tirou as medidas dele em outubro e disse "não serve"', onde: 'Hotel · Beverage room', x: 12.9, z: -8.2, y: 0.2, h: 1.78 },
  { i: 25, nome: 'Hélène Côté', papel: 'piloto de hidroavião, hóspede de passagem; viu luz dourada na janela do 307', onde: 'Hotel · Sala de jantar', x: 16.5, z: -26.0, y: 0.2, h: 1.7 },
  { i: 19, nome: 'Policial André Roy (O.P.P.)', papel: 'polícia provincial; acha que é "um ladrão de túmulos doente"', onde: 'Cemitério', x: -111.5, z: -54.4, h: 1.9 },
  { i: 12, nome: 'René Tremblay', papel: 'capataz do turno da noite; viu William esperando o Moreau no portão', onde: 'Fábrica · escritório', x: 69.2, z: -168.4, y: 0.12, h: 1.78 },
  { i: 24, nome: 'Lise Moreau', papel: 'esposa do Jean; a janta no forno desde domingo', onde: 'Casa dos Moreau', x: 74.2, z: 47.0, y: 0.5, h: 1.66 },
  { i: 10, nome: 'Luc Moreau', papel: 'filho do Jean (9 anos); diz que "o moço do hotel" mediu o pai com uma fita', onde: 'Casa dos Moreau', x: 73.4, z: 49.2, y: 0.5, h: 1.3 },
  { i: 18, nome: 'Dot', papel: 'garçonete da Lucky Star; serviu William e Moreau no domingo 23h20', onde: 'Lanchonete', x: 89.0, z: 46.3, y: 0.1, h: 1.66 },
  { i: 4, nome: 'Claire Pelletier', papel: 'sobrinha de Eva (17); cuida da casa e do piano; achou o caderno de aulas', onde: 'Casa de Eva Pelletier', x: -74.2, z: -6.8, y: 0.5, h: 1.62 },
  { i: 13, nome: 'Yves Dumont', papel: 'entregador da Northern Ice Co.; leva gelo ao 307 e "não pode subir"', onde: 'Hotel · porta dos fundos', x: 31.6, z: -9.6, h: 1.8 },
  { i: 5, nome: 'Jo Lacroix', papel: 'frentista do Northern Gas; viu o carro do Ashdown na ponte domingo à noite', onde: 'Posto', x: 43.4, z: 45.2, h: 1.68 },
  { i: 23, nome: 'Theo', papel: 'andarilho que dorme na estação; conhecia o Kowalczyk ("o Stan não tinha família")', onde: 'Estação', x: 30.0, z: 139.0, y: 0.3, h: 1.8 },
  { i: 26, nome: 'Tommy Gagnon', papel: 'jornaleiro (12); vende o Examiner na esquina do hotel', onde: 'Main St · esquina do hotel', x: 8.6, z: -36.6, y: 0.16, h: 1.45 },
  { i: 9, nome: 'Nadine Brault', papel: 'repórter do Greywater Examiner; está juntando os casos', onde: 'Main Street', x: -8.6, z: -2.0, y: 0.16, h: 1.68 },
];

/** NPCs como personagens móveis (arrastar, ocultar, mudar tamanho); Margaret nasce oculta */
export async function moradores(): Promise<TokenDef[]> {
  const sil = silhouette().toDataURL('image/png');
  return Promise.all(MORADORES.map(async n => {
    const im = await imagem(n.i);
    return { id: 'gw' + n.i, name: n.nome, h: n.h ?? 1.75, c: 0x5a5650, img: im ? cutout(im).toDataURL('image/png') : sil, npc: true,
      pos: { x: n.x, z: n.z, y: n.y ?? groundH(n.x, n.z), oc: !!n.oculto } };
  }));
}

// ---------------- cartazes e retratos ----------------
type G2 = CanvasRenderingContext2D;
/** textura que é desenhada já (sem imagem) e de novo quando a imagem carrega */
function texCom(w: number, h: number, n: number[], draw: (g: G2, ims: (HTMLImageElement | null)[]) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  draw(g, n.map(() => null));
  Promise.all(n.map(imagem)).then(ims => { if (ims.some(Boolean)) { g.clearRect(0, 0, w, h); draw(g, ims); t.needsUpdate = true; } });
  return t;
}
/** retrato: parte de cima da figura (cabeça e ombros) dentro de um retângulo, em sépia/preto e branco */
function retrato(g: G2, im: HTMLImageElement | null, x: number, y: number, w: number, h: number, o: { sepia?: boolean; frac?: number } = {}) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const bgc = g.createLinearGradient(0, y, 0, y + h); bgc.addColorStop(0, '#8a8478'); bgc.addColorStop(1, '#4a4640'); g.fillStyle = bgc; g.fillRect(x, y, w, h);
  if (im) {
    const fr = o.frac ?? 0.42, sh = im.height * fr, sw = Math.min(im.width, sh * w / h), sx = (im.width - sw) / 2;
    g.filter = o.sepia === false ? 'grayscale(1) contrast(1.1)' : 'sepia(0.75) contrast(1.05) brightness(0.95)';
    g.drawImage(im, sx, 0, sw, sh, x, y + h * 0.06, w, h * 0.94); g.filter = 'none';
  } else { g.fillStyle = '#2a2622'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.38, w * 0.16, h * 0.2, 0, 0, 7); g.fill(); g.fillRect(x + w * 0.22, y + h * 0.62, w * 0.56, h * 0.4); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '40,30,20' : '255,250,235'},${rnd() * 0.08})`; g.fillRect(x + rnd() * w, y + rnd() * h, 2, 2); }
  g.restore();
}
function cartazMoreau(g: G2, ims: (HTMLImageElement | null)[]) {
  const W = 512, H = 700; g.fillStyle = '#ece6d4'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#141414'; g.textAlign = 'center'; g.font = 'bold 86px "Arial Black", Arial'; g.fillText('MISSING', W / 2, 92); g.font = 'bold 34px Arial'; g.fillText('DISPARU', W / 2, 132);
  retrato(g, ims[0], 96, 152, 320, 330, { sepia: false, frac: 0.36 }); g.strokeStyle = '#141414'; g.lineWidth = 3; g.strokeRect(96, 152, 320, 330);
  g.font = 'bold 40px Arial'; g.fillText('JEAN MOREAU', W / 2, 532); g.font = '22px Arial';
  ['34 yrs · 5 ft 5 in · mill worker', 'Last seen Sun. Nov 16, after 11 pm', 'near the Falls bridge', 'Call Cst. A. Roy, O.P.P. — 555-0172'].forEach((l, i) => g.fillText(l, W / 2, 570 + i * 30));
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(110,90,50,${rnd() * 0.1})`; g.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 6, 3 + rnd() * 6); }
}

/** coloca cartazes e retratos pela cidade; devolve os documentos (lupa) */
export function buildRetratos(G: THREE.Group) {
  const docs: { o: THREE.Object3D; n: string }[] = [];
  const moreau = () => texCom(512, 700, [21], cartazMoreau);
  // cartaz de desaparecido: estação, esquina do hotel (King St), fábrica, lanchonete, Main St
  ([[31.5, 1.8, 137.06, 0, 'Cartaz: Jean Moreau desaparecido (estação)'], [15.0, 1.7, -32.02, Math.PI, 'Cartaz: Jean Moreau desaparecido (hotel, King St)'],
    [45.0, 1.8, -162.42, Math.PI, 'Cartaz: Jean Moreau desaparecido (fábrica)'], [-10.44, 1.7, 12.0, Math.PI / 2, 'Cartaz: Jean Moreau desaparecido (Main St)']] as [number, number, number, number, string][])
    .forEach(([x, y, z, ry, n]) => docPlane(G, docs, moreau(), 0.42, 0.57, x, y, z, ry, n));
  // "In memoriam" no saguão do hotel: Margaret, com fita preta
  docPlane(G, docs, texCom(420, 560, [3], (g, [im]) => {
    g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 420, 560); g.fillStyle = '#b08a3a'; g.fillRect(14, 14, 392, 532); g.fillStyle = '#1a120a'; g.fillRect(28, 28, 364, 504);
    retrato(g, im, 50, 50, 320, 380, { frac: 0.4 });
    g.fillStyle = '#d8c8a0'; g.textAlign = 'center'; g.font = 'italic 30px Georgia'; g.fillText('In memoriam', 210, 470); g.font = '24px Georgia'; g.fillText('Margaret Ashdown · 1943 – 1974', 210, 506);
    g.fillStyle = '#050505'; g.beginPath(); g.moveTo(300, 28); g.lineTo(392, 28); g.lineTo(392, 120); g.closePath(); g.fill();
  }), 0.6, 0.8, 13.5, 2.2, -24.9, 0, 'Retrato "In memoriam" de Margaret (saguão)');
  // foto do casamento no quarto 304 (acima da cômoda, na parede de fora da cama)
  docPlane(G, docs, texCom(640, 480, [15, 3], (g, [w, m]) => {
    g.fillStyle = '#efe8d8'; g.fillRect(0, 0, 640, 480); retrato(g, w, 40, 40, 270, 330, { frac: 0.45 }); retrato(g, m, 330, 40, 270, 330, { frac: 0.45 });
    g.fillStyle = '#2a2018'; g.textAlign = 'center'; g.font = 'italic 30px "Brush Script MT", cursive'; g.fillText('William & Margaret — June 1969', 320, 420);
    g.strokeStyle = 'rgba(200,30,20,0.85)'; g.lineWidth = 6; g.beginPath(); g.moveTo(50, 50); g.lineTo(300, 360); g.moveTo(300, 50); g.lineTo(50, 360); g.stroke(); // o rosto dele riscado
  }), 0.64, 0.48, 17.0, 9.95, -12.42, 0, 'Foto do casamento (304)');
  // foto do Jean na casa dos Moreau
  docPlane(G, docs, texCom(360, 460, [21], (g, [im]) => { g.fillStyle = '#5a4030'; g.fillRect(0, 0, 360, 460); retrato(g, im, 24, 24, 312, 360, { frac: 0.4 }); g.fillStyle = '#e8dcc0'; g.textAlign = 'center'; g.font = 'italic 26px Georgia'; g.fillText('Jean, 1974', 180, 428); }),
    0.32, 0.41, 71.72, 1.95, 44.6, Math.PI / 2, 'Foto de Jean Moreau (casa dos Moreau)');
  return docs;
}
