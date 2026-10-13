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
