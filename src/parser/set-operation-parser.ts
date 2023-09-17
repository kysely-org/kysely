import {
  ExpressionBuilder,
  createExpressionBuilder,
} from '../expression/expression-builder.js'
import { Expression } from '../expression/expression.js'
import {
  SetOperator,
  SetOperationNode,
} from '../operation-node/set-operation-node.js'
import { isFunction, isReadonlyArray } from '../util/object-utils.js'
import { TableNames } from '../util/type-utils.js'
import { parseExpression } from './expression-parser.js'

export type SetOperandExpression<DB extends TableNames, O> =
  | Expression<O>
  | ReadonlyArray<Expression<O>>
  | ((
      eb: ExpressionBuilder<DB, {}>
    ) => Expression<O> | ReadonlyArray<Expression<O>>)

export function parseSetOperations(
  operator: SetOperator,
  expression: SetOperandExpression<any, any>,
  all: boolean
) {
  if (isFunction(expression)) {
    expression = expression(createExpressionBuilder())
  }

  if (!isReadonlyArray(expression)) {
    expression = [expression]
  }

  return expression.map((expr) =>
    SetOperationNode.create(operator, parseExpression(expr), all)
  )
}
