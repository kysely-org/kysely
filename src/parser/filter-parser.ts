import { FilterNode } from '../operation-node/filter-node.js'
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
  Operator,
  OperatorNode,
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
import { WhereInterface } from '../query-builder/where-interface.js'
import { HavingInterface } from '../query-builder/having-interface.js'
import { createJoinBuilder, createSelectQueryBuilder } from './parse-utils.js'
import { ExpressionOrFactory } from './expression-parser.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'

export type FilterValueExpression<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpression<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

export type FilterValueExpressionOrList<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpressionOrList<
  DB,
  TB,
  ExtractTypeFromReferenceExpression<DB, TB, RE>
>

export type ExistsExpression<DB, TB extends keyof DB> = ExpressionOrFactory<
  DB,
  TB,
  any
>

export type WhereGrouper<DB, TB extends keyof DB> = (
  qb: WhereInterface<DB, TB>
) => WhereInterface<DB, TB>

export type HavingGrouper<DB, TB extends keyof DB> = (
  qb: HavingInterface<DB, TB>
) => HavingInterface<DB, TB>

export type FilterOperator = Operator | Expression<any>

type FilterType = 'where' | 'having' | 'on'

export function parseWhereFilter(args: any[]): OperationNode {
  return parseFilter('where', args)
}

export function parseHavingFilter(args: any[]): OperationNode {
  return parseFilter('having', args)
}

export function parseOnFilter(args: any[]): OperationNode {
  return parseFilter('on', args)
}

export function parseReferenceFilter(
  lhs: ReferenceExpression<any, any>,
  op: FilterOperator,
  rhs: ReferenceExpression<any, any>
): FilterNode {
  return FilterNode.create(
    parseReferenceExpression(lhs),
    parseFilterOperator(op),
    parseReferenceExpression(rhs)
  )
}

export function parseExistFilter(arg: ExistsExpression<any, any>): FilterNode {
  return parseExistExpression('exists', arg)
}

export function parseNotExistFilter(
  arg: ExistsExpression<any, any>
): FilterNode {
  return parseExistExpression('not exists', arg)
}

export function parseFilter(type: FilterType, args: any[]): OperationNode {
  if (args.length === 3) {
    return parseThreeArgFilter(args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseOneArgFilter(type, args[0])
  }

  throw createFilterError(type, args)
}

function parseThreeArgFilter(
  left: ReferenceExpression<any, any>,
  op: FilterOperator,
  right: FilterValueExpressionOrList<any, any, any>
): FilterNode {
  if ((op === 'is' || op === 'is not') && (isNull(right) || isBoolean(right))) {
    return parseIsFilter(left, op, right)
  }

  return FilterNode.create(
    parseReferenceExpression(left),
    parseFilterOperator(op),
    parseValueExpressionOrList(right)
  )
}

function parseIsFilter(
  left: ReferenceExpression<any, any>,
  op: 'is' | 'is not',
  right: null | boolean
) {
  return FilterNode.create(
    parseReferenceExpression(left),
    parseFilterOperator(op),
    ValueNode.createImmediate(right)
  )
}

function parseFilterOperator(op: FilterOperator): OperationNode {
  if (isString(op) && OPERATORS.includes(op)) {
    return OperatorNode.create(op)
  } else if (isOperationNodeSource(op)) {
    return op.toOperationNode()
  }

  throw new Error(
    `invalid comparison operator ${JSON.stringify(
      op
    )} passed to a filter method`
  )
}

function parseExistExpression(
  type: 'exists' | 'not exists',
  arg: ExistsExpression<any, any>
): FilterNode {
  return FilterNode.create(
    undefined,
    OperatorNode.create(type),
    parseValueExpressionOrList(arg)
  )
}

function parseOneArgFilter(type: FilterType, arg: any): ParensNode | RawNode {
  if (isFunction(arg)) {
    return GROUP_PARSERS[type](arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (RawNode.is(node)) {
      return node
    }
  }

  throw createFilterError(type, arg)
}

function createFilterError(type: FilterType, args: any[]): Error {
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
      throw new Error('no `where` methods called insided a group callback')
    }

    return ParensNode.create(queryNode.where.where)
  },

  having(
    callback: (qb: AnySelectQueryBuilder) => AnySelectQueryBuilder
  ): ParensNode {
    const query = callback(createSelectQueryBuilder())
    const queryNode = query.toOperationNode()

    if (!queryNode.having) {
      throw new Error('no `having` methods called insided a group callback')
    }

    return ParensNode.create(queryNode.having.having)
  },

  on(
    callback: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
  ): ParensNode {
    const joinBuilder = callback(createJoinBuilder('InnerJoin', 'table'))
    const joinNode = joinBuilder.toOperationNode()

    if (!joinNode.on) {
      throw new Error('no `on` methods called insided a group callback')
    }

    return ParensNode.create(joinNode.on.on)
  },
})
