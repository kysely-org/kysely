import { CompiledQuery } from '../query-compiler/compiled-query.js'

export interface Compilable {
  compile(): CompiledQuery
}
