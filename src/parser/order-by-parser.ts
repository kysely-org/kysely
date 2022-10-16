import { Expression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type OrderByDirection = 'asc' | 'desc'

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export type OrderByDirectionExpression = OrderByDirection | Expression<any>

export function parseOrderBy(
  orderBy: OrderByExpression<any, any, any>,
  direction?: OrderByDirectionExpression
): OrderByItemNode {
  return OrderByItemNode.create(
    parseOrderByExpression(orderBy),
    parseOrderByDirectionExpression(direction)
  )
}

function parseOrderByExpression(
  expr: OrderByExpression<any, any, any>
): OperationNode {
  return parseReferenceExpression(expr)
}

function parseOrderByDirectionExpression(
  expr?: OrderByDirectionExpression
): OperationNode | undefined {
  if (!expr) {
    return undefined
  }

  if (expr === 'asc' || expr === 'desc') {
    return RawNode.createWithSql(expr)
  } else {
    return expr.toOperationNode()
  }
}
