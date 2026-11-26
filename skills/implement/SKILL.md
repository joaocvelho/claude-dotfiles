---
name: implement
description: Implement a piece of work based on a spec or set of tickets. Use when working one ticket from a specs/<feature>/tickets/ folder, or when the user says "implement this ticket/spec".
---

Implement the work described by the user in the spec or tickets.

Use test-driven development where possible (the superpowers:test-driven-development skill), at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite / project gate once at the end. If the project defines a visual-verification loop for UI changes, run it.

Once done, use /code-review to review the work.

Commit your work to the current branch — never directly to main; follow the project's landing conventions (e.g. a short-lived branch off origin/main plus a non-draft PR if the project uses a merge queue).

If the ticket lives in a local tickets/ folder, set its **Status** line to `done` and check off its acceptance criteria in the same commit.

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
