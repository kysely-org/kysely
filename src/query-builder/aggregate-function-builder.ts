import { freeze } from '../util/object-utils.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { preventAwait } from '../util/prevent-await.js'
import { OverBuilder } from './over-builder.js'
import { createOverBuilder } from '../parser/parse-utils.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import {
  ExistsExpression,
  FilterOperator,
  FilterValueExpressionOrList,
  parseExistFilter,
  parseNotExistFilter,
  parseReferenceFilter,
  parseWhereFilter,
  WhereGrouper,
} from '../parser/filter-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'

export class AggregateFunctionBuilder<DB, TB extends keyof DB, O = unknown>
  implements Expression<O>
{
  readonly #props: AggregateFunctionBuilderProps

  constructor(props: AggregateFunctionBuilderProps) {
    this.#props = freeze(props)
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the function.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.count<number>('id').as('person_count')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `person_count: number` field exists in the result type.
   * console.log(result.person_count)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count("id") as "person_count"
   * from "person"
   * ```
   */
  as<A extends string>(
    alias: A
  ): AliasedAggregateFunctionBuilder<DB, TB, O, A> {
    return new AliasedAggregateFunctionBuilder(this, alias)
  }

  /**
   * Adds a distinct clause inside the function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.count<number>('first_name').distinct().as('first_name_count')
   *   )
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count(distinct "first_name") as "first_name_count"
   * from "person"
   * ```
   */
  distinct(): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithDistinct(
        this.#props.aggregateFunctionNode
      ),
    })
  }

  /**
   * // TODO: ...
   */
  filter<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  filter(grouper: WhereGrouper<DB, TB>): AggregateFunctionBuilder<DB, TB, O>
  filter(expression: Expression<any>): AggregateFunctionBuilder<DB, TB, O>

  filter(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseWhereFilter(args)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseExistFilter(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  filterRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilter<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilter(grouper: WhereGrouper<DB, TB>): AggregateFunctionBuilder<DB, TB, O>
  orFilter(expression: Expression<any>): AggregateFunctionBuilder<DB, TB, O>

  orFilter(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseWhereFilter(args)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseExistFilter(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  /**
   * TODO: ...
   */
  orFilterRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  /**
   * Adds an over clause (window functions) after the function.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over().as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over() as "average_age"
   * from "person"
   * ```
   *
   * Also supports passing a callback that returns an over builder,
   * allowing to add partition by and sort by clauses inside over.
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     eb => eb.fn.avg<number>('age').over(
   *       ob => ob.partitionBy('last_name').orderBy('first_name', 'asc')
   *     ).as('average_age')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("age") over(partition by "last_name" order by "first_name" asc) as "average_age"
   * from "person"
   * ```
   */
  over(
    over?: OverBuilderCallback<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    const builder = createOverBuilder()

    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOver(
        this.#props.aggregateFunctionNode,
        (over ? over(builder) : builder).toOperationNode()
      ),
    })
  }

  toOperationNode(): AggregateFunctionNode {
    return this.#props.aggregateFunctionNode
  }
}

preventAwait(
  AggregateFunctionBuilder,
  "don't await AggregateFunctionBuilder instances. They are never executed directly and are always just a part of a query."
)

/**
 * {@link AggregateFunctionBuilder} with an alias. The result of calling {@link AggregateFunctionBuilder.as}.
 */
export class AliasedAggregateFunctionBuilder<
  DB,
  TB extends keyof DB,
  O = unknown,
  A extends string = never
> implements AliasedExpression<O, A>
{
  readonly #aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>
  readonly #alias: A

  constructor(
    aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>,
    alias: A
  ) {
    this.#aggregateFunctionBuilder = aggregateFunctionBuilder
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<O> {
    return this.#aggregateFunctionBuilder
  }

  /** @private */
  get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#aggregateFunctionBuilder.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}

export interface AggregateFunctionBuilderProps {
  aggregateFunctionNode: AggregateFunctionNode
}

export type OverBuilderCallback<DB, TB extends keyof DB> = (
  builder: OverBuilder<DB, TB>
) => OverBuilder<DB, TB>
