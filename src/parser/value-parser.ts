import { columnNode } from '../operation-node/column-node'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { ValueExpressionNode } from '../operation-node/operation-node-utils'
import {
  PrimitiveValueListNode,
  primitiveValueListNode,
} from '../operation-node/primitive-value-list-node'
import { valueListNode, ValueListNode } from '../operation-node/value-list-node'
import { valueNode } from '../operation-node/value-node'
import { isFunction, isPrimitive, PrimitiveValue } from '../util/object-utils'
import {
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { queryNode } from '../operation-node/query-node'
import { SubQueryBuilder } from '../query-builder/sub-query-builder'
import { RawBuilder } from '../raw-builder/raw-builder'

export type ValueExpression<DB, TB extends keyof DB> =
  | PrimitiveValue
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB>

export type ValueExpressionOrList<DB, TB extends keyof DB> =
  | ValueExpression<DB, TB>
  | ValueExpression<DB, TB>[]

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any>
) {
  if (Array.isArray(arg)) {
    return parseValueExpressionList(arg)
  } else {
    return parseValueExpression(arg)
  }
}

export function parseValueExpression(
  arg: ValueExpression<any, any>
): ValueExpressionNode {
  if (isPrimitive(arg)) {
    return valueNode.create(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!queryNode.isMutating(node)) {
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
  arg: ValueExpression<any, any>[]
): PrimitiveValueListNode | ValueListNode {
  if (arg.every(isPrimitive)) {
    // Optimization for large lists of primitive values.
    return primitiveValueListNode.create(arg)
  }

  return valueListNode.create(
    arg.map((it) => {
      const node = parseValueExpression(it)

      if (columnNode.is(node)) {
        throw new Error(
          `filter method right hand side argument cannot have column references in a list`
        )
      }

      if (valueListNode.is(node) || primitiveValueListNode.is(node)) {
        throw new Error(
          `filter method right hand side argument cannot have nested lists`
        )
      }

      return node
    })
  )
}
