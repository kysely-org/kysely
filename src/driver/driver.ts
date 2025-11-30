import type { QueryCompiler } from '../query-compiler/query-compiler.js'
import type { ArrayItemType } from '../util/type-utils.js'
import type { DatabaseConnection } from './database-connection.js'

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
    settings: TransactionSettings,
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
   * Establishses a new savepoint within a transaction.
   */
  savepoint?(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void>

  /**
   * Rolls back to a savepoint within a transaction.
   */
  rollbackToSavepoint?(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void>

  /**
   * Releases a savepoint within a transaction.
   */
  releaseSavepoint?(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void>

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
  readonly accessMode?: AccessMode
  readonly isolationLevel?: IsolationLevel
}

export const TRANSACTION_ACCESS_MODES = ['read only', 'read write'] as const

export type AccessMode = ArrayItemType<typeof TRANSACTION_ACCESS_MODES>

export const TRANSACTION_ISOLATION_LEVELS = [
  'read uncommitted',
  'read committed',
  'repeatable read',
  'serializable',
  'snapshot',
] as const

export type IsolationLevel = ArrayItemType<typeof TRANSACTION_ISOLATION_LEVELS>

export function validateTransactionSettings(
  settings: TransactionSettings,
): void {
  if (
    settings.accessMode &&
    !TRANSACTION_ACCESS_MODES.includes(settings.accessMode)
  ) {
    throw new Error(`invalid transaction access mode ${settings.accessMode}`)
  }

  if (
    settings.isolationLevel &&
    !TRANSACTION_ISOLATION_LEVELS.includes(settings.isolationLevel)
  ) {
    throw new Error(
      `invalid transaction isolation level ${settings.isolationLevel}`,
    )
  }
}
