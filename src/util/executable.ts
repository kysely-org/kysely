import { QueryNode } from '../operation-node/query-node.js'
import { NoResultErrorConstructor } from '../query-builder/no-result-error.js'
import { ExecuteQueryOptions } from '../query-executor/query-executor.js'

export interface Executable<O> {
  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  execute(options?: ExecuteOptions): Promise<O[]>

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  executeTakeFirst(options?: ExecuteOptions): Promise<O | undefined>

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
  ): Promise<O>

  executeTakeFirstOrThrow(
    options?: ExecuteOptions & {
      errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)
    },
  ): Promise<O>
}

export interface ExecuteOptions extends ExecuteQueryOptions {}
