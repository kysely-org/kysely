import { createFilterNode, FilterNode } from '../operation-node/filter-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isFunction, isString } from '../util/object-utils'
import {
  AnyQueryBuilder,
  ArrayItemType,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { isRawNode, RawNode } from '../operation-node/raw-node'
import {
  createOperatorNode,
  OperatorNode,
} from '../operation-node/operator-node'
import { AndNode } from '../operation-node/and-node'
import { OrNode } from '../operation-node/or-node'
import { createParensNode, ParensNode } from '../operation-node/parens-node'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser'
import {
  parseValueExpressionOrList,
  ValueExpressionOrList,
} from './value-parser'
import {
  isSelectQueryNode,
  SelectQueryNode,
} from '../operation-node/select-query-node'
import { SubQueryBuilder } from '../query-builder/sub-query-builder'
import { createEmptySelectQuery } from '../query-builder/query-builder'
import { JoinBuilder } from '../query-builder/join-builder'
import { parseTableExpression } from './table-parser'
import { createJoinNode, JoinNode } from '../operation-node/join-node'

export type ExistsFilterArg<DB, TB extends keyof DB> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB>

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

export type FilterType = 'Where' | 'On' | 'Having'

export function parseFilterArgs(
  filterType: FilterType,
  args: any[]
): FilterNode | AndNode | OrNode | ParensNode {
  if (args.length === 3) {
    return parseThreeArgFilter(args[0], args[1], args[2])
  } else if (args.length === 1) {
    if (filterType === 'Where') {
      return parseWhereGrouper(args[0])
    } else {
      return parseOnGrouper(args[0])
    }
  } else {
    throw new Error(
      `invalid arguments passed to a filter method ${JSON.stringify(args)}`
    )
  }
}

export function parseReferenceFilterArgs(
  lhs: ReferenceExpression<any, any>,
  op: FilterOperatorArg,
  rhs: ReferenceExpression<any, any>
): FilterNode {
  return createFilterNode(
    parseReferenceExpression(lhs),
    parseFilterOperator(op),
    parseReferenceExpression(rhs)
  )
}

export function parseExistsFilterArgs(
  type: 'exists' | 'not exists',
  arg: ExistsFilterArg<any, any>
): FilterNode {
  const node = isFunction(arg)
    ? arg(new SubQueryBuilder()).toOperationNode()
    : arg.toOperationNode()

  if (!isSelectQueryNode(node) && !isRawNode(node)) {
    throw new Error('invalid where exists arg')
  }

  return createFilterNode(undefined, createOperatorNode(type), node)
}

function parseThreeArgFilter(
  left: ReferenceExpression<any, any>,
  op: FilterOperatorArg,
  right: ValueExpressionOrList<any, any>
): FilterNode {
  return createFilterNode(
    parseReferenceExpression(left),
    parseFilterOperator(op),
    parseValueExpressionOrList(right)
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

function parseWhereGrouper(
  grouper: (qb: AnyQueryBuilder) => AnyQueryBuilder
): ParensNode {
  if (!isFunction(grouper)) {
    throw new Error(
      `invalid call to queryBuilder.where: ${JSON.stringify(grouper)}`
    )
  }

  const query = grouper(createEmptySelectQuery())
  const queryNode = query.toOperationNode() as SelectQueryNode

  if (!queryNode.where) {
    throw new Error('no where methods called insided a grouper where')
  }

  return createParensNode(queryNode.where.where)
}

function parseOnGrouper(
  grouper: (qb: JoinBuilder<any, any>) => JoinBuilder<any, any>
): ParensNode {
  if (!isFunction(grouper)) {
    throw new Error(
      `invalid call to joinBuilder.on: ${JSON.stringify(grouper)}`
    )
  }

  const joinBuilder = grouper(createEmptyJoinBuilder())
  const joinNode = joinBuilder.toOperationNode() as JoinNode

  if (!joinNode.on) {
    throw new Error('no `on` methods called insided a grouper where')
  }

  return createParensNode(joinNode.on)
}

export function createEmptyJoinBuilder(): JoinBuilder<any, any> {
  return new JoinBuilder(
    createJoinNode('InnerJoin', parseTableExpression('table'))
  )
}
