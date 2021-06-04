import { freeze } from '../util/object-utils'
import { Connection } from './connection'
import { DriverConfig, DriverConfigWithDefaults } from './driver-config'

const POOL_CONFIG_DEFAULTS = freeze({
  maxConnections: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 0,
})

/**
 * A Driver is responsible for abstracting away the database engine details.
 *
 * The Driver creates and releases database connections and is also responsible
 * for connection pooling.
 */
export abstract class Driver {
  protected readonly config: DriverConfigWithDefaults

  #initPromise: Promise<void> | null = null
  #destroyPromise: Promise<void> | null = null

  constructor(config: DriverConfig) {
    this.config = freeze({
      ...config,
      port: config.port ?? this.getDefaultPort(),
      pool: freeze({
        ...POOL_CONFIG_DEFAULTS,
        ...config.pool,
      }),
    })
  }

  /**
   * Returns the default port for the database engine.
   */
  abstract getDefaultPort(): number

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
  abstract init(): Promise<void>

  /**
   * Destroys the driver and releases all resources.
   */
  abstract destroy(): Promise<void>

  /**
   * Acquires a new connection from the pool.
   */
  abstract acquireConnection(): Promise<Connection>

  /**
   * Releases a connection back to the pool.
   */
  abstract releaseConnection(connection: Connection): Promise<void>

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async ensureInit(): Promise<void> {
    if (!this.#initPromise) {
      this.#initPromise = this.init().catch((err) => {
        this.#initPromise = null
        return Promise.reject(err)
      })
    }

    await this.#initPromise
  }

  /**
   * @internal
   * For internal use only. Don't override this.
   */
  async ensureDestroy(): Promise<void> {
    if (this.#initPromise) {
      await this.#initPromise
    }

    if (!this.#destroyPromise) {
      this.#destroyPromise = this.destroy().catch((err) => {
        this.#destroyPromise = null
        return Promise.reject(err)
      })
    }

    await this.#destroyPromise
  }
}
