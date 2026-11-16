import { isObject, isString } from '../util/object-utils.js'
import type { DatabaseConnection } from './database-connection.js'

const ABORTED_TRANSACTION_ERROR_PROPERTY: unique symbol = Symbol.for(
  'kysely.AbortedTransactionError',
)

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
    markAsAbortedTransactionError(this)
  }
}

/**
 * Returns `true` if the error is an {@link AbortedTransactionError}, or a database
 * error marked with {@link markAsAbortedTransactionError}.
 *
 * Recognizes errors created or marked by any copy of Kysely.
 */
export function isAbortedTransactionError(error: unknown): boolean {
  return isObject(error) && ABORTED_TRANSACTION_ERROR_PROPERTY in error
}

/**
 * Marks a database error as having aborted the current transaction.
 *
 * For use in {@link DatabaseConnection} implementations when a failing query
 * ends the current transaction, so Kysely can mark the transaction as aborted.
 *
 * If the database rolls back without reporting an error, throw
 * {@link AbortedTransactionError} instead.
 */
export function markAsAbortedTransactionError(error: unknown): void {
  if (isObject(error) && Object.isExtensible(error)) {
    Object.defineProperty(error, ABORTED_TRANSACTION_ERROR_PROPERTY, {
      value: true,
    })
  }
}
