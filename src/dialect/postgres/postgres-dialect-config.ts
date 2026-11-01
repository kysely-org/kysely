import type { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the PostgreSQL dialect.
 */
export interface PostgresDialectConfig {
  /**
   * A postgres Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * Once the driver has initialized, {@link Kysely.destroy} calls `pool.end()`,
   * whether the pool is supplied directly or returned by a function. If
   * initialization hasn't started, `db.destroy()` does nothing, even if the
   * supplied pool has been used outside Kysely.
   *
   * If Kysely is not the sole consumer of the pool, or the pool's lifecycle is
   * managed elsewhere, skip `db.destroy()`. Let the application call `pool.end()`
   * once all consumers, including Kysely, have finished. No separate cleanup of
   * the `Kysely` instance is needed.
   *
   * https://node-postgres.com/apis/pool
   */
  pool: PostgresPool | (() => Promise<PostgresPool>)

  /**
   * https://github.com/brianc/node-postgres/tree/master/packages/pg-cursor
   *
   * ```ts
   * import { PostgresDialect } from 'kysely'
   * import { Pool } from 'pg'
   * import Cursor from 'pg-cursor'
   * // or import * as Cursor from 'pg-cursor'
   *
   * new PostgresDialect({
   *  cursor: Cursor,
   *  pool: new Pool('postgres://localhost:5432/mydb')
   * })
   * ```
   */
  cursor?: PostgresCursorConstructor

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>

  /**
   * Called every time a connection is acquired from the pool.
   */
  onReserveConnection?: (connection: DatabaseConnection) => Promise<void>
}

/**
 * This interface is the subset of pg driver's `Pool` class that
 * kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/pool
 */
export interface PostgresPool {
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
}

export interface PostgresPoolClient {
  query<R>(
    sql: string,
    parameters: ReadonlyArray<unknown>,
  ): Promise<PostgresQueryResult<R>>
  query<R>(cursor: PostgresCursor<R>): PostgresCursor<R>
  release(destroy?: boolean): void
}

export interface PostgresCursor<T> {
  read(rowsCount: number): Promise<T[]>
  close(): Promise<void>
}

export type PostgresCursorConstructor = new <T>(
  sql: string,
  parameters: unknown[],
) => PostgresCursor<T>

export interface PostgresQueryResult<R> {
  command:
    | 'UPDATE'
    | 'DELETE'
    | 'INSERT'
    | 'SELECT'
    | 'MERGE'
    | 'COMMIT'
    | 'ROLLBACK'
  rowCount: number
  rows: R[]
}

export interface PostgresStream<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>
}
