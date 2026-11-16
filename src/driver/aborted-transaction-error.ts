import { isObject, isString } from '../util/object-utils.js'
import type { DatabaseConnection } from './database-connection.js'
import type { Driver } from './driver.js'

// Drivers and executors may belong to different copies of Kysely.
const ABORTED_TRANSACTION_ERRORS = Symbol.for('kysely.abortedTransactionErrors')
const registry = globalThis as typeof globalThis & {
  [ABORTED_TRANSACTION_ERRORS]?: WeakSet<object>
}
const abortedTransactionErrors = (registry[ABORTED_TRANSACTION_ERRORS] ??=
  new WeakSet<object>())

/**
 * Thrown when attempting to use a transaction that the database has aborted,
 * or when committing rolls back without a database error.
 */
export class AbortedTransactionError extends Error {
  override name = 'AbortedTransactionError'

  constructor(options?: ErrorOptions) {
    const cause = options?.cause
    super(
      isObject(cause) && isString(cause.message)
        ? `Transaction was aborted: ${cause.message}`
        : 'Transaction was aborted',
      options,
    )
    abortedTransactionErrors.add(this)
  }
}

/**
 * Returns `true` if the error is an {@link AbortedTransactionError}, or a database
 * error marked with {@link markAsAbortedTransactionError}.
 *
 * Recognizes errors created or marked by any copy of Kysely.
 */
export function isAbortedTransactionError(error: unknown): boolean {
  return isObject(error) && abortedTransactionErrors.has(error)
}

/**
 * Marks a database error as having aborted the current transaction.
 *
 * For use in {@link DatabaseConnection.executeQuery} and {@link Driver.commitTransaction}
 * implementations, when the database reports an error and the transaction is
 * no longer active. Kysely then rethrows the original error, marks the transaction
 * as aborted, and skips sending another rollback.
 *
 * If the database rolls back without reporting an error, throw
 * {@link AbortedTransactionError} instead.
 *
 * ### Examples
 *
 * ```ts
 * import {
 *   markAsAbortedTransactionError,
 *   type CompiledQuery,
 *   type DatabaseConnection,
 *   type QueryResult,
 * } from 'kysely'
 *
 * interface Database {
 *   readonly inTransaction: boolean
 *   execute(sql: string, parameters: readonly unknown[]): unknown[]
 * }
 *
 * class MyConnection implements DatabaseConnection {
 *   constructor(private readonly db: Database) {}
 *
 *   async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
 *     const inTransactionBefore = this.db.inTransaction
 *
 *     try {
 *       return {
 *         rows: this.db.execute(compiledQuery.sql, compiledQuery.parameters) as R[],
 *       }
 *     } catch (error) {
 *       if (inTransactionBefore && !this.db.inTransaction) {
 *         markAsAbortedTransactionError(error)
 *       }
 *
 *       throw error
 *     }
 *   }
 *
 *   async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
 *     throw new Error('Not implemented')
 *   }
 * }
 * ```
 */
export function markAsAbortedTransactionError(error: unknown): void {
  if (isObject(error)) {
    abortedTransactionErrors.add(error)
  }
}
