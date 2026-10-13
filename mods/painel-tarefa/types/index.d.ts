export type Uso = { tokens: number; janela: number; reset: string | null; pct5h: number | null }
export type Tarefa = { inicio: number; concluidas: number; total: number; ativa: boolean }
export type Agente = { id: string; tipo: string; descricao: string; ativo: boolean }

declare module 'claude-code' {
  interface PluginState {
    'painel-tarefa': {
      uso: Uso | null
      tarefa: Tarefa | null
      agentes: Agente[]
      tick: number
    }
  }
}
