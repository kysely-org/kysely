import { isObject } from '../util/object-utils.js'

const ABORTED_TRANSACTION_ERROR = Symbol.for('kysely.AbortedTransactionError')

/**
 * Thrown when the database rolls back a transaction automatically without an explicit
 * rollback statement.
 */
export class AbortedTransactionError extends Error {
  override name = 'AbortedTransactionError'
  readonly [ABORTED_TRANSACTION_ERROR] = true

  constructor(options?: ErrorOptions) {
    super('Transaction was aborted', options)
  }
}

export function isAbortedTransactionError(
  error: unknown,
): error is AbortedTransactionError {
  return isObject(error) && ABORTED_TRANSACTION_ERROR in error
}
