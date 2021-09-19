import { DatabaseConnection } from './database-connection.js'
import { ConnectionProvider } from './connection-provider.js'
import { Driver } from './driver.js'
import {
  INTERNAL_DRIVER_ACQUIRE_CONNECTION,
  INTERNAL_DRIVER_RELEASE_CONNECTION,
} from './driver-internal.js'

export class DefaultConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver

  constructor(driver: Driver) {
    this.#driver = driver
  }

  async withConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.#driver[INTERNAL_DRIVER_ACQUIRE_CONNECTION]()

    try {
      return await runner(connection)
    } finally {
      await this.#driver[INTERNAL_DRIVER_RELEASE_CONNECTION](connection)
    }
  }
}
