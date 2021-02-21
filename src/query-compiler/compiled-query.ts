export interface CompiledQuery {
  readonly sql: string
  readonly bindings: ReadonlyArray<any>
}
