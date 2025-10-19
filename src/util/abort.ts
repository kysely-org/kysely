export function assertNotAborted(signal: AbortSignal, timing: string): void {
  if (signal.aborted) {
    throwReasonWithTiming(signal.reason, timing)
  }
}

export function throwReasonWithTiming(reason: any, timing: string): never {
  if (
    reason != null &&
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

  throw reason
}
