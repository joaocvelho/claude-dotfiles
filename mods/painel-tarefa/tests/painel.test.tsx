import { expect, mock, test } from 'claude-code/testing'

import { corContexto, duracao, estimar, fatia, janela, pizzaSvg, tokensTexto } from '../hooks/register'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

test('cores do contexto: verde até 450K, amarelo até 600K, vermelho acima', () => {
  expect(corContexto(120000)).toBe('green')
  expect(corContexto(450000)).toBe('green')
  expect(corContexto(500000)).toBe('yellow')
  expect(corContexto(600000)).toBe('yellow')
  expect(corContexto(600001)).toBe('red')
  expect(corContexto(700000)).toBe('red')
})

test('estimativa de tempo total pela fração concluída', () => {
  expect(duracao(90 * 60000)).toBe('1h30')
  expect(estimar({ inicio: 0, concluidas: 1, total: 4, ativa: true }, 10 * 60000)).toBe('total ~40m (faltam ~30m)')
  expect(estimar({ inicio: 0, concluidas: 0, total: 0, ativa: false }, 5 * 60000)).toBe('levou 5m')
})

test('pizzas da janela de 5h', () => {
  const agora = 1000000000
  const j = janela(new Date(agora + 100 * 60000).toISOString(), 62, agora)
  expect(j).toEqual({ decorridoPct: 67, decorrido: '3h20', restaPct: 33, resta: '1h40', usado: 62 })
  expect(janela(null, null, agora).resta).toBe(null)
  expect([fatia(0), fatia(20), fatia(50), fatia(70), fatia(100)]).toEqual(['○', '◔', '◑', '◕', '●'])
  expect(pizzaSvg(25, '#2563EB')).toContain('A10 10 0 0 1 22.00 12.00')
  expect(pizzaSvg(100, '#2563EB')).toContain('fill="#2563EB"')
})

test('faixa mostra tarefa, contexto, agentes, modelo e as três pizzas', async ($, on) => {
  const relogio = mock.clock(on, { now: 0 })
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
  on('prompt.submit', (_, e) => ({ text: e.text }) as never)
  on('session.model', () => ({ value: 'claude-opus-5-5' }) as never)
  on('session.measure', (_, e) => ({ changed: e.changed }) as never)
  on('tool.call', () => ({ result: 'ok' }) as never)
  await $.prompt.submit({ text: 'tarefa de teste' } as never)
  await $.tool.call({ tool: 'mcp__etapas__etapa', concluidas: 1, total: 2, titulo: 'x' } as never)
  await relogio.advance(20 * 60000)
  await $.session.measure({
    context: { tokens: 650000, window: 1000000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 62, resetsAt: new Date(20 * 60000 + 100 * 60000).toISOString() }],
    changed: ['context', 'rateLimits'],
  } as never)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'painel-tarefa', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: ' 50%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' · total ~40m (faltam ~20m)' })).toBeDefined()
    const ctx = await ui.find({ type: 'Text', text: '650 K / 1000 K' })
    expect(ctx?.props.color).toBe('red')
    expect(await ui.find({ type: 'Text', text: ' 65 % ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' ⚠ /compact' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Agentes  ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'claude-opus-5-5' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /3h20 de 5h/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1h40/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /62%/ })).toBeDefined()
    if (surface === 'desktop') expect(await ui.findAll({ type: 'Svg' })).toHaveLength(4)
    else expect(await ui.findAll({ type: 'Text', text: '◕ ' })).toHaveLength(3)
    await ui.unmount()
  }

  const painel = await $.ui.mount({
    plugin: 'painel-tarefa',
    surface: 'vscode',
    component: 'Pane',
    requestId: 'painel-tarefa',
    props: { title: 'Painel da tarefa', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  })
  expect(await painel.find({ type: 'Text', text: '650 K / 1000 K' })).toBeDefined()
  expect(await painel.find({ type: 'Text', text: 'claude-opus-5-5' })).toBeDefined()
  expect(await painel.findAll({ type: 'Svg' })).toHaveLength(4)
  await painel.unmount()
})

test('tokens no formato do contexto', () => {
  expect(tokensTexto(278000, 1000000)).toBe('278 K / 1000 K')
})
