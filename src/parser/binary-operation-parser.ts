import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import {
  isBoolean,
  isFunction,
  isNull,
  isString,
} from '../util/object-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  OperatorNode,
  ComparisonOperator,
  ArithmeticOperator,
  BinaryOperator,
  Operator,
  isComparisonOperator,
  isBinaryOperator,
  OPERATORS,
} from '../operation-node/operator-node.js'
import {
  ExtractTypeFromReferenceExpression,
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import {
  parseValueExpressionOrList,
  ValueExpression,
  ValueExpressionOrList,
} from './value-parser.js'
import { ValueNode } from '../operation-node/value-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression, isExpression } from '../expression/expression.js'
import { createExpressionBuilder } from '../expression/expression-builder.js'

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

export function parseFilter(args: any[]): OperationNode {
  if (args.length > 1 && !isComparisonOperatorExpression(args[1])) {
    throw new Error(`invalid comparison operator ${JSON.stringify(args[1])}`)
  }

  return parseValueBinaryOperationOrExpression(args)
}

export function parseValueBinaryOperationOrExpression(
  args: any[]
): OperationNode {
  if (args.length === 3) {
    return parseValueBinaryOperation(args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseExpressionOrFactory(args[0])
  }

  throw new Error(`invalid arguments: ${JSON.stringify(args)}`)
}

export function parseValueBinaryOperation(
  leftOperand: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (!isBinaryOperatorExpression(operator)) {
    throw new Error(`invalid binary operator ${JSON.stringify(operator)}`)
  }

  if (isIsOperator(operator) && isNullOrBoolean(rightOperand)) {
    return parseIs(leftOperand, operator, rightOperand)
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseOperator(operator),
    parseValueExpressionOrList(rightOperand)
  )
}

export function parseReferentialComparison(
  leftOperand: ReferenceExpression<any, any>,
  operator: ComparisonOperatorExpression,
  rightOperand: ReferenceExpression<any, any>
): BinaryOperationNode {
  if (!isComparisonOperatorExpression(operator)) {
    throw new Error(`invalid comparison operator ${JSON.stringify(operator)}`)
  }

  return parseReferentialBinaryOperation(leftOperand, operator, rightOperand)
}

export function parseReferentialBinaryOperation(
  leftOperand: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (!isBinaryOperatorExpression(operator)) {
    throw new Error(`invalid binary operator ${JSON.stringify(operator)}`)
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseOperator(operator),
    parseReferenceExpression(rightOperand)
  )
}

function isBinaryOperatorExpression(
  expr: unknown
): expr is BinaryOperatorExpression {
  return isBinaryOperator(expr) || isExpression(expr)
}

function isComparisonOperatorExpression(
  expr: unknown
): expr is ComparisonOperatorExpression {
  return isComparisonOperator(expr) || isExpression(expr)
}

function isIsOperator(
  operator: BinaryOperatorExpression
): operator is 'is' | 'is not' {
  return operator === 'is' || operator === 'is not'
}

function isNullOrBoolean(value: unknown): value is null | boolean {
  return isNull(value) || isBoolean(value)
}

function parseIs(
  leftOperand: ReferenceExpression<any, any>,
  operator: 'is' | 'is not',
  rightOperand: null | boolean
) {
  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseOperator(operator),
    ValueNode.createImmediate(rightOperand)
  )
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

function parseExpressionOrFactory(arg: unknown): OperationNode {
  if (isFunction(arg)) {
    return arg(createExpressionBuilder()).toOperationNode()
  } else if (isOperationNodeSource(arg)) {
    return arg.toOperationNode()
  }

  return ValueNode.create(arg)
}
