import { freeze } from '../util/object-utils.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OverBuilder } from './over-builder.js'
import { createOverBuilder } from '../parser/parse-utils.js'
import {
  AliasableExpression,
  AliasedExpression,
  Expression,
} from '../expression/expression.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseReferentialBinaryOperation,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import { SqlBool } from '../util/type-utils.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import {
  DirectedOrderByStringReference,
  OrderByExpression,
  OrderByModifiers,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import { OrderByInterface } from './order-by-interface.js'
import { QueryNode } from '../operation-node/query-node.js'

export class AggregateFunctionBuilder<DB, TB extends keyof DB, O = unknown>
  implements OrderByInterface<DB, TB, {}>, AliasableExpression<O>
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
   *     (eb) => eb.fn.count<number>('id').as('person_count')
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
    alias: A,
  ): AliasedAggregateFunctionBuilder<DB, TB, O, A> {
    return new AliasedAggregateFunctionBuilder(this, alias)
  }

  /**
   * Adds a `distinct` clause inside the function.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) =>
   *     eb.fn.count<number>('first_name').distinct().as('first_name_count')
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
        this.#props.aggregateFunctionNode,
      ),
    })
  }

  /**
   * Adds an `order by` clause inside the aggregate function.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .select((eb) =>
   *     eb.fn.jsonAgg('pet').orderBy('pet.name').as('person_pets')
   *   )
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select json_agg("pet" order by "pet"."name") as "person_pets"
   * from "person"
   * inner join "pet" ON "pet"."owner_id" = "person"."id"
   * ```
   */
  orderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers?: OrderByModifiers,
  ): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2-2.6x more compile-time instantiations compared to multiple chained `orderBy(expr, modifiers?)` calls (in `order by` clauses with reasonable item counts), and has broken autocompletion.
   */
  orderBy<
    OE extends
      | OrderByExpression<DB, TB, {}>
      | DirectedOrderByStringReference<DB, TB, {}>,
  >(exprs: ReadonlyArray<OE>): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2.9x more compile-time instantiations compared to a `orderBy(expr, direction)` call.
   */
  orderBy<OE extends DirectedOrderByStringReference<DB, TB, {}>>(
    expr: OE,
  ): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated Use `orderBy(expr, (ob) => ...)` instead.
   */
  orderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers: Expression<any>,
  ): AggregateFunctionBuilder<DB, TB, O>

  orderBy(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: QueryNode.cloneWithOrderByItems(
        this.#props.aggregateFunctionNode,
        parseOrderBy(args),
      ),
    })
  }

  clearOrderBy(): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: QueryNode.cloneWithoutOrderBy(
        this.#props.aggregateFunctionNode,
      ),
    })
  }

  /**
   * Adds a `withing group` clause with a nested `order by` clause after the function.
   *
   * This is only supported by some dialects like PostgreSQL or MS SQL Server.
   *
   * ### Examples
   *
   * Most frequent person name:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) => [
   *     eb.fn
   *       .agg<string>('mode')
   *       .withinGroupOrderBy('person.first_name')
   *       .as('most_frequent_name')
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select mode() within group (order by "person"."first_name") as "most_frequent_name"
   * from "person"
   * ```
   */
  withinGroupOrderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers?: OrderByModifiers,
  ): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2-2.6x more compile-time instantiations compared to multiple chained `withinGroupOrderBy(expr, modifiers?)` calls (in `order by` clauses with reasonable item counts), and has broken autocompletion.
   */
  withinGroupOrderBy<
    OE extends
      | OrderByExpression<DB, TB, {}>
      | DirectedOrderByStringReference<DB, TB, {}>,
  >(exprs: ReadonlyArray<OE>): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated It does ~2.9x more compile-time instantiations compared to a `withinGroupOrderBy(expr, direction)` call.
   */
  withinGroupOrderBy<OE extends DirectedOrderByStringReference<DB, TB, {}>>(
    expr: OE,
  ): AggregateFunctionBuilder<DB, TB, O>

  // TODO: remove in v0.29
  /**
   * @deprecated Use `withinGroupOrderBy(expr, (ob) => ...)` instead.
   */
  withinGroupOrderBy<OE extends OrderByExpression<DB, TB, {}>>(
    expr: OE,
    modifiers: Expression<any>,
  ): AggregateFunctionBuilder<DB, TB, O>

  withinGroupOrderBy(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrderBy(
        this.#props.aggregateFunctionNode,
        parseOrderBy(args),
        true,
      ),
    })
  }

  /**
   * Adds a `filter` clause with a nested `where` clause after the function.
   *
   * Similar to {@link WhereInterface}'s `where` method.
   *
   * Also see {@link filterWhereRef}.
   *
   * ### Examples
   *
   * Count by gender:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) => [
   *     eb.fn
   *       .count<number>('id')
   *       .filterWhere('gender', '=', 'female')
   *       .as('female_count'),
   *     eb.fn
   *       .count<number>('id')
   *       .filterWhere('gender', '=', 'male')
   *       .as('male_count'),
   *     eb.fn
   *       .count<number>('id')
   *       .filterWhere('gender', '=', 'other')
   *       .as('other_count'),
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   count("id") filter(where "gender" = $1) as "female_count",
   *   count("id") filter(where "gender" = $2) as "male_count",
   *   count("id") filter(where "gender" = $3) as "other_count"
   * from "person"
   * ```
   */
  filterWhere<
    RE extends ReferenceExpression<DB, TB>,
    VE extends OperandValueExpressionOrList<DB, TB, RE>,
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): AggregateFunctionBuilder<DB, TB, O>

  filterWhere<E extends ExpressionOrFactory<DB, TB, SqlBool>>(
    expression: E,
  ): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseValueBinaryOperationOrExpression(args),
      ),
    })
  }

  /**
   * Adds a `filter` clause with a nested `where` clause after the function, where
   * both sides of the operator are references to columns.
   *
   * Similar to {@link WhereInterface}'s `whereRef` method.
   *
   * ### Examples
   *
   * Count people with same first and last names versus general public:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) => [
   *     eb.fn
   *       .count<number>('id')
   *       .filterWhereRef('first_name', '=', 'last_name')
   *       .as('repeat_name_count'),
   *     eb.fn.count<number>('id').as('total_count'),
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   count("id") filter(where "first_name" = "last_name") as "repeat_name_count",
   *   count("id") as "total_count"
   * from "person"
   * ```
   */
  filterWhereRef<
    LRE extends ReferenceExpression<DB, TB>,
    RRE extends ReferenceExpression<DB, TB>,
  >(
    lhs: LRE,
    op: ComparisonOperatorExpression,
    rhs: RRE,
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseReferentialBinaryOperation(lhs, op, rhs),
      ),
    })
  }

  /**
   * Adds an `over` clause (window functions) after the function.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     (eb) => eb.fn.avg<number>('age').over().as('average_age')
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
   *     (eb) => eb.fn.avg<number>('age').over(
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
    over?: OverBuilderCallback<DB, TB>,
  ): AggregateFunctionBuilder<DB, TB, O> {
    const builder = createOverBuilder()

    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOver(
        this.#props.aggregateFunctionNode,
        (over ? over(builder) : builder).toOperationNode(),
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

  /**
   * Casts the expression to the given type.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `AggregateFunctionBuilder` with a new output type.
   */
  $castTo<C>(): AggregateFunctionBuilder<DB, TB, C> {
    return new AggregateFunctionBuilder(this.#props)
  }

  /**
   * Omit null from the expression's type.
   *
   * This function can be useful in cases where you know an expression can't be
   * null, but Kysely is unable to infer it.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of `this` with a new output type.
   */
  $notNull(): AggregateFunctionBuilder<DB, TB, Exclude<O, null>> {
    return new AggregateFunctionBuilder(this.#props)
  }

  toOperationNode(): AggregateFunctionNode {
    return this.#props.aggregateFunctionNode
  }
}

/**
 * {@link AggregateFunctionBuilder} with an alias. The result of calling {@link AggregateFunctionBuilder.as}.
 */
export class AliasedAggregateFunctionBuilder<
  DB,
  TB extends keyof DB,
  O = unknown,
  A extends string = never,
> implements AliasedExpression<O, A>
{
  readonly #aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>
  readonly #alias: A

  constructor(
    aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>,
    alias: A,
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
      IdentifierNode.create(this.#alias),
    )
  }
}

export interface AggregateFunctionBuilderProps {
  aggregateFunctionNode: AggregateFunctionNode
}

export type OverBuilderCallback<DB, TB extends keyof DB> = (
  builder: OverBuilder<DB, TB>,
) => OverBuilder<any, any>
