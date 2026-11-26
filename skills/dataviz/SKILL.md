---
name: dataviz
description: Escolha de gráfico, paleta, layout de painel e acessibilidade. Use antes de criar qualquer chart ou dashboard.
---

# dataviz
- Tipo por pergunta: comparação = barras (horizontais se rótulos longos); tendência = linha; parte do todo = barra empilhada 100% (pizza só com até 4 fatias); distribuição = histograma/boxplot; correlação = dispersão; KPI = número grande + variação.
- Eixo Y de barras começa em zero; sem 3D, sem gráfico duplo-eixo salvo pedido.
- Paleta: categórica com até 7 cores distinguíveis por daltônicos (ex.: Okabe-Ito `#0072B2 #E69F00 #009E73 #D55E00 #CC79A7 #56B4E9 #F0E442`); sequencial em um matiz; divergente com neutro no centro.
- Cor sempre acompanhada de rótulo ou forma; contraste mínimo 4.5:1 em texto; suporte a tema claro e escuro.
- Layout: KPIs no topo, tendência no meio, detalhe/tabela embaixo; leitura em Z; no máximo 6-8 visuais por tela; filtros globais no topo.
- Rótulos diretos em vez de legenda quando possível; números em pt-BR (`1.234,5`), datas `dd/MM/yyyy`; título diz a conclusão, não só a métrica.
- Responsivo: em telas estreitas, empilhar visuais em uma coluna.
- Dados de exemplo sempre marcados como fixture; nunca apresentar números inventados como reais.

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
