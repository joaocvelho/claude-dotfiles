import json
import os
import re
import sys

NOME = "mysql-leitura"
VERSAO = "0.1.0"
MAX_LINHAS = int(os.environ.get("MYSQL_LEITURA_MAX_LINHAS", "200"))
TIMEOUT_MS = int(os.environ.get("MYSQL_LEITURA_TIMEOUT_MS", "15000"))
PERMITIDOS = [h.strip().lower() for h in os.environ.get("MYSQL_LEITURA_HOSTS_PERMITIDOS", "localhost,127.0.0.1").split(",") if h.strip()]
BLOQUEIO = re.compile(r"(prod|prd)", re.I)
INICIO_OK = re.compile(r"^\s*(select|show|explain|describe|desc|with)\b", re.I)
PROIBIDO = re.compile(r"\b(insert|update|delete|replace|merge|drop|alter|create|truncate|rename|grant|revoke|call|load|handler|lock|unlock|set|use|kill|flush|reset|purge|install|uninstall|sleep|benchmark|get_lock)\b|into\s+(out|dump)file|for\s+update|lock\s+in\s+share\s+mode", re.I)


def config():
    return {
        "host": os.environ.get("MYSQL_LEITURA_HOST", "127.0.0.1"),
        "port": int(os.environ.get("MYSQL_LEITURA_PORT", "3306")),
        "user": os.environ.get("MYSQL_LEITURA_USER", ""),
        "password": os.environ.get("MYSQL_LEITURA_PASSWORD", ""),
        "database": os.environ.get("MYSQL_LEITURA_DATABASE") or None,
    }


def validar_host(host):
    h = host.lower()
    if BLOQUEIO.search(h):
        raise ValueError("Host bloqueado: parece produção (%s). Este MCP nunca acessa produção." % host)
    if h not in PERMITIDOS:
        raise ValueError("Host %s fora de MYSQL_LEITURA_HOSTS_PERMITIDOS (%s)." % (host, ", ".join(PERMITIDOS)))


def sem_literais(sql):
    sql = re.sub(r"'(?:[^'\\]|\\.)*'", "''", sql)
    sql = re.sub(r'"(?:[^"\\]|\\.)*"', '""', sql)
    sql = re.sub(r"`[^`]*`", "``", sql)
    return re.sub(r"/\*.*?\*/|--[^\n]*|#[^\n]*", " ", sql, flags=re.S)


def validar_sql(sql):
    limpo = sem_literais(sql).strip().rstrip(";").strip()
    if not limpo:
        raise ValueError("SQL vazio.")
    if ";" in limpo:
        raise ValueError("Só uma instrução por chamada.")
    if not INICIO_OK.match(limpo):
        raise ValueError("Só SELECT, SHOW, EXPLAIN, DESCRIBE ou WITH ... SELECT.")
    m = PROIBIDO.search(limpo)
    if m:
        raise ValueError("Palavra proibida em modo leitura: %s" % m.group(0))
    return sql.strip().rstrip(";")


def executar(sql, parametros=None, porta=None, base=None):
    sql = validar_sql(sql)
    c = config()
    if porta:
        c["port"] = int(porta)
    if base:
        if not re.fullmatch(r"[A-Za-z0-9_$]+", base):
            raise ValueError("Nome de base inválido.")
        c["database"] = base
    validar_host(c["host"])
    if not c["user"]:
        raise RuntimeError("Defina MYSQL_LEITURA_USER e MYSQL_LEITURA_PASSWORD (variáveis de ambiente).")
    try:
        import pymysql
    except ImportError:
        raise RuntimeError("Driver pymysql ausente. Instale com: python -m pip install --user pymysql")
    con = pymysql.connect(host=c["host"], port=c["port"], user=c["user"], password=c["password"], database=c["database"],
                          charset="utf8mb4", connect_timeout=10, read_timeout=max(5, TIMEOUT_MS // 1000), autocommit=False)
    try:
        with con.cursor() as cur:
            cur.execute("SET SESSION TRANSACTION READ ONLY")
            try:
                cur.execute("SET SESSION max_execution_time = %s", (TIMEOUT_MS,))
            except Exception:
                pass
            cur.execute("START TRANSACTION READ ONLY")
            cur.execute(sql, parametros or None)
            colunas = [d[0] for d in cur.description] if cur.description else []
            linhas = cur.fetchmany(MAX_LINHAS + 1)
            con.rollback()
    finally:
        con.close()
    truncado = len(linhas) > MAX_LINHAS
    linhas = linhas[:MAX_LINHAS]
    saida = [" | ".join(colunas)] if colunas else []
    saida += [" | ".join("NULL" if v is None else str(v) for v in l) for l in linhas]
    saida.append("(%d linha(s)%s; host %s:%s; base %s)" % (len(linhas), ", TRUNCADO" if truncado else "", c["host"], c["port"], c["database"] or "-"))
    return "\n".join(saida)


FERRAMENTAS = [
    {"name": "consultar", "description": "Executa uma consulta só de leitura (SELECT, SHOW, EXPLAIN, DESCRIBE, WITH...SELECT) em transação READ ONLY, em host local/homol permitido. Nunca produção. Use para conferir antes/depois dos testes reais, como no DBeaver.",
     "inputSchema": {"type": "object", "properties": {"sql": {"type": "string"}, "parametros": {"type": "array", "items": {}}, "porta": {"type": "integer", "description": "Porta do container MySQL 5.7 local do projeto (docker ps); padrão MYSQL_LEITURA_PORT"}, "base": {"type": "string"}}, "required": ["sql"]}},
    {"name": "listar_tabelas", "description": "Lista as tabelas da base (SHOW TABLES).",
     "inputSchema": {"type": "object", "properties": {"porta": {"type": "integer"}, "base": {"type": "string"}}}},
    {"name": "descrever_tabela", "description": "Mostra colunas, tipos, charset e índices de uma tabela (SHOW FULL COLUMNS e SHOW INDEX).",
     "inputSchema": {"type": "object", "properties": {"tabela": {"type": "string"}, "porta": {"type": "integer"}, "base": {"type": "string"}}, "required": ["tabela"]}},
    {"name": "conexao", "description": "Mostra host, porta, base e usuário configurados (sem senha) e se o host é permitido.",
     "inputSchema": {"type": "object", "properties": {}}},
]


def chamar(nome, args):
    porta, base = args.get("porta"), args.get("base")
    if nome == "consultar":
        return executar(args.get("sql", ""), args.get("parametros"), porta, base)
    if nome == "listar_tabelas":
        return executar("SHOW TABLES", None, porta, base)
    if nome == "descrever_tabela":
        t = args.get("tabela", "")
        if not re.fullmatch(r"[A-Za-z0-9_$.]+", t):
            raise ValueError("Nome de tabela inválido.")
        alvo = ".".join("`%s`" % p for p in t.split("."))
        return executar("SHOW FULL COLUMNS FROM %s" % alvo, None, porta, base) + "\n\n" + executar("SHOW INDEX FROM %s" % alvo, None, porta, base)
    if nome == "conexao":
        c = config()
        try:
            validar_host(c["host"])
            ok = "permitido"
        except ValueError as e:
            ok = str(e)
        return "host=%s porta=%s base=%s usuario=%s senha=%s -> %s" % (c["host"], c["port"], c["database"], c["user"] or "(não definido)", "definida" if c["password"] else "(não definida)", ok)
    raise ValueError("Ferramenta desconhecida: %s" % nome)


def responder(id_, resultado=None, erro=None):
    msg = {"jsonrpc": "2.0", "id": id_}
    if erro is not None:
        msg["error"] = erro
    else:
        msg["result"] = resultado
    sys.stdout.write(json.dumps(msg, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main():
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    for linha in sys.stdin:
        linha = linha.strip().lstrip("﻿")
        if not linha:
            continue
        try:
            req = json.loads(linha)
        except ValueError:
            continue
        metodo, id_ = req.get("method"), req.get("id")
        if id_ is None:
            continue
        p = req.get("params") or {}
        if metodo == "initialize":
            responder(id_, {"protocolVersion": p.get("protocolVersion", "2025-06-18"), "capabilities": {"tools": {}},
                            "serverInfo": {"name": NOME, "version": VERSAO}})
        elif metodo == "ping":
            responder(id_, {})
        elif metodo == "tools/list":
            responder(id_, {"tools": FERRAMENTAS})
        elif metodo == "tools/call":
            try:
                texto = chamar(p.get("name"), p.get("arguments") or {})
                responder(id_, {"content": [{"type": "text", "text": texto}], "isError": False})
            except Exception as e:
                responder(id_, {"content": [{"type": "text", "text": "ERRO: %s" % e}], "isError": True})
        else:
            responder(id_, erro={"code": -32601, "message": "Método não suportado: %s" % metodo})


if __name__ == "__main__":
    main()
