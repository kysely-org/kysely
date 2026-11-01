import { isObject } from '../util/object-utils.js'

const ABORTED_TRANSACTION_ERROR = Symbol.for('kysely.AbortedTransactionError')

/**
 * Thrown when the database rolls back a transaction instead of committing it.
 */
export class AbortedTransactionError extends Error {
  override name = 'AbortedTransactionError'
  readonly [ABORTED_TRANSACTION_ERROR] = true

  constructor() {
    super('Transaction was rolled back instead of committed')
  }
}

export function isAbortedTransactionError(
  error: unknown,
): error is AbortedTransactionError {
  return isObject(error) && ABORTED_TRANSACTION_ERROR in error
}
