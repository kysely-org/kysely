import { CompiledQuery } from '../query-compiler/compiled-query.js'

export interface Compilable<R = any> {
  compile(): CompiledQuery<R>
}
