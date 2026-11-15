---
name: canvas
description: Padrões de HTML5 Canvas, Konva e Fabric.js — setup com devicePixelRatio, render sob demanda, pointer events, zoom/pan, hit-test, exportação. Use ao criar quadro branco, editor visual, diagrama interativo ou desenho em canvas.
---

# canvas
- Escolha: canvas 2D puro para desenho/gráfico simples; Konva para formas arrastáveis, camadas e transformações; Fabric.js para edição de objetos (texto, imagem, seleção múltipla); SVG quando houver poucos elementos e precisar de acessibilidade/DOM.
- Setup nítido: `canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr,0,0,dpr,0,0)`; CSS com `w`/`h` lógicos; refazer em `ResizeObserver`.
- Render sob demanda: flag `dirty` + um único `requestAnimationFrame`; nunca loop contínuo parado. Pausar em `visibilitychange`.
- Entrada: `pointerdown/move/up` com `setPointerCapture`; `touch-action: none` no canvas; coordenadas via `getBoundingClientRect()` e matriz inversa de zoom/pan.
- Zoom/pan: zoom no cursor com `wheel` (`passive: false`), limites min/max; pan com botão do meio ou espaço+arrastar.
- Estado: modelo de dados (array de formas) separado do desenho; desfazer/refazer com pilha de snapshots ou comandos.
- Hit-test: `ctx.isPointInPath`/`isPointInStroke` ou bounding box; para muitos objetos, grade espacial.
- Performance: camada estática em `OffscreenCanvas`/canvas separado; agrupar `beginPath`; evitar `shadowBlur` e `getImageData` por frame.
- Acessibilidade: `role="img"` + `aria-label`, ou conteúdo alternativo dentro da tag; atalhos de teclado para ações principais.
- Tema: cores de tokens CSS lidas com `getComputedStyle`; redesenhar em mudança de `prefers-color-scheme`.
- Exportar: `canvas.toBlob` (PNG) e `JSON.stringify(modelo)`; importar valida o esquema antes de desenhar.
- Libs via CDN com versão exata (ex.: `konva@9.3.6`, `fabric@5.3.0`), nunca `@latest`.
