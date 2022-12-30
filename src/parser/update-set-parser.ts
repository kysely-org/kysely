import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import { UpdateKeys, UpdateType } from '../util/column-type.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'

export type UpdateObject<DB, TB extends keyof DB, UT extends keyof DB = TB> = {
  [C in UpdateKeys<DB[UT]>]?:
    | ValueExpression<DB, TB, UpdateType<DB[UT][C]>>
    | undefined
}

export function parseUpdateObject(
  update: UpdateObject<any, any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(update)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      return ColumnUpdateNode.create(
        ColumnNode.create(key),
        parseValueExpression(value)
      )
    })
}
