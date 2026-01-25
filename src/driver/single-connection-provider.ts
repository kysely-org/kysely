import type { DatabaseConnection } from './database-connection.js'
import type { ConnectionProvider } from './connection-provider.js'

const ignoreError = () => {}

export class SingleConnectionProvider implements ConnectionProvider {
  readonly #connection: DatabaseConnection
  #runningPromise?: Promise<any>

  constructor(connection: DatabaseConnection) {
    this.#connection = connection
  }

  async provideConnection<T>(
    consumer: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    while (this.#runningPromise) {
      await this.#runningPromise.catch(ignoreError)
    }

    // `#runningPromise` must be set to undefined before it's
    // resolved or rejected. Otherwise the while loop above
    // will misbehave.
    this.#runningPromise = this.#run(consumer).finally(() => {
      this.#runningPromise = undefined
    })

    return this.#runningPromise
  }

  provideConnectionSync<T>(consumer: (connection: DatabaseConnection) => T): T {
    if (this.#runningPromise) {
      throw new Error(
        'Cannot execute synchronously while an async operation is in progress. ' +
          'Await all async operations before using sync methods.',
      )
    }

    return consumer(this.#connection)
  }

  // Run the runner in an async function to make sure it doesn't
  // throw synchronous errors.
  async #run<T>(
    runner: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return await runner(this.#connection)
  }
}
