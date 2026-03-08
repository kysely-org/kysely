import type { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { PartitionByItemNode } from '../operation-node/partition-by-item-node.js'
import {
  type ExpressionOrFactory,
  isExpressionOrFactory,
  parseExpression,
} from './expression-parser.js'
import {
  parseSimpleReferenceExpression,
  type StringReference,
} from './reference-parser.js'

export type PartitionByExpression<DB, TB extends keyof DB> =
  | StringReference<DB, TB>
  | DynamicReferenceBuilder<any>
  | ExpressionOrFactory<DB, TB, any>

export type PartitionByExpressionOrList<DB, TB extends keyof DB> =
  | ReadonlyArray<PartitionByExpression<DB, TB>>
  | PartitionByExpression<DB, TB>

export function parsePartitionBy(
  partitionBy: PartitionByExpressionOrList<any, any>,
): PartitionByItemNode[] {
  const items = Array.isArray(partitionBy) ? partitionBy : [partitionBy]
  return items.map((item) => {
    if (isExpressionOrFactory(item)) {
      return PartitionByItemNode.create(parseExpression(item))
    }
    return PartitionByItemNode.create(parseSimpleReferenceExpression(item))
  })
}
