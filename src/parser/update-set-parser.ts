import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import { UpdateKeys, UpdateType } from '../util/column-type.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'

export type MutationObject<DB, TB extends keyof DB, TM extends keyof DB> = {
  [C in UpdateKeys<DB[TM]>]?: ValueExpression<DB, TB, UpdateType<DB[TM][C]>>
}

export function parseUpdateObject(
  row: MutationObject<any, any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      return ColumnUpdateNode.create(
        ColumnNode.create(key),
        parseValueExpression(value!)
      )
    })
}
