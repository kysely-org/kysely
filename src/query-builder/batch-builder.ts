import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable, isCompilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze } from '../util/object-utils.js'

export interface BatchBuilderProps {
  readonly executor: QueryExecutor
}

/**
 * A builder for executing multiple queries in a batch.
 *
 * Batching queries can reduce network round trips and improve performance
 * when executing multiple independent queries.
 *
 * ### Examples
 *
 * Execute multiple queries in a batch:
 *
 * ```ts
 * const results = await db
 *   .batch()
 *   .add(db.selectFrom('person').selectAll().where('id', '=', 1))
 *   .add(db.selectFrom('pet').selectAll().where('owner_id', '=', 1))
 *   .execute()
 *
 * // results[0] contains the person query results
 * // results[1] contains the pet query results
 * ```
 *
 * With type-safe destructuring:
 *
 * ```ts
 * const [persons, pets] = await db
 *   .batch()
 *   .add(db.selectFrom('person').selectAll())
 *   .add(db.selectFrom('pet').selectAll())
 *   .execute()
 *
 * // persons is typed as Person[]
 * // pets is typed as Pet[]
 * ```
 */
export class BatchBuilder<R extends any[] = []> {
  readonly #props: BatchBuilderProps
  readonly #queries: CompiledQuery[]

  constructor(props: BatchBuilderProps, queries: CompiledQuery[] = []) {
    this.#props = freeze(props)
    this.#queries = queries
  }

  /**
   * Adds a query to the batch.
   *
   * The query can be any compilable query builder or a pre-compiled query.
   *
   * ### Examples
   *
   * ```ts
   * const batch = db
   *   .batch()
   *   .add(db.selectFrom('person').selectAll())
   *   .add(db.updateTable('person').set({ active: true }).where('id', '=', 1))
   *   .add(db.deleteFrom('pet').where('id', '=', 123))
   * ```
   */
  add<O>(query: Compilable<O> | CompiledQuery<O>): BatchBuilder<[...R, O[]]> {
    const compiledQuery = isCompilable(query) ? query.compile() : query
    return new BatchBuilder<[...R, O[]]>(this.#props, [
      ...this.#queries,
      compiledQuery,
    ])
  }

  /**
   * Executes all queries in the batch.
   *
   * Returns an array of results in the same order as the queries were added.
   * Each result contains the rows returned by that query.
   *
   * ### Examples
   *
   * ```ts
   * const [persons, pets, toys] = await db
   *   .batch()
   *   .add(db.selectFrom('person').selectAll())
   *   .add(db.selectFrom('pet').selectAll())
   *   .add(db.selectFrom('toy').selectAll())
   *   .execute()
   * ```
   */
  async execute(): Promise<{ [K in keyof R]: R[K] }> {
    if (this.#queries.length === 0) {
      return [] as { [K in keyof R]: R[K] }
    }

    const results = await this.#props.executor.executeBatch(this.#queries)

    return results.map((result) => result.rows) as { [K in keyof R]: R[K] }
  }
}
