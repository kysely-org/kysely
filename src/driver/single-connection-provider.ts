import { DatabaseConnection } from './database-connection.js'
import { ConnectionProvider } from './connection-provider.js'

export class SingleConnectionProvider implements ConnectionProvider {
  readonly #connection: DatabaseConnection
  #runningPromise?: Promise<void>

  constructor(connection: DatabaseConnection) {
    this.#connection = connection
  }

  async provideConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    while (this.#runningPromise) {
      await this.#runningPromise
    }

    const promise = this.#run(runner)

    this.#runningPromise = promise
      .then(() => {
        this.#runningPromise = undefined
      })
      .catch(() => {
        this.#runningPromise = undefined
      })

    return promise
  }

  // Run the runner in an async function to make sure it doesn't
  // throw synchronous errors.
  async #run<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    return await runner(this.#connection)
  }
}
