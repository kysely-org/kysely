export function assertNotAborted(signal: AbortSignal, when: string): void {
  if (signal.aborted) {
    throw new KyselyAbortError(when, signal.reason)
  }
}

export class KyselyAbortError extends DOMException {
  constructor(
    when: string,
    public readonly reason: any,
  ) {
    super(`The operation was aborted ${when}.`, 'AbortError')
  }
}
