import { DatabaseConnection } from './database-connection.js'
import { ConnectionProvider } from './connection-provider.js'
import { Driver } from './driver.js'
import { ExecuteQueryOptions } from '../query-executor/query-executor.js'

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
