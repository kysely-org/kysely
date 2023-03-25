import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import { ExpressionBuilder } from '../query-builder/expression-builder.js'
import { isFunction } from '../util/object-utils.js'
import { createExpressionBuilder } from './parse-utils.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
} from './reference-parser.js'

export type GroupByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export type GroupByArg<DB, TB extends keyof DB, O> =
  | GroupByExpression<DB, TB, O>
  | ReadonlyArray<GroupByExpression<DB, TB, O>>
  | ((
      eb: ExpressionBuilder<DB, TB>
    ) => ReadonlyArray<GroupByExpression<DB, TB, O>>)

export function parseGroupBy(
  groupBy: GroupByArg<any, any, any>
): GroupByItemNode[] {
  groupBy = isFunction(groupBy) ? groupBy(createExpressionBuilder()) : groupBy
  return parseReferenceExpressionOrList(groupBy).map(GroupByItemNode.create)
}
