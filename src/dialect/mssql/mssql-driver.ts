import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import {
  Driver,
  IsolationLevel,
  TransactionSettings,
} from '../../driver/driver.js'
import {
  freeze,
  isBigInt,
  isBoolean,
  isBuffer,
  isDate,
  isNull,
  isNumber,
  isString,
  isUndefined,
} from '../../util/object-utils.js'
import {
  MssqlDialectConfig,
  TarnPool,
  Tedious,
  TediousColumnValue,
  TediousConnection,
  TediousRequest,
} from './mssql-dialect-config.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import { randomString } from '../../util/random-string.js'
import { Deferred } from '../../util/deferred.js'

const PRIVATE_RELEASE_METHOD = Symbol()
const PRIVATE_DESTROY_METHOD = Symbol()

export class MssqlDriver implements Driver {
  readonly #config: MssqlDialectConfig
  readonly #pool: TarnPool<MssqlConnection>

  constructor(config: MssqlDialectConfig) {
    this.#config = freeze({ ...config })

    this.#pool = new this.#config.tarn.Pool({
      ...this.#config.tarn.options,
      create: async () => {
        const connection = await this.#config.tedious.connectionFactory()

        await new Promise((resolve, reject) =>
          connection.connect((error) => {
            if (error) reject(error)
            else resolve(undefined)
          }),
        )

        return new MssqlConnection(connection, this.#config.tedious)
      },
      destroy: async (connection) => {
        await connection[PRIVATE_DESTROY_METHOD]()
      },
      // @ts-ignore `tarn` accepts a function that returns a promise here, but
      // the types are not aligned and it type errors.
      validate: (connection) => connection.validate(),
    })
  }

  async init(): Promise<void> {
    // noop
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return await this.#pool.acquire().promise
  }

  async beginTransaction(
    connection: MssqlConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    await connection.beginTransaction(settings)
  }

  async commitTransaction(connection: MssqlConnection): Promise<void> {
    await connection.commitTransaction()
  }

  async rollbackTransaction(connection: MssqlConnection): Promise<void> {
    await connection.rollbackTransaction()
  }

  async releaseConnection(connection: MssqlConnection): Promise<void> {
    await connection[PRIVATE_RELEASE_METHOD]()
    this.#pool.release(connection)
  }

  async destroy(): Promise<void> {
    await this.#pool.destroy()
  }
}

class MssqlConnection implements DatabaseConnection {
  readonly #connection: TediousConnection
  readonly #tedious: Tedious

  constructor(connection: TediousConnection, tedious: Tedious) {
    this.#connection = connection
    this.#tedious = tedious
  }

  async beginTransaction(settings: TransactionSettings): Promise<void> {
    const { isolationLevel } = settings

    await new Promise((resolve, reject) =>
      this.#connection.beginTransaction(
        (error) => {
          if (error) reject(error)
          else resolve(undefined)
        },
        isolationLevel ? randomString(8) : undefined,
        isolationLevel
          ? this.#getTediousIsolationLevel(isolationLevel)
          : undefined,
      ),
    )
  }

  async commitTransaction(): Promise<void> {
    await new Promise((resolve, reject) =>
      this.#connection.commitTransaction((error) => {
        if (error) reject(error)
        else resolve(undefined)
      }),
    )
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const deferred = new Deferred<OnDone<O>>()

      const request = new MssqlRequest<O>(
        this.#tedious,
        compiledQuery,
        deferred,
      )

      this.#connection.execSql(request.request)

      const { rowCount, rows } = await deferred.promise

      return {
        numAffectedRows: rowCount !== undefined ? BigInt(rowCount) : undefined,
        rows,
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async rollbackTransaction(): Promise<void> {
    await new Promise((resolve, reject) =>
      this.#connection.rollbackTransaction((error) => {
        if (error) reject(error)
        else resolve(undefined)
      }),
    )
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    const request = new MssqlRequest<O>(this.#tedious, compiledQuery)

    this.#connection.execSql(request.request)

    try {
      while (true) {
        const rows = await request.readChunk(chunkSize)

        if (rows.length === 0) {
          break
        }

        yield { rows }

        if (rows.length < chunkSize) {
          break
        }
      }
    } finally {
      this.#connection.cancel()
    }
  }

  async validate(): Promise<boolean> {
    try {
      const deferred = new Deferred<OnDone<unknown>>()

      const request = new MssqlRequest<unknown>(
        this.#tedious,
        CompiledQuery.raw('select 1'),
        deferred,
      )

      this.#connection.execSql(request.request)

      await deferred.promise

      return true
    } catch {
      return false
    }
  }

  #getTediousIsolationLevel(isolationLevel: IsolationLevel) {
    const { ISOLATION_LEVEL } = this.#tedious

    const mapper: Record<
      IsolationLevel,
      (typeof ISOLATION_LEVEL)[keyof typeof ISOLATION_LEVEL]
    > = {
      'read committed': ISOLATION_LEVEL.READ_COMMITTED,
      'read uncommitted': ISOLATION_LEVEL.READ_UNCOMMITTED,
      'repeatable read': ISOLATION_LEVEL.REPEATABLE_READ,
      serializable: ISOLATION_LEVEL.SERIALIZABLE,
      snapshot: ISOLATION_LEVEL.SNAPSHOT,
    }

    const tediousIsolationLevel = mapper[isolationLevel]

    if (tediousIsolationLevel === undefined) {
      throw new Error(`Unknown isolation level: ${isolationLevel}`)
    }

    return tediousIsolationLevel
  }

  [PRIVATE_RELEASE_METHOD](): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#connection.reset((error) => {
        if (error) reject(error)
        else resolve(undefined)
      })
    })
  }

  [PRIVATE_DESTROY_METHOD](): Promise<void> {
    return new Promise((resolve) => {
      this.#connection.once('end', () => {
        resolve(undefined)
      })

      this.#connection.close()
    })
  }
}

interface OnDone<O> {
  rowCount: number | undefined
  rows: O[]
}

interface PlainDeferred<O> {
  reject: (reason: any) => void
  resolve: (value?: O) => void
}

class MssqlRequest<O> {
  readonly #request: TediousRequest
  readonly #rows: O[]
  readonly #tedious: Tedious
  #completed: boolean
  #error: Error | any[] | undefined
  #rowCount: number | undefined

  constructor(
    tedious: Tedious,
    compiledQuery: CompiledQuery,
    onDone?: Deferred<OnDone<O>> | PlainDeferred<OnDone<O>>,
  ) {
    this.#completed = false
    this.#rows = []
    this.#tedious = tedious

    const { parameters, sql } = compiledQuery

    this.#request = new this.#tedious.Request(sql, (err, rowCount) => {
      if (err) {
        this.#error = err instanceof AggregateError ? err.errors : err
        onDone?.reject(this.#error)
      } else {
        this.#rowCount = rowCount
      }
    })

    this.#addParametersToRequest(parameters)
    this.#attachListeners(onDone)
  }

  get request(): TediousRequest {
    return this.#request
  }

  readChunk(chunkSize: number): Promise<O[]> {
    return new Promise<O[]>((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.#error) {
          clearInterval(interval)
          reject(this.#error)
        } else if (this.#completed || this.#rows.length >= chunkSize) {
          clearInterval(interval)
          resolve(this.#rows.splice(0, chunkSize))
        }
      }, 0)
    })
  }

  #addParametersToRequest(parameters: readonly unknown[]): void {
    for (let i = 0; i < parameters.length; i++) {
      const parameter = parameters[i]

      this.#request.addParameter(
        String(i + 1),
        this.#getTediousDataType(parameter),
        parameter,
      )
    }
  }

  #attachListeners(
    onDone: Deferred<OnDone<O>> | PlainDeferred<OnDone<O>> | undefined,
  ): void {
    const rowListener = (columns: TediousColumnValue[]) => {
      const row: Record<string, unknown> = {}

      for (const column of columns) {
        row[column.metadata.colName] = column.value
      }

      this.#rows.push(row as O)
    }

    this.#request.on('row', rowListener)

    this.#request.once('requestCompleted', () => {
      this.#completed = true
      this.#request.off('row', rowListener)

      onDone?.resolve({
        rowCount: this.#rowCount,
        rows: this.#rows,
      })
    })
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
}
