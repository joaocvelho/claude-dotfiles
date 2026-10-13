export type Etapas = { concluidas: number; total: number; titulo: string }

declare module 'claude-code' {
  interface PluginState {
    etapas: { progresso: Etapas | null }
  }
}
