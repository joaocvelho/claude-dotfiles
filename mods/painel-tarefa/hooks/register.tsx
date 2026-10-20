import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Agente, Tarefa, Uso } from '../types'

const uso = atom({ plugin: 'painel-tarefa', key: 'uso' } as const, null)
const tarefa = atom({ plugin: 'painel-tarefa', key: 'tarefa' } as const, null)
const agentes = atom({ plugin: 'painel-tarefa', key: 'agentes' } as const, [])
const tick = atom({ plugin: 'painel-tarefa', key: 'tick' } as const, 0)

const VERDE = 450000
const AMARELO = 600000
const JANELA_5H = 5 * 60 * 60000
const ETAPA = 'mcp__etapas__etapa'

type Todo = { status: string }

const tarefas = new Map<string, string>()

export function k(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
}

export function duracao(ms: number) {
  if (!(ms > 0)) return '0m'
  const m = Math.round(ms / 60000)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h${String(m % 60).padStart(2, '0')}` : `${m}m`
}

export function corContexto(tokens: number) {
  return tokens > AMARELO ? 'red' : tokens > VERDE ? 'yellow' : 'green'
}

export function fatia(pct: number) {
  const p = Math.max(0, Math.min(100, pct))
  return p <= 0 ? '○' : p <= 25 ? '◔' : p <= 50 ? '◑' : p < 100 ? '◕' : '●'
}

export function pizzaSvg(pct: number, cor: string) {
  const p = Math.max(0, Math.min(100, pct)) / 100
  const fundo = '<circle cx="12" cy="12" r="10" fill="#8884" stroke="#8888" stroke-width="1"/>'
  if (p >= 0.999) return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${fundo}<circle cx="12" cy="12" r="10" fill="${cor}"/></svg>`
  const ang = p * 2 * Math.PI
  const x = (12 + 10 * Math.sin(ang)).toFixed(2)
  const y = (12 - 10 * Math.cos(ang)).toFixed(2)
  const arco = p > 0 ? `<path d="M12 12 L12 2 A10 10 0 ${p > 0.5 ? 1 : 0} 1 ${x} ${y} Z" fill="${cor}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${fundo}${arco}</svg>`
}

export function janela(reset: string | null, pct5h: number | null, agora: number) {
  const resta = reset ? Date.parse(reset) - agora : NaN
  const valido = resta > 0 && resta <= JANELA_5H
  const expirada = resta <= 0
  return {
    decorridoPct: valido ? Math.round(((JANELA_5H - resta) * 100) / JANELA_5H) : expirada ? 100 : null,
    decorrido: valido ? duracao(JANELA_5H - resta) : null,
    restaPct: valido ? Math.round((resta * 100) / JANELA_5H) : expirada ? 0 : null,
    resta: valido ? duracao(resta) : null,
    usado: expirada ? 0 : pct5h === null ? null : Math.round(pct5h),
    expirada,
  }
}

export function estimar(t: Tarefa, agora: number) {
  const decorrido = agora - t.inicio
  if (!t.ativa) return `levou ${duracao(decorrido)}`
  if (t.total > 0 && t.concluidas > 0) {
    const total = (decorrido * t.total) / t.concluidas
    return `total ~${duracao(total)} (faltam ~${duracao(total - decorrido)})`
  }
  return `${duracao(decorrido)} decorridos, estimando…`
}

export function paraUso(tokens: number | undefined, janela: number, limites: readonly SessionRateLimit[]): Uso {
  const cinco = limites.find(r => /five.?hour|5.?h(our)?/i.test(String((r as any).kind || '') + ' ' + String((r as any).label || '')))
  return {
    tokens: tokens || 0,
    janela,
    reset: cinco && cinco.resetsAt ? cinco.resetsAt : null,
    pct5h: cinco ? cinco.percentUsed : null,
  }
}

export function mesclar(antes: Uso | null, novo: Uso): Uso {
  if (!antes) return novo
  return {
    tokens: novo.tokens || antes.tokens,
    janela: novo.janela || antes.janela,
    reset: novo.reset || antes.reset,
    pct5h: novo.pct5h === null ? antes.pct5h : novo.pct5h,
  }
}

async function progresso($: EngineInterface, concluidas: number, total: number) {
  if (total <= 0) return
  await update($, tarefa, t => (t ? { ...(t as Tarefa), concluidas, total } : t))
}

async function medir($: EngineInterface) {
  const u = await $.session.usage()
  await update($, uso, antes => mesclar(antes as Uso | null, paraUso(u.context.tokens, u.context.window, u.rateLimits)))
}

async function atualizarAgentes($: EngineInterface) {
  const lista = await $.agent.list()
  const ids = new Set(lista.map(a => a.id))
  const vivos = new Set(lista.filter(a => a.status === 'running' || a.status === 'pending' || a.status === 'waiting').map(a => a.id))
  await update($, agentes, atual =>
    (atual as Agente[]).map(a => (a.ativo && ids.has(a.id) && !vivos.has(a.id) ? { ...a, ativo: false } : a)),
  )
}

async function contarTarefas($: EngineInterface) {
  const status = [...tarefas.values()]
  await progresso($, status.filter(s => s === 'completed').length, status.length)
}

const PAINEL = 'painel-tarefa'

type Tabela = { Box: any; Text: any; Svg?: any }

const CORES: Record<string, string> = { green: '#16A34A', yellow: '#D97706', red: '#DC2626', blue: '#2563EB', cyan: '#0891B2', gray: '#6B7280' }

export function tokensTexto(tokens: number, janela: number) {
  return `${k(tokens).replace('K', ' K')} / ${k(janela).replace('K', ' K')}`
}

async function conteudo($: EngineInterface, surface: string, colunas: number, tabela: Tabela) {
  const { Box, Text, Svg } = tabela
  const comSvg = (surface === 'desktop' || surface === 'vscode') && !!Svg
  await read($, tick)
  const u = (await read($, uso)) as Uso | null
  const t = (await read($, tarefa)) as Tarefa | null
  const ags = (await read($, agentes)) as Agente[]
  const nomeModelo = await $.session.model()
  const agora = await $.clock.now()

  const largura = Math.max(10, Math.min(24, Math.floor((colunas - 50) / 2)))
  const barra = (pct: number, cor: string) => {
    const cheio = Math.max(0, Math.min(largura, Math.round((pct * largura) / 100)))
    return [
      <Text key="c" color={cor}>{'█'.repeat(cheio)}</Text>,
      <Text key="v" dimColor>{'░'.repeat(largura - cheio)}</Text>,
    ]
  }
  const pizza = (id: string, pct: number, cor: string, alt: string) =>
    comSvg ? (
      <Svg key={`s-${id}`} source={pizzaSvg(pct, CORES[cor] || cor)} alt={alt} width={20} height={20} />
    ) : (
      <Text key={`g-${id}`} color={cor}>{`${fatia(pct)} `}</Text>
    )

  const linhas = []

  if (t) {
    const pct = t.total > 0 ? Math.round((t.concluidas * 100) / t.total) : t.ativa ? 0 : 100
    linhas.push(
      <Box key="tarefa">
        <Text bold>{'Tarefa   '}</Text>
        {barra(pct, t.ativa ? 'cyan' : 'green')}
        <Text bold>{` ${pct}%`}</Text>
        <Text dimColor>{` · ${estimar(t, agora)}`}</Text>
      </Box>,
    )
  } else {
    linhas.push(
      <Box key="tarefa">
        <Text bold>{'Tarefa   '}</Text>
        {barra(0, 'cyan')}
        <Text bold>{' 0%'}</Text>
        <Text dimColor>{' · aguardando tarefa'}</Text>
      </Box>,
    )
  }

  if (u) {
    const cor = corContexto(u.tokens)
    const pctCtx = u.janela > 0 ? Math.round((u.tokens * 100) / u.janela) : 0
    linhas.push(
      <Box key="ctx" flexDirection="row" gap={comSvg ? 1 : 0} alignItems="center">
        <Text bold>{'Contexto '}</Text>
        <Box key="barra-ctx">{barra(pctCtx, cor)}</Box>
        <Text bold color={cor}>{` ${pctCtx} % `}</Text>
        {pizza('ctx', pctCtx, cor, `Contexto ${tokensTexto(u.tokens, u.janela)}`)}
        <Text bold color={cor}>{tokensTexto(u.tokens, u.janela)}</Text>
        {u.tokens > AMARELO ? <Text color="red">{' ⚠ /compact'}</Text> : null}
      </Box>,
    )
  } else {
    linhas.push(
      <Box key="ctx">
        <Text bold>{'Contexto '}</Text>
        {barra(0, 'gray')}
        <Text dimColor>{' sem leitura'}</Text>
      </Box>,
    )
  }

  const ativos = ags.filter(a => a.ativo)
  const feitos = ags.filter(a => !a.ativo).slice(-4)
  linhas.push(
    <Box key="agentes">
      <Text bold>{'Agentes  '}</Text>
      {ags.length === 0 ? <Text dimColor>nenhum subagente nesta etapa</Text> : null}
      {ativos.map(a => (
        <Text key={`a-${a.id}`} color="magenta">{`▶ ${a.tipo}${a.descricao ? ` (${a.descricao})` : ''}  `}</Text>
      ))}
      {feitos.map(a => (
        <Text key={`f-${a.id}`} dimColor>{`✓ ${a.tipo}  `}</Text>
      ))}
    </Box>,
  )

  linhas.push(
    <Box key="modelo">
      <Text bold>{'Modelo   '}</Text>
      <Text color="blue">{nomeModelo}</Text>
    </Box>,
  )

  const j = janela(u ? u.reset : null, u ? u.pct5h : null, agora)
  const corUso = j.usado === null ? 'gray' : j.usado >= 80 ? 'red' : j.usado >= 50 ? 'yellow' : 'green'
  const pizzas = [
    { id: 'janela', rotulo: 'Janela', pct: j.decorridoPct, valor: j.decorrido ? `${j.decorrido} de 5h` : j.expirada ? 'encerrada' : 'sem leitura', cor: 'cyan' },
    { id: 'expira', rotulo: 'Expira em:', pct: j.restaPct, valor: j.resta || (j.expirada ? 'nova janela na próxima mensagem' : 'sem leitura'), cor: 'blue' },
    { id: 'usado', rotulo: '% utilizado', pct: j.usado, valor: j.usado === null ? 'sem leitura' : `${j.usado}%`, cor: corUso },
  ]
  linhas.push(
    <Box key="pizzas" flexDirection="row" gap={comSvg ? 3 : 0}>
      {pizzas.map(p => (
        <Box key={`p-${p.id}`} flexDirection="row" gap={comSvg ? 1 : 0} alignItems="center">
          {pizza(p.id, p.pct || 0, p.cor, `${p.rotulo} ${p.valor}`)}
          <Text bold>{`${p.rotulo} `}</Text>
          <Text color={p.cor}>{comSvg ? p.valor : `${p.valor}   `}</Text>
        </Box>
      ))}
    </Box>,
  )

  return linhas
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'painel-tarefa', description: 'Abre o painel da tarefa (progresso, contexto, janela de 5h e subagentes)' }).catch(() => undefined)
    if ((await $.session.surfaces()).includes('vscode')) void $.ui.open({ id: PAINEL, title: 'Painel da tarefa' }).catch(() => undefined)
    $.clock.every(30000, () => {
      void update($, tick, n => ((n as number) || 0) + 1)
      void atualizarAgentes($).catch(() => undefined)
      void medir($).catch(() => undefined)
    })
    void medir($).catch(() => undefined)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, uso, antes => mesclar(antes as Uso | null, paraUso(e.context.tokens, e.context.window, e.rateLimits)))
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    tarefas.clear()
    const inicio = await $.clock.now()
    await update($, tarefa, () => ({ inicio, concluidas: 0, total: 0, ativa: true }))
    await update($, agentes, atual => {
      const lista = atual as Agente[]
      return [...lista.filter(a => !a.ativo).slice(-4), ...lista.filter(a => a.ativo)]
    })
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      await update($, tarefa, t => (t ? { ...(t as Tarefa), ativa: false } : t))
      await medir($).catch(() => undefined)
    }
    await atualizarAgentes($).catch(() => undefined)
    return next(e)
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const inp = e as unknown as { subagent_type?: string; description?: string }
    const id = e.tool_use_id
    const novo: Agente = { id, tipo: inp.subagent_type || 'general-purpose', descricao: inp.description || '', ativo: true }
    await update($, agentes, atual => [...(atual as Agente[]), novo])
    const r = await next(e)
    const res = r.result as { status?: string; agentId?: string } | undefined
    const emSegundoPlano = !!res && (res.status === 'async_launched' || res.status === 'remote_launched')
    const agentId = r.deny === undefined && res && res.agentId ? res.agentId : id
    await update($, agentes, atual =>
      (atual as Agente[]).map(a => (a.id === id ? { ...a, id: agentId, ativo: emSegundoPlano } : a)),
    )
    return r
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: ETAPA }, async ($, e, next) => {
    const inp = e as unknown as { concluidas?: number; total?: number }
    await progresso($, Number(inp.concluidas) || 0, Number(inp.total) || 0)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const r = await next(e)
    const todos = ((e as unknown as { todos?: Todo[] }).todos || []) as Todo[]
    if (!e.agentId) await progresso($, todos.filter(t => t.status === 'completed').length, todos.length)
    return r
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const r = await next(e)
    const res = r.result as { task?: { id: string } } | undefined
    if (!e.agentId && res && res.task) {
      tarefas.set(res.task.id, 'pending')
      await contarTarefas($)
    }
    return r
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const r = await next(e)
    const inp = e as unknown as { taskId?: string; status?: string }
    if (!e.agentId && inp.taskId && tarefas.has(inp.taskId) && inp.status) {
      if (inp.status === 'deleted') tarefas.delete(inp.taskId)
      else tarefas.set(inp.taskId, inp.status)
      await contarTarefas($)
    }
    return r
  }).catch(($, e, next) => next(e))

  on('session.attach', async ($, e, next) => {
    const r = await next(e)
    if (e.surface === 'vscode') await $.ui.open({ id: PAINEL, title: 'Painel da tarefa' }).catch(() => undefined)
    return r
  })

  on('command.run', { command: 'painel-tarefa' }, async $ => {
    await $.ui.open({ id: PAINEL, title: 'Painel da tarefa' })
    return { text: 'Painel da tarefa aberto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const linhas = await conteudo($, e.surface, e.props.bodyColumns, $.ui.resolve(e) as unknown as Tabela)
    return (
      <Box flexDirection="column">
        {linhas.length > 0 ? linhas : <Text dimColor>Aguardando a primeira tarefa…</Text>}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { Box } = $.ui.resolve(e)
    const linhas = await conteudo($, e.surface, e.props.bodyColumns, $.ui.resolve(e) as unknown as Tabela)
    const minha = <Box flexDirection="column">{linhas}</Box>
    const abaixo = await next(e)
    if (!abaixo || (abaixo as { type?: string }).type === 'engine') return minha
    return (
      <Box flexDirection="column">
        {minha}
        {abaixo}
      </Box>
    )
  })
}
