import { ArrayItemType } from '../query-builder/type-utils.js'
import { DatabaseConnection } from './database-connection.js'

/**
 * A Driver is responsible for abstracting away the database engine details.
 *
 * The Driver creates and releases database connections and is also responsible
 * for connection pooling.
 */
export interface Driver {
  /**
   * Initializes the driver.
   *
   * After calling this method the driver should be usable and `acquireConnection` etc.
   * methods should be callable.
   *
   * IMPORTANT: The underlying database engine driver (like [pg](https://node-postgres.com/))
   * should be imported inside this function, not at the top of the driver file! This is
   * important so that Kysely is usable without installing all database driver libraries
   * it supports.
   */
  init(): Promise<void>

  /**
   * Acquires a new connection from the pool.
   */
  acquireConnection(): Promise<DatabaseConnection>

  /**
   * Begins a transaction.
   */
  beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void>

  /**
   * Commits a transaction.
   */
  commitTransaction(connection: DatabaseConnection): Promise<void>

  /**
   * Rolls back a transaction.
   */
  rollbackTransaction(connection: DatabaseConnection): Promise<void>

  /**
   * Releases a connection back to the pool.
   */
  releaseConnection(connection: DatabaseConnection): Promise<void>

  /**
   * Destroys the driver and releases all resources.
   */
  destroy(): Promise<void>
}

export interface TransactionSettings {
  isolationLevel?: IsolationLevel
}

export const TRANSACTION_ISOLATION_LEVELS = [
  'read uncommitted',
  'read committed',
  'repeatable read',
  'serializable',
] as const

export type IsolationLevel = ArrayItemType<typeof TRANSACTION_ISOLATION_LEVELS>
