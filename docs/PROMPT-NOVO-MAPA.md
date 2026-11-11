# Prompt para pedir um mapa novo

Neste repositório a skill `mapa-3d` (`.claude/skills/mapa-3d/`) é carregada sozinha pelo Claude Code.
Basta descrever o mapa. Modelo de pedido (copie e preencha):

```
Use a skill mapa-3d. Crie o mapa "<id>" (<nome>): <o que é o lugar, época, estado de conservação>.
Clima e luz: <ex.: noite nublada, luz fria de fora e lâmpadas quentes dentro>.
Ambientes / andares: <ex.: térreo com recepção e 3 quartos; porão>.
Arredores: <ex.: estacionamento, mata densa, estrada de terra>.
Objetos importantes para a sessão: <ex.: piano, poço, carro abandonado>.
Referências: <coloque imagens em referencias/ e cite os nomes>.
Restrições: terror sutil, sem gore nem monstros. Personagens não são o foco.
Entregue em etapas com commit e capturas (Cinema, Fachada, 2 internas, 3ª pessoa; climas Terror e Anoitecer),
compare com as referências e corrija. Rode testar-funcoes e testar-vtt. No fim, gere build:leve e me mande o link.
```

Fora deste repositório (outro chat, claude.ai), anexe estes arquivos para dar o mesmo contexto:
`.claude/skills/mapa-3d/SKILL.md`, `.claude/skills/mapa-3d/CATALOGO.md` e `docs/NOVO-MAPA.md`.
