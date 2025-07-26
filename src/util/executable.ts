import { QueryNode } from '../operation-node/query-node.js'
import { NoResultErrorConstructor } from '../query-builder/no-result-error.js'
import { ExecuteQueryOptions } from '../query-executor/query-executor.js'
import { SimplifyResult, SimplifySingleResult } from './type-utils.js'

export interface Executable<O> {
  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  execute(options?: ExecuteOptions): Promise<SimplifyResult<O>[]>

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  executeTakeFirst(options?: ExecuteOptions): Promise<SimplifySingleResult<O>>

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class, or callback to throw a different
   * error.
   */
  executeTakeFirstOrThrow(
    options?: ExecuteOrThrowOptions | ExecuteOrThrowOptions['errorConstructor'],
  ): Promise<SimplifyResult<O>>
}

export type ExecuteOptions = ExecuteQueryOptions

export interface ExecuteOrThrowOptions extends ExecuteQueryOptions {
  /**
   * An optional error constructor that is used to create an error
   * when the query returns no results.
   *
   * By default, an instance of {@link NoResultError} is thrown.
   */
  errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)
}
