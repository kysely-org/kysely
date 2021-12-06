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
  #connections = new WeakMap<DatabaseConnection, RuntimeConnection>()

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
    let runtimeConnection = this.#connections.get(connection)

    if (!runtimeConnection) {
      runtimeConnection = new RuntimeConnection(connection, this.#log)
      this.#connections.set(connection, runtimeConnection)
    }

    return runtimeConnection
  }

  async releaseConnection(
    runtimeConnection: DatabaseConnection
  ): Promise<void> {
    if (runtimeConnection instanceof RuntimeConnection) {
      await this.#driver.releaseConnection(runtimeConnection.connection)
    }
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

class RuntimeConnection implements DatabaseConnection {
  readonly #connection: DatabaseConnection
  readonly #log: Log

  get connection(): DatabaseConnection {
    return this.#connection
  }

  constructor(connection: DatabaseConnection, log: Log) {
    this.#connection = connection
    this.#log = log
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const startTime = performanceNow()

    try {
      return await this.#connection.executeQuery<R>(compiledQuery)
    } catch (error) {
      this.#logError(error)
      throw error
    } finally {
      this.#logQuery(compiledQuery, startTime)
    }
  }

  #logError(error: unknown): void {
    this.#log.error(() => ({
      level: 'error',
      error,
    }))
  }

  #logQuery(compiledQuery: CompiledQuery, startTime: number): void {
    this.#log.query(() => ({
      level: 'query',
      sql: compiledQuery.sql,
      queryDurationMillis: this.#calculateDurationMillis(startTime),
    }))
  }

  #calculateDurationMillis(startTime: number): number {
    return performanceNow() - startTime
  }
}
