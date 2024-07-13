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

    const { tarn, tedious } = this.#config
    const { validateConnections, ...poolOptions } = tarn.options

    this.#pool = new tarn.Pool({
      ...poolOptions,
      create: async () => {
        const connection = await tedious.connectionFactory()

        return await new MssqlConnection(connection, tedious).connect()
      },
      destroy: async (connection) => {
        await connection[PRIVATE_DESTROY_METHOD]()
      },
      // @ts-ignore `tarn` accepts a function that returns a promise here, but
      // the types are not aligned and it type errors.
      validate:
        validateConnections === false
          ? undefined
          : (connection) => connection.validate(),
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

    this.#connection.on('error', console.error)
    this.#connection.once('end', () => {
      this.#connection.off('error', console.error)
    })
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

  async connect(): Promise<this> {
    await new Promise((resolve, reject) => {
      this.#connection.connect((error) => {
        if (error) {
          console.error(error)
          reject(error)
        } else {
          resolve(undefined)
        }
      })
    })

    return this
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const deferred = new Deferred<OnDone<O>>()

      const request = new MssqlRequest<O>({
        compiledQuery,
        tedious: this.#tedious,
        onDone: deferred,
      })

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

    const request = new MssqlRequest<O>({
      compiledQuery,
      streamChunkSize: chunkSize,
      tedious: this.#tedious,
    })

    this.#connection.execSql(request.request)

    try {
      while (true) {
        const rows = await request.readChunk()

        if (rows.length === 0) {
          break
        }

        yield { rows }

        if (rows.length < chunkSize) {
          break
        }
      }
    } finally {
      await this.#cancelRequest(request)
    }
  }

  async validate(): Promise<boolean> {
    try {
      const deferred = new Deferred<OnDone<unknown>>()

      const request = new MssqlRequest<unknown>({
        compiledQuery: CompiledQuery.raw('select 1'),
        onDone: deferred,
        tedious: this.#tedious,
      })

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

  #cancelRequest<O>(request: MssqlRequest<O>): Promise<void> {
    return new Promise((resolve) => {
      request.request.once('requestCompleted', resolve)

      const wasCanceled = this.#connection.cancel()

      if (!wasCanceled) {
        request.request.off('requestCompleted', resolve)
        resolve(undefined)
      }
    })
  }

  async [PRIVATE_RELEASE_METHOD](): Promise<void> {
    // TODO: flip this to `if (!this.#tedious.resetConnectionOnRelease) {}` in a future PR.
    if (this.#tedious.resetConnectionOnRelease !== false) {
      await new Promise((resolve, reject) => {
        this.#connection.reset((error) => {
          if (error) reject(error)
          else resolve(undefined)
        })
      })
    }
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
  readonly #streamChunkSize: number | undefined
  readonly #subscribers: Record<
    string,
    (event: 'completed' | 'chunkReady' | 'error', error?: unknown) => void
  >
  readonly #tedious: Tedious
  #error: Error | any[] | undefined
  #rowCount: number | undefined

  constructor(props: MssqlRequestProps<O>) {
    const { compiledQuery, onDone, streamChunkSize, tedious } = props

    this.#rows = []
    this.#streamChunkSize = streamChunkSize
    this.#subscribers = {}
    this.#tedious = tedious

    if (onDone) {
      const subscriptionKey = 'onDone'

      this.#subscribers[subscriptionKey] = (event, error) => {
        if (event === 'chunkReady') {
          return
        }

        delete this.#subscribers[subscriptionKey]

        if (event === 'error') {
          onDone.reject(error)
        } else {
          onDone.resolve({
            rowCount: this.#rowCount,
            rows: this.#rows,
          })
        }
      }
    }

    this.#request = new this.#tedious.Request(
      compiledQuery.sql,
      (err, rowCount) => {
        if (err) {
          Object.values(this.#subscribers).forEach((subscriber) =>
            subscriber(
              'error',
              err instanceof AggregateError ? err.errors : err,
            ),
          )
        } else {
          this.#rowCount = rowCount
        }
      },
    )

    this.#addParametersToRequest(compiledQuery.parameters)
    this.#attachListeners()
  }

  get request(): TediousRequest {
    return this.#request
  }

  readChunk(): Promise<O[]> {
    const subscriptionKey = this.readChunk.name

    return new Promise<O[]>((resolve, reject) => {
      this.#subscribers[subscriptionKey] = (event, error) => {
        delete this.#subscribers[subscriptionKey]

        if (event === 'error') {
          reject(error)
        } else {
          resolve(this.#rows.splice(0, this.#streamChunkSize))
        }
      }

      this.#request.resume()
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

  #attachListeners(): void {
    const pauseAndEmitChunkReady = this.#streamChunkSize
      ? () => {
          if (this.#streamChunkSize! <= this.#rows.length) {
            this.#request.pause()

            Object.values(this.#subscribers).forEach((subscriber) =>
              subscriber('chunkReady'),
            )
          }
        }
      : () => {}

    const rowListener = (columns: TediousColumnValue[]) => {
      const row: Record<string, unknown> = {}

      for (const column of columns) {
        row[column.metadata.colName] = column.value
      }

      this.#rows.push(row as O)

      pauseAndEmitChunkReady()
    }

    this.#request.on('row', rowListener)

    this.#request.once('requestCompleted', () => {
      Object.values(this.#subscribers).forEach((subscriber) =>
        subscriber('completed'),
      )
      this.#request.off('row', rowListener)
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

interface MssqlRequestProps<O> {
  compiledQuery: CompiledQuery
  onDone?: Deferred<OnDone<O>> | PlainDeferred<OnDone<O>>
  streamChunkSize?: number
  tedious: Tedious
}
