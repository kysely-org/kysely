import { freeze } from '../util/object-utils.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { preventAwait } from '../util/prevent-await.js'
import { OverBuilder } from './over-builder.js'
import { createOverBuilder } from '../parser/parse-utils.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseReferentialFilter,
  parseWhere,
  WhereGrouper,
} from '../parser/binary-operation-parser.js'
import {
  ExistsExpression,
  parseExists,
  parseNotExists,
} from '../parser/unary-operation-parser.js'

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
        this.#props.aggregateFunctionNode
      ),
    })
  }

  /**
   * Adds a `filter` clause with a nested `where` clause after the function.
   *
   * Similar to {@link WhereInterface}'s `where` method.
   *
   * Also see {@link orFilterWhere}, {@link filterWhereExists} and {@link filterWhereRef}.
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
  filterWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(
    grouper: WhereGrouper<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(expression: Expression<any>): AggregateFunctionBuilder<DB, TB, O>

  filterWhere(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseWhere(args)
      ),
    })
  }

  /**
   * Adds a `filter` clause with a nested `where exists` clause after the function.
   *
   * Similar to {@link WhereInterface}'s `whereExists` method.
   *
   * ### Examples
   *
   * Count pet owners versus general public:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) => [
   *     eb.fn
   *       .count<number>('person.id')
   *       .filterWhereExists((qb) =>
   *         qb
   *           .selectFrom('pet')
   *           .select('pet.id')
   *           .whereRef('pet.owner_id', '=', 'person.id')
   *       )
   *       .as('pet_owner_count'),
   *     eb.fn.count<number>('person.id').as('total_count'),
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count("person"."id") filter(where exists (
   *   select "pet"."id"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   * )) as "pet_ower_count",
   *   count("person"."id") as "total_count"
   * from "person"
   * ```
   */
  filterWhereExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseExists(arg)
      ),
    })
  }

  /**
   * Just like {@link filterWhereExists} but creates a `not exists` clause inside
   * the `filter` clause.
   */
  filterWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseNotExists(arg)
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
  filterWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(
        this.#props.aggregateFunctionNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  /**
   * Adds a `filter` clause with a nested `or where` clause after the function.
   * Otherwise works just like {@link filterWhere}.
   *
   * Similar to {@link WhereInterface}'s `orWhere` method.
   *
   * ### Examples
   *
   * For some reason you're tasked with counting adults (18+) or people called
   * "Bob" versus general public:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select([
   *     (eb) =>
   *       eb.fn
   *         .count<number>('id')
   *         .filterWhere('age', '>=', '18')
   *         .orFilterWhere('first_name', '=', 'Bob')
   *         .as('adult_or_bob_count'),
   *     (eb) => eb.fn.count<number>('id').as('total_count'),
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   count("id") filter(where "age" >= $1 or "first_name" = $2) as "adult_or_bob_count",
   *   count("id") as "total_count"
   * from "person"
   * ```
   */
  orFilterWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilterWhere(
    grouper: WhereGrouper<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilterWhere(
    expression: Expression<any>
  ): AggregateFunctionBuilder<DB, TB, O>

  orFilterWhere(...args: any[]): any {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseWhere(args)
      ),
    })
  }

  /**
   * Just like {@link filterWhereExists} but creates an `or exists` clause inside
   * the `filter` clause.
   *
   * Similar to {@link WhereInterface}'s `orWhereExists` method.
   */
  orFilterWhereExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseExists(arg)
      ),
    })
  }

  /**
   * Just like {@link filterWhereExists} but creates an `or not exists` clause inside
   * the `filter` clause.
   *
   * Similar to {@link WhereInterface}'s `orWhereNotExists` method.
   */
  orFilterWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseNotExists(arg)
      ),
    })
  }

  /**
   * Adds an `or where` clause inside the `filter` clause. Otherwise works just
   * like {@link filterWhereRef}.
   *
   * Also see {@link orFilterWhere} and {@link filterWhere}.
   *
   * Similar to {@link WhereInterface}'s `orWhereRef` method.
   */
  orFilterWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrFilter(
        this.#props.aggregateFunctionNode,
        parseReferentialFilter(lhs, op, rhs)
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

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
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
