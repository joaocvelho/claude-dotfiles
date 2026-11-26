---
name: grill-me
description: Interview the user relentlessly about a plan, decision, or idea until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test their thinking, get grilled on a design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the environment (filesystem, tools, etc.), look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer. Having explored enough to know your recommended answer does not make a decision yours to make; it makes your question sharper.

Even when the source material is prescriptive (a bug list, a feature request), the judgment calls inside it are interview material: anywhere multiple designs would satisfy the ask, anywhere the material asks "is this right?", anywhere a fix commits us to an architecture.

This session produces a conversation, not a document. Do not write plan or spec files — synthesis is a separate step (`/to-spec`) that I will invoke.

You do not decide when the interview is over; I do. When you believe every branch is resolved, present a numbered ledger of (a) every decision made and what I chose, and (b) any branches you consider settled by exploration alone — then ask which branches I want pushed deeper. End only when I confirm we have reached a shared understanding.

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
