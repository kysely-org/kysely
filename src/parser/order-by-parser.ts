import {
  DynamicReferenceBuilder,
  isDynamicReferenceBuilder,
} from '../dynamic/dynamic-reference-builder.js'
import { Expression, isExpression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { OrderByItemBuilder } from '../query-builder/order-by-item-builder.js'
import { logOnce } from '../util/log-once.js'
import {
  ExpressionOrFactory,
  isExpressionOrFactory,
  parseExpression,
} from './expression-parser.js'
import {
  ReferenceExpression,
  StringReference,
  parseStringReference,
} from './reference-parser.js'

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | StringReference<DB, TB>
  | (keyof O & string)
  | ExpressionOrFactory<DB, TB, any>
  | DynamicReferenceBuilder<any>

export type OrderByModifiers =
  | OrderByDirection
  | OrderByModifiersCallbackExpression

export type OrderByDirection = 'asc' | 'desc'

export function isOrderByDirection(thing: unknown): thing is OrderByDirection {
  return thing === 'asc' || thing === 'desc'
}

export type OrderByModifiersCallbackExpression = (
  builder: OrderByItemBuilder,
) => OrderByItemBuilder

// TODO: remove in v0.29
/**
 * @deprecated performance reasons, use {@link OrderByExpression} instead.
 */
export type DirectedOrderByStringReference<DB, TB extends keyof DB, O> = `${
  | StringReference<DB, TB>
  | (keyof O & string)} ${OrderByDirection}`

// TODO: remove in v0.29
/**
 * @deprecated replaced with {@link OrderByModifiers}
 */
export type OrderByDirectionExpression = OrderByDirection | Expression<any>

// TODO: remove in v0.29
/**
 * @deprecated use {@link OrderByExpression} instead.
 */
export type UndirectedOrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | (keyof O & string)

export function parseOrderBy(args: any[]): OrderByItemNode[] {
  if (args.length === 2) {
    return [parseOrderByItem(args[0], args[1])]
  }

  if (args.length === 1) {
    const [orderBy] = args

    if (Array.isArray(orderBy)) {
      logOnce(
        'orderBy(array) is deprecated, use multiple orderBy calls instead.',
      )

      return orderBy.map((item) => parseOrderByItem(item))
    }

    return [parseOrderByItem(orderBy)]
  }

  throw new Error(
    `Invalid number of arguments at order by! expected 1-2, received ${args.length}`,
  )
}

export function parseOrderByItem(
  expr: OrderByExpression<any, any, any>,
  modifiers?: OrderByModifiers,
): OrderByItemNode {
  const parsedRef = parseOrderByExpression(expr)

  if (OrderByItemNode.is(parsedRef)) {
    if (modifiers) {
      throw new Error('Cannot specify direction twice!')
    }

    return parsedRef
  }

  return parseOrderByWithModifiers(parsedRef, modifiers)
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
    logOnce(
      "`orderBy('column asc')` is deprecated. Use `orderBy('column', 'asc')` instead.",
    )

    return parseOrderByWithModifiers(parseStringReference(ref), direction)
  }

  return parseStringReference(expr)
}

function parseOrderByWithModifiers(
  expr: OperationNode,
  modifiers:
    | string
    | OrderByModifiersCallbackExpression
    // TODO: remove in v0.29
    | Expression<any>
    | undefined,
): OrderByItemNode {
  if (typeof modifiers === 'string') {
    if (!isOrderByDirection(modifiers)) {
      throw new Error(`Invalid order by direction: ${modifiers}`)
    }

    return OrderByItemNode.create(expr, RawNode.createWithSql(modifiers))
  }

  if (isExpression(modifiers)) {
    logOnce(
      "`orderBy(..., expr)` is deprecated. Use `orderBy(..., 'asc')` or `orderBy(..., (ob) => ...)` instead.",
    )

    return OrderByItemNode.create(expr, modifiers.toOperationNode())
  }

  const node = OrderByItemNode.create(expr)

  if (!modifiers) {
    return node
  }

  return modifiers(new OrderByItemBuilder({ node })).toOperationNode()
}
