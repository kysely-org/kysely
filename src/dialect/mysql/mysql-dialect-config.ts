import type { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the MySQL dialect.
 *
 * https://github.com/sidorares/node-mysql2#using-connection-pools
 */
export interface MysqlDialectConfig {
  /**
   * A mysql2 Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * Once the driver has initialized, {@link Kysely.destroy} calls
   * `pool.end(callback)`, whether the pool is supplied directly or returned by a
   * function. If initialization hasn't started, `db.destroy()` does nothing,
   * even if the supplied pool has been used outside Kysely.
   *
   * If Kysely is not the sole consumer of the pool, or the pool's lifecycle is
   * managed elsewhere, skip `db.destroy()`. Let the application call
   * `pool.end(callback)` once all consumers, including Kysely, have finished. No
   * separate cleanup of the `Kysely` instance is needed.
   *
   * https://github.com/sidorares/node-mysql2#using-connection-pools
   */
  pool: MysqlPool | (() => Promise<MysqlPool>)

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>

  /**
   * Called every time a connection is acquired from the connection pool.
   */
  onReserveConnection?: (connection: DatabaseConnection) => Promise<void>
}

/**
 * This interface is the subset of mysql2 driver's `Pool` class that
 * kysely needs.
 *
 * We don't use the type from `mysql2` here to not have a dependency to it.
 *
 * https://github.com/sidorares/node-mysql2#using-connection-pools
 */
export interface MysqlPool {
  getConnection(
    callback: (error: unknown, connection: MysqlPoolConnection) => void,
  ): void
  end(callback: (error: unknown) => void): void
}

export interface MysqlPoolConnection {
  query(
    sql: string,
    parameters: Array<unknown>,
  ): { stream: <T>(options: MysqlStreamOptions) => MysqlStream<T> }
  query(
    sql: string,
    parameters: Array<unknown>,
    callback: (error: unknown, result: MysqlQueryResult) => void,
  ): void
  release(): void
}

export interface MysqlStreamOptions {
  highWaterMark?: number
  objectMode?: true
}

export interface MysqlStream<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>
}

export interface MysqlOkPacket {
  affectedRows: number
  changedRows: number
  insertId: number
}

export type MysqlQueryResult = MysqlOkPacket | Record<string, unknown>[]
