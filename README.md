# Mapa 3D de tabletop — Igreja (Ordem Paranormal)

Mapa 3D interativo no navegador para RPG de mesa: igreja preparada para um casamento, terreno amplo,
vários jogadores vendo a mesma cena e exportação para mesa virtual (Universal VTT).
Feito com Vite + TypeScript + three.js r187, assets CC0 (Poly Haven) e pós-processamento estilo jogo.

## Começar

Precisa de Node 20.19+ (recomendado 22, ver `.nvmrc`).

```bash
npm install
npm run dev            # servidor local com recarga automática (http://localhost:5173)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | desenvolvimento com recarga automática |
| `npm run build` | confere os tipos e gera `dist/` (vários arquivos, para hospedar com cache) |
| `npm run build:leve` | `dist-lite/`: texturas 512 px e árvores simplificadas; modelos/céus como `.js` (celular, claude.ai) |
| `npm run build:single` | `dist-single/index.html`: tudo num HTML só |
| `npm run typecheck` | só confere os tipos (TypeScript) |
| `npm test` | tipos + servidor de sincronização + teste de funções no navegador (~7 min sem GPU) |
| `npm run test:servidor` | teste do servidor (salas, só-leitura, validação, persistência) |
| `npm run test:funcoes` | abre a página num iframe, caminha, troca clima/mapa, confere erros |
| `npm run test:vtt` | exporta todas as áreas para `.dd2vtt` e gera prévias em `capturas/vtt/` |
| `npm run capturas -- <rótulo>` | capturas automáticas em `capturas/<data>-<rótulo>/` |
| `npm run assets` | baixa/otimiza os assets de `tools/assets.json` (Poly Haven, CC0) e atualiza `CREDITS.md` |
| `npm run servidor` | servidor de sincronização local (ver `docs/HOSPEDAGEM.md`) |

Capturas: 5 câmeras (Cinema, Fachada, Altar, Coro, 3ª pessoa) × 2 climas (Terror, Anoitecer), mais uma
folha comparando com `referencias/`. Opções: `--only=cinema,altar`, `--times=0,1,4`, `--q=baixa|media|alta`,
`--w=1920 --h=1080`, `--png`, `--map=campo`.

O CI do GitHub (`.github/workflows/ci.yml`) roda tipos, builds e o teste do servidor a cada push.

## Documentação

- [`docs/NOVO-MAPA.md`](docs/NOVO-MAPA.md) — como criar um mapa (módulo, manifesto, efeitos prontos, convenções)
- [`docs/PROMPT-NOVO-MAPA.md`](docs/PROMPT-NOVO-MAPA.md) — modelo de pedido para o Claude criar um mapa
- [`docs/HOSPEDAGEM.md`](docs/HOSPEDAGEM.md) — deploy, iframe, CSP, servidor (Render, Fly.io, VPS, Docker)
- [`docs/VTT.md`](docs/VTT.md) — exportar e importar no Foundry, Roll20 e outras mesas
- [`docs/BRIEFING.md`](docs/BRIEFING.md) — briefing original e direção de arte
- [`CHANGELOG.md`](CHANGELOG.md) · [`CREDITS.md`](CREDITS.md) (licenças dos assets)

## Controles

O dock na parte de baixo tem: **modo de câmera** (Órbita · Caminhar · Livre), menus **Vista**, **Clima** e **Mapa**
(mostram todas as opções, com a atual marcada), **Personagens** (novo, mostrar, grade, resetar) e **Mais**
(qualidade, camadas, exportar VTT, importar 3D, tela cheia, atalhos). No celular ele vira duas linhas e os menus
abrem como folha inferior.

| Modo | Controles |
|---|---|
| Órbita | arrastar: girar · roda/pinça: zoom · botão direito/dois dedos: mover · arraste os personagens (setas movem o selecionado) |
| Caminhar | WASD/setas: andar · arrastar: olhar · Shift: correr · V: 1ª/3ª pessoa · joystick no celular |
| Câmera livre | WASD: mover para onde olha · arrastar: olhar · Q/E ou Espaço: descer/subir · Shift: rápido · roda: velocidade · G: atravessar paredes · joystick e ▲▼ no celular |
| Geral | Esc: volta para a órbita · menu Vista leva a câmera (ou a câmera livre) para pontos prontos |

## Parâmetros de URL

| Parâmetro | Efeito |
|---|---|
| `?room=nome` | sala (jogadores na mesma sala veem o mesmo) |
| `?map=igreja\|campo` | mapa inicial |
| `?time=0..4` | clima: Terror, Anoitecer, Crepúsculo, Nublado, Noite |
| `?q=baixa\|media\|alta` | qualidade gráfica (padrão: Média no desktop, Baixa no celular) |
| `?ui=0` · `?ro=1` · `?walk=1` · `?chars=0` | sem interface · só ver · começar caminhando · sem personagens |
| `?ws=wss://servidor` · `?key=chave` | servidor de sincronização e chave de edição |
| `?fps=1` | medidor: FPS, chamadas de desenho, triângulos e resolução atual |
| `?auto=0` | desliga a resolução adaptativa |

**Resolução adaptativa:** se o FPS ficar abaixo de ~40, a resolução interna cai em passos até 50%; quando
sobra folga (acima de ~57 FPS por alguns segundos), volta a subir. Não afeta as capturas.

Página que incorpora (iframe): `postMessage({cmd:'map',id:'campo'})` e `postMessage({cmd:'time',i:2})`;
a página avisa `{evt:'ready', maps:[...]}`.

## Estrutura

```
index.html            interface (botões, painéis, tela de carregamento)
src/main.ts           entrada: interface, laço, API de captura
src/core/             núcleo: engine (render/câmera), sky (céu, climas), post (pós-processamento),
                      desempenho (resolução adaptativa), kit (formas, texturas), tokens (personagens),
                      walk (caminhar), net (rede), vtt (exportação), maps (carregar mapas),
                      importer/glbmap (importar .glb/.hdr), models/pbr/terrain/grass (assets e cenário)
src/maps/             um arquivo (ou pasta) por mapa + manifest.ts (lista de mapas)
src/assets/           tokens, texturas, modelos, HDRIs
tools/                capturas, testes, scripts de assets e Blender
server/               servidor de sincronização (WebSocket) + Dockerfile + teste
capturas/             rodadas de capturas versionadas (evolução visual)
referencias/          imagens de referência da direção de arte
legacy/               HTML original de referência (não é mais usado)
docs/                 briefing e guias
.claude/skills/       skill mapa-3d (fluxo e catálogo de assets para o Claude Code)
```
