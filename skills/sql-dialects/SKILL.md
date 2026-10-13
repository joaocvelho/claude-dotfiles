---
name: sql-dialects
description: Diferenças de SQL entre MySQL, SQL Server, Oracle e PostgreSQL (paginação, autoincremento, datas, strings, upsert). Use ao escrever SQL portável ou específico de banco.
---

# sql-dialects
| Recurso | MySQL 5.7 | SQL Server | Oracle | PostgreSQL |
|---|---|---|---|---|
| Paginação | `LIMIT n OFFSET m` | `OFFSET m ROWS FETCH NEXT n ROWS ONLY` | `OFFSET m ROWS FETCH NEXT n ROWS ONLY` (12c+) / `ROWNUM` | `LIMIT n OFFSET m` |
| Autoincremento | `AUTO_INCREMENT` | `IDENTITY(1,1)` | `SEQUENCE` / `IDENTITY` (12c+) | `SERIAL` / `IDENTITY` |
| Agora | `NOW()` | `GETDATE()` | `SYSDATE` / `SYSTIMESTAMP` | `NOW()` |
| Concatenação | `CONCAT(a,b)` | `a + b` / `CONCAT` | `a \|\| b` | `a \|\| b` |
| Nulo | `IFNULL` | `ISNULL` | `NVL` | `COALESCE` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `MERGE` | `MERGE` | `ON CONFLICT DO UPDATE` |
| Texto longo | `TEXT`/`LONGTEXT` | `NVARCHAR(MAX)` | `CLOB` | `TEXT` |
- `COALESCE` é portável; preferir quando possível.
- MySQL 5.7: sem CTE/window functions (só no 8). Charset `utf8mb4`.
- Testar a query no banco-alvo real.
