import { expect, mock, test } from 'claude-code/testing'

import { corContexto, duracao, estimar } from '../hooks/register'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const
test('cores do contexto seguem 300K/600K', () => {
  expect(corContexto(120000)).toBe('green')
  expect(corContexto(300000)).toBe('green')
  expect(corContexto(450000)).toBe('yellow')
  expect(corContexto(550000)).toBe('yellow')
  expect(corContexto(600000)).toBe('red')
})

test('estimativa de tempo total pela fração concluída', () => {
  expect(duracao(90 * 60000)).toBe('1h30')
  expect(estimar({ inicio: 0, concluidas: 1, total: 4, ativa: true }, 10 * 60000)).toBe('total ~40m (faltam ~30m)')
  expect(estimar({ inicio: 0, concluidas: 0, total: 0, ativa: false }, 5 * 60000)).toBe('levou 5m')
})

test('faixa mostra tarefa, contexto, agentes, modelo e janela', async ($, on) => {
  const relogio = mock.clock(on, { now: 0 })
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
  on('prompt.submit', (_, e) => ({ text: e.text }) as never)
  on('session.model', () => ({ value: 'claude-opus-5-5' }) as never)
  on('tool.call', () => ({ result: 'ok' }) as never)
  await $.prompt.submit({ text: 'tarefa de teste' } as never)
  await $.tool.call({ tool: 'mcp__etapas__etapa', concluidas: 1, total: 2, titulo: 'x' } as never)
  await relogio.advance(20 * 60000)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'painel-tarefa', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: 'Tarefa   ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' 50%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' · total ~40m (faltam ~20m)' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Agentes  ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Modelo / })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Janela 5h/ })).toBeDefined()
    await ui.unmount()
  }
})