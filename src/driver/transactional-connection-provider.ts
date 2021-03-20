import { AsyncLocalStorage } from 'node:async_hooks'
import { Connection } from './connection'
import { ConnectionProvider } from './connection-provider'
import { Driver } from './driver'

export class TransactionalConnectionProvider implements ConnectionProvider {
  readonly #driver: Driver
  readonly #transactions: AsyncLocalStorage<Connection>

  constructor(driver: Driver, transactions: AsyncLocalStorage<Connection>) {
    this.#driver = driver
    this.#transactions = transactions
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
