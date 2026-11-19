# Changelog

## Desempenho: mestrar sem travar o PC

- Menu **⋯ → Desempenho** (vale para todos os mapas, salvo no navegador, muda na hora):
  - **limite de quadros** 30 / 60 / livre (padrão 60: monitor de 144 Hz não desenha 144 vezes);
  - **mestre leve com a TV aberta**: com a janela dos jogadores ligada, a do mestre desenha a 24/s e sem os efeitos
    pesados (a TV fica com a qualidade cheia);
  - **economizar quando parado**: 20 s sem mexer → 10 quadros/s; volta no primeiro movimento (cinema e caminhar
    nunca ficam lentos);
  - **modo leve**: sem oclusão de ambiente nem profundidade de campo, sombra recalculada a cada 8 quadros;
  - leitura ao vivo dos quadros/s e da resolução.
- A resolução automática respeita o limite (30/s de propósito não é tratado como lentidão).
- Shaders preparados no carregamento do mapa (`compileAsync`): menos engasgos na primeira volta da câmera; no Sul de
  Arton, as cenas dos interiores também (primeira entrada sem travar).

## Sul de Arton: mais qualidade e mais vida

- Relevo com **sombreado de mapa** gravado na cor (luz de noroeste), escuro nos vales, claro nas cristas e faixas de
  estrato na rocha: as montanhas aparecem esculpidas com qualquer clima, sem custo por quadro.
- **Sombras de nuvens** passando pelo terreno e pelo mar; mar com correntes que andam, cristas de espuma e brilho do
  sol; **rios correndo** (riscos de espuma descendo para o mar).
- Letras medievais (**Cinzel** e **IM Fell English**, Google Fonts, OFL) nos nomes, nas placas das rotas e na moldura;
  até as fontes chegarem, vale a Georgia (e o arquivo offline continua funcionando).
- Mapa vivo (`src/maps/arton/vida.ts`): a **Rainha Dragoa Beluhga voando** sobre as Uivantes (bate as asas e plana),
  bandos de **corvos** (campos de batalha, Zolkan, Azazel, Velha Malpetrim, pântano) e **gaivotas** (portos e ilhas),
  **caravanas, cavaleiros, patrulhas e peregrinos** andando pelas estradas, **neve** caindo nas Uivantes,
  **tempestade com raios e chuva** no Mar Negro, **nuvens baixas** passando, **feixes dos faróis** girando à noite,
  esteira de espuma atrás dos navios, árvores e bandeiras balançando ao vento, coral da Praga pulsando.
- Interiores: brasas subindo das lareiras, da fogueira comprida de Giluk e dos braseiros do templo, bolhas no
  caldeirão da bruxa, poeira na luz, o orbe do mago flutuando com o círculo de runas girando, olhos da dragoa acesos.
- Neve, chuva e nuvens acompanham o clima (escurecem à noite).

## Sul de Arton: mapa regional em relevo (Tormenta 20)

- Novo mapa **Sul de Arton** (`src/maps/arton/`), feito a partir da imagem e do texto do dono: Montanhas Uivantes,
  Floresta de Tollon, Lomatubar, parte de Deheon, costa oeste (Nova Malpetrim) e o Mar Negro com ilhas, como uma
  mesa de relevo de wargame. Vista inclinada de 50°, exagero vertical, três texturas aéreas novas (campo, penhasco
  de calcário, neve), mar com espuma e ondas, rios entalhados no relevo, estradas, trilhas na floresta, pontes onde
  estradas e trilhas cruzam rios, fronteiras que brilham, moldura de pergaminho (título, rosa dos ventos, legenda e
  escala em km) sobre uma bandeja de madeira na mesa.
- Miniaturas com o jeito de cada povo: Giluk em terraços na encosta, aldeias bárbaras de seis cabanas, Catedral de
  Gelo com escadarias, covil de Beluhga com a dragoa e o anel de geada, ruínas de gelo, cavernas; Barud (muralha,
  torres, fortaleza na colina, Bairro Coral), Nimbarann entre dois rios, Asidon, Templo de Korl Khodan, torres em
  ruína, acampamentos, campos de batalha com espadas cruzadas, pântano com coral; Valkaria com a estátua colossal,
  palácios, jardins suspensos, viadutos, estátuas do Panteão e barracos; Nova Malpetrim na falésia (feira, arena,
  circo, cais), Velha Malpetrim alagada, Zolkan, Azazel, centauros, kobolds, Tiberus com arena e estátuas de
  minotauro; vilas de pescadores e faróis. Árvores negras de Tollon, taigas, bosques, manadas (mamutes, bisões,
  renas, lobos), navios piratas, sombras do monstro marinho e um tentáculo, recifes.
- **12 interiores** em escala de gente (cenas debaixo da mesa, "Ver por dentro" na ficha): tavernas Âncora Quebrada e
  Macaco Caolho, salão de Asidon, masmorra de Azazel, Caverna Congelada, covil de Beluhga (tesouro e a dragoa),
  Catedral de Gelo, Torre de Covariel, salão de Giluk, cabana da bruxa, Templo de Korl Khodan, Mansão de Zolkan.
- Alfinetes coloridos por região, nomes que se ajustam à distância, rotas de viagem com placas de km e dias,
  bandeirinhas de altitude, 32 fichas do mestre (regiões, cidades, masmorras, cavernas, tavernas…).
- Núcleo (vale para qualquer mapa): na ficha do local, **Abrir mapa: …** (`LocalInfo.mapa`; Barud abre o mapa da
  cidade e a ficha da cidade, em Barud, volta para a região), **Levar o grupo para cá** (teleporta os personagens dos jogadores) e **Distâncias** em linha reta;
  `M.medida` formata distâncias (a régua do arrastar mostra km e dias neste mapa).

## Barud: Mata dos Chifres (floresta fora das muralhas)

- Nova `src/maps/barud/floresta.ts`: mata sombria em volta da cidade (pinheiros escuros e árvores mortas retorcidas
  em código, instanciados em blocos de 30 m; 2.200/3.400/4.800 árvores por qualidade), chão de folhas com borda
  suave e estradas livres, e uma **trilha de terra** que sai da estrada do sul e serpenteia até uma clareira.
- Pontos de mesa na trilha: **Forca da Encruzilhada** (forca, gaiola de ferro, placa com tocha e o edito do Pretor
  como documento), **Cabana do Lenhador** (com interior e vela acesa), crânios de touro em estacas, tronco caído e o
  **Círculo dos Chifres** (nove pedras, altar com coral e velas, fogueira, árvore morta com trapos).
- Sub-bosque (samambaias, arbustos, tocos, raízes, pedras com musgo, galhos) e capim só perto da trilha; névoa
  rasteira na trilha; colisão nos troncos perto do caminho; limite de caminhada ampliado para 300 m.
- Fichas novas: 4 locais (categoria **Ermo**) e 3 NPCs (Garrak, caçador minotauro; Bertoldo Pé-Torto, lenhador
  humano; O Pastor de Chifres, criatura oculta). Vistas: Trilha da Mata, Forca, Cabana (fora/dentro), Círculo e
  Mata do alto; áreas novas no VTT.

## Barud (Tormenta 20) e mapas por sistema

- Novo mapa **Barud, capital de Lomatubar** (`src/maps/barud/`): cidade murada de 12 torres com dois portões, canal
  com pontes e barcos, Via Real, praça do mercado (barracas, monumento, poço, pelourinho, quadro de procurados),
  bairros rico/médio/pobre com casas geradas (enxaimel com balanço, pedra, tábuas), ruínas e o **Bairro Coral**
  isolado (barricadas, coral vermelho, valas da Praga), Fortaleza com Salão do Pretor, lanternas, fumaça das
  chaminés, carroças, cavalos, cães, galinhas e varais. 13 prédios com **interior** (3 tavernas diferentes, forja,
  boticário, empório, templo, quartel com celas, salão do trono, 3 casas e o lazareto), com andar de cima e escada.
- Foco do dono: **minotauros** (Barud sob o Império de Tauron) e alguns humanos maltrapilhos; 38 NPCs com ficha,
  33 com imagem local (`npcs-local/barud/`, fora do git) recortada das folhas do dono por `tools/fatiar-folha.py`.
- Novo no núcleo: **painel Locais** (`core/locais.ts`, botão no dock): lista com busca e categorias, ficha do local
  (texto para ler em voz alta separado dos segredos, que ficam atrás de "Segredos ocultos"), fichas de NPC com
  retrato, marcadores com o nome dos lugares sobre a cena e duplo clique num prédio para abrir a ficha. Só na janela
  do mestre. Qualquer mapa pode usar (`M.locais`, `M.fichas`).
- Menu **Mapa** agrupado por sistema (Ordem Paranormal / Tormenta 20); campo `sis` no manifesto.
- Cartazes de procurado trocáveis: PNGs em `npcs-local/barud/cartazes/` entram nos cartazes da praça e do quartel.

## Correção dos climas noturnos

- Corrigido: o clima **Noite** parecia um dia nublado (mais claro que *Terror*, céu cinza-marrom, névoa leitosa).
  O HDRI `qwantani_night` vem exposto quase como céu de dia e tem um brilho forte no horizonte; como a névoa e a
  luz ambiente saem dele, tudo clareava. Noite recalibrada (céu, ambiente, névoa, lua e gradação).
- Novo: `skyTint` no preset de clima tinge o próprio HDRI (céu, reflexos e cor da névoa juntos), para o céu e a
  névoa terem a mesma cor; a Noite usa um azul-lunar.
- Novo: `tools/diag-climas.mjs` mede o brilho de cada vista por clima, carregando direto e depois de trocar de clima
  (confere se o resultado não depende da ordem das trocas).
- Manchas brancas/pretas (folhas, beirais, postes): a trava de cor dos materiais e do pós usava `isnan()`, que
  o otimizador de várias placas (ANGLE/D3D no Windows) remove. Agora NaN/infinito são testados pelos bits do
  número, a cor é limitada a 60000 (acima disso o buffer de meia precisão vira infinito) e há uma limpeza
  **antes** do bloom (um pixel inválido espalhado pelo bloom virava mancha grande com borda de ruído).
- Novo: `?nan=1` pinta pixels inválidos (magenta NaN, ciano infinito, amarelo estouro, vermelho negativo).
- Climas recalibrados em todos os mapas: Crepúsculo e Nublado sem a névoa leitosa que estourava o horizonte
  (névoa mais rala, cor próxima à do céu, mais contraste); Noite um pouco mais clara (lua e céu).
- Corrigido (print do dono): à noite, tudo o que estava virado para cima ficava branco em algumas placas. A luz
  ambiente agora sai de uma cópia do céu sem a lua/sol/brilho de cidade; o céu visível não muda.
- Novo: sem servidor nem claude.ai (arquivo offline), as posições dos personagens (inclusive ocultos) e os
  personagens criados ficam guardados neste navegador e voltam ao reabrir (`netLocal` em `core/net.ts`).
- Juntada a branch com todos os mapas (Greywater Falls, Harlow, San Judas) e funções (janela dos jogadores,
  cinema, painel do mestre) com esta correção.

## Etapa A — projeto e ciclo de verificação visual

- Projeto Vite + TypeScript com three r187 (antes: HTML único com three r128 do jsDelivr).
- Código separado em módulos (`src/core/*`, `src/maps/*`, `src/assets/*`) e manifesto de mapas.
- Mantidos: parâmetros de URL, `postMessage` do iframe, rede (Claude db / WebSocket / local),
  personagens, caminhar, exportação VTT e importação de .glb/.hdr.
- Novo: `npm run build:single` gera um HTML único; tela de carregamento com barra de progresso;
  botão e parâmetro `?q=` de qualidade (efeito real na etapa B/C).
- Novo: `npm run capturas` (Playwright) com 5 câmeras × 2 climas e folha comparativa com as referências.
- Corrigido: vistas Altar e Coro ficavam acima das paredes (as vigas tapavam a imagem); telhado agora
  aparece por padrão (a camada continua podendo ser desligada; a exportação VTT sempre o esconde).
- Luzes convertidas para as unidades físicas do three atual (fator π) — calibração visual vem na etapa B.

## B1 — pós-processamento

- Pipeline `postprocessing` (pmndrs): render em meia-precisão (HDR) → AO N8AO → profundidade de campo
  (só Alta) → bloom, aberração cromática leve, tone mapping AgX, contraste/saturação, vinheta, grão → SMAA.
- Predefinições Baixa/Média/Alta: resolução, tamanho do mapa de sombra, AO, SMAA, DOF e grão.
- Exportação VTT continua sem pós-processamento (tone mapping ligado só durante a exportação).

## B2–B4 (primeiro passe) — céu HDRI, materiais PBR, igreja reconstruída, assets reais

- Céu e luz ambiente com HDRI da Poly Haven por clima (carregado sob demanda); a cor da névoa vem do
  horizonte do HDRI; névoa por altura (mais densa no chão). Climas recalibrados em unidades físicas.
- Materiais PBR (cor, normal, AO/rugosidade) da Poly Haven em WebP, com UVs em metros.
- Terreno com mistura de 3 materiais (grama, terra, folhas) por máscara e colisor simplificado
  (raycast barato para caminhar/arrastar).
- Igreja reconstruída: paredes de concreto com vãos reais, janelas ogivais com vitrais (chumbo e vidro
  envelhecido), rosáceas, portal em arco com portas de madeira abertas, contrafortes, cornijas,
  telhado de ardósia com forro de tábuas e tesouras aparentes, torre com campanário, sino, relógio,
  pináculo e cruz.
- Interior: bancos com cabeceiras em voluta (instanciados), presbitério de pedra, altar com toalha,
  cruz e dossel, ambão, balaustrada torneada, coro com escada e órgão, lustres de velas (modelo CC0),
  candelabros, cadeiras góticas, armário.
- Casamento: passadeira branca, rosas brancas modeladas (instanciadas), pétalas, arco de flores,
  lanternas no caminho, vasos na escada.
- Exterior: caminho de pedra, cerca de ferro e portão, postes, poças refletivas, estacionamento com
  carros cobertos por lona, galpão, caramanchão, cemitério antigo, estátua, floresta de abetos,
  árvores, arbustos, samambaias, mato.
- Ferramentas: `npm run assets` (baixa/otimiza da Poly Haven e atualiza CREDITS.md),
  `tools/arvores.sh` e `tools/orcamento.sh` (Blender + gltf-transform: desbaste de folhas e
  simplificação para orçamento de triângulos), `tools/ver-modelo.mjs` (captura de um .glb),
  `tools/contar-tris.mjs`.
- Removido: céu em canvas, texturas em canvas no mapa principal, véus.

## E — servidor de sincronização

- `server/servidor-sync.mjs`: salas, persistência em JSON (gravação atômica), só-leitura imposto no
  servidor (`?ro=1` ou chave `EDIT_KEY`), filtro de origem, limite de taxa, ping para proxies, `/saude`.

## B (calibração 1), C, D, F

- Vistas internas na altura de uma pessoa (o limite de ângulo da órbita empurrava a câmera para cima).
- Sonda de ambiente no interior (cubemap capturado com as luzes do momento → reflexos no piso e luz
  rebatida nas paredes), luzes de área frias ao longo das janelas, sol do anoitecer pela frente.
- Concreto mais cinza, grama mais verde, passadeira menos brilhante, pórtico mais baixo (não cobre a
  rosácea), janelinha da torre fora do relógio, árvores longe das paredes e fora das linhas das câmeras.
- Corrigido: buquê do caramanchão aparecia no meio do corredor da igreja.
- Qualidade (C): Baixa/Média/Alta também controlam densidade de mato, tamanho da floresta, distância do
  LOD e sombra da vegetação (recarrega o mapa ao trocar). Medidor `?fps=1`.
- HTML único (C): usa assets leves (texturas 512 px, árvores LOD1) → ~29 MB em vez de 67 MB.
- Capturas a partir de um build de produção (imune a edições durante a captura).
- VTT (D): cor das luzes no formato AARRGGBB (o importador do Foundry lê assim), iluminação neutra na
  imagem exportada; `node tools/testar-vtt.mjs` exporta todas as áreas, valida a estrutura e gera prévias
  com paredes, portas e luzes desenhadas.
- Mapa `campo` reescrito com as APIs novas, como exemplo; guia `docs/NOVO-MAPA.md` (F) e
  `docs/HOSPEDAGEM.md` (E: deploy, iframe, CSP).

## Animações sutis e acabamento

- Vento na vegetação feito na GPU (árvores dobram, folhas tremem, rajadas lentas); a sombra acompanha
  o movimento (material de profundidade com o mesmo vento).
- Chamas e lâmpadas tremulando, lustres balançando de leve (pêndulo com pivô no forro), nuvens andando,
  névoa baixa à deriva, poeira em suspensão na nave, feixes de luz pelos vitrais e pela porta.
- Envelhecimento procedural do concreto (sujeira e musgo subindo do chão, escorridos de chuva).
- Concreto externo cinza (`concrete_wall_008`), vitrais menos estourados.
- Varais de lampadinhas (pórtico, caminho, caramanchão) e lanternas com velas no corredor.
- Capturas usam tempo fixo (imagens reproduzíveis).

## Acabamento 2

- Gramado procedural (dezenas de milhares de touceiras de lâminas com vento; densidade pela qualidade).
- Grama base mais verde (`leafy_grass`), vidro de luminárias aceso, poeira e feixes mais sutis.
- Corrigido: erro da barra de carregamento ao trocar de mapa depois de carregado.
- `tools/testar-funcoes.mjs`: teste automático (iframe/ready, carregamento, caminhar, clima e mapa por
  postMessage, erros de página) — passando.
- VTT: paredes recortadas na área exportada e tamanho arredondado; todas as áreas validadas.

## Versão para celular / página hospedada

- `npm run build:leve` → `dist-lite/`: assets leves e modelos/céus empacotados como `.js` (algumas hospedagens,
  como a do claude.ai, recusam `.glb` e `.hdr`). Carregadores passam por `core/binario.ts`.
- Publicada como página privada no claude.ai e conferida no visualizador real (carrega sem erros).

## Mapa novo: San Judas de las Ánimas (México)

- Cidadezinha no semiárido do norte do México (`?map=mexico`): praça com coreto, papel picado e
  jardineiras; paróquia com duas torres, interior com bancos, retábulo dourado, lustres e veladoras;
  cantina "El Último Trago" (balcão, garrafas, mesas, portas vaivém); mercado municipal com bancas e lonas;
  portal de lojas (farmácia, abarrotes, tortilharia, papelaria); panteão com túmulos coloridos,
  cempasúchil, velas e capela; fazenda abandonada com poço e um círculo de giz (gancho de investigação);
  caixa-d'água, arroio seco com ponte, casas soltas e ruínas nas estradas.
- Quadras geradas por código (casas térreas e sobrados, grades, sacadas, toldos de telha, caixas-d'água,
  tetos com impermeabilizante), postes de madeira com fios, serra distante, sahuaros, nopais e agaves.
- Celular: peças juntadas por material, colisão por caixas simples, pedras e caixotes leves em código,
  só as luzes mais importantes viram PointLight (8 / 14 / 22 conforme a qualidade), densidade de
  capim/cactos/arbustos pela qualidade. Névoa rareia quando a câmera sobe (vista tática legível).
- Núcleo: campos opcionais por mapa `walkLimit`, `camMax`, `fogScale`; `window.MAPA_PADRAO` escolhe o mapa
  inicial; `npm run capturas -- --views=Praça,Cantina` usa vistas do mapa pelo nome.

## Mapa novo: Harlow, Texas + O Caso Whitlock

- Cidadezinha do oeste texano (`?map=texas`): tribunal do condado com torre do relógio na praça, lojas com
  fachada falsa e calçadas cobertas (xerife, banco, cinema Roxy com marquise de neon, funerária Pruitt…),
  saloon com interior (balcão, sinuca), lanchonete 24 h com interior quadriculado, posto de gasolina, motel
  com neon e o quarto 7 aberto (interior), estação de trem, trilhos, silos da cooperativa, caixa-d'água,
  igreja batista de madeira com interior e cemitério, bairro de casas de tábuas com varanda, cadeira de
  balanço, cerca e caixa de correio, fazenda abandonada (casa com interior, celeiro, moinho girando,
  milharal seco, espantalho, porão de tempestade), bombas de petróleo animadas, outdoors, mesas no horizonte.
- Mistério estilo Ordem Paranormal: pistas espalhadas (lápide, cova aberta, espelho escrito, polaroid,
  cartaz, mural de recortes, quadro de hinos, sigilo no vagão, na caixa-d'água e queimado no milharal, brilho
  vermelho no porão) e dossiê do mestre em `docs/casos/harlow-caso-whitlock.md`.
- `tools/medir-peso.mjs`: mede draws e triângulos de um mapa nas qualidades Baixa e Alta.
## Desempenho (mesmo visual, bem mais leve)

- Vista externa: 12,6 M → 4,7 M triângulos e 3.115 → 1.162 chamadas por quadro; dentro da igreja: 11,6 M → 0,6 M.
- Corrigido: vidro com transmissão (modelos glTF) fazia a cena inteira ser renderizada duas vezes.
- Peças estáticas juntadas por material (565 → 65), vegetação em blocos com corte por tela e por distância,
  gramado com versão simples ao longe, exterior não é desenhado quando a câmera está dentro da igreja e a
  porta não aparece, auréolas num único objeto, sombra do sol recalculada a cada 2–4 quadros, resolução
  adaptativa, névoa mais barata, modelos de lanterna/pedra/pedregulho reduzidos, 3º nível de LOD na floresta.
- `node tools/medir.mjs`: mede o custo por quadro e por grupo.

## Organização, desempenho e servidor

- **Resolução adaptativa** (`core/desempenho.ts`): mede o FPS e reduz a resolução interna (até 50%) quando a
  cena fica lenta; sobe de novo quando sobra folga. `?auto=0` desliga; `?fps=1` mostra a resolução atual.
- Exportação VTT libera o arquivo da memória depois do download (o `.dd2vtt` traz a imagem embutida).
- Servidor de sincronização: descarta números inválidos (NaN/infinito), aceita só imagens PNG/WebP/JPEG/GIF,
  limita personagens (`MAX_CHARS`) e posições (`MAX_POS`) por sala, `/saude` aceita query string.
  Novo `server/testar.mjs` (`npm run test:servidor`) e `server/Dockerfile`.
- Scripts `typecheck`, `test`, `test:funcoes`, `test:vtt`, `test:servidor`; CI no GitHub Actions
  (tipos, builds e servidor a cada push; teste no navegador sob demanda).
- `.nvmrc`, `.editorconfig`, `CLAUDE.md`; README reorganizado (tabelas de comandos, controles e parâmetros);
  novo `docs/VTT.md` (Foundry com Universal Battlemap Importer, Roll20, outras mesas); Docker em `docs/HOSPEDAGEM.md`.

## Câmera livre e novo menu

- **Câmera livre** (botão *Livre*): voa pela cena como um personagem sem corpo — WASD para onde olha, arrastar para
  olhar, Q/E (ou Espaço) desce/sobe, Shift acelera, roda do mouse ajusta a velocidade, aceleração e frenagem suaves.
  Colide com paredes e não entra no chão; **G** liga o modo fantasma. No celular: joystick + botões ▲▼.
  O menu Vista leva a câmera livre direto para os pontos prontos.
- **Dock redesenhado**: a barra de 15 botões virou um dock compacto com seletor de modo (Órbita/Caminhar/Livre),
  menus com todas as opções de Vista, Clima e Mapa (antes era preciso clicar várias vezes para chegar à opção),
  painel Personagens com interruptores e painel Mais (qualidade em 3 botões, camadas, exportar, importar,
  tela cheia, atalhos). Ícones, ponto verde quando a sincronização está ao vivo, janela de atalhos.
- Celular: dock em duas linhas, menus como folha inferior.
- `tools/testar-funcoes.mjs` testa também a câmera livre, o Esc e o menu Clima.

## Câmera de cinema (e sai o modo Caminhar)

- **Cinema** (novo botão no dock): a câmera puxa até um lugar escolhido como num filme, com barras pretas.
  *Escolher ponto na cena* (clica onde a câmera vai; ela se posiciona a ~5,5 m, em ângulo baixo, sem atravessar
  paredes) ou tocar uma *tomada gravada* (a câmera atual, guardada por mapa neste navegador) ou uma vista do mapa.
  Estilos: **Suave** (grua que sobe e desce), **Corte** (escurece e corta), **Susto** (chicote rápido, zoom e
  tremida com clarão). Depois de chegar, a câmera avança devagar (dolly) com leve movimento de mão.
- **Legenda** opcional embaixo, como num filme, e **Revelar**: um personagem (ex.: o vilão) aparece no ponto quando
  a câmera chega — "do nada".
- **Mostrar para todos**: a cena toca na tela de todos da sala (WebSocket ou banco do claude.ai); quem só vê também
  recebe. O servidor repassa a mensagem `cine` sem gravar em disco e guarda a cena em andamento por até 2 min,
  para quem entra ou reconecta no meio dela. Esc ou ✕ volta a câmera para onde estava (para todos).
- Página que incorpora: `postMessage({cmd:'cine', p, t, estilo, legenda})` e `{cmd:'cine-sair'}`.
- Saiu da interface o modo **Caminhar** (e o botão 1ª/3ª pessoa): a câmera livre cobre o mesmo uso.
- Personagem que dá um salto grande pela rede aparece direto no lugar, sem deslizar pelo mapa.
- Testes: servidor confere o repasse do cinema; teste de funções cobre cinema por postMessage, sair e gravar tomada.

## Tela limpa para transmitir

- Botão **Ocultar** no dock (ou tecla **H**): esconde barra, dicas, avatares, botão de sair do cinema e
  medidor — só a cena fica na tela que vai para os jogadores. O cursor some depois de 2 s parado. Volta com H
  ou com o botão invisível no canto inferior direito (aparece ao passar o mouse).
- Atalhos (com ou sem tela limpa): **P** escolhe o ponto da câmera de cinema, **1–9** tocam as tomadas
  gravadas, **Esc** sai do cinema. Aviso rápido no topo ao entrar na tela limpa.
- Skill `mapa-3d` e `CLAUDE.md`: tudo o que foi aprendido nesta rodada (branches de outras sessões, interface
  pronta, cinema, verificação sem placa de vídeo, publicação no claude.ai); regra de sempre registrar na skill.

## Segundo monitor: janela dos jogadores

- **Mais → Abrir janela dos jogadores** (ou `?tela=jogadores`, ou **Mais → Esta janela é a tela dos jogadores**
  num segundo link aberto): uma janela sem botões nem cursor, para o monitor/transmissão dos jogadores, que segue
  a janela do mestre ao vivo — câmera (órbita, livre, cinema com barras, legenda, esmaecimento e clarão), mapa,
  clima, personagens movidos/criados/revelados e "mostrar personagens". Duplo clique ou F: tela cheia; H: volta
  a ser uma janela normal.
- Ligação local entre janelas (`BroadcastChannel`, `core/espelho.ts`), sem servidor nem internet; por sala
  (`?room=`). A janela nova pede o estado atual (mapa, clima, personagens) ao abrir.
- Dentro de outra página (claude.ai) o botão explica como abrir em vez de abrir uma janela solta: o navegador
  só liga janelas que estão sob a mesma página de cima.
- A rede passou a ter um "ramal" local (`tap` em `core/net.ts`) que recebe o que esta janela muda.
- Teste de funções: janela dos jogadores liga e espelha clima e cinema.

## Imersão: congelar, escurecer, lanterna, relâmpago e som

- **Congelar a tela dos jogadores** (K): eles ficam na última imagem enquanto o mestre explora ou prepara; ao
  soltar, a câmera deles desliza até a do mestre. Uma cena de cinema descongela sozinha.
- **Escurecer** (B): tela preta com transição na janela dos jogadores (sem janela dos jogadores, escurece a
  própria). A janela do mestre mostra um selo "Tela dos jogadores congelada/preta".
- **Lanterna** (L): facho preso à câmera, com leve tremor; espelhado na janela dos jogadores. Na qualidade Baixa
  a luz só entra quando usada (cada luz pesa em todo material).
- **Relâmpago** (R) e **relâmpagos automáticos** (Terror e Noite): três clarões no céu e na luz ambiente e um
  trovão atrasado.
- **Som ambiente** gerado na hora (Web Audio, sem arquivos): vento com rajadas, zumbido grave, trovões distantes,
  grilos à noite — por clima, com transição; efeitos do cinema (susto, corte, suave) e trovão do relâmpago.
  Modo: desligado, nesta janela ou só na janela dos jogadores (padrão); volume.
- Indicador no dock (monitor verde) quando a janela dos jogadores está ligada; dica de qualidade ao ligar.

## Mesa do mestre: cenas, luz que cai, névoa, sons, imagens e vilão oculto

- Painel **Mestre** no dock reúne a direção da sessão (imersão e som saíram do *Mais*).
- **Cenas**: gravam clima, tomada da câmera, estilo e legenda do cinema, luz, névoa, lanterna, "mostrar
  personagens" e a posição/ocultação dos personagens **criados** (vilões/NPCs; os dos jogadores não mudam).
  **.** e **,** (ou Page Down/Up) passam como slides; ficam neste navegador, por mapa (`core/cenas.ts`).
- **A luz caiu** (O): lâmpadas, velas e auréolas piscam ~1,4 s e apagam (a luz de fora das janelas fica);
  O de novo pisca e volta. Persiste ao trocar de clima/mapa (`forcarLuzes` em `core/sky.ts`).
- **Névoa densa** (N): densidade ×2,4 com transição, por cima do que clima/mapa definem.
- **Sons do mestre**: batida na porta, passos, sussurro (passa de um lado ao outro), rangido, sino, trovão —
  gerados na hora. **Som no lugar** (`M.sons` no mapa): velas crepitando, sino da torre e porta que range quando
  a câmera passa; igreja e San Judas já têm os seus.
- **Mostrar imagem aos jogadores** (I): pista, foto, carta… por cima da cena, com efeito de papel opcional;
  as 8 últimas ficam como miniaturas (`core/mostrar.ts`).
- **Personagem oculto**: selecionar → Ocultar. O mestre vê meio transparente; a tela dos jogadores e quem só vê
  não veem até revelar (o Revelar do cinema já mostra). Vai pela rede (`o` na posição) e pelo espelho.
- Tudo aparece na janela dos jogadores; dock só com ícones até 1240 px.

## Documentação e aprendizados

- `docs/GUIA-DO-MESTRE.md`: tudo para usar na sessão (links, dois monitores, preparo, cinema, cenas, atalhos,
  painel Mestre, som, personagens, problemas comuns).
- Juntada a `main` (mapa do código `docs/MAPA_DO_CODIGO.md` + `scripts/mapa_do_codigo.py` e regras do Graphify
  no `CLAUDE.md`); mapa regenerado com os arquivos novos.
- Skill `mapa-3d`: preferências e decisões do dono, linha do tempo do projeto, ideias aprovadas e próximas.

## Harlow: Departamento do Xerife (local da missão)

- Prédio de tijolo na Main St com interior completo: recepção (mural de avisos, balcão com vidro), sala do
  xerife (memorando, carta de Pruitt, mapa do condado, fotos, cofre), sala dos agentes (4 mesas com
  relatórios, quadro de chamadas, escala), **sala do caso** (quadro com mapa, fotos, barbantes, linha do tempo
  e "o que sabemos"), evidências e arquivo (estantes, caixas, livro de registro com a fita nº 7 sumida),
  interrogatório (transcrição, espelho), rádio (registro das ligações das 22:01) e celas (sigilo riscado,
  bilhete). Viaturas com giroflex, letreiro, estrela, mastros e antena.
- Vistas novas (Delegacia, Recepção, Sala do xerife, Agentes, Sala do caso, Quadro do caso, Mural da
  recepção, Evidências, Interrogatório, Rádio, Celas), área VTT "Delegacia (missão)" com paredes e portas.
- Dossiê do mestre com a tradução de todos os documentos.

## Câmera livre mais rápida

- Velocidade base 5 m/s (era 4) e **segurar o movimento acelera sozinho** até ~2,2× (no celular, sem Shift
  nem roda, é o jeito de ir rápido); joystick no limite = correr (2,5×, como o Shift).
- Quanto mais alto, mais rápido (até 4× a 34 m de altura) — atravessar as cidades grandes ficou rápido e
  dentro dos prédios continua calmo. Teto de 70 m/s; roda do mouse vai até 60 m/s.
- Quadros longos (celular a 10–15 fps) não deixam mais a câmera livre em câmera lenta (limite do passo de
  0,05 s → 0,12 s só na câmera livre).

## Lupa de documentos, Harlow abre na delegacia, otimização geral

- **Mecânica nova — documentos clicáveis** (`src/core/docs.ts`): passar o mouse num papel, quadro ou cartaz
  da cena mostra a lupa; clicar abre o documento ampliado e legível, com **Mostrar aos jogadores** (vai para
  a tela/janela deles como imagem mostrada). Paredes no caminho bloqueiam; só abre até 14 m. Mapas registram
  em `M.docs`. Harlow tem 28 documentos registrados (delegacia + pistas da cidade). Teste: `npm run test:lupa`.
- **Harlow abre na delegacia** (1ª vista), com os personagens na calçada da frente.
- Delegacia: vidros e persianas nas janelas, portas de vidro abertas e toldo na entrada.
- **Otimização** (versão leve, qualidade Baixa): México 3,7 → 0,65 M triângulos, Texas 0,9 → 0,44 M; Alta do
  Texas 5,0 → 1,4 M. Como:
  - o lote (`Batch`) junta peças por região de 70 m — o que sai da tela ou da área da sombra não é desenhado;
  - vegetação, pedras, cactos e milharal em blocos com corte por distância (`tile`/`cullDist`);
  - documentos da delegacia somem a 40 m;
  - modelos mais leves: `WoodenChair_01` 20k → 3k, `covered_car` 12,6k → 5k, `Rockingchair_01` 3,5k → 1,8k,
    `cardboard_box_01` 1,7k → 0,8k; saloon e fazenda trocam o trono gótico por cadeiras de madeira em código.
- Ferramentas: `?fps=1` expõe `window.__peso()` (malhas mais pesadas); `node tools/medir-peso.mjs <mapa>
  --dist=dist-lite --lista` mede a versão publicada e lista os vilões.

## Dois monitores: informação só para o mestre

- Pensado para transmitir: a **janela dos jogadores** (outro monitor) mostra só a imagem da câmera; tudo o que é
  informação fica na **janela do mestre** (testado: a janela dos jogadores não mostra nota, lupa nem botões).
- **Notas do mestre por vista** (`M.notas`): ao escolher uma vista, um cartão no canto mostra o que há no local,
  segredos, NPCs e ganchos. Some na tela limpa e nunca aparece para os jogadores; × esconde até mudar de vista.
- **Mestre → Pistas do mapa**: lista todos os documentos por local; clicar abre na lupa **sem mexer na
  câmera** (os jogadores não percebem), com a **tradução/nota em português** ao lado.
- Na lupa: **Mostrar aos jogadores** (imagem por cima da tela deles) ou **Levar a câmera até lá** (movimento de
  cinema que enquadra o documento na cena).
- Harlow: tradução e nota de todos os 31 documentos e notas para todas as vistas (`src/maps/texas/pistas.ts`).

## Harlow: o sumiço das crianças e a floresta de Cedar Hollow

- **Floresta Cedar Hollow** (`src/maps/texas/forest.ts`), a noroeste depois dos trilhos, com estrada de terra:
  pinheiral (pinheiros leves em código, ~150 triângulos cada, em blocos com corte por distância), sub-bosque,
  chão de folhas com borda suave e névoa mais densa dentro da mata. No meio, o **Camp Harlow** abandonado
  (cabanas com interior, torre de vigia, fogueira, balanço, mastro) e a **árvore dos sapatos** (símbolo entalhado,
  12 sapatinhos, fitas, fita de isolamento, a lanterna do Tommy acesa). Pistas: cartaz e bicicleta do Danny,
  bilhete da mãe do Tommy, diário da monitora de 1986. Vistas e áreas VTT novas.
- **Delegacia — o sumiço das crianças:** quadro das 4 crianças com o padrão de 20 em 20 anos, mapa de busca da
  floresta, desenhos das crianças, cartazes na recepção, recorte de jornal de 1966, depoimento da mãe do Tommy,
  tênis e mochila nas evidências. Tradução e notas do mestre para tudo; dossiê reescrito para a missão.
- **Luzes que acompanham a câmera:** o conjunto de luzes (8/14/22 pela qualidade) vai para as luzes mais perto da
  câmera, 3×/s ou quando ela pula — delegacia, floresta e fazenda ficam iluminadas quando você está nelas, mesmo
  na qualidade Baixa (antes só as de maior prioridade no mapa todo acendiam).

## Correção: qualidade caía ao trocar o clima

- A resolução automática tratava a travada de carregar o céu novo (HDRI) como "aparelho lento" e baixava a
  resolução a cada troca de clima, quase sem voltar (exigia 57 fps). Agora: quadros acima de 250 ms descartam a
  medição; trocar de clima recomeça a medir; baixa só abaixo de 30 fps e volta a subir acima de 48 fps.
- Harlow: personagens nascem na calçada ao lado da porta da delegacia (não mais atrás da viatura).

## Harlow: o tempo parado, a cidade sem saída e o 2002 (ideias do áudio do mestre)

- A cidade acha que é **18/02/1987**: jornal no banco da praça, placa de data do banco (frente e verso). A delegacia
  sabe a data real (**15/11/2025**): calendário riscado do xerife com o dia 20 circulado.
- **"2002"** gravado na base do obelisco da praça (mortos das noites de dia 20 — segredo do mestre).
- Delegacia: **Livro dos dias 20** (um berro, um morto, todo dia 20) e quadro **End of Watch** dos policiais mortos.
- **Não há saída:** no modo caminhar/livre, passar de 215 m do centro leva a câmera ao lado oposto da cidade
  (desliga com `HARLOW_SAIDA = true` no console). Órbita e cinema não mudam.
- Ano das crianças passa a 2025 ("um ano adiantado"). Dossiê com as regras novas e fichas para os 22 personagens.

## Harlow: pousada Harlow House com quartos e moradores

- Pousada de madeira (varanda, placa VACANCY, telhado de duas águas) na Commerce St oeste: recepção, sala de jantar,
  apartamento da dona, corredor e 6 quartos mobiliados em código (cama, criado-mudo com abajur, armário, mesa).
- Moradores com pertences legíveis (lupa): Ellen Price (dona), Vee Laroche, Mr. Vance (o organizador), Gil Navarro,
  Juniper Fox, Frank Kowalski; o quarto 6 está reservado aos agentes. 12 documentos com tradução, 5 vistas, notas
  do mestre, área VTT. Helpers de papel/foto da delegacia agora exportados (`police.ts`).

## Harlow — os NPCs da pasta "NPCs anos 80" em pé no mapa

- Os moradores aparecem como figuras 2D (giram para a câmera, fazem sombra) nos lugares que combinam com cada um:
  delegacia (xerife, Garza, Irene, Tasha), pousada (Ellen na recepção, Vee, Gil, Juniper e Frank nos quartos),
  saloon, praça, igreja, cemitério, estação, silos, posto, motel, fazenda e vagão. Camada "Moradores (NPCs)".
- As imagens (artes de terceiros) ficam fora do git: `node tools/baixar-npcs.mjs` baixa a pasta para `npcs-local/`;
  sem elas aparece uma silhueta. Fundo branco/cinza é recortado no navegador.
- Mais 7 enviados no chat: 5 no saloon (Rooster, Spike, o barman Jack Mercer, Old Hob, Big Red) e 2 na igreja
  (Padre Thomas Kell e a Irmã Ruth). Total: 28 NPCs.
- Elenco trocado pelo da pasta; Mr. Vance saiu (vira o hóspede sem rosto do quarto 2). Os 6 quartos da pousada
  seguem com cama e documentos.

## Jogadores novos

- As fichas dos jogadores agora são os 3 personagens do grupo (j1, j2, j3), com imagens em `npcs-local/jogadorN.png`
  (fora do git, como os NPCs). Sem elas, usa as fichas antigas. Sabriny saiu.
- Versão offline: `npm run build:single` gera um HTML único que abre sem internet; a janela dos jogadores funciona
  do mesmo jeito (a ligação entre janelas é local).

## NPCs móveis e correção das manchas brancas

- Os NPCs de Harlow agora são personagens do mapa: o mestre arrasta, oculta dos jogadores (meio transparentes só
  para o mestre), muda o tamanho e "Voltar ao início" devolve cada um ao lugar original. Não entram na barra de
  jogadores; somem ao trocar de mapa. Novo campo do mapa: `M.npcs` (lista de `TokenDef` com `npc` e `pos`).
- Novo personagem: tamanho "Gigante (vilão)" (5 m) e "Começar oculto" — o vilão entra visível só para o mestre;
  "Mostrar" revela para os jogadores.
- Personagens podiam ser arrastados só até ±90 m; agora ±400 m (Harlow é maior).
- Corrigido: manchas BRANCAS nas partes pretas das fichas no anoitecer/noite em algumas placas de vídeo. O AgX faz
  `log2(cor)` e preto puro virava −infinito; um efeito antes do tone mapping limpa NaN/inf e põe um piso de 1e-4.

## Harlow — cena da chegada de ônibus

- Vista "Chegada (ônibus)": um ônibus intermunicipal (letreiro HARLOW, faróis acesos) vem pela rodovia, para no
  novo ponto em frente à delegacia, abre a porta e as fichas dos jogadores descem uma a uma até a calçada. A janela
  dos jogadores vê o mesmo (segue a câmera). Sair da vista e voltar repete. Nota do mestre com o texto de abertura.

## Correção: manchas brancas no cenário (qualidade Baixa)

- O desgaste (sujeira + escorrido) podia deixar a cor negativa em postes, carros e tijolos; o tone mapping mostra
  negativo como branco. Agora o fator é limitado a ≥ 0 e todo material passa por uma trava (cor ≥ 0, NaN → 0)
  antes do tone mapping — vale também sem pós-processamento.

## Botão "TV dos jogadores" na barra

- Botão dourado na barra de baixo (e tecla J) abre a janela dos jogadores; some quando a TV conecta e volta se ela
  fechar. O item antigo em Mais continua.

## Mapa novo: Greywater Falls, Ontário (1965) — O Caso Ashdown

- `?map=canada` (botão Mapa: "Greywater Falls (Canadá, 1965)"). Cidade de fábrica de papel em novembro: Main Street
  de tijolo (alfaiataria Ashdown fechada, funerária, cinema, banco…), 6 ruas residenciais com casas de madeira e
  árvores peladas, igreja anglicana de pedra com cemitério, rio escuro com represa e espuma, ponte de treliça de aço,
  fábrica de papel com chaminé fumegante, estação de trem, posto, lanchonete com neon, carros de 1965 em código,
  morros com pinheiros e neblina baixa sobre o rio.
- **Hotel Laurentian** com 3 andares por dentro: saguão (recepção, quadro de chaves, lustre), sala de jantar,
  beverage room (portas MEN / LADIES & ESCORTS), escritório, cozinha, escadaria até o 3º andar, corredores e 14
  quartos mobiliados (cama, cômoda com espelho, aquecedor, cortinas, papel de parede) + banheiros coletivos. Cada
  andar é uma camada; o arrastar de personagens pisa no andar visível; exportação VTT com uma área por andar.
- **Necrotério do distrito**: recepção, gabinete do legista, sala de autópsia (azulejo, mesas de aço, corpo coberto)
  e câmara fria com 12 gavetas (a nº 4 aberta e vazia).
- **Casa da Elm Street** com o alçapão do porão aberto (escada descendo para o escuro).
- Caso completo para o mestre (`docs/casos/greywater-caso-ashdown.md`): 30 vistas nomeadas com notas, 26 documentos
  legíveis com tradução. A marca da entidade (escrita dourada do Conhecimento) brilha sozinha de dia e de noite.
- Dia e noite: as luzes de rua apagam de dia; as de dentro do hotel, do necrotério e da casa ficam acesas (fracas).

## Greywater Falls — 1975, o hotel é a casa do William, lugares para entrar, som e manchas

- A história foi para **1975**. William é o **dono** do Hotel Laurentian (o hotel e bar aonde a cidade inteira vai) e
  Margaret morreu na escada do **porão do hotel** (novo: porão sob a cozinha, com escada, caldeira, barris, conservas e a
  parede escrita). A casa da Elm Street saiu. O terreno é recortado no shader em cima do porão.
- Dá para entrar na **fábrica de papel** (máquina de papel, tanques, relógio de ponto com o cartão do Moreau, quadro de
  avisos, escritório do capataz), na **lanchonete** e nas casas de **Eva Pelletier** e dos **Moreau**, cada um com
  documentos novos que apontam para o hotel.
- Vista **"Resumo do caso"** (nota com a história inteira) e resumo no começo do dossiê.
- Som: os sons do mestre (batida, passos, sussurro…) ficaram ~3× mais altos, com limitador; no modo "Jogadores" sem a
  janela dos jogadores aberta, o som toca na janela do mestre (antes ficava mudo).
- Manchas brancas nos telhados à noite: o telhado de zinco cruzava o topo das lojas (duas faces brigando) e era metálico
  (espelhava a lua). O telhado subiu e o zinco deixou de ser metal.

## Greywater Falls — moradores com as aparências do mestre, cartazes e retratos

- 22 moradores viram personagens móveis com as imagens da pasta do mestre no Pinterest (fora do git, em
  `npcs-local/canada/`, recortadas para `cut/`): William no bar, **Margaret oculta no 307** (novo: `pos.oc` faz um NPC
  nascer oculto), Dr. Finch, Sra. Doucette, a equipe do hotel, operários, Lise e Luc Moreau, Dot, o policial Roy etc.
- Cartazes de DESAPARECIDO do Jean Moreau (estação, hotel, fábrica, Main St), retrato "In memoriam" de Margaret no
  saguão, foto do casamento com o rosto dele riscado no 304 e foto do Jean na casa dos Moreau — desenhados com as
  mesmas imagens (sem elas, ficam só com o texto).
- Vistas "Personagens" (lista dos importantes) e "Retrato de Margaret (saguão)".
- Os personagens antigos dos jogadores saíram (pedido do dono): sem `npcs-local/jogadorN.png` as fichas são silhuetas
  neutras até chegarem as imagens novas.

## Introduções, aparição do vilão, fichas vivas, lista "onde está cada um", alfaiataria e igreja

- **Chegada (moto e carro)** em Greywater: dois agentes numa moto e um num carro atravessam a ponte na neblina,
  descem a Main Street e param em frente ao hotel; as fichas descem para a calçada (vista "Chegada (moto e carro)").
- **Aparição** (`core/aparicao.ts`): ao clicar **Mostrar** num personagem oculto (ou ao adicionar um vilão já
  visível), as duas janelas mostram uma introdução sinistra de ~4,6 s com a imagem dele — chiado de TV, lampejos,
  figura avermelhada tremendo com glitch, avanço brusco no rosto com clarão, corte para o preto — e o som 'aparicao'.
- **Fichas vivas**: todos os personagens têm uma mini animação (braços balançando de leve, respiração, balanço do
  corpo), cada um numa fase — deslocamento no vértice de um plano subdividido.
- **Onde está cada um** (menu Personagens): lista de todos os personagens com o lugar onde estão (vista mais
  próxima), busca, **Ir** (câmera vai até ele), **Trazer** (para onde a câmera olha) e **Levar para…** (um lugar).
- Greywater: dá para entrar na **alfaiataria Ashdown & Son** (loja e oficina com os moldes de papel do corpo de
  Margaret e o livro de encomendas) e na **igreja de St. Columba** (bancos, altar com velas, livro de sepultamentos,
  quadro de hinos).

## Diagnóstico das manchas (F9 ou Mais → Manchas na imagem?)

- As manchas brancas/pretas continuam em algumas placas (faces viradas para a lua ficam brancas, as do lado oposto
  pretas). O navegador de teste não reproduz. Painel com chaves que desligam uma coisa por vez (sombra, luz da lua,
  luz do céu, reflexos do HDRI, luzes pontuais, névoa, pós); a escolha fica salva no navegador e se reaplica sozinha.
  Mostra também o nome da placa e a precisão do shader.

## Jogadores novos e criaturas (PDF do mestre)

- Fichas dos jogadores: Jogador 1 (de preto) e Jogadora 2 (ruiva) chegam de moto; Nancy chega de carro (imagens em
  `npcs-local/jogadorN.png`, fora do git).
- Duas criaturas em Greywater, ocultas até o mestre clicar Mostrar (aparição): "Margaret, a forma refeita" no porão do
  hotel e "O Esfolado" na fábrica.

## Botão da TV sempre visível e barra que cabe na tela

- O botão "TV dos jogadores" não some mais quando a TV liga: fica verde ("TV ligada") e clicar traz a janela da TV
  de novo. A barra nunca passa da largura da tela e os rótulos somem abaixo de 1520 px (ficam no `title`).

## Ferramentas de recorte no repositório

- `tools/recorte.py` (recorte por crescimento de região) e `tools/limpar-recorte.py` (maior pedaço, sombra no pé, vão
  entre as pernas, chão escuro) saíram da pasta temporária da sessão. Na skill: decisões do dono em Greywater, datas
  que foram escolhidas (não ditas pelo dono), como refazer as imagens locais e o arquivo offline.

## Tudo junto e registrado

- Juntadas na mesma branch: as funções e mapas da `ccr-a7aaff16-e40c5h` (Harlow, Greywater, lupa, notas do mestre,
  TV, aparição, fichas vivas…), a `main` (mapa do código, Graphify) e o histórico da `mapa-igreja`.
- `docs/HISTORICO.md` atualizado até hoje (estado, três links, imagens locais, arquivo offline, linha do tempo);
  `docs/GUIA-DO-MESTRE.md` cobre os recursos novos; `CLAUDE.md` com as regras fixas do dono; skill com o cuidado de
  não republicar sem as imagens locais.
