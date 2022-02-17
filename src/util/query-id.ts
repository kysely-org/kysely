import { randomString } from './random-string.js'

export interface QueryId {
  readonly queryId: string
}

export function createQueryId(): QueryId {
  return new LazyQueryId()
}

class LazyQueryId implements QueryId {
  #queryId: string | undefined

  get queryId(): string {
    if (this.#queryId === undefined) {
      this.#queryId = randomString(8)
    }

    return this.#queryId
  }
}
