import { DatabaseConnection } from './database-connection.js'
import { Driver, TransactionSettings } from './driver.js'

/**
 * A small wrapper around {@link Driver} that makes sure the driver is
 * initialized before it is used, only initialized and destroyed
 * once etc.
 */
export class RuntimeDriver implements Driver {
  #driver: Driver
  #initPromise?: Promise<void>
  #destroyPromise?: Promise<void>

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async init(): Promise<void> {
    if (!this.#initPromise) {
      this.#initPromise = this.#driver.init().catch((err) => {
        this.#initPromise = undefined
        return Promise.reject(err)
      })
    }

    await this.#initPromise
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.init()
    return this.#driver.acquireConnection()
  }

  releaseConnection(connection: DatabaseConnection): Promise<void> {
    return this.#driver.releaseConnection(connection)
  }

  beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void> {
    return this.#driver.beginTransaction(connection, settings)
  }

  commitTransaction(connection: DatabaseConnection): Promise<void> {
    return this.#driver.commitTransaction(connection)
  }

  rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    return this.#driver.rollbackTransaction(connection)
  }

  async destroy(): Promise<void> {
    if (!this.#initPromise) {
      return
    }

    await this.#initPromise

    if (!this.#destroyPromise) {
      this.#destroyPromise = this.#driver.destroy().catch((err) => {
        this.#destroyPromise = undefined
        return Promise.reject(err)
      })
    }

    await this.#destroyPromise
  }
}
