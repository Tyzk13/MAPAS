// Floresta Sombria — fichas do mestre (lugares e personagens). Terror sutil: velas que ninguém acendeu, fitas
// amarradas, um acampamento largado às pressas. Serve para qualquer campanha de fantasia (Tormenta 20 inclusive).
import type { LocalFicha, NpcFicha } from '../barud/dados';
import { ACAMPAMENTO, ARVORE, CIRCULO, RUINA } from './plano';

export const LOCAIS_F: LocalFicha[] = [
  {
    id: 'floresta', n: 'Floresta Sombria', cat: 'Região', tipo: 'Mata antiga e fechada', vista: 'Geral',
    publico: 'Pinheiros escuros, carvalhos de copa larga e árvores mortas de galhos retorcidos. A luz chega em fiapos; o chão é fofo de folhas e agulhas. Uma trilha velha atravessa a mata do sul ao norte, cruza o riacho por uma ponte de tábuas e termina num círculo de pedras.',
    dono: 'Ninguém — os lenhadores das aldeias em volta não entram depois do riacho', funcao: 'Atravessar, caçar, se esconder — ou encontrar o que vive no círculo.', npcs: ['corvina', 'vulto'],
    narrativa: 'A floresta é mais velha que os reinos em volta. Dizem que as árvores mudam de lugar à noite e que quem segue as fitas vermelhas sempre chega à Árvore Oca.',
    rumores: ['Um grupo de caçadores entrou há uma semana e não voltou.', 'As velas do círculo estão sempre acesas, e ninguém nunca viu quem acende.', 'Vaga-lumes demais perto do riacho: lá a água corre ao contrário em noite sem lua.'],
    pistas: ['Pegadas descalças na lama da ponte, só de ida.', 'Fitas vermelhas novas amarradas em galhos altos demais para alguém alcançar.'],
    objetos: [], segredos: ['O círculo de pedras guarda uma passagem; os cogumelos marcam a borda. Quem pisa dentro do anel à noite ouve o próprio nome.'], obs: 'Teste de Sobrevivência para não se perder fora da trilha (CD 15; 20 à noite).',
  },
  {
    id: 'ponte', n: 'Ponte do Riacho', cat: 'Passagem', tipo: 'Ponte de tábuas sobre a ravina', vista: 'Ponte do Riacho',
    publico: 'Tábuas gastas sobre uma ravina funda; embaixo, um riacho escuro e frio corre entre pedras com musgo. A névoa se junta ali de manhã e à noite.',
    dono: '—', funcao: 'Única travessia segura do riacho.', npcs: [],
    narrativa: 'A ponte foi refeita muitas vezes. As tábuas novas aparecem sozinhas.', rumores: ['Não olhe para a água ao atravessar.'], pistas: ['Uma tábua quebrada de dentro para fora.'], objetos: ['Corda velha amarrada num pilar'], segredos: [], obs: 'Tábua solta: Reflexos CD 12 ou cai 3 m na água rasa.',
  },
  {
    id: 'acampamento', n: 'Acampamento Abandonado', cat: 'Clareira', tipo: 'Acampamento de caçadores', vista: 'Acampamento Abandonado', dentro: 'Acampamento · fogueira',
    publico: 'Duas tendas, uma rasgada de cima a baixo. A fogueira ainda tem brasas. Mochila aberta, caixotes, uma lanterna acesa pendurada num galho.',
    dono: 'Caçadores desaparecidos', funcao: 'Abrigo, pistas sobre os caçadores.', npcs: [],
    narrativa: 'Os caçadores saíram às pressas e não levaram nada. As brasas não deveriam estar quentes depois de uma semana.',
    rumores: [], pistas: ['Diário de caça: a última página diz "as fitas mudaram de lugar de novo".', 'A tenda foi rasgada por dentro.'], objetos: ['Arco curto', 'Ração para 3 dias', 'Diário de caça', 'Lanterna'], segredos: ['As brasas estão quentes porque alguém volta todas as noites para cuidar do fogo.'], obs: '',
  },
  {
    id: 'arvore', n: 'Árvore Oca', cat: 'Lugar marcante', tipo: 'Árvore gigante com uma fenda', vista: 'Árvore Oca', dentro: 'Árvore Oca · fenda',
    publico: 'Uma árvore imensa, de raízes como muralhas e tronco largo como uma casa. Na base, uma fenda escura com velas acesas. Fitas vermelhas pendem dos galhos em volta.',
    dono: 'A eremita Corvina cuida do lugar', funcao: 'Santuário antigo; quem deixa oferendas pede passagem pela mata.', npcs: ['corvina'],
    narrativa: 'Os antigos chamavam de Árvore-Mãe. Lá dentro cabe uma pessoa encolhida — e há marcas de unhas na madeira por dentro.',
    rumores: ['Quem dorme dentro da fenda sonha com o caminho de saída.'], pistas: ['Um anel de caçador entre as velas.'], objetos: ['Velas', 'Oferendas (moedas, ossos, um anel)'], segredos: ['A fenda desce: há um túnel de raízes até o círculo de pedras.'], obs: '',
  },
  {
    id: 'circulo', n: 'Círculo de Pedras', cat: 'Lugar marcante', tipo: 'Círculo de pedras com altar', vista: 'Círculo de Pedras', dentro: 'Círculo · altar',
    publico: 'Onze pedras de pé num círculo — uma caída. No centro, um altar de laje com velas acesas e um crânio de cervo. Um anel de cogumelos brancos rodeia o altar.',
    dono: '—', funcao: 'Fim da trilha. Rituais antigos.', npcs: ['vulto'],
    narrativa: 'Ninguém se lembra de quem ergueu as pedras. As árvores em volta estão mortas há muito tempo.',
    rumores: ['À noite os cogumelos brilham.', 'A pedra caída caiu sozinha no ano da peste.'], pistas: ['Pegadas descalças dando voltas no anel.', 'Cera fresca escorrendo no altar.'], objetos: ['Crânio de cervo', 'Velas negras'], segredos: ['O Vulto só aparece quando alguém entra no anel de cogumelos.'], obs: 'Revele o Vulto (oculto) quando quiser: ele está entre as pedras.',
  },
  {
    id: 'ruina', n: 'Santuário em Ruínas', cat: 'Ruína', tipo: 'Capela de pedra sem teto', vista: 'Santuário em Ruínas',
    publico: 'Paredes de pedra quebradas, um arco ainda de pé e um altar com uma estátua gasta. Velas acesas diante dela.',
    dono: 'Ordem esquecida', funcao: 'Abrigo de pedra; lugar para descansar.', npcs: [],
    narrativa: 'Uma ordem de monges tentou "domar" a floresta séculos atrás. A capela é o que sobrou.',
    rumores: ['A estátua vira o rosto para quem entra.'], pistas: ['Inscrição no altar: "não sigam as fitas".'], objetos: ['Livro de orações mofado'], segredos: [], obs: 'Descanso seguro de uma noite — mas a estátua amanhece virada.',
  },
];

export const NPCS_F: NpcFicha[] = [
  {
    id: 'corvina', n: 'Corvina, a eremita', raca: 'Humana', ocupacao: 'Eremita, guardiã da Árvore Oca', local: 'arvore',
    pos: { x: ARVORE.x + 1.5, z: ARVORE.z + 6 }, h: 1.6,
    aparencia: 'Velha magra, capa de penas pretas, mãos sujas de cera.', personalidade: 'Fala pouco, em charadas; desconfia de quem tem pressa.',
    historia: 'Entrou na floresta procurando o filho, há quarenta anos. Ficou.', sabe: ['O caminho seguro até o círculo.', 'Que os caçadores seguiram as fitas.'],
    rumores: ['Dizem que ela é quem acende as velas.'], relacoes: ['Teme o Vulto e o alimenta com oferendas.'], mestre: 'Ajuda em troca de uma vela acesa no círculo.',
  },
  {
    id: 'vulto', n: 'O Vulto entre as pedras', raca: '—', ocupacao: '—', local: 'circulo',
    pos: { x: CIRCULO.x - 6, z: CIRCULO.z - 7 }, h: 2.6, oculto: true,
    aparencia: 'Uma figura alta e magra demais, sempre no canto do olho.', personalidade: '—', historia: 'Ninguém sabe.', sabe: [],
    rumores: ['Tem o rosto de quem você perdeu.'], relacoes: [], mestre: 'Começa oculto. Revele quando alguém entrar no anel de cogumelos.',
  },
  {
    id: 'cacador', n: 'Breno, caçador perdido', raca: 'Humano', ocupacao: 'Caçador', local: 'acampamento',
    pos: { x: RUINA.x - 3, z: RUINA.z + 2 }, h: 1.75,
    aparencia: 'Roupas rasgadas, olhos fundos, segura um arco sem corda.', personalidade: 'Assustado, repete as mesmas frases.',
    historia: 'Único sobrevivente do grupo; se escondeu no santuário.', sabe: ['Os outros "foram chamados pelo nome".'], rumores: [], relacoes: [], mestre: 'Não sabe há quanto tempo está ali (acha que é o primeiro dia).',
  },
];
void ACAMPAMENTO;
