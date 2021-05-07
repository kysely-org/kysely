import { createFilterNode, FilterNode } from '../../operation-node/filter-node'
import { RawBuilder } from '../../raw-builder/raw-builder'
import { isFunction, isString } from '../../utils/object-utils'
import {
  AnyQueryBuilder,
  ArrayItemType,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../type-utils'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { isRawNode, RawNode } from '../../operation-node/raw-node'
import {
  createOperatorNode,
  OperatorNode,
} from '../../operation-node/operator-node'
import { createEmptySelectQuery, QueryBuilder } from '../query-builder'
import { AndNode } from '../../operation-node/and-node'
import { OrNode } from '../../operation-node/or-node'
import { createParensNode, ParensNode } from '../../operation-node/parens-node'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser'
import {
  parseValueExpressionOrList,
  ValueExpressionOrList,
} from './value-parser'
import {
  createSelectQueryNodeWithFromItems,
  isSelectQueryNode,
  SelectQueryNode,
} from '../../operation-node/select-query-node'

export type ExistsFilterArg<DB, TB extends keyof DB, O> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>

const OPERATOR_WHITELIST = [
  '=',
  '==',
  '!=',
  '<>',
  '>',
  '>=',
  '<',
  '<=',
  'in',
  'not in',
  'is',
  'is not',
  'like',
  'not like',
  'ilike',
  'not ilike',
  '@>',
  '<@',
  '?',
  '?',
  '?&',
  '!<',
  '!>',
  '<=>',
] as const

export type FilterOperatorArg =
  | ArrayItemType<typeof OPERATOR_WHITELIST>
  | RawBuilder<any>

export function parseFilterArgs(
  args: any[]
): FilterNode | AndNode | OrNode | ParensNode {
  if (args.length === 3) {
    return parseThreeArgFilter(args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseOneArgFilter(args[0])
  } else {
    throw new Error(
      `invalid arguments passed to a filter method ${JSON.stringify(args)}`
    )
  }
}

export function parseReferenceFilterArgs(
  lhs: ReferenceExpression<any, any, any>,
  op: FilterOperatorArg,
  rhs: ReferenceExpression<any, any, any>
): FilterNode {
  return createFilterNode(
    parseReferenceExpression(lhs),
    parseFilterOperator(op),
    parseReferenceExpression(rhs)
  )
}

export function parseExistsFilterArgs(
  query: AnyQueryBuilder,
  type: 'exists' | 'not exists',
  arg: ExistsFilterArg<any, any, any>
): FilterNode {
  const node = isFunction(arg)
    ? arg(query).toOperationNode()
    : arg.toOperationNode()

  if (!isSelectQueryNode(node) && !isRawNode(node)) {
    throw new Error('invalid where exists arg')
  }

  return createFilterNode(undefined, createOperatorNode(type), node)
}

function parseThreeArgFilter(
  lhs: ReferenceExpression<any, any, any>,
  op: FilterOperatorArg,
  rhs: ValueExpressionOrList<any, any, any>
): FilterNode {
  return createFilterNode(
    parseReferenceExpression(lhs),
    parseFilterOperator(op),
    parseValueExpressionOrList(rhs)
  )
}

function parseFilterOperator(op: FilterOperatorArg): OperatorNode | RawNode {
  if (isOperationNodeSource(op)) {
    return op.toOperationNode()
  } else if (isString(op)) {
    const opString = op.trim().toLowerCase()

    if (OPERATOR_WHITELIST.includes(opString as any)) {
      return createOperatorNode(opString)
    }
  }

  throw new Error(
    `invalid comparison operator ${JSON.stringify(
      op
    )} passed to a filter method`
  )
}

function parseOneArgFilter(
  grouper: (qb: AnyQueryBuilder) => AnyQueryBuilder
): ParensNode {
  if (!isFunction(grouper)) {
    throw new Error(
      `invalid single arg filter argument ${JSON.stringify(grouper)}`
    )
  }

  const query = grouper(createEmptySelectQuery())
  const queryNode = query.toOperationNode() as SelectQueryNode

  if (!queryNode.where) {
    throw new Error('no where methods called insided a grouper where')
  }

  return createParensNode(queryNode.where.where)
}
