---
name: k8s-deploy
description: Manifests Kubernetes/Helm: Deployment, Service, Ingress, ConfigMap, Secret, probes e rollout. Use ao criar ou revisar deploy em cluster.
---

# k8s-deploy
- Deployment com `resources` (requests/limits), `readinessProbe` e `livenessProbe` (Actuator `/health` no Boot 1.5).
- Config via ConfigMap; segredos via Secret/External Secrets, nunca em texto no repo.
- Imagem com tag imutável (nunca `latest`).
- Validar com `kubectl apply --dry-run=server` ou `helm template`; aplicar no cluster só com "sim".
- Rollback: `kubectl rollout undo` documentado no MR.

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto (busca local com a skill `rag-documentos`, `doc:linha`), obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
