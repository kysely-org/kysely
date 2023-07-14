import { Expression } from '../expression/expression.js'
import {
  SetOperator,
  SetOperationNode,
} from '../operation-node/set-operation-node.js'
import { ExpressionFactory, parseExpression } from './expression-parser.js'

export type SetOperandExpression<DB, O> =
  | Expression<O>
  | ExpressionFactory<DB, never, O>

export function parseSetOperation(
  operator: SetOperator,
  expression: SetOperandExpression<any, any>,
  all: boolean
) {
  return SetOperationNode.create(operator, parseExpression(expression), all)
}
