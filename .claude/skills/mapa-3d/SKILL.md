---
name: mapa-3d
description: Criar ou melhorar um mapa 3D de RPG de mesa (estilo terror realista, Ordem Paranormal) neste projeto — igreja, cidade, casa, hospital, floresta — e a interface em volta (câmera livre, câmera de cinema, tela limpa para transmitir, sala com vários jogadores). Use sempre que o usuário pedir um mapa novo, mudar um mapa ou a interface, trocar materiais/modelos/céu, deixar a cena "com cara de jogo" ou publicar/atualizar os links no claude.ai. Traz o fluxo, o catálogo de assets CC0 já testados, os erros a evitar e como verificar sem placa de vídeo.
---

# Mapa 3D (estilo terror realista)

Projeto: Vite + TypeScript + three.js r187. Cada mapa é um módulo em `src/maps/` registrado em
`src/maps/manifest.ts`. O núcleo (`src/core/`) já faz céu, luz, pós-processamento, personagens, câmera livre,
câmera de cinema, cenas, tela limpa, janela dos jogadores (2º monitor), imersão (luz que cai, névoa, lanterna,
relâmpago), som gerado na hora, imagens para os jogadores, rede, exportação VTT e resolução adaptativa —
**não reescreva o núcleo**. Leia `docs/NOVO-MAPA.md` antes de começar; como o dono usa tudo na mesa:
`docs/GUIA-DO-MESTRE.md`. Para achar código gastando pouco: `docs/MAPA_DO_CODIGO.md` (regenere com
`python3 -I scripts/mapa_do_codigo.py` depois de mexer em código) e o Graphify quando o repositório estiver indexado.
  **Graphify**: `Tyzk13/MAPAS` está indexado e o índice segue a **`main`** (reindexa a cada push nela). Confira o
  `commitSha` do resultado com `git rev-parse HEAD`; o que só existe na sua branch, leia direto do arquivo. Ao fim de
  cada rodada, abra um pull request da branch para a `main` (o dono aprova) para o índice acompanhar.
  Teste medido (nov/2026): `graphify_impact` em função muito usada (`docPlane`, 6 arquivos) custou ~3,3 mil
  caracteres contra ~10,5 mil do grep e ~49 mil do grep + leitura em volta (−70 a −93%); em função com 1 uso
  (`fatorLuzes`) o grep puro (~300) saiu mais barato que o Graphify (~1,2 mil). Regra: grep para 1–2 usos,
  Graphify para "quem usa / o que quebra" em funções compartilhadas. Ele pode trazer ligação inferida falsa
  (conf 0.5): confie nas de `resolution: typed`.

**Tudo o que aprender (erro, truque, decisão do dono) vai para esta skill no mesmo commit.**

## Antes de começar

- `git fetch` e `git branch -a`: outras sessões deixam trabalho em branches não juntadas (já aconteceu:
  `mapa-igreja` tinha a otimização de desempenho; `ccr-a7aaff16-e40c5h`, o mapa do México e o Texas;
  `ccr-e87ec97a-p4jbyp`, Painel Mestre, cinema e imersão — "pega as funções que o repositório contém" =
  juntar essas branches). Se o pedido
  envolve essas coisas, junte antes. Ao juntar, procure recursos **duplicados** (duas resoluções adaptativas
  se somavam e derrubavam a imagem para ~30%) e mantenha todas as seções do `CHANGELOG.md`.

## O dono e como ele trabalha (preferências e decisões já tomadas)

- Mestre de **Ordem Paranormal** (terror). Escreve em português informal, curto, às vezes com erros de digitação
  ("caminhão" = Caminhar). Interprete pelo contexto e diga a interpretação em uma linha; não trave perguntando.
- **"Pode já colocar tudo, nem precisa perguntar"**: quando ele pede melhorias/ideias, implemente o pacote
  inteiro, teste, publique e só então relate. Sugira as próximas ideias no fim da resposta.
- No fim de cada rodada ele quer **os links** (claude.ai) já atualizados — atualize os links existentes, não
  crie outros. Ele não lê código: explique o que mudou em termos de mesa (o que o jogador vê, que tecla usar).
- Mesa: **dois monitores** — um com a janela do mestre (controla câmera, personagens), outro com a **tela dos
  jogadores** (transmitida/mostrada a eles). Nada de informação do mestre pode aparecer na tela dos jogadores.
- Decisões: modo **Caminhar saiu da interface** (a câmera livre cobre; o código ficou para a captura
  "terceira" e `?walk=1`); a câmera "puxa" para um lugar como no cinema para revelar vilões (Cinema + Revelar +
  personagem Oculto + aparição); terror **sutil** por padrão — em Greywater ele pediu criaturas explícitas.
- Ele joga muitas vezes **offline** (HTML único) e abre os links pelo **celular**. Histórico completo e estado
  atual: `docs/HISTORICO.md`.
- Ideias que ele aprovou e já existem: câmera livre, cinema, tela limpa, 2º monitor, congelar/escurecer,
  lanterna, relâmpago, som ambiente, luz que cai, névoa densa, sons do mestre, som no lugar, imagens para os
  jogadores, cenas como slides, personagem oculto. Próximas candidatas: música/trilha por cena, efeitos de
  câmera (respiração, tontura), mapa tático com névoa de guerra, rádio/telefone com chiado, fichas de pista
  em sequência, lista de iniciativa na tela dos jogadores.
- Outras sessões trabalham no mesmo repositório (branches `ccr-*`, `mapa-igreja` e commits na `main`, como o
  mapa do código e o Graphify). Sempre junte o que existir antes de publicar.

## Linha do tempo (o que já foi feito, para não refazer)

1. Projeto Vite + three r187, pós-processamento, PBR, igreja reconstruída com assets CC0, VTT, servidor (etapas A–F).
2. Otimização da igreja (12,6 M → 4,7 M triângulos), erros na tela, 8 bits em celular antigo (`mapa-igreja`).
3. Mapa San Judas de las Ánimas (México) em `src/maps/mexico/`.
4. Organização: resolução adaptativa, servidor endurecido + Dockerfile + teste, CI, docs (VTT, hospedagem).
5. Câmera livre, dock redesenhado, câmera de cinema (+ envio para a sala), tela limpa, atalhos.
6. Janela dos jogadores (BroadcastChannel), imersão (K, B, L, R, som), painel Mestre (cenas, luz que cai,
   névoa, sons do mestre, som no lugar, imagens, personagem oculto).
7. Harlow, Texas (`src/maps/texas/`): delegacia com pistas, lupa de documentos, notas do mestre, floresta.
8. Greywater Falls, Ontário (`src/maps/canada/`): hotel de 3 andares, moradores do dono, aparição, fichas vivas, TV.
9. Mapa do código + regras do Graphify na `main`; tudo juntado numa branch com `docs/HISTORICO.md` e o guia do mestre.

## Fluxo (siga nesta ordem, com commit e capturas a cada etapa)

1. **Planta** em metros (1 m = 1 quadrado da grade; chão em y=0; frente = +z). Anote medidas num
   `common.ts` do mapa (como `src/maps/igreja/common.ts`).
2. **Assets**: escolha primeiro do catálogo em `CATALOGO.md` (já baixados ou já testados). Só procure
   novos se faltar algo; ver "Achar assets novos" abaixo.
3. **Construção**: arquitetura por código (`wallGeo` com vãos reais, `pbr()` + `boxUV`), móveis/props por
   `place()`/`instance()`, terreno por `makeTerrain`, gramado por `grassField`.
4. **Capturas**: defina vistas com nomes e rode `npm run capturas -- <rótulo> --map=<id>`
   (use `--q=baixa --w=960 --h=540 --only=...` para iterar rápido; `--q=alta` para a rodada final).
   Abra as imagens e compare com `referencias/`. Corrija em ciclos.
5. **Testes**: `npm run typecheck`, `npm run test:funcoes` (~8 min, precisa passar inteiro),
   `npm run test:vtt`; mexeu no servidor → `npm run test:servidor`.
6. **Entrega**: `npm run build` (site), `npm run build:single` (HTML único), `npm run build:leve`
   (celular / página no claude.ai). Atualize `CHANGELOG.md`; `CREDITS.md` é gerado por `npm run assets`.

## Receita visual (o que deu certo)

- Céu = HDRI "puresky" por clima (`src/core/sky.ts`); névoa tira a cor do horizonte do HDRI; névoa por altura.
- Pós: N8AO (AO) + bloom + AgX + saturação −0.2 + vinheta + grão + SMAA (`src/core/post.ts`).
- Paleta: concreto/reboco cinza, madeira escura, verde desbotado; luz fria ambiente + pontos quentes.
- Interior: `EnvProbe` (reflexo/luz rebatida própria), `RectAreaLight` fria nas janelas, lustres/velas
  com `PointLight` decaimento 2 (candelas: lustre ~26, vela ~3, lampião ~6–9), feixes `lightShaft` bem
  fracos e `dustMotes` sutis.
- Exterior: varais de lampadinhas, lanternas, poças (`roughness 0.05`), névoa em sprites à deriva,
  `weather()` no concreto (sujeira e escorridos), vento nas plantas (`instance(..., { wind })`).
- Atmosfera de terror **sutil**: sem monstros, sangue ou sobrenatural explícito.

## Mapas grandes / cidade (aprendido em `src/maps/mexico/`)

- Modelo de referência para cidade: `src/maps/mexico/` — `common.ts` (planta, `Q` por qualidade, materiais,
  `Batch`), `town.ts` (casas e quadras geradas), `landmarks.ts` (lugares com interior), `nature.ts`
  (terreno, cactos/pedras em código), `index.ts` (luzes, vistas, VTT, animação).
- **Junte peças por material** (`Batch` com cor de vértice + `vertexColors`): centenas de casas viram poucas
  malhas. Tinja a textura pela cor de vértice em vez de criar um material por cor.
- **Colisão barata**: além da malha visual, uma caixa simples invisível por casa para `M.solid()` (raycast
  contra malhas detalhadas a cada passo trava o celular).
- **Luzes**: peça luzes com prioridade (`LREQ` em landmarks.ts) e crie só as N mais importantes como
  `PointLight` (8/14/22 por qualidade); o resto vira só `halo`. Cada PointLight pesa em todo material.
- Para mapas maiores que ±90 m use os campos opcionais `M.walkLimit`, `M.camMax`, `M.fogScale`; deixe a
  névoa rarear com a altura da câmera no `tick` (vista Tática legível) e esconda sprites de névoa no alto.
- Placas/letreiros: textura de canvas (`sign()` em mexico/common.ts) — barato e dá muita identidade.
- Coisas que não existem em CC0 e saem bem em código: cactos (lathe com gomos), agave, nopal, pedras
  low-poly (icosaedro deformado), postes com fios (`LineSegments`), papel picado (InstancedMesh + canvas
  com recortes), vasos de barro (lathe), caixotes (caixa), círculo de giz (canvas no chão).
- Mapa inicial da página publicada: `<script>window.MAPA_PADRAO="id"</script>` no `index.html` da cópia.

## Mistério (Ordem Paranormal) — receita que funcionou em `src/maps/texas/mystery.ts`

- Escreva primeiro o caso (premissa, verdade do mestre, 8–12 pistas) em `docs/casos/<mapa>-<caso>.md`,
  com uma **vista nomeada para cada pista**, e só então coloque as pistas no mapa.
- Pistas baratas e legíveis: texturas de canvas (lápide com nome, cartaz de desaparecida, mural de recortes
  com barbante, polaroid, quadro de hinos com a data, espelho escrito), **um sigilo inventado repetido** em
  vários lugares (vagão, caixa-d'água, milharal, mapa), uma luz vermelha fraca pulsando (porão), velas
  acesas "por alguém hoje", relógio parado, letreiro de neon com frase ambígua.
- Algo visível na vista **Tática** (círculo queimado no milharal) ajuda o mestre na mesa virtual.
- Não copie sigilos oficiais do sistema; invente. Terror sutil: sem monstro explícito.
- Textos no idioma do lugar (inglês no Texas, espanhol no México); a tradução vai no dossiê.

## Texas (aprendido em `src/maps/texas/`)

- `shell()` (texas/common.ts): 4 paredes com vãos reais por lado (`side`, `at` em coordenada do mundo) e
  oitão opcional; `gableRoof()` telhado de duas águas; `Builder.store()` fachada falsa de faroeste,
  `Builder.house()` casa de tábuas com varanda; `neonTexture()` letreiro de neon (MeshBasic em `M.lamps`).
- Tábuas texturizadas escuras não ficam brancas tingindo: use `pbr(id, { map: false })` + cor de vértice
  (fica o relevo das tábuas e a cor vem da pintura).
- Faixa colorida em volta de prédio com interior = 4 caixas finas, **nunca** uma caixa do tamanho do prédio
  (enche o interior).
- Torre treliçada: pernas inclinam para dentro (`rx = -b·k`, `rz = a·k` com a,b = ±1).
- Animações baratas no `tick`: bombas de petróleo (grupo do balancim + manivela), roda do moinho,
  bandeira (vértices de um plano 12×6), rodadoras (LineSegments), neon piscando.

## Interior cheio de informação (aprendido na delegacia, `src/maps/texas/police.ts`)

- Documentos = planos com textura de canvas (`paperDraw`, `photo`, `cork`, `marker`); em 1600×900 ficam
  legíveis com a câmera a ~2,5 m de um quadro de 8,8 m (2048 px de largura). Fonte monoespaçada ≥ 13 px no
  canvas para folhas de 0,25 m sobre mesas. Plano em parede: afaste 0,012 m e use `polygonOffset`.
- Quebra de linha: a altura do título vem do retorno do `wrap()`, não de conta aproximada (sobrepunha).
- Cada documento importante ganha uma linha traduzida no dossiê e cada sala uma vista nomeada (inclua
  vistas de perto dos quadros, ex.: "Quadro do caso").
- Paredes internas: material **sem textura** (`plain`) com cor; concreto texturizado tingido fica escuro.
  Faixa de rodapé verde + parede clara = repartição dos anos 80. Forro rebaixado na camada de telhado (some
  na vista de cima/VTT) e painéis fluorescentes emissivos sem luz própria; poucas PointLights por sala.
- Cornija/platibanda = 4 caixas nas bordas, nunca uma laje inteira fora da camada de telhado: ela esconde o
  interior na exportação VTT. Confira a prévia `capturas/vtt/<mapa>-*_previa.jpg` (`node tools/testar-vtt.mjs --map=<id>`).
- `WoodenChair_01` é uma cadeira **gótica tipo trono** — não serve para escritório; faça cadeira em código.
  `steel_frame_shelves_01` vem em escala errada (11 m) e `drawer_cabinet` é móvel moderno: descartados.

## Câmera livre (decisão do dono: "estava muito devagar")

- `src/core/walk.ts` `freeStep`: base `WM.speed` 5 m/s × aceleração por segurar (até 2,2×) × correr (Shift ou
  joystick no limite, 2,5×) × altura (até 4×), teto 70 m/s. Não volte a limitar o passo da câmera livre a
  0,05 s: em celular lento isso a deixava em câmera lenta. Mapas grandes pedem câmera rápida no alto.

## Dois monitores (decisão do dono)

- O dono transmite **um monitor só com a câmera** (janela dos jogadores, `?tela=jogadores`) e usa **o outro só
  para ele**, com as informações. Regra: toda informação de mestre (notas, traduções, listas, lupa) aparece
  só na janela do mestre — nunca na dos jogadores nem na tela limpa (`.jogadores`, `.limpa` no CSS).
- Por mapa, preencha `M.notas` (texto por nome de vista: o que há, segredos, NPCs, gancho) e dê `pt`/`onde` a
  cada documento de `M.docs` (tradução/nota e local). Modelo: `src/maps/texas/pistas.ts`.
- Mestre → Pistas do mapa abre um documento sem mover a câmera; "Levar a câmera até lá" (cinema) é a forma de
  mostrar na cena. `npm run test:lupa` confere tudo isso e que nada vaza para a janela dos jogadores.

## Lupa de documentos (`src/core/docs.ts`)

- Todo documento importante vai em `M.docs = [{ o: mesh, n: 'Nome' }]` (plano com textura de canvas): passar o
  mouse mostra a lupa, clicar abre ampliado com "Mostrar aos jogadores". Em police.ts/mystery.ts o padrão é
  `nm('Nome'); doc(...)` / `nm('Nome'); plane(...)`. Canvas de 512–2048 px fica legível ampliado.
- Teste: `npm run test:lupa` (espera a câmera chegar na vista — o navegador de teste é lento: use
  `waitForFunction` na posição da câmera, não um tempo fixo).
- A 1ª vista de `M.views` é onde o mapa abre: ponha lá o lugar da missão (Harlow abre na delegacia).

## Floresta e luzes (aprendido em `src/maps/texas/forest.ts` e `texas/index.ts`)

- `fir_tree_01` (até no LOD2) custa ~17k triângulos por cópia e quase não aparece de longe: para mata densa, use
  **pinheiro em código** (`pineGeo`: tronco + 7 saias de cone com borda irregular, cor por vértice, ~150 tri),
  instanciado em blocos de 30 m com `cullDist`. Cor verde-oliva escura e pouco saturada (HSL ~0.27/0.22/0.075).
- Chão de mata = malha por cima do terreno com textura `forest_ground_04` e **cor de vértice com alfa
  (itemSize 4) + `transparent`**: a borda some aos poucos. Corte seco (afundar vértices) deixa degraus.
- Mantenha livres de árvores as câmeras das vistas (`FOREST.cams`) e os pontos de cena (árvore dos sapatos).
- Luzes: em vez de acender só as N de maior prioridade no mapa todo, mantenha N PointLights e mova-as para as
  luzes pedidas mais perto da câmera (`escolherLuzes`, 3×/s ou quando a câmera pula > 5 m). Mudar posição/cor
  não recompila shader. Nas capturas o tempo é fixo: re-escolha também pela distância percorrida.

- `node tools/testar-vtt.mjs` grava `.dd2vtt`/`.png` de dezenas de MB em `capturas/vtt/`: estão no `.gitignore`
  (só as `_previa.jpg` vão para o git). Nunca faça `git add` deles.

## Resolução automática (`src/core/desempenho.ts`)

- Travadas pontuais (carregar HDRI ao trocar clima, sonda de ambiente, compilar shader) não podem baixar a
  resolução: quadros > 250 ms descartam a janela e `escolherClima` chama `desempenho.reiniciar()`. Limites:
  baixa < 30 fps, sobe > 48 fps (2 janelas). Para testar a imagem sem esse efeito: `?auto=0`.
- Bug relatado pelo dono: "a qualidade está bugando ao trocar o tempo" = isso.

## Medir o peso (faça antes de publicar)

- `npx vite build --outDir .cache/capturas-build && node tools/medir-peso.mjs <mapa>` (Baixa e Alta).
  O que vale é a versão publicada: `npm run build:leve && node tools/medir-peso.mjs <mapa> --dist=dist-lite --lista`
  (`--lista` = 20 malhas mais pesadas via `window.__peso()`, disponível com `?fps=1`).
- `Batch` agrupa por região de 70 m (não só por material): sem isso uma malha cobria a cidade inteira e
  nunca saía da tela nem da sombra. Instâncias espalhadas: sempre `tile` + `cullDist`.
- Reduções feitas: `WoodenChair_01` 0.15, `covered_car` 0.4, `Rockingchair_01` 0.15, `cardboard_box_01` 0.05
  (em `tools/orcamento.sh`). `boulder_01` não reduz (nem simplify nem Decimate do Blender passam de 28k): use
  pouco ou pedra em código. Fontes ausentes em `assets-src/`: `npm run assets -- --force --only=<id>`.

- Por dentro: abrir `?map=<id>&q=baixa&fps=1` no Playwright e ler `#fps` (draws e triângulos;
  fps no swiftshader não vale nada). Para achar culpados, percorra `M.G` somando triângulos × `count`
  das InstancedMesh e liste os 25 maiores.
- Meta para celular (Baixa): ≲ 1,5 M triângulos na cena (o contador do `#fps` soma sombra/AO, ~3×).
- Já pegou: `boulder_01` tem **54k tri** por cópia (não espalhe); `jacaranda_tree` até no LOD1 tem 65k
  nos galhos; `ceramic_vase_03` 11k; `wooden_crate_02` 5k; `street_lamp_02` só depois de simplificar.
- Na versão leve (`build:leve`) os arquivos `_lod1` somem (viram o id normal): use `lod(id)` de
  `mexico/common.ts` (`hasModel(id+'_lod1') ? ... : id`), senão as árvores não aparecem no site.

## Mecânicas de história no mapa (sem mexer no núcleo)

- Regra de mundo que mexe na câmera (ex.: "não há saída" de Harlow) vai no `M.tick` do mapa, lendo/escrevendo
  `WM` de `core/walk.ts`: caminhar usa `WM.x/z/y`, câmera livre usa `WM.fp`. Só aja com `WM.on`; deixe órbita e
  cinema livres para o mestre. Dê sempre um jeito de desligar (flag em `window`) e explique no dossiê.
- Áudio do dono: transcreva com faster-whisper (decodifique com ffmpeg para f32 16 kHz). Trechos confusos: rode de
  novo só o trecho com `large-v3`; o que ainda ficar ambíguo, interprete e diga ao dono o que foi suposto.
- Imagens de personagens que o dono manda costumam ter direitos de terceiros: não vão para o repositório; viram
  fichas (aparência → papel no caso) no dossiê.

- Interior com paredes externas de `shell()`: **não cubra a face interna com um painel liso** (papel de parede)
  — ele tapa os vãos das janelas. Ou deixe o material da casca aparente, ou faça o painel com os mesmos furos.
- Prédio novo em Harlow: constante em `common.ts`, módulo próprio devolvendo a interface `Police` (docs, solids,
  floors, roofs, vttWalls, portals, lamps) e somar em todas as listas do `index.ts` (docs, walk, solids, layers,
  vtt, exportHide) + `busy()` para não nascer casa por cima.

### Fichas dos jogadores com imagens do grupo
- `src/core/tokens.ts` lê `npcs-local/jogadorN.png` (glob) e cai nas fichas antigas. A ficha usa o alfa da PNG
  direto, então recorte ANTES: fundo liso → `convert -fuzz 7% -fill none -draw "color x,y floodfill"` de vários
  pontos da borda; fundo em degradê com roupa escura → crescimento de região comparando com o vizinho (tolerância
  baixa, ~2.5) + 2ª passada que só avança para pixels parecidos com o fundo estimado por linha. Print de celular:
  pinte de branco os botões da tela antes do recorte. `pip install` é bloqueado aqui; PIL e numpy existem.
- Capturas (`--views`) escondem os personagens; para vê-los use `__cap.third({x,z,yaw,pitch})`.

### NPCs com imagens de terceiros (Harlow)
- Repositório é **público**: arte de terceiros (Pinterest etc.) nunca vai para o git. Padrão: script em `tools/`
  baixa para uma pasta no `.gitignore` (`npcs-local/`), o mapa carrega com `import.meta.glob(..., { eager: true,
  query: '?url', import: 'default' })` (não quebra se a pasta não existir) e cai numa silhueta.
- `fetch` do Node não usa o proxy da sessão: baixe com `curl` (execFileSync). Pinterest precisa de pin.it,
  www.pinterest.com e i.pinimg.com liberados; as imagens estão em `i.pinimg.com/originals/...` no HTML da pasta.
- Recorte do fundo: flood-fill a partir das bordas (cor do canto ± tolerância ou quase branco) num canvas, depois
  cortar a sobra transparente; `crop` por NPC tira marca d'água/quadros extras. Billboard: grupo no chão girado só
  em Y para a câmera no `M.tick`; `customDepthMaterial` com alphaTest para sombra com a forma da figura.

### NPCs móveis (`M.npcs`)
- Mapa que quer NPCs arrastáveis define `M.npcs = async () => TokenDef[]` com `npc: true` e `pos`. O núcleo cria os
  personagens depois do carregamento, tira os do mapa anterior e não os põe na barra dos jogadores. Imagem precisa
  ter alfa: recorte num canvas e passe `toDataURL('image/png')`.

### Manchas brancas no preto (AgX)
- Relato "textura bugada no anoitecer" com print de roupa preta cheia de branco = `log2(0)` do tone mapping AgX
  em placas reais (o swiftshader das capturas NÃO mostra). Mantenha o efeito `limpaCor` antes do `tm` em `post.ts`.
- Se o branco aparece no cenário todo (postes, carros, tijolo) e na qualidade Baixa (sem pós): cor NEGATIVA no
  material. Causa achada: `weathering.ts` fazia `cor *= 1 − sujeira − escorrido` (passava de 1). Regra: todo
  multiplicador de escurecimento em shader leva `max(0.0, …)`. Há trava global em `engine.ts` (ShaderChunk
  `tonemapping_fragment`: max 0 e NaN→0) — não remova.

## Prédio de vários andares e cidade dos anos 60 (aprendido em `src/maps/canada/`)

- Greywater Falls reaproveita o Texas (`Builder` de lojas/casas/ruas/postes, `shell`, `light`/`LREQ`, `TM()`, papéis de
  `texas/police.ts`) e só cria o que é dele: `interior.ts` (`Kit`: paredes com vãos `[centro, largura, altura]`,
  papel de parede listrado com lambri, cama, cômoda com espelho, cadeira, poltrona, mesa com toalha, aquecedor,
  tapete, garrafa, figura coberta por lençol, porta com número; `docPlane`; `sigilKnow`; `scrawl`).
- **Andares como camadas**: cada andar num `THREE.Group` próprio (casca externa do andar, laje do piso, paredes,
  móveis). A laje de um andar é o teto do de baixo, então esconder o andar de cima "abre" a vista. Pisos e rampas de
  escada recebem `userData.l = grupo` — o arrastar de personagens (`wk()`) ignora pisos de camadas escondidas.
- Laje com vão de escada: faixas em x entre as bordas dos vãos e, em cada faixa, pedaços em z fora dos vãos.
  Escada = degraus maciços + rampa invisível (DoubleSide) para pisar; a inclinação da rampa vem de
  `sign(xb−xa)·atan2(subida, |xb−xa|)` (com `atan2(subida, xb−xa)` a rampa que desce para −x fica de cabeça para baixo).
- Exportação VTT por andar: `M.exportHide` lê o nome da área escolhida (`#xa`) e esconde os andares de cima.
- Casca de tijolo vista por dentro parece porão: por dentro, uma segunda `shell()` fina (0,02 m) com papel de parede e
  os **mesmos vãos** (o `at` é coordenada do mundo; ajuste o peitoril pela diferença de altura da base).
- Persiana acesa à noite: plano de `TM().lit` virado **só para fora** + pano por dentro; uma caixa acesa brilha
  também dentro do quarto.
- Porta entreaberta com `Kit.door(dobradiça, ry)`: folha ao longo do x local; ry = −π/2 estende para +z, +π/2 para −z;
  abrir para dentro do quarto = somar/subtrair ~1,1 rad conforme o lado.
- Buraco no piso (alçapão): o piso tem de ser feito em pedaços em volta do vão (uma caixa inteira tapa a escada).
- Escrita sobrenatural legível no escuro: `docPlane(..., glow)` usa a própria textura como `emissiveMap`.
- Ruas novas cruzam marcos: confira igreja/cemitério × ruas transversais (a igreja nasceu em cima da King St; a rua
  oeste foi cortada antes dela).
- Porão debaixo de prédio: o terreno tapa a escada. Recorte o terreno no shader do mapa: encadeie o `onBeforeCompile` do
  material do terreno e dê `discard` no retângulo (o `vTUv` do terreno é (x, −z) do mundo); troque o
  `customProgramCacheKey`. O colisor do terreno continua inteiro (arrastar ficha para o porão pode parar em y≈0).
- Manchas brancas "com borda de ruído" nos telhados à noite: telhado inclinado cruzando o topo da caixa do prédio
  (z-fighting de dois materiais) + zinco com `metalMap` refletindo a lua. Telhado inclinado: suba o centro em
  `meia-profundidade·sen(inclinação)`. Os HDRIs não passam de 156 (conferido): não é estouro do céu.
- Som do mestre baixo/mudo: modo "Jogadores" sem janela dos jogadores ligada agora toca aqui (`somAqui` em imersao.ts);
  efeitos passam por `efeitosG` (×3,2) e um compressor no fim (`som.ts`).
- NPCs de Greywater: `canada/npcs.ts` (lista `MORADORES`, imagens em `npcs-local/canada/cut/NN.png` já recortadas com
  `recorte.py` + limpeza: só o maior pedaço, sombra branca neutra no pé, buraco claro entre as pernas). `pos.oc: true`
  faz o NPC nascer oculto (a entidade). Cartazes/retratos com a mesma imagem: `texCom()` desenha sem imagem e redesenha
  quando ela carrega (`needsUpdate`).
- `__cap.third()` põe a câmera no andar mais ALTO (raycast de cima) e os personagens sobem/descem interpolando: chame
  `__cap.frames(40)` antes do print, senão aparecem no térreo.
- Cena com veículos levando as fichas dos jogadores (`canada/chegada.ts`, como o ônibus de Harlow): enquanto andam,
  mexa `t.target`/`t.ty`/`t.g.position` LOCALMENTE nas duas janelas (a animação roda nas duas porque a câmera da
  dos jogadores segue a do mestre); só no fim a janela do mestre grava com `setTarget` + `save`.
- Aparição (`core/aparicao.ts`): sobreposição DOM com `requestAnimationFrame` (não depende do laço 3D); vai para a
  janela dos jogadores como `{k:'apar', id}` pelo espelho. No Playwright o laço 3D é lento demais para ver os
  quadros: teste a sobreposição sozinha numa página em branco com `createServer` do vite.
- Fichas vivas: `PlaneGeometry(w, 1, 10, 20)` + `onBeforeCompile` (uniform `tempoFichas` atualizado no `tickTokens`).
- Lista de personagens: lugar = vista cujo "ponto de chão" (1,8 m à frente da câmera da vista, pés em p.y−1,6) está
  mais perto; usar o ALVO da vista erra (o alvo de "Hotel Laurentian" fica dentro do 2º andar).
- Imagens que o dono manda como ARQUIVO aparecem em `/root/.claude/uploads/<sessão>/` (PDF também: `pdfimages -png`).
  Imagem colada no chat NÃO vira arquivo. Recorte de figura escura em fundo escuro com chão: recorte.py (vizinho) e
  depois inundar a partir do transparente só os pixels escuros com limiar crescente para baixo (o chão).
- Decisão do dono (nov/2026): os personagens antigos dos jogadores saíram; sem imagem nova, silhueta neutra.
- Lugares para entrar fora do hotel ficam em `canada/casas.ts` (fábrica, lanchonete, casas das vítimas): `shell()` + `Kit`.
- `scatter` com milhares de árvores: use grade de vizinhança (hash por célula), não `out.some(...)` (O(n²)).

- Manchas brancas/pretas (3º relato, Greywater, Noite, câmera livre do alto): faces viradas para a LUA brancas, as do
  lado oposto pretas puras, paredes normais — em postes e galhos também (não é material nem telhado).
  `core/diag.ts` (F9) deixa o dono desligar uma coisa por vez. Correção aplicada (nov/2026, sem placa para
  confirmar): `isnan()` é removido pelo otimizador de várias placas (ANGLE/D3D) — a trava agora testa os BITS
  (`floatBitsToUint(x) & 0x7f800000u`), limita a 6e4 (half-float estoura em 65504 → infinito) e há um passe
  `limpaEntrada` ANTES do bloom (o bloom espalhava um pixel ruim em mancha). Nunca volte a usar `isnan`/`isinf`.
  Varredura: `?nan=1` pinta pixels inválidos; nos 5 mapas × 5 climas, swiftshader e llvmpipe deram zero.
- 4º relato (print do dono, Greywater, Noite, do alto): TUDO virado para cima branco puro (chão, telhados, copas),
  paredes e céu normais. Causa provável: a placa lê um nível pouco borrado do PMREM na luz difusa e a lua do HDRI
  (84°, ~90× o céu) estoura. Correção: o PMREM sai de uma cópia com `limitarBrilho` (cada pixel ≤ 3× a média do céu);
  o fundo visível continua o HDRI original. Se voltar, confirme com o F9 → "Reflexos do céu (HDRI)".
- Testar com driver "de verdade" sem GPU: `xvfb-run` + Playwright `headless: false` +
  `--use-gl=angle --use-angle=gl` + `LIBGL_ALWAYS_SOFTWARE=1` = Mesa llvmpipe (headless cai sempre no swiftshader).
- Noite: o HDRI `qwantani_night` vem claro quase como dia e com brilho de cidade no horizonte (≈7). Use `bg`/`env`
  baixos e `skyTint` (tinge céu, reflexos e névoa juntos) — sem isso a névoa azul não bate com o céu marrom.
- Recuperar imagens numa sessão nova (nov/2026): Greywater = `node tools/baixar-npcs.mjs https://pin.it/6FDe5jQ5t
  npcs-local/canada` + recorte (06/Émile tem fundo de foto: máscara por faixa de colunas + tira claros não-quentes +
  preenche buracos); Harlow = ler `assets/01..29-*` do link publicado de Harlow (Artifact read `paths`) e copiar
  como `npcs-local/NN.ext` (o Pinterest hoje só devolve 21). Jogadores 1–3 e criaturas 27/28 só com o PDF do dono.
- Offline (sem ws nem claude.ai) o `netLocal` grava posições/personagens no `localStorage` (`mapa3d:pos:<sala>`,
  `mapa3d:chars:<sala>`); o dono pediu (nov/2026) para o mapa lembrar onde deixou cada um. Cartazes de Greywater
  (`buildRetratos`) usam as fotos 21 (Jean), 3 (Margaret), 15 (William); as polaroids do 304 são desenhos (`photo`).
- Ao mandar o HTML offline, gere da branch que tem tudo (a `main` só tem Igreja e Campo).

## Greywater Falls — decisões do dono e como retomar (sessão de nov/2026)

- **Decisões do dono**: a história é em **1975** (ele começou com 1965 e corrigiu); o **hotel é a casa do William**
  (ele é o dono; a cidade inteira vai ao hotel/bar) e Margaret morreu na escada do **porão do hotel**; os agentes vão
  descobrindo o que acontece no hotel. Pediu lugares para ENTRAR (fábrica, lanchonete, casas…), personagens com as
  aparências da pasta dele, cartazes com eles, "bem imersivo", e terror explícito nas criaturas (foi ele quem mandou).
  Os personagens antigos dos jogadores saíram; os novos: Jogador 1 (de preto) e Jogadora 2 (ruiva) chegam de moto,
  Nancy de carro (os dois primeiros ainda sem nome definido).
- **Datas escolhidas por mim, não pelo dono** (ele perguntou "falei que dia era?" — não falou): quarta 19/11/1975 (chegada),
  ritual dos olhos na madrugada de 20/11 às 3h, Margaret morta em 26/12/1974, Eva 9/11, Moreau domingo 16/11,
  Kowalczyk 17/11. Se ele pedir outra data, mude TUDO junto (jornal, calendário do 304, cartão de ponto, livros do
  necrotério e da igreja, cartazes, pistas.ts e o dossiê).
- **Imagens locais (fora do git, repositório público)**: `node tools/baixar-npcs.mjs https://pin.it/6FDe5jQ5t
  npcs-local/canada`, reduzir para ~700 px de altura, `python3 -I tools/recorte.py … 6 40` e
  `python3 -I tools/limpar-recorte.py … --pe --entre-pernas` → `npcs-local/canada/cut/NN.png` (números em
  `canada/npcs.ts`; 13 precisou de TOL 4,5/28). Jogadores e criaturas vieram num PDF que o dono enviou
  (`pdfimages -png`): `npcs-local/jogador1..3.png` e `npcs-local/canada/cut/27.png` (Esfolado, fundo preto puro:
  inundar só pixels com max(rgb) < 14) e `28.png` (forma refeita: recorte.py 4/22 + `--chao-escuro`). Numa sessão
  nova essas imagens não existem: peça o PDF de novo ou que ele mande os arquivos (imagem colada no chat não vira arquivo).
- **Arquivo offline do dono**: `npm run build:single` e inserir `<script>window.MAPA_PADRAO="canada"</script>` depois do
  `</title>` → `Greywater-offline.html` (~52 MB com as imagens). É assim que ele joga (sem internet, dois monitores).
- **Pendências**: manchas brancas/pretas em faces viradas para a lua (esperando o dono dizer qual chave do F9 resolve);
  nomes dos jogadores 1 e 2; paredes VTT dos andares de cima do hotel usam as do térreo.

## Barud — Tormenta 20 (aprendido em `src/maps/barud/`, nov/2026)

- **Mapas por sistema**: campo `sis` no manifesto ('Ordem Paranormal' / 'Tormenta 20'); o menu Mapa agrupa. O dono
  vai criar mais mapas de Tormenta: os personagens das folhas de outras raças (`npcs-local/outros/`) são para eles.
- **Decisão do dono**: Barud focada em **minotauros** (Barud sob o Império de Tauron), com alguns humanos
  "capengas" (pobres, maltrapilhos). Criaturas pedidas: corais/acorrentadas, ocultas até a aparição.
- Estrutura: `common.ts` (planta, muralha poligonal `MURO`, `dentroMuro`, ruas, `Batch`, materiais, `telhado`,
  `coral`), `cidade.ts` (terreno com `ShapeGeometry` + buraco do canal, muralha/torres/portões, ruas recortadas pelo
  muro, casas geradas por estilo, lanternas, objetos), `edificios.ts` (casca genérica `construirPredio` com vãos
  reais, 2º andar com laje furada + escada + rampa invisível, paredes internas, telhado na camada; `mobiliar`),
  `mobilia.ts` (móveis em código no lote), `dados.ts` (fichas), `index.ts` (vistas automáticas por prédio, luzes).
- Casas ao longo da rua: a frente fica a 0,25 m da borda da rua e o teste de rua usa margem negativa — com a
  frente encostada, o teste de sobreposição rejeitava quase todas (a cidade nasceu vazia).
- Cor de vértice multiplica a textura: tintas em hex escuras (0x7a7268) somem à noite. Use tintas claras
  (0xb0a898…) e deixe o escuro para a luz. Luzes de interior realistas (velas 3 cd) não leem na mesa: Barud usa
  ×18 nas internas, 40 cd nas lanternas e uma `HemisphereLight` de luar própria (7 na Noite) no `onTime`.
- Luzes: pool de N PointLights movido para as luzes pedidas mais perto da câmera; a intensidade usa
  `fatorLuzes()` (core/sky) para respeitar "a luz caiu".
- Vistas internas: o padrão (canto da frente olhando o fundo) bate em parede interna; prédios com divisórias têm
  `vd` (vista local) no `PREDIOS`.
- Folhas de personagens do dono: `python3 -I tools/fatiar-folha.py folha.png saida pre COLS LINHAS` corta pela
  grade (a busca por blocos junta figuras vizinhas), tira o fundo branco e fica só com o maior pedaço; depois
  apague brancos puros fechados (> 246) com mais de 25 px (vão entre as pernas) sem tocar em roupas creme.

- **Mata dos Chifres** (`floresta.ts`): floresta em anel fora do muro (`mataMask`: borda com ruído a ~134 m,
  estradas livres), trilha por `CatmullRomCurve3` com `distTrilha` (amostras grossas a cada 3 m + grade fina de
  6 m). Metade do esforço de detalhe vai para onde a câmera anda: 1/3 das árvores e todo o sub-bosque/capim
  ficam a até 40 m da trilha; a faixa de 128–225 m é a mais vista da cidade (70% das outras árvores).
- Fita feita à mão (trilha): índices **anti-horários vistos de cima** `(a0, a0+1, b0)` — no outro sentido a face
  aponta para baixo e some (corte de face de trás) sem erro nenhum. Comentário `//` no meio de uma linha com `}`
  depois engole a chave (o tsc só acusa "'}' expected" no fim do arquivo).
- Árvores na noite de Barud: o luar (Hemisphere 7) clareia muito a cor de vértice — pinheiro com HSL L≈0.04 e
  árvore morta L≈0.07. Luzes da mata seguem a escala da cidade (vela 25, fogueira 30, tocha 28).
- Vistas da mata saem de `vistasMata()`; as câmeras baixas ficam com 7 m livres de árvores.

## Mapa regional grande — Sul de Arton (aprendido em `src/maps/arton/`, nov/2026)

- **Pedido do dono**: mapa de região em relevo (estilo mesa de wargame) a partir de uma imagem de referência (posições
  em "px da referência" → mundo por `W()`, 1 px = 0,5 unidade) e de um texto longo; sempre **detalhes por dentro**
  (tavernas, castelos, masmorras, cavernas), **teleporte** e **distâncias**; trilhas e pontes. Barud é o mapa
  detalhado da cidade (`LocalInfo.mapa = 'barud'` → botão "Abrir mapa: …"; a ficha `cidade` de Barud tem `mapa: 'arton'`).
- Arquivos: `geo.ts` (regiões, costa, ilhas, rios, lugares e a grade de alturas com cor por bioma e máscara
  rocha/neve), `terreno.ts` (malha, mar, rios/estradas/trilhas/pontes, fronteiras, moldura), `miniaturas.ts`
  (construção por povo + lugares únicos), `natureza.ts` (árvores instanciadas, manadas, navios, monstro), `simbolos.ts`
  (alfinetes, nomes, rotas com km), `interiores.ts` (12 cenas de bolso), `dados.ts` (fichas), `index.ts`.
- **Câmera**: o motor usa near 0,1 / far 700. Mapa grande ajusta pelo `mapHooks` (core/maps) — near 0,3, far 2600 e
  `ctl.maxPolarAngle` — e devolve o padrão nos outros mapas. Não mexa no `engine.ts` por causa de um mapa.
- **Sol**: fica a 80 unidades da origem; em mapa grande, no `onTime`, `sun.position.normalize().multiplyScalar(720)` e
  `M.shadowRadius` cobrindo o mapa (a câmera de sombra tem far = 4×raio). Sem isso, um terço do mapa não faz sombra.
- **Relevo**: grade própria com a triangulação conhecida e `Y(x,z)` igual aos triângulos (objetos não flutuam). Material
  `terrainMaterial` do núcleo + `vertexColors = true` + atributo `splat` (rocha, neve). Texturas aéreas da Poly Haven:
  `aerial_grass_rock` (campo), `marble_cliff_05` (penhasco cinza: montanha e calcário; a musgosa `aerial_rocks_02`
  deixava as Uivantes verdes), `snow_02`. A cor de vértice multiplica a textura: neve precisa de ~1,3.
- Montanhas "serrilhadas": `ridged()` com potência 1,3, anel junto à fronteira e bacias de tundra planas no centro;
  depois **aplainar povoados** na grade (média num raio e mistura suave; Giluk em terraços subindo para o norte).
- Rios: perfil sempre descendo (min do anterior) e o leito entalhado na grade; pontes onde estrada/trilha cruza rio
  (grade de vizinhança dos pontos do rio), e a estrada sobe para o tabuleiro da ponte.
- **Nomes**: sprites com `depthTest: false` e tamanho que acompanha a distância (legível de longe, discreto de perto);
  nomes de região somem de perto. Esconda-os dentro dos interiores (senão aparecem através do teto).
- **Interiores de bolso** debaixo da mesa (y = −150), porque `setTarget` dos personagens limita x/z a ±400. Lá dentro:
  sol desligado (tick), `maxPolarAngle` volta a 1,78 (com 1,42 o OrbitControls empurrava a câmera para cima do teto
  nas vistas compridas). Móveis de `barud/mobilia.ts`; peças das miniaturas por `comLote(lote, f)`.
- Ouro com metalness 0,9 fica preto sob céu nublado: metalness ~0,55 + um pouco de emissivo.
- `mergeGeometries` exige os mesmos atributos: triângulos feitos à mão precisam de `computeVertexNormals()`.
- `CanvasRenderingContext2D.roundRect` não existe em celulares antigos: desenhe com `arcTo`.
- Teleporte entre a mesa e uma cena de bolso: no tick, se `st.anim` atravessa a fronteira (y < −60), corte direto
  (copia posição/alvo e zera `st.anim`), senão a câmera voa pelo vazio debaixo da mesa.
- O relâmpago (core/imersao) mexe em `sun.intensity`: mapa que liga/desliga o sol deve mexer só na troca de estado,
  nunca a cada quadro.
- Desempenho medido (qualidade baixa, vista geral): 364 chamadas, 512 mil triângulos; dentro da taverna, 36 e 18 mil.
  Com a vida (dragoa, aves, viajantes, neve, chuva, nuvens, faróis): 429 chamadas, mesmos triângulos.
- **Relevo legível em qualquer clima**: grave um sombreado de mapa (luz fixa de noroeste), oclusão (altura menos a
  média num raio, via soma acumulada) e estratos na cor de vértice. Muito mais efeito que subir a resolução.
- Sombra de nuvens barata: `onBeforeCompile` encadeado (guarde o anterior e chame primeiro), escurecendo a cor no
  `emissivemap_fragment` com ruído que anda; mude o `customProgramCacheKey`. O atributo `uv` sempre existe no
  vertex shader do three (dá para fazer o rio correr com `uv.x` = comprimento da fita).
- Partículas, nuvens e sprites sem luz própria (neve, chuva, nuvens baixas) ficam brancos demais no anoitecer:
  passe um fator do céu (`p.bg`) pelo `onTime`.
- Animações: tudo por instâncias (aves, viajantes) ou só na GPU (neve, chuva, brasas: posição = função do tempo);
  a dragoa é um grupo com as asas em pivôs próprios (rotação no ombro). Viajantes andam pelas `ESTRADAS` com
  comprimento acumulado (ida e volta).
- Fontes web num canvas: carregue o CSS (link criado pelo próprio mapa), espere `document.fonts.load(...)` e
  **redesenhe** os canvases (nomes/moldura) quando chegarem; não bloqueie o carregamento do mapa.

### Cidades do mapa regional (`cidades-kit.ts` + `cidades.ts`, nov/2026)
- **Pedido do dono**: "faça as cidades com o cuidado de Barud, com detalhes dentro e não só casas jogadas". Cidade boa
  = **planta** (ruas que levam a algum lugar, bairros, praças) + **prédios com nome** + casas **viradas para a rua**.
  Espalhar casas num círculo parece um punhado de dados; nunca mais faça isso.
- Ordem que funciona: (1) muralha/paliçada com portões **onde as estradas cruzam o contorno** (`portoes(m)`);
  (2) reservar os marcos (`c.reservar`, `c.bloquear`) — castelo, templo, praça, arena; (3) registrar as ruas
  (`c.rua`: desenha a fita e guarda os segmentos); (4) `casasNaRua` (lotes dos dois lados, frente para a rua, teste de
  caixa orientada contra casas e ruas); (5) `preencher` os fundos de quarteirão alinhando com a rua mais perto.
- Contornos das cidades em `geo.ts` (`MUROS`, `dentroMuro`, `cidadeEm`): as estradas são **cortadas no portão**
  (`recortarNasCidades`, terreno.ts) e dentro a cidade desenha as próprias ruas calçadas; o chão dentro vira terra
  batida na cor do relevo; árvores (`natureza.ts`) e caravanas (`vida.ts`) respeitam o contorno; `ocupar()` marca
  lavouras e pomares para as árvores desviarem. O tremor das estradas é atenuado perto das cidades (`pertoDeMuro`),
  senão a estrada chega ao lado do portão. Para escolher o portão, ponha um ponto de passagem na estrada
  (Barud: Portão do Rei e Portão Leste, iguais ao mapa detalhado).
- Duas camadas: `BC` (grosso, com sombra) e `BD` (janelas, portas, ameias, barracas, lampiões, carroças) com
  `userData.cullDist` — somem de longe. Janelas/portas são **planos** (2 triângulos), não caixas. Telhados feitos à mão
  (duas ou quatro águas, 6 triângulos) com os oitões no material da parede.
- Ruas e praças: fitas/grades sobre o relevo, sem sombra, `polygonOffset` −5/−6 (acima das estradas, −4); pontes onde
  rua cruza rio saem sozinhas (`pontesDaRua`) e a rua sobe para o tabuleiro (`yRuaC`).
- Moinhos: uma `InstancedMesh` para todas as pás, girando no tick (1 chamada).
- **Alfinetes e rotas somem de perto** (alfa por distância no shader, `cameraPosition`): sem isso o alfinete gigante
  tapa a cidade quando o mestre aproxima. Alfinete sem sombra (o shader da sombra não sabe do alfa).
- Telhado de neve branco puro vira "lençol": tinta azulada, inclinação menor e cumeeira de tronco escura.
- Custo medido (qualidade baixa, vista geral): 498 chamadas e 614 mil triângulos (antes 429 / 516 mil).
- Detalhe barato que mais muda a leitura das casas: **moldura** atrás da janela e da porta (plano 2 mm atrás),
  degrau, floreira e **cumeeira escura**. Taverna = placa pendurada (textura de canvas compartilhada) + lampião + bancos.
- `geo()` do kit respeita `isUVd` (texturas de canvas precisam da UV própria; `boxUV` estragaria).

### Interiores mais ricos (`interiores.ts`, extras por cena)
- Cada cena tem um "extra" (`ancoraMais`, `masmorraMais`…) com peças de decoração reutilizáveis: `acabamento`
  (lambri/rodapé/cornija/pilastras), `arandela`, `penduricalhos`, `comida`, `escudo`, `trofeu`, `teia` (canvas),
  `feixe` (plano aditivo com degradê, cruzado), `vitral` (canvas), `poca`, `musgo`, `corrente`, `ossada`, `gaiola`,
  `arcoPedra` + `abobada` (meio cilindro com as faces viradas para dentro), `nevoaChao`.
- Abóbada precisa ficar **abaixo do teto plano** da `sala` (senão o teto a esconde). Meio cilindro em z:
  `CylinderGeometry(r, r, D, n, 1, true, π/2, π)` + `rotateX(π/2)` e inverter a ordem dos índices.
- Poça com envMap fica branca no swiftshader: cor quase preta, `envMapIntensity` 0,2, opacidade 0,6.
- Feixes de luz fortes viram "sabres de luz": cor escura (≈0x384050) e largura ~0,5.

## Desempenho para o mestre (core/desempenho.ts → `economia`, nov/2026)

- Pedido do dono: "o PC não travar tanto enquanto mestro". O laço (`R.setAnimationLoop`) roda na frequência do
  monitor; `desenharQuadro(ts, {jogadores, tvAberta, ocupado})` pula quadros para o limite escolhido (agenda com
  `proximo += 1000/qps`, que dá a média certa em 144 Hz). Regras: limite 30/60/livre; modo leve → 30; janela do
  mestre com a TV ligada (`imersao.temJogadores`) → 24; 20 s sem toque/tecla/mouse → 10 (nunca durante transição de
  câmera, cinema ou caminhar). Na janela dos jogadores só vale o limite.
- `post.economia(true)`: sem N8AO/DOF, SMAA baixo, sombra a cada 8 quadros, pixel ratio ≤ 1,25 — sem recarregar.
- A resolução automática compara com o limite (a 30/s de propósito não pode ser "lento") e não mede quando está
  devagar de propósito (< 20/s).
- `loadMap` faz `R.compileAsync(S, cam)` (com tempo máximo): só compila o que está visível — por isso o Sul de Arton
  deixa as cenas de bolso visíveis no carregamento e esconde no 1º quadro.
- Teste: `window.__economia` mostra `qps`, `alvo` e `motivo` (o check espera 23 s parado e confere ~10/s).

## Erros que já custaram tempo (não repita)

- **Modelos da Poly Haven são pesados** (árvores 1–4 M faces). Sempre rode `tools/arvores.sh`
  (árvores, com LOD1) e `tools/orcamento.sh` (vegetação/props) e confira com `node tools/contar-tris.mjs`.
  Orçamento: árvore ≤ 40k, arbusto ≤ 5k, grama ≤ 1k, prop ≤ 15k triângulos.
- Ao importar glTF no Blender use `merge_vertices=True`; decime por material separado, nunca com grupo de vértices.
- Meshopt quantiza posições: **desquantize antes de transformar/juntar** (já feito em `core/models.ts`).
- Material com nome `glass` fica transparente; não converta todo material transparente em recorte alfa.
  Regra de lâmpada acesa só para nomes `_lamp`/`bulb`, senão o poste inteiro acende.
- `ctl.maxPolarAngle` baixo empurra câmeras internas para cima — vistas internas na altura humana (~1,7 m).
- N8AO `halfRes` quebra com three r187 — mantenha `aoHalf: false`.
- Coletor de flores (`Flowers`) usa coordenadas do **mundo**, não do grupo.
- Capturas: não edite `src/` enquanto elas rodam (o script já usa build próprio); os personagens ficam
  escondidos nas vistas fixas.
- `fetch` do Node só passa pelo proxy com `NODE_USE_ENV_PROXY=1` (já no `npm run assets`).
- Hospedagem no claude.ai recusa `.glb`/`.hdr`: use `npm run build:leve` (empacota como `.js`).
- Rede: Poly Haven/ambientCG/Blender precisam estar liberados no ambiente (ambiente "3d"). Se a sessão
  começou no "Default", use `switch_environment` para o "3d" (só rede; nada se perde).
- Blender não vem instalado: baixe `blender-4.2.3-linux-x64.tar.xz` de download.blender.org para o
  scratchpad e rode com `BLENDER=<caminho>/blender tools/orcamento.sh` (ou o script direto).
- `weather()` precisa ser aplicado **depois** de `material.clone()` (o clone não copia `onBeforeCompile`).
  Escorridos (`streaks`) acima de ~0.15 em reboco parecem tábuas de madeira; use 0.1.
- `worn_plaster_wall` parece camuflagem de longe — evite em paredes grandes.
- `wallGeo` com `ry = ±π/2`: o eixo x local vira ∓z; confira a posição dos vãos nos dois lados (use o
  mesmo sinal nas duas paredes laterais, não espelhe).
- Capturas de vistas próprias do mapa: `npm run capturas -- rotulo --map=<id> --views=Praça,Cantina`.

## Desempenho (aprendido na otimização da igreja: 12,6 M → 4,7 M triângulos por quadro)

Meça antes de mexer: `node tools/medir.mjs --q=media` (chamadas, triângulos, e o custo por grupo).
- **Vidro com `transmission` (glTF da Poly Haven) faz o three renderizar a cena inteira 2×.** Já é
  desligado em `core/models.ts`; nunca use `MeshPhysicalMaterial.transmission` na cena.
- Peças estáticas feitas em código: `mergeStatic(raiz, { bucket })` no fim do `build` (`core/merge.ts`).
  As originais continuam valendo para colisão. Separe por camada e por altura (VTT esconde o "alto").
  Ela ignora modelos .glb (geometria quantizada) — juntá-los sem desquantizar desloca as peças.
- Espalhados (`instance`/`instanceVariants`): use `tile` (blocos para o corte por tela) e `cullDist`
  (some além da névoa). Gramado: `grassField` já faz blocos + versão simples ao longe.
- Interior: esconda o exterior quando a câmera está dentro e a porta fora do campo de visão
  (`updExterior` em `maps/igreja/index.ts`; o grupo leva `userData.autoHide`).
- Sombra do sol é recalculada a cada 2–4 quadros (`post.ts`); após mudar algo estático chame
  `R.shadowMap.needsUpdate = true`. Detalhes pequenos (flores) e floresta fora da cerca: sem sombra.
- Auréolas de luz: `halo()` já agrupa tudo num único objeto de pontos — não crie `Sprite` por luz.
- Floresta: LOD por distância (`_lod1`, `_lod2`); só a qualidade Alta usa o modelo completo perto.
- Resolução adaptativa: **uma só**, em `core/desempenho.ts` (mede o FPS em janelas de 2 s, cai até 50%,
  sobe com folga; `?auto=0` desliga; `?fps=1` mostra "res %"). Não crie outra no `post.ts`.
- Névoa: no shader, use a transposta da `viewMatrix`, nunca `inverse()` por vértice.

## Interface pronta (use, não reinvente)

- Dock e menus: `core/menu.ts` (`menu(botão, painel, preencher)`, `lista(...)`) + `main.ts`. Ids usados nos
  testes: `bmo`/`blv` (Órbita/Livre), `mcine` (Cinema), `mv`/`mn`/`mm` com os spans `bv`/`bn`/`bmap` (valor
  atual), `mc` (Personagens), `mx` (Mais), `blimpa` (tela limpa), `bshow` (voltar).
- Botão novo no dock → confira larguras 390, 800 e 1024 px. A barra cresceu: rótulos somem abaixo de 1520 px e `.dock` tem `max-width:calc(100vw - 12px)` (o dono viu a barra cortada num monitor de 1366 px). O botão da TV nunca se esconde (verde = ligada). Quebras: ≤760 px duas linhas (vista/clima/mapa
  embaixo), 761–1000 px só ícones (nome no `title`).
- Câmera livre (`core/walk.ts`, modo `livre`): WASD, Q/E, Shift, roda = velocidade, G = fantasma.
- **Câmera de cinema** (`core/cinema.ts`): `rodar(tomada, 'suave'|'corte'|'susto', {enviar, cap, rev})`;
  `tomadaPara(hit)` monta a tomada de um clique (alvo a 1,4 m do chão, câmera a ~5,5 m do lado de quem olha,
  ângulo baixo; clique em parede vale o chão 1 m à frente; recua se houver construção no caminho).
  Tomadas gravadas ficam no `localStorage` por mapa (com cópia em memória se o armazenamento falhar).
  **As vistas do mapa aparecem como tomadas** — dê vistas boas, com `fov`. O clique usa `M.walk` + `M.solid()`
  (raycast barato): mapa novo precisa dos dois bem feitos.
- Rede do cinema: mensagem `cine` (WebSocket e banco do claude.ai); o servidor repassa sem gravar e guarda a
  cena em andamento por 2 min para quem entra/reconecta. Cada aba tem um id (`de`) para ignorar o próprio eco.
- Tela limpa (H): `body.limpa` + `body.nu`; atalhos P (ponto do cinema), 1–9 (tomadas), Esc. Cursor some
  parado. Elemento novo que não deve aparecer na transmissão → acrescente na regra `.nu ...{display:none}`.
- Personagem que salta > 8 m pela rede aparece direto (não desliza pelo mapa) — usado no "Revelar".
- **Dois monitores** (`core/espelho.ts`): o dono usa um monitor com a janela do mestre e outro com a janela
  dos jogadores (`?tela=jogadores` ou Mais → "Esta janela é a tela dos jogadores"). Ligação por
  `BroadcastChannel('mapa3d:'+sala)`: a do mestre manda um quadro por mudança de câmera (posição, quaternion,
  fov, foco e as sobreposições do cinema lidas do DOM) + mapa/clima/personagens; a dos jogadores só aplica
  (suaviza com `1-exp(-dt*18)`) e ignora o cinema da rede (já vem pela câmera). Ao abrir, ela manda `oi` e
  recebe o `estado`. Recurso novo que muda a cena → mande também pelo espelho, senão o 2º monitor não vê.
- **Partição do navegador**: o Chrome só liga janelas (BroadcastChannel/armazenamento) sob a mesma página de
  cima. No claude.ai o mapa é um quadro dentro da página do claude.ai: funciona abrir o **mesmo link** noutra
  janela; `window.open` da URL interna cria uma janela que **não liga**. No teste, as duas janelas são
  quadros da mesma página por isso.
- **Imersão** (`core/imersao.ts`, `core/som.ts`): congelar (K), escurecer (B), lanterna (L), relâmpago (R), som.
  O estado vai no quadro do espelho; efeitos pontuais (`fx`) vão como evento `{k:'fx'}`. Ideias novas de
  imersão entram aqui e precisam aparecer na janela dos jogadores.
- **Painel Mestre** (`main.ts` → `initMestreUi`): cenas (`core/cenas.ts`, `localStorage` por mapa + memória),
  a luz caiu (`setApagao` → pisca com `aplicarLuzes(k, true)` = só intensidades; no fim `forcarLuzes` chama o
  `onTime` do mapa **uma vez** — o da igreja recaptura a sonda, caro), névoa (multiplica a densidade que outro
  código definiu: detecta mudança de base a cada quadro), sons do mestre, imagens (`core/mostrar.ts`).
- Ao animar luzes no `M.tick` do mapa, só mexa se `intensity > 0` (senão desfaz "a luz caiu").
- **Som no lugar**: `M.sons = [{x,y,z,tipo:'velas'|'sino'|'porta'}]` no mapa; o ouvinte é a câmera
  (`som.ouvinte`). Mapa novo: ponha velas/sinos/portas marcantes ali.
- **Personagem oculto** (`t.oc`, campo `o` na posição; servidor guarda): some se `st.jogadores || CFG.ro`;
  o mestre vê com opacidade 0,4 e sem base.
- Teclas já usadas (não reaproveite): WASD Q E C G Shift Espaço (livre), V (caminhar), H, P, 1–9, K, B, L, R,
  O, N, I, . , PageUp/PageDown, Esc; na janela dos jogadores F e H.
- Som: Web Audio gerado na hora (ruído filtrado = vento/trovão; osciladores graves = zumbido). O navegador só
  libera áudio após um gesto **naquela janela** (`som.desbloquear()` em pointerdown/keydown). Padrão: som só na
  janela dos jogadores, para não tocar dobrado no PC do mestre.
- Luz nova na cena (lanterna) recompila todos os materiais na primeira vez: crie-a no início (intensidade 0) ou,
  na qualidade Baixa, só quando usada. Efeito que mexe em `hemi`/`sun`/`S.environmentIntensity` (relâmpago)
  guarda os valores do início e devolve no fim; se o clima mudar no meio, aborta sem devolver.
- A rede tem um ramal local: `NET.*` chama a implementação (servidor/banco/local) e depois `tap.*` (espelho).
  `netDb`/`netWs` trocam `impl.*`, nunca `NET.*`.

## Verificar sem placa de vídeo (Playwright + swiftshader)

- Roda a 1–2 fps: **nunca espere tempo fixo**; espere estado (`__capReady`, `__freeState()`,
  `__cineState()`, `__walkState()`), com `waitForFunction(..., { polling: 500 })`.
- Prints da interface: `?capture=1` (laço parado) e `__cap.frames(1)` antes do `screenshot`. Com o laço
  normal o print sai atrasado (menu aberto que não aparece) e 1280×720 estoura o tempo; use ≤ 1024×576.
- Script fora do repositório (scratchpad): importe o vite por caminho absoluto
  (`/home/user/MAPAS/node_modules/vite/dist/node/index.js`) e o Playwright global (`npm root -g`).
- Versão leve: `preview({ mode: 'lite', build: { outDir: 'dist-lite' } })` e abrir `?map=<id>&capture=1`.
- Teste de sala: suba `server/servidor-sync.mjs` com `PORT`/`DATA_DIR` temporários e abra duas páginas com
  `&ws=ws://127.0.0.1:PORT&room=x` (uma com `&ro=1`). Duas páginas em swiftshader saturam a CPU e o
  batimento de 30 s do servidor pode derrubar uma conexão — repita antes de concluir que é defeito.
- CSS: `.pop>button` (fundo transparente) ganha de `button.pri`; o botão principal some (texto escuro no
  escuro). Use `.pop>button.pri`.

## Publicar no claude.ai (links do dono)

- Links atuais (atualize-os em vez de criar outros; quem já recebeu continua usando):
  Igreja do Casamento `https://claude.ai/artifact/65XS5FnzDBvfneK5AnFXUh` ·
  San Judas de las Ánimas `https://claude.ai/artifact/55cVSvDE5dfVtg2Km2iR9K` ·
  Harlow, Texas `https://claude.ai/artifact/HHBUeQ8noXrMfhqAK6Q1PB` ·
  Greywater Falls `https://claude.ai/artifact/19Taut7URvhL67RnSA4MHg` (`canada.html`, `MAPA_PADRAO="canada"`) ·
  Barud (Tormenta 20) `https://claude.ai/artifact/UpjK4X8KJrYW5LefuSuPUF` (`barud.html`, `MAPA_PADRAO="barud"`) ·
  Sul de Arton `https://claude.ai/artifact/Dzxp7GFmcpc2X9SXJP2VYZ` (`arton.html`, `MAPA_PADRAO="arton"`; criado em 2 partes).
  O build leve passou de 255 arquivos: publique o link novo em duas partes (mesmo `file_path`); nos links que já
  existem mande só os arquivos alterados (código .js/.css e imagens novas) — texturas/modelos têm o mesmo nome. Os três têm todos os mapas (Greywater Falls
  entrou depois; para um link próprio dele, crie `canada.html` com `MAPA_PADRAO="canada"`).
- Passos: `npm run build:leve` → copie `dist-lite/` para o scratchpad (`pub/`) → crie `igreja.html` (troca o
  `<title>`) e `mexico.html` (`<title>` + `<script>window.MAPA_PADRAO="mexico"</script>`) a partir do
  `index.html` (e `texas.html` com `MAPA_PADRAO="texas"`) → Artifact `publish` com `url` do link, `file_path` = a página, `root` = `pub/`,
  `files` = lista de `{path:"assets/<arquivo>"}` (~170 arquivos, ~34 MB; cabe no limite de 255 por envio).
- Antes de publicar: confira os dois mapas na versão leve sem erros de página e rode o teste de funções.
- Os links são privados: para os jogadores abrirem, o dono compartilha pelo menu da página.
- **Imagens locais**: se a versão no ar tem moradores de Greywater e a sua sessão não tem `npcs-local/`, NÃO publique
  (o build sairia sem as imagens). Se a versão no ar já tem todas as funções (confira os ids no HTML devolvido pela
  recusa: `bjog`, `mcine`, `mdir`, `dpistas`…), não há o que republicar — só registre no repositório.
- Outra sessão pode ter publicado nos mesmos links: o publish é recusado e devolve a versão no ar. Se o seu
  build vem da branch que já juntou tudo (confira os ids do HTML: `bjog`, `blimpa`, `mcine`…), publique de novo
  igual; senão junte a branch primeiro. Publique os três links com o mesmo build (todos têm todos os mapas).

## Achar assets novos (só se o catálogo não tiver)

- API Poly Haven (CC0): `https://api.polyhaven.com/assets?t=textures|hdris|models` e
  `https://api.polyhaven.com/files/<id>`; miniaturas em `https://cdn.polyhaven.com/asset_img/thumbs/<id>.png?width=200`.
  Monte uma folha de miniaturas e **olhe** antes de escolher.
- Acrescente o id em `tools/assets.json` e rode `npm run assets` (baixa, converte para WebP/Meshopt e
  atualiza `CREDITS.md`). Pesado? `tools/orcamento.sh` / `tools/arvores.sh`. Confira com
  `node tools/ver-modelo.mjs src/assets/models/<id>.glb`.
- Nunca compre nada sem perguntar. Sketchfab/Fab só com licença conferida e crédito em `CREDITS.md`.
- O que não existe em CC0 bom (igreja, bancos de igreja, órgão, carros antigos): modele em código.
