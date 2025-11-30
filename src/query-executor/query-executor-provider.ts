import type { QueryExecutor } from './query-executor.js'

/**
 * @internal
 * @private
 */
export interface QueryExecutorProvider {
  getExecutor(): QueryExecutor
}
