# Mapa do código

Gerado por `scripts/mapa_do_codigo.py` — rode de novo depois de criar, mover ou mudar arquivos.
Para ler uma função: Read com `offset` = linha e `limit` ≈ 40–80. Não leia arquivos inteiros sem necessidade.

## Pastas pesadas (binários: imagens, modelos, áudio, vídeo) — não abrir

| Pasta | Arquivos | Tamanho |
|---|---|---|
| `src/assets/` | 104 | 73.2 MB |
| `capturas/` | 78 | 12.7 MB |
| `referencias/` | 5 | 2.4 MB |

## Linhas GIGANTES (dados embutidos) — grep sempre com `| cut -c1-200`

| Arquivo | Linha | Tamanho | Início |
|---|---|---|---|
| `legacy/igreja-3d-site.html` | 74 | 823 KB | const IMGS={"dante": "data:image/png;bas |

## Arquivos de texto/código

| Arquivo | Linhas | Tamanho |
|---|---|---|
| `index.html` | 42 | 3 KB |
| `legacy/igreja-3d-site.html` | 620 | 899 KB |
| `legacy/servidor-sync.js` | 26 | 1 KB |
| `server/servidor-sync.mjs` | 114 | 6 KB |
| `src/core/anim.ts` | 124 | 7 KB |
| `src/core/binario.ts` | 21 | 1 KB |
| `src/core/config.ts` | 29 | 1 KB |
| `src/core/engine.ts` | 50 | 2 KB |
| `src/core/glbmap.ts` | 49 | 6 KB |
| `src/core/grass.ts` | 69 | 3 KB |
| `src/core/heightfog.ts` | 43 | 1 KB |
| `src/core/importer.ts` | 44 | 2 KB |
| `src/core/kit.ts` | 134 | 10 KB |
| `src/core/loading.ts` | 31 | 1 KB |
| `src/core/maps.ts` | 67 | 3 KB |
| `src/core/models.ts` | 155 | 8 KB |
| `src/core/net.ts` | 74 | 3 KB |
| `src/core/pbr.ts` | 81 | 3 KB |
| `src/core/post.ts` | 116 | 6 KB |
| `src/core/probe.ts` | 53 | 2 KB |
| `src/core/procedural.ts` | 138 | 8 KB |
| `src/core/sky.ts` | 130 | 8 KB |
| `src/core/state.ts` | 24 | 1 KB |
| `src/core/terrain.ts` | 99 | 5 KB |
| `src/core/tokens.ts` | 185 | 11 KB |
| `src/core/types.ts` | 49 | 2 KB |
| `src/core/vtt.ts` | 100 | 6 KB |
| `src/core/walk.ts` | 110 | 6 KB |
| `src/core/weathering.ts` | 45 | 2 KB |
| `src/main.ts` | 194 | 10 KB |
| `src/maps/campo.ts` | 53 | 4 KB |
| `src/maps/igreja/building.ts` | 232 | 16 KB |
| `src/maps/igreja/common.ts` | 105 | 7 KB |
| `src/maps/igreja/grounds.ts` | 369 | 30 KB |
| `src/maps/igreja/index.ts` | 134 | 7 KB |
| `src/maps/igreja/interior.ts` | 246 | 18 KB |
| `src/maps/manifest.ts` | 9 | 0 KB |
| `src/style.css` | 40 | 4 KB |
| `src/vite-env.d.ts` | 2 | 0 KB |
| `tools/arvores.sh` | 27 | 1 KB |
| `tools/assets-leves.mjs` | 21 | 1 KB |
| `tools/baixar-assets.mjs` | 93 | 5 KB |
| `tools/blender/desbastar_arvore.py` | 151 | 7 KB |
| `tools/capturas.mjs` | 111 | 6 KB |
| `tools/contar-tris.mjs` | 15 | 1 KB |
| `tools/orcamento.sh` | 42 | 2 KB |
| `tools/testar-funcoes.mjs` | 54 | 4 KB |
| `tools/testar-vtt.mjs` | 41 | 4 KB |
| `tools/ver-modelo.mjs` | 25 | 2 KB |
| `tools/visualizador.html` | 32 | 2 KB |
| `vite.config.ts` | 39 | 2 KB |

Outros textos: `.claude/skills/mapa-3d/CATALOGO.md`, `.claude/skills/mapa-3d/SKILL.md`, `CHANGELOG.md`, `CLAUDE.md`, `CREDITS.md`, `README.md`, `capturas/README.md`, `docs/BRIEFING.md`, `docs/HOSPEDAGEM.md`, `docs/NOVO-MAPA.md`, `docs/PROMPT-NOVO-MAPA.md`, `package.json`, `server/package-lock.json`, `server/package.json`, `tools/assets.json`, `tsconfig.json`

## Funções, classes e exports (linha)

### `legacy/igreja-3d-site.html`
`fit` 82 · `mat` 87 · `box` 88 · `cyl` 89 · `jit` 90 · `tex` 91 · `cl` 92 · `sm` 106 · `glass` 107 · `arch` 111 · `inst` 112 · `updEnv` 118 · `setTime` 132 · `buildIgreja` 139 · `haloT` 141 · `halo` 142 · `flat` 149 · `step` 177 · `pewM` 203 · `lace` 246 · `veil` 248 · `roofG` 280 · `car` 282 · `bench` 290 · `dead` 300 · `aoT` 312 · `mistT` 321 · `buildCampo` 352 · `K` 381 · `sizeT` 384 · `placeT` 385 · `makeToken` 389 · `dropT` 399 · `selT` 400 · `setTarget` 401 · `loadMap` 404 · `onPos` 419 · `onChar` 420 · `save` 421 · `netDb` 422 · `netWs` 429 · `snd` 430 · `open` 431 · `wk` 440 · `setM` 443 · `freeSpot` 444 · `end` 455 · `cutBg` 463 · `push` 464 · `prep` 467 · `spawn` 470 · `addChar` 471 · `resz` 475 · `focusT` 487 · `placeWalkCam` 494 · `togV` 495 · `startWalk` 496 · `setWalk` 500 · `walkStep` 502 · `jmove` 515 · `jend` 517 · `fillAreas` 521 · `xcalc` 522 · `xinfo` 523 · `xrender` 524 · `dl` 532 · `setC` 540 · `haloG` 545 · `dressSite` 546 · `fl2` 547 · `mt` 563 · `loadScript` 568 · `buildGlb` 569 · `importGlb` 590 · `importHdr` 595 · `noHdr` 600

### `server/servidor-sync.mjs`
`safe` 29 · `fileOf` 30 · `getRoom` 34 · `evict` 43 · `flush` 48

### `src/core/anim.ts`
`anim` 5 · `WindOpts` 7 · `inject` 26 · `addWind` 38 · `windDepth` 50 · `dustMotes` 59 · `shaftGeo` 92 · `lightShaft` 97

### `src/core/binario.ts`
`fetchBinary` 6

### `src/core/config.ts`
`Quality` 6 · `defaultQuality` 8 · `CFG` 15

### `src/core/engine.ts`
`cv` 6 · `R` 8 · `S` 21 · `cam` 24 · `ctl` 27 · `onResize` 36 · `pixelRatioCap` 38 · `setPixelRatioCap` 39 · `fit` 41

### `src/core/glbmap.ts`
`dressSite` 7 · `fl2` 8 · `mt` 24 · `buildGlb` 27

### `src/core/grass.ts`
`clumpGeometry` 8 · `GrassOpts` 36 · `grassField` 46

### `src/core/heightfog.ts`
`heightFog` 5

### `src/core/importer.ts`
`importGlb` 12 · `importHdr` 25 · `initImporter` 38

### `src/core/kit.ts`
`K` 6 · `begin` 7 · `LI` 10 · `seed` 13 · `rnd` 14 · `mat` 17 · `asMat` 19 · `box` 21 · `cyl` 25 · `flat` 29 · `InstSpec` 34 · `inst` 35 · `PL` 48 · `jit` 54 · `tex` 55 · `cl` 59 · `makeTextures` 61 · `TX` 80 · `sm` 82 · `glassTex` 84 · `GM` 98 · `arch` 100 · `haloTex` 108 · `halo` 114 · `mistTex` 120 · `finishShadows` 128

### `src/core/loading.ts`
`bar` 5 · `txt` 6 · `draw` 8 · `loading` 16 · `waitTextures()` 19

### `src/core/maps.ts`
`newRuntime` 13 · `disposeTree` 23 · `mapHooks` 32 · `loadMap` 34 · `u` 49

### `src/core/models.ts`
`fileFor` 10 · `hasModel` 14 · `litGlass` 17 · `fixMaterials` 21 · `model` 49 · `place` 63 · `Xf` 70 · `instance` 76 · `dequantize` 126 · `instanceVariants` 139 · `modelSize` 150

### `src/core/net.ts`
`NET` 6 · `handlers` 13 · `key` 19 · `netDb` 21 · `netWs` 42 · `snd` 46 · `open` 47 · `startNet` 68

### `src/core/pbr.ts`
`fileFor` 7 · `tex` 11 · `PbrOpts` 23 · `pbr` 41 · `rep` 45

### `src/core/post.ts`
`Grade` 15 · `DEFAULT_GRADE` 18 · `post` 33 · `init()` 39 · `setQuality()` 72 · `setGrade()` 90 · `render()` 105

### `src/core/probe.ts`
`EnvProbe` 7 · `swap` 28 · `update()` 40

### `src/core/procedural.ts`
`rnd` 6 · `stainedGlass` 9 · `pane` 16 · `roseGeometry` 73 · `petal` 75 · `leafGeometry` 98 · `looseePetalGeometry` 106 · `oldPainting` 113

### `src/core/sky.ts`
`Preset` 11 · `PRE` 31 · `hdrUrl` 40 · `loadHdr` 44 · `horizonColor` 58 · `hemi` 69 · `sun` 70 · `dome` 77 · `env` 78 · `setShadowRadius` 80 · `applyHdr` 87 · `driftSky` 96 · `timeHooks` 97 · `setTime` 99 · `preloadSkies` 129

### `src/core/state.ts`
`st` 6

### `src/core/terrain.ts`
`hash` 7 · `noise2` 8 · `fbm` 14 · `TerrainLayer` 16 · `TerrainOpts` 17 · `terrainMaterial` 26 · `makeTerrain` 75

### `src/core/tokens.ts`
`TokenDef` 13 · `Token` 14 · `DEF` 20 · `pick` 28 · `K` 30 · `sizeT` 32 · `placeT` 38 · `makeToken` 45 · `dropT` 66 · `selT` 72 · `setTarget` 77 · `focusT` 81 · `save` 87 · `onPos` 92 · `onChar` 98 · `wk` 104 · `helpers` 109 · `setM` 111 · `freeSpot` 116 · `busy` 118 · `initTokenInput` 127 · `end` 152 · `tickTokens` 172 · `snapTokens` 184

### `src/core/types.ts`
`View` 4 · `Layer` 5 · `VttData` 8 · `MapLight` 17 · `MapRuntime` 20 · `MapModule` 44

### `src/core/vtt.ts`
`fillAreas` 8 · `xcalc` 12 · `xinfo` 19 · `xrender` 21 · `clipPolyline` 49 · `push` 51 · `dd2vtt` 70 · `inb` 72 · `P` 73 · `dl` 87 · `initVtt` 89 · `opt` 93

### `src/core/walk.ts`
`WM` 8 · `placeWalkCam` 18 · `togV` 31 · `startWalk` 33 · `setWalk` 45 · `walkStep` 54 · `bl` 63 · `walkPointer` 76 · `initWalk` 86 · `jmove` 97 · `jend` 105

### `src/core/weathering.ts`
`WeatherOpts` 5 · `weather` 7

### `src/main.ts`
`cutBg` 29 · `push` 33 · `prep` 43 · `spawnPoint` 55 · `addChar` 60 · `initUi` 67 · `resz` 80 · `setC` 97 · `frame` 120 · `captureApi` 138 · `view()` 141 · `third()` 147 · `start` 164

### `src/maps/campo.ts`
`build` 12 · `height` 18

### `src/maps/igreja/building.ts`
`Building` 11 · `buildChurch` 20 · `glassMat` 33 · `wall` 42 · `windowAt` 50

### `src/maps/igreja/common.ts`
`FLOOR` 7 · `NX` 8 · `WT` 9 · `WH` 10 · `TOP` 11 · `RISE` 12 · `LOFT` 13 · `LOFT_Z` 14 · `WIN_Z` 15 · `WIN` 16 · `DOOR` 17 · `TOWER` 18 · `M` 21 · `iron` 41 · `brass` 42 · `velvet` 43 · `bx` 47 · `mesh` 48 · `cube` 52 · `pointedArch` 57 · `roundArch` 69 · `circle` 75 · `shift` 78 · `Hole` 80 · `wallGeo` 85 · `frameGeo` 92 · `panelGeo` 99

### `src/maps/igreja/grounds.ts`
`FENCE` 15 · `PATH` 16 · `PARK` 17 · `SHED` 18 · `GAZEBO` 19 · `GRAVE` 20 · `rnd` 23 · `sm` 24 · `Grounds` 32 · `groundH` 35 · `buildGrounds` 43 · `addLight` 50 · `inCorridor` 57 · `free` 62 · `underTree` 84 · `groundMask` 98 · `grassAllow` 111 · `grassTall` 119 · `garland` 165 · `puddle` 175 · `bar` 186 · `rail` 193 · `mk` 305 · `pbr2` 367

### `src/maps/igreja/index.ts`
`P` 16 · `VIEWS` 17 · `build` 27 · `tokens` 87 · `isIn` 133

### `src/maps/igreja/interior.ts`
`PEW` 11 · `CHANCEL` 12 · `Interior` 14 · `Flowers` 17 · `push()` 21 · `bunch()` 25 · `scatterPetals()` 37 · `build()` 40 · `mk` 41 · `pewGeometry` 53 · `add` 55 · `buildInterior` 76

### `src/maps/manifest.ts`
`MAPS` 5

### `tools/assets-leves.mjs`
`size` 19

### `tools/baixar-assets.mjs`
`api` 17 · `fetchJson` 19 · `download` 20 · `sleep` 29 · `want` 30 · `info` 33 · `pick` 45

### `tools/blender/desbastar_arvore.py`
`is_leaf` 22 · `is_foliage` 32 · `thin` 39 · `decimate_all` 109

### `tools/capturas.mjs`
`loadPlaywright` 13 · `img` 85

### `tools/orcamento.sh`
`opt` 9

### `tools/testar-vtt.mjs`
`inside` 26

### `vite.config.ts`
`binariosComoJs` 9 · `load()` 12

