import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { PartitionByItemNode } from '../operation-node/partition-by-item-node.js'
import { SimpleReferenceExpressionNode } from '../operation-node/simple-reference-expression-node.js'
import {
  parseReferenceExpressionOrList,
  StringReference,
} from './reference-parser.js'

export type PartitionByExpression<DB, TB extends keyof DB> =
  | StringReference<DB, TB>
  | DynamicReferenceBuilder<any>

export type PartitionByExpressionOrList<DB, TB extends keyof DB> =
  | ReadonlyArray<PartitionByExpression<DB, TB>>
  | PartitionByExpression<DB, TB>

export function parsePartitionBy(
  partitionBy: PartitionByExpressionOrList<any, any>,
): PartitionByItemNode[] {
  return (
    parseReferenceExpressionOrList(
      partitionBy,
    ) as SimpleReferenceExpressionNode[]
  ).map(PartitionByItemNode.create)
}
