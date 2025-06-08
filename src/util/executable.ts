import { QueryNode } from '../operation-node/query-node'
import { NoResultErrorConstructor } from '../query-builder/no-result-error'

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

export interface ExecuteOptions {
  /**
   * An optional signal that can be used to abort the execution of the query.
   *
   * This is useful for cancelling long-running queries, for example when
   * the user navigates away from the page or closes the browser tab.
   *
   * Writes (insert, update, delete) are not cancellable in most database engines,
   * so this signal is mostly useful for read queries.
   */
  abortSignal?: AbortSignal
}
