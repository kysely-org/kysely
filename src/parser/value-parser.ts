import { columnNode } from '../operation-node/column-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { ValueExpressionNode } from '../operation-node/operation-node-utils.js'
import {
  PrimitiveValueListNode,
  primitiveValueListNode,
} from '../operation-node/primitive-value-list-node.js'
import {
  valueListNode,
  ValueListNode,
} from '../operation-node/value-list-node.js'
import { valueNode } from '../operation-node/value-node.js'
import {
  isFunction,
  isPrimitive,
  PrimitiveValue,
} from '../util/object-utils.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils.js'
import { queryNode } from '../operation-node/query-node.js'
import { SubQueryBuilder } from '../query-builder/sub-query-builder.js'
import {
  ExtractTypeFromReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'
import { rawNode, selectQueryNode } from '../index.js'

export type ValueExpression<DB, TB extends keyof DB, RE> =
  | ExtractTypeFromReferenceExpression<DB, TB, RE>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export type ValueExpressionOrList<DB, TB extends keyof DB, RE> =
  | ValueExpression<DB, TB, RE>
  | ValueExpression<DB, TB, RE>[]

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, any>
): ValueExpressionNode {
  if (Array.isArray(arg)) {
    return parseValueExpressionList(arg)
  } else {
    return parseValueExpression(arg)
  }
}

export function parseValueExpression(
  arg: ValueExpression<any, any, any>
): ValueExpressionNode {
  if (isPrimitive(arg)) {
    return valueNode.create(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (rawNode.is(node) || selectQueryNode.is(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(new SubQueryBuilder()).toOperationNode()

    if (!queryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(`invalid value expression ${JSON.stringify(arg)}`)
}

function parseValueExpressionList(
  arg: ValueExpression<any, any, any>[]
): PrimitiveValueListNode | ValueListNode {
  if (arg.every(isPrimitive)) {
    // Optimization for large lists of primitive values.
    return primitiveValueListNode.create(arg)
  }

  return valueListNode.create(
    arg.map((it) => {
      const node = parseValueExpression(it)

      if (columnNode.is(node)) {
        throw new Error('value lists cannot have column references')
      }

      if (valueListNode.is(node) || primitiveValueListNode.is(node)) {
        throw new Error('value lists cannot have nested lists')
      }

      return node
    })
  )
}
