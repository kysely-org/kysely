import type {
  ControlConnectionProvider,
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type { AbortableOperationOptions } from '../../util/abort.js'
import { isFunction, isObject, freeze } from '../../util/object-utils.js'
import { createQueryId, type QueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import type {
  MysqlDialectConfig,
  MysqlOkPacket,
  MysqlPool,
  MysqlPoolConnection,
  MysqlQueryResult,
} from './mysql-dialect-config.js'

const PRIVATE_RELEASE_METHOD: unique symbol = Symbol()

export class MysqlDriver implements Driver {
  readonly #config: MysqlDialectConfig
  readonly #connections = new WeakMap<MysqlPoolConnection, DatabaseConnection>()
  #pool?: MysqlPool

  constructor(config: MysqlDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(options?: AbortableOperationOptions): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool(options)
      : this.#config.pool
  }

  async acquireConnection(
    options?: AbortableOperationOptions,
  ): Promise<DatabaseConnection> {
    const rawConnection = await this.#acquireConnection()

    let connection = this.#connections.get(rawConnection)

    if (!connection) {
      connection = new MysqlConnection(
        rawConnection,
        this.#config.controlConnection,
      )
      this.#connections.set(rawConnection, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `mysql2` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config?.onCreateConnection) {
        await this.#config.onCreateConnection(connection, options)
      }
    }

    if (this.#config?.onReserveConnection) {
      await this.#config.onReserveConnection(connection, options)
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel || settings.accessMode) {
      const parts: string[] = []

      if (settings.isolationLevel) {
        parts.push(`isolation level ${settings.isolationLevel}`)
      }

      if (settings.accessMode) {
        parts.push(settings.accessMode)
      }

      const sql = `set transaction ${parts.join(', ')}`

      // On MySQL this sets the isolation level of the next transaction.
      await connection.executeQuery(CompiledQuery.raw(sql))
    }

    await connection.executeQuery(CompiledQuery.raw('begin'))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async savepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('savepoint', savepointName),
        createQueryId(),
      ),
    )
  }

  async rollbackToSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('rollback to', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('release savepoint', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseConnection(connection: MysqlConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }

  async destroy(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#pool!.end((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async #acquireConnection(): Promise<MysqlPoolConnection> {
    return new Promise<MysqlPoolConnection>((resolve, reject) => {
      this.#pool!.getConnection(async (err, rawConnection) => {
        if (err) {
          reject(err)
        } else {
          resolve(rawConnection)
        }
      })
    })
  }
}

function isOkPacket(obj: unknown): obj is MysqlOkPacket {
  return isObject(obj) && 'insertId' in obj && 'affectedRows' in obj
}

class MysqlConnection implements DatabaseConnection {
  readonly #connection: MysqlPoolConnection
  readonly #controlConnection: MysqlDialectConfig['controlConnection']
  #cid?: number
  #queryId?: QueryId

  constructor(
    connection: MysqlPoolConnection,
    controlConnection: MysqlDialectConfig['controlConnection'],
  ) {
    this.#connection = connection
    this.#controlConnection = controlConnection
  }

  async cancelQuery(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    await this.#executeControlQuery(
      `kill query ${this.#cid}`,
      controlConnectionProvider,
    )
  }

  async collectSessionInfo(): Promise<void> {
    if (this.#cid) {
      return
    }

    const { threadId } = this.#connection

    if (threadId != null) {
      this.#cid = threadId
    } else {
      const [{ cid }] = (await this.#executeQuery(
        CompiledQuery.raw(`select connection_id() as cid`),
      )) as never as [{ cid: string }]

      this.#cid = Number(cid)
    }
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      // this helps ensure we don't cancel the wrong query when aborted.
      this.#queryId = compiledQuery.queryId

      const result = await this.#executeQuery(compiledQuery)

      if (!isOkPacket(result)) {
        return {
          rows: (Array.isArray(result) ? result : []) as never,
        }
      }

      const { insertId, affectedRows, changedRows } = result

      return {
        insertId:
          insertId != null && insertId.toString() !== '0'
            ? BigInt(insertId)
            : undefined,
        numAffectedRows:
          affectedRows != null ? BigInt(affectedRows) : undefined,
        numChangedRows: changedRows != null ? BigInt(changedRows) : undefined,
        rows: [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    } finally {
      // this tells cancellation the query is no longer relevant.
      this.#queryId = undefined
    }
  }

  async killSession(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    try {
      // this removes the connection from the pool.
      // this is done to avoid picking it up after the `kill` command next, which
      // would cause an error when attempting to query.
      this.#connection.destroy()
    } catch {
      // noop
    }

    await this.#executeControlQuery(
      `kill connection ${this.#cid}`,
      controlConnectionProvider,
    )
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    // this helps ensure we don't cancel the wrong query when aborted.
    this.#queryId = compiledQuery.queryId

    const stream = this.#connection
      .query(compiledQuery.sql, compiledQuery.parameters as never)
      .stream({ objectMode: true })

    try {
      for await (const row of stream) {
        yield {
          rows: [row],
        }
      }
    } catch (error: unknown) {
      if (
        isObject(error) &&
        'code' in error &&
        // @ts-ignore
        error.code === 'ERR_STREAM_PREMATURE_CLOSE'
      ) {
        // Most likely because of https://github.com/mysqljs/mysql/blob/master/lib/protocol/sequences/Query.js#L220
        return
      }

      throw error
    } finally {
      // this tells cancellation the query is no longer relevant.
      this.#queryId = undefined
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#connection.release()
  }

  #executeQuery(compiledQuery: CompiledQuery): Promise<MysqlQueryResult> {
    return new Promise((resolve, reject) => {
      this.#connection.query(
        compiledQuery.sql,
        compiledQuery.parameters as never,
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        },
      )
    })
  }

  async #executeControlQuery(
    query: string,
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    if (!this.#queryId) {
      return
    }

    const { config } = this.#connection

    const queryIdToCancel = this.#queryId

    // we fallback to a pool connection, and execute a SQL query to cancel the
    // query. this is not ideal, as we might have to wait for an idle connection.
    if (!this.#controlConnection || !config) {
      return await controlConnectionProvider(async (controlConnection) => {
        // by the time we get the connection, another query might have been executed.
        // we need to ensure we're not canceling the wrong query.
        if (queryIdToCancel.queryId === this.#queryId?.queryId) {
          await controlConnection.executeQuery(CompiledQuery.raw(query, []))
        }
      })
    }

    const {
      // omitting these as they cause a warning and perhaps a future error when passed.
      clientFlags: _,
      maxPacketSize: __,
      ...cfg
    } = config as Record<string, unknown>

    const controlConnection = this.#controlConnection(cfg)

    try {
      await new Promise<void>((resolve, reject) => {
        controlConnection.connect((connectError) => {
          if (connectError) {
            return reject(connectError)
          }

          // by the time we get the connection, another query might have been executed.
          // we need to ensure we're not canceling the wrong query.
          if (queryIdToCancel.queryId !== this.#queryId?.queryId) {
            return resolve()
          }

          controlConnection.query(query, [], (queryError) => {
            if (queryError) {
              return reject(queryError)
            }

            resolve()
          })
        })
      })
    } finally {
      controlConnection.destroy()
    }
  }
}
