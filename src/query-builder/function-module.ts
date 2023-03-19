import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import {
  CoalesceReferenceExpressionList,
  parseCoalesce,
} from '../parser/coalesce-parser.js'
import {
  ExtractTypeFromReferenceExpression,
  SimpleReferenceExpression,
  parseSimpleReferenceExpression,
  ReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { parseSelectAll } from '../parser/select-parser.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { createQueryId } from '../util/query-id.js'
import { Equals, IsNever } from '../util/type-utils.js'
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
    this.coalesce = this.coalesce.bind(this)
    this.count = this.count.bind(this)
    this.countAll = this.countAll.bind(this)
    this.max = this.max.bind(this)
    this.min = this.min.bind(this)
    this.sum = this.sum.bind(this)
  }

  /**
   * Calls the `avg` function for the column given as the argument.
   *
   * This sql function calculates the average value for a given column.
   *
   * For additional functionality such as distinct, filtering and window functions,
   * refer to {@link AggregateFunctionBuilder}. An instance of this builder is
   * returned when calling this function.
   *
   * ### Examples
   *
   * ```ts
   * const { avg } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(avg('price').as('avg_price'))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select avg("price") as "avg_price" from "toy"
   * ```
   *
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.avg('price').as('avg_price'))
   *   .execute()
   * ```
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression will be `number | string` by default. This is because Kysely can't know the
   * type the db driver outputs. Sometimes the output can be larger than the largest
   * javascript number and a string is returned instead. Most drivers allow you
   * to configure the output type of large numbers and Kysely can't know if you've
   * done so.
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
   * Sometimes a null is returned, e.g. when row count is 0, and no `group by`
   * was used. It is highly recommended to include null in the output type union
   * and handle null values in post-execute code, or wrap the function with a {@link coalesce}
   * function.
   *
   * ```ts
   * const { avg } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(avg<number | null>('price').as('avg_price'))
   *   .execute()
   * ```
   */
  avg<
    O extends number | string | null = number | string,
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
   * Calls the `coalesce` function for given arguments.
   *
   * This sql function returns the first non-null value from left to right, commonly
   * used to provide a default scalar for nullable columns or functions.
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression is inferred in the same manner that the sql function computes.
   * A union of arguments' types - if a non-nullable argument exists, it stops
   * there (ignoring any further arguments' types) and exludes null from the final
   * union type.
   *
   * `(string | null, number | null)` is inferred as `string | number | null`.
   *
   * `(string | null, number, Date | null)` is inferred as `string | number`.
   *
   * `(number, string | null)` is inferred as `number`.
   *
   * ### Examples
   *
   * ```ts
   * const { coalesce } = db.fn
   *
   * db.selectFrom('participant')
   *   .select(coalesce('nickname', sql<string>`'<anonymous>'`).as('nickname'))
   *   .where('room_id', '=', roomId)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select coalesce("nickname", '<anonymous>') as "nickname"
   * from "participant" where "room_id" = $1
   * ```
   *
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('participant')
   *   .select(qb =>
   *     qb.fn.coalesce('nickname', sql<string>`'<anonymous>'`).as('nickname')
   *   )
   *   .where('room_id', '=', roomId)
   *   .execute()
   * ```
   *
   * You can combine this function with other helpers in this module:
   *
   * ```ts
   * const { avg, coalesce } = db.fn
   *
   * db.selectFrom('person')
   *   .select(coalesce(avg<number | null>('age'), sql<number>`0`).as('avg_age'))
   *   .where('first_name', '=', 'Jennifer')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select coalesce(avg("age"), 0) as "avg_age" from "person" where "first_name" = $1
   * ```
   */
  coalesce<
    V extends ReferenceExpression<DB, TB>,
    OV extends ReferenceExpression<DB, TB>[]
  >(
    value: V,
    ...otherValues: OV
  ): RawBuilder<CoalesceReferenceExpressionList<DB, TB, [V, ...OV]>> {
    return new RawBuilder({
      queryId: createQueryId(),
      rawNode: parseCoalesce([value, ...otherValues]),
    })
  }

  /**
   * Calls the `count` function for the column given as the argument.
   *
   * When called with a column as argument, this sql function counts the number of rows where there
   * is a non-null value in that column.
   *
   * For counting all rows nulls included (`count(*)`), see {@link countAll}.
   *
   * For additional functionality such as distinct, filtering and window functions,
   * refer to {@link AggregateFunctionBuilder}. An instance of this builder is
   * returned when calling this function.
   *
   * ### Examples
   *
   * ```ts
   * const { count } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(count('id').as('num_toys'))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count("id") as "num_toys" from "toy"
   * ```
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression will be `number | string | bigint` by default. This is because
   * Kysely can't know the type the db driver outputs. Sometimes the output can
   * be larger than the largest javascript number and a string is returned instead.
   * Most drivers allow you to configure the output type of large numbers and Kysely
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
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.count('id').as('num_toys'))
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
   * Calls the `count` function with `*` or `table.*` as argument.
   *
   * When called with `*` as argument, this sql function counts the number of rows,
   * nulls included.
   *
   * For counting rows with non-null values in a given column (`count(column)`),
   * see {@link count}.
   *
   * For additional functionality such as filtering and window functions, refer
   * to {@link AggregateFunctionBuilder}. An instance of this builder is returned
   * when calling this function.
   *
   * ### Examples
   *
   * ```ts
   * const { countAll } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(countAll().as('num_toys'))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count(*) as "num_toys" from "toy"
   * ```
   *
   * If this is used in a `select` statement, the type of the selected expression
   * will be `number | string | bigint` by default. This is because Kysely
   * can't know the type the db driver outputs. Sometimes the output can be larger
   * than the largest javascript number and a string is returned instead. Most
   * drivers allow you to configure the output type of large numbers and Kysely
   * can't know if you've done so.
   *
   * You can specify the output type of the expression by providing
   * the type as the first type argument:
   *
   * ```ts
   * const { countAll } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(countAll<number>().as('num_toys'))
   *   .execute()
   * ```
   *
   * Some databases, such as PostgreSQL, support scoping the function to a specific
   * table:
   *
   * ```ts
   * const { countAll } = db.fn
   *
   * db.selectFrom('toy')
   *   .innerJoin('pet', 'pet.id', 'toy.pet_id')
   *   .select(countAll('toy').as('num_toys'))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select count("toy".*) as "num_toys"
   * from "toy" inner join "pet" on "pet"."id" = "toy"."pet_id"
   * ```
   *
   * You can limit table range to only tables participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .innerJoin('pet', 'pet.id', 'toy.pet_id')
   *   .select(qb => qb.fn.countAll('toy').as('num_toys'))
   *   .execute()
   * ```
   */
  countAll<O extends number | string | bigint, T extends TB = TB>(
    table: T
  ): AggregateFunctionBuilder<DB, TB, O>

  countAll<O extends number | string | bigint>(): AggregateFunctionBuilder<
    DB,
    TB,
    O
  >

  countAll(table?: any): any {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(
        'count',
        parseSelectAll(table)[0].selection as any
      ),
    })
  }

  /**
   * Calls the `max` function for the column given as the argument.
   *
   * This sql function calculates the maximum value for a given column.
   *
   * For additional functionality such as distinct, filtering and window functions,
   * refer to {@link AggregateFunctionBuilder}. An instance of this builder is
   * returned when calling this function.
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression will be the referenced column's type. This is because the result
   * is within the column's value range.
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
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select max("price") as "max_price" from "toy"
   * ```
   *
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.max('price').as('max_price'))
   *   .execute()
   * ```
   *
   * Sometimes a null is returned, e.g. when row count is 0, and no `group by`
   * was used. It is highly recommended to include null in the output type union
   * and handle null values in post-execute code, or wrap the function with a {@link coalesce}
   * function.
   *
   * ```ts
   * const { max } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(max<number | null, 'price'>('price').as('max_price'))
   *   .execute()
   * ```
   */
  max<
    O extends number | string | bigint | null = never,
    C extends StringReference<DB, TB> = StringReference<DB, TB>
  >(
    column: OutputBoundStringReference<DB, TB, C, O>
  ): StringReferenceBoundAggregateFunctionBuilder<DB, TB, C, O>

  max<O extends number | string | bigint | null = number | string | bigint>(
    column: DynamicReferenceBuilder
  ): AggregateFunctionBuilder<DB, TB, O>

  max<
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(column: C): any {
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
   * This sql function calculates the minimum value for a given column.
   *
   * For additional functionality such as distinct, filtering and window functions,
   * refer to {@link AggregateFunctionBuilder}. An instance of this builder is
   * returned when calling this function.
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression will be the referenced column's type. This is because the result
   * is within the column's value range.
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
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select min("price") as "min_price" from "toy"
   * ```
   *
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.min('price').as('min_price'))
   *   .execute()
   * ```
   *
   * Sometimes a null is returned, e.g. when row count is 0, and no `group by`
   * was used. It is highly recommended to include null in the output type union
   * and handle null values in post-execute code, or wrap the function with a {@link coalesce}
   * function.
   *
   * ```ts
   * const { min } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(min<number | null, 'price'>('price').as('min_price'))
   *   .execute()
   * ```
   */
  min<
    O extends number | string | bigint | null = never,
    C extends StringReference<DB, TB> = StringReference<DB, TB>
  >(
    column: OutputBoundStringReference<DB, TB, C, O>
  ): StringReferenceBoundAggregateFunctionBuilder<DB, TB, C, O>

  min<O extends number | string | bigint | null = number | string | bigint>(
    column: DynamicReferenceBuilder
  ): AggregateFunctionBuilder<DB, TB, O>

  min<
    C extends SimpleReferenceExpression<DB, TB> = SimpleReferenceExpression<
      DB,
      TB
    >
  >(column: C): any {
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
   * This sql function sums the values of a given column.
   *
   * For additional functionality such as distinct, filtering and window functions,
   * refer to {@link AggregateFunctionBuilder}. An instance of this builder is
   * returned when calling this function.
   *
   * ### Examples
   *
   * ```ts
   * const { sum } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(sum('price').as('total_price'))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select sum("price") as "total_price" from "toy"
   * ```
   *
   * You can limit column range to only columns participating in current query:
   *
   * ```ts
   * db.selectFrom('toy')
   *   .select(qb => qb.fn.sum('price').as('total_price'))
   *   .execute()
   * ```
   *
   * If this function is used in a `select` statement, the type of the selected
   * expression will be `number | string` by default. This is because Kysely can't know the
   * type the db driver outputs. Sometimes the output can be larger than the largest
   * javascript number and a string is returned instead. Most drivers allow you
   * to configure the output type of large numbers and Kysely can't know if you've
   * done so.
   *
   * You can specify the output type of the expression by providing the type as
   * the first type argument:
   *
   * ```ts
   * const { sum } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(sum<number>('price').as('total_price'))
   *   .execute()
   * ```
   *
   * Sometimes a null is returned, e.g. when row count is 0, and no `group by`
   * was used. It is highly recommended to include null in the output type union
   * and handle null values in post-execute code, or wrap the function with a {@link coalesce}
   * function.
   *
   * ```ts
   * const { sum } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(sum<number | null>('price').as('total_price'))
   *   .execute()
   * ```
   */
  sum<
    O extends number | string | bigint | null = number | string | bigint,
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

type OutputBoundStringReference<
  DB,
  TB extends keyof DB,
  C extends StringReference<DB, TB>,
  O
> = IsNever<O> extends true
  ? C // output not provided, unbound
  : Equals<
      ExtractTypeFromReferenceExpression<DB, TB, C> | null,
      O | null
    > extends true
  ? C
  : never

type StringReferenceBoundAggregateFunctionBuilder<
  DB,
  TB extends keyof DB,
  C extends StringReference<DB, TB>,
  O
> = AggregateFunctionBuilder<
  DB,
  TB,
  | ExtractTypeFromReferenceExpression<DB, TB, C>
  | (null extends O ? null : never) // output is nullable, but column type might not be nullable.
>
