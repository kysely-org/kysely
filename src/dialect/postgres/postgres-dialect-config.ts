import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the PostgreSQL dialect.
 */
export interface PostgresDialectConfig {
  /**
   * A postgres Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://node-postgres.com/api/pool
   */
  pool: PostgresPool | (() => Promise<PostgresPool>)

  /**
   * https://github.com/brianc/node-postgres/tree/master/packages/pg-cursor
   * ```ts
   * import Cursor from 'pg-cursor'
   * // or
   * import * as Cursor from 'pg-cursor'
   *
   * new PostgresDialect({
   *  cursor: Cursor
   * })
   * ```
   */
  cursor?: PostgresCursorConstructor

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}

/**
 * This interface is the subset of pg driver's `Pool` class that
 * kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/api/pool
 */
export interface PostgresPool {
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
}

export interface PostgresPoolClient {
  query<R>(
    sql: string,
    parameters: ReadonlyArray<unknown>
  ): Promise<PostgresQueryResult<R>>
  query<R>(cursor: PostgresCursor<R>): PostgresCursor<R>
  release(): void
}

export type PostgresCursor<T> =
  | {
      state: 'initialized' | 'idle' | 'submitted' | 'busy'
      read: (rowsCount: number) => Promise<T[]>
    }
  | {
      state: 'done'
    }
  | {
      state: 'error'
      _error: Error
    }

export type PostgresCursorConstructor = new <T>(
  sql: string,
  parameters: readonly unknown[]
) => PostgresCursor<T>

export interface PostgresQueryResult<R> {
  command: 'UPDATE' | 'DELETE' | 'INSERT' | 'SELECT'
  rowCount: number
  rows: R[]
}

export interface PostgresStream<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>
}
