/**
 * Thrown when the database rolls back a transaction instead of committing it.
 */
export class TransactionRollbackError extends Error {
  constructor() {
    super('Transaction was rolled back instead of committed')
  }
}
