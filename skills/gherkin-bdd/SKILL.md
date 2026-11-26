---
name: gherkin-bdd
description: Critérios de aceite em Gherkin (BDD) em português. Use ao escrever cenários Dado/Quando/Então.
---

# gherkin-bdd
- `# language: pt`; Funcionalidade, Contexto, Cenário, Esquema do Cenário com Exemplos.
- Um comportamento por cenário; Dado/Quando/Então observáveis (sem detalhes de implementação).
- Cobrir sucesso, falha, borda e permissão.
- Cada cenário deve ser verificável por teste real (banco real, sem mock).

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto (busca local com a skill `rag-documentos`, `doc:linha`), obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
