---
name: mapa-3d
description: Criar ou melhorar um mapa 3D de RPG de mesa (estilo terror realista, Ordem Paranormal) neste projeto — igreja, cidade, casa, hospital, floresta — e a interface em volta (câmera livre, câmera de cinema, tela limpa para transmitir, sala com vários jogadores). Use sempre que o usuário pedir um mapa novo, mudar um mapa ou a interface, trocar materiais/modelos/céu, deixar a cena "com cara de jogo" ou publicar/atualizar os links no claude.ai. Traz o fluxo, o catálogo de assets CC0 já testados, os erros a evitar e como verificar sem placa de vídeo.
---

# Mapa 3D (estilo terror realista)

Projeto: Vite + TypeScript + three.js r187. Cada mapa é um módulo em `src/maps/` registrado em
`src/maps/manifest.ts`. O núcleo (`src/core/`) já faz céu, luz, pós-processamento, personagens, câmera livre,
câmera de cinema, tela limpa, rede, exportação VTT e resolução adaptativa — **não reescreva o núcleo**.
Leia `docs/NOVO-MAPA.md` antes de começar.

**Tudo o que aprender (erro, truque, decisão do dono) vai para esta skill no mesmo commit.**

## Antes de começar

- `git fetch` e `git branch -a`: outras sessões deixam trabalho em branches não juntadas (já aconteceu:
  `mapa-igreja` tinha a otimização de desempenho; `ccr-a7aaff16-e40c5h`, o mapa do México e o Texas;
  `ccr-e87ec97a-p4jbyp`, Painel Mestre, cinema e imersão — "pega as funções que o repositório contém" =
  juntar essas branches). Se o pedido
  envolve essas coisas, junte antes. Ao juntar, procure recursos **duplicados** (duas resoluções adaptativas
  se somavam e derrubavam a imagem para ~30%) e mantenha todas as seções do `CHANGELOG.md`.
- Decisões do dono já tomadas: modo **Caminhar saiu da interface** (a câmera livre cobre; o código ficou só
  para a captura "terceira" e `?walk=1`); a tela é **transmitida para os jogadores** — nada de informação de
  mestre aparecendo na cena (use a tela limpa).

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
- Botão novo no dock → confira larguras 390, 800 e 1024 px. Quebras: ≤760 px duas linhas (vista/clima/mapa
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
  Harlow, Texas `https://claude.ai/artifact/HHBUeQ8noXrMfhqAK6Q1PB`. Os três têm todos os mapas.
- Passos: `npm run build:leve` → copie `dist-lite/` para o scratchpad (`pub/`) → crie `igreja.html` (troca o
  `<title>`) e `mexico.html` (`<title>` + `<script>window.MAPA_PADRAO="mexico"</script>`) a partir do
  `index.html` (e `texas.html` com `MAPA_PADRAO="texas"`) → Artifact `publish` com `url` do link, `file_path` = a página, `root` = `pub/`,
  `files` = lista de `{path:"assets/<arquivo>"}` (~170 arquivos, ~34 MB; cabe no limite de 255 por envio).
- Antes de publicar: confira os dois mapas na versão leve sem erros de página e rode o teste de funções.
- Os links são privados: para os jogadores abrirem, o dono compartilha pelo menu da página.
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
