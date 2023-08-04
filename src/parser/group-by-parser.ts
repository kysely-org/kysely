import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'
import { isFunction } from '../util/object-utils.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
} from './reference-parser.js'
import { Database } from '../database.js'

export type GroupByExpression<
  DB extends Database,
  TB extends keyof DB['tables'],
  O
> = ReferenceExpression<DB, TB> | (keyof O & string)

export type GroupByArg<DB extends Database, TB extends keyof DB['tables'], O> =
  | GroupByExpression<DB, TB, O>
  | ReadonlyArray<GroupByExpression<DB, TB, O>>
  | ((
      eb: ExpressionBuilder<DB, TB>
    ) => ReadonlyArray<GroupByExpression<DB, TB, O>>)

export function parseGroupBy(
  groupBy: GroupByArg<any, any, any>
): GroupByItemNode[] {
  groupBy = isFunction(groupBy) ? groupBy(expressionBuilder()) : groupBy
  return parseReferenceExpressionOrList(groupBy).map(GroupByItemNode.create)
}
