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
   * Adds an order by clause item inside the over function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over(
   *       ob => ob.orderBy('first_name', 'asc').orderBy('last_name', 'asc')
   *     ).as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over(order by "first_name" asc, "last_name" asc) as "average_age"
   * from "person"
   * ```
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
   * Adds partition by clause item/s inside the over function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over(
   *       ob => ob.partitionBy(['last_name', 'first_name'])
   *     ).as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over(partition by "last_name", "first_name") as "average_age"
   * from "person"
   * ```
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

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
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
