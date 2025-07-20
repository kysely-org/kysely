/**
 * This mutex is used to ensure that only one operation at a time can
 * acquire a connection from the driver. This is necessary when the
 * driver only has a single connection, like SQLite and PGlite.
 *
 * @internal
 */
export class ConnectionMutex {
  #promise?: Promise<void>
  #resolve?: () => void

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })
  }

  unlock(): void {
    const resolve = this.#resolve

    this.#promise = undefined
    this.#resolve = undefined

    resolve?.()
  }
}
