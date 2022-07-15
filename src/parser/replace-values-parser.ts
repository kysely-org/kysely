import { ColumnNode } from '../operation-node/column-node.js'
import { ValuesNode } from '../operation-node/values-node.js'
import {
  InsertType,
  NonNullableInsertKeys,
  NonNullableUpdateKeys,
  NullableInsertKeys,
  NullableUpdateKeys,
  UpdateType,
} from '../util/column-type.js'
import { parseInsertObjectOrList } from './insert-values-parser.js'
import { ValueExpression } from './value-parser.js'

export type ReplaceObject<DB, TB extends keyof DB> = {
  [C in
    | NonNullableInsertKeys<DB[TB]>
    | NonNullableUpdateKeys<DB[TB]>]: ValueExpression<
    DB,
    TB,
    InsertType<DB[TB][C]> | UpdateType<DB[TB][C]>
  >
} & {
  [C in
    | NullableInsertKeys<DB[TB]>
    | NullableUpdateKeys<DB[TB]>]?: ValueExpression<
    DB,
    TB,
    InsertType<DB[TB][C]> | UpdateType<DB[TB][C]>
  >
}

export type ReplaceObjectOrList<DB, TB extends keyof DB> =
  | ReplaceObject<DB, TB>
  | ReadonlyArray<ReplaceObject<DB, TB>>

export function parseReplaceObjectOrList(
  args: ReplaceObjectOrList<any, any>
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  return parseInsertObjectOrList(args)
}
