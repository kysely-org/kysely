import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the PostgreSQL dialect.
 */
export interface PostgresDialectConfig {
  /**
   * A postgres `Client` constructor, to be used for connecting to the database
   * outside of the `pool` to avoid waiting for an idle connection.
   *
   * This is useful for cancelling queries on the database side.
   *
   * Defaults to the pool's undocumented `Client` member, if it exists.
   */
  controlClient?: PostgresClientConstructor

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

  /**
   * A postgres `Pool` instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://node-postgres.com/apis/pool
   */
  pool: PostgresPool | (() => Promise<PostgresPool>)
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
  // internal
  Client?: PostgresClientConstructor
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
  // we don't care about the type of options here, for now.
  options: object
}

/**
 * This interface is the subset of pg driver's `Client` class that
 * kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/client
 */
export interface PostgresClient {
  connect(): Promise<void>
  end(): void
  // internal
  processID?: number
  query<R>(
    sql: string,
    parameters: ReadonlyArray<unknown>,
  ): Promise<PostgresQueryResult<R>>
  query<R>(cursor: PostgresCursor<R>): PostgresCursor<R>
}

export type PostgresClientConstructor = new (options: any) => PostgresClient

/**
 * This interface is the subset of pg driver's `Client` class that
 * is returned by the `Pool` class, and that kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/pool#releasing-clients
 */
export interface PostgresPoolClient extends Omit<PostgresClient, 'end'> {
  release(): void
}

/**
 * This interface is pg driver's `Cursor` class that kysely needs.
 *
 * We don't use the type from `pg-cursor` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/cursor
 */
export interface PostgresCursor<T> {
  read(rowsCount: number): Promise<T[]>
  close(): Promise<void>
}

/**
 * This interface is pg driver's `Cursor` class constructor that kysely needs.
 *
 * We don't use the type from `pg-cursor` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/cursor#constructor
 */
export type PostgresCursorConstructor = new <T>(
  sql: string,
  parameters: unknown[],
) => PostgresCursor<T>

/**
 * This interface is the subset of pg driver's `Result` shape that kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/result
 */
export interface PostgresQueryResult<R> {
  command: 'UPDATE' | 'DELETE' | 'INSERT' | 'SELECT' | 'MERGE'
  rowCount: number
  rows: R[]
}

export interface PostgresStream<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>
}
