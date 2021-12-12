import { ReferenceExpressionNode } from '../operation-node/operation-node-utils.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { ParseContext } from './parse-context.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type OrderByDirection = 'asc' | 'desc'

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export type OrderByDirectionExpression = OrderByDirection | AnyRawBuilder

export function parseOrderBy(
  ctx: ParseContext,
  orderBy: OrderByExpression<any, any, any>,
  direction?: OrderByDirectionExpression
): OrderByItemNode {
  return OrderByItemNode.create(
    parseOrderByExpression(ctx, orderBy),
    parseOrderByDirectionExpression(direction)
  )
}

function parseOrderByExpression(
  ctx: ParseContext,
  expr: OrderByExpression<any, any, any>
): ReferenceExpressionNode {
  return parseReferenceExpression(ctx, expr)
}

function parseOrderByDirectionExpression(
  expr?: OrderByDirectionExpression
): RawNode | undefined {
  if (!expr) {
    return undefined
  }

  if (expr === 'asc' || expr === 'desc') {
    return RawNode.createWithSql(expr)
  } else {
    return expr.toOperationNode()
  }
}
