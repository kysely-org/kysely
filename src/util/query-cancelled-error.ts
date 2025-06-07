/**
 * Thrown when a query is cancelled through an AbortSignal.
 */
export class QueryCancelledError extends Error {
  /**
   * Creates a new QueryCancelledError.
   * 
   * @param message - Optional error message. Defaults to 'Query was cancelled'.
   */
  constructor(message = 'Query was cancelled') {
    super(message)
    this.name = 'QueryCancelledError'
  }
} 