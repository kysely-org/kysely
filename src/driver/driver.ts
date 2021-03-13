import { freeze } from '../utils/object-utils'
import { Connection } from './connection'
import { DriverConfig } from './driver-config'

export abstract class Driver {
  protected readonly config: DriverConfig
  #initPromise: Promise<void> | null = null

  constructor(config: DriverConfig) {
    this.config = freeze({
      ...config,

      pool: freeze({
        ...config.pool,
      }),
    })
  }

  abstract init(): Promise<void>
  abstract destroy(): Promise<void>

  abstract acquireConnection(): Promise<Connection>
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

    await this.destroy()
  }
}
