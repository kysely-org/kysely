import { freeze } from '../utils/object-utils'
import { Connection } from './connection'
import { DriverConfig } from './driver-config'

export abstract class Driver {
  protected readonly config: DriverConfig
  #initPromise: Promise<void> | null = null

  constructor(config: DriverConfig) {
    this.config = {
      ...config,
    }

    freeze(this.config)
    freeze(this.config.pool)
  }

  async ensureInit(): Promise<void> {
    if (!this.#initPromise) {
      this.#initPromise = this.init().catch((err) => {
        this.#initPromise = null
        return Promise.reject(err)
      })
    }

    await this.#initPromise
  }

  abstract init(): Promise<void>
  abstract destroy(): Promise<void>

  abstract acquireConnection(): Promise<Connection>
  abstract releaseConnection(connection: Connection): Promise<void>
}
