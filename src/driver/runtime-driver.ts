import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryCompiler } from '../query-compiler/query-compiler.js'
import {
  AbortableOperationOptions,
  assertNotAborted,
  waitOrAbort,
} from '../util/abort.js'
import { Deferred } from '../util/deferred.js'
import { Log } from '../util/log.js'
import { performanceNow } from '../util/performance-now.js'
import { ConnectionMutex } from './connection-mutex.js'
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
  #initDone: boolean
  #destroyPromise?: Promise<void>
  #connections = new WeakSet<DatabaseConnection>()
  #connectionMutex?: ConnectionMutex

  constructor(driver: Driver, adapter: DialectAdapter, log: Log) {
    this.#driver = driver
    this.#initDone = false
    this.#log = log

    if (adapter.supportsMultipleConnections === false) {
      this.#connectionMutex = new ConnectionMutex()
    }
  }

  async init(options?: AbortableOperationOptions): Promise<void> {
    if (this.#destroyPromise) {
      throw new Error('driver has already been destroyed')
    }

    if (!this.#initPromise) {
      this.#initPromise = this.#driver
        .init(options)
        .then(() => {
          this.#initDone = true
        })
        .catch((err) => {
          this.#initPromise = undefined
          return Promise.reject(err)
        })
    }

    await this.#initPromise
  }

  async acquireConnection(
    options?: AbortableOperationOptions,
  ): Promise<DatabaseConnection> {
    if (this.#destroyPromise) {
      throw new Error('driver has already been destroyed')
    }

    const { signal } = options || {}

    if (!this.#initDone) {
      assertNotAborted(signal, 'before acquireConnection:init')

      await this.init(options)
    }

    if (this.#connectionMutex) {
      assertNotAborted(signal, 'before acquireConnection:mutex')

      await this.#connectionMutex.lock(options)
    }

    assertNotAborted(signal, 'before acquireConnction:acquire')

    const connection = await this.#driver.acquireConnection(options)

    if (!this.#connections.has(connection)) {
      if (this.#needsLogging()) {
        this.#addLogging(connection)
      }

      this.#connections.add(connection)
    }

    return connection
  }

  async releaseConnection(
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ): Promise<void> {
    await this.#driver.releaseConnection(connection, options)

    this.#connectionMutex?.unlock()
  }

  beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
    options?: AbortableOperationOptions,
  ): Promise<void> {
    return this.#driver.beginTransaction(connection, settings, options)
  }

  commitTransaction(
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ): Promise<void> {
    return this.#driver.commitTransaction(connection, options)
  }

  rollbackTransaction(
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ): Promise<void> {
    return this.#driver.rollbackTransaction(connection, options)
  }

  savepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: AbortableOperationOptions,
  ): Promise<void> {
    if (this.#driver.savepoint) {
      return this.#driver.savepoint(
        connection,
        savepointName,
        compileQuery,
        options,
      )
    }

    throw new Error('The `savepoint` method is not supported by this driver')
  }

  rollbackToSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: AbortableOperationOptions,
  ): Promise<void> {
    if (this.#driver.rollbackToSavepoint) {
      return this.#driver.rollbackToSavepoint(
        connection,
        savepointName,
        compileQuery,
        options,
      )
    }

    throw new Error(
      'The `rollbackToSavepoint` method is not supported by this driver',
    )
  }

  releaseSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: AbortableOperationOptions,
  ): Promise<void> {
    if (this.#driver.releaseSavepoint) {
      return this.#driver.releaseSavepoint(
        connection,
        savepointName,
        compileQuery,
        options,
      )
    }

    throw new Error(
      'The `releaseSavepoint` method is not supported by this driver',
    )
  }

  async destroy(options?: AbortableOperationOptions): Promise<void> {
    if (!this.#initPromise) {
      return
    }

    await waitOrAbort(this.#initPromise, options?.signal, 'destroy:initPromise')

    if (!this.#destroyPromise) {
      this.#destroyPromise = this.#driver.destroy(options).catch((err) => {
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
    const streamQuery = connection.streamQuery
    const dis = this

    connection.executeQuery = async (
      compiledQuery,
      options,
    ): Promise<QueryResult<any>> => {
      let caughtError: unknown
      const startTime = performanceNow()

      try {
        return await executeQuery.call(connection, compiledQuery, options)
      } catch (error) {
        caughtError = error
        await dis.#logError(error, compiledQuery, startTime)
        throw error
      } finally {
        if (!caughtError) {
          await dis.#logQuery(compiledQuery, startTime)
        }
      }
    }

    connection.streamQuery = async function* (
      compiledQuery,
      chunkSize,
      options,
    ): AsyncIterableIterator<QueryResult<any>> {
      let caughtError: unknown
      const startTime = performanceNow()

      try {
        for await (const result of streamQuery.call(
          connection,
          compiledQuery,
          chunkSize,
          options,
        )) {
          yield result
        }
      } catch (error) {
        caughtError = error
        await dis.#logError(error, compiledQuery, startTime)
        throw error
      } finally {
        if (!caughtError) {
          await dis.#logQuery(compiledQuery, startTime, true)
        }
      }
    }
  }

  async #logError(
    error: unknown,
    compiledQuery: CompiledQuery,
    startTime: number,
  ): Promise<void> {
    await this.#log.error(() => ({
      level: 'error',
      error,
      query: compiledQuery,
      queryDurationMillis: this.#calculateDurationMillis(startTime),
    }))
  }

  async #logQuery(
    compiledQuery: CompiledQuery,
    startTime: number,
    isStream = false,
  ): Promise<void> {
    await this.#log.query(() => ({
      level: 'query',
      isStream,
      query: compiledQuery,
      queryDurationMillis: this.#calculateDurationMillis(startTime),
    }))
  }

  #calculateDurationMillis(startTime: number): number {
    return performanceNow() - startTime
  }
}
