---
name: referencia-projeto
description: Mobile (Flutter/Kotlin/Swift), BI/dashboards e os padrões application.properties, docker-compose.yml e Dockerfile do projeto. Use ao criar/ajustar esses arquivos ou apps mobile/BI.
---
### Mobile (Flutter, Kotlin, Swift)
- **Flutter**: Dart, Firebase (opcional), testes com `flutter test` e integração com Testcontainers para backend; CI/CD com Fastlane ou GitHub Actions.
- **Kotlin**: JDK 8+, Android SDK, Room DB (local) ou integração com backend via Retrofit; testes com JUnit + Espresso ou Robolectric (com cuidado — preferir testes de integração real contra servidor de testes).
- **Swift**: iOS SDK, Core Data (local) ou URLSession para backend; testes com XCTest; CI/CD com Xcode Cloud ou GitHub Actions.
- Testes mobile: sempre contra API de testes real (backend em Docker local), nunca mock de rede.

## Dashboards e BI (Power BI, Tableau, Grafana, custom)
- **Power BI**: modelos de dados, DAX, queries em SQL real (banco projeto ou data warehouse), relatórios interativos, publicação em Power BI Service.
- **Tableau**: conexão com banco de dados ou data lakes, cálculos avançados, dashboards compartilhados, automação com Tableau Server API.
- **Grafana**: datasources (Prometheus, InfluxDB, MySQL, ElasticSearch), dashboards de métricas e logs, alertas, provisioning via código.
- **Custom (HTML/React/Vue)**: componentes de gráficos (Recharts, Chart.js, D3.js, ECharts), dados via API real, responsivos, temas claro/escuro.
- **Excalidraw/Miro**: wireframes e diagramas; uso via integração (exportar para artifact ou PNG para documentação), não produção.

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

