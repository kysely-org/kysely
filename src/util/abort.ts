import { Deferred } from './deferred.js'
import type { DatabaseConnection } from '../driver/database-connection.js'
import { getMessage } from './object-utils.js'

export interface AbortableOperationOptions {
  /**
   * An optional signal that can be used to abort the execution of (async) operations.
   *
   * This is useful for cancelling long-running queries, for example when
   * the user navigates away from the page or closes the browser tab.
   *
   * Aborted operations reject with `signal.reason`.
   *
   * See {@link AbortableQueryOptions.inflightQueryAbortStrategy} for handling
   * of the database side query.
   *
   * ### Examples
   *
   * ```ts
   * const people = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .execute({ signal: AbortSignal.timeout(1000) })
   * ```
   */
  readonly signal?: AbortSignal | undefined
}

export interface AbortableQueryOptions extends AbortableOperationOptions {
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
   * to implement {@link DatabaseConnection.cancelQuery}. Otherwise, throws an
   * error before executing the query. Cancellation is best-effort: a write may
   * finish before the cancellation reaches the database. Aborting doesn't undo
   * changes that have already been committed.
   *
   * `'kill session'` attempts to kill the database process/session the query is
   * running in (e.g. `pg_terminate_backend` in PostgreSQL) and with it any running
   * queries, transactions and obtained locks. This requires the dialect's connection
   * to implement {@link DatabaseConnection.killSession}. Otherwise, throws an
   * error before executing the query. Killing the session is very aggressive,
   * and will require reconnection on the next database operation if there are
   * no idle connections available in the pool.
   *
   * Built-in PostgreSQL and MySQL connections support both cancellation and
   * session termination. MSSQL connections support cancellation. SQLite and
   * PGlite connections support neither strategy.
   *
   * This option only takes effect when a {@link signal} is provided.
   *
   * Default is `'ignore query'`.
   *
   * ### Examples
   *
   * Attempt to cancel a PostgreSQL query when the timeout expires:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .execute({
   *     signal: AbortSignal.timeout(1000),
   *     inflightQueryAbortStrategy: 'cancel query',
   *   })
   * ```
   *
   * Cancel waiting for a query using an `AbortController`:
   *
   * ```ts
   * const controller = new AbortController()
   * const result = db
   *   .selectFrom('person')
   *   .selectAll()
   *   .execute({ signal: controller.signal })
   *
   * controller.abort(new Error('Request cancelled'))
   *
   * try {
   *   await result
   * } catch (error) {
   *   if (error !== controller.signal.reason) {
   *     throw error
   *   }
   * }
   * ```
   */
  readonly inflightQueryAbortStrategy?: InflightQueryAbortStrategy | undefined
}

export type InflightQueryAbortStrategy =
  'ignore query' | 'cancel query' | 'kill session'

export function getInflightQueryAbortHandler(
  abortStrategy: InflightQueryAbortStrategy | undefined = 'ignore query',
  connection: DatabaseConnection,
  beforeThrow: () => void,
) {
  if (abortStrategy === 'ignore query') {
    return
  }

  if (abortStrategy === 'cancel query') {
    const handler = connection.cancelQuery

    if (!handler) {
      beforeThrow()
      throwUnsupportedInflightQueryAbortStrategyError(
        abortStrategy,
        connection.killSession ? 'kill session' : undefined,
      )
    }

    return handler.bind(connection)
  }

  if (abortStrategy === 'kill session') {
    const handler = connection.killSession

    if (!handler) {
      beforeThrow()
      throwUnsupportedInflightQueryAbortStrategyError(
        abortStrategy,
        connection.cancelQuery ? 'cancel query' : undefined,
      )
    }

    return handler.bind(connection)
  }

  beforeThrow()

  throw new Error(
    `Unexpected \`inflightQueryAbortStrategy\`: "${abortStrategy satisfies never}"`,
  )
}

function throwUnsupportedInflightQueryAbortStrategyError(
  abortStrategy: Exclude<InflightQueryAbortStrategy, 'ignore query'>,
  alt: InflightQueryAbortStrategy | undefined,
): never {
  throw new Error(
    `This dialect doesn't support \`inflightQueryAbortStrategy\` "${abortStrategy}". Use "${'ignore query' satisfies InflightQueryAbortStrategy}"${
      alt ? ` or "${alt satisfies InflightQueryAbortStrategy}"` : ''
    } instead.`,
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

export const ABORTED: unique symbol = {} as never

export async function waitOrAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
  name: string,
  onAbort?: () => void | Promise<void>,
): Promise<T> {
  if (!signal) {
    return promise
  }

  assertNotAborted(signal, `before ${name}`, onAbort)

  const { promise: abortPromise, resolve } = new Deferred<typeof ABORTED>()

  const abortListener = () => resolve(ABORTED)
  signal.addEventListener('abort', abortListener)

  try {
    assertNotAborted(signal, `before ${name}`, onAbort)

    const result = await Promise.race([promise, abortPromise])

    if (result !== ABORTED) {
      return result
    }

    onAbort?.()
    throwReasonWithTiming(signal.reason, `during ${name}`)
  } finally {
    signal.removeEventListener('abort', abortListener)
    resolve(ABORTED)
  }
}

export function printBackgroundFail(name: string): (reason: unknown) => void {
  return (reason: unknown) =>
    console.error(
      `\`${name}\` failed in the background after abortion: ${getMessage(reason)}`,
    )
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
