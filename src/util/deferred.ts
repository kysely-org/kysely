export class Deferred<T> {
  readonly #promise: Promise<T>

  #resolve?: (value: T | PromiseLike<T>) => void
  #reject?: (reason?: any) => void

  constructor() {
    this.#promise = new Promise<T>((resolve, reject) => {
      this.#reject = reject
      this.#resolve = resolve
    })
  }

  get promise(): Promise<T> {
    return this.#promise
  }

  resolve = (value: T | PromiseLike<T>): void => {
    if (this.#resolve) {
      this.#resolve(value)
    }
  }

  reject = (reason?: any): void => {
    if (this.#reject) {
      this.#reject(reason)
    }
  }
}
