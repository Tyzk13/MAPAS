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
- Rede: Poly Haven/ambientCG/Blender precisam estar liberados no ambiente (ambiente "3d").

## Desempenho (aprendido na otimização da igreja: 12,6 M → 4,7 M triângulos por quadro)

Meça antes de mexer: `node tools/medir.mjs --q=media` (chamadas, triângulos, e o custo por grupo).
- **Vidro com `transmission` (glTF da Poly Haven) faz o three renderizar a cena inteira 2×.** Já é
  desligado em `core/models.ts`; nunca use `MeshPhysicalMaterial.transmission` na cena.
- Peças estáticas feitas em código: `mergeStatic(raiz, { bucket })` no fim do `build` (`core/merge.ts`).
  As originais continuam valendo para colisão. Separe por camada e por altura (VTT esconde o "alto").
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
