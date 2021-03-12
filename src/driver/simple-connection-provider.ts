import { Connection } from './connection'
import { ConnectionProvider } from './connection-provider'
import { Driver } from './driver'

export class SimpleConnectionProvider implements ConnectionProvider {
  #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async acquireConnection(): Promise<Connection> {
    await this.#driver.ensureInit()
    return this.#driver.acquireConnection()
  }

  async releaseConnection(connection: Connection): Promise<void> {
    await this.#driver.releaseConnection(connection)
  }
}
