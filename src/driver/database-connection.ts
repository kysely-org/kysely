import { CompiledQuery } from '../query-compiler/compiled-query.js'

/**
 * A single connection to the database engine.
 *
 * These are created by an instance of {@link Driver}.
 */
export interface DatabaseConnection {
  executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>>
  streamQuery<R>(
    compiledQuery: CompiledQuery,
    chunkSize?: number
  ): AsyncIterableIterator<QueryResult<R>>
}

export interface QueryResult<O> {
  /**
   * @deprecated use {@link QueryResult.numAffectedRows} instead.
   */
  // TODO: remove.
  readonly numUpdatedOrDeletedRows?: bigint

  /**
   * This is defined for insert, update and delete queries and contains
   * the number of rows the query inserted/updated/deleted.
   */
  readonly numAffectedRows?: bigint

  /**
   * This is defined for update queries and contains the number of rows
   * the query changed.
   * This is optional and only provided by some drivers like node-mysql2.
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
