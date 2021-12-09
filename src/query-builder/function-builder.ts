import {
  StringReference,
  ExtractTypeFromReferenceExpression,
} from '../parser/reference-parser.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { freeze } from '../util/object-utils.js'
import { createQueryId } from '../util/query-id.js'

/**
 * Helpers for type safe SQL function calls.
 *
 * @example
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
  readonly #props: FunctionBuilderProps

  constructor(props: FunctionBuilderProps) {
    this.#props = freeze(props)

    this.min = this.min.bind(this)
    this.max = this.max.bind(this)
    this.avg = this.avg.bind(this)
    this.sum = this.sum.bind(this)
    this.count = this.count.bind(this)
  }

  /**
   * Calls the `max` function for the column given as the argument.
   */
  min<C extends StringReference<DB, TB>>(
    column: C
  ): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, C>> {
    return this.#oneArgFunction('min', column)
  }

  /**
   * Calls the `min` function for the column given as the argument.
   */
  max<C extends StringReference<DB, TB>>(
    column: C
  ): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, C>> {
    return this.#oneArgFunction('max', column)
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
   *   .select(avg<number>('price'))
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
   *   .select(sum<number>('price'))
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
   *   .select(count<number>('price'))
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
      executor: this.#props.executor,
      sql: `${fn}(??)`,
      parameters: [column],
    })
  }
}

export interface FunctionBuilderProps {
  readonly executor: QueryExecutor
}
