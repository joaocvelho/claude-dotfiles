---
name: db-testing
description: Testes reais contra banco real (MySQL/SQL Server/Oracle/PostgreSQL) via Testcontainers ou docker compose, conferidos no DBeaver. Use ao escrever ou rodar testes que tocam banco.
---

# db-testing
- Proibido mock em qualquer camada: Mockito, @MockBean, H2/HSQLDB/Derby, WireMock, stub de API.
- Banco real: MySQL 5.7 (padrão), 5.1/5.5 (legado), SQL Server, Oracle ou PostgreSQL conforme o projeto.
- Subir: `docker compose up -d db` (conferir `docker compose ps`) ou Testcontainers com a imagem real.
- Profile de teste com `${DB_URL}`/`${DB_USER}`/`${DB_PASS}`; nunca credencial literal.
- Cada teste comprova no banco: SELECT antes/depois de inserção, alteração e exclusão; conferir no DBeaver.
- Ambientes: local ou homol; nunca produção. Em homol: perguntar antes, dados de teste identificáveis, limpeza ao final conferida com SELECT.
- Reportar: banco/versão, quantidade de testes reais e consultas que comprovaram.
