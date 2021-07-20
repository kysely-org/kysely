import { FilterNode, filterNode } from '../operation-node/filter-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isFunction, isString } from '../util/object-utils'
import {
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { RawNode, rawNode } from '../operation-node/raw-node'
import {
  Operator,
  OperatorNode,
  operatorNode,
  OPERATORS,
} from '../operation-node/operator-node'
import { ParensNode, parensNode } from '../operation-node/parens-node'
import {
  parseReferenceExpression,
  ReferenceExpression,
} from './reference-parser'
import {
  parseValueExpressionOrList,
  ValueExpressionOrList,
} from './value-parser'
import {
  selectQueryNode,
  SelectQueryNode,
} from '../operation-node/select-query-node'
import { SubQueryBuilder } from '../query-builder/sub-query-builder'
import { createEmptySelectQuery } from '../query-builder/query-builder'
import { JoinBuilder } from '../query-builder/join-builder'
import { parseTableExpression } from './table-parser'
import { JoinNode, joinNode } from '../operation-node/join-node'
import { FilterExpressionNode } from '../operation-node/operation-node-utils'

export type ExistsFilterArg<DB, TB extends keyof DB> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB>

export type FilterOperatorArg = Operator | RawBuilder<any>
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
  return filterNode.create(
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
    throw new Error('no where methods called insided a grouper where')
  }

  return parensNode.create(queryNode.where.where)
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
