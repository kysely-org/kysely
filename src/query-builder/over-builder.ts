import type { Expression } from '../expression/expression.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OverNode } from '../operation-node/over-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  type DirectedOrderByStringReference,
  type OrderByExpression,
  type OrderByModifiers,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import {
  parsePartitionBy,
  type PartitionByExpression,
  type PartitionByExpressionOrList,
} from '../parser/partition-by-parser.js'
import { freeze } from '../util/object-utils.js'
import type { OrderByInterface } from './order-by-interface.js'

export class OverBuilder<DB, TB extends keyof DB>
  implements OrderByInterface<DB, TB, {}>, OperationNodeSource
{
  readonly #props: OverBuilderProps

  constructor(props: OverBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds an `order by` clause or item inside the `over` function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     (eb) => eb.fn.avg<number>('age').over(
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
  orderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers?: OrderByModifiers,
  ): OverBuilder<DB, TB>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2-2.6x more compile-time instantiations compared to multiple chained `orderBy(expr, modifiers?)` calls (in `order by` clauses with reasonable item counts), and has broken autocompletion.
   */
  orderBy<
    OE extends
      | OrderByExpression<DB, TB, {}>
      | DirectedOrderByStringReference<DB, TB, {}>,
  >(exprs: ReadonlyArray<OE>): OverBuilder<DB, TB>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2.9x more compile-time instantiations compared to a `orderBy(expr, direction)` call.
   */
  orderBy<OE extends DirectedOrderByStringReference<DB, TB, {}>>(
    expr: OE,
  ): OverBuilder<DB, TB>

  // TODO: remove in v0.29
  /**
   * @deprecated Use `orderBy(expr, (ob) => ...)` instead.
   */
  orderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers: Expression<any>,
  ): OverBuilder<DB, TB>

  orderBy(...args: any[]): any {
    return new OverBuilder({
      overNode: OverNode.cloneWithOrderByItems(
        this.#props.overNode,
        parseOrderBy(args),
      ),
    })
  }

  clearOrderBy(): OverBuilder<DB, TB> {
    return new OverBuilder({
      overNode: QueryNode.cloneWithoutOrderBy(this.#props.overNode),
    })
  }

  /**
   * Adds partition by clause item/s inside the over function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     (eb) => eb.fn.avg<number>('age').over(
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
    partitionBy: ReadonlyArray<PartitionByExpression<DB, TB>>,
  ): OverBuilder<DB, TB>

  partitionBy<PE extends PartitionByExpression<DB, TB>>(
    partitionBy: PE,
  ): OverBuilder<DB, TB>

  partitionBy(partitionBy: PartitionByExpressionOrList<DB, TB>): any {
    return new OverBuilder({
      overNode: OverNode.cloneWithPartitionByItems(
        this.#props.overNode,
        parsePartitionBy(partitionBy),
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

export interface OverBuilderProps {
  readonly overNode: OverNode
}
