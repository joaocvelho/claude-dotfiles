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
