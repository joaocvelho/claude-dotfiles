---
name: rag-documentos
description: RAG local dos documentos do projeto (busca BM25 só na máquina, sem API externa), devolvendo trechos com doc:linha. Use para localizar regras, requisitos, decisões e pendências em muitos documentos antes de ler o trecho, e para citar evidência doc:linha.
---

# RAG local dos documentos

Busca por relevância (BM25) em `.md`, `.txt`, `.docx`, `.sql`, `.properties` e `.yml` de uma pasta, sem índice persistido, sem rede e sem dependências (Python stdlib). Nenhum conteúdo sai da máquina.

## Uso
```
python "%USERPROFILE%\.claude\skills\rag-documentos\rag.py" "<raiz do projeto>" "<consulta>" -k 8
```
- Saída: `== arquivo:linha (score)` seguido das linhas do trecho numeradas; citar como `doc:linha`.
- `--janela N` linhas por trecho (padrão 6); `--max-mb` ignora arquivos maiores (padrão 5).
- Ignora `.git`, `node_modules`, `target`, `dist`, `build` e pastas ocultas.
- PDF não é lido: usar a versão `.md`/`.docx` do documento; se só houver PDF, ler com a skill `pdf` e declarar.

## Regras
- O resultado só localiza; confirmar lendo o trecho com Read (offset/limit) antes de afirmar.
- Nunca indexar nem imprimir arquivo de segredos (ex.: valores de tokens/properties sensíveis): passar a raiz certa ou mover a consulta para a pasta de documentos.
- Busca sem resultado = "não encontrado nos documentos", nunca suposição.
