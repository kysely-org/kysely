import type { QueryNode } from '../operation-node/query-node.js'
import type { NoResultErrorConstructor } from '../query-builder/no-result-error.js'
import type { AbortableQueryOptions } from './abort.js'
import type { SimplifyResult, SimplifySingleResult } from './type-utils.js'

export interface Executable<O> {
  /**
   * Executes the query and returns an array of rows.
   *
   * Insert, update, delete and merge queries without `returning` or `output`
   * return an array containing a single result object instead. The object
   * contains the affected row count, even when no rows are affected.
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
