# CLAUDE.md — Configuração global (Claude Code Desktop)

## Objetivo
Reduzir consumo de tokens ao máximo **sem perder qualidade**: solução correta na primeira vez, fix mínimo, zero retrabalho. Menor caminho que resolve o problema = melhor resposta.

## Regras de economia de tokens (obrigatórias)
1. **Leitura seletiva**: localize com `grep`/`glob` antes de ler; leia só o trecho (offset/limit, ~50-100 linhas). Nunca leia um arquivo inteiro sem necessidade clara.
2. **Nunca injete logs/builds inteiros no contexto**: `--tail=N`, `| Select-Object -Last 50`, `head`/`tail`, filtros por nível de erro. Saída de comando sempre truncada.
3. **Respostas enxutas**: sem preâmbulo, sem resumir o já dito, sem explicar código não pedido. Texto ≤4 linhas; o resto é ação (ferramenta).
4. **Contexto**: `/clear` entre tarefas sem relação; `/compact` ao fim de cada etapa concluída e **antes** do alerta ⚠ do statusline (alerta em ~420K, auto-limpeza automática em 450K).
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

## Testes: proibido mock de banco
- **Nunca** usar banco mockado/in-memory (H2, `@MockBean` em repository, Mockito para DAO/Repository) para validar persistência.
- Todo teste que toca banco roda contra instância **real**: MySQL, SQL Server, Oracle ou PostgreSQL (via `docker compose up -d db` ou Testcontainers com a imagem real do banco do projeto).
- Mock é aceitável só para dependências externas que não são o próprio banco sob teste (ex. API externa, fila) — nunca para a camada de persistência que o teste quer validar.
- Antes de rodar teste de integração, confirme que o banco real está de pé (`docker compose ps`); se não estiver, suba com `docker compose up -d --build` antes de rodar `mvn -q -Dtest=...`.

## Isolamento com git worktree
- Para qualquer subagente que **edita código** em múltiplos arquivos (`backend`, `frontend`, `full-stack`, `devops`, `ci-cd`, `ai-engineer`), delegar com `isolation: worktree` no Agent tool — mantém a working tree principal limpa enquanto o subagente trabalha.
- Subagentes somente-leitura (`architect`, `code-reviewer`, `cyber-security`, `quality-analyst` quando só roda teste, `specialist`, `business-analyst`, `product-owner`, `gherkin`, `orchestrator`, `doc-analyst`, `release-validator`) não precisam de worktree isolado.
- Avalie a necessidade de worktree por projeto: repositórios pequenos/single-module podem não justificar isolamento; múltiplos subagentes editando em paralelo no mesmo repo sempre justificam.

## Subagentes globais (`~/.claude/agents/`)
Fluxo: `product-owner` → `business-analyst`/`gherkin`/`doc-analyst` → `architect` → `backend`/`frontend`/`full-stack`/`ai-engineer` → `devops`/`ci-cd` → `code-reviewer`+`cyber-security` → `quality-analyst` → `release-validator`. `orchestrator` coordena o fluxo inteiro; `specialist` entra só para problema técnico pontual difícil.

| Agente | Model | Função |
|---|---|---|
| orchestrator | sonnet | Coordena o fluxo ponta a ponta |
| product-owner | haiku | Define escopo/prioridade da feature |
| business-analyst | haiku | Traduz requisito de negócio em regra técnica |
| doc-analyst | haiku | Lê documentos (PDF/Word/Confluence/specs) e extrai requisitos, regras de negócio e critérios de aceite — usar antes de implementar quando houver doc de referência |
| gherkin | haiku | Escreve critérios de aceite em BDD |
| architect | sonnet | Desenha solução e pontos de impacto |
| backend | sonnet | Implementa camada server-side |
| frontend | sonnet | Implementa camada client-side |
| full-stack | sonnet | Implementa quando back+front são acoplados |
| ai-engineer | sonnet | Implementa integrações com LLM/MCP |
| devops | sonnet | Ajusta infra, Docker, ambientes |
| ci-cd | sonnet | Ajusta pipelines de build/deploy |
| code-reviewer | sonnet | Revisa qualidade/correção do código |
| cyber-security | sonnet | Revisa vulnerabilidades |
| quality-analyst | sonnet | Roda e valida testes reais |
| release-validator | sonnet | Valida o fluxo completo antes de considerar "pronto": build, testes reais, container sobe, pipeline CI/CD passa, versionamento consistente, nada quebra em homol/prod |
| specialist | sonnet | Problema técnico pontual difícil |

### `release-validator` — checklist obrigatório antes de finalizar entrega
Acionar sempre que a tarefa envolver deploy, build, pipeline ou mudança que toca ambiente (não para edições triviais). Validar, nesta ordem, e reportar o que falhou sem tentar "forçar passar":
1. **Versionamento**: branch/commit segue padrão do repo (Git), sem divergência não resolvida (merge conflict, rebase pendente).
2. **Build**: compila/builda limpo na stack do projeto (ex. `mvn -q clean package`, `npm run build`, `dotnet build`).
3. **Testes reais**: suíte de testes roda contra dependências reais (banco real via Testcontainers/docker compose — nunca mock de banco), sem skip indevido.
4. **Container**: imagem builda e sobe (`docker compose up -d --build`) sem erro de start, healthcheck passa.
5. **CI/CD**: pipeline (GitLab CI, GitHub Actions etc.) teria stages compatíveis com a mudança — se o `.yml` do pipeline precisa de ajuste, sinalizar antes de declarar pronto.
6. **Compatibilidade homol/prod**: variáveis de ambiente usadas (não hardcoded), migrações de banco (Flyway/Liquibase) aplicáveis sem quebrar dado existente, sem mudança de contrato de API sem versionamento.
Se qualquer item falhar, reportar a causa raiz e não declarar a tarefa concluída.

## Stack fixa por padrão (NUNCA modernizar sem pedido)
- **JDK 8** (`-source/-target 1.8`): sem `var`, records, text blocks, `List.of`, switch expression. `stream`, `Optional`, lambdas, `java.time` OK.
- **Spring Boot 1.5.13.RELEASE**: `javax.*` (nunca `jakarta.*`), Java 8, Tomcat 8.5, `spring-boot-starter-parent` 1.5.13.RELEASE. Não atualizar Boot/dependências sem pedido explícito.
- **MySQL**: driver `mysql:mysql-connector-java:5.1.47`, classe `com.mysql.jdbc.Driver`, dialect `MySQL5Dialect`, charset `utf8mb4`.
- Proibido: migrar para Boot 2+/3, Jakarta, Gradle ou novo driver sem pedido explícito.

## Outras stacks (quando o projeto exigir)
O padrão acima (JDK 8/Spring Boot/MySQL) é o **default da empresa**, não uma camisa de força. Se o projeto já usa, ou o usuário pede, outra stack — **Vue, React, Angular, PHP (Laravel/Symfony), .NET (C#/ASP.NET Core), Python (Django/FastAPI), Node.js, Go** etc. — está **autorizado implementar nessa stack**, seguindo:
- Convenções e versões já existentes no projeto (detectar via `package.json`, `composer.json`, `*.csproj`, `requirements.txt`, lockfiles) em vez de impor o padrão Java.
- Mesmos princípios gerais (economia de tokens, escopo estrito, testes reais, fix de causa raiz, validação antes de declarar pronto) independente da linguagem.
- Camadas equivalentes ao MVC do padrão Java, adaptadas ao idioma da stack (ex.: Controllers/Services/Repositories em .NET, Controllers/Models/Services em Laravel, components/stores/services em Vue).
- Container/CI/CD adaptados à stack (Dockerfile multi-stage próprio da linguagem, pipeline do GitLab/GitHub ajustado ao build tool correspondente).
- Nunca aplicar regra específica de Java (JDK 8, `javax.*`, Hibernate) a projeto que não é Java.

## application.properties (padrão do projeto)
```properties
server.port=${PORT:8080}
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/appdb?useSSL=false&characterEncoding=utf8&serverTimezone=America/Sao_Paulo}
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASS:root}
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.tomcat.max-active=20
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL5Dialect
spring.jpa.open-in-view=false
spring.http.encoding.charset=UTF-8
spring.http.encoding.force=true
logging.level.root=INFO
logging.level.com.seu.pacote=DEBUG
```
Segredos só via variável de ambiente (`${...}`) — nunca valor literal de senha em commit.

## docker-compose.yml (padrão do projeto)
```yaml
services:
  db:
    image: mysql:5.7
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    environment: { MYSQL_DATABASE: appdb, MYSQL_ROOT_PASSWORD: root }
    ports: ["3306:3306"]
    volumes: [dbdata:/var/lib/mysql]
    healthcheck: { test: ["CMD", "mysqladmin", "ping", "-h", "localhost"], interval: 10s, timeout: 5s, retries: 10 }
  app:
    build: .
    depends_on: { db: { condition: service_healthy } }
    environment:
      DB_URL: jdbc:mysql://db:3306/appdb?useSSL=false&characterEncoding=utf8&serverTimezone=America/Sao_Paulo
      DB_USER: root
      DB_PASS: root
    ports: ["8080:8080"]
volumes: { dbdata: {} }
```
`Dockerfile` base: `FROM maven:3.6-jdk-8` → `COPY pom.xml` → `RUN mvn -q dependency:go-offline` → `COPY src` → `RUN mvn -q package -DskipTests` → `FROM openjdk:8-jre-slim` → copiar jar → `ENTRYPOINT ["java","-jar","/app.jar"]`.

Comandos econômicos: `docker compose up -d --build`, `docker compose logs --tail=100 app`, `docker compose ps`, `mvn -q -Dtest=ClasseTest test`.

## Padrões de entrega
- Português BR, direto, sem preâmbulo nem conclusão decorativa.
- Valide sempre com lint/build/teste antes de declarar pronto.
- Sem comentários no código, sem emojis, sem arquivos/docs novos não pedidos.
- Raciocínio interno enxuto: pense em tópicos curtos, só o necessário para decidir; não re-derive o já estabelecido nem narre alternativas descartadas.
- Resumos (de compactação, de subagentes, finais) e todo texto ao usuário sempre em português BR, mesmo que a fonte (docs, logs, saídas de ferramenta) esteja em inglês.

## Avaliação de MCP / Skills / Worktree por projeto
No início de um projeto novo (ou mudança grande), avaliar e propor ao usuário — não criar sem necessidade real:
- **MCP**: criar/configurar servidor MCP quando o projeto precisa integrar com sistema externo recorrente (banco específico, API interna, ferramenta proprietária) que os subagentes vão consultar repetidamente. Não criar MCP para algo que uma chamada de Bash/API pontual já resolve.
- **Skill**: criar skill quando houver um fluxo que se repete entre sessões/projetos (ex. checklist de release, padrão de PR, rotina de deploy específica do cliente). Não criar skill para tarefa de uso único.
- **Worktree**: ver seção "Isolamento com git worktree" acima — criar quando múltiplos subagentes editam em paralelo ou quando a mudança é grande/arriscada o suficiente para querer a working tree principal limpa durante o trabalho.
Decisão fica com `architect`/`orchestrator` no planejamento inicial; sinalizar a recomendação e aguardar confirmação antes de criar MCP ou skill novo (worktree pode ser decidido sem confirmação, é reversível).

## Sincronização multi-máquina
Config completa (`CLAUDE.md`, `settings.json`, `statusline.js`, `agents/*.md`) vive no repo git privado `claude-dotfiles`. Em máquina nova: clonar o repo e rodar `install.ps1` de dentro dele para copiar os arquivos para `~/.claude/`. Depois de qualquer mudança nesses arquivos, repetir o `git add/commit/push` no repo para manter as máquinas em sincronia (não há sync automático por conta).