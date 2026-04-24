import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { AbortableOperationOptions } from '../util/abort.js'

/**
 * A single connection to the database engine.
 *
 * These are created by an instance of {@link Driver}.
 */
export interface DatabaseConnection {
  /**
   * Used by executors to cancel the inflight query on the database side.
   */
  cancelQuery?(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void>

  /**
   * Used by executors to prepare the connection for operations on the database side.
   */
  collectSessionInfo?(): Promise<void>

  executeQuery<R>(
    compiledQuery: CompiledQuery,
    options?: AbortableOperationOptions,
  ): Promise<QueryResult<R>>

  /**
   * Used by executors to kill the session on the database side.
   */
  killSession?(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void>

  streamQuery<R>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
    options?: AbortableOperationOptions,
  ): AsyncIterableIterator<QueryResult<R>>
}

export type ControlConnectionProvider = (
  consumer: (connection: DatabaseConnection) => Promise<void>,
) => Promise<void>

export interface QueryResult<O> {
  /**
   * This is defined for insert, update, delete and merge queries and contains
   * the number of rows the query inserted/updated/deleted.
   */
  readonly numAffectedRows?: bigint

  /**
   * This is defined for update queries and contains the number of rows
   * the query changed.
   *
   * This is **optional** and only provided in dialects such as MySQL.
   * You would probably use {@link numAffectedRows} in most cases.
   */
  readonly numChangedRows?: bigint

  /**
   * This is defined for insert queries on dialects that return
   * the auto incrementing primary key from an insert.
   */
  readonly insertId?: bigint

  /**
   * The rows returned by the query. This is always defined and is
   * empty if the query returned no rows.
   */
  readonly rows: O[]
}
