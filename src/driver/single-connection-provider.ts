import { DatabaseConnection } from './database-connection'
import { ConnectionProvider } from './connection-provider'

export class SingleConnectionProvider implements ConnectionProvider {
  readonly #connection: DatabaseConnection
  #runningPromise: Promise<void> | null = null

  constructor(connection: DatabaseConnection) {
    this.#connection = connection
  }

  async withConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    while (this.#runningPromise) {
      await this.#runningPromise
    }

    const promise = this.run(runner)

    this.#runningPromise = promise
      .then(() => {
        this.#runningPromise = null
      })
      .catch(() => {
        this.#runningPromise = null
      })

    return promise
  }

  // Run the runner in an async function to make sure it doesn't
  // throw synchronous errors.
  private async run<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    return await runner(this.#connection)
  }
}
