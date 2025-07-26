import {
  ControlConnectionProvider,
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { isFunction, isObject, freeze } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import {
  MysqlDialectConfig,
  MysqlOkPacket,
  MysqlPool,
  MysqlPoolConnection,
  MysqlQueryResult,
} from './mysql-dialect-config.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class MysqlDriver implements Driver {
  readonly #config: MysqlDialectConfig
  readonly #connections = new WeakMap<MysqlPoolConnection, DatabaseConnection>()
  #pool?: MysqlPool

  constructor(configOrPool: MysqlDialectConfig) {
    this.#config = freeze({ ...configOrPool })
  }

  async init(): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool()
      : this.#config.pool
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const rawConnection = await this.#acquireConnection()
    let connection = this.#connections.get(rawConnection)

    if (!connection) {
      connection = new MysqlConnection(
        rawConnection,
        this.#config.createConnection,
      )
      this.#connections.set(rawConnection, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `mysql2` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config?.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    if (this.#config?.onReserveConnection) {
      await this.#config.onReserveConnection(connection)
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
    return new Promise((resolve, reject) => {
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
  readonly #createConnection: MysqlDialectConfig['createConnection']
  readonly #rawConnection: MysqlPoolConnection

  constructor(
    rawConnection: MysqlPoolConnection,
    createConnection: MysqlDialectConfig['createConnection'],
  ) {
    this.#createConnection = createConnection
    this.#rawConnection = rawConnection
  }

  async cancelQuery(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    try {
      // this removes the connection from the pool.
      // this is done to avoid picking it up after the `kill` command next, which
      // would cause an error when attempting to query.
      this.#rawConnection.destroy()
    } catch {
      // noop
    }

    const { config, threadId } = this.#rawConnection

    // this kills the query and the connection database-side.
    // we're not using `kill query <connection_id>` here because it doesn't
    // guarantee that the query is killed immediately. we saw that in tests,
    // the query can still run for a while after - including registering writes.
    const cancelQuery = `kill connection ${threadId}`

    if (this.#createConnection && config) {
      const controlConnection = await this.#createConnection({ ...config })

      return await new Promise((resolve, reject) => {
        controlConnection.connect((connectError) => {
          if (connectError) {
            return reject(connectError)
          }

          controlConnection.query(cancelQuery, [], (error) => {
            controlConnection.destroy()

            if (error) {
              return reject(error)
            }

            resolve()
          })
        })
      })
    }

    await controlConnectionProvider(async (controlConnection) => {
      await controlConnection.executeQuery(CompiledQuery.raw(cancelQuery, []))
    })
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#executeQuery(compiledQuery)

      if (!isOkPacket(result)) {
        return {
          rows: (Array.isArray(result) ? result : []) as never,
        }
      }

      const { insertId, affectedRows, changedRows } = result

      return {
        insertId:
          insertId !== undefined &&
          insertId !== null &&
          insertId.toString() !== '0'
            ? BigInt(insertId)
            : undefined,
        numAffectedRows:
          affectedRows !== undefined && affectedRows !== null
            ? BigInt(affectedRows)
            : undefined,
        numChangedRows:
          changedRows !== undefined && changedRows !== null
            ? BigInt(changedRows)
            : undefined,
        rows: [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    const stream = this.#rawConnection
      .query(compiledQuery.sql, compiledQuery.parameters)
      .stream<O>({ objectMode: true })

    try {
      for await (const row of stream) {
        yield {
          rows: [row],
        }
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ERR_STREAM_PREMATURE_CLOSE'
      ) {
        // Most likely because of https://github.com/mysqljs/mysql/blob/master/lib/protocol/sequences/Query.js#L220
        return
      }

      throw error
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#rawConnection.release()
  }

  #executeQuery(compiledQuery: CompiledQuery): Promise<MysqlQueryResult> {
    return new Promise((resolve, reject) => {
      this.#rawConnection.query(
        compiledQuery.sql,
        compiledQuery.parameters,
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
}
