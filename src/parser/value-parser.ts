import { ColumnNode } from '../operation-node/column-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { ValueExpressionNode } from '../operation-node/operation-node-utils.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { isFunction, isPrimitive } from '../util/object-utils.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils.js'
import { QueryNode } from '../operation-node/query-node.js'
import { SubQueryBuilder } from '../query-builder/sub-query-builder.js'
import { ExtractTypeFromReferenceExpression } from './reference-parser.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'

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
    return ValueNode.create(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (RawNode.is(node) || SelectQueryNode.is(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(new SubQueryBuilder()).toOperationNode()

    if (!QueryNode.isMutating(node)) {
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
    return PrimitiveValueListNode.create(arg)
  }

  return ValueListNode.create(
    arg.map((it) => {
      const node = parseValueExpression(it)

      if (ColumnNode.is(node)) {
        throw new Error('value lists cannot have column references')
      }

      if (ValueListNode.is(node) || PrimitiveValueListNode.is(node)) {
        throw new Error('value lists cannot have nested lists')
      }

      return node
    })
  )
}
