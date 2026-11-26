---
name: verificacao-ponta-a-ponta
description: Verificação e validação do fluxo completo de ponta a ponta com subagentes em todos os níveis (gestão, coordenação, especialista, arquitetura, tech-lead, auditoria, QA, segurança, release). Use ao concluir uma feature ou correção, antes de commit, push, MR ou GMUD, e sempre que o usuário pedir verificação completa ou validação de que nada quebra em homol/deploy/prod.
---

# Verificação ponta a ponta

## Regras fixas
- Segue a skill `regras-projeto`: documentos prevalecem, nada inventado, toda afirmação com `doc:linha`/`arquivo:linha`, dúvida vai para o usuário.
- Todos os subagentes são somente leitura, em paralelo (`run_in_background`), sem worktree; nenhum toca homol/deploy/prod nem faz commit/push/fetch.
- Testes: só reais (MySQL/DBeaver ou MCP `mysql-leitura`), nunca mock.

## 1. Brief (agente principal)
Arquivo no scratchpad com: raiz do projeto, branches e commits, diff resumido, documentos e linhas relevantes, o que já foi verificado (não repetir), regras fixas e limite de resposta (veredito na 1ª linha, máx. 15 linhas).

## 2. Subagentes por nível (acionar os que se aplicam ao escopo)
| Nível | Agentes |
|---|---|
| Gestão | `gerente-projeto`, `gestor`, `gerente-qualidade`, `gerente-seguranca`, `gerente-devops` |
| Coordenação | `coordenador-projeto`, `coordenador-qualidade` |
| Negócio | `business-analyst`, `product-owner`, `doc-analyst` |
| Arquitetura | `architect`, `arquiteto-seguranca`, `arquiteto-dados` |
| Especialistas | `engenheiro-software`, `especialista-sistema`, `especialista-qa`, `especialista-frontend`, `especialista-backend`, `especialista-devops`, `especialista-dba` (banco) |
| Revisão e testes | `code-reviewer`, `quality-analyst`, `analista-testes`, `cyber-security` |
| Auditoria | `especialista-auditoria`, `auditor-impacto`, `auditor-seguranca`, `auditor-qualidade` |
| Tech-lead | `tech-lead-qa`, `tech-lead-seguranca`, `tech-lead-frontend`, `tech-lead-backend`, `tech-lead-devops`, `tech-lead-dba` (banco), `tech-lead-auditor` (conformidade) |
| Liberação | `release-validator` (por último) |

Escopo de banco: incluir o agente do dialeto (`mysql`, `sqlserver`, `oracle`, `postgresql`). Infra: `k8s`, `ci-cd`, `monitoramento` só leitura.

## 3. Consolidação
1. Juntar os pareceres num arquivo no scratchpad (uma linha por agente).
2. Conferir por amostragem as evidências citadas; parecer que contradiz documento = DIVERGÊNCIA para o usuário.
3. `tech-lead` dá o veredito técnico; `tech-lead-auditor` o de conformidade.
4. Reportar ao usuário em português BR: veredito, bloqueios, ressalvas, decisões pendentes (uma por linha, com recomendação e `doc:linha`), o que não foi verificado.
5. Correções só depois da aprovação do usuário.
