import { isObject, isString } from '../util/object-utils.js'

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

export function isAbortedTransactionError(error: unknown): boolean {
  return isObject(error) && abortedTransactionErrors.has(error)
}

/** @internal */
export function markAsAbortedTransactionError(error: unknown): void {
  if (isObject(error)) {
    abortedTransactionErrors.add(error)
  }
}
