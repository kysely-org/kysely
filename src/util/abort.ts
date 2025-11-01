import { Deferred } from './deferred.js'

export interface AbortableOperationOptions {
  /**
   * An optional signal that can be used to abort the execution of (async) operations.
   *
   * This is useful for cancelling long-running queries, for example when
   * the user navigates away from the page or closes the browser tab.
   *
   * Writes (insert, update, delete) are not cancellable in most database engines,
   * so this signal is mostly useful for read queries.
   */
  signal?: AbortSignal
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
