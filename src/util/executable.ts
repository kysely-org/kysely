import type { QueryNode } from '../operation-node/query-node.js'
import type { NoResultErrorConstructor } from '../query-builder/no-result-error.js'
import type { AbortableQueryOptions } from './abort.js'
import type { SimplifyResult, SimplifySingleResult } from './type-utils.js'

export interface Executable<O> {
  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  execute(options?: AbortableQueryOptions): Promise<SimplifyResult<O>[]>

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  executeTakeFirst(
    options?: AbortableQueryOptions,
  ): Promise<SimplifySingleResult<O>>

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class, or callback to throw a different
   * error.
   *
   * ### Examples
   *
   * Provide a timeout and a custom error for an empty result:
   *
   * ```ts
   * const person = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '=', 123)
   *   .executeTakeFirstOrThrow({
   *     signal: AbortSignal.timeout(1000),
   *     errorConstructor: () => new Error('Person not found'),
   *   })
   * ```
   */
  executeTakeFirstOrThrow(
    options?:
      | ExecuteTakeFirstOrThrowOptions
      | ExecuteTakeFirstOrThrowOptions['errorConstructor'],
  ): Promise<SimplifyResult<O>>
}

export interface ExecuteTakeFirstOrThrowOptions extends AbortableQueryOptions {
  /**
   * An optional error constructor that is used to create an error
   * when the query returns no results.
   *
   * By default, an instance of {@link NoResultError} is thrown.
   */
  errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)
}
