import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OverNode } from '../operation-node/over-node.js'
import {
  OrderByDirectionExpression,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import {
  parsePartitionBy,
  PartitionByExpression,
  PartitionByExpressionOrList,
} from '../parser/partition-by-parser.js'
import { StringReference } from '../parser/reference-parser.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'

export class OverBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource
{
  readonly #props: OverBuilderProps

  constructor(props: OverBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * TODO: ...
   */
  orderBy(
    orderBy: StringReference<DB, TB> | DynamicReferenceBuilder<any>,
    direction?: OrderByDirectionExpression
  ): OverBuilder<DB, TB> {
    return new OverBuilder({
      overNode: OverNode.cloneWithOrderByItem(
        this.#props.overNode,
        parseOrderBy(orderBy, direction)
      ),
    })
  }

  /**
   * TODO: ...
   */
  partitionBy(
    partitionBy: ReadonlyArray<PartitionByExpression<DB, TB>>
  ): OverBuilder<DB, TB>

  partitionBy(partitionBy: PartitionByExpression<DB, TB>): OverBuilder<DB, TB>

  partitionBy(partitionBy: PartitionByExpressionOrList<DB, TB>): any {
    return new OverBuilder({
      overNode: OverNode.cloneWithPartitionByItems(
        this.#props.overNode,
        parsePartitionBy(partitionBy)
      ),
    })
  }

  toOperationNode(): OverNode {
    return this.#props.overNode
  }
}

preventAwait(
  OverBuilder,
  "don't await OverBuilder instances. They are never executed directly and are always just a part of a query."
)

export interface OverBuilderProps {
  readonly overNode: OverNode
}
