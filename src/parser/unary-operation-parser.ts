import { OperatorNode, type UnaryOperator } from '../operation-node/operator-node.js'
import { UnaryOperationNode } from '../operation-node/unary-operation-node.js'
import type { ExpressionOrFactory } from './expression-parser.js'
import {
  parseReferenceExpression,
  type ReferenceExpression,
} from './reference-parser.js'

export type ExistsExpression<DB, TB extends keyof DB> = ExpressionOrFactory<
  DB,
  TB,
  any
>

export function parseExists(
  operand: ExistsExpression<any, any>,
): UnaryOperationNode {
  return parseUnaryOperation('exists', operand)
}

export function parseNotExists(
  operand: ExistsExpression<any, any>,
): UnaryOperationNode {
  return parseUnaryOperation('not exists', operand)
}

export function parseUnaryOperation(
  operator: UnaryOperator,
  operand: ReferenceExpression<any, any>,
): UnaryOperationNode {
  return UnaryOperationNode.create(
    OperatorNode.create(operator),
    parseReferenceExpression(operand),
  )
}
