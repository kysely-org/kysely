export function assertNotAborted(
  abortSignal: AbortSignal | undefined,
  reason?: any,
) {
  if (abortSignal?.aborted) {
    throw new AbortError(reason || abortSignal.reason)
  }
}

export class AbortError extends Error {
  constructor(public readonly reason?: any) {
    super('The operation was aborted.')
    this.name = 'AbortError'
  }
}
