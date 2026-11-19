# Instruções para o Claude

## Economizar limite e se achar rápido (IMPORTANTE)
1. **Comece por `docs/MAPA_DO_CODIGO.md`**: ele lista cada arquivo de código e cada função/classe com o número da linha, e aponta as pastas pesadas e as linhas gigantes.
2. Leia só o trecho necessário: Read com `offset` = linha do mapa e `limit` ≈ 40–80. Evite ler arquivos inteiros.
3. Buscas: Grep restrito às pastas de código (use `glob`/`path`), e no shell sempre com `| cut -c1-200`. Nunca busque nem abra as pastas pesadas listadas no mapa, nem `package-lock.json`.
4. O Graphify já está indexado (desde 19/11/2026, branch `main`): use-o para estrutura (quem chama, impacto); para "onde fica", o mapa já basta.
5. Depois de criar, mover ou mudar código, rode `python3 -I scripts/mapa_do_codigo.py` e inclua o mapa atualizado no commit.
- Neste repositório: `src/assets/` (modelos .glb, texturas e HDRI), `capturas/` e `referencias/` são imagens — não abra. `legacy/igreja-3d-site.html` tem uma linha de 823 KB com imagens embutidas: nunca leia esse arquivo inteiro, e todo grep nele deve ser cortado. `src/assets-lite/`, `dist*/` e `.cache/` são gerados (ignorados pelo git).

## Graphify (usar sempre)
Indexado desde 19/11/2026 (`Tyzk13/MAPAS`, branch `main`; cada push na `main` reindexa). Ignore resultados em `legacy/` (código antigo).
Use as ferramentas do **Graphify** (MCP `Graphify`) em 100% das tarefas de código deste repositório, antes de grep/busca de arquivos:
1. No início, chame `list_repositories` e confira se este repositório está indexado (`queryable: true`). Use o owner/name do `git remote get-url origin` como `repository_id`.
2. Onde algo é definido → `graphify_find`. Como algo funciona → `query_graph`. Quem chama → `graphify_callers`. Impacto de uma mudança → `graphify_impact` (com `include_risk=true`) **antes de editar**. Testes ligados → `graphify_tests_for`. Dependências de um arquivo → `graphify_file_neighbors`.
3. Se o `commitSha` do resultado for igual ao `git rev-parse HEAD`, use a resposta direto. Se for diferente, leia os arquivos que mudaram desde então.
4. Se o repositório não estiver indexado ou o Graphify não estiver disponível, avise o usuário em uma linha e siga com o `docs/MAPA_DO_CODIGO.md` + leitura por trecho.
Para indexar um repositório: ligar em Repositories em https://app.graphify.com (plano gratuito: até 3 repositórios ao mesmo tempo).

## Projeto (mapas 3D de RPG de terror)
Antes de trabalhar, leia: `docs/HISTORICO.md` (decisões, preferências do dono, estado atual, links),
a skill `mapa-3d` (receitas, erros a evitar, interface pronta) e `docs/GUIA-DO-MESTRE.md` (como ele usa na mesa).

Regras fixas:
- **Nunca comprar nada sem perguntar.** Assets gratuitos CC0 podem ser baixados à vontade; registre em `CREDITS.md`.
- **Maior qualidade possível**, mas rodando liso (60 fps no PC, 30+ no celular). Meça com `node tools/medir.mjs`.
- O dono pede pacotes inteiros ("pode colocar tudo, nem precisa perguntar"): faça, teste, publique e relate.
- Imagens de moradores/jogadores/criaturas de Greywater ficam em `npcs-local/` (fora do git). Sem essa pasta,
  **não republique** os links (o build perderia as imagens).
- Idioma: português do Brasil (interface, comentários, commits e docs).
- Para criar/mudar mapas **ou a interface**, use a skill `mapa-3d` (`.claude/skills/mapa-3d/`) e leia `docs/NOVO-MAPA.md`.
  Não reescreva o núcleo (`src/core/`) para atender um mapa. Como o dono usa tudo na mesa: `docs/GUIA-DO-MESTRE.md`.
- Antes de começar: `git fetch` e `git branch -a` (outras sessões deixam trabalho em branches e na `main`).
- Antes de commitar: `npm run typecheck`. Mudou o servidor → `npm run test:servidor`.
  Mudou interface/carregamento/câmera → `npm run test:funcoes` (lento, ~10 min sem placa de vídeo). Mudou paredes/portas/luzes → `npm run test:vtt`.
- Mudança visual: rode capturas (`npm run capturas -- <rótulo> --q=baixa --w=960 --h=540` para iterar) e olhe as imagens.
- **Tudo o que aprender** (erros, truques, decisões e preferências do dono) vai para a skill `mapa-3d` (`.claude/skills/mapa-3d/SKILL.md`) no mesmo commit.
- Registre mudanças em `CHANGELOG.md`. Assets novos só CC0 (ou licença conferida) com crédito em `CREDITS.md`.
- Terminou uma rodada de interface/mapa → publique nos três links do claude.ai (passos e cuidados na skill) e mande os links (ele abre pelo celular).
- Terror sutil por padrão (luz, névoa, abandono): sem gore nem sobrenatural explícito, a não ser que o dono peça (em Greywater ele pediu criaturas, ocultas até a aparição).
- O que for aprendido vai para o repositório (skill e `docs/HISTORICO.md`), não fica só na conversa.
