import { CompiledQuery } from '../query-compiler/compiled-query.js'

/**
 * A single connection to the database engine.
 *
 * These are created by an instance of {@link Driver}.
 */
export interface DatabaseConnection {
  executeQuery<R>(
    compiledQuery: CompiledQuery<QueryResult<R>>
  ): Promise<QueryResult<R>>
  streamQuery<R>(
    compiledQuery: CompiledQuery<QueryResult<R>>,
    chunkSize?: number
  ): AsyncIterableIterator<QueryResult<R>>
}

export interface QueryResult<O> {
  /**
   * This is defined for update and delete queries and contains
   * the number of rows the query updated/deleted.
   */
  readonly numUpdatedOrDeletedRows?: bigint

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
