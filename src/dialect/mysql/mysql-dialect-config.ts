import type { DatabaseConnection } from '../../driver/database-connection.js'
import type { AbortableOperationOptions } from '../../util/abort.js'

/**
 * Config for the MySQL dialect.
 */
export interface MysqlDialectConfig {
  /**
   * A `mysql2` `Client` constructor, to be used for connecting to the database
   * outside of the `pool` to avoid waiting for an idle connection.
   *
   * This is useful for cancelling queries on the database side.
   */
  // The string overload mirrors mysql2's `createConnection`, which also accepts
  // a connection URI. Without it, mysql2's overloaded `createConnection` isn't
  // assignable to this type under TypeScript < 5.6.
  controlConnection?: {
    (connectionUri: string): MysqlConnection
    (config: object): MysqlConnection
  }

  /**
   * A mysql2 Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://github.com/sidorares/node-mysql2#using-connection-pools
   */
  pool:
    MysqlPool | ((options?: AbortableOperationOptions) => Promise<MysqlPool>)

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ) => Promise<void>

  /**
   * Called every time a connection is acquired from the pool.
   */
  onReserveConnection?: (
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ) => Promise<void>
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

export interface MysqlConnection {
  config: object
  connect(callback?: (error: unknown) => void): void
  destroy(): void
  // `parameters` is `any` and the callback is optional (a single signature
  // instead of two overloads) so that mysql2's overloaded `query` stays
  // assignable to this type under TypeScript < 5.6.
  query(
    sql: string,
    parameters: any,
    callback?: (error: unknown, result: MysqlQueryResult) => void,
  ): { stream: (options: MysqlStreamOptions) => MysqlStream }
  threadId: number
}

export type MysqlConectionConstructor = new (opts?: object) => MysqlConnection

export interface MysqlPoolConnection extends MysqlConnection {
  release(): void
}

export interface MysqlStreamOptions {
  highWaterMark?: number
  objectMode?: true
}

export interface MysqlStream {
  // The iterator type is `any` (rather than `AsyncIterableIterator<T>`) because
  // `@types/node`'s `Readable` - what mysql2's `query(...).stream()` returns -
  // isn't assignable to a stricter async iterator type under TypeScript < 5.6.
  [Symbol.asyncIterator](): any
}

export interface MysqlOkPacket {
  affectedRows: number
  changedRows: number
  insertId: number
}

export type MysqlQueryResult = MysqlOkPacket | Record<string, unknown>[]
