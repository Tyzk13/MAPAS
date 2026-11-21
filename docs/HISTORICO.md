# Histórico do projeto e lições aprendidas

Resumo das conversas que construíram o projeto (nov/2026), para que a próxima sessão não precise redescobrir nada.
Como usar tudo na mesa: `docs/GUIA-DO-MESTRE.md`. Receitas e erros técnicos: skill `mapa-3d`. Detalhes: `CHANGELOG.md`.

## Pedido original (`docs/BRIEFING.md`)

Mapa 3D de uma igreja preparada para um casamento, em clima de terror sutil, para usar na mesa.
Etapas: A (projeto Vite/TS e capturas), B (visual de jogo: pós, luz, PBR, modelos CC0), C (assets e
desempenho, qualidades, tela de carregamento), D (exportação VTT `.dd2vtt`), E (servidor de sincronia
com salas), F (arquitetura para novos mapas + `docs/NOVO-MAPA.md`). Todas foram feitas.

## Preferências do dono (vale para os próximos mapas)

- Autorizou baixar e mudar tudo para ganhar qualidade ("permito tudo"), **menos comprar**: comprar só perguntando.
- Quer **máxima qualidade** e **animações sutis nativas** (vento nas plantas, chamas tremendo, lustre
  balançando, poeira, névoa à deriva). Para isso não precisa perguntar, é só fazer.
- Depois reclamou que a igreja "lagava": qualidade igual, mas **lisa**. Desempenho é requisito, não extra.
- Abre os resultados **pelo celular**, então sempre entregue um link que funcione lá (ver "Celular" abaixo).
- Quer que o aprendizado fique no repositório (skill + este arquivo).
- **"Pode já colocar tudo, nem precisa perguntar"**: quando pede melhorias/ideias, quer o pacote inteiro feito,
  testado e publicado; as próximas ideias vêm sugeridas no fim. Escreve curto e informal (ex.: "caminhão" = Caminhar).
- Joga com **dois monitores**: um com a janela do mestre (controla câmera e personagens), outro com a **tela dos
  jogadores** (TV/transmissão). Nenhuma informação de mestre pode aparecer na tela dos jogadores.
- Muitas vezes joga **sem internet**, com o arquivo offline (HTML único) — ver "Arquivo offline" abaixo.
- Terror **sutil** por padrão; em Greywater ele mesmo pediu criaturas explícitas (só lá, e ocultas até a aparição).
- Repositório oficial dos mapas: **Tyzk13/MAPAS** (sem a pasta de vídeos). `Tyzk13/3d` foi o repositório inicial.
  Fluxo usado: branch `mapa-igreja` → PR → o dono clica em Merge.

## Estado atual (17/nov/2026)

- Mapas: `igreja` (casamento), `mexico` (San Judas de las Ánimas), `texas` (Harlow, O Caso Whitlock — abre na
  delegacia), `canada` (Greywater Falls, Ontário, 1975 — O Caso Ashdown, hotel de 3 andares) e `campo` (exemplo).
- 5 climas com HDRI e gradação; qualidades Baixa/Média/Alta + resolução adaptativa; versão leve para celular.
- Mesa: câmera livre e de cinema (Suave/Corte/Susto, legenda, Revelar), cenas como slides, tela limpa, janela dos
  jogadores (2º monitor, botão TV/tecla J), congelar/escurecer, luz que cai, névoa, lanterna, relâmpago, som
  gerado na hora (ambiente, no lugar, sons do mestre), imagens para os jogadores, personagem oculto com aparição
  sinistra, fichas vivas, "onde está cada um", lupa de documentos, pistas com tradução, notas do mestre por vista.
- Links publicados (os três têm todos os mapas): Igreja https://claude.ai/artifact/65XS5FnzDBvfneK5AnFXUh ·
  San Judas https://claude.ai/artifact/55cVSvDE5dfVtg2Km2iR9K · Harlow https://claude.ai/artifact/HHBUeQ8noXrMfhqAK6Q1PB ·
  Greywater Falls https://claude.ai/artifact/19Taut7URvhL67RnSA4MHg (criado em 18/11/2026; abre em `canada`) ·
  Barud https://claude.ai/artifact/UpjK4X8KJrYW5LefuSuPUF (Tormenta 20; abre em `barud`) ·
  Sul de Arton https://claude.ai/artifact/Dzxp7GFmcpc2X9SXJP2VYZ (Tormenta 20, mapa da região; abre em `arton`) ·
  Valkaria https://claude.ai/artifact/YbkzUfCSscusfBzCY1BdN4 (Tormenta 20, criado em 21/11/2026; abre em `valkaria`) ·
  Tiberus https://claude.ai/artifact/2gjg6BwHPHdkpzKqHoM72c (Tormenta 20, criado em 21/11/2026; abre em `tiberus`)
- **Imagens locais**: moradores/jogadores/criaturas de Greywater ficam em `npcs-local/` (fora do git, repositório
  público). Uma sessão sem essa pasta **não deve republicar** os links (o build perderia essas imagens); a skill
  diz como refazê-las. Os links atuais foram publicados por uma sessão que tinha as imagens.
- Pendências: manchas brancas/pretas em algumas placas (painel F9 para descobrir a causa com o dono); nomes dos
  jogadores 1 e 2 de Greywater; o relato antigo "a igreja não carrega no celular" não se repetiu.
- Branches: o trabalho de cada sessão fica numa branch (`ccr-…`, `mapa-igreja`); a `main` recebe por PR, que o
  dono aprova. Antes de começar, `git fetch` e junte o que existir.

## Ambiente de trabalho (sessões na nuvem)

- Ambiente "3d" com rede liberada para Poly Haven, ambientCG e blender.org.
- Blender 4.5 baixado em `/opt/blender-dl/blender-4.5.15-linux-x64/blender` (some quando o contêiner
  é recriado: baixe de novo de download.blender.org se precisar de `tools/arvores.sh`).
- `fetch` do Node precisa de `NODE_USE_ENV_PROXY=1` (já embutido em `npm run assets`).
- Playwright/Chromium já vêm instalados; `tools/capturas.mjs` usa um build de produção próprio.

## Celular e páginas do claude.ai (lições)

- O claude.ai recusa arquivos `.glb`/`.hdr` (erro 415). `npm run build:leve` empacota-os como `.js`
  em base64 (`core/binario.ts` carrega dos dois jeitos).
- Para publicar como página do claude.ai, a pasta precisa estar dentro do scratchpad da sessão.
- O HTML único (~29 MB) não abre na prévia do app de celular: mande o **link da página publicada**.
- Celulares antigos podem não renderizar em meia-precisão: `post.ts` cai para 8 bits sozinho.
- Qualquer erro de carregamento aparece na tela (`core/loading.ts`) e há aviso de perda da placa de
  vídeo (`webglcontextlost`); antes a tela travava na barra de carregamento sem explicação.
- Verifique a versão leve no emulador de página do claude.ai e numa emulação de celular antes de entregar.

## Linha do tempo resumida

1. Etapa A: migração do HTML único (three r128) para Vite/TS r187; script de capturas.
2. Etapa B: pós-processamento, HDRIs, PBR, igreja reconstruída, árvores e props da Poly Haven
   (árvores reduzidas no Blender de 1–4 M para ≤ 40 k faces).
3. Animações sutis, mais detalhes (rosas, quadros, varais de luz, poças, névoa).
4. Etapas C–F: qualidades, carregamento, VTT, servidor, docs de novo mapa.
5. Skill `mapa-3d` + catálogo + modelo de prompt (`docs/PROMPT-NOVO-MAPA.md`).
6. Mudança para Tyzk13/MAPAS (PR #1).
7. Otimização de desempenho com o mesmo visual + correções para celular (PR #2).

8. Mapa San Judas de las Ánimas (México).
9. Organização: resolução adaptativa, servidor endurecido + Docker + teste, CI, docs (VTT, hospedagem).
10. Câmera livre, dock novo, câmera de cinema para a sala, tela limpa, atalhos; sai o modo Caminhar.
11. Janela dos jogadores (2º monitor), imersão (congelar, escurecer, lanterna, relâmpago, som), painel Mestre
    (cenas, luz que cai, névoa, sons do mestre e no lugar, imagens, personagem oculto).
12. Harlow, Texas: delegacia cheia de pistas, lupa de documentos, notas do mestre, floresta de Cedar Hollow, NPCs.
13. Greywater Falls, Ontário: hotel de 3 andares, moradores com as aparências do dono, aparição do vilão, fichas
    vivas, botão TV, diagnóstico F9, arquivo offline.
14. Mapa do código + Graphify (`main`); tudo juntado numa branch, com este histórico e o guia do mestre.
15. Climas corrigidos (Noite azul-lunar, `skyTint`, trava de cor por bits, luz ambiente sem a lua do HDRI), arquivo
    offline lembra posições, menu de mapas por sistema.
16. **Barud** (Tormenta 20): cidade murada com interiores, painel Locais com fichas e segredos, NPCs minotauros.
17. Barud ganha a **Mata dos Chifres**: floresta sombria fora das muralhas com trilha, forca, cabana e círculo de pedras.
18. Graphify passa a indexar `Tyzk13/MAPAS` (índice da `main`); PR #3 juntou Barud, a mata e os climas na `main`.
19. **Sul de Arton** (Tormenta 20): mapa regional em relevo com miniaturas, 12 interiores, teleporte e distâncias.
20. Sul de Arton mais bonito e vivo; **Desempenho** no menu (limite de quadros, mestre leve com a TV, economia parado, modo leve).
21. **Cidades do Sul de Arton** com planta de verdade (ruas, muralhas com portões onde chegam as estradas, praças,
    prédios com nome; Barud igual ao mapa detalhado); alfinetes e rotas somem de perto. Pedido do dono: "com o
    cuidado de Barud, detalhes dentro e não só casas jogadas".
22. Casas, tavernas (placa, lampião), catedrais (contrafortes, vitrais, duas torres) e interiores mais caprichados;
    masmorra de Azazel com abóbada, poças, correntes, ossadas e névoa.
23. Mecânicas (personagens andam, câmera por teclado/duplo clique, zoom para o mouse, clima com transição) e o
    povo de Arton (folhas de personagens do dono recortadas em `npcs-local/arton/`, ~150 NPCs pelos lugares).
24. **Cidades maiores** ("aumentar as cidades como em Barud"): escala por cidade em `ESCALA_CID` (geo.ts), plantas
    com mais ruas, bairros e marcos, ruas de quarteirão que param nos prédios (`ruaLivre`), cemitérios (terror sutil).
25. **Entrar em Barud pelo Sul de Arton** (o dono queria o mapa de Barud dentro da região: "era esse nível que eu
    queria"): passagem entre mapas no núcleo (`core/passagem.ts`). Próximo passo pedido: as outras cidades nesse nível.
26. **Valkaria em escala de gente** (`src/maps/valkaria/`): a primeira cidade além de Barud no nível do mapa detalhado
    (deusa, palácio, catedral, academia, mercado, 9 prédios com interior, fichas, NPCs, passagem com a região).
    Próximas, na ordem que o dono pedir: Tiberus, Nova Malpetrim, Giluk, Nimbarann, Porto de Deheon.
27. Pedido do dono: **cada cidade, masmorra e lugar importante como um mapa próprio no nível de Barud**, um por vez,
    melhorando muito. Ordem combinada: Tiberus (feito, com o kit `src/maps/gente/`), Nova Malpetrim, Giluk, Masmorra
    de Azazel, Nimbarann, Porto de Deheon e os outros lugares (cavernas, Catedral de Gelo, Asidon, Korl…).
28. Relato com print: **Barud de noite com telhados e muralhas brancos**. Era o luar extra das cidades (7 na Noite);
    agora é `LUAR(p)` em `barud/common.ts` (3,5), comum a Barud, Valkaria e Tiberus, e a chave "Luz do céu" do F9
    também o desliga. O dono escolheu **três protagonistas** (artes dele): aguardam os arquivos para virarem os
    jogadores 1–3 dos mapas de Tormenta 20 (só em `npcs-local/`, fora do git).
29. "A TV para os jogadores não funciona": ligação direta (postMessage) entre a janela do mestre e a da TV além do
    BroadcastChannel; o botão também tenta abrir no claude.ai. As imagens dos protagonistas mandadas no meio de uma
    tarefa não ficaram salvas no servidor — pedir de novo numa mensagem própria.
30. Pedido: **"um mapa só floresta bem detalhada"** → Floresta Sombria (`src/maps/floresta/`), link próprio.

## Arquivo offline (como o dono joga sem internet)

`npm run build:single` e inserir `<script>window.MAPA_PADRAO="canada"</script>` depois do `</title>` → arquivo
único (~52 MB com as imagens locais). Abra no navegador do PC e use os dois monitores normalmente (a ligação entre
as janelas é local, não precisa de internet).

Os detalhes técnicos de cada passo estão no `CHANGELOG.md`; os erros e receitas, na skill.
