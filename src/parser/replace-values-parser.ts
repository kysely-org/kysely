import { ColumnNode } from '../operation-node/column-node'
import { ValuesNode } from '../operation-node/values-node'
import { UpdateKeys, UpdateType } from '../util/column-type'
import { InsertObject, parseInsertObjectOrList } from './insert-values-parser'
import { ValueExpression } from './value-parser'

export type ReplaceObject<DB, TB extends keyof DB> = InsertObject<DB, TB> & {
  [C in UpdateKeys<DB[TB]>]: ValueExpression<DB, TB, UpdateType<DB[TB][C]>>
}

export type ReplaceObjectOrList<DB, TB extends keyof DB> =
  | ReplaceObject<DB, TB>
  | ReadonlyArray<ReplaceObject<DB, TB>>

export function parseReplaceObjectOrList(
  args: ReplaceObjectOrList<any, any>
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  return parseInsertObjectOrList(args)
}
