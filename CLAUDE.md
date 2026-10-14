# CLAUDE.md — Configuração global (Claude Code Desktop)

## Objetivo
Reduzir consumo de tokens ao máximo **sem perder qualidade**: solução correta na primeira vez, fix mínimo, zero retrabalho. Menor caminho que resolve o problema = melhor resposta.

## Regras de economia de tokens (obrigatórias)
1. **Leitura seletiva**: localize com `grep`/`glob` antes de ler; leia só o trecho (offset/limit, ~50-100 linhas). Nunca leia um arquivo inteiro sem necessidade clara.
2. **Nunca injete logs/builds inteiros no contexto**: `--tail=N`, `| Select-Object -Last 50`, `head`/`tail`, filtros por nível de erro. Saída de comando sempre truncada.
3. **Respostas enxutas**: sem preâmbulo, sem resumir o já dito, sem explicar código não pedido. Texto ≤4 linhas; o resto é ação (ferramenta).
4. **Contexto**: `/clear` entre tarefas sem relação; `/compact` ao fim de cada etapa concluída e **antes** do alerta ⚠ do statusline (alerta em ~420K; sem compactação automática, `/compact` só manual pelo usuário).
5. **Escopo estrito**: implemente exatamente o pedido. Nada de refatorar, renomear, adicionar comentários/Javadoc ou "melhorar" o que não foi pedido.
6. **Edição mínima**: altere só o necessário, preserve estilo/indentação. Máx. 3 tentativas de edição por arquivo — se falhar, reavalie a causa em vez de repetir.
7. **Busca ampla delegada a subagente** (não polui o contexto principal). Não crie subagente para tarefa trivial.
8. **Planejar/ler antes de editar** — evita rework, que é o maior desperdício de tokens.

## Fluxo obrigatório: correção de bugs / erros
1. Pegue o erro real (grep no log/stacktrace, nunca o arquivo inteiro).
2. Localize o ponto exato (classe/método/linha) → leia só aquele trecho.
3. Cause raiz → **fix mínimo e direto** no ponto certo.
4. Valide: build + teste do que foi tocado (`mvn -q ...`).
5. Pare. Não comente nem reescreva o restante do arquivo/projeto.

## Testes: SOMENTE testes reais — proibido qualquer teste mockado (regra fundamental)
- Vale para **todos os projetos do usuário**, sem exceção: aceitar **apenas testes reais** contra banco real **MySQL, SQL Server, Oracle ou PostgreSQL**, com conferência no **DBeaver**. **Nunca criar nem aceitar testes mockados.**
- **Nunca criar teste mockado**, em nenhuma camada: sem Mockito, `@Mock`, `@MockBean`, `@InjectMocks`, stubs/fakes de service ou repository, nem banco in-memory (H2, HSQLDB, Derby). Vale também para "teste unitário de regra de negócio" — se precisa de dependência, roda com a dependência real.
- Todo teste roda ponta a ponta contra banco **real**: **MySQL 5.7** (padrão) ou **MySQL 5.1/5.5** (legado; 5.5/utf8 quando não houver imagem 5.1), via Testcontainers com a imagem real ou `docker compose up -d db`. SQL Server, Oracle e PostgreSQL também aceitos, sempre com instância real do banco.
- Todo teste **comprova no banco**: após a chamada (HTTP/serviço/job), consultar com `SELECT` (JdbcTemplate ou cliente `mysql`) e verificar gravações, alterações, exclusões e contagens em tempo real — status HTTP sozinho não é prova.
- Cobertura do fluxo completo vem desses testes reais (endpoint → regra → persistência → consulta no banco); cenário novo = teste de integração real novo, nunca teste mockado.
- Sem exceção para mock: nem WireMock/MockServer, nem stub de API externa. Integração com sistema de terceiro é testada contra o ambiente real/homolog do terceiro; se não houver ambiente acessível, sinalizar ao usuário em vez de mockar.
- Testes mockados legados encontrados no projeto: sinalizar ao usuário e propor conversão para teste real; não usá-los como evidência de que o fluxo funciona.
- Antes de rodar teste de integração, confirme que o banco real está de pé (`docker compose ps`); se não estiver, suba com `docker compose up -d --build` antes de rodar `mvn -q -Dtest=...`.
- Conferência no DBeaver: toda inserção, alteração e exclusão feita pelo teste é verificada com `SELECT` antes/depois na conexão do DBeaver do banco local ou de homol (MySQL/SQL Server/Oracle/PostgreSQL); nunca em produção. Em homol: perguntar antes de rodar, usar dados de teste identificáveis e removê-los ao final, conferindo a limpeza com `SELECT`.
- Ao reportar resultados, informar explicitamente: banco/versão usado, quantidade de testes reais e as consultas que comprovaram as gravações.
- Detalhes: skill `db-testing` (compose/Testcontainers/profiles) e `sql-dialects` (dialetos). Quem escreve esses testes é o subagente `integration-tester` (sempre teste real, nunca mock); schema/SQL por dialeto é `database-engineer`.

## Isolamento com git worktree
- Para qualquer subagente que **edita código** em múltiplos arquivos (`backend`, `frontend`, `full-stack`, `mobile`, `devops`, `ci-cd`, `ai-engineer`, `charts-dashboards`, `n8n`, `nginx`, `cypress`, `database-engineer`, `integration-tester`, `engenheiro-de-dados`, `python`, `desenvolvedor-ia`, `engenheiro-de-ia`, `mcp`, `skill`, `mods`, `generative-ia`, `ubuntu`, `mint`, `wsl2`, `sqlserver`, `oracle`, `postgresql`, `mysql`, `mariadb`, `k8s`, `iac`, `performance-tester`, `release-manager`, `dependency-auditor`), delegar com `isolation: worktree` no Agent tool — mantém a working tree principal limpa enquanto o subagente trabalha.
- Subagentes somente-leitura (`architect`, `code-reviewer`, `cyber-security`, `quality-analyst` quando só roda teste, `specialist`, `business-analyst`, `product-owner`, `gherkin`, `orchestrator`, `doc-analyst`, `release-validator`, `tech-lead`, `gestor`, `engenheiro-software`, `analista-testes`, `ceo`, `coordenador-ti`, `gerente-ti`, `analista-de-dados`, `especialista-de-dados`, `gerente-ia`, `tech-lead-ia`, `arquiteto-de-ia`, `llm`) não precisam de worktree isolado.
- Avalie a necessidade de worktree por projeto: repositórios pequenos/single-module podem não justificar isolamento; múltiplos subagentes editando em paralelo no mesmo repo sempre justificam.

## Subagentes globais (`~/.claude/agents/`)
Fluxo: `ceo`/`gerente-ti`/`coordenador-ti` (priorização, orçamento, cronograma) → `product-owner` → `business-analyst`/`gherkin`/`doc-analyst` → `architect`/`tech-lead`/`database-engineer` → `ui-designer` → `backend`/`frontend`/`full-stack`/`mobile`/`ai-engineer`/`charts-dashboards`/`n8n` → `bi-dashboards` (se houver) → `nginx`/`devops`/`ci-cd` → `integration-tester`/`cypress` → `code-reviewer`+`cyber-security` → `quality-analyst` → `performance-specialist` (se houver gargalo) → `release-validator`. `orchestrator` coordena o fluxo inteiro; `specialist`/`performance-specialist` entram só para problema técnico pontual difícil.

| Agente | Model | Função |
|---|---|---|
| orchestrator | sonnet | Coordena o fluxo ponta a ponta |
| product-owner | haiku | Define escopo/prioridade da feature |
| business-analyst | haiku | Traduz requisito de negócio em regra técnica |
| doc-analyst | haiku | Lê documentos (PDF/Word/Confluence/specs) e extrai requisitos, regras de negócio e critérios de aceite — usar antes de implementar quando houver doc de referência |
| gherkin | haiku | Escreve critérios de aceite em BDD |
| architect | sonnet | Desenha solução e pontos de impacto |
| backend | sonnet | Implementa camada server-side |
| frontend | sonnet | Implementa camada client-side (Node.js 8) |
| full-stack | sonnet | Implementa quando back+front são acoplados |
| mobile | sonnet | Implementa mobile nativo (Flutter, Kotlin, Swift) |
| ui-designer | sonnet | Design e prototipagem (Excalidraw, mockups, wireframes) |
| ai-engineer | sonnet | Implementa integrações com LLM/MCP |
| devops | sonnet | Ajusta infra, Docker, ambientes |
| ci-cd | sonnet | Ajusta pipelines de build/deploy |
| code-reviewer | sonnet | Revisa qualidade/correção do código |
| cyber-security | sonnet | Revisa vulnerabilidades |
| quality-analyst | sonnet | Roda e valida testes reais |
| release-validator | sonnet | Valida o fluxo completo antes de considerar "pronto": build, testes reais, container sobe, pipeline CI/CD passa, versionamento consistente, nada quebra em homol/prod |
| specialist | sonnet | Problema técnico pontual difícil |
| versionamento | sonnet | Opera Git/GitLab (branch, commit, MR, tag, pipeline de release) |
| monitoramento | sonnet | Consulta/ajusta observabilidade (Grafana, Zabbix) |
| postman | sonnet | Cria e roda collections Postman/Newman para testar endpoints |
| tech-lead | sonnet | Verificação completa do ciclo ponta a ponta (requisito → arquitetura → código → testes reais → segurança → deploy); consolida pareceres e dá veredito |
| gestor | haiku | Visão de gestão: pedido x entregue, pendências por responsável (dev/DBA/DevOps/negócio), riscos e ordem de liberação, em linguagem simples |
| engenheiro-software | sonnet | Verifica a implementação do endpoint ao banco: build, regras, transações, concorrência, compatibilidade de stack e schema |
| analista-testes | sonnet | Matriz requisito → cenário → teste real; lacunas de cobertura e cenários faltantes (nunca mock) |
| bi-dashboards | sonnet | Design e implementação de painéis (Power BI, Tableau, Grafana, dashboards custom) |
| performance-specialist | sonnet | Análise e otimização de performance (query, índices, cache, profile) |
| ceo | haiku | Visão estratégica, prioridade e orçamento |
| gerente-ti | haiku | Gestão de TI: recursos, prazos e riscos |
| coordenador-ti | haiku | Coordenação de cronograma e equipes |
| database-engineer | sonnet | Modelagem comum entre bancos; delega SQL ao agente do banco-alvo |
| charts-dashboards | sonnet | Dashboards web, gráficos 2D/3D, Power BI e Tableau |
| n8n | sonnet | Workflows e integrações n8n |
| nginx | sonnet | Reverse proxy, TLS e config Nginx |
| cypress | sonnet | Testes E2E com Cypress contra backend e banco reais |
| integration-tester | sonnet | Escreve testes de integração reais contra banco real (nunca mock) |
| engenheiro-de-dados | sonnet | Pipelines ETL/ELT, ingestão e orquestração |
| analista-de-dados | sonnet | Consultas exploratórias, KPIs e relatórios (leitura) |
| python | sonnet | Scripts, notebooks, pandas/numpy e automações |
| especialista-de-dados | sonnet | Modelagem dimensional, qualidade, linhagem e governança (leitura) |
| gerente-ia | haiku | Priorização, ROI e custo de iniciativas de IA (leitura) |
| tech-lead-ia | sonnet | Escolha de modelo/provedor e trade-offs (leitura) |
| arquiteto-de-ia | sonnet | Desenho de RAG, agentes e integrações (leitura) |
| engenheiro-de-ia | sonnet | Embeddings, indexação e evals |
| desenvolvedor-ia | sonnet | Implementa features de IA (API, prompts, streaming) |
| llm | sonnet | Seleção e uso de LLMs (contexto, tokens, prompting) (leitura) |
| generative-ia | sonnet | Geração de texto/imagem/áudio, guardrails e moderação |
| mcp | sonnet | Cria e configura servidores MCP |
| skill | sonnet | Cria e revisa skills (SKILL.md) |
| mods | sonnet | Fine-tuning, LoRA e modelos locais |
| ubuntu | sonnet | Ubuntu Desktop/Server: apt, systemd, ufw |
| mint | sonnet | Linux Mint: PPAs, drivers e desktop |
| wsl2 | sonnet | WSL 2: wsl.conf, .wslconfig, rede, Docker/Java |
| sqlserver | sonnet | T-SQL, índices e planos de execução |
| oracle | sonnet | PL/SQL, sequences, AWR/explain plan |
| postgresql | sonnet | SQL, extensões, EXPLAIN ANALYZE, roles |
| mysql | sonnet | MySQL 5.7, utf8mb4, InnoDB, MySQL5Dialect |
| mariadb | sonnet | MariaDB e diferenças para MySQL |
| k8s | sonnet | Manifests, Helm, rollout/rollback |
| iac | sonnet | Terraform e Ansible (plano antes de aplicar) |
| performance-tester | sonnet | Teste de carga (k6, JMeter, Gatling) |
| release-manager | sonnet | SemVer, changelog, tags e release notes |
| dependency-auditor | sonnet | CVEs e atualização de dependências (Boot 1.5.13/JDK 8) |

### Quando ativar subagentes especializados
- **`ui-designer`**: quando a feature envolve prototipagem, wireframes ou design system (Excalidraw, mockups).
- **`mobile`**: projeto usa Flutter/Kotlin/Swift ou feature envolve app nativo (após `architect`).
- **`bi-dashboards`**: projeto precisa painéis/relatórios (Power BI, Tableau, Grafana); usar `dataviz` skill antes se for custom HTML/React.
- **`performance-specialist`**: gargalo identificado em query, cache, índice ou throughput (antes de `quality-analyst` se bloqueador, depois se validação detectou).

### Verificação completa do ciclo (ponta a ponta, do início ao fim)
Acionar ao concluir uma feature/correção relevante, **antes de commit/push/MR** e sempre que o usuário pedir verificação completa. Todos somente leitura, em paralelo (`run_in_background`), sem worktree:
- **Especialista** `specialist` (só se houver problema técnico difícil) · **Gestor** `gestor` · **Tech lead** `tech-lead` · **Arquiteto de software** `architect` · **Engenheiro de software** `engenheiro-software`
- **QA** `quality-analyst` (roda os testes reais) · **Code review** `code-reviewer` · **Analista de testes** `analista-testes` · **Segurança** `cyber-security`
- **Infra/observabilidade** (somente leitura, sem apply/alteração em cluster, Grafana ou banco): **Kubernetes/deploy** `k8s` · **Monitoramento/Grafana** `monitoramento` (logs de erro, LogQL, alertas, DLQ) · **CI/CD** `ci-cd` (pipeline roda os testes reais?) · **Banco** agente do dialeto (`mysql`, `sqlserver`, `oracle`, `postgresql`: schema x entidade, charset, timeouts, ações do DBA)
- Ao final: `release-validator`. O agente principal consolida os pareceres (o `tech-lead` dá o veredito) e reporta ao usuário em português simples; correções só após aprovação do usuário.
- Testes do ciclo: suíte real (Testcontainers MySQL 5.7/5.1) **e** teste ponta a ponta no banco local ou de homol via DBeaver (MySQL/SQL Server/Oracle/PostgreSQL), com `SELECT` antes/depois de cada inserção, atualização e exclusão; nunca em banco de produção.
- Telas: conferir layout/design no sistema real (ex.: Air em HML) só em leitura, sem salvar/enviar nada, e manter o protótipo/implementação com o mesmo estilo visual.
- Dúvida ou decisão do usuário: abrir questionário (AskUserQuestion) em vez de supor.

### `release-validator` — checklist obrigatório antes de finalizar entrega
Acionar sempre que a tarefa envolver deploy, build, pipeline ou mudança que toca ambiente (não para edições triviais). Validar, nesta ordem, e reportar o que falhou sem tentar "forçar passar":
1. **Versionamento**: branch/commit segue padrão do repo (Git), sem divergência não resolvida (merge conflict, rebase pendente).
2. **Build**: compila/builda limpo na stack do projeto (ex. `mvn -q clean package`, `npm run build`, `dotnet build`).
3. **Testes reais**: suíte de testes roda contra dependências reais (banco real MySQL/SQL Server/Oracle/PostgreSQL via Testcontainers/docker compose, conferido no DBeaver — nunca mock, em nenhuma camada), sem skip indevido.
4. **Container**: imagem builda e sobe (`docker compose up -d --build`) sem erro de start, healthcheck passa.
5. **CI/CD**: pipeline (GitLab CI, GitHub Actions etc.) teria stages compatíveis com a mudança — se o `.yml` do pipeline precisa de ajuste, sinalizar antes de declarar pronto.
6. **Compatibilidade homol/prod**: variáveis de ambiente usadas (não hardcoded), migrações de banco (Flyway/Liquibase) aplicáveis sem quebrar dado existente, sem mudança de contrato de API sem versionamento.
Se qualquer item falhar, reportar a causa raiz e não declarar a tarefa concluída.

## Regras por área (skill `referencia-areas`)
Dados, IA, Linux, bancos, DevOps e dashboards: carregue a skill `referencia-areas` antes de trabalhar nessas áreas. Inalteradas aqui: ações destrutivas/de ambiente remoto, sudo, DDL/DML em banco compartilhado e backup antes de alteração destrutiva sempre pedem "sim" explícito; segredos só via variável de ambiente; testes sempre reais.

## Stack fixa por padrão (NUNCA modernizar sem pedido)
- **JDK 8** (`-source/-target 1.8`): sem `var`, records, text blocks, `List.of`, switch expression. `stream`, `Optional`, lambdas, `java.time` OK.
- **Spring Boot 1.5.13.RELEASE**: `javax.*` (nunca `jakarta.*`), Java 8, Tomcat 8.5, `spring-boot-starter-parent` 1.5.13.RELEASE. Não atualizar Boot/dependências sem pedido explícito.
- **MySQL**: driver `mysql:mysql-connector-java:5.1.47`, classe `com.mysql.jdbc.Driver`, dialect `MySQL5Dialect`, charset `utf8mb4`.
- Proibido: migrar para Boot 2+/3, Jakarta, Gradle ou novo driver sem pedido explícito.
- **Front-end (subagente `frontend`/`full-stack`)**: **Node.js 8** (npm 5/6). Sintaxe e dependências compatíveis com Node 8: sem optional chaining (`?.`), nullish (`??`), `Array.prototype.flat`, `Object.fromEntries`, ESM nativo (`import` sem bundler) nem top-level await; usar versões de libs/tooling que suportem Node 8 (ex. webpack ≤4, Babel 7, Vue CLI 3, Angular ≤7, CRA ≤3). `engines: { "node": "8.x" }` no `package.json`; Docker `FROM node:8`. Não atualizar Node sem pedido explícito.

## Outras stacks (quando o projeto exigir)
O padrão acima (JDK 8/Spring Boot/MySQL) é o **default da empresa**, não uma camisa de força. Se o projeto já usa, ou o usuário pede, outra stack — **Vue, React, Angular, PHP (Laravel/Symfony), .NET (C#/ASP.NET Core), Python (Django/FastAPI), Node.js, Go, Flutter, Kotlin, Swift** etc. — está **autorizado implementar nessa stack**, seguindo:
- Convenções e versões já existentes no projeto (detectar via `package.json`, `composer.json`, `*.csproj`, `pubspec.yaml`, `build.gradle`, `Podfile`, `requirements.txt`, lockfiles) em vez de impor o padrão Java.
- Mesmos princípios gerais (economia de tokens, escopo estrito, testes reais, fix de causa raiz, validação antes de declarar pronto) independente da linguagem.
- Camadas equivalentes ao MVC do padrão Java, adaptadas ao idioma da stack (ex.: Controllers/Services/Repositories em .NET, Controllers/Models/Services em Laravel, components/stores/services em Vue, Models/ViewModels/Repositories em mobile).
- Container/CI/CD adaptados à stack (Dockerfile multi-stage próprio da linguagem, pipeline do GitLab/GitHub ajustado ao build tool correspondente; mobile sem container, mas com pipeline de build/signing/release).
- Nunca aplicar regra específica de Java (JDK 8, `javax.*`, Hibernate) a projeto que não é Java.

## Padrões de arquivos e mobile/BI (skill `referencia-projeto`)
`application.properties`, `docker-compose.yml`, `Dockerfile`, Mobile e BI: carregue a skill `referencia-projeto`. Comandos: `docker compose up -d --build`, `docker compose logs --tail=100 app`, `mvn -q -Dtest=ClasseTest test`.

## Mods globais (todos os projetos e conversas, sem exceção)
- Plugins `painel-tarefa` e `etapas` (marketplace `joao-mods`, escopo usuário) sempre ativos em toda sessão, terminal, desktop e VS Code.
- `painel-tarefa` lê o limite de 5 h (Janela, Expira em, % utilizado) de `rateLimits` por `kind` ou rótulo; se mostrar "sem leitura", conferir o formato de `rateLimits` em `mods/painel-tarefa/hooks/register.tsx` (`paraUso`).
- Em toda tarefa com ação (mesmo de um passo só), chamar `mcp__etapas__etapa` ao planejar (concluidas=0) e ao concluir cada etapa, para a barra "Etapa N/total" com % e o alerta "Etapa concluída".
- Cores do contexto no painel: verde até 450K, amarelo até 600K, vermelho acima. Sem compactação automática; `/compact` só manual.

## Padrões de entrega
- Português BR, direto, sem preâmbulo nem conclusão decorativa.
- Valide sempre com lint/build/teste antes de declarar pronto.
- Sem comentários no código, sem emojis, sem arquivos/docs novos não pedidos.
- Raciocínio interno enxuto: pense em tópicos curtos, só o necessário para decidir; não re-derive o já estabelecido nem narre alternativas descartadas.
- Resumos (de compactação, de subagentes, finais) e todo texto ao usuário sempre em português BR, mesmo que a fonte (docs, logs, saídas de ferramenta) esteja em inglês.

## Skills globais por tipo de trabalho
- **Visualização e BI**: `dataviz` (gráficos, dashboards, cores, acessibilidade) — SEMPRE ler antes de criar chart/dashboard.
- **Design e diagramas**: `artifact-diagramming` (SVG, diagramas legíveis em modo claro/escuro), `artifact-design` (antes de qualquer artifact).
- **Documentos Office**: `pdf`, `xlsx`, `pptx` (leitura e criação de relatórios, planilhas, apresentações).
- **Qualidade de código**: `code-review` (diff, PR, --fix), `simplify` (refactor de reuso/eficiência).
- **Fluxos recorrentes**: `loop` (execução recorrente), `schedule` (cron agents agendados).
- **Referência técnica**: `claude-api` (modelos Claude, pricing, caching, tool-use).
- **Automação**: `plugin-authoring` (hooks, live panes no Code), `update-config` (settings.json, env vars, keybindings).

## Avaliação de MCP / Skills / Worktree por projeto
No início de um projeto novo (ou mudança grande), avaliar e propor ao usuário — não criar sem necessidade real:
- **MCP**: criar/configurar servidor MCP quando o projeto precisa integrar com sistema externo recorrente (banco específico, API interna, ferramenta proprietária) que os subagentes vão consultar repetidamente. Não criar MCP para algo que uma chamada de Bash/API pontual já resolve.
- **Skill**: criar skill quando houver um fluxo que se repete entre sessões/projetos (ex. checklist de release, padrão de PR, rotina de deploy específica do cliente). Não criar skill para tarefa de uso único.
- **Worktree**: ver seção "Isolamento com git worktree" acima — criar quando múltiplos subagentes editam em paralelo ou quando a mudança é grande/arriscada o suficiente para querer a working tree principal limpa durante o trabalho.
Decisão fica com `architect`/`orchestrator` no planejamento inicial; sinalizar a recomendação e aguardar confirmação antes de criar MCP ou skill novo (worktree pode ser decidido sem confirmação, é reversível).

## Skills (carregam sob demanda)
`git-flow` (branches/PR/MR/commits/tags) · `ci-pipelines` (GitHub Actions/GitLab CI) · `k8s-deploy` (manifests) · `gherkin-bdd` (BDD) · `powerbi-dashboard` (DAX/dashboards) · `dataviz` (gráficos/paletas/painéis) · `n8n-workflows` (automações/integrações) · `nginx-config` (reverse proxy/TLS) · `cypress-e2e` (testes E2E) · `db-testing` (testes reais por banco) · `sql-dialects` (MySQL/Oracle/SQL Server/PostgreSQL).

## MCP (usar só quando a tarefa exigir — cada um consome contexto)
- `context7` — docs atualizadas de libs (preferir a websearch).
- `playwright` — testar UI no navegador (QA/E2E).
- `kubernetes` — operar cluster (kubectl via MCP).
- `github` — API GitHub (requer token real e Docker Desktop rodando).
- `gitlab` — API GitLab oficial (autenticar via `/mcp`).
Para o restante use Bash local (git, mvn, docker compose, kubectl).

## Versionamento e CI (resumo — detalhes nas skills)
- Commits convencionais, PRs/MRs pequenos, nunca force-push em main/develop.
- Pipeline: `mvn -B -ntp verify` → build Docker → push só em main/develop/tags.

## Verificação por PIN/código (obrigatório)
- Nunca executar ação que dispare verificação por PIN, código, 2FA, Windows Hello, passphrase de chave SSH ou login OAuth (ex.: `git push`, `gh auth`, `docker login`, acesso a credenciais) sem perguntar antes e aguardar "sim" explícito no chat.
- Se for possível evitar a verificação, preferir alternativa que não a exija.

## Sincronização multi-máquina
Config completa (`CLAUDE.md`, `settings.json`, `statusline.js`, `agents/*.md`) vive no repo git privado `claude-dotfiles`. Em máquina nova: clonar o repo e rodar `install.ps1` de dentro dele para copiar os arquivos para `~/.claude/`. Depois de qualquer mudança nesses arquivos, repetir o `git add/commit/push` no repo para manter as máquinas em sincronia (não há sync automático por conta).