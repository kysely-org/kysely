import { RawNode } from '../operation-node/raw-node.js'
import {
  StringReference,
  ExtractTypeFromReferenceExpression,
  parseStringReference,
} from '../parser/reference-parser.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { createQueryId } from '../util/query-id.js'

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
export class FunctionBuilder<DB, TB extends keyof DB> {
  constructor() {
    this.min = this.min.bind(this)
    this.max = this.max.bind(this)
    this.avg = this.avg.bind(this)
    this.sum = this.sum.bind(this)
    this.count = this.count.bind(this)
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
  max<C extends StringReference<DB, TB>>(
    column: C
  ): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, C>> {
    return this.#oneArgFunction('max', column)
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
  min<C extends StringReference<DB, TB>>(
    column: C
  ): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, C>> {
    return this.#oneArgFunction('min', column)
  }

  /**
   * Calls the `avg` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string` by default. This is because Kysely can't know the
   * type the db driver outputs. Sometimes the output can be larger than the
   * largest javascript number and a string is returned instead. Most drivers
   * allow you to configure the output type of large numbers and Kysely can't
   * know if you've done so.
   *
   * You can specify the output type of the expression by providing
   * the type as the first type argument:
   *
   * ```ts
   * const { avg } = db.fn
   *
   * db.selectFrom('toy')
   *   .select(avg<number>('price').as('avg_price'))
   *   .execute()
   * ```
   */
  avg<O extends number | string, C extends StringReference<DB, TB> = any>(
    column: C
  ): RawBuilder<O> {
    return this.#oneArgFunction('avg', column)
  }

  /**
   * Calls the `sum` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string | bigint` by default. This is because Kysely can't
   * know the type the db driver outputs. Sometimes the output can be larger than
   * the largest javascript number and a string is returned instead. Most drivers
   * allow you to configure the output type of large numbers and Kysely can't
   * know if you've done so.
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
   */
  sum<
    O extends number | string | bigint,
    C extends StringReference<DB, TB> = any
  >(column: C): RawBuilder<O> {
    return this.#oneArgFunction('sum', column)
  }

  /**
   * Calls the `count` function for the column given as the argument.
   *
   * If this is used in a `select` statement the type of the selected expression
   * will be `number | string |bigint` by default. This is because Kysely can't
   * know the type the db driver outputs. Sometimes the output can be larger than
   * the largest javascript number and a string is returned instead. Most drivers
   * allow you to configure the output type of large numbers and Kysely can't
   * know if you've done so.
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
   */
  count<
    O extends number | string | bigint,
    C extends StringReference<DB, TB> = any
  >(column: C): RawBuilder<O> {
    return this.#oneArgFunction('count', column)
  }

  #oneArgFunction<O>(
    fn: string,
    column: StringReference<DB, TB>
  ): RawBuilder<O> {
    return new RawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.create([`${fn}(`, ')'], [parseStringReference(column)]),
    })
  }
}
