# Instruções para o Claude

## Graphify (usar sempre)
Use as ferramentas do **Graphify** (MCP `Graphify`) em 100% das tarefas de código deste repositório, antes de grep/busca de arquivos:
1. No início, chame `list_repositories` e confira se este repositório está indexado (`queryable: true`). Use o owner/name do `git remote get-url origin` como `repository_id`.
2. Onde algo é definido → `graphify_find`. Como algo funciona → `query_graph`. Quem chama → `graphify_callers`. Impacto de uma mudança → `graphify_impact` (com `include_risk=true`) **antes de editar**. Testes ligados → `graphify_tests_for`. Dependências de um arquivo → `graphify_file_neighbors`.
3. Se o `commitSha` do resultado for igual ao `git rev-parse HEAD`, use a resposta direto. Se for diferente, leia os arquivos que mudaram desde então.
4. Se o repositório não estiver indexado ou o Graphify não estiver disponível, avise o usuário em uma linha e siga com a busca normal (grep/Read).
Para indexar um repositório: ligar em Repositories em https://app.graphify.com (plano gratuito: até 3 repositórios ao mesmo tempo).
