import type { DatabaseConnection } from './database-connection.js'
import type { ConnectionProvider } from './connection-provider.js'
import type { Driver } from './driver.js'
import type { AbortableOperationOptions } from '../util/abort.js'

export class DefaultConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async provideConnection<T>(
    consumer: (
      connection: DatabaseConnection,
      options?: AbortableOperationOptions,
    ) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T> {
    const connection = await this.#driver.acquireConnection(options)

    try {
      return await consumer(connection, options)
    } finally {
      await this.#driver.releaseConnection(connection, options)
    }
  }
}
