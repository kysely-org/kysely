import { CompiledQuery } from '../query-compiler/compiled-query'

export interface Connection {
  execute<R>(compiledQuery: CompiledQuery): Promise<R[]>
}
