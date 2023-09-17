import { OperatorNode, UnaryOperator } from '../operation-node/operator-node.js'
import { UnaryOperationNode } from '../operation-node/unary-operation-node.js'
import { TableNames } from '../util/type-utils.js'
import { ExpressionOrFactory } from './expression-parser.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type ExistsExpression<
  DB extends TB,
  TB extends TableNames
> = ExpressionOrFactory<DB, TB, any>

export function parseExists(
  operand: ExistsExpression<any, any>
): UnaryOperationNode {
  return parseUnaryOperation('exists', operand)
}

export function parseNotExists(
  operand: ExistsExpression<any, any>
): UnaryOperationNode {
  return parseUnaryOperation('not exists', operand)
}

export function parseUnaryOperation(
  operator: UnaryOperator,
  operand: ReferenceExpression<any, any>
): UnaryOperationNode {
  return UnaryOperationNode.create(
    OperatorNode.create(operator),
    parseReferenceExpression(operand)
  )
}
