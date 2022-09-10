import { ValueExpressionNode } from '../operation-node/operation-node-utils.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { isReadonlyArray } from '../util/object-utils.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  parseComplexExpression,
  ComplexExpression,
  isComplexExpression,
} from './complex-expression-parser.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'

export type ValueExpression<DB, TB extends keyof DB, V> =
  | V
  | ComplexExpression<DB, TB, V>

export type ValueExpressionOrList<DB, TB extends keyof DB, V> =
  | ValueExpression<DB, TB, V>
  | ReadonlyArray<ValueExpression<DB, TB, V>>

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, unknown>
): ValueExpressionNode {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(arg)
  } else {
    return parseValueExpression(arg)
  }
}

export function parseValueExpression(
  exp: ValueExpression<any, any, unknown>
): ValueNode | SelectQueryNode | RawNode | AggregateFunctionNode {
  if (isComplexExpression(exp)) {
    return parseComplexExpression(exp)
  }

  return ValueNode.create(exp)
}

function parseValueExpressionList(
  arg: ReadonlyArray<ValueExpression<any, any, unknown>>
): PrimitiveValueListNode | ValueListNode {
  if (arg.some(isComplexExpression)) {
    return ValueListNode.create(arg.map((it) => parseValueExpression(it)))
  }

  return PrimitiveValueListNode.create(arg)
}
