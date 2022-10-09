import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Log } from '../util/log.js'
import { performanceNow } from '../util/performance-now.js'
import { DatabaseConnection, QueryResult } from './database-connection.js'
import { Driver, TransactionSettings } from './driver.js'

/**
 * A small wrapper around {@link Driver} that makes sure the driver is
 * initialized before it is used, only initialized and destroyed
 * once etc.
 */
export class RuntimeDriver implements Driver {
  readonly #driver: Driver
  readonly #log: Log

  #initPromise?: Promise<void>
  #destroyPromise?: Promise<void>
  #connections = new WeakSet<DatabaseConnection>()

  constructor(driver: Driver, log: Log) {
    this.#driver = driver
    this.#log = log
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

    const connection = await this.#driver.acquireConnection()

    if (!this.#connections.has(connection)) {
      if (this.#needsLogging()) {
        this.#addLogging(connection)
      }

      this.#connections.add(connection)
    }

    return connection
  }

  async releaseConnection(connection: DatabaseConnection): Promise<void> {
    await this.#driver.releaseConnection(connection)
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

  #needsLogging(): boolean {
    return (
      this.#log.isLevelEnabled('query') || this.#log.isLevelEnabled('error')
    )
  }

  // This method monkey patches the database connection's executeQuery method
  // by adding logging code around it. Monkey patching is not pretty, but it's
  // the best option in this case.
  #addLogging(connection: DatabaseConnection): void {
    const executeQuery = connection.executeQuery

    connection.executeQuery = async (
      compiledQuery
    ): Promise<QueryResult<any>> => {
      const startTime = performanceNow()

      try {
        return await executeQuery.call(connection, compiledQuery)
      } catch (error) {
        this.#logError(error)
        throw error
      } finally {
        this.#logQuery(compiledQuery, startTime)
      }
    }
  }

  #logError(error: unknown): void {
    this.#log.error(() => ({
      level: 'error',
      error,
    }))
  }

  #logQuery(compiledQuery: CompiledQuery<any>, startTime: number): void {
    this.#log.query(() => ({
      level: 'query',
      query: compiledQuery,
      queryDurationMillis: this.#calculateDurationMillis(startTime),
    }))
  }

  #calculateDurationMillis(startTime: number): number {
    return performanceNow() - startTime
  }
}
