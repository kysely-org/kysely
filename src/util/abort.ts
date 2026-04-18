import { Deferred } from './deferred.js'
import type { DatabaseConnection } from '../driver/database-connection.js'

export interface AbortableOperationOptions {
  /**
   * Controls what happens when the {@link signal} is aborted.
   *
   * `'client-only'` stops waiting for query results. The query continues
   * running on the database server, and the connection is released back to
   * the pool only after the in-flight query settles.
   *
   * `'aggressive'` attempts to cancel the query on the database side (e.g.
   * `pg_cancel_backend` in PostgreSQL). This requires the dialect's connection
   * to implement {@link DatabaseConnection.cancelQuery}. If it doesn't, behaves
   * like `'client-only'` with a warning. Writes (insert, update, delete) are not
   * cancellable in most database engines, so your mileage may vary.
   *
   * Default is `'client-only'`.
   */
  queryAbortStrategy?: 'client-only' | 'aggressive' | undefined

  /**
   * An optional signal that can be used to abort the execution of (async) operations.
   *
   * This is useful for cancelling long-running queries, for example when
   * the user navigates away from the page or closes the browser tab.
   *
   * See {@link queryAbortStrategy} for handling of database side query.
   */
  signal?: AbortSignal | undefined
}

export function assertNotAborted(
  signal: AbortSignal | undefined,
  timing: string,
): void {
  if (signal?.aborted) {
    throwReasonWithTiming(signal.reason, timing)
  }
}

export function throwReasonWithTiming(reason: any, timing: string): never {
  decorateWithTiming(reason, timing)
  throw reason
}

export async function waitOrAbort<T>(
  happyPromise: Promise<T> | (() => Promise<T>),
  signal: AbortSignal | undefined,
  name: string,
): Promise<T> {
  if (!signal) {
    return typeof happyPromise === 'function' ? happyPromise() : happyPromise
  }

  assertNotAborted(signal, name)

  const { promise: abortPromise, reject, resolve } = new Deferred<never>()

  const abortListener = () => reject(decorateWithTiming(signal.reason, name))

  try {
    assertNotAborted(signal, name)

    signal.addEventListener('abort', abortListener)

    return await Promise.race([
      typeof happyPromise === 'function' ? happyPromise() : happyPromise,
      abortPromise,
    ])
  } finally {
    signal.removeEventListener('abort', abortListener)
    resolve(undefined as never)
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
