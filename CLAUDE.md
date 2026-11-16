# Instruções para a IA (lidas automaticamente pelo Claude Code)

Projeto de mapas 3D para RPG de mesa (Ordem Paranormal, terror realista **sutil**). Vite + TypeScript + three.js r187.

Leia antes de trabalhar:
1. `docs/HISTORICO.md`: decisões, preferências do dono, estado atual e lições da criação da igreja.
2. `.claude/skills/mapa-3d/SKILL.md` (skill `mapa-3d`): fluxo, receita visual, erros a evitar, desempenho.
3. `.claude/skills/mapa-3d/CATALOGO.md`: assets CC0 já testados.
4. `docs/NOVO-MAPA.md` (como criar um mapa) e `docs/HOSPEDAGEM.md` (publicar, celular, servidor).

Regras fixas do dono:
- Interface e textos em **português (BR)**.
- **Nunca comprar nada sem perguntar.** Assets gratuitos CC0 podem ser baixados à vontade; registre todos em `CREDITS.md`.
- Sem sangue, monstros visíveis ou sobrenatural explícito; o clima de terror vem da luz, névoa e abandono.
- Pode mudar o que for preciso para ter **a maior qualidade possível**, mas a cena precisa rodar liso
  (60 fps no PC, 30+ no celular). Meça com `node tools/medir.mjs` antes e depois.
- Commits pequenos e frequentes; `CHANGELOG.md` atualizado; capturas (`npm run capturas`) a cada etapa visual.
- Ao terminar algo, entregue o arquivo/link para o dono ver (ele costuma abrir pelo celular).
- O que for aprendido vai para o repositório (skill, `docs/HISTORICO.md`), não fica só na conversa.

Verificação mínima antes de entregar: `npm run build`, `node tools/testar-funcoes.mjs`, `node tools/testar-vtt.mjs`.
