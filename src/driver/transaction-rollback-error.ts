import { isObject } from '../util/object-utils.js'

const TRANSACTION_ROLLBACK_ERROR = Symbol.for('kysely.TransactionRollbackError')

/**
 * Thrown when the database rolls back a transaction instead of committing it.
 */
export class TransactionRollbackError extends Error {
  readonly [TRANSACTION_ROLLBACK_ERROR] = true

  constructor() {
    super('Transaction was rolled back instead of committed')
  }
}

export function isTransactionRollbackError(
  error: unknown,
): error is TransactionRollbackError {
  return (
    isObject(error) &&
    TRANSACTION_ROLLBACK_ERROR in error &&
    error[TRANSACTION_ROLLBACK_ERROR] === true
  )
}
