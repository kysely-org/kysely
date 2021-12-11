import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import { ParseContext } from './parse-context.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'

export type MutationObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]?: ValueExpression<DB, TB, DB[TB][C]>
}

export function parseUpdateObject(
  ctx: ParseContext,
  row: MutationObject<any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      return ColumnUpdateNode.create(
        ColumnNode.create(key),
        parseValueExpression(ctx, value!)
      )
    })
}
