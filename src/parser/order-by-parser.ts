import { isDynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { Expression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { isExpressionOrFactory, parseExpression } from './expression-parser.js'
import { StringReference, parseStringReference } from './reference-parser.js'
import { ReferenceExpression } from './reference-parser.js'

export type OrderByDirection = 'asc' | 'desc'

export function isOrderByDirection(thing: unknown): thing is OrderByDirection {
  return thing === 'asc' || thing === 'desc'
}

export type DirectedOrderByStringReference<DB, TB extends keyof DB, O> = `${
  | StringReference<DB, TB>
  | (keyof O & string)} ${OrderByDirection}`

export type UndirectedOrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | UndirectedOrderByExpression<DB, TB, O>
  | DirectedOrderByStringReference<DB, TB, O>

export type OrderByDirectionExpression = OrderByDirection | Expression<any>

export function parseOrderBy(args: any[]): OrderByItemNode[] {
  if (args.length === 2) {
    return [parseOrderByItem(args[0], args[1])]
  }

  if (args.length === 1) {
    const [orderBy] = args

    if (Array.isArray(orderBy)) {
      return orderBy.map((item) => parseOrderByItem(item))
    }

    return [parseOrderByItem(orderBy)]
  }

  throw new Error(
    `Invalid number of arguments at order by! expected 1-2, received ${args.length}`,
  )
}

export function parseOrderByItem(
  ref: ReferenceExpression<any, any>,
  direction?: OrderByDirectionExpression,
): OrderByItemNode {
  const parsedRef = parseOrderByExpression(ref)

  if (OrderByItemNode.is(parsedRef)) {
    if (direction) {
      throw new Error('Cannot specify direction twice!')
    }

    return parsedRef
  }

  return OrderByItemNode.create(
    parsedRef,
    parseOrderByDirectionExpression(direction),
  )
}

function parseOrderByExpression(
  expr: OrderByExpression<any, any, any>,
): OperationNode {
  if (isExpressionOrFactory(expr)) {
    return parseExpression(expr)
  }

  if (isDynamicReferenceBuilder(expr)) {
    return expr.toOperationNode()
  }

  const [ref, direction] = expr.split(' ')

  if (direction) {
    if (!isOrderByDirection(direction)) {
      throw new Error(`Invalid order by direction: ${direction}`)
    }

    return OrderByItemNode.create(
      parseStringReference(ref),
      parseOrderByDirectionExpression(direction as any),
    )
  }

  return parseStringReference(expr)
}

function parseOrderByDirectionExpression(
  expr?: OrderByDirectionExpression,
): OperationNode | undefined {
  if (!expr) {
    return undefined
  }

  if (expr === 'asc' || expr === 'desc') {
    return RawNode.createWithSql(expr)
  }

  return expr.toOperationNode()
}
