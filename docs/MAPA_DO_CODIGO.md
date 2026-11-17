# Mapa do código

Gerado por `scripts/mapa_do_codigo.py` — rode de novo depois de criar, mover ou mudar arquivos.
Para ler uma função: Read com `offset` = linha e `limit` ≈ 40–80. Não leia arquivos inteiros sem necessidade.

## Pastas pesadas (binários: imagens, modelos, áudio, vídeo) — não abrir

| Pasta | Arquivos | Tamanho |
|---|---|---|
| `src/assets/` | 142 | 82.7 MB |
| `capturas/` | 101 | 15.7 MB |
| `referencias/` | 5 | 2.4 MB |

## Linhas GIGANTES (dados embutidos) — grep sempre com `| cut -c1-200`

| Arquivo | Linha | Tamanho | Início |
|---|---|---|---|
| `legacy/igreja-3d-site.html` | 74 | 823 KB | const IMGS={"dante": "data:image/png;bas |

## Arquivos de texto/código

| Arquivo | Linhas | Tamanho |
|---|---|---|
| `index.html` | 140 | 12 KB |
| `legacy/igreja-3d-site.html` | 620 | 899 KB |
| `legacy/servidor-sync.js` | 26 | 1 KB |
| `scripts/mapa_do_codigo.py` | 78 | 5 KB |
| `server/servidor-sync.mjs` | 141 | 8 KB |
| `server/testar.mjs` | 83 | 5 KB |
| `src/core/anim.ts` | 124 | 7 KB |
| `src/core/binario.ts` | 21 | 1 KB |
| `src/core/cenas.ts` | 26 | 1 KB |
| `src/core/cinema.ts` | 246 | 12 KB |
| `src/core/config.ts` | 32 | 1 KB |
| `src/core/cull.ts` | 25 | 1 KB |
| `src/core/desempenho.ts` | 33 | 1 KB |
| `src/core/engine.ts` | 58 | 2 KB |
| `src/core/espelho.ts` | 230 | 13 KB |
| `src/core/glbmap.ts` | 49 | 6 KB |
| `src/core/grass.ts` | 79 | 4 KB |
| `src/core/heightfog.ts` | 44 | 2 KB |
| `src/core/imersao.ts` | 138 | 6 KB |
| `src/core/importer.ts` | 44 | 2 KB |
| `src/core/kit.ts` | 160 | 11 KB |
| `src/core/loading.ts` | 39 | 2 KB |
| `src/core/maps.ts` | 74 | 3 KB |
| `src/core/menu.ts` | 58 | 2 KB |
| `src/core/merge.ts` | 52 | 3 KB |
| `src/core/models.ts` | 177 | 9 KB |
| `src/core/mostrar.ts` | 51 | 2 KB |
| `src/core/net.ts` | 95 | 5 KB |
| `src/core/pbr.ts` | 81 | 3 KB |
| `src/core/post.ts` | 127 | 6 KB |
| `src/core/probe.ts` | 53 | 2 KB |
| `src/core/procedural.ts` | 138 | 8 KB |
| `src/core/sky.ts` | 146 | 8 KB |
| `src/core/som.ts` | 200 | 12 KB |
| `src/core/state.ts` | 26 | 1 KB |
| `src/core/terrain.ts` | 99 | 5 KB |
| `src/core/tokens.ts` | 196 | 12 KB |
| `src/core/types.ts` | 55 | 2 KB |
| `src/core/vtt.ts` | 105 | 7 KB |
| `src/core/walk.ts` | 219 | 11 KB |
| `src/core/weathering.ts` | 45 | 2 KB |
| `src/main.ts` | 435 | 26 KB |
| `src/maps/campo.ts` | 53 | 4 KB |
| `src/maps/igreja/building.ts` | 232 | 16 KB |
| `src/maps/igreja/common.ts` | 105 | 7 KB |
| `src/maps/igreja/grounds.ts` | 369 | 30 KB |
| `src/maps/igreja/index.ts` | 162 | 9 KB |
| `src/maps/igreja/interior.ts` | 246 | 18 KB |
| `src/maps/manifest.ts` | 10 | 1 KB |
| `src/maps/mexico/common.ts` | 169 | 10 KB |
| `src/maps/mexico/index.ts` | 176 | 10 KB |
| `src/maps/mexico/landmarks.ts` | 503 | 46 KB |
| `src/maps/mexico/nature.ts` | 234 | 15 KB |
| `src/maps/mexico/town.ts` | 223 | 13 KB |
| `src/style.css` | 193 | 15 KB |
| `src/vite-env.d.ts` | 2 | 0 KB |
| `tools/_grid.mjs` | 7 | 1 KB |
| `tools/arvores.sh` | 32 | 2 KB |
| `tools/assets-leves.mjs` | 21 | 1 KB |
| `tools/baixar-assets.mjs` | 93 | 5 KB |
| `tools/blender/desbastar_arvore.py` | 151 | 7 KB |
| `tools/capturas.mjs` | 113 | 6 KB |
| `tools/contar-tris.mjs` | 15 | 1 KB |
| `tools/medir.mjs` | 48 | 5 KB |
| `tools/orcamento.sh` | 49 | 2 KB |
| `tools/testar-funcoes.mjs` | 110 | 10 KB |
| `tools/testar-vtt.mjs` | 41 | 4 KB |
| `tools/ver-modelo.mjs` | 25 | 2 KB |
| `tools/visualizador.html` | 32 | 2 KB |
| `vite.config.ts` | 39 | 2 KB |

Outros textos: `.claude/skills/mapa-3d/CATALOGO.md`, `.claude/skills/mapa-3d/SKILL.md`, `.github/workflows/ci.yml`, `CHANGELOG.md`, `CLAUDE.md`, `CREDITS.md`, `README.md`, `capturas/README.md`, `docs/BRIEFING.md`, `docs/HOSPEDAGEM.md`, `docs/NOVO-MAPA.md`, `docs/PROMPT-NOVO-MAPA.md`, `docs/VTT.md`, `package.json`, `server/package-lock.json`, `server/package.json`, `tools/assets.json`, `tsconfig.json`

## Funções, classes e exports (linha)

### `legacy/igreja-3d-site.html`
`fit` 82 · `mat` 87 · `box` 88 · `cyl` 89 · `jit` 90 · `tex` 91 · `cl` 92 · `sm` 106 · `glass` 107 · `arch` 111 · `inst` 112 · `updEnv` 118 · `setTime` 132 · `buildIgreja` 139 · `haloT` 141 · `halo` 142 · `flat` 149 · `step` 177 · `pewM` 203 · `lace` 246 · `veil` 248 · `roofG` 280 · `car` 282 · `bench` 290 · `dead` 300 · `aoT` 312 · `mistT` 321 · `buildCampo` 352 · `K` 381 · `sizeT` 384 · `placeT` 385 · `makeToken` 389 · `dropT` 399 · `selT` 400 · `setTarget` 401 · `loadMap` 404 · `onPos` 419 · `onChar` 420 · `save` 421 · `netDb` 422 · `netWs` 429 · `snd` 430 · `open` 431 · `wk` 440 · `setM` 443 · `freeSpot` 444 · `end` 455 · `cutBg` 463 · `push` 464 · `prep` 467 · `spawn` 470 · `addChar` 471 · `resz` 475 · `focusT` 487 · `placeWalkCam` 494 · `togV` 495 · `startWalk` 496 · `setWalk` 500 · `walkStep` 502 · `jmove` 515 · `jend` 517 · `fillAreas` 521 · `xcalc` 522 · `xinfo` 523 · `xrender` 524 · `dl` 532 · `setC` 540 · `haloG` 545 · `dressSite` 546 · `fl2` 547 · `mt` 563 · `loadScript` 568 · `buildGlb` 569 · `importGlb` 590 · `importHdr` 595 · `noHdr` 600

### `server/servidor-sync.mjs`
`safe` 34 · `fileOf` 35 · `num` 37 · `getRoom` 41 · `evict` 50 · `flush` 55

### `server/testar.mjs`
`wait` 13 · `subir` 15 · `conectar` 19 · `enviar` 24 · `parar` 25

### `src/core/anim.ts`
`anim` 5 · `WindOpts` 7 · `inject` 26 · `addWind` 38 · `windDepth` 50 · `dustMotes` 59 · `shaftGeo` 92 · `lightShaft` 97

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
`desempenho` 9 · `iniciar()` 11 · `quadro()` 20

### `src/core/engine.ts`
`cv` 6 · `R` 8 · `S` 21 · `cam` 24 · `ctl` 27 · `onResize` 36 · `pixelRatioCap` 38 · `setPixelRatioCap` 39 · `renderScale` 42 · `setRenderScale` 43 · `fit` 49

### `src/core/espelho.ts`
`enviar` 34 · `espelho` 39 · `aplicarSobreposicao` 50 · `tickEspelho` 58 · `receber` 69 · `enviarQuadro` 114 · `r` 123 · `mandarEstado` 138 · `serJogadores` 152 · `dentroDeOutraPagina` 174 · `abrirJanelaJogadores` 181 · `initEspelho` 189 · `cheia` 209 · `avisarMapa` 217 · `avisarClima` 218

### `src/core/glbmap.ts`
`dressSite` 7 · `fl2` 8 · `mt` 24 · `buildGlb` 27

### `src/core/grass.ts`
`clumpGeometry` 8 · `GrassOpts` 36 · `grassField` 48

### `src/core/heightfog.ts`
`heightFog` 5

### `src/core/imersao.ts`
`SomModo` 11 · `Fx` 12 · `imersao` 14 · `somAqui` 37 · `aplicarSom` 38 · `garantirLuz` 42 · `prepararLanterna` 50 · `iniciarRaio` 57 · `fx` 63 · `tickImersao` 70 · `setApagao` 123 · `reaplicarApagao` 128 · `nomeClima` 129 · `setNomeClima` 130 · `aplicarPreto` 134

### `src/core/importer.ts`
`importGlb` 12 · `importHdr` 25 · `initImporter` 38

### `src/core/kit.ts`
`K` 6 · `begin` 7 · `LI` 10 · `seed` 13 · `rnd` 14 · `mat` 17 · `asMat` 19 · `box` 21 · `cyl` 25 · `flat` 29 · `InstSpec` 34 · `inst` 35 · `PL` 48 · `jit` 54 · `tex` 55 · `cl` 59 · `makeTextures` 61 · `TX` 80 · `sm` 82 · `glassTex` 84 · `GM` 98 · `arch` 100 · `haloTex` 108 · `halo` 118 · `mistTex` 146 · `finishShadows` 154

### `src/core/loading.ts`
`bar` 5 · `txt` 6 · `draw` 8 · `loading` 16 · `waitTextures()` 19 · `error()` 29

### `src/core/maps.ts`
`newRuntime` 15 · `disposeTree` 25 · `mapHooks` 34 · `loadMap` 36 · `u` 54

### `src/core/menu.ts`
`fecharMenu` 6 · `posicionar` 12 · `menu` 21 · `lista` 38 · `initMenus` 49

### `src/core/merge.ts`
`MergeOpts` 8 · `mergeStatic` 16 · `visit` 21

### `src/core/models.ts`
`fileFor` 10 · `hasModel` 14 · `litGlass` 17 · `fixMaterials` 21 · `model` 52 · `place` 66 · `Xf` 73 · `prepared` 81 · `InstOpts` 116 · `instance` 117 · `dequantize` 148 · `instanceVariants` 161 · `modelSize` 172

### `src/core/mostrar.ts`
`Imagem` 5 · `mostrar` 10 · `guardarImagem` 19 · `carregarImagem` 25 · `exibir` 39

### `src/core/net.ts`
`tap` 15 · `NET` 16 · `handlers` 24 · `key` 31 · `netDb` 33 · `netWs` 61 · `snd` 65 · `open` 66 · `startNet` 89

### `src/core/pbr.ts`
`fileFor` 7 · `tex` 11 · `PbrOpts` 23 · `pbr` 41 · `rep` 45

### `src/core/post.ts`
`Grade` 15 · `DEFAULT_GRADE` 18 · `post` 36 · `init()` 42 · `setQuality()` 78 · `setGrade()` 97 · `render()` 115

### `src/core/probe.ts`
`EnvProbe` 7 · `swap` 28 · `update()` 40

### `src/core/procedural.ts`
`rnd` 6 · `stainedGlass` 9 · `pane` 16 · `roseGeometry` 73 · `petal` 75 · `leafGeometry` 98 · `looseePetalGeometry` 106 · `oldPainting` 113

### `src/core/sky.ts`
`Preset` 11 · `PRE` 31 · `hdrUrl` 40 · `loadHdr` 44 · `horizonColor` 58 · `hemi` 69 · `sun` 70 · `dome` 77 · `env` 78 · `setShadowRadius` 80 · `applyHdr` 87 · `driftSky` 96 · `timeHooks` 97 · `setTime` 99 · `aplicarLuzes` 131 · `forcarLuzes` 142 · `preloadSkies` 145

### `src/core/som.ts`
`Efeito` 7 · `Fonte` 8 · `montar` 21 · `lfo` 45 · `env` 48 · `rajadaRuido` 51 · `tom` 58 · `batida` 66 · `passos` 72 · `sussurro` 80 · `rangido` 91 · `sino` 101 · `criarFontes` 110 · `crepitar` 119 · `trovao` 124 · `grilo` 130 · `som` 135 · `desbloquear()` 138 · `efeito()` 147 · `tick()` 168 · `ouvinte()` 183 · `aplicar` 194

### `src/core/state.ts`
`st` 6

### `src/core/terrain.ts`
`hash` 7 · `noise2` 8 · `fbm` 14 · `TerrainLayer` 16 · `TerrainOpts` 17 · `terrainMaterial` 26 · `makeTerrain` 75

### `src/core/tokens.ts`
`TokenDef` 13 · `Token` 14 · `DEF` 22 · `pick` 30 · `K` 32 · `sizeT` 34 · `placeT` 40 · `makeToken` 47 · `dropT` 68 · `selT` 74 · `setTarget` 79 · `focusT` 83 · `save` 89 · `onPos` 95 · `onChar` 105 · `wk` 111 · `helpers` 116 · `setM` 118 · `freeSpot` 123 · `busy` 125 · `initTokenInput` 134 · `end` 159 · `tickTokens` 179 · `snapTokens` 195

### `src/core/types.ts`
`View` 4 · `Layer` 5 · `VttData` 8 · `MapLight` 17 · `MapRuntime` 20 · `MapModule` 50

### `src/core/vtt.ts`
`fillAreas` 8 · `xcalc` 12 · `xinfo` 19 · `xrender` 21 · `clipPolyline` 50 · `push` 52 · `dd2vtt` 71 · `inb` 73 · `P` 74 · `dl` 88 · `initVtt` 94 · `opt` 98

### `src/core/walk.ts`
`WM` 9 · `Modo` 18 · `modo` 19 · `modeHooks` 21 · `placeWalkCam` 31 · `togV` 44 · `startWalk` 46 · `coarse` 58 · `setMode` 61 · `setWalk` 82 · `startFree` 85 · `freeLookAt` 95 · `freeStep` 103 · `aviso` 143 · `walkStep` 148 · `bl` 158 · `walkPointer` 172 · `initWalk` 182 · `hold` 200 · `up` 203 · `jmove` 208 · `jend` 216

### `src/core/weathering.ts`
`WeatherOpts` 5 · `weather` 7

### `src/main.ts`
`cutBg` 38 · `push` 42 · `prep` 52 · `spawnPoint` 64 · `addChar` 69 · `marcarQ` 77 · `escolherClima` 78 · `irParaVista` 79 · `tg` 86 · `rodarCine` 90 · `itemCine` 91 · `encherCine` 97 · `initCinemaUi` 108 · `mostrarPersonagens` 119 · `tocarCena` 123 · `gravarCenaAtual` 137 · `encherMestre` 143 · `alternarImagem` 157 · `initMestreUi` 162 · `toast` 185 · `telaLimpa` 190 · `initAtalhos` 197 · `atualizarSelo` 236 · `congelar` 244 · `escurecer` 248 · `lanterna` 249 · `marcarSom` 250 · `initImersaoUi` 251 · `initUi` 263 · `resz` 296 · `frame` 344 · `captureApi` 366 · `view()` 369 · `third()` 375 · `stats()` 387 · `start` 399

### `src/maps/campo.ts`
`build` 12 · `height` 18

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
`MAPS` 5

### `src/maps/mexico/common.ts`
`lod` 12 · `GRID` 16 · `STREET` 17 · `WALKW` 18 · `CURB` 19 · `BLOCK` 20 · `PLAZA` 21 · `TOWN` 22 · `BLK` 24 · `CHURCH` 26 · `ATRIO` 27 · `CANTINA` 28 · `MARKET` 29 · `PORTAL` 30 · `KIOSCO` 31 · `PANTEON` 32 · `HACIENDA` 33 · `TOWER_W` 34 · `ARROYO` 35 · `ROAD_S` 36 · `Q` 39 · `reseed` 47 · `rnd` 48 · `pick` 49 · `sm` 50 · `FACADE` 53 · `BASE` 54 · `vc` 57 · `makeMats` 59 · `MAT` 86 · `MatKey` 87 · `prep` 92 · `Batch` 107 · `add()` 111 · `box()` 116 · `build()` 122 · `mtx` 144 · `signTexture` 148 · `sign` 164

### `src/maps/mexico/index.ts`
`P` 12 · `VIEWS` 13 · `build` 29 · `inBox` 64 · `free` 65 · `tumble` 108

### `src/maps/mexico/landmarks.ts`
`LightReq` 17 · `LREQ` 18 · `light` 19 · `Landmarks` 21 · `wall` 24 · `rect` 28 · `buildLandmarks` 30 · `later` 41 · `strand` 106 · `sideHoles` 145 · `ret` 183 · `aw` 202 · `pw` 324 · `add` 340 · `outer` 382 · `inner` 388 · `papelTex` 463 · `cut` 468 · `clockTex` 473 · `sigilTex` 484 · `ring` 487 · `ruinTop` 496

### `src/maps/mexico/nature.ts`
`boxDist` 13 · `flatMask` 17 · `roadMask` 27 · `arroyoDepth` 35 · `groundH` 39 · `green` 51 · `colorize` 52 · `ribbed` 58 · `saguaro` 67 · `nopal` 84 · `pad` 87 · `agave` 97 · `rockGeo` 112 · `placeRock` 121 · `Nature` 129 · `buildNature` 132 · `okWild` 166 · `scatter` 167 · `placeGeo` 177 · `tl` 216 · `exported` 233

### `src/maps/mexico/town.ts`
`Facing` 14 · `HouseOpts` 16 · `Town` 22 · `bx()` 38 · `house()` 45 · `block()` 124 · `plane` 139 · `poles()` 163 · `finish()` 194 · `poleLines` 214 · `along` 216

### `tools/assets-leves.mjs`
`size` 19

### `tools/baixar-assets.mjs`
`api` 17 · `fetchJson` 19 · `download` 20 · `sleep` 29 · `want` 30 · `info` 33 · `pick` 45

### `tools/blender/desbastar_arvore.py`
`is_leaf` 22 · `is_foliage` 32 · `thin` 39 · `decimate_all` 109

### `tools/capturas.mjs`
`loadPlaywright` 13 · `img` 87

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

