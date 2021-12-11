import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { ValueExpressionNode } from '../operation-node/operation-node-utils.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import {
  isFunction,
  isPrimitive,
  isReadonlyArray,
  PrimitiveValue,
} from '../util/object-utils.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../util/type-utils.js'
import { QueryNode } from '../operation-node/query-node.js'
import { ParseContext } from './parse-context.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { RawNode } from '../operation-node/raw-node.js'

export type ValueExpression<DB, TB extends keyof DB, V> =
  | V
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export type ValueExpressionOrList<DB, TB extends keyof DB, V> =
  | ValueExpression<DB, TB, V>
  | ReadonlyArray<ValueExpression<DB, TB, V>>

export function parseValueExpressionOrList(
  ctx: ParseContext,
  arg: ValueExpressionOrList<any, any, PrimitiveValue>
): ValueExpressionNode {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(ctx, arg)
  } else {
    return parseValueExpression(ctx, arg)
  }
}

export function parseValueExpression(
  ctx: ParseContext,
  arg: ValueExpression<any, any, PrimitiveValue>
): ValueNode | SelectQueryNode | RawNode {
  if (isPrimitive(arg)) {
    return ValueNode.create(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(ctx.createExpressionBuilder()).toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(`invalid value expression ${JSON.stringify(arg)}`)
}

function parseValueExpressionList(
  ctx: ParseContext,
  arg: ReadonlyArray<ValueExpression<any, any, PrimitiveValue>>
): PrimitiveValueListNode | ValueListNode {
  if (arg.every(isPrimitive)) {
    // Optimization for large lists of primitive values.
    return PrimitiveValueListNode.create(arg)
  }

  return ValueListNode.create(arg.map((it) => parseValueExpression(ctx, it)))
}
