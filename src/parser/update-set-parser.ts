import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../util/type-utils.js'
import {
  isFunction,
  isPrimitive,
  PrimitiveValue,
} from '../util/object-utils.js'
import { ParseContext } from './parse-context.js'

export type MutationObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]?: MutationValueExpression<DB, TB, DB[TB][C]>
}

export type MutationValueExpression<DB, TB extends keyof DB, T> =
  | T
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export function parseUpdateObject(
  ctx: ParseContext,
  row: MutationObject<any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row).map(([key, value]) => {
    return ColumnUpdateNode.create(
      ColumnNode.create(key),
      parseMutationValueExpression(ctx, value)
    )
  })
}

export function parseMutationValueExpression(
  ctx: ParseContext,
  value: MutationValueExpression<any, any, PrimitiveValue>
): ValueNode | RawNode | SelectQueryNode {
  if (isPrimitive(value)) {
    return ValueNode.create(value)
  } else if (isOperationNodeSource(value)) {
    const node = value.toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  } else if (isFunction(value)) {
    const node = value(ctx.createExpressionBuilder()).toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(
    `unsupported value for mutation object ${JSON.stringify(value)}`
  )
}
