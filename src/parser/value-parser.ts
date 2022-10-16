import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { isReadonlyArray } from '../util/object-utils.js'
import {
  parseExpression,
  ExpressionOrFactory,
  isExpressionOrFactory,
} from './expression-parser.js'
import { OperationNode } from '../operation-node/operation-node.js'

export type ValueExpression<DB, TB extends keyof DB, V> =
  | V
  | ExpressionOrFactory<DB, TB, V>

export type ValueExpressionOrList<DB, TB extends keyof DB, V> =
  | ValueExpression<DB, TB, V>
  | ReadonlyArray<ValueExpression<DB, TB, V>>

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, unknown>
): OperationNode {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(arg)
  } else {
    return parseValueExpression(arg)
  }
}

export function parseValueExpression(
  exp: ValueExpression<any, any, unknown>
): OperationNode {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp)
  }

  return ValueNode.create(exp)
}

function parseValueExpressionList(
  arg: ReadonlyArray<ValueExpression<any, any, unknown>>
): PrimitiveValueListNode | ValueListNode {
  if (arg.some(isExpressionOrFactory)) {
    return ValueListNode.create(arg.map((it) => parseValueExpression(it)))
  }

  return PrimitiveValueListNode.create(arg)
}
