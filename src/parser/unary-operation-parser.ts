import { OperatorNode, UnaryOperator } from '../operation-node/operator-node.js'
import { UnaryOperationNode } from '../operation-node/unary-operation-node.js'
import { ExpressionOrFactory } from './expression-parser.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type ExistsExpression<DB, TB extends keyof DB> = ExpressionOrFactory<
  DB,
  TB,
  any
>

export function parseExists(
  arg: ExistsExpression<any, any>
): UnaryOperationNode {
  return parseUnaryOperation('exists', arg)
}

export function parseNotExists(
  arg: ExistsExpression<any, any>
): UnaryOperationNode {
  return parseUnaryOperation('not exists', arg)
}

export function parseUnaryOperation(
  type: UnaryOperator,
  arg: ReferenceExpression<any, any>
): UnaryOperationNode {
  return UnaryOperationNode.create(
    OperatorNode.create(type),
    parseReferenceExpression(arg)
  )
}
