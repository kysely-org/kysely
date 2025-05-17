export class Deferred<T> {
  readonly #promise: Promise<T>

  #reject?: (reason?: any) => void
  #resolve?: (value: T | PromiseLike<T>) => void

  constructor() {
    this.#promise = new Promise<T>((resolve, reject) => {
      this.#reject = (reason?: any) => {
        reject(reason)
        this.#reject = this.#resolve = undefined
      }
      this.#resolve = (value: T | PromiseLike<T>) => {
        resolve(value)
        this.#reject = this.#resolve = undefined
      }
    })
  }

  get promise(): Promise<T> {
    return this.#promise
  }

  reject = (reason?: any): void => {
    this.#reject?.(reason)
  }

  resolve = (value: T | PromiseLike<T>): void => {
    this.#resolve?.(value)
  }
}
