---
name: cypress-e2e
description: Testes E2E com Cypress contra backend e banco reais. Use ao criar ou corrigir testes E2E.
---

# cypress-e2e
- Sem stub de resposta (`cy.intercept` só para aguardar/observar requisições, nunca para mockar).
- Seletores `data-cy`; sem `cy.wait(ms)` fixo.
- Massa de dados criada via API/banco real e removida ao final; conferir gravações com SELECT.
- Node do projeto (Node 8 → Cypress ≤ 3.x/4.x compatível).
