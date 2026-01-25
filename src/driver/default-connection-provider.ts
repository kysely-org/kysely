import type { DatabaseConnection } from './database-connection.js'
import type { ConnectionProvider } from './connection-provider.js'
import type { Driver } from './driver.js'

export class DefaultConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async provideConnection<T>(
    consumer: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.#driver.acquireConnection()

    try {
      return await consumer(connection)
    } finally {
      await this.#driver.releaseConnection(connection)
    }
  }

  provideConnectionSync<T>(consumer: (connection: DatabaseConnection) => T): T {
    if (!this.#driver.acquireConnectionSync) {
      throw new Error(
        'The current dialect does not support synchronous execution.',
      )
    }

    const connection = this.#driver.acquireConnectionSync()

    try {
      return consumer(connection)
    } finally {
      this.#driver.releaseConnectionSync?.(connection)
    }
  }
}
