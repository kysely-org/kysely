import { FilterNode } from '../operation-node/filter-node.js'
import {
  isBoolean,
  isFunction,
  isNull,
  isString,
} from '../util/object-utils.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  Operator,
  OperatorNode,
  OPERATORS,
} from '../operation-node/operator-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import {
  parseValueExpressionOrList,
  ValueExpressionOrList,
} from './value-parser.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { JoinNode } from '../operation-node/join-node.js'
import { FilterExpressionNode } from '../operation-node/operation-node-utils.js'
import { ValueNode } from '../operation-node/value-node.js'
import { ParseContext } from './parse-context.js'

export type ExistsExpression<DB, TB extends keyof DB> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export type FilterOperator = Operator | AnyRawBuilder

export function parseWhereFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  if (args.length === 3) {
    return parseThreeArgFilter(ctx, args[0], args[1], args[2])
  } else if (args.length === 1 && isFunction(args[0])) {
    return parseWhereGroup(ctx, args[0])
  } else {
    throw new Error(
      `invalid arguments passed to a where method ${JSON.stringify(args)}`
    )
  }
}

export function parseHavingFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  if (args.length === 3) {
    return parseThreeArgFilter(ctx, args[0], args[1], args[2])
  } else if (args.length === 1 && isFunction(args[0])) {
    return parseHavingGroup(ctx, args[0])
  } else {
    throw new Error(
      `invalid arguments passed to a having method ${JSON.stringify(args)}`
    )
  }
}

export function parseOnFilter(
  ctx: ParseContext,
  args: any[]
): FilterExpressionNode {
  if (args.length === 3) {
    return parseThreeArgFilter(ctx, args[0], args[1], args[2])
  } else if (args.length === 1 && isFunction(args[0])) {
    return parseOnGroup(ctx, args[0])
  } else {
    throw new Error(
      `invalid arguments passed to an on method ${JSON.stringify(args)}`
    )
  }
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

function parseThreeArgFilter(
  ctx: ParseContext,
  left: ReferenceExpression<any, any>,
  op: FilterOperator,
  right: ValueExpressionOrList<any, any, any>
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
  if (isOperationNodeSource(op)) {
    return op.toOperationNode()
  } else if (isString(op)) {
    const opString = op.trim().toLowerCase()

    if (OPERATORS.some((it) => it === opString)) {
      return OperatorNode.create(opString as Operator)
    }
  }

  throw new Error(
    `invalid comparison operator ${JSON.stringify(
      op
    )} passed to a filter method`
  )
}

function parseWhereGroup(
  ctx: ParseContext,
  callback: (qb: AnyQueryBuilder) => AnyQueryBuilder
): ParensNode {
  const query = callback(ctx.createSelectQueryBuilder([]))
  const queryNode = query.toOperationNode() as SelectQueryNode

  if (!queryNode.where) {
    throw new Error('no `where*` methods called insided a group callback')
  }

  return ParensNode.create(queryNode.where.where)
}

function parseHavingGroup(
  ctx: ParseContext,
  callback: (qb: AnyQueryBuilder) => AnyQueryBuilder
): ParensNode {
  const query = callback(ctx.createSelectQueryBuilder([]))
  const queryNode = query.toOperationNode() as SelectQueryNode

  if (!queryNode.having) {
    throw new Error('no `having*` methods called insided a group callback')
  }

  return ParensNode.create(queryNode.having.having)
}

function parseOnGroup(
  ctx: ParseContext,
  callback: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
): ParensNode {
  const joinBuilder = callback(ctx.createJoinBuilder('InnerJoin', 'table'))
  const joinNode = joinBuilder.toOperationNode() as JoinNode

  if (!joinNode.on) {
    throw new Error('no `on*` methods called insided a group callback')
  }

  return ParensNode.create(joinNode.on)
}

function parseExistExpression(
  ctx: ParseContext,
  type: 'exists' | 'not exists',
  arg: ExistsExpression<any, any>
): FilterNode {
  const node = isFunction(arg)
    ? arg(ctx.createExpressionBuilder()).toOperationNode()
    : arg.toOperationNode()

  if (!SelectQueryNode.is(node) && !RawNode.is(node)) {
    throw new Error('invalid where exists arg')
  }

  return FilterNode.create(undefined, OperatorNode.create(type), node)
}
