import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import {
  freeze,
  isBoolean,
  isFunction,
  isNull,
  isString,
} from '../util/object-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
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
import { ParensNode } from '../operation-node/parens-node.js'
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
import { JoinBuilder } from '../query-builder/join-builder.js'
import { ValueNode } from '../operation-node/value-node.js'
import { WhereExpressionFactory } from '../query-builder/where-interface.js'
import { HavingExpressionFactory } from '../query-builder/having-interface.js'
import { createJoinBuilder, createSelectQueryBuilder } from './parse-utils.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression, isExpression } from '../expression/expression.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinNode } from '../operation-node/join-node.js'
import { expressionBuilder } from '../expression/expression-builder.js'
import { UnaryOperationNode } from '../operation-node/unary-operation-node.js'
import { CaseNode } from '../operation-node/case-node.js'

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

type FilterExpressionType = 'where' | 'having' | 'on' | 'when'

export function parseValueBinaryOperation(
  leftOperand: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (!isBinaryOperator(operator) && !isOperationNodeSource(operator)) {
    throw new Error(`invalid binary operator ${JSON.stringify(operator)}`)
  }

  if (isIsComparison(operator, rightOperand)) {
    return parseIs(leftOperand, operator, rightOperand)
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseOperator(operator),
    parseValueExpressionOrList(rightOperand)
  )
}

export function parseReferentialBinaryOperation(
  leftOperand: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (!isBinaryOperator(operator) && !isOperationNodeSource(operator)) {
    throw new Error(`invalid binary operator ${JSON.stringify(operator)}`)
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseOperator(operator),
    parseReferenceExpression(rightOperand)
  )
}

export function parseValueComparison(
  leftOperand: ReferenceExpression<any, any>,
  operator: ComparisonOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (!isComparisonOperator(operator) && !isOperationNodeSource(operator)) {
    throw new Error(`invalid comparison operator ${JSON.stringify(operator)}`)
  }

  return parseValueBinaryOperation(leftOperand, operator, rightOperand)
}

export function parseReferentialComparison(
  leftOperand: ReferenceExpression<any, any>,
  operator: ComparisonOperatorExpression,
  rightOperand: ReferenceExpression<any, any>
): BinaryOperationNode {
  if (!isComparisonOperator(operator) && !isOperationNodeSource(operator)) {
    throw new Error(`invalid comparison operator ${JSON.stringify(operator)}`)
  }

  return parseReferentialBinaryOperation(leftOperand, operator, rightOperand)
}

export function parseWhere(args: any[]): OperationNode {
  return parseFilter('where', args)
}

export function parseHaving(args: any[]): OperationNode {
  return parseFilter('having', args)
}

export function parseOn(args: any[]): OperationNode {
  return parseFilter('on', args)
}

export function parseWhen(args: any[]): OperationNode {
  return parseFilter('when', args)
}

function parseFilter(type: FilterExpressionType, args: any[]): OperationNode {
  if (args.length === 3) {
    return parseValueComparison(args[0], args[1], args[2])
  }

  if (args.length === 1) {
    return parseOneArgFilterExpression(type, args[0])
  }

  throw createFilterExpressionError(type, args)
}

function isIsComparison(
  operator: BinaryOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): operator is 'is' | 'is not' {
  return (
    (operator === 'is' || operator === 'is not') &&
    (isNull(rightOperand) || isBoolean(rightOperand))
  )
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

function parseOneArgFilterExpression(
  type: FilterExpressionType,
  arg: any
): OperationNode {
  if (isFunction(arg)) {
    if (type === 'when') {
      throw new Error(`when method doesn't accept a callback as an argument`)
    }

    return CALLBACK_PARSERS[type](arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (
      RawNode.is(node) ||
      BinaryOperationNode.is(node) ||
      UnaryOperationNode.is(node) ||
      ParensNode.is(node) ||
      CaseNode.is(node)
    ) {
      return node
    }
  } else if (type === 'when') {
    return ValueNode.create(arg)
  }

  throw createFilterExpressionError(type, arg)
}

function createFilterExpressionError(
  type: FilterExpressionType,
  args: any[]
): Error {
  return new Error(
    `invalid arguments passed to a '${type}' method: ${JSON.stringify(args)}`
  )
}

const CALLBACK_PARSERS = freeze({
  where(callback: WhereExpressionFactory<any, any>): OperationNode {
    // TODO: Remove this once the grouper overload is removed.
    const whereBuilder = createSelectQueryBuilder()
    const exprBuilder = expressionBuilder()

    const res = callback(Object.assign(whereBuilder, exprBuilder) as any)
    const node = res.toOperationNode()

    if (SelectQueryNode.is(node)) {
      if (!node.where) {
        throw new Error('no `where` methods called inside a group callback')
      }

      return ParensNode.create(node.where.where)
    } else {
      return node
    }
  },

  having(callback: HavingExpressionFactory<any, any>): OperationNode {
    // TODO: Remove this once the grouper overload is removed.
    const havingBuilder = createSelectQueryBuilder()
    const exprBuilder = expressionBuilder()

    const res = callback(Object.assign(havingBuilder, exprBuilder) as any)
    const node = res.toOperationNode()

    if (SelectQueryNode.is(node)) {
      if (!node.having) {
        throw new Error('no `having` methods called inside a group callback')
      }

      return ParensNode.create(node.having.having)
    } else {
      return node
    }
  },

  on(
    callback: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
  ): OperationNode {
    // TODO: Remove this once the grouper overload is removed.
    const onBuilder = createJoinBuilder('InnerJoin', 'table')
    const exprBuilder = expressionBuilder()

    const res = callback(Object.assign(onBuilder, exprBuilder) as any)
    const node = res.toOperationNode()

    if (JoinNode.is(node)) {
      if (!node.on) {
        throw new Error('no `on` methods called inside a group callback')
      }

      return ParensNode.create(node.on.on)
    } else {
      return node
    }
  },
})
