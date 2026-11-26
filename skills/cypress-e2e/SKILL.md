---
name: cypress-e2e
description: Testes E2E com Cypress contra backend e banco reais. Use ao criar ou corrigir testes E2E.
---

# cypress-e2e
- Sem stub de resposta (`cy.intercept` só para aguardar/observar requisições, nunca para mockar).
- Seletores `data-cy`; sem `cy.wait(ms)` fixo.
- Massa de dados criada via API/banco real e removida ao final; conferir gravações com SELECT.
- Node do projeto (Node 8 → Cypress ≤ 3.x/4.x compatível).

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto (busca local com a skill `rag-documentos`, `doc:linha`), obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
