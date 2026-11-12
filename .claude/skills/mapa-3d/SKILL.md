---
name: mapa-3d
description: Criar ou melhorar um mapa 3D de RPG de mesa (estilo terror realista, Ordem Paranormal) neste projeto — igreja, casa, hospital, floresta, etc. Use sempre que o usuário pedir um mapa novo, mudar um mapa existente, trocar materiais/modelos/céu, ou deixar a cena "com cara de jogo". Traz o fluxo, o catálogo de assets CC0 já testados e os erros a evitar.
---

# Mapa 3D (estilo terror realista)

Projeto: Vite + TypeScript + three.js r187. Cada mapa é um módulo em `src/maps/` registrado em
`src/maps/manifest.ts`. O núcleo (`src/core/`) já faz céu, luz, pós-processamento, personagens, caminhar,
rede, exportação VTT — **não reescreva o núcleo**. Leia `docs/NOVO-MAPA.md` antes de começar.

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
5. **Testes**: `node tools/testar-funcoes.mjs` (precisa passar) e `node tools/testar-vtt.mjs`.
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

## Medir o peso (faça antes de publicar)

- Script de medição: abrir `?map=<id>&q=baixa&fps=1` no Playwright e ler `#fps` (draws e triângulos;
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
- `testar-funcoes.mjs`: o item "caminhar move o personagem" falha no swiftshader por lentidão (já
  falhava antes); os demais precisam passar.
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
- Resolução adaptativa automática (cai até 60% se os quadros passarem de ~21 ms).
- Névoa: no shader, use a transposta da `viewMatrix`, nunca `inverse()` por vértice.

## Achar assets novos (só se o catálogo não tiver)

- API Poly Haven (CC0): `https://api.polyhaven.com/assets?t=textures|hdris|models` e
  `https://api.polyhaven.com/files/<id>`; miniaturas em `https://cdn.polyhaven.com/asset_img/thumbs/<id>.png?width=200`.
  Monte uma folha de miniaturas e **olhe** antes de escolher.
- Acrescente o id em `tools/assets.json` e rode `npm run assets` (baixa, converte para WebP/Meshopt e
  atualiza `CREDITS.md`). Pesado? `tools/orcamento.sh` / `tools/arvores.sh`. Confira com
  `node tools/ver-modelo.mjs src/assets/models/<id>.glb`.
- Nunca compre nada sem perguntar. Sketchfab/Fab só com licença conferida e crédito em `CREDITS.md`.
- O que não existe em CC0 bom (igreja, bancos de igreja, órgão, carros antigos): modele em código.
