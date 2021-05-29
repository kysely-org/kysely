import { RawBuilder } from '..'
import { isColumnNode } from '../operation-node/column-node'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { ValueExpressionNode } from '../operation-node/operation-node-utils'
import {
  createPrimitiveValueListNode,
  isPrimitiveValueListNode,
  PrimitiveValueListNode,
} from '../operation-node/primitive-value-list-node'
import {
  createValueListNode,
  isValueListNode,
  ValueListNode,
} from '../operation-node/value-list-node'
import { createValueNode } from '../operation-node/value-node'
import { isFunction, isPrimitive, PrimitiveValue } from '../utils/object-utils'
import { createEmptySelectQuery } from '../query-builder/query-builder'
import {
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { isMutatingQueryNode } from '../operation-node/query-node-utils'

export type ValueExpression<DB, TB extends keyof DB, O> =
  | PrimitiveValue
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>

export type ValueExpressionOrList<DB, TB extends keyof DB, O> =
  | ValueExpression<DB, TB, O>
  | ValueExpression<DB, TB, O>[]

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, any>
) {
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
    return createValueNode(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!isMutatingQueryNode(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(createEmptySelectQuery()).toOperationNode()

    if (!isMutatingQueryNode(node)) {
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
    return createPrimitiveValueListNode(arg)
  }

  return createValueListNode(
    arg.map((it) => {
      const node = parseValueExpression(it)

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
