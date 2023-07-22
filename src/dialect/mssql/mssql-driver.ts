import { Connection, ConnectionPool, Request } from 'mssql'
import type { ColumnValue, Request as TediousRequest } from 'tedious'
import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import {
  freeze,
  isBigInt,
  isBoolean,
  isBuffer,
  isDate,
  isFunction,
  isNull,
  isNumber,
  isString,
  isUndefined,
} from '../../util/object-utils.js'
import { MssqlDialectConfig, Tedious } from './mssql-dialect-config.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class MssqlDriver implements Driver {
  readonly #config: MssqlDialectConfig
  readonly #connections = new WeakMap<Connection, DatabaseConnection>()
  #pool?: ConnectionPool

  constructor(config: MssqlDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool()
      : this.#config.pool
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const pool = await this.#pool!.connect()
    const rawConnection = await pool.pool.acquire().promise

    let connection = this.#connections.get(rawConnection)

    if (!connection) {
      connection = new MssqlConnection(
        rawConnection,
        pool,
        this.#config.tedious
      )
      this.#connections.set(rawConnection, connection)

      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void> {
    // TODO: ...
    throw new Error('Not implemented')
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    // TODO: ...
    throw new Error('Not implemented')
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    // TODO: ...
    throw new Error('Not implemented')
  }

  async releaseConnection(connection: MssqlConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool
      this.#pool = undefined
      await pool.close()
    }
  }
}

class MssqlConnection implements DatabaseConnection {
  readonly #pool: ConnectionPool
  readonly #rawConnection: Connection
  readonly #tedious: Tedious

  constructor(
    rawConnection: Connection,
    pool: ConnectionPool,
    tedious: Tedious
  ) {
    this.#pool = pool
    this.#rawConnection = rawConnection
    this.#tedious = tedious
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const { rowCount, rows } = await new Promise<{
        rows: O[]
        rowCount: number
      }>((resolve, reject) =>
        this.#rawConnection.execSql(
          this.#createTediousRequest(compiledQuery, reject, resolve)
        )
      )

      return {
        numAffectedRows: BigInt(rowCount),
        rows,
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    const request = this.#createMssqlRequest(compiledQuery)
    request.stream = true

    const cursor = new MssqlCursor<O>(request)

    try {
      request.query(compiledQuery.sql)

      while (true) {
        const rows = await cursor.read(chunkSize)

        if (rows.length === 0) {
          break
        }

        yield {
          rows: rows,
        }
      }
    } finally {
      request.cancel()
    }
  }

  #createTediousRequest(
    compiledQuery: CompiledQuery,
    reject: (reason?: any) => void,
    resolve: (value: any) => void
  ): TediousRequest {
    const { parameters, sql } = compiledQuery

    let promisedRowCount: number | undefined
    const rows: Record<string, unknown>[] = []

    const request = new this.#tedious.Request(sql, (err, rowCount) => {
      if (err) {
        reject(err)
      } else {
        promisedRowCount = rowCount
      }
    })

    for (let i = 0; i < parameters.length; i++) {
      const parameter = parameters[i]

      request.addParameter(
        String(i + 1),
        this.#getTediousDataType(parameter),
        parameter
      )
    }

    const rowListener = (columns: ColumnValue[]) => {
      const row: Record<string, unknown> = {}

      for (const column of columns) {
        row[column.metadata.colName] = column.value
      }

      rows.push(row)
    }

    request.on('row', rowListener)

    request.once('requestCompleted', () => {
      request.off('row', rowListener)
      resolve({
        rows,
        rowCount: promisedRowCount!,
      })
    })

    return request
  }

  #createMssqlRequest(compiledQuery: CompiledQuery): Request {
    return compiledQuery.parameters.reduce(
      (request: Request, param, index) =>
        request.input(String(index + 1), param),
      this.#pool.request()
    )
  }

  #getTediousDataType(value: unknown): any {
    if (isNull(value) || isUndefined(value) || isString(value)) {
      return this.#tedious.TYPES.NVarChar
    }

    if (isBigInt(value) || (isNumber(value) && value % 1 === 0)) {
      if (value < -2147483648 || value > 2147483647) {
        return this.#tedious.TYPES.BigInt
      } else {
        return this.#tedious.TYPES.Int
      }
    }

    if (isNumber(value)) {
      return this.#tedious.TYPES.Float
    }

    if (isBoolean(value)) {
      return this.#tedious.TYPES.Bit
    }

    if (isDate(value)) {
      return this.#tedious.TYPES.DateTime
    }

    if (isBuffer(value)) {
      return this.#tedious.TYPES.VarBinary
    }

    return this.#tedious.TYPES.NVarChar
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#pool.pool.release(this.#rawConnection)
  }
}

class MssqlCursor<O> {
  readonly #request: Request
  readonly #chunk: O[] = []

  constructor(request: Request) {
    this.#request = request
  }

  async read(chunkSize: number): Promise<O[]> {
    if (this.#chunk.length >= chunkSize) {
      return this.#chunk.splice(0, chunkSize)
    }

    return new Promise<O[]>((resolve, reject) => {
      const rowListener = (row: O) => {
        this.#chunk.push(row)

        if (this.#chunk.length >= chunkSize) {
          this.#request.pause()
          this.#request.off('row', rowListener)
          resolve(this.#chunk.splice(0, chunkSize))
        }
      }

      this.#request.on('row', rowListener)

      this.#request.once('error', reject)

      this.#request.once('done', () => {
        if (this.#chunk.length < chunkSize) {
          resolve(this.#chunk)
        }
      })

      this.#request.resume()
    })
  }
}
