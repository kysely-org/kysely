export interface CompiledQuery {
  readonly sql: string
  readonly parameters: ReadonlyArray<any>
}
