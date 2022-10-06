import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import {
  ExtractTypeFromReferenceExpression,
  SimpleReferenceExpression,
  parseSimpleReferenceExpression,
} from '../parser/reference-parser.js'
import { AggregateFunctionBuilder } from './aggregate-function-builder.js'

/**
 * Helpers for type safe SQL function calls.
 *
 * You can always use the {@link sql} tag to call functions and build arbitrary
 * expressions. This module simply has shortcuts for most common function calls.
 *
 * ### Examples
 *
 * ```ts
 * const { count } = db.fn
 *
 * await db.selectFrom('person')
 *   .innerJoin('pet', 'pet.owner_id', 'person.id')
 *   .select([
 *     'person.id',
 *     count('pet.id').as('pet_count')
 *   ])
 *   .groupBy('person.id')
 *   .having(count('pet.id'), '>', 10)
 *   .execute()
 * ```
 *
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "person"."id", count("pet"."id") as "pet_count"
 * from "person"
 * inner join "pet" on "pet"."owner_id" = "person"."id"
 * group by "person"."id"
 * having count("pet"."id") > $1
 * ```
 */
export class FunctionModule<DB, TB extends keyof DB> {
  constructor() {
    this.avg = this.avg.bind(this)
    this.count = this.count.bind(this)
    this.max = this.max.bind(this)
    this.min = this.min.bind(this)
    this.sum = this.sum.bind(this)
  }

  /**
   * Calls the `avg` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string | null` by default. This is because Kysely can't know
   * the type the db driver outputs. Sometimes the output can be larger than the
   * largest javascript number and a string is returned instead. Most drivers allow
   * you to configure the output type of large numbers and Kysely can't know if
   * you've done so. Sometimes a null is returned, e.g. when row count is 0, and
   * no `group by` was used.
   *
   * You can specify the output type of the expression by providing the type as
   * the first type argument:
   *
   * ```ts
   * const { avg } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(avg<number>('price').as('avg_price'))
   *   .execute()
   * ```
   *
   * It is highly recommended to include null in the output type union and handle
   * null values in post-execute code, or wrap the function with a coalesce function.
   */
  avg<
    O extends number | string | null,
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(column: C): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'avg',
        parseSimpleReferenceExpression(column)
      ),
    })
  }

  /**
   * Calls the `count` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string | bigint | null` by default. This is because Kysely
   * can't know the type the db driver outputs. Sometimes the output can be larger
   * than the largest javascript number and a string is returned instead. Most
   * drivers allow you to configure the output type of large numbers and Kysely
   * can't know if you've done so.
   *
   * You can specify the output type of the expression by providing
   * the type as the first type argument:
   *
   * ```ts
   * const { count } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(count<number>('id').as('num_toys'))
   *   .execute()
   * ```
   *
   * You can limit column range:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.count<number>('id').as('num_toys'))
   *   .execute()
   * ```
   */
  count<
    O extends number | string | bigint,
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(column: C): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'count',
        parseSimpleReferenceExpression(column)
      ),
    })
  }

  /**
   * Calls the `max` function for the column given as the argument.
   *
   * ### Examples
   *
   * ```ts
   * const { max } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(max('price').as('max_price'))
   *   .execute()
   * ```
   */
  max<
    O extends number | string | bigint | null,
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(
    column: C
  ): AggregateFunctionBuilder<
    DB,
    TB,
    ExtractTypeFromReferenceExpression<DB, TB, C, O> | null extends O
      ? null
      : never
  > {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'max',
        parseSimpleReferenceExpression(column)
      ),
    })
  }

  /**
   * Calls the `min` function for the column given as the argument.
   *
   * ### Examples
   *
   * ```ts
   * const { min } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(min('price').as('min_price'))
   *   .execute()
   * ```
   *
   */
  min<
    O extends number | string | bigint | null,
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(
    column: C
  ): AggregateFunctionBuilder<
    DB,
    TB,
    ExtractTypeFromReferenceExpression<DB, TB, C, O> | null extends O
      ? null
      : never
  > {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'min',
        parseSimpleReferenceExpression(column)
      ),
    })
  }

  /**
   * Calls the `sum` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string | bigint | null` by default. This is because Kysely
   * can't know the type the db driver outputs. Sometimes the output can be larger
   * than the largest javascript number and a string is returned instead. Most
   * drivers allow you to configure the output type of large numbers and Kysely
   * can't know if you've done so. Sometimes a null is returned, e.g. when row
   * count is 0, and no `group by` was used.
   *
   * You can specify the output type of the expression by providing
   * the type as the first type argument:
   *
   * ```ts
   * const { sum } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(sum<number>('price').as('total_price'))
   *   .execute()
   * ```
   *
   * It is highly recommended to include null in the output type union and handle
   * null values in post-execute code, or wrap the function with a coalesce function.
   */
  sum<
    O extends number | string | bigint | null,
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(column: C): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'sum',
        parseSimpleReferenceExpression(column)
      ),
    })
  }
}
