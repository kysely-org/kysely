import { ArrayItemType } from '../util/type-utils.js'
import { DatabaseConnection } from './database-connection.js'

/**
 * A Driver creates and releases {@link DatabaseConnection | database connections}
 * and is also responsible for connection pooling (if the dialect supports pooling).
 */
export interface Driver {
  /**
   * Initializes the driver.
   *
   * After calling this method the driver should be usable and `acquireConnection` etc.
   * methods should be callable.
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
  closeConnection(): Promise<void>

  /**
   * @deprecated Use `closeConnection` instead.
   */
  destroy?(): Promise<void>
}

export interface TransactionSettings {
  readonly isolationLevel?: IsolationLevel
}

export const TRANSACTION_ISOLATION_LEVELS = [
  'read uncommitted',
  'read committed',
  'repeatable read',
  'serializable',
] as const

export type IsolationLevel = ArrayItemType<typeof TRANSACTION_ISOLATION_LEVELS>
