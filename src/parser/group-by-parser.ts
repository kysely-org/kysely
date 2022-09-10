import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
} from './reference-parser.js'

export type GroupByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export type GroupByExpressionOrList<DB, TB extends keyof DB, O> =
  | ReadonlyArray<GroupByExpression<DB, TB, O>>
  | GroupByExpression<DB, TB, O>

export function parseGroupBy(
  groupBy: GroupByExpressionOrList<any, any, any>
): GroupByItemNode[] {
  return parseReferenceExpressionOrList(groupBy).map(GroupByItemNode.create)
}
