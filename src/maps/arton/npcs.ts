// Sul de Arton — os personagens das folhas do dono, onde a história os põe. Cada lugar tem o seu povo:
//  · Tiberus é dos minotauros (com alguns escravos, mercadores anões e goblins de recado); Barud, da legião minotaura
//    e dos humanos "capengas"; Giluk, de bárbaros, meio-orcs e anões das montanhas; Valkaria, de todos os povos;
//    Nova Malpetrim, de mercadores, marujos, meio-elfos e dracônicos; Tollon, de elfos; o Planalto, de kobolds
//    (goblins); acampamentos de guerra, de orcs; a Aldeia dos Centauros, de centauros.
//  · Nos interiores (escala de gente): taverneiros, fregueses, cavaleiros velhos, prisioneiros e cultistas na
//    masmorra de Azazel, a bruxa, o mago Covariel (oculto), os sacerdotes de Korl, a família Zolkan…
// Imagens: npcs-local/arton/usar/<id>.webp (artes de terceiros, fora do git), feitas por tools/npcs-arton.py a partir
// dos recortes; sem a pasta, ninguém aparece (nada quebra).
// São personagens do mapa (arrastáveis pelo mestre); só aparecem perto da câmera e na mesma cena (index.ts).
import type { TokenDef } from '../../core/tokens';
import { type P, LUGARES, TRILHAS, ACAMPAMENTOS, BATALHAS, CAVERNAS, CLAREIRAS, Ysolo, Y, lugar } from './geo';
import { ORIGENS, Y0 } from './interiores';

const IMG = import.meta.glob('../../../npcs-local/arton/usar/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const img = (id: string) => Object.entries(IMG).find(([k]) => k.endsWith('/' + id + '.webp'))?.[1];
let sd = 31; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const pick = <T,>(a: T[]) => a[(rnd() * a.length) | 0];
const L = (pre: string, ns: number[]) => ns.map(k => `${pre}-${String(k).padStart(2, '0')}`);
// folhas de raças (fundo escuro): linha = raça; poucas por raça (as mais limpas) para o pacote ficar leve
const ELFOS = L('a1', [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
const ANOES = [...L('a2', [2, 4, 6, 8]), ...L('c1', [3, 5, 6, 9, 12])];
const GOBLINS = [...L('a3', [2, 5, 8, 11]), ...L('c2', [3, 6, 9, 12])];
const MINOTAUROS = [...L('a4', [2, 4, 6, 8, 10, 12]), ...L('c3', [3, 6])];
const ORCS = [...L('a5', [2, 4, 6, 8]), ...L('b4', [5]), ...L('c4', [3, 6, 9, 12])];
const MEIO_ORCS = [...L('a6', [2, 4, 6, 8, 10, 11, 12, 14]), ...L('b5', [5, 7])];
const DRACONICOS = [...L('b6', [3, 5, 7, 9]), ...L('c6', [3, 4, 6, 9])];
const TIEFLINGS = L('b7', [5, 7, 9, 11, 13, 15]);
const HUMANOS = ['m11', 'm12', 'm13', 'm14', 'm15', 'w10', 'w16', 'v11', 'v13', 'v14', 'w23', 'w21', 'w03'];
const MINOS_POVO = ['m01', 'm02', 'm03', 'm04', 'm05', 'm16', 'm20', 's07', 's03', 's10'];

// alturas (m) em escala de gente; no mapa regional tudo × 0,3 (casa ≈ 1 unidade)
const ALT: Record<string, number> = { elfo: 1.78, anao: 1.35, goblin: 1.0, mino: 2.3, orc: 2.0, meio: 1.85, drac: 1.95, tief: 1.75, hum: 1.75, centauro: 2.1, sentado: 1.35, caido: 0.85, ogro: 2.4 };
const MINI = 0.29;

const lista: TokenDef[] = [];
let n = 0;
function por(im: string, nome: string, x: number, y: number, z: number, h: number, oc = false): TokenDef | null {
  const u = img(im); if (!u) return null;
  const d: TokenDef = { id: 'arton-' + (++n), name: nome, h, c: 0x6a5a4a, img: u, npc: true, pos: { x, z, y, oc } }; lista.push(d); return d;
}
/** marca como vilão: base vermelha e "vilão" no nome (o mestre reconhece de longe) */
const vil = (d: TokenDef | null | undefined) => { if (d) { d.c = 0x9a1a14; d.name += ' — vilão'; } };
/** dentro de uma cena de bolso (índice de ORIGENS), em metros locais; yy = degrau/estrado */
const dentro = (i: number, im: string, nome: string, x: number, z: number, tipo: keyof typeof ALT, yy = 0, oc = false): TokenDef | null => por(im, nome, ORIGENS[i][0] + x, Y0 + yy, ORIGENS[i][1] + z, ALT[tipo], oc);
/** no mapa regional, perto de um lugar (dx, dz em unidades do mapa) */
const fora = (id: string, im: string, nome: string, dx: number, dz: number, tipo: keyof typeof ALT): TokenDef | null => { const l = lugar(id); if (!l) return null; const x = l.x + dx, z = l.z + dz; if (Y(x, z) < 0.15) return null; return por(im, nome, x, Ysolo(x, z), z, ALT[tipo] * MINI); };
const solto = (x: number, z: number, im: string, nome: string, tipo: keyof typeof ALT): TokenDef | null => (Y(x, z) < 0.15 ? null : por(im, nome, x, Ysolo(x, z), z, ALT[tipo] * MINI));
/** um grupo do mesmo povo em volta de um ponto */
function grupo(id: string, imgs: string[], nome: string, tipo: keyof typeof ALT, qtd: number, r0: number, r1: number, cx = 0, cz = 0) {
  for (let i = 0; i < qtd; i++) { const a = rnd() * 6.283, r = r0 + rnd() * (r1 - r0); fora(id, pick(imgs), nome, cx + Math.cos(a) * r, cz + Math.sin(a) * r, tipo); }
}

export function npcsArton(): TokenDef[] {
  lista.length = 0; n = 0; sd = 31;
  // ================= interiores =================
  // 0 · Âncora Quebrada (estalagem de beira de mata; a dona é a Velha Dorna, ex-marinheira)
  dentro(0, 'w05', 'Velha Dorna (dona, ex-marinheira)', -3.2, -3.9, 'hum');
  dentro(0, 'm12', 'Garçonete', 0.9, 0.3, 'hum');
  dentro(0, 'm06', 'Minotauro tomando hidromel', -5.4, -2.4, 'sentado');
  dentro(0, 'm07', 'Minotauro bêbado cantando', -1.9, 2.6, 'mino');
  dentro(0, 'm09', 'Minotauro caído de bêbado', 5.4, 3.5, 'caido');
  dentro(0, 'v05', 'Anão com caneca', 1.7, 3.6, 'anao');
  vil(dentro(0, 'm15', 'Comprador de coral, encapuzado no canto', -6.2, 3.8, 'hum'));
  dentro(0, 'v14', 'Caçador de Tollon', 4.3, 1.6, 'hum');
  // 1 · Estalagem do Macaco Caolho (Nova Malpetrim: feira, arena, circo, marujos)
  dentro(1, 'm11', 'Taverneiro do Macaco Caolho', -7.1, -1.2, 'hum');
  dentro(1, 'w16', 'Moça da estalagem', 0.2, 2.0, 'hum');
  dentro(1, 'w02', 'Dançarina do circo Thiannate', 3.4, -4.4, 'tief', 0.5);
  dentro(1, 'b1-17', 'Bardo anão', 0.8, -4.6, 'anao', 0.5);
  dentro(1, 'w21', 'Mercador gordo da feira', -3.0, 3.6, 'hum');
  vil(dentro(1, 'w23', 'Espião da Irmandade Pirata', 2.1, 3.4, 'hum'));
  dentro(1, 'v12', 'Marinheiro tiefling', 4.8, 0.7, 'tief');
  vil(dentro(1, 'w03', 'Assassino de aluguel', -6.6, 4.6, 'hum', 0, true));
  dentro(1, 'm02', 'Mascate minotauro', -0.6, 1.4, 'mino');
  dentro(1, 'w04', 'Gladiador orc (Arena de Gideon)', -5.6, 4.4, 'orc');
  // 2 · Salão de Asidon (os poucos e velhos cavaleiros)
  dentro(2, 'm13', 'Sir Aldren, o último comandante', 0, -4.7, 'hum', 0.45);
  dentro(2, 'm14', 'Cavaleiro de Asidon', -2.6, -4.2, 'hum');
  dentro(2, 'w06', 'Cavaleiro veterano', 2.6, -4.2, 'hum');
  dentro(2, 'v11', 'Criada', -4.2, 1.6, 'hum');
  vil(dentro(2, 'v13', 'Escriba da fortaleza (vende segredos à legião)', 4.2, 1.4, 'hum'));
  // 3 · Masmorra de Azazel: prisioneiros nas celas, carcereiro e o ritual no fundo
  dentro(3, 's01', 'Minotauro acorrentado', 6.4, 3.4, 'mino');
  dentro(3, 'w24', 'Ogro acorrentado', -6.6, -0.8, 'ogro');
  dentro(3, 'v08', 'Esqueleto que ainda anda', -6.4, 3.6, 'hum', 0, true);
  dentro(3, 's04', 'Fera minotaura enlouquecida', 6.5, -5.0, 'mino');
  dentro(3, 's08', 'Prisioneiro uivando', -6.5, -5.0, 'mino');
  dentro(3, 's06', 'Carcereiro', -1.5, 0.8, 'mino');
  dentro(3, 'v10', 'Goblin ajudante do carcereiro', 1.3, 1.6, 'goblin');
  vil(dentro(3, 's02', 'Cultista de Azazel', -1.6, -5.3, 'hum'));
  vil(dentro(3, 'w20', 'Cultista de manto vermelho', 1.6, -5.3, 'hum'));
  vil(dentro(3, 's09', 'Acólito da lanterna', 0, -2.4, 'hum'));
  vil(dentro(3, 'v01', 'Tenente de Azazel', 0, -7.9, 'hum', 0, true));
  // 4 · Caverna Congelada: uma partida de caça orc que se abrigou
  dentro(4, 'b4-05', 'Caçador orc', -1.5, 6.5, 'orc'); dentro(4, 'c4-03', 'Caçador orc', 1.2, 7.0, 'orc');
  // 6 · Catedral de Gelo: devotos dracônicos brancos da Rainha Dragoa
  dentro(6, 'b6-09', 'Devoto da Rainha Dragoa', 0.8, -10.5, 'drac'); vil(dentro(6, 'c6-04', 'Devoto da Rainha Dragoa', -1.4, -9.2, 'drac', 0, true));
  // 7 · Torre de Covariel: o mago (ninguém o vê há anos — oculto até o mestre revelar)
  dentro(7, 'w07', 'Covariel, o mago', -0.8, 0.2, 'hum', 0, true);
  // 8 · Salão de Giluk: o jarl e os clãs
  dentro(8, 'm11', 'O Jarl de Giluk', 0, -10.9, 'hum', 0.5);
  dentro(8, 'a6-04', 'Guerreiro de clã', -2.8, -8.0, 'meio'); dentro(8, 'a6-11', 'Guerreira de clã', 2.8, -6.5, 'meio');
  dentro(8, 'c1-05', 'Anão das montanhas', -2.2, 1.5, 'anao'); dentro(8, 'c1-09', 'Anão das montanhas', 2.3, 3.0, 'anao');
  dentro(8, 'b5-07', 'Bárbaro bebendo', -2.6, 6.0, 'meio'); dentro(8, 'w23', 'Caçador de peles', 2.7, 5.5, 'hum');
  // 9 · Cabana da Bruxa: a Velha das Neves
  vil(dentro(9, 'v07', 'A Velha das Neves', 0.9, -0.2, 'hum'));
  // 10 · Templo de Korl Khodan: sacerdotes guardiões e uma visita do mar
  dentro(10, 'm05', 'Sacerdote guardião', 0, -5.6, 'mino'); dentro(10, 's05', 'Guardião da máscara de caveira', 2.6, -2.2, 'mino');
  vil(dentro(10, 'w12', 'Elfa-do-mar bárbara (sobe pela gruta)', 4.0, 3.6, 'hum', 0, true));
  // 11 · Mansão de Zolkan (família "extinta")
  vil(dentro(11, 'w01', 'O senhor Zolkan', 0, -6.3, 'hum', 3.1, true));
  dentro(11, 'v15', 'Mordomo pálido', 3.0, 4.9, 'hum'); vil(dentro(11, 'v04', 'Primo Zolkan', -2.2, 3.4, 'hum', 0, true));
  dentro(11, 'w11', 'Médico da peste', 5.2, 0.2, 'hum');

  // ================= mapa regional (miniaturas) =================
  // Tiberus: o império dos minotauros (com escravos humanos, mercadores anões e goblins de recado)
  grupo('tiberus', MINOTAUROS, 'Cidadão minotauro', 'mino', 16, 1.4, 2.4);
  for (const s of [-1, 1]) fora('tiberus', 's07', 'Guarda do portão', s * 0.75, 10.1, 'mino');
  vil(fora('tiberus', 'm04', 'Senador conspirador', 0.6, -1.4, 'mino')); fora('tiberus', 'm05', 'Sacerdote de Tauron', -0.4, -1.6, 'mino');
  for (let i = 0; i < 6; i++) fora('tiberus', pick(MINOS_POVO), 'Legionário', (rnd() - 0.5) * 0.5, 3 + i * 1.0, 'mino');
  fora('tiberus', 'w10', 'Escravo humano', 1.9, 1.2, 'hum'); fora('tiberus', pick(ANOES), 'Mercador anão', -1.9, 1.1, 'anao'); fora('tiberus', pick(GOBLINS), 'Goblin de recado', 2.1, -0.4, 'goblin');
  // Barud: a legião minotaura e os humanos "capengas"
  const k = 0.0641, bA = (u: number, v: number): [number, number] => [u * k, v * k];
  for (const [u, v] of [[-8, 92], [8, 92], [96, -6], [96, 6]]) { const [x, z] = bA(u, v); fora('barud', pick(['s07', 'm01', 'm20']), 'Legionário de guarda', x, z, 'mino'); }
  for (let i = 0; i < 7; i++) { const [x, z] = bA((rnd() - 0.5) * 36, -32 + rnd() * 32); fora('barud', pick(['m02', 'm03', 'm08', 'm10', 'm17', ...MINOTAUROS.slice(0, 6)]), 'Minotauro no mercado', x, z, 'mino'); }
  for (let i = 0; i < 6; i++) { const [x, z] = bA((rnd() - 0.5) * 6, 30 + rnd() * 60); fora('barud', pick(['w10', 'm19', 'v11', 'm12', 'w16', 'm15']), 'Morador capenga', x, z, 'hum'); }
  vil(fora('barud', 's10', 'Executor da legião', 0.4, -2.6, 'mino')); vil(fora('barud', 's03', 'Centurião Brutal', -0.6, -2.7, 'mino'));
  // Valkaria: todos os povos, humanos na maioria
  vil(fora('valkaria', 'v03', 'Espiã da elfa sombria', 7.1, 0.9, 'elfo')); vil(fora('valkaria', 'w07', 'Feiticeiro renegado da Academia', -6.8, -2.2, 'hum'));
  for (let i = 0; i < 22; i++) {
    const a = rnd() * 6.283, r = rnd() < 0.5 ? 5.8 : 7.0, q = rnd();
    const [im, nm, tp] = q < 0.45 ? [pick(HUMANOS), 'Valkariano', 'hum'] : q < 0.6 ? [pick(ELFOS), 'Elfo', 'elfo'] : q < 0.72 ? [pick(ANOES), 'Anão', 'anao'] : q < 0.8 ? [pick(TIEFLINGS), 'Tiefling', 'tief'] : q < 0.87 ? [pick(DRACONICOS), 'Dracônico', 'drac'] : q < 0.94 ? [pick(MEIO_ORCS), 'Meio-orc', 'meio'] : [pick(MINOS_POVO), 'Minotauro', 'mino'];
    fora('valkaria', im, nm, Math.cos(a) * r, Math.sin(a) * r, tp as keyof typeof ALT);
  }
  // Giluk: bárbaros (meio-orcs e humanos) e anões das montanhas
  grupo('giluk', MEIO_ORCS, 'Bárbaro de Giluk', 'meio', 6, 1.2, 1.7, 0, 0.5);
  grupo('giluk', ANOES, 'Anão das montanhas', 'anao', 4, 1.2, 1.8, 0, 0.5);
  for (let i = 0; i < 3; i++) fora('giluk', pick(MEIO_ORCS), 'Guarda do Jarl', -1 + i, -5.6, 'meio');
  // Nova Malpetrim: mercadores, marujos, meio-elfos e dracônicos; feira e cais
  grupo('malpetrim', [...HUMANOS, ...TIEFLINGS.slice(0, 6)], 'Gente de Malpetrim', 'hum', 9, 0.6, 1.4, 0.2, -0.7);
  grupo('malpetrim', DRACONICOS, 'Dracônico da costa', 'drac', 3, 0.4, 1.2, -5.4, -7.2);
  for (let i = 0; i < 7; i++) fora('malpetrim', pick(['w23', 'w03', 'v14', 'm15', 'w10', ...MEIO_ORCS.slice(0, 5)]), 'Marujo no cais', -6 + i * 2, 4.25, 'hum');
  vil(fora('malpetrim', 'w23', 'Capitão da Irmandade Pirata', 3.1, 4.3, 'hum')); vil(fora('malpetrim', 'v02', 'Imediato orc dos piratas', 2.5, 4.4, 'orc'));
  // Nimbarann: milícia, gente pobre
  grupo('nimbarann', ['m14', 'w10', 'v11', 'm12', ...MEIO_ORCS.slice(5, 9)], 'Morador de Nimbarann', 'hum', 6, 0.3, 0.9);
  // Porto de Deheon
  for (let i = 0; i < 6; i++) fora('porto', pick([...HUMANOS, ...ANOES.slice(0, 4)]), 'Estivador', 0.8 + i * 0.8, 3.3, 'hum');
  // Aldeia dos Centauros
  grupo('centauros', ['v09', 'w19'], 'Centauro', 'centauro', 5, 0.6, 2.2);
  // Planalto dos Kobolds (goblins nas tocas)
  grupo('kobolds', GOBLINS, 'Kobold', 'goblin', 12, 0.5, 5.5);
  vil(fora('kobolds', 'w18', 'Chefe kobold', 0, 0.3, 'goblin'));
  // Floresta de Tollon: elfos pelas trilhas e clareiras
  vil(solto(TRILHAS[0][Math.floor(TRILHAS[0].length / 2)][0] + 0.8, TRILHAS[0][Math.floor(TRILHAS[0].length / 2)][1] - 0.6, 'w04', 'Saqueador de Tollon', 'orc'));
  TRILHAS.forEach((T, j) => { for (let i = 3; i < T.length; i += 9) { const [x, z] = T[i] as P; solto(x + 0.5, z + 0.4, pick(ELFOS), j % 2 ? 'Patrulheiro elfo' : 'Elfa de Tollon', 'elfo'); } });
  CLAREIRAS.forEach(c => solto(c.x + 1.2, c.z - 0.8, pick(ELFOS), 'Elfo na clareira', 'elfo'));
  // acampamentos de guerra (orcs) e campos de batalha (mortos que não descansam)
  ACAMPAMENTOS.forEach(([x, z]) => { vil(solto(x, z + 0.3, pick(['w04', 'v02']), 'Chefe de guerra orc', 'orc')); for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, r = 0.6 + rnd(); solto(x + Math.cos(a) * r, z + Math.sin(a) * r, pick(ORCS), 'Orc de guerra', 'orc'); } });
  BATALHAS.forEach(([x, z]) => solto(x + 0.6, z + 0.3, 'v08', 'Soldado que não descansa', 'hum'));
  // cavernas: goblins na boca
  CAVERNAS.forEach(([x, z], i) => { if (i % 2) solto(x + 0.8, z + 0.6, pick(GOBLINS), 'Goblin da caverna', 'goblin'); else solto(x + 0.8, z + 0.6, pick(ORCS), 'Orc da caverna', 'orc'); });
  // aldeias de neve (anões e bárbaros), vilas (gente do campo), vilas de pescadores
  for (const l of LUGARES) {
    if (l.tipo === 'aldeia-gelo') { fora(l.id, pick(ANOES), 'Anão das montanhas', 1.1, 0.4, 'anao'); fora(l.id, pick(MEIO_ORCS), 'Bárbaro do gelo', -0.9, 0.7, 'meio'); }
    else if (l.tipo === 'vila-lom' || l.tipo === 'vila-deh' || l.tipo === 'vila') fora(l.id, pick(['m11', 'm12', 'v11', 'w16', 'w10', 'm13']), 'Aldeão', 0.6, 0.9, 'hum');
    else if (l.tipo === 'pesca') fora(l.id, pick(['w23', 'v14', 'w10', ...MEIO_ORCS.slice(10, 13)]), 'Pescador', 0.5, 0.6, 'hum');
  }
  // lugares soltos
  vil(fora('azazel', 'w20', 'Cultista à porta da torre', 1.4, 1.0, 'hum')); vil(fora('azazel', 's02', 'Cultista', -1.2, 1.3, 'hum'));
  vil(fora('zolkan', 'v15', 'Vulto no portão', 0.5, 3.0, 'hum'));
  vil(fora('pantano', 's05', 'Coletor de coral', 2.0, 1.0, 'mino'));
  fora('velha', 'w10', 'Catador nas ruínas', 0.8, 0.5, 'hum'); fora('velha', pick(GOBLINS), 'Goblin catador', -1.0, 0.9, 'goblin');
  fora('korl', 'm05', 'Sacerdote nos degraus', 0.8, 1.6, 'mino');
  fora('ancora', 'w05', 'Velha Dorna na porta', 0.6, 1.4, 'hum');
  fora('asidon', 'w06', 'Sentinela de Asidon', 0, 3.2, 'hum');
  fora('ian', 'm13', 'Ian, o eremita', 0.7, 0.5, 'hum');
  return lista;
}
