import { isColumnNode } from '../../operation-node/column-node'
import {
  createPrimitiveValueListNode,
  isPrimitiveValueListNode,
  PrimitiveValueListNode,
} from '../../operation-node/primitive-value-list-node'
import {
  createValueListNode,
  isValueListNode,
  ValueListNode,
} from '../../operation-node/value-list-node'
import { createValueNode } from '../../operation-node/value-node'
import {
  createFilterNode,
  FilterNode,
  FilterNodeLhsNode,
  FilterNodeRhsNode,
} from '../../operation-node/filter-node'
import { RawBuilder } from '../../raw-builder/raw-builder'
import {
  isFunction,
  isPrimitive,
  isString,
  PrimitiveValue,
} from '../../utils/object-utils'
import {
  AnyColumn,
  AnyColumnWithTable,
  AnyQueryBuilder,
  ArrayItemType,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../type-utils'
import { parseStringReference } from './select-method'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { RawNode } from '../../operation-node/raw-node'
import {
  createOperatorNode,
  OperatorNode,
} from '../../operation-node/operator-node'
import { QueryBuilder } from '../query-builder'
import { AndNode } from '../../operation-node/and-node'
import { OrNode } from '../../operation-node/or-node'
import { createParensNode, ParensNode } from '../../operation-node/parens-node'
import { createQueryNode } from '../../operation-node/query-node'

export type FilterReferenceArg<DB, TB extends keyof DB, O> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>

export type FilterValueArg<DB, TB extends keyof DB, O> =
  | FilterValue<DB, TB, O>
  | FilterValue<DB, TB, O>[]

export type ExistsFilterArg<DB, TB extends keyof DB, O> =
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>

type FilterValue<DB, TB extends keyof DB, O> =
  | PrimitiveValue
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
  query: AnyQueryBuilder,
  args: any[]
): FilterNode | AndNode | OrNode | ParensNode {
  if (args.length === 3) {
    return parseThreeArgFilter(query, args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseOneArgFilter(args[0])
  } else {
    throw new Error(
      `invalid arguments passed to a filter method ${JSON.stringify(args)}`
    )
  }
}

export function parseFilterReferenceArgs(
  query: AnyQueryBuilder,
  lhs: FilterReferenceArg<any, any, any>,
  op: FilterOperatorArg,
  rhs: FilterReferenceArg<any, any, any>
): FilterNode {
  return createFilterNode(
    parseFilterReference(query, lhs),
    parseFilterOperator(op),
    parseFilterReference(query, rhs)
  )
}

export function parseExistsFilterArgs(
  query: AnyQueryBuilder,
  type: 'exists' | 'not exists',
  arg: ExistsFilterArg<any, any, any>
): FilterNode {
  if (isFunction(arg)) {
    return createFilterNode(
      undefined,
      createOperatorNode(type),
      arg(query).toOperationNode()
    )
  } else {
    return createFilterNode(
      undefined,
      createOperatorNode(type),
      arg.toOperationNode()
    )
  }
}

function parseThreeArgFilter(
  query: AnyQueryBuilder,
  lhs: FilterReferenceArg<any, any, any>,
  op: FilterOperatorArg,
  rhs: FilterValueArg<any, any, any>
): FilterNode {
  return createFilterNode(
    parseFilterReference(query, lhs),
    parseFilterOperator(op),
    parseFilterValue(query, rhs)
  )
}

function parseFilterReference(
  query: AnyQueryBuilder,
  arg: FilterReferenceArg<any, any, any>
): FilterNodeLhsNode {
  if (isString(arg)) {
    return parseStringReference(arg)
  } else if (isOperationNodeSource(arg)) {
    return arg.toOperationNode()
  } else if (isFunction(arg)) {
    return arg(query).toOperationNode()
  } else {
    throw new Error(
      `unsupported left hand side filter argument ${JSON.stringify(arg)}`
    )
  }
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

function parseFilterValue(
  query: AnyQueryBuilder,
  arg: FilterValueArg<any, any, any>
): FilterNodeRhsNode {
  if (isPrimitive(arg)) {
    return createValueNode(arg)
  } else if (Array.isArray(arg)) {
    return parseFilterValueList(query, arg)
  } else if (isOperationNodeSource(arg)) {
    return arg.toOperationNode()
  } else if (isFunction(arg)) {
    return arg(query).toOperationNode()
  } else {
    throw new Error(
      `unsupported right hand side filter argument ${JSON.stringify(arg)}`
    )
  }
}

function parseFilterValueList(
  query: AnyQueryBuilder,
  arg: FilterValueArg<any, any, any>[]
): PrimitiveValueListNode | ValueListNode {
  if (arg.every(isPrimitive)) {
    // Optimization for large lists of primitive values.
    return createPrimitiveValueListNode(arg)
  }

  return createValueListNode(
    arg.map((it) => {
      const node = parseFilterValue(query, it)

      if (isColumnNode(node)) {
        throw new Error(
          `filter method right hand side argument cannot have column references in a list`
        )
      }

      if (isValueListNode(node) || isPrimitiveValueListNode(node)) {
        throw new Error(
          `filter method right hand side argument cannot have nested lists`
        )
      }

      return node
    })
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

  const query = grouper(
    new QueryBuilder({
      queryNode: createQueryNode(),
    })
  )

  const queryNode = query.toOperationNode()

  if (!queryNode.where) {
    throw new Error('no where methods called insided a grouper where')
  }

  return createParensNode(queryNode.where.where)
}
