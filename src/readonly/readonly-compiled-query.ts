import { SelectQueryNode } from '../operation-node/select-query-node.js'
import {
  isCompiledQuery,
  type CompiledQuery,
} from '../query-compiler/compiled-query.js'

export type ReadonlyCompiledQuery<R> = CompiledQuery<R> & {
  readonly query: SelectQueryNode
}

export function isReadonlyCompiledQuery<R>(
  thing: unknown,
): thing is ReadonlyCompiledQuery<R> {
  return isCompiledQuery(thing) && SelectQueryNode.is(thing.query)
}
