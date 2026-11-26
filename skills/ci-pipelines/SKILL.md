---
name: ci-pipelines
description: Pipelines GitHub Actions e GitLab CI para Java/Maven, Node e Docker. Use ao criar ou ajustar .github/workflows ou .gitlab-ci.yml.
---

# ci-pipelines
- Java: `mvn -B -ntp verify` (JDK 8); cache de `~/.m2`.
- Testes de integração reais: serviço de banco real no pipeline (MySQL 5.7 etc.), nunca H2/mock.
- Build Docker após testes; push de imagem só em `main`/`master`/`develop`/tags.
- Segredos via variáveis protegidas do CI; nunca no YAML.
- Validar sintaxe (`gitlab-ci lint`/actionlint) antes de declarar pronto.

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
