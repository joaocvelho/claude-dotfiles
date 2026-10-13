---
name: powerbi-dashboard
description: Power BI: modelo estrela, medidas DAX e layout de relatório. Use ao criar dashboard ou medidas no Power BI.
---

# powerbi-dashboard
- Modelo estrela: fatos + dimensões, relacionamento 1:N, dimensão Calendário marcada como tabela de datas.
- Medidas DAX explícitas (sem colunas implícitas); `DIVIDE` em vez de `/`; variáveis `VAR`.
- Fonte: SQL real do banco do projeto/DW; credenciais no gateway, nunca no arquivo.
- Entregar modelo, medidas e layout em texto; o `.pbix` é montado pelo usuário.
- Cores e tipos de gráfico seguindo a skill `dataviz`.
