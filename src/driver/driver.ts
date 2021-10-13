import { DatabaseConnection } from './database-connection.js'
import {
  INTERNAL_DRIVER_ACQUIRE_CONNECTION,
  INTERNAL_DRIVER_ENSURE_DESTROY,
  INTERNAL_DRIVER_ENSURE_INIT,
  INTERNAL_DRIVER_RELEASE_CONNECTION,
} from './driver-internal.js'

/**
 * A Driver is responsible for abstracting away the database engine details.
 *
 * The Driver creates and releases database connections and is also responsible
 * for connection pooling.
 */
export abstract class Driver {
  #initPromise?: Promise<void>
  #destroyPromise?: Promise<void>

  /**
   * Initializes the driver.
   *
   * After calling this method the driver should be usable and `acquireConnection` etc.
   * methods should be callable.
   *
   * IMPORTANT: The underlying database engine driver (like [pg](https://node-postgres.com/))
   * should be imported inside this function, not at the top of the driver file! This is
   * important so that Kysely is usable without installing all database driver libraries
   * it supports.
   */
  protected abstract init(): Promise<void>

  /**
   * Acquires a new connection from the pool.
   */
  protected abstract acquireConnection(): Promise<DatabaseConnection>

  /**
   * Releases a connection back to the pool.
   */
  protected abstract releaseConnection(
    connection: DatabaseConnection
  ): Promise<void>

  /**
   * Destroys the driver and releases all resources.
   */
  protected abstract destroy(): Promise<void>

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async [INTERNAL_DRIVER_ACQUIRE_CONNECTION](): Promise<DatabaseConnection> {
    await this[INTERNAL_DRIVER_ENSURE_INIT]()
    return this.acquireConnection()
  }

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async [INTERNAL_DRIVER_RELEASE_CONNECTION](
    connection: DatabaseConnection
  ): Promise<void> {
    return this.releaseConnection(connection)
  }

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async [INTERNAL_DRIVER_ENSURE_INIT](): Promise<void> {
    if (!this.#initPromise) {
      this.#initPromise = this.init().catch((err) => {
        this.#initPromise = undefined
        return Promise.reject(err)
      })
    }

    await this.#initPromise
  }

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async [INTERNAL_DRIVER_ENSURE_DESTROY](): Promise<void> {
    if (!this.#initPromise) {
      return
    }

    await this.#initPromise

    if (!this.#destroyPromise) {
      this.#destroyPromise = this.destroy().catch((err) => {
        this.#destroyPromise = undefined
        return Promise.reject(err)
      })
    }

    await this.#destroyPromise
  }
}
