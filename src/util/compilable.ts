import { DeleteResult } from '../query-builder/delete-result.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { UpdateResult } from '../query-builder/update-result.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'

export interface Compilable<O = unknown> {
  compile(): CompiledQuery<O>
}

export type Infer<C extends Compilable<any> | CompiledQuery<any>> =
  C extends Compilable<infer O>
    ? ResolveOutput<O>
    : C extends CompiledQuery<infer O>
    ? ResolveOutput<O>
    : never

type ResolveOutput<O> = O extends InsertResult | UpdateResult | DeleteResult
  ? O
  : O[]
