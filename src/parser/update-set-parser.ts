import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'
import { UpdateKeys, UpdateType } from '../util/column-type.js'
import { isFunction } from '../util/object-utils.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'
import { Database } from '../database.js'

export type UpdateObject<
  DB extends Database,
  TB extends keyof DB['tables'],
  UT extends keyof DB['tables'] = TB
> = {
  [C in UpdateKeys<DB['tables'][UT]>]?:
    | ValueExpression<DB, TB, UpdateType<DB['tables'][UT][C]>>
    | undefined
}

export type UpdateObjectFactory<
  DB extends Database,
  TB extends keyof DB['tables'],
  UT extends keyof DB['tables']
> = (eb: ExpressionBuilder<DB, TB>) => UpdateObject<DB, TB, UT>

export type UpdateExpression<
  DB extends Database,
  TB extends keyof DB['tables'],
  UT extends keyof DB['tables'] = TB
> = UpdateObject<DB, TB, UT> | UpdateObjectFactory<DB, TB, UT>

export function parseUpdateExpression(
  update: UpdateExpression<any, any, any>
): ReadonlyArray<ColumnUpdateNode> {
  const updateObj = isFunction(update) ? update(expressionBuilder()) : update

  return Object.entries(updateObj)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      return ColumnUpdateNode.create(
        ColumnNode.create(key),
        parseValueExpression(value)
      )
    })
}
