import { DatabaseConnection } from './database-connection.js'
import { ConnectionProvider } from './connection-provider.js'
import { Driver } from './driver.js'

export class DefaultConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async withConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.#driver.acquireConnection()

    try {
      return await runner(connection)
    } finally {
      await this.#driver.releaseConnection(connection)
    }
  }
}
