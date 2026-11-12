# Instruções para o Claude Code

- Idioma: português do Brasil (interface, comentários, commits e docs).
- Para criar/mudar mapas, use a skill `mapa-3d` (`.claude/skills/mapa-3d/`) e leia `docs/NOVO-MAPA.md`.
  Não reescreva o núcleo (`src/core/`) para atender um mapa.
- Antes de commitar: `npm run typecheck`. Mudou o servidor → `npm run test:servidor`.
  Mudou interface/carregamento/caminhar → `npm run test:funcoes` (lento, ~7 min). Mudou paredes/portas/luzes → `npm run test:vtt`.
- Mudança visual: rode capturas (`npm run capturas -- <rótulo> --q=baixa --w=960 --h=540` para iterar) e olhe as imagens.
- Registre mudanças em `CHANGELOG.md`. Assets novos só CC0 (ou licença conferida) com crédito em `CREDITS.md`.
- Terror sutil: sem gore, monstros ou sobrenatural explícito.
