---
name: auditoria
description: Auditoria de conformidade e impacto de uma mudança contra os documentos de requisito/planejamento, com subagentes (gerente-auditoria, especialista-auditoria, auditor-impacto, tech-lead-auditor). Use antes de aprovar um plano, antes de commit/MR/GMUD e sempre que a mudança afetar sistemas da empresa (homol/prod), ou quando o usuário pedir auditoria, verificação contra requisitos ou validação de que nada quebra.
---

# Auditoria de conformidade e impacto

## Quando usar
- Planejamento: auditar o plano contra os documentos ANTES de pedir aprovação.
- Implementação: auditar o diff ANTES de commit, MR ou GMUD.
- Qualquer proposta de alteração vinda de parecer de subagente ou regra genérica: conferir o documento primeiro.

## Regras fixas
1. O documento de requisito/planejamento é a fonte de verdade. Regra genérica (CLAUDE.md), parecer de subagente ou preferência técnica que contradiz o documento é DIVERGÊNCIA para decisão do usuário, nunca aplicada por conta própria.
2. Toda afirmação tem evidência: `doc:linha` e `arquivo:linha`. Sem evidência, é inferência e deve ser rotulada assim.
3. Fonte inacessível (login, rede, ref desatualizada) é declarada na hora como INACESSÍVEL.
4. Auditoria é somente leitura: nenhum subagente altera arquivo, faz commit/push/fetch ou acessa homol/prod.
5. Correções só depois da decisão do usuário, item a item; recomendação única e assertiva por item.

## Classificação
| Classe | Significado |
|---|---|
| EXIGIDO | Implementa regra do documento, no formato do documento |
| ADIÇÃO | Sem base no documento; justificar e dizer se é necessária para não quebrar |
| DIVERGÊNCIA | Contradiz o documento ou segue regra genérica no lugar dele |
| FALTANTE | Regra do documento sem implementação ou sem evidência |

## Fluxo
1. `gerente-auditoria`: fontes, escopo, critérios (o agente principal pode fazer esta etapa direto, se as fontes já estiverem claras).
2. Em paralelo, somente leitura, `run_in_background`: `especialista-auditoria` (rastreabilidade doc ↔ diff/plano) e `auditor-impacto` (o que quebra em homol/prod).
3. `tech-lead-auditor`: confere evidências por amostragem e dá o veredito (CONFORME / CONFORME COM RESSALVAS / NÃO CONFORME).
4. O agente principal consolida em português BR: veredito, quadro por classe, riscos, decisões do usuário (uma por linha, com recomendação e `doc:linha`).
5. Se o escopo tocar banco: incluir o agente do dialeto (`mysql`, `sqlserver`, `oracle`, `postgresql`) só leitura. Se tocar segurança: `cyber-security`. Testes: `analista-testes` (nunca mock).

## Economia de tokens
- Brief compacto com caminhos, branch, fontes e o que já foi verificado (não repetir).
- Limites de resposta definidos em cada subagente; saídas de comando truncadas.
- Uma rodada de auditoria e uma de correção; sem releitura de arquivos já auditados.
