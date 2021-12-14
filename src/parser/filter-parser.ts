import { FilterNode } from '../operation-node/filter-node.js'
import {
  freeze,
  isBoolean,
  isFunction,
  isNull,
  isString,
} from '../util/object-utils.js'
import { AnySelectQueryBuilder, AnyRawBuilder } from '../util/type-utils.js'
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
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { FilterExpressionNode } from '../operation-node/operation-node-utils.js'
import { ValueNode } from '../operation-node/value-node.js'
import { ParseContext } from './parse-context.js'
import { WhereInterface } from '../query-builder/where-interface.js'

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

export type ExistsExpression<DB, TB extends keyof DB> = ValueExpression<
  DB,
  TB,
  never
>

export type WhereGrouper<DB, TB extends keyof DB> = (
  qb: WhereInterface<DB, TB>
) => WhereInterface<DB, TB>

export type FilterOperator = Operator | AnyRawBuilder

type FilterType = 'where' | 'having' | 'on'

export function parseWhereFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  return parseFilter(ctx, 'where', args)
}

export function parseHavingFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  return parseFilter(ctx, 'having', args)
}

export function parseOnFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  return parseFilter(ctx, 'on', args)
}

export function parseReferenceFilter(
  ctx: ParseContext,
  lhs: ReferenceExpression<any, any>,
  op: FilterOperator,
  rhs: ReferenceExpression<any, any>
): FilterNode {
  return FilterNode.create(
    parseReferenceExpression(ctx, lhs),
    parseFilterOperator(op),
    parseReferenceExpression(ctx, rhs)
  )
}

export function parseExistFilter(
  ctx: ParseContext,
  arg: ExistsExpression<any, any>
): FilterNode {
  return parseExistExpression(ctx, 'exists', arg)
}

export function parseNotExistFilter(
  ctx: ParseContext,
  arg: ExistsExpression<any, any>
): FilterNode {
  return parseExistExpression(ctx, 'not exists', arg)
}

export function parseFilter(
  ctx: ParseContext,
  type: FilterType,
  args: any[]
): FilterExpressionNode {
  if (args.length === 3) {
    return parseThreeArgFilter(ctx, args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseOneArgFilter(ctx, type, args[0])
  }

  throw createFilterError(type, args)
}

function parseThreeArgFilter(
  ctx: ParseContext,
  left: ReferenceExpression<any, any>,
  op: FilterOperator,
  right: FilterValueExpressionOrList<any, any, any>
): FilterNode {
  if ((op === 'is' || op === 'is not') && (isNull(right) || isBoolean(right))) {
    return parseIsFilter(ctx, left, op, right)
  }

  return FilterNode.create(
    parseReferenceExpression(ctx, left),
    parseFilterOperator(op),
    parseValueExpressionOrList(ctx, right)
  )
}

function parseIsFilter(
  ctx: ParseContext,
  left: ReferenceExpression<any, any>,
  op: 'is' | 'is not',
  right: null | boolean
) {
  return FilterNode.create(
    parseReferenceExpression(ctx, left),
    parseFilterOperator(op),
    ValueNode.createImmediate(right)
  )
}

function parseFilterOperator(op: FilterOperator): OperatorNode | RawNode {
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
  ctx: ParseContext,
  type: 'exists' | 'not exists',
  arg: ExistsExpression<any, any>
): FilterNode {
  return FilterNode.create(
    undefined,
    OperatorNode.create(type),
    parseValueExpressionOrList(ctx, arg)
  )
}

function parseOneArgFilter(
  ctx: ParseContext,
  type: FilterType,
  arg: any
): ParensNode | RawNode {
  if (isFunction(arg)) {
    return GROUP_PARSERS[type](ctx, arg)
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
    ctx: ParseContext,
    callback: (qb: AnySelectQueryBuilder) => AnySelectQueryBuilder
  ): ParensNode {
    const query = callback(ctx.createSelectQueryBuilder())
    const queryNode = query.toOperationNode() as SelectQueryNode

    if (!queryNode.where) {
      throw new Error('no `where` methods called insided a group callback')
    }

    return ParensNode.create(queryNode.where.where)
  },

  having(
    ctx: ParseContext,
    callback: (qb: AnySelectQueryBuilder) => AnySelectQueryBuilder
  ): ParensNode {
    const query = callback(ctx.createSelectQueryBuilder())
    const queryNode = query.toOperationNode() as SelectQueryNode

    if (!queryNode.having) {
      throw new Error('no `having` methods called insided a group callback')
    }

    return ParensNode.create(queryNode.having.having)
  },

  on(
    ctx: ParseContext,
    callback: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
  ): ParensNode {
    const joinBuilder = callback(ctx.createJoinBuilder('InnerJoin', 'table'))
    const joinNode = joinBuilder.toOperationNode()

    if (!joinNode.on) {
      throw new Error('no `on` methods called insided a group callback')
    }

    return ParensNode.create(joinNode.on.on)
  },
})
