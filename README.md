# Mapa 3D de tabletop — Igreja (Ordem Paranormal)

Mapa 3D interativo no navegador para RPG de mesa: igreja preparada para um casamento, terreno amplo,
vários jogadores vendo a mesma cena e exportação para mesa virtual (Universal VTT).

## Comandos

```bash
npm install
npm run dev            # servidor local com recarga automática (http://localhost:5173)
npm run build          # gera dist/ (vários arquivos, para hospedar com cache)
npm run build:single   # gera dist-single/index.html (tudo num HTML só)
npm run capturas -- <rótulo>   # capturas automáticas em capturas/<data>-<rótulo>/
npm run assets         # baixa/otimiza os assets de tools/assets.json (Poly Haven, CC0)
npm run servidor       # servidor de sincronização local (ver server/ e docs/HOSPEDAGEM.md)
node tools/testar-vtt.mjs      # exporta todas as áreas para .dd2vtt e gera prévias com paredes/portas/luzes
```

Documentação: [`docs/NOVO-MAPA.md`](docs/NOVO-MAPA.md) (como criar mapas) ·
[`docs/HOSPEDAGEM.md`](docs/HOSPEDAGEM.md) (deploy, iframe, CSP, servidor) · [`CREDITS.md`](CREDITS.md) (licenças).

Medidor de desempenho: abra com `?fps=1`. Qualidade: botão **Qualidade** ou `?q=baixa|media|alta`
(Baixa = celular: sem AO, sombras 1024, menos vegetação; Alta = profundidade de campo, sombras 4096).

Capturas: 5 câmeras (Cinema, Fachada, Altar, Coro, 3ª pessoa) × 2 climas (Terror, Anoitecer), mais uma
folha comparando com `referencias/`. Opções: `--only=cinema,altar`, `--times=0,1,4`, `--q=baixa|media|alta`,
`--w=1920 --h=1080`, `--png`, `--map=campo`.

## Parâmetros de URL

`?room=nome` · `?map=igreja|campo` · `?time=0..4` · `?ui=0` (sem interface) · `?ro=1` (só ver) · `?walk=1` ·
`?chars=0` (sem personagens) · `?ws=wss://servidor` · `?q=baixa|media|alta` (qualidade gráfica).

Página que incorpora (iframe): `postMessage({cmd:'map',id:'campo'})` e `postMessage({cmd:'time',i:2})`;
a página avisa `{evt:'ready', maps:[...]}`.

## Estrutura

```
index.html            interface (botões, painéis, tela de carregamento)
src/main.ts           entrada: interface, laço, API de captura
src/core/             núcleo: engine (render/câmera), sky (céu, climas), post (pós-processamento),
                      kit (formas, texturas), tokens (personagens), walk (caminhar), net (rede),
                      vtt (exportação), maps (carregar mapas), importer/glbmap (importar .glb/.hdr)
src/maps/             um arquivo por mapa + manifest.ts (lista de mapas)
src/assets/           tokens, texturas, modelos, HDRIs
tools/                capturas automáticas, scripts de assets e Blender
server/               servidor de sincronização (WebSocket)
legacy/               HTML original de referência (não é mais usado)
docs/                 briefing e guias
```
