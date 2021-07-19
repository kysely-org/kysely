import { CompiledQuery } from '../query-compiler/compiled-query'

export interface Compilable {
  compile(): CompiledQuery
}
