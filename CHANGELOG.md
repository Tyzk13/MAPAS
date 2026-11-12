# Changelog

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
