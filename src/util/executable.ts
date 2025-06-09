import { QueryNode } from '../operation-node/query-node.js'
import { NoResultErrorConstructor } from '../query-builder/no-result-error.js'
import { ExecuteQueryOptions } from '../query-executor/query-executor.js'
import { Simplify, SimplifySingleResult } from './type-utils.js'

export interface Executable<O> {
  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  execute(options?: ExecuteOptions): Promise<SimplifySingleResult<O>[]>

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  executeTakeFirst(
    options?: ExecuteOptions,
  ): Promise<SimplifySingleResult<O> | undefined>

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class, or callback to throw a different
   * error.
   */
  executeTakeFirstOrThrow(
    errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error),
  ): Promise<SimplifySingleResult<O>>

  executeTakeFirstOrThrow(
    options?: ExecuteOptions & {
      errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)
    },
  ): Promise<SimplifySingleResult<O>>
}

export interface ExecuteOptions extends ExecuteQueryOptions {}
