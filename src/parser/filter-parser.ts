import { FilterNode, filterNode } from '../operation-node/filter-node.js'
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
import { RawNode, rawNode } from '../operation-node/raw-node.js'
import {
  Operator,
  OperatorNode,
  operatorNode,
  OPERATORS,
} from '../operation-node/operator-node.js'
import { ParensNode, parensNode } from '../operation-node/parens-node.js'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import {
  parseValueExpressionOrList,
  ValueExpressionOrList,
} from './value-parser.js'
import {
  selectQueryNode,
  SelectQueryNode,
} from '../operation-node/select-query-node.js'
import { SubQueryBuilder } from '../query-builder/sub-query-builder.js'
import { createEmptySelectQuery } from '../query-builder/query-builder.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { parseTableExpression } from './table-parser.js'
import { JoinNode, joinNode } from '../operation-node/join-node.js'
import { FilterExpressionNode } from '../operation-node/operation-node-utils.js'
import { valueNode } from '../index.js'

export type ExistsFilterArg<DB, TB extends keyof DB> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export type FilterOperatorArg = Operator | AnyRawBuilder
export type FilterType = 'Where' | 'On' | 'Having'

export function parseFilterArgs(
  filterType: FilterType,
  args: any[]
): FilterExpressionNode {
  if (args.length === 3) {
    return parseThreeArgFilter(args[0], args[1], args[2])
  } else if (args.length === 1) {
    if (filterType === 'Where') {
      return parseWhereGrouper(args[0])
    } else if (filterType === 'Having') {
      return parseHavingGrouper(args[0])
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
  return filterNode.create(
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

  if (!selectQueryNode.is(node) && !rawNode.is(node)) {
    throw new Error('invalid where exists arg')
  }

  return filterNode.create(undefined, operatorNode.create(type), node)
}

function parseThreeArgFilter(
  left: ReferenceExpression<any, any>,
  op: FilterOperatorArg,
  right: ValueExpressionOrList<any, any>
): FilterNode {
  if ((op === 'is' || op === 'is not') && (isNull(right) || isBoolean(right))) {
    return parseIsFilter(left, op, right)
  }

  return filterNode.create(
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
  return filterNode.create(
    parseReferenceExpression(left),
    parseFilterOperator(op),
    valueNode.createImmediate(right)
  )
}

function parseFilterOperator(op: FilterOperatorArg): OperatorNode | RawNode {
  if (isOperationNodeSource(op)) {
    return op.toOperationNode()
  } else if (isString(op)) {
    const opString = op.trim().toLowerCase()

    if (OPERATORS.some((it) => it === opString)) {
      return operatorNode.create(opString as Operator)
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
    throw new Error('no where methods called insided a grouper')
  }

  return parensNode.create(queryNode.where.where)
}

function parseHavingGrouper(
  grouper: (qb: AnyQueryBuilder) => AnyQueryBuilder
): ParensNode {
  if (!isFunction(grouper)) {
    throw new Error(
      `invalid call to queryBuilder.having: ${JSON.stringify(grouper)}`
    )
  }

  const query = grouper(createEmptySelectQuery())
  const queryNode = query.toOperationNode() as SelectQueryNode

  if (!queryNode.having) {
    throw new Error('no having methods called insided a grouper')
  }

  return parensNode.create(queryNode.having.having)
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

  return parensNode.create(joinNode.on)
}

export function createEmptyJoinBuilder(): JoinBuilder<any, any> {
  return new JoinBuilder(
    joinNode.create('InnerJoin', parseTableExpression('table'))
  )
}
