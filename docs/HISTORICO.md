# Histórico do projeto e lições aprendidas

Resumo da conversa em que a igreja foi criada (nov/2026), para que a próxima sessão não precise redescobrir nada.

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
- Repositório oficial dos mapas: **Tyzk13/MAPAS** (sem a pasta de vídeos). `Tyzk13/3d` foi o repositório inicial.
  Fluxo usado: branch `mapa-igreja` → PR → o dono clica em Merge.

## Estado atual

- Mapa `igreja` completo (exterior com jardim, gazebo, estacionamento, floresta; interior com nave,
  altar, coro, lustres, velas, vitrais) e mapa `campo` de exemplo.
- 5 climas (terror, anoitecer, crepúsculo, nublado, noite) com HDRI próprio e gradação de cor.
- Qualidades Baixa/Média/Alta + resolução adaptativa automática.
- Desempenho: fora da igreja 12,6 M → 4,7 M triângulos e 3115 → 1162 chamadas; dentro 11,6 M → 0,6 M.
- Versão para celular publicada como página no claude.ai: https://claude.ai/artifact/65XS5FnzDBvfneK5AnFXUh
- Pendente: o dono relatou "a igreja não está carregando" no celular. Não foi reproduzido (funciona na
  emulação de Pixel 7 e no visualizador real). Erros agora aparecem na tela; peça modelo do aparelho
  e captura da tela caso volte a acontecer. Opção oferecida: versão ainda mais leve para celular.

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

Os detalhes técnicos de cada passo estão no `CHANGELOG.md`; os erros e receitas, na skill.
