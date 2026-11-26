---
name: n8n-workflows
description: Workflows n8n: gatilhos, nós, credenciais, tratamento de erro e versionamento do JSON. Use ao criar ou ajustar automações n8n.
---

# n8n-workflows
- Um workflow por responsabilidade; nomes de nós descritivos.
- Credenciais só no credential store do n8n; JSON exportado sem segredos.
- Error Workflow configurado; retries com backoff em chamadas externas.
- Idempotência em gatilhos que podem repetir.
- Testar contra sistemas reais (homol); ativar em produção só com "sim".

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
