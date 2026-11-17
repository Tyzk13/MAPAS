# Instruções para o Claude

## Economizar limite e se achar rápido (IMPORTANTE)
1. **Comece por `docs/MAPA_DO_CODIGO.md`**: ele lista cada arquivo de código e cada função/classe com o número da linha, e aponta as pastas pesadas e as linhas gigantes.
2. Leia só o trecho necessário: Read com `offset` = linha do mapa e `limit` ≈ 40–80. Evite ler arquivos inteiros.
3. Buscas: Grep restrito às pastas de código (use `glob`/`path`), e no shell sempre com `| cut -c1-200`. Nunca busque nem abra as pastas pesadas listadas no mapa, nem `package-lock.json`.
4. Quando o Graphify estiver indexado, use-o para estrutura (quem chama, impacto); para "onde fica", o mapa já basta.
5. Depois de criar, mover ou mudar código, rode `python3 -I scripts/mapa_do_codigo.py` e inclua o mapa atualizado no commit.
- Neste repositório: `src/assets/` (73 MB de modelos .glb, texturas e HDRI), `capturas/` e `referencias/` são imagens — não abra. `legacy/igreja-3d-site.html` tem uma linha de 823 KB com imagens embutidas: nunca leia esse arquivo inteiro, e todo grep nele deve ser cortado.

## Graphify (usar sempre)
Use as ferramentas do **Graphify** (MCP `Graphify`) em 100% das tarefas de código deste repositório, antes de grep/busca de arquivos:
1. No início, chame `list_repositories` e confira se este repositório está indexado (`queryable: true`). Use o owner/name do `git remote get-url origin` como `repository_id`.
2. Onde algo é definido → `graphify_find`. Como algo funciona → `query_graph`. Quem chama → `graphify_callers`. Impacto de uma mudança → `graphify_impact` (com `include_risk=true`) **antes de editar**. Testes ligados → `graphify_tests_for`. Dependências de um arquivo → `graphify_file_neighbors`.
3. Se o `commitSha` do resultado for igual ao `git rev-parse HEAD`, use a resposta direto. Se for diferente, leia os arquivos que mudaram desde então.
4. Se o repositório não estiver indexado ou o Graphify não estiver disponível, avise o usuário em uma linha e siga com o `docs/MAPA_DO_CODIGO.md` + leitura por trecho.
Para indexar um repositório: ligar em Repositories em https://app.graphify.com (plano gratuito: até 3 repositórios ao mesmo tempo).

## Contexto do projeto e regras do dono
Mapas 3D para RPG de mesa (Ordem Paranormal, terror realista **sutil**). Vite + TypeScript + three.js r187.

Antes de trabalhar em mapas, leia:
1. `docs/HISTORICO.md`: decisões, preferências do dono, estado atual e lições da criação da igreja.
2. Skill `mapa-3d` (`.claude/skills/mapa-3d/SKILL.md`): fluxo, receita visual, erros a evitar, desempenho, entrega no celular.
3. `.claude/skills/mapa-3d/CATALOGO.md`: assets CC0 já testados.
4. `docs/NOVO-MAPA.md` (criar um mapa) e `docs/HOSPEDAGEM.md` (publicar, celular, servidor).

Regras fixas:
- Interface e textos em **português (BR)**.
- **Nunca comprar nada sem perguntar.** Assets gratuitos CC0 podem ser baixados à vontade; registre todos em `CREDITS.md`.
- Sem sangue, monstros visíveis ou sobrenatural explícito; o terror vem da luz, névoa e abandono.
- **Maior qualidade possível**, mas rodando liso (60 fps no PC, 30+ no celular). Meça com `node tools/medir.mjs` antes e depois.
- Commits pequenos; `CHANGELOG.md` atualizado; capturas (`npm run capturas`) a cada etapa visual.
- Ao terminar, entregue o link/arquivo para o dono ver (ele costuma abrir pelo celular).
- O que for aprendido vai para o repositório (skill, `docs/HISTORICO.md`), não fica só na conversa.

Verificação antes de entregar: `npm run build`, `node tools/testar-funcoes.mjs`, `node tools/testar-vtt.mjs`.
