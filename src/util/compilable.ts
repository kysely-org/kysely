import { CompiledQuery } from '../query-compiler/compiled-query.js'

export interface Compilable<O = unknown> {
  compile(): CompiledQuery<O>
}
