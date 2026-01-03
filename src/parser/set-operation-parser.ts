import {
  type ExpressionBuilder,
  createExpressionBuilder,
} from '../expression/expression-builder.js'
import type { Expression } from '../expression/expression.js'
import {
  type SetOperator,
  SetOperationNode,
} from '../operation-node/set-operation-node.js'
import { isFunction, isReadonlyArray } from '../util/object-utils.js'
import type { BivariantCallback } from '../util/type-utils.js'
import { parseExpression } from './expression-parser.js'

export type SetOperandExpression<DB, O> =
  | Expression<O>
  | ReadonlyArray<Expression<O>>
  | BivariantCallback<
      ExpressionBuilder<DB, never>,
      Expression<O> | ReadonlyArray<Expression<O>>
    >

export function parseSetOperations(
  operator: SetOperator,
  expression: SetOperandExpression<any, any>,
  all: boolean,
) {
  if (isFunction(expression)) {
    expression = expression(createExpressionBuilder())
  }

  if (!isReadonlyArray(expression)) {
    expression = [expression]
  }

  return expression.map((expr) =>
    SetOperationNode.create(operator, parseExpression(expr), all),
  )
}
