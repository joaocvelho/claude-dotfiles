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
