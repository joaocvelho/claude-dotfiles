import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Etapas } from '../types'

const progresso = atom({ plugin: 'etapas', key: 'progresso' } as const, null)

const TOOL = 'mcp__etapas__etapa'

const INSTRUCAO = [
  'Progresso por etapas (mod "etapas"): em toda tarefa que envolva ação, mesmo de um único passo (total=1), divida o trabalho em etapas e',
  `chame a tool ${TOOL} (1) ao planejar, com concluidas=0, o total de etapas e o título da primeira;`,
  '(2) ao concluir cada etapa, com concluidas=quantidade já concluída, o mesmo total e o título da próxima etapa',
  '(na última, o título da etapa concluída). Se o plano mudar, envie o novo total. Só não chame em respostas puramente conversacionais, sem nenhuma ação.',
].join(' ')

type Todo = { status: string; activeForm?: string; content?: string }

const tarefas = new Map<string, { titulo: string; status: string }>()

export function normalizar(concluidas: unknown, total: unknown, titulo: unknown): Etapas {
  const t = Math.max(1, Math.floor(Number(total) || 1))
  const c = Math.min(t, Math.max(0, Math.floor(Number(concluidas) || 0)))
  return { concluidas: c, total: t, titulo: String(titulo || '') }
}

async function aplicar($: EngineInterface, novo: Etapas) {
  const antes = (await read($, progresso)) as Etapas | null
  await update($, progresso, () => novo)
  if (antes === null || novo.concluidas <= antes.concluidas) return
  const concluida = antes.titulo || `etapa ${novo.concluidas}`
  $.ui.toast(`Etapa concluída: ${concluida} (${novo.concluidas}/${novo.total})`, { timeoutMs: 6000 })
  if (novo.concluidas >= novo.total) {
    await $.ui.notify(`Todas as ${novo.total} etapas da tarefa foram concluídas.`, { title: 'Etapa concluída' }).catch(() => undefined)
  }
}

async function sincronizar($: EngineInterface) {
  const lista = [...tarefas.values()]
  if (lista.length === 0) return
  const atual = lista.find(t => t.status === 'in_progress') || lista.find(t => t.status === 'pending')
  await aplicar($, {
    concluidas: lista.filter(t => t.status === 'completed').length,
    total: lista.length,
    titulo: atual ? atual.titulo : (lista[lista.length - 1]?.titulo ?? ''),
  })
}

const PAINEL = 'etapas'

const VAZIO: Etapas = { concluidas: 0, total: 0, titulo: '' }

type Tabela = { Box: any; Text: any }

function bloco(p: Etapas, colunas: number, tabela: Tabela) {
  const { Box, Text } = tabela
  const vazio = p.total === 0
  const pct = vazio ? 0 : Math.round((p.concluidas * 100) / p.total)
  const largura = Math.max(10, Math.min(30, colunas - 50))
  const cheio = Math.round((pct * largura) / 100)
  const fim = !vazio && p.concluidas >= p.total
  const etapaAtual = vazio ? 0 : fim ? p.total : p.concluidas + 1
  const cor = fim ? 'green' : 'cyan'
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{`Etapa ${etapaAtual}/${p.total} `}</Text>
        <Text color={cor}>{'█'.repeat(cheio)}</Text>
        <Text dimColor>{'░'.repeat(largura - cheio)}</Text>
        <Text bold color={cor}>{` ${pct}%`}</Text>
        <Text dimColor>{vazio ? ' · aguardando tarefa' : ` · ${p.concluidas} concluída(s), ${p.total - p.concluidas} restante(s)`}</Text>
      </Box>
      {p.titulo ? (
        <Text dimColor wrap="truncate-end">
          {fim ? `✓ Etapa concluída: ${p.titulo}` : `▶ ${p.titulo}`}
        </Text>
      ) : null}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'etapas', description: 'Abre o painel de etapas da tarefa' }).catch(() => undefined)
    if ((await $.session.surfaces()).includes('vscode')) void $.ui.open({ id: PAINEL, title: 'Etapas' }).catch(() => undefined)
    await $.tool.register({
      name: 'etapa',
      description:
        'Registra o progresso da tarefa em etapas para a barra acima do prompt. Chame ao planejar (concluidas=0) e ao concluir cada etapa.',
      inputSchema: {
        type: 'object',
        properties: {
          concluidas: { type: 'integer', minimum: 0, description: 'Etapas já concluídas' },
          total: { type: 'integer', minimum: 1, description: 'Total de etapas da tarefa' },
          titulo: { type: 'string', description: 'Título da etapa em andamento (ou da última concluída)' },
        },
        required: ['concluidas', 'total', 'titulo'],
      },
      isDeferred: false,
    })
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    return { sections: [...r.sections, { id: 'etapas:instrucao', text: INSTRUCAO, scope: 'session' }] }
  })

  on('prompt.submit', async ($, e, next) => {
    tarefas.clear()
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const inp = e as unknown as { concluidas?: number; total?: number; titulo?: string }
    const novo = normalizar(inp.concluidas, inp.total, inp.titulo)
    await aplicar($, novo)
    return { result: `Etapa ${novo.concluidas}/${novo.total} registrada.` }
  }).catch(() => ({ result: 'Etapa registrada.' }))

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const r = await next(e)
    const todos = ((e as unknown as { todos?: Todo[] }).todos || []) as Todo[]
    if (!e.agentId && todos.length > 0) {
      const atual = todos.find(t => t.status === 'in_progress')
      await aplicar($, {
        concluidas: todos.filter(t => t.status === 'completed').length,
        total: todos.length,
        titulo: atual ? atual.activeForm || atual.content || '' : '',
      })
    }
    return r
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const r = await next(e)
    const res = r.result as { task?: { id: string; subject: string } } | undefined
    if (!e.agentId && res && res.task) {
      tarefas.set(res.task.id, { titulo: res.task.subject, status: 'pending' })
      await sincronizar($)
    }
    return r
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const r = await next(e)
    const inp = e as unknown as { taskId?: string; status?: string; subject?: string }
    const t = inp.taskId ? tarefas.get(inp.taskId) : undefined
    if (!e.agentId && t && inp.taskId) {
      if (inp.status === 'deleted') tarefas.delete(inp.taskId)
      else tarefas.set(inp.taskId, { titulo: inp.subject || t.titulo, status: inp.status || t.status })
      await sincronizar($)
    }
    return r
  }).catch(($, e, next) => next(e))

  on('session.attach', async ($, e, next) => {
    const r = await next(e)
    if (e.surface === 'vscode') await $.ui.open({ id: PAINEL, title: 'Etapas' }).catch(() => undefined)
    return r
  })

  on('command.run', { command: 'etapas' }, async $ => {
    await $.ui.open({ id: PAINEL, title: 'Etapas' })
    return { text: 'Painel de etapas aberto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const p = ((await read($, progresso)) as Etapas | null) || VAZIO
    return bloco(p, e.props.bodyColumns, $.ui.resolve(e) as unknown as Tabela)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const p = ((await read($, progresso)) as Etapas | null) || VAZIO
    const { Box } = $.ui.resolve(e)
    const minha = bloco(p, e.props.bodyColumns, $.ui.resolve(e) as unknown as Tabela)

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
