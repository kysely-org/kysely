import type { DatabaseConnection } from './database-connection.js'
import type { ConnectionProvider } from './connection-provider.js'
import type { Driver } from './driver.js'
import type { ExecuteQueryOptions } from '../query-executor/query-executor.js'

export class DefaultConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async provideConnection<T>(
    consumer: (
      connection: DatabaseConnection,
      options?: ExecuteQueryOptions,
    ) => Promise<T>,
    options?: ExecuteQueryOptions,
  ): Promise<T> {
    const connection = await this.#driver.acquireConnection(options)

    try {
      return await consumer(connection, options)
    } finally {
      await this.#driver.releaseConnection(connection, options)
    }
  }
}
