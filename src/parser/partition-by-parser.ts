import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import { PartitionByItemNode } from '../operation-node/partition-by-item-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
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
  partitionBy: PartitionByExpressionOrList<any, any>
): PartitionByItemNode[] {
  return (
    parseReferenceExpressionOrList(partitionBy) as (
      | ColumnNode
      | ReferenceNode
    )[]
  ).map(PartitionByItemNode.create)
}
