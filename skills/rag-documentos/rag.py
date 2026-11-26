import argparse
import math
import os
import re
import sys
import unicodedata
import zipfile
from collections import Counter
from xml.etree import ElementTree

EXTS = {".md", ".txt", ".docx", ".sql", ".properties", ".yml", ".yaml"}
IGNORAR = {".git", "node_modules", "target", "dist", "build", ".idea", ".vscode"}
STOP = set("a o e de da do das dos em no na nos nas um uma para por com que se ao aos as os ou the and of to in is".split())
W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def normalizar(texto):
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return [p for p in re.findall(r"[a-z0-9_.\-/:]+", t) if p not in STOP and len(p) > 1]


def ler_linhas(caminho):
    if caminho.lower().endswith(".docx"):
        with zipfile.ZipFile(caminho) as z:
            raiz = ElementTree.fromstring(z.read("word/document.xml"))
        return ["".join(t.text or "" for t in p.iter(W_NS + "t")) for p in raiz.iter(W_NS + "p")]
    for enc in ("utf-8-sig", "cp1252"):
        try:
            with open(caminho, encoding=enc) as f:
                return [l.rstrip("\r") for l in f.read().split("\n")]
        except UnicodeDecodeError:
            continue
    return []


def coletar(raiz, max_mb):
    for base, dirs, arquivos in os.walk(raiz):
        dirs[:] = [d for d in dirs if d not in IGNORAR and not d.startswith(".")]
        for nome in arquivos:
            caminho = os.path.join(base, nome)
            if nome.startswith("~$"):
                continue
            if os.path.splitext(nome)[1].lower() in EXTS and os.path.getsize(caminho) <= max_mb * 1024 * 1024:
                yield caminho


def blocos(raiz, janela, max_mb):
    for caminho in coletar(raiz, max_mb):
        try:
            linhas = ler_linhas(caminho)
        except Exception as erro:
            print("IGNORADO %s: %s" % (caminho, erro), file=sys.stderr)
            continue
        passo = max(1, janela // 2)
        for i in range(0, max(1, len(linhas)), passo):
            trecho = linhas[i:i + janela]
            termos = normalizar(" ".join(trecho))
            if termos:
                yield caminho, i + 1, trecho, termos


def buscar(raiz, consulta, k, janela, max_mb):
    docs = list(blocos(raiz, janela, max_mb))
    if not docs:
        return []
    n = len(docs)
    media = sum(len(d[3]) for d in docs) / n
    df = Counter()
    for d in docs:
        df.update(set(d[3]))
    q = normalizar(consulta)
    k1, b = 1.5, 0.75
    pontos = []
    for caminho, linha, trecho, termos in docs:
        tf = Counter(termos)
        s = 0.0
        for t in q:
            if t in tf:
                idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
                s += idf * tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * len(termos) / media))
        if s > 0:
            pontos.append((s, caminho, linha, trecho))
    pontos.sort(key=lambda x: -x[0])
    return pontos[:k]


def main():
    ap = argparse.ArgumentParser(description="Busca local (BM25) nos documentos do projeto, com doc:linha.")
    ap.add_argument("raiz")
    ap.add_argument("consulta")
    ap.add_argument("-k", type=int, default=8)
    ap.add_argument("--janela", type=int, default=6)
    ap.add_argument("--max-mb", type=float, default=5)
    a = ap.parse_args()
    for s, caminho, linha, trecho in buscar(a.raiz, a.consulta, a.k, a.janela, a.max_mb):
        rel = os.path.relpath(caminho, a.raiz)
        print("== %s:%d (score %.2f)" % (rel, linha, s))
        for j, t in enumerate(trecho):
            if t.strip():
                print("%5d | %s" % (linha + j, t[:200]))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
