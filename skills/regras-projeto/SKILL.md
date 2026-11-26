---
name: regras-projeto
description: Regras obrigatórias de todo projeto (ler todos os documentos antes, obedecer os documentos, nunca inventar valores, nunca alucinar, perguntar na dúvida, não quebrar homol/deploy/prod, testes reais em MySQL/DBeaver, subagentes ponta a ponta). Use no início de qualquer projeto ou tarefa nova, antes de planejar, editar, testar, commitar ou abrir MR/GMUD.
---

# Regras de todo projeto

## Início de projeto ou tarefa (nesta ordem)
1. Localizar e ler TODOS os documentos do projeto (requisitos, especificações, planejamento, resumo, pendências, mapa, evidências). Muitos arquivos: indexar com a skill `rag-documentos` e ler os trechos com `doc:linha`.
2. Montar a lista de regras (RN) com `doc:linha`. Ponto sem cobertura no documento é só reportado, sem propor mudança de escopo.
3. Levantar valores necessários (IDs, contratos, URLs, credenciais por variável de ambiente). Valor que não está no documento, no seed/fixture ou no ambiente real: perguntar ao usuário.
4. Dúvida de regra, escopo ou dado: perguntar (AskUserQuestion) antes de concluir.
5. Planejar e auditar o plano contra os documentos (skill `auditoria`) antes de pedir aprovação.

## Durante a implementação
- Escopo estrito e edição mínima; stack fixa do projeto.
- Toda afirmação com evidência: `arquivo:linha`, `doc:linha` ou saída de comando. Sem evidência = INFERÊNCIA ou NÃO VERIFICÁVEL.
- Nunca inventar valores, nomes, IDs, status ou resultados de teste.
- Ser objetivo, realista e assertivo: uma recomendação por decisão.

## Testes
- Só testes reais contra banco real (MySQL padrão; SQL Server, Oracle e PostgreSQL aceitos), conferidos no DBeaver ou no MCP `mysql-leitura` com SELECT antes e depois. Nunca mock (skill `db-testing`).
- Homol: perguntar antes, dado de teste identificável, limpeza conferida. Produção: nunca.
- Documento diz que não há banco no escopo: registrar "não se aplica" com `doc:linha`.

## Homol / deploy / prod
- Antes e depois de cada mudança: config/profile, variáveis, contrato de API, ordem de deploy, rollback, segredos, pipeline e Dockerfile (agente `auditor-impacto`, `release-validator`).
- Somente leitura nesses ambientes; qualquer ação de escrita, deploy, push ou PIN só com "sim" explícito.

## Validação ponta a ponta
- Antes de commit, MR ou GMUD: skill `verificacao-ponta-a-ponta`.
- Faltou um especialista para a área: criar o subagente no nível necessário (gerente, coordenador, especialista, auditor, tech-lead, arquiteto) no padrão de `~/.claude/agents/`, somente leitura quando for verificação.
