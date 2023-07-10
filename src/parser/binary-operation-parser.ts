import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import { isBoolean, isNull, isString } from '../util/object-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  OperatorNode,
  ComparisonOperator,
  ArithmeticOperator,
  BinaryOperator,
  Operator,
  OPERATORS,
} from '../operation-node/operator-node.js'
import {
  ExtractTypeFromReferenceExpression,
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import {
  parseValueExpression,
  parseValueExpressionOrList,
  ValueExpression,
  ValueExpressionOrList,
} from './value-parser.js'
import { ValueNode } from '../operation-node/value-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'

export type OperandValueExpression<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpression<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

export type OperandValueExpressionOrList<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpressionOrList<
  DB,
  TB,
  ExtractTypeFromReferenceExpression<DB, TB, RE> | null
>

export type OperatorExpression = Operator | Expression<unknown>
export type BinaryOperatorExpression = BinaryOperator | Expression<unknown>

export type ComparisonOperatorExpression =
  | ComparisonOperator
  | Expression<unknown>

export type ArithmeticOperatorExpression =
  | ArithmeticOperator
  | Expression<unknown>

export function parseValueBinaryOperationOrExpression(
  args: any[]
): OperationNode {
  if (args.length === 3) {
    return parseValueBinaryOperation(args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseValueExpression(args[0])
  }

  throw new Error(`invalid arguments: ${JSON.stringify(args)}`)
}

export function parseValueBinaryOperation(
  left: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  right: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (isIsOperator(operator) && isNullOrBoolean(right)) {
    return BinaryOperationNode.create(
      parseReferenceExpression(left),
      parseOperator(operator),
      ValueNode.createImmediate(right)
    )
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(left),
    parseOperator(operator),
    parseValueExpressionOrList(right)
  )
}
export function parseReferentialBinaryOperation(
  left: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  right: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  return BinaryOperationNode.create(
    parseReferenceExpression(left),
    parseOperator(operator),
    parseReferenceExpression(right)
  )
}

function isIsOperator(
  operator: BinaryOperatorExpression
): operator is 'is' | 'is not' {
  return operator === 'is' || operator === 'is not'
}

function isNullOrBoolean(value: unknown): value is null | boolean {
  return isNull(value) || isBoolean(value)
}

function parseOperator(operator: OperatorExpression): OperationNode {
  if (isString(operator) && OPERATORS.includes(operator)) {
    return OperatorNode.create(operator)
  }

  if (isOperationNodeSource(operator)) {
    return operator.toOperationNode()
  }

  throw new Error(`invalid operator ${JSON.stringify(operator)}`)
}
