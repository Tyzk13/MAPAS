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
