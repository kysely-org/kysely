import { AsyncLocalStorage } from 'async_hooks'
import { Connection } from './connection'
import { ConnectionProvider } from './connection-provider'
import { Driver } from './driver'

export class TransactionalConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver
  readonly #transactions = new AsyncLocalStorage<Connection>()

  constructor(driver: Driver) {
    this.#driver = driver
  }

  isTransactionRunning(): boolean {
    return !!this.#transactions.getStore()
  }

  async withConnection<T>(
    runner: (connection: Connection) => Promise<T>
  ): Promise<T> {
    const connection = await this.acquireConnection()

    try {
      return await runner(connection)
    } finally {
      await this.releaseConnection(connection)
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    let connection: Connection | null = null

    if (this.isTransactionRunning()) {
      throw new Error(
        'You attempted to call Kysely.transaction() inside an existing transaction. Nested transactions are not yet supported. See the Kysely.isTransactionRunning() method.'
      )
    }

    try {
      await this.#driver.ensureInit()

      connection = await this.#driver.acquireConnection()
      await connection.execute<void>({ sql: 'begin', bindings: [] })

      const result = await this.#transactions.run(connection, () => {
        return callback()
      })

      await connection.execute<void>({ sql: 'commit', bindings: [] })
      return result
    } catch (error) {
      if (connection) {
        await connection.execute<void>({ sql: 'rollback', bindings: [] })
      }
      throw error
    } finally {
      if (connection) {
        await this.#driver.releaseConnection(connection)
      }
    }
  }

  destroy() {
    this.#transactions.disable()
  }

  private async acquireConnection(): Promise<Connection> {
    const transaction = this.#transactions.getStore()

    if (transaction) {
      return transaction
    } else {
      await this.#driver.ensureInit()
      return this.#driver.acquireConnection()
    }
  }

  private async releaseConnection(connection: Connection): Promise<void> {
    const transaction = this.#transactions.getStore()

    if (transaction) {
      if (connection !== transaction) {
        throw new Error(
          'An unexpected connection detected inside a transaction. Did you try to run a query without a transaction inside a Kysely.transaction() call?'
        )
      }
    } else {
      await this.#driver.releaseConnection(connection)
    }
  }
}
