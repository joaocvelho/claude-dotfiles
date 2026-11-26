---
name: git-flow
description: Fluxo Git/GitLab/GitHub: branches, commits convencionais, PR/MR, tags. Use ao criar branch, commitar, abrir PR/MR ou versionar.
---

# git-flow
- Branches: `feat/`, `fix/`, `chore/`, `hotfix/` a partir da base do repo (`master`/`main`/`develop`).
- Commits convencionais: `tipo(escopo): resumo` em português, imperativo, ≤72 caracteres.
- PR/MR pequeno, uma mudança por vez; descrição com o quê, por quê e como testar (testes reais).
- Nunca force-push em `main`/`master`/`develop`; nunca reescrever histórico publicado.
- Tags SemVer `vX.Y.Z`; changelog atualizado junto.
- `git push`, criação de tag e MR só após "sim" explícito (pode disparar PIN/2FA).

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto (busca local com a skill `rag-documentos`, `doc:linha`), obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
