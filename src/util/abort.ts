export function assertNotAborted(abortSignal: AbortSignal | undefined) {
  if (abortSignal?.aborted) {
    throw new AbortError()
  }
}

export class AbortError extends Error {
  constructor() {
    super('The operation was aborted.')
    this.name = 'AbortError'
  }
}
