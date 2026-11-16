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
4. Se o repositório não estiver indexado ou o Graphify não estiver disponível, avise o usuário em uma linha e siga com a busca normal (grep/Read).
Para indexar um repositório: ligar em Repositories em https://app.graphify.com (plano gratuito: até 3 repositórios ao mesmo tempo).
