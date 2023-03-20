import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import {
  freeze,
  isBoolean,
  isFunction,
  isNull,
  isString,
} from '../util/object-utils.js'
import { AnySelectQueryBuilder } from '../util/type-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  OperatorNode,
  COMPARISON_OPERATORS,
  ComparisonOperator,
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
import { WhereInterface } from '../query-builder/where-interface.js'
import { HavingInterface } from '../query-builder/having-interface.js'
import { createJoinBuilder, createSelectQueryBuilder } from './parse-utils.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'
import { sql } from '../raw-builder/sql.js'

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

export type WhereGrouper<DB, TB extends keyof DB> = (
  qb: WhereInterface<DB, TB>
) => WhereInterface<DB, TB>

export type HavingGrouper<DB, TB extends keyof DB> = (
  qb: HavingInterface<DB, TB>
) => HavingInterface<DB, TB>

export type ComparisonOperatorExpression = ComparisonOperator | Expression<any>

type FilterExpressionType = 'where' | 'having' | 'on'

export function parseWhere(args: any[]): OperationNode {
  return parseFilterExpression('where', args)
}

export function parseHaving(args: any[]): OperationNode {
  return parseFilterExpression('having', args)
}

export function parseOn(args: any[]): OperationNode {
  return parseFilterExpression('on', args)
}

export function parseReferentialFilter(
  leftOperand: ReferenceExpression<any, any>,
  operator: ComparisonOperatorExpression,
  rightOperand: ReferenceExpression<any, any>
): BinaryOperationNode {
  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseComparisonOperatorExpression(operator),
    parseReferenceExpression(rightOperand)
  )
}

export function parseFilterExpression(
  type: FilterExpressionType,
  args: any[]
): OperationNode {
  if (args.length === 3) {
    return parseFilter(args[0], args[1], args[2])
  }

  if (args.length === 1) {
    return parseOneArgFilterExpression(type, args[0])
  }

  throw createFilterExpressionError(type, args)
}

export function parseWhereWithParametersAsLiterals(args: any[]): OperationNode {
  if (args.length === 3) {
    args = [args[0], args[1], sql.literal(args[2])]
  }

  return parseWhere(args)
}

function parseFilter(
  leftOperand: ReferenceExpression<any, any>,
  operator: ComparisonOperatorExpression,
  rightOperand: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (
    (operator === 'is' || operator === 'is not') &&
    (isNull(rightOperand) || isBoolean(rightOperand))
  ) {
    return parseIs(leftOperand, operator, rightOperand)
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseComparisonOperatorExpression(operator),
    parseValueExpressionOrList(rightOperand)
  )
}

function parseIs(
  leftOperand: ReferenceExpression<any, any>,
  operator: 'is' | 'is not',
  rightOperand: null | boolean
) {
  return BinaryOperationNode.create(
    parseReferenceExpression(leftOperand),
    parseComparisonOperatorExpression(operator),
    ValueNode.createImmediate(rightOperand)
  )
}

function parseComparisonOperatorExpression(
  operator: ComparisonOperatorExpression
): OperationNode {
  if (isString(operator) && COMPARISON_OPERATORS.includes(operator)) {
    return OperatorNode.create(operator)
  } else if (isOperationNodeSource(operator)) {
    return operator.toOperationNode()
  }

  throw new Error(
    `invalid comparison operator ${JSON.stringify(
      operator
    )} passed to a filter method`
  )
}

function parseOneArgFilterExpression(
  type: FilterExpressionType,
  arg: any
): ParensNode | RawNode {
  if (isFunction(arg)) {
    return GROUP_PARSERS[type](arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (RawNode.is(node)) {
      return node
    }
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

const GROUP_PARSERS = freeze({
  where(
    callback: (qb: AnySelectQueryBuilder) => AnySelectQueryBuilder
  ): ParensNode {
    const query = callback(createSelectQueryBuilder())
    const queryNode = query.toOperationNode()

    if (!queryNode.where) {
      throw new Error('no `where` methods called inside a group callback')
    }

    return ParensNode.create(queryNode.where.where)
  },

  having(
    callback: (qb: AnySelectQueryBuilder) => AnySelectQueryBuilder
  ): ParensNode {
    const query = callback(createSelectQueryBuilder())
    const queryNode = query.toOperationNode()

    if (!queryNode.having) {
      throw new Error('no `having` methods called inside a group callback')
    }

    return ParensNode.create(queryNode.having.having)
  },

  on(
    callback: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
  ): ParensNode {
    const joinBuilder = callback(createJoinBuilder('InnerJoin', 'table'))
    const joinNode = joinBuilder.toOperationNode()

    if (!joinNode.on) {
      throw new Error('no `on` methods called inside a group callback')
    }

    return ParensNode.create(joinNode.on.on)
  },
})
