# Mapa do código

Gerado por `scripts/mapa_do_codigo.py` — rode de novo depois de criar, mover ou mudar arquivos.
Para ler uma função: Read com `offset` = linha e `limit` ≈ 40–80. Não leia arquivos inteiros sem necessidade.

## Pastas pesadas (binários: imagens, modelos, áudio, vídeo) — não abrir

| Pasta | Arquivos | Tamanho |
|---|---|---|
| `capturas/` | 323 | 95.0 MB |
| `src/assets/` | 188 | 90.6 MB |
| `referencias/` | 5 | 2.4 MB |

## Linhas GIGANTES (dados embutidos) — grep sempre com `| cut -c1-200`

| Arquivo | Linha | Tamanho | Início |
|---|---|---|---|
| `legacy/igreja-3d-site.html` | 74 | 823 KB | const IMGS={"dante": "data:image/png;bas |

## Arquivos de texto/código

| Arquivo | Linhas | Tamanho |
|---|---|---|
| `index.html` | 150 | 14 KB |
| `legacy/igreja-3d-site.html` | 620 | 899 KB |
| `legacy/servidor-sync.js` | 26 | 1 KB |
| `scripts/mapa_do_codigo.py` | 78 | 5 KB |
| `server/servidor-sync.mjs` | 141 | 8 KB |
| `server/testar.mjs` | 83 | 5 KB |
| `src/core/anim.ts` | 124 | 7 KB |
| `src/core/aparicao.ts` | 68 | 4 KB |
| `src/core/binario.ts` | 21 | 1 KB |
| `src/core/cenas.ts` | 26 | 1 KB |
| `src/core/cinema.ts` | 246 | 12 KB |
| `src/core/config.ts` | 34 | 1 KB |
| `src/core/cull.ts` | 25 | 1 KB |
| `src/core/desempenho.ts` | 38 | 2 KB |
| `src/core/diag.ts` | 54 | 4 KB |
| `src/core/docs.ts` | 140 | 9 KB |
| `src/core/engine.ts` | 78 | 3 KB |
| `src/core/espelho.ts` | 235 | 13 KB |
| `src/core/glbmap.ts` | 49 | 6 KB |
| `src/core/grass.ts` | 79 | 4 KB |
| `src/core/heightfog.ts` | 44 | 2 KB |
| `src/core/imersao.ts` | 139 | 7 KB |
| `src/core/importer.ts` | 44 | 2 KB |
| `src/core/kit.ts` | 160 | 11 KB |
| `src/core/loading.ts` | 39 | 2 KB |
| `src/core/locais.ts` | 165 | 14 KB |
| `src/core/maps.ts` | 76 | 3 KB |
| `src/core/menu.ts` | 60 | 3 KB |
| `src/core/merge.ts` | 52 | 3 KB |
| `src/core/models.ts` | 177 | 9 KB |
| `src/core/mostrar.ts` | 51 | 2 KB |
| `src/core/net.ts` | 117 | 6 KB |
| `src/core/pbr.ts` | 81 | 3 KB |
| `src/core/post.ts` | 139 | 7 KB |
| `src/core/probe.ts` | 53 | 2 KB |
| `src/core/procedural.ts` | 138 | 8 KB |
| `src/core/sky.ts` | 184 | 11 KB |
| `src/core/som.ts` | 220 | 14 KB |
| `src/core/state.ts` | 26 | 1 KB |
| `src/core/terrain.ts` | 99 | 5 KB |
| `src/core/tokens.ts` | 235 | 14 KB |
| `src/core/types.ts` | 83 | 4 KB |
| `src/core/vtt.ts` | 105 | 7 KB |
| `src/core/walk.ts` | 229 | 12 KB |
| `src/core/weathering.ts` | 46 | 2 KB |
| `src/main.ts` | 512 | 32 KB |
| `src/maps/arton/dados.ts` | 103 | 18 KB |
| `src/maps/arton/geo.ts` | 385 | 31 KB |
| `src/maps/arton/index.ts` | 183 | 15 KB |
| `src/maps/arton/interiores.ts` | 297 | 36 KB |
| `src/maps/arton/miniaturas.ts` | 555 | 53 KB |
| `src/maps/arton/natureza.ts` | 182 | 23 KB |
| `src/maps/arton/simbolos.ts` | 92 | 8 KB |
| `src/maps/arton/terreno.ts` | 300 | 27 KB |
| `src/maps/barud/cidade.ts` | 413 | 30 KB |
| `src/maps/barud/common.ts` | 149 | 9 KB |
| `src/maps/barud/dados.ts` | 364 | 50 KB |
| `src/maps/barud/edificios.ts` | 415 | 37 KB |
| `src/maps/barud/floresta.ts` | 392 | 30 KB |
| `src/maps/barud/index.ts` | 287 | 22 KB |
| `src/maps/barud/mobilia.ts` | 216 | 14 KB |
| `src/maps/campo.ts` | 53 | 4 KB |
| `src/maps/canada/casas.ts` | 217 | 27 KB |
| `src/maps/canada/chegada.ts` | 86 | 6 KB |
| `src/maps/canada/common.ts` | 36 | 2 KB |
| `src/maps/canada/hotel.ts` | 402 | 47 KB |
| `src/maps/canada/index.ts` | 253 | 21 KB |
| `src/maps/canada/interior.ts` | 182 | 16 KB |
| `src/maps/canada/landmarks.ts` | 197 | 21 KB |
| `src/maps/canada/morgue.ts` | 151 | 16 KB |
| `src/maps/canada/nature.ts` | 127 | 10 KB |
| `src/maps/canada/npcs.ts` | 116 | 12 KB |
| `src/maps/canada/pistas.ts` | 116 | 31 KB |
| `src/maps/igreja/building.ts` | 232 | 16 KB |
| `src/maps/igreja/common.ts` | 105 | 7 KB |
| `src/maps/igreja/grounds.ts` | 369 | 30 KB |
| `src/maps/igreja/index.ts` | 162 | 9 KB |
| `src/maps/igreja/interior.ts` | 246 | 18 KB |
| `src/maps/manifest.ts` | 15 | 1 KB |
| `src/maps/mexico/common.ts` | 177 | 11 KB |
| `src/maps/mexico/index.ts` | 176 | 10 KB |
| `src/maps/mexico/landmarks.ts` | 503 | 46 KB |
| `src/maps/mexico/nature.ts` | 238 | 16 KB |
| `src/maps/mexico/town.ts` | 223 | 13 KB |
| `src/maps/texas/buildings.ts` | 191 | 14 KB |
| `src/maps/texas/common.ts` | 146 | 10 KB |
| `src/maps/texas/forest.ts` | 232 | 24 KB |
| `src/maps/texas/hotel.ts` | 169 | 21 KB |
| `src/maps/texas/index.ts` | 281 | 21 KB |
| `src/maps/texas/landmarks.ts` | 480 | 50 KB |
| `src/maps/texas/mystery.ts` | 124 | 13 KB |
| `src/maps/texas/nature.ts` | 111 | 8 KB |
| `src/maps/texas/npcs.ts` | 104 | 9 KB |
| `src/maps/texas/onibus.ts` | 88 | 6 KB |
| `src/maps/texas/pistas.ts` | 111 | 28 KB |
| `src/maps/texas/police.ts` | 442 | 58 KB |
| `src/style.css` | 297 | 24 KB |
| `src/vite-env.d.ts` | 2 | 0 KB |
| `tools/_grid.mjs` | 7 | 1 KB |
| `tools/arvores.sh` | 32 | 2 KB |
| `tools/assets-leves.mjs` | 21 | 1 KB |
| `tools/baixar-assets.mjs` | 93 | 5 KB |
| `tools/baixar-npcs.mjs` | 22 | 1 KB |
| `tools/blender/desbastar_arvore.py` | 151 | 7 KB |
| `tools/capturas.mjs` | 113 | 6 KB |
| `tools/contar-tris.mjs` | 15 | 1 KB |
| `tools/diag-climas.mjs` | 45 | 3 KB |
| `tools/fatiar-folha.py` | 84 | 4 KB |
| `tools/limpar-recorte.py` | 52 | 2 KB |
| `tools/medir-peso.mjs` | 15 | 1 KB |
| `tools/medir.mjs` | 48 | 5 KB |
| `tools/orcamento.sh` | 63 | 2 KB |
| `tools/recorte.py` | 35 | 2 KB |
| `tools/testar-funcoes.mjs` | 110 | 10 KB |
| `tools/testar-lupa.mjs` | 52 | 5 KB |
| `tools/testar-vtt.mjs` | 41 | 4 KB |
| `tools/ver-modelo.mjs` | 25 | 2 KB |
| `tools/visualizador.html` | 32 | 2 KB |
| `vite.config.ts` | 39 | 2 KB |

Outros textos: `.claude/skills/mapa-3d/CATALOGO.md`, `.claude/skills/mapa-3d/SKILL.md`, `.github/workflows/ci.yml`, `CHANGELOG.md`, `CLAUDE.md`, `CREDITS.md`, `README.md`, `capturas/README.md`, `docs/BRIEFING.md`, `docs/GUIA-DO-MESTRE.md`, `docs/HISTORICO.md`, `docs/HOSPEDAGEM.md`, `docs/NOVO-MAPA.md`, `docs/PROMPT-NOVO-MAPA.md`, `docs/VTT.md`, `docs/casos/greywater-caso-ashdown.md`, `docs/casos/harlow-caso-whitlock.md`, `package.json`, `server/package-lock.json`, `server/package.json`, `tools/assets.json`, `tsconfig.json`

## Funções, classes e exports (linha)

### `legacy/igreja-3d-site.html`
`fit` 82 · `mat` 87 · `box` 88 · `cyl` 89 · `jit` 90 · `tex` 91 · `cl` 92 · `sm` 106 · `glass` 107 · `arch` 111 · `inst` 112 · `updEnv` 118 · `setTime` 132 · `buildIgreja` 139 · `haloT` 141 · `halo` 142 · `flat` 149 · `step` 177 · `pewM` 203 · `lace` 246 · `veil` 248 · `roofG` 280 · `car` 282 · `bench` 290 · `dead` 300 · `aoT` 312 · `mistT` 321 · `buildCampo` 352 · `K` 381 · `sizeT` 384 · `placeT` 385 · `makeToken` 389 · `dropT` 399 · `selT` 400 · `setTarget` 401 · `loadMap` 404 · `onPos` 419 · `onChar` 420 · `save` 421 · `netDb` 422 · `netWs` 429 · `snd` 430 · `open` 431 · `wk` 440 · `setM` 443 · `freeSpot` 444 · `end` 455 · `cutBg` 463 · `push` 464 · `prep` 467 · `spawn` 470 · `addChar` 471 · `resz` 475 · `focusT` 487 · `placeWalkCam` 494 · `togV` 495 · `startWalk` 496 · `setWalk` 500 · `walkStep` 502 · `jmove` 515 · `jend` 517 · `fillAreas` 521 · `xcalc` 522 · `xinfo` 523 · `xrender` 524 · `dl` 532 · `setC` 540 · `haloG` 545 · `dressSite` 546 · `fl2` 547 · `mt` 563 · `loadScript` 568 · `buildGlb` 569 · `importGlb` 590 · `importHdr` 595 · `noHdr` 600

### `server/servidor-sync.mjs`
`safe` 34 · `fileOf` 35 · `num` 37 · `getRoom` 41 · `evict` 50 · `flush` 55

### `server/testar.mjs`
`wait` 13 · `subir` 15 · `conectar` 19 · `enviar` 24 · `parar` 25

### `src/core/anim.ts`
`anim` 5 · `WindOpts` 7 · `inject` 26 · `addWind` 38 · `windDepth` 50 · `dustMotes` 59 · `shaftGeo` 92 · `lightShaft` 97

### `src/core/aparicao.ts`
`css` 8 · `aparicao` 22 · `ruido` 35 · `passo` 37 · `jit` 40

### `src/core/binario.ts`
`fetchBinary` 6

### `src/core/cenas.ts`
`Cena` 7 · `chave` 14 · `listaCenas` 16 · `guardar` 20 · `gravarCena` 21 · `apagarCena` 25

### `src/core/cinema.ts`
`Estilo` 13 · `Tomada` 15 · `CineMsg` 17 · `ease` 33 · `outExpo` 34 · `clamp` 35 · `alvoAtual` 38 · `setFov` 42 · `fade` 43 · `legenda` 44 · `chaoSob` 47 · `rodar` 53 · `sair` 75 · `terminar` 83 · `abortar` 92 · `revelar` 100 · `tickCinema` 107 · `obstaculos` 153 · `tomadaPara` 167 · `r` 186 · `apontar` 192 · `pararDeApontar` 196 · `chave` 199 · `tomadas` 200 · `guardar` 201 · `listaTomadas` 203 · `gravarAtual` 204 · `apagarTomada` 210 · `cineAtivo` 212 · `tomadaAtual` 214 · `r` 215 · `cineHooks` 219 · `initCinema` 221

### `src/core/config.ts`
`Quality` 6 · `defaultQuality` 8 · `CFG` 15

### `src/core/cull.ts`
`collectCull` 9 · `updateCull` 14

### `src/core/desempenho.ts`
`desempenho` 12 · `iniciar()` 14 · `quadro()` 23

### `src/core/diag.ts`
`guardar` 12 · `recompilar` 14 · `aplicarDiag` 27 · `initDiag` 29 · `abrir` 34

### `src/core/docs.ts`
`alvo` 17 · `imagemDe` 30 · `montar` 40 · `abrir` 57 · `fechar` 66 · `abrirDoc` 69 · `irAte` 72 · `listarPistas` 87 · `initNotas` 101 · `initDocs` 123

### `src/core/engine.ts`
`cv` 6 · `R` 8 · `S` 41 · `cam` 44 · `ctl` 47 · `onResize` 56 · `pixelRatioCap` 58 · `setPixelRatioCap` 59 · `renderScale` 62 · `setRenderScale` 63 · `fit` 69

### `src/core/espelho.ts`
`enviar` 36 · `espelho` 41 · `aplicarSobreposicao` 52 · `tickEspelho` 60 · `receber` 71 · `enviarQuadro` 117 · `r` 126 · `mandarEstado` 141 · `serJogadores` 155 · `dentroDeOutraPagina` 177 · `abrirJanelaJogadores` 184 · `initEspelho` 192 · `cheia` 212 · `avisarAparicao` 221 · `avisarMapa` 222 · `avisarClima` 223

### `src/core/glbmap.ts`
`dressSite` 7 · `fl2` 8 · `mt` 24 · `buildGlb` 27

### `src/core/grass.ts`
`clumpGeometry` 8 · `GrassOpts` 36 · `grassField` 48

### `src/core/heightfog.ts`
`heightFog` 5

### `src/core/imersao.ts`
`SomModo` 11 · `Fx` 12 · `imersao` 14 · `somAqui` 38 · `aplicarSom` 39 · `garantirLuz` 43 · `prepararLanterna` 51 · `iniciarRaio` 58 · `fx` 64 · `tickImersao` 71 · `setApagao` 124 · `reaplicarApagao` 129 · `nomeClima` 130 · `setNomeClima` 131 · `aplicarPreto` 135

### `src/core/importer.ts`
`importGlb` 12 · `importHdr` 25 · `initImporter` 38

### `src/core/kit.ts`
`K` 6 · `begin` 7 · `LI` 10 · `seed` 13 · `rnd` 14 · `mat` 17 · `asMat` 19 · `box` 21 · `cyl` 25 · `flat` 29 · `InstSpec` 34 · `inst` 35 · `PL` 48 · `jit` 54 · `tex` 55 · `cl` 59 · `makeTextures` 61 · `TX` 80 · `sm` 82 · `glassTex` 84 · `GM` 98 · `arch` 100 · `haloTex` 108 · `halo` 118 · `mistTex` 146 · `finishShadows` 154

### `src/core/loading.ts`
`bar` 5 · `txt` 6 · `draw` 8 · `loading` 16 · `waitTextures()` 19 · `error()` 29

### `src/core/locais.ts`
`esc` 17 · `L` 18 · `norm` 19 · `silhueta` 22 · `initLocais` 26 · `atualizarBotao` 52 · `alternar` 53 · `abrir` 54 · `fechar` 55 · `desenhar` 57 · `lista` 96 · `par` 97 · `segredo` 98 · `ficha` 102 · `distancias` 129 · `levarGrupo` 136 · `loopMarcas` 149

### `src/core/maps.ts`
`newRuntime` 15 · `disposeTree` 25 · `mapHooks` 34 · `loadMap` 36 · `u` 54

### `src/core/menu.ts`
`fecharMenu` 6 · `posicionar` 12 · `menu` 21 · `lista` 38 · `initMenus` 51

### `src/core/merge.ts`
`MergeOpts` 8 · `mergeStatic` 16 · `visit` 21

### `src/core/models.ts`
`fileFor` 10 · `hasModel` 14 · `litGlass` 17 · `fixMaterials` 21 · `model` 52 · `place` 66 · `Xf` 73 · `prepared` 81 · `InstOpts` 116 · `instance` 117 · `dequantize` 148 · `instanceVariants` 161 · `modelSize` 172

### `src/core/mostrar.ts`
`Imagem` 5 · `mostrar` 10 · `guardarImagem` 19 · `carregarImagem` 25 · `exibir` 39

### `src/core/net.ts`
`tap` 15 · `NET` 16 · `handlers` 24 · `key` 31 · `netDb` 33 · `netWs` 61 · `snd` 65 · `open` 66 · `netLocal` 90 · `ler` 92 · `gravar` 95 · `startNet` 110

### `src/core/pbr.ts`
`fileFor` 7 · `tex` 11 · `PbrOpts` 23 · `pbr` 41 · `rep` 45

### `src/core/post.ts`
`Grade` 15 · `DEFAULT_GRADE` 18 · `post` 42 · `init()` 48 · `setQuality()` 90 · `setGrade()` 109 · `render()` 127

### `src/core/probe.ts`
`EnvProbe` 7 · `swap` 28 · `update()` 40

### `src/core/procedural.ts`
`rnd` 6 · `stainedGlass` 9 · `pane` 16 · `roseGeometry` 73 · `petal` 75 · `leafGeometry` 98 · `looseePetalGeometry` 106 · `oldPainting` 113

### `src/core/sky.ts`
`Preset` 11 · `PRE` 33 · `hdrUrl` 42 · `loadHdr` 47 · `tintHalf` 70 · `limitarBrilho` 79 · `horizonColor` 94 · `hemi` 105 · `sun` 106 · `dome` 113 · `env` 114 · `setShadowRadius` 116 · `applyHdr` 123 · `driftSky` 132 · `timeHooks` 133 · `setTime` 135 · `aplicarLuzes` 167 · `forcarLuzes` 178 · `fatorLuzes` 180 · `preloadSkies` 183

### `src/core/som.ts`
`Efeito` 7 · `Fonte` 8 · `montar` 21 · `lfo` 49 · `env` 52 · `rajadaRuido` 55 · `tom` 62 · `batida` 70 · `passos` 76 · `sussurro` 84 · `rangido` 95 · `sino` 105 · `criarFontes` 114 · `crepitar` 123 · `trovao` 128 · `grilo` 134 · `som` 139 · `desbloquear()` 142 · `efeito()` 151 · `tick()` 161 · `ouvinte()` 176 · `tocarEfeito` 187 · `aplicar` 214

### `src/core/state.ts`
`st` 6

### `src/core/terrain.ts`
`hash` 7 · `noise2` 8 · `fbm` 14 · `TerrainLayer` 16 · `TerrainOpts` 17 · `terrainMaterial` 26 · `makeTerrain` 75

### `src/core/tokens.ts`
`silhueta` 12 · `jog` 19 · `TokenDef` 21 · `Token` 24 · `DEF` 35 · `pick` 42 · `tempoFichas` 45 · `vivo` 50 · `K` 69 · `sizeT` 71 · `placeT` 77 · `makeToken` 85 · `dropT` 106 · `selT` 112 · `setTarget` 117 · `focusT` 121 · `save` 127 · `onPos` 133 · `onChar` 143 · `wk` 149 · `helpers` 154 · `setM` 156 · `freeSpot` 161 · `busy` 163 · `initTokenInput` 172 · `end` 197 · `tickTokens` 217 · `snapTokens` 234

### `src/core/types.ts`
`View` 4 · `Layer` 5 · `VttData` 8 · `MapLight` 17 · `MapRuntime` 20 · `LocalInfo` 62 · `NpcInfo` 71 · `MapModule` 76

### `src/core/vtt.ts`
`fillAreas` 8 · `xcalc` 12 · `xinfo` 19 · `xrender` 21 · `clipPolyline` 50 · `push` 52 · `dd2vtt` 71 · `inb` 73 · `P` 74 · `dl` 88 · `initVtt` 94 · `opt` 98

### `src/core/walk.ts`
`WM` 9 · `Modo` 19 · `modo` 20 · `modeHooks` 22 · `placeWalkCam` 32 · `togV` 45 · `startWalk` 47 · `coarse` 59 · `setMode` 62 · `setWalk` 83 · `startFree` 86 · `freeLookAt` 96 · `freeStep` 104 · `aviso` 152 · `walkStep` 157 · `bl` 168 · `walkPointer` 182 · `initWalk` 192 · `hold` 210 · `up` 213 · `jmove` 218 · `jend` 226

### `src/core/weathering.ts`
`WeatherOpts` 5 · `weather` 7

### `src/main.ts`
`cutBg` 42 · `push` 46 · `prep` 56 · `spawnPoint` 68 · `addChar` 73 · `pontoVista` 83 · `ondeEsta` 85 · `moverPara` 91 · `listaPersonagens` 96 · `bt` 104 · `revelar` 123 · `marcarQ` 127 · `escolherClima` 129 · `irParaVista` 130 · `tg` 137 · `rodarCine` 141 · `itemCine` 142 · `encherCine` 148 · `initCinemaUi` 159 · `mostrarPersonagens` 170 · `tocarCena` 174 · `gravarCenaAtual` 188 · `encherMestre` 194 · `alternarImagem` 209 · `initMestreUi` 214 · `toast` 237 · `telaLimpa` 242 · `initAtalhos` 249 · `atualizarSelo` 290 · `congelar` 298 · `escurecer` 302 · `lanterna` 303 · `marcarSom` 304 · `initImersaoUi` 305 · `initUi` 317 · `resz` 362 · `frame` 420 · `captureApi` 442 · `view()` 445 · `third()` 451 · `stats()` 463 · `start` 475

### `src/maps/arton/dados.ts`
`f` 6 · `FICHAS` 8

### `src/maps/arton/geo.ts`
`P` 8 · `ESC` 9 · `W` 10 · `w` 11 · `LIM` 12 · `KM_POR_UNIDADE` 14 · `clamp` 17 · `smooth` 18 · `lerp` 19 · `ridged` 20 · `reseed` 26 · `rnd` 27 · `entre` 28 · `bbox` 31 · `sdPoly` 33 · `distLinha` 47 · `suaviza` 60 · `f` 67 · `UIVANTES` 78 · `ESTEPE` 79 · `TOLLON` 80 · `LOMATUBAR` 81 · `DEHEON` 82 · `BB` 83 · `costaZ` 87 · `Ilha` 94 · `ilha` 95 · `ILHAS` 96 · `ilhaD` 105 · `RIOS` 114 · `LAGO` 125 · `Reg` 128 · `Lugar` 129 · `L` 130 · `V` 131 · `LUGARES` 132 · `lugar` 167 · `pts` 170 · `PICOS` 171 · `PICO_A` 172 · `CAVERNAS` 173 · `TORRES_RUINA` 174 · `ACAMPAMENTOS` 175 · `BATALHAS` 176 · `FAROIS` 177 · `PANTANO` 178 · `BOA_SORTE` 179 · `TAIGAS` 180 · `MANADAS` 181 · `LUG` 187 · `ESTRADAS` 188 · `TRILHAS` 203 · `CLAREIRAS` 211 · `Grade` 214 · `PASSO` 215 · `terraD` 218 · `campo` 228 · `PERFIS` 285 · `G` 287 · `construirGrade` 289 · `sdPolyCache` 373 · `Y` 376 · `Ysolo` 384

### `src/maps/arton/index.ts`
`P3` 22 · `vistaDe` 24 · `bbox` 28 · `ganchoCamera` 32 · `build` 37 · `escolher` 61 · `nevoa` 86 · `ajustarNomes` 153

### `src/maps/arton/interiores.ts`
`Y0` 18 · `v3` 23 · `luz` 24 · `vista` 25 · `box` 26 · `cil` 27 · `geo` 28 · `solido` 30 · `piso` 32 · `contorno` 33 · `sala` 37 · `gruta` 50 · `tocha` 59 · `cartaz` 65 · `ancora` 72 · `macacoCaolho` 89 · `asidon` 108 · `masmorra` 124 · `cavernaGelo` 152 · `cristaisAzuis` 166 · `covil` 167 · `catedral` 183 · `covariel` 200 · `gilukSalao` 222 · `bruxa` 237 · `templo` 249 · `zolkan` 264 · `construirInteriores` 284 · `dentroDeInterior` 296

### `src/maps/arton/miniaturas.ts`
`vc` 17 · `mats` 18 · `MM` 42 · `Mini` 44 · `P` 48 · `add` 49 · `prisma` 50 · `cone` 54 · `pt` 55 · `chao` 57 · `inclinacao` 58 · `pertoDeRio` 60 · `bom` 67 · `janela` 68 · `fumo` 69 · `bandeira` 70 · `casa` 79 · `povoado` 143 · `cerca` 152 · `paliçada` 159 · `torreVigia` 162 · `poco` 168 · `cristais` 174 · `arvoreMorta` 178 · `giluk` 186 · `catedral` 207 · `beluhga` 222 · `dragao` 236 · `osso` 247 · `geloAntigo` 254 · `cabana` 260 · `caverna` 267 · `barudMini` 273 · `nimbarann` 299 · `trigal` 304 · `vilaLom` 309 · `asidon` 310 · `korl` 319 · `torreRuina` 328 · `acampamento` 333 · `batalha` 338 · `pantano` 349 · `valkaria` 355 · `malpetrim` 388 · `velhaMalpetrim` 406 · `zolkan` 412 · `azazel` 422 · `centauros` 430 · `kobolds` 437 · `tiberus` 443 · `minotauroEstatua` 455 · `forteTapista` 462 · `covariel` 463 · `ancora` 470 · `eremita` 482 · `pesca` 483 · `farol` 491 · `porto` 498 · `vilaDeh` 499 · `aldeiaGelo` 506 · `aldeiaGeral` 507 · `pontes` 510 · `comLote` 524 · `construirMiniaturas` 527

### `src/maps/arton/natureza.ts`
`hashDe` 16 · `perto` 17 · `pinta` 20 · `tollonGeo` 26 · `coniferaGeo` 34 · `folhaGeo` 42 · `cipresteGeo` 50 · `longe` 54 · `plantar` 60 · `construirNatureza` 71 · `livre` 75 · `bicho` 109 · `corpo` 111 · `perna` 112 · `cab` 113 · `chifre` 114 · `cav` 127 · `navio` 134 · `pos` 144

### `src/maps/arton/simbolos.ts`
`COR_PINO` 8 · `altPino` 12 · `Rota` 14 · `pxDe` 15 · `ROTAS` 24 · `dias` 29 · `placa` 31 · `rr` 34 · `construirSimbolos` 43 · `pinta` 46 · `reg` 60

### `src/maps/arton/terreno.ts`
`tempo` 15 · `fita` 19 · `Ponte` 40 · `PONTES` 41 · `acharPontes` 42 · `busca` 46 · `yRua` 66 · `construirRelevo` 73 · `construirMar` 109 · `pass` 114 · `ok` 117 · `construirAguasEcaminhos` 166 · `add` 174 · `insete` 182 · `CORES_REGIAO` 191 · `construirFronteiras` 192 · `alt` 203 · `rotulo` 212 · `MOLD` 227 · `desenharMoldura` 228 · `construirMoldura` 279 · `caixa` 292

### `src/maps/barud/cidade.ts`
`LReq` 12 · `LUZES` 13 · `luz` 14 · `Cidade` 16 · `estiloEm` 22 · `construirCidade` 29 · `colisor` 33 · `sh` 36 · `muroSeg` 89 · `ponte` 162 · `ocupado` 180 · `casa` 209 · `hh` 223 · `fzz` 253 · `barr` 288 · `poste` 318 · `livre` 337 · `carroca` 357 · `animal` 367 · `retCantos` 402 · `mergeSimples` 406

### `src/maps/barud/common.ts`
`Q` 10 · `reseed` 18 · `rnd` 19 · `entre` 20 · `pick` 21 · `MURO_R` 24 · `MURO` 25 · `dentroMuro` 27 · `PORTAO_SUL` 38 · `PORTAO_LESTE` 39 · `CANAL` 42 · `Rua` 45 · `RUAS` 46 · `Ret` 63 · `PRACA` 64 · `FORTALEZA` 65 · `CORAL` 66 · `vc` 69 · `makeMats` 70 · `pl` 71 · `MAT` 96 · `MatKey` 97 · `por` 101 · `cx` 107 · `telhado` 112 · `cone` 129 · `cil` 132 · `coral` 136 · `dentroRet` 146 · `cruzaRet` 147 · `retRua` 148

### `src/maps/barud/dados.ts`
`LocalFicha` 6 · `NpcFicha` 16 · `LOCAIS` 24 · `NPCS` 224

### `src/maps/barud/edificios.ts`
`Vao` 16 · `Predio` 17 · `Construido` 28 · `MATRIZ` 29 · `SPEC` 30 · `mundo` 32 · `retDe` 34 · `PREDIOS` 41 · `corDe` 65 · `parede` 67 · `seg` 70 · `construirPredio` 85 · `W` 91 · `luzI` 195 · `mobiliar` 197 · `W` 199 · `construirFortaleza` 391 · `mur` 400

### `src/maps/barud/floresta.ts`
`TRILHA` 18 · `FORCA` 19 · `CABANA` 20 · `CLAREIRA` 21 · `AREAS` 22 · `MARCAS` 28 · `naTrilha` 39 · `distTrilha` 41 · `distSeg` 49 · `mataMask` 54 · `vistasMata` 63 · `mortaGeo` 76 · `tubo` 81 · `pinheiroEscuro` 112 · `cranio` 137 · `Floresta` 149 · `construirFloresta` 151 · `coluna` 156 · `livre` 197 · `perto` 206 · `espalha` 235 · `vai` 249 · `placa` 286

### `src/maps/barud/index.ts`
`retrato` 21 · `P3` 23 · `build` 25 · `barraca` 53 · `escolher` 112 · `tokId` 178 · `mundoXYZ` 247 · `silhuetaPng` 250 · `cartaz` 259 · `desenhar` 262 · `aviso` 278

### `src/maps/barud/mobilia.ts`
`peca` 9 · `cx()` 13 · `cil()` 16 · `esf()` 19 · `mesa` 26 · `banco` 32 · `banqueta` 37 · `cadeira` 42 · `cama` 49 · `bau` 62 · `estante` 69 · `prateleira` 84 · `lareira` 96 · `balcao` 107 · `barril` 113 · `caixote` 120 · `sacos` 125 · `vela` 129 · `lustre` 136 · `tapecaria` 144 · `quadro` 149 · `tapete` 154 · `armario` 158 · `caldeirao` 165 · `forja` 173 · `altar` 184 · `bancoTemplo` 193 · `armadura` 199 · `cavalete` 205 · `servico` 211

### `src/maps/campo.ts`
`build` 12 · `height` 18

### `src/maps/canada/casas.ts`
`CASA_EVA` 14 · `CASA_MOREAU` 15 · `ALF` 17 · `DENTRO` 19 · `buildCasas` 24 · `roll` 50 · `note` 71 · `manequim` 140 · `peca` 151 · `casa` 168

### `src/maps/canada/chegada.ts`
`VISTA_CHEGADA` 18 · `moto` 20 · `roda` 24 · `bx` 26 · `carro` 40 · `pista` 48 · `buildChegada` 50 · `zAt` 55 · `tick()` 57

### `src/maps/canada/common.ts`
`ROW0` 8 · `KING` 10 · `ELM` 12 · `MAPLE` 14 · `EXT` 16 · `RIVER` 18 · `riverZ` 19 · `RAIL` 21 · `STATION` 22 · `HOTEL` 24 · `MORGUE` 26 · `CHURCH` 28 · `CEMETERY` 29 · `MILL` 31 · `GAS` 33 · `DINER` 34

### `src/maps/canada/hotel.ts`
`LV` 18 · `wx` 20 · `buildHotel` 25 · `opsFor` 42 · `add` 44 · `pos` 67 · `bxw` 68 · `gold` 119 · `slab` 128 · `cover` 142 · `stair` 151 · `rail` 163 · `decorRoom` 263 · `CELLAR` 400 · `HOTEL_GROUPS` 401

### `src/maps/canada/index.ts`
`P` 20 · `VIEWS` 21 · `build` 70 · `inR` 73 · `fill` 98 · `busy` 112 · `lot` 118 · `line` 127 · `free` 148 · `escolherLuzes` 160 · `dentro` 171

### `src/maps/canada/interior.ts`
`Interior` 7 · `canvasTex` 10 · `makeMats` 18 · `IM` 46 · `Kit` 52 · `seg()` 56 · `wall()` 62 · `door()` 77 · `bed()` 84 · `nightstand()` 95 · `lamp()` 101 · `dresser()` 105 · `chair()` 111 · `armchair()` 117 · `table()` 122 · `radiator()` 128 · `bottle()` 133 · `covered()` 138 · `build()` 146 · `docPlane` 156 · `sigilKnow` 165 · `scrawl` 177

### `src/maps/canada/landmarks.ts`
`Landmarks` 13 · `car` 16 · `buildLandmarks` 28 · `outline` 36 · `ar` 41 · `stone` 86 · `QUEEN_Z` 196

### `src/maps/canada/morgue.ts`
`wx` 14 · `buildMorgue` 16 · `fluo` 79

### `src/maps/canada/nature.ts`
`setBuilt` 13 · `riverBed` 16 · `groundH` 18 · `bareTree` 27 · `branch` 30 · `placeGeo` 53 · `buildNature` 62 · `ok` 97 · `scatter` 98 · `near` 100

### `src/maps/canada/npcs.ts`
`url` 15 · `imagem` 17 · `Morador` 19 · `MORADORES` 21 · `moradores` 50 · `texCom` 62 · `retrato` 70 · `cartazMoreau` 81 · `buildRetratos` 91 · `moreau` 93

### `src/maps/canada/pistas.ts`
`PISTAS` 4 · `NOTAS` 60

### `src/maps/igreja/building.ts`
`Building` 11 · `buildChurch` 20 · `glassMat` 33 · `wall` 42 · `windowAt` 50

### `src/maps/igreja/common.ts`
`FLOOR` 7 · `NX` 8 · `WT` 9 · `WH` 10 · `TOP` 11 · `RISE` 12 · `LOFT` 13 · `LOFT_Z` 14 · `WIN_Z` 15 · `WIN` 16 · `DOOR` 17 · `TOWER` 18 · `M` 21 · `iron` 41 · `brass` 42 · `velvet` 43 · `bx` 47 · `mesh` 48 · `cube` 52 · `pointedArch` 57 · `roundArch` 69 · `circle` 75 · `shift` 78 · `Hole` 80 · `wallGeo` 85 · `frameGeo` 92 · `panelGeo` 99

### `src/maps/igreja/grounds.ts`
`FENCE` 15 · `PATH` 16 · `PARK` 17 · `SHED` 18 · `GAZEBO` 19 · `GRAVE` 20 · `rnd` 23 · `sm` 24 · `Grounds` 32 · `groundH` 35 · `buildGrounds` 43 · `addLight` 50 · `inCorridor` 57 · `free` 62 · `underTree` 84 · `groundMask` 98 · `grassAllow` 111 · `grassTall` 119 · `garland` 165 · `puddle` 175 · `bar` 186 · `rail` 193 · `mk` 305 · `pbr2` 367

### `src/maps/igreja/index.ts`
`P` 18 · `VIEWS` 19 · `build` 29 · `tokens` 95 · `inside` 136 · `updExterior` 137 · `bucket` 151 · `skip` 152 · `isIn` 161

### `src/maps/igreja/interior.ts`
`PEW` 11 · `CHANCEL` 12 · `Interior` 14 · `Flowers` 17 · `push()` 21 · `bunch()` 25 · `scatterPetals()` 37 · `build()` 40 · `mk` 41 · `pewGeometry` 53 · `add` 55 · `buildInterior` 76

### `src/maps/manifest.ts`
`MAPS` 6

### `src/maps/mexico/common.ts`
`lod` 12 · `GRID` 16 · `STREET` 17 · `WALKW` 18 · `CURB` 19 · `BLOCK` 20 · `PLAZA` 21 · `TOWN` 22 · `BLK` 24 · `CHURCH` 26 · `ATRIO` 27 · `CANTINA` 28 · `MARKET` 29 · `PORTAL` 30 · `KIOSCO` 31 · `PANTEON` 32 · `HACIENDA` 33 · `TOWER_W` 34 · `ARROYO` 35 · `ROAD_S` 36 · `Q` 39 · `reseed` 47 · `rnd` 48 · `pick` 49 · `sm` 50 · `FACADE` 53 · `BASE` 54 · `vc` 57 · `makeMats` 59 · `MAT` 86 · `MatKey` 87 · `prep` 92 · `Batch` 107 · `add()` 111 · `box()` 116 · `build()` 122 · `mtx` 152 · `signTexture` 156 · `sign` 172

### `src/maps/mexico/index.ts`
`P` 12 · `VIEWS` 13 · `build` 29 · `inBox` 64 · `free` 65 · `tumble` 108

### `src/maps/mexico/landmarks.ts`
`LightReq` 17 · `LREQ` 18 · `light` 19 · `Landmarks` 21 · `wall` 24 · `rect` 28 · `buildLandmarks` 30 · `later` 41 · `strand` 106 · `sideHoles` 145 · `ret` 183 · `aw` 202 · `pw` 324 · `add` 340 · `outer` 382 · `inner` 388 · `papelTex` 463 · `cut` 468 · `clockTex` 473 · `sigilTex` 484 · `ring` 487 · `ruinTop` 496

### `src/maps/mexico/nature.ts`
`boxDist` 13 · `flatMask` 17 · `roadMask` 27 · `arroyoDepth` 35 · `groundH` 39 · `green` 51 · `colorize` 52 · `ribbed` 58 · `saguaro` 67 · `nopal` 84 · `pad` 87 · `agave` 97 · `rockGeo` 112 · `placeRock` 121 · `Nature` 131 · `buildNature` 134 · `okWild` 168 · `scatter` 169 · `tl` 220 · `exported` 237

### `src/maps/mexico/town.ts`
`Facing` 14 · `HouseOpts` 16 · `Town` 22 · `bx()` 38 · `house()` 45 · `block()` 124 · `plane` 139 · `poles()` 163 · `finish()` 194 · `poleLines` 214 · `along` 216

### `src/maps/texas/buildings.ts`
`StoreOpts` 10 · `HouseOpts` 11 · `Builder` 13 · `outline()` 22 · `window()` 26 · `store()` 37 · `house()` 83 · `road()` 127 · `poles()` 139 · `streetLights()` 161 · `finish()` 173

### `src/maps/texas/common.ts`
`SQ` 13 · `RING` 14 · `ROW0` 15 · `ROWD` 16 · `HWY` 17 · `RAIL` 18 · `RES_Z` 19 · `RES_X` 20 · `EXT` 21 · `CHURCH` 22 · `CEMETERY` 23 · `DINER` 24 · `GAS` 25 · `MOTEL` 26 · `DEPOT` 27 · `ELEVATOR` 28 · `TOWERW` 29 · `FARM` 30 · `PUMPS` 31 · `CROP` 33 · `POLICE` 35 · `FOREST` 37 · `CAMP` 41 · `TAVERN` 42 · `HOTEL` 44 · `vc` 47 · `make` 49 · `TM` 76 · `SIDING` 79 · `STORE` 80 · `LightReq` 83 · `LREQ` 84 · `light` 85 · `Opening` 88 · `shell` 90 · `side` 92 · `gableRoof` 110 · `bxM` 124 · `neonTexture` 131

### `src/maps/texas/forest.ts`
`Forest` 15 · `forestMask` 18 · `trailMask` 23 · `tex` 30 · `pineGeo` 35 · `buildForest` 59 · `gy` 66 · `plane` 67 · `free` 94 · `scatter` 110 · `wl` 160

### `src/maps/texas/hotel.ts`
`wx` 13 · `buildHotel` 16 · `bx` 23 · `doc` 25 · `seg` 63 · `iw` 64 · `door` 80 · `bed` 85 · `night` 90 · `wardrobe` 92 · `chair` 93 · `table` 95 · `rug` 96

### `src/maps/texas/index.ts`
`P` 22 · `VIEWS` 23 · `build` 65 · `inR` 70 · `sw` 94 · `fill` 101 · `busy` 119 · `lot` 122 · `line` 131 · `pos` 144 · `free` 169 · `escolherLuzes` 181

### `src/maps/texas/landmarks.ts`
`Anim` 17 · `Landmarks` 18 · `buildLandmarks` 20 · `box` 28 · `neon` 29 · `sg` 35 · `roomX` 175 · `fence` 279 · `add` 368 · `billboard` 383 · `woodChairs` 405 · `ad` 409 · `cornGeo` 415 · `mergeGeos` 426 · `texasFlag` 431 · `clockTex` 439 · `checkerTex` 448 · `mirrorTex` 454 · `chalkTex` 460 · `ring` 463 · `missingTex` 469

### `src/maps/texas/mystery.ts`
`tex` 7 · `sigil` 12 · `j` 15 · `ring` 16 · `plane` 23 · `DOCS` 30 · `buildMystery` 33

### `src/maps/texas/nature.ts`
`setBuilt` 14 · `groundH` 16 · `dirtRoad` 25 · `yucca` 35 · `buildNature` 43 · `ok` 71 · `scatter` 72

### `src/maps/texas/npcs.ts`
`img` 9 · `Npc` 11 · `NPCS` 20 · `cutout` 54 · `silhouette` 87 · `npcTokens` 95 · `load` 96

### `src/maps/texas/onibus.ts`
`PONTO` 12 · `VISTA_ONIBUS` 16 · `bus` 18 · `M` 20 · `box` 21 · `buildOnibus` 45 · `pos` 59 · `tick()` 65

### `src/maps/texas/pistas.ts`
`PISTAS` 5 · `NOTAS` 74

### `src/maps/texas/police.ts`
`wx` 14 · `mk` 18 · `age` 22 · `paperDraw` 24 · `wrap` 37 · `paper` 43 · `photo` 44 · `sigil` 64 · `pin` 70 · `cork` 71 · `marker` 72 · `COUNTY_MAP` 75 · `P2` 80 · `Police` 95 · `buildPolice` 97 · `bx` 104 · `doc` 106 · `chairs` 113 · `iw` 143 · `lo` 148 · `seg` 154 · `door` 169 · `car` 182 · `add` 184 · `win` 201 · `px` 203 · `shelf` 307 · `draw` 407

### `tools/assets-leves.mjs`
`size` 19

### `tools/baixar-assets.mjs`
`api` 17 · `fetchJson` 19 · `download` 20 · `sleep` 29 · `want` 30 · `info` 33 · `pick` 45

### `tools/baixar-npcs.mjs`
`get` 8

### `tools/blender/desbastar_arvore.py`
`is_leaf` 22 · `is_foliage` 32 · `thin` 39 · `decimate_all` 109

### `tools/capturas.mjs`
`loadPlaywright` 13 · `img` 87

### `tools/diag-climas.mjs`
`measure` 18

### `tools/limpar-recorte.py`
`componentes` 17

### `tools/medir.mjs`
`tri` 30

### `tools/orcamento.sh`
`opt` 9

### `tools/testar-funcoes.mjs`
`tecla` 60

### `tools/testar-vtt.mjs`
`inside` 26

### `vite.config.ts`
`binariosComoJs` 9 · `load()` 12

