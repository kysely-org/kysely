import { DatabaseConnection } from './database-connection.js'
import { ConnectionProvider } from './connection-provider.js'
import { Driver } from './driver.js'
import { AbortableOperationOptions } from '../util/abort.js'

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
