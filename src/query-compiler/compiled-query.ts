export interface CompiledQuery {
  readonly sql: string
  readonly parameters: ReadonlyArray<unknown>
}
