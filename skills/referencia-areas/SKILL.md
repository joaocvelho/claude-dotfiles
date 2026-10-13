---
name: referencia-areas
description: Regras por área: dados (ETL, análise, Python), IA/LLM, Linux (Ubuntu/Mint/WSL2), bancos (SQL Server/Oracle/PostgreSQL/MySQL/MariaDB), DevOps (k8s/iac/performance/release) e dashboards. Use ao trabalhar nessas áreas ou ao delegar a esses subagentes.
---
## Dados: pipelines, análise, Python e governança (subagentes de dados)
- **Roteamento**:
  - `engenheiro-de-dados`: pipelines ETL/ELT, ingestão, carga, orquestração, performance de extração. Edita código (`isolation: worktree`).
  - `analista-de-dados`: consultas exploratórias, indicadores (KPIs), análise de tendências e relatórios em texto. Somente leitura.
  - `python`: scripts, notebooks, pandas/numpy, automações e manipulação de arquivos (CSV, JSON, Excel). Edita código (`isolation: worktree`).
  - `especialista-de-dados`: modelagem dimensional, qualidade de dados, catálogo, linhagem e governança. Somente leitura, entrega recomendações.
- **Fluxo típico**: `especialista-de-dados` (modelo/regras) → `engenheiro-de-dados` ou `python` (implementação) → `analista-de-dados` (validação dos números) → `quality-analyst` (testes). Pular etapas que não se aplicam.
- **SQL**: queries seguem `sql-dialects` (MySQL/Oracle/SQL Server/PostgreSQL). Teste contra banco real, nunca mock (ver seção Testes).
- **Dados sensíveis**: nunca copiar dados pessoais reais para fixtures, logs ou prompts; anonimizar antes.
- **Dados de exemplo**: fixture claramente marcada. Nunca apresentar números inventados como reais.
- **Python**: versão compatível com o projeto. Em projeto Java/Spring, Python só para scripts auxiliares, nunca para substituir o backend.

## IA: estratégia, arquitetura, desenvolvimento e LLMs (subagentes de IA)
- **Roteamento**:
  - `gerente-ia`: priorização, ROI, custo e escopo de iniciativas de IA. Somente leitura.
  - `tech-lead-ia`: escolha de modelo/provedor, trade-offs de custo, latência e risco. Somente leitura.
  - `arquiteto-de-ia`: desenho de RAG, agentes, pontos de integração com o backend. Somente leitura.
  - `engenheiro-de-ia`: pipelines de embeddings, indexação, avaliação (evals) e dados para IA. Edita (`isolation: worktree`).
  - `desenvolvedor-ia`: implementação de features de IA (chamadas à API, prompts, streaming, fluxo de UI). Edita (`isolation: worktree`). Para integração só em backend Java/Spring, usar `ai-engineer`.
  - `llm`: seleção, comparação e uso de LLMs (contexto, tokens, parâmetros, prompting). Somente leitura.
  - `generative-ia`: geração de texto, imagem e áudio, guardrails e moderação de saída. Edita (`isolation: worktree`).
  - `mcp`: criação e configuração de servidores MCP e seus contratos de tool. Edita (`isolation: worktree`).
  - `skill`: criação e revisão de skills (`SKILL.md`, gatilhos, instruções). Edita (`isolation: worktree`).
  - `mods`: adaptação de modelos (fine-tuning, LoRA, modelos locais customizados). Edita (`isolation: worktree`).
- **Fluxo típico**: `gerente-ia` (escopo/ROI) → `tech-lead-ia` + `arquiteto-de-ia` (escolha e desenho) → `engenheiro-de-ia`/`desenvolvedor-ia`/`mcp`/`skill`/`mods` (implementação) → `llm` e `code-reviewer` (validação). Pular etapas que não se aplicam.
- **Segredos**: chaves de API só via variável de ambiente (`${...}`), nunca em prompt, skill, MCP config ou commit.
- **Avaliação**: toda mudança em prompt ou modelo é validada com um conjunto de casos fixos antes de ser declarada pronta.
- **Custo**: informar estimativa de tokens/custo em mudanças que chamam LLM em produção.

## Linux: Ubuntu, Linux Mint e WSL 2 (subagentes de Linux)
- **Roteamento**:
  - `ubuntu`: Ubuntu Desktop e Server, LTS, apt, systemd, serviços, firewall (ufw), permissões. Edita scripts e configs no repo (`isolation: worktree`).
  - `mint`: Linux Mint (Cinnamon/MATE/Xfce), base Ubuntu, PPAs, drivers e ajustes de desktop. Edita scripts e configs no repo (`isolation: worktree`).
  - `wsl2`: distros WSL 2 no Windows, `/etc/wsl.conf`, `.wslconfig` (lado Windows), systemd, interop, rede, memória e integração com Docker/Java. Edita scripts e configs no repo (`isolation: worktree`).
- **Ações de sistema** (`apt upgrade`/`dist-upgrade`, `do-release-upgrade`, `reboot`, `systemctl` em produção, alterações em `/etc`, `wsl --shutdown`, `wsl --unregister`, `wsl --install`): sempre perguntar e aguardar "sim" antes de executar.
- **Sudo**: nunca digitar senha de sudo. Se pedir senha, parar e avisar o usuário.
- **Destrutivo**: nunca remover partições, discos, distros WSL ou volumes sem confirmação explícita; antes, listar o alvo (`lsblk`, `wsl -l -v`, `docker volume ls`).
- **Diferença de distro**: comandos de Mint e Ubuntu são compatíveis, mas os repositórios e pacotes de desktop diferem. Verificar `/etc/os-release` antes de instalar algo.
- **Validação**: após mudança em config, testar com comando de verificação (ex. `systemctl status`, `sudo ufw status`, `wsl -d <distro> -- uname -a`) antes de declarar pronto.
- **Windows x WSL**: arquivos em `/mnt/c` são lentos para build Java/Maven; manter o projeto no filesystem Linux (`~/`).

## Bancos de dados: SQL Server, Oracle, PostgreSQL, MySQL e MariaDB (subagentes por banco)
- **Roteamento**:
  - `sqlserver`: T-SQL, índices, planos de execução, SQL Server Management tooling, migrações. Edita scripts (`isolation: worktree`).
  - `oracle`: PL/SQL, sequences, tablespaces, otimização com AWR/explain plan. Edita scripts (`isolation: worktree`).
  - `postgresql`: SQL, extensões, EXPLAIN ANALYZE, particionamento, roles e permissões. Edita scripts (`isolation: worktree`).
  - `mysql`: MySQL 5.7 (versão do projeto), charset utf8mb4, InnoDB, índices e dialect `MySQL5Dialect`. Edita scripts (`isolation: worktree`).
  - `mariadb`: MariaDB, diferenças para MySQL (ex. sequences, JSON, comportamento de sql_mode). Edita scripts (`isolation: worktree`).
- **Coordenação**: `database-engineer` decide a modelagem comum entre bancos e delega o SQL específico ao agente do banco-alvo. Para comparar dialetos, usar a skill `sql-dialects`.
- **Versão do projeto**: MySQL 5.7 com driver 5.1.47 é o padrão. Não usar recursos só disponíveis em MySQL 8 sem pedido explícito.
- **DDL e DML em banco compartilhado ou produção**: sempre perguntar e aguardar "sim" antes de executar `DROP`, `TRUNCATE`, `ALTER` ou `DELETE`/`UPDATE` sem `WHERE`.
- **Backup**: antes de qualquer alteração destrutiva, gerar dump (`mysqldump`, `pg_dump`, `expdp`, `BACKUP DATABASE`) e informar o caminho.
- **Credenciais**: string de conexão só via variável de ambiente (`${...}`); nunca gravar usuário/senha em script, teste ou commit.
- **Dados reais**: nunca copiar dados de produção para o repo. Usar fixture anonimizada.
- **Teste**: sempre contra instância real do banco (ver seção Testes e skill `db-testing`).

## DevOps, containers e qualidade avançada (subagentes)
- **Roteamento**:
  - `k8s`: manifests, Helm, rollout e rollback em Kubernetes. Edita manifests (`isolation: worktree`); ações no cluster exigem "sim".
  - `iac`: Terraform e Ansible, sempre com plano antes de aplicar. Edita arquivos de IaC (`isolation: worktree`); aplicar exige "sim".
  - `performance-tester`: teste de carga (k6, JMeter, Gatling) e análise de gargalos. Edita scripts (`isolation: worktree`); nunca roda contra produção sem "sim".
  - `release-manager`: SemVer, changelog, tags e release notes. Edita versão e changelog (`isolation: worktree`); tag e push exigem "sim".
  - `dependency-auditor`: CVEs e atualização de dependências, respeitando Boot 1.5.13 e JDK 8. Edita `pom.xml` (`isolation: worktree`).
- **Regra comum**: qualquer comando que altere ambiente remoto (cluster, nuvem, tag, push, deploy) pede "sim" explícito antes.

## Painéis, dashboards e gráficos (subagente `charts-dashboards`)
- **Escopo**: dashboard web, gráficos 2D/3D (Chart.js, ECharts, Three.js), Power BI (modelo, medidas DAX) e Tableau. Delegar sempre a `charts-dashboards` com `isolation: worktree` quando editar arquivos.
- **Skills**: `dataviz` antes de escolher cores, tipo de gráfico ou layout de painel; `powerbi-dashboard` para modelagem e DAX.
- **Dados**: o painel consome o contrato de endpoint/JSON já existente. Se o endpoint não existe, delegar primeiro a `backend` (ou `full-stack` se for pequeno) e depois o painel. Regra de negócio fica no backend, nunca no frontend.
- **Dados de exemplo**: usar fixture claramente marcada. Nunca apresentar números inventados como reais.
- **3D**: só quando pedido explicitamente. Sem pedido, usar 2D.
- **Power BI**: entregar modelo, medidas DAX e layout em texto; o `.pbix` é montado pelo usuário no Power BI Desktop.
- **Tableau**: sem skill própria. Entregar campos calculados, filtros e layout em texto; o workbook é montado pelo usuário no Tableau.
- **Validação**: build do projeto e verificação visual no navegador quando for web (`playwright` só se necessário). Sem arquivos de documentação extras.

