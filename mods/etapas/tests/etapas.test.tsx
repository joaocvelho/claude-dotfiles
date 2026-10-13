import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 20, bodyColumns: 120, scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const
test('barra de etapas avança e avisa Etapa concluída', async ($, on) => {
  const toasts: string[] = []
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })

  await $.tool.call({ tool: 'mcp__etapas__etapa', concluidas: 0, total: 3, titulo: 'Planejar' } as never)
  await $.tool.call({ tool: 'mcp__etapas__etapa', concluidas: 1, total: 3, titulo: 'Implementar' } as never)

  expect(toasts.some(t => /^Etapa concluída: Planejar \(1\/3\)/.test(t))).toBe(true)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'etapas', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: 'Etapa 2/3 ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' 33%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1 concluída\(s\), 2 restante\(s\)/ })).toBeDefined()
    await ui.unmount()
  }

  await $.tool.call({ tool: 'mcp__etapas__etapa', concluidas: 3, total: 3, titulo: 'Validar' } as never)
  const fim = await $.ui.mount({ plugin: 'etapas', surface: 'desktop', ...BAND })
  expect(await fim.find({ type: 'Text', text: ' 100%' })).toBeDefined()
  expect(await fim.find({ type: 'Text', text: /Etapa concluída: Validar/ })).toBeDefined()

  const painel = await $.ui.mount({
    plugin: 'etapas',
    surface: 'vscode',
    component: 'Pane',
    requestId: 'etapas',
    props: { title: 'Etapas', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  })
  expect(await painel.find({ type: 'Text', text: 'Etapa 3/3 ' })).toBeDefined()
  expect(await painel.find({ type: 'Text', text: ' 100%' })).toBeDefined()
})