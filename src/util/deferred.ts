export class Deferred<T> {
  private readonly _promise: Promise<T>

  private _resolve?: (value: T | PromiseLike<T>) => void
  private _reject?: (reason?: any) => void

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._reject = reject
      this._resolve = resolve
    })
  }

  get promise(): Promise<T> {
    return this._promise
  }

  resolve = (value: T | PromiseLike<T>): void => {
    if (this._resolve) {
      this._resolve(value)
    }
  }

  reject = (reason?: any): void => {
    if (this._reject) {
      this._reject(reason)
    }
  }
}
