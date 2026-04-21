import { Deferred } from './deferred.js'
import type {
  ControlConnectionProvider,
  DatabaseConnection,
} from '../driver/database-connection.js'
import { logOnce } from './log-once.js'

export interface AbortableOperationOptions {
  /**
   * Controls what happens when the {@link signal} is aborted while a query is
   * in-flight.
   *
   * `'ignore query'` stops waiting for query results. The query continues running
   * on the database server, and the connection is released back to the pool only
   * after the in-flight query settles.
   *
   * `'cancel query'` attempts to cancel the query on the database side (e.g. `pg_cancel_backend`
   * in PostgreSQL or `kill query` in MySQL). This requires the dialect's connection
   * to implement {@link DatabaseConnection.cancelQuery}. Otherwise, falls back
   * to `'ignore query'` with a warning. Writes (insert, update, delete) are not
   * cancellable in most database engines, so your mileage
   * may vary. Also, some databases do not cancel the running query immediately
   * resulting in changes being committed sometimes - consider `'kill session'`
   * when you need stronger guarantees, at all costs.
   *
   * `'kill session'` attempts to kill the database process/session the query is
   * running in (e.g. `pg_terminate_backend` in PostgreSQL) and with it any running
   * queries, transactions and obtained locks. This requires the dialect's connection
   * to implement {@link DatabaseConnection.killSession}. Otherwise, falls back
   * to `'cancel query'` with a warning. Killing the session is very aggressive,
   * and will require reconnection on the next database operation if there are
   * no idle connections available in the pool.
   *
   * Default is `'ignore query'`.
   */
  inflightQueryAbortStrategy?: InflightQueryAbortStrategy | undefined

  /**
   * An optional signal that can be used to abort the execution of (async) operations.
   *
   * This is useful for cancelling long-running queries, for example when
   * the user navigates away from the page or closes the browser tab.
   *
   * See {@link inflightQueryAbortStrategy} for handling of database side query.
   */
  signal?: AbortSignal | undefined
}

export type InflightQueryAbortStrategy =
  | 'ignore query'
  | 'cancel query'
  | 'kill session'

export function getInflightQueryAbortHandler(
  abortStrategy: InflightQueryAbortStrategy | undefined = 'ignore query',
  connection: DatabaseConnection,
  beforeThrow: () => void,
) {
  if (abortStrategy === 'ignore query') {
    return
  }

  if (abortStrategy === 'kill session') {
    const handler = connection.killSession

    if (handler) {
      return handler.bind(connection)
    }

    logOnce(
      'This kysely dialect does not implement the `killSession` method. This means sessions will not be killed on the database side when the `signal` is aborted.',
    )
  }

  if (abortStrategy === 'cancel query' || abortStrategy === 'kill session') {
    const handler = connection.cancelQuery

    if (!handler) {
      logOnce(
        'This kysely dialect does not implement the `cancelQuery` method. This means queries will not be cancelled on the database side when the `signal` is aborted.',
      )
    }

    return handler?.bind(connection)
  }

  beforeThrow()

  throw new Error(
    `Unexpected \`inflightQueryAbortStrategy\`: ${abortStrategy satisfies never}`,
  )
}

export function assertNotAborted(
  signal: AbortSignal | undefined,
  timing: string,
  beforeThrow?: () => void,
): void {
  if (signal?.aborted) {
    beforeThrow?.()
    throwReasonWithTiming(signal.reason, timing)
  }
}

export function throwReasonWithTiming(reason: any, timing: string): never {
  decorateWithTiming(reason, timing)
  throw reason
}

const ABORT_TOKEN = {} as symbol

export async function waitOrAbort<T>(
  happyPromise: Promise<T> | (() => Promise<T>),
  signal: AbortSignal | undefined,
  name: string,
  onAbort?: (happyPromise?: Promise<T>) => void | Promise<void>,
): Promise<T> {
  if (!signal) {
    return typeof happyPromise === 'function' ? happyPromise() : happyPromise
  }

  const { promise: abortPromise, resolve } = new Deferred<typeof ABORT_TOKEN>()

  const abortListener = () => resolve(ABORT_TOKEN)

  try {
    assertNotAborted(signal, `before ${name}`, onAbort)

    signal.addEventListener('abort', abortListener)

    happyPromise =
      typeof happyPromise === 'function' ? happyPromise() : happyPromise

    const result = await Promise.race([happyPromise, abortPromise])

    if (result !== ABORT_TOKEN) {
      return result as T
    }

    onAbort?.(happyPromise)
    throwReasonWithTiming(signal.reason, `during ${name}`)
  } finally {
    signal.removeEventListener('abort', abortListener)
    resolve(ABORT_TOKEN)
  }
}

function decorateWithTiming(reason: any, timing: string): void {
  if (
    reason !== null &&
    typeof reason === 'object' &&
    !Object.isFrozen(reason)
  ) {
    // we use this in tests, but it can also be used to debug in userland.
    Object.defineProperty(reason, '__kysely_timing__', {
      configurable: true,
      enumerable: false,
      value: timing,
      writable: false,
    })
  }
}
