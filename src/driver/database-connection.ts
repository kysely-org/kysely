import { CompiledQuery } from '../query-compiler/compiled-query'

/**
 * A database connection.
 */
export interface DatabaseConnection {
  /**
   * Executes a query.
   */
  executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>>
}

export interface QueryResult<O> {
  /**
   * This is defined for update and delete queries and contains
   * the number of rows the query updated/deleted.
   */
  readonly numUpdatedOrDeletedRows?: number

  /**
   * This is defined for insert queries on dialects that return
   * the auto incrementing primary key from an insert.
   */
  readonly insertedPrimaryKey?: number

  /**
   * This is defined if the query returned any rows.
   */
  readonly rows?: O[]
}
