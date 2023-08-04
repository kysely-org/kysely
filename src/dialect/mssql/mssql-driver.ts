import { Pool } from 'tarn'
import { ColumnValue, Connection, Request } from 'tedious'
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
import { MssqlDialectConfig, Tedious } from './mssql-dialect-config.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import { randomString } from '../../util/random-string.js'

const PRIVATE_RELEASE_METHOD = Symbol()
const PRIVATE_DESTROY_METHOD = Symbol()

export class MssqlDriver implements Driver {
  readonly #config: MssqlDialectConfig
  readonly #pool: Pool<MssqlConnection>

  constructor(config: MssqlDialectConfig) {
    this.#config = freeze({ ...config })

    this.#pool = new this.#config.Tarn.Pool({
      ...this.#config.Tarn.options,
      create: async () => {
        const connection = await this.#config.connectionFactory()

        await new Promise((resolve, reject) =>
          connection.connect((error) => {
            if (error) reject(error)
            else resolve(undefined)
          })
        )

        return new MssqlConnection(connection, this.#config.Tedious)
      },
      destroy: async (connection) => {
        await connection[PRIVATE_DESTROY_METHOD]()
      },
      // @ts-ignore
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
    settings: TransactionSettings
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
  readonly #connection: Connection
  readonly #tedious: Tedious

  constructor(connection: Connection, tedious: Tedious) {
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
          : undefined
      )
    )
  }

  async commitTransaction(): Promise<void> {
    await new Promise((resolve, reject) =>
      this.#connection.commitTransaction((error) => {
        if (error) reject(error)
        else resolve(undefined)
      })
    )
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const { rowCount, rows } = await new Promise<{
        rows: O[]
        rowCount: number
      }>((resolve, reject) =>
        this.#connection.execSql(
          this.#createTediousRequest(compiledQuery, reject, resolve)
        )
      )

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
      })
    )
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    // const request = this.#createMssqlRequest(this.#request, compiledQuery)
    // request.stream = true

    // const cursor = new MssqlCursor<O>(request)

    // try {
    //   request.query(compiledQuery.sql)

    //   while (true) {
    //     const rows = await cursor.read(chunkSize)

    //     if (rows.length === 0) {
    //       break
    //     }

    //     yield {
    //       rows: rows,
    //     }
    //   }
    // } finally {
    //   request.cancel()
    // }
  }

  validate(): Promise<boolean> {
    return new Promise((resolve) =>
      this.#connection.execSql(
        this.#createTediousRequest(
          CompiledQuery.raw('select 1'),
          () => resolve(false),
          () => resolve(true)
        )
      )
    )
  }

  #createTediousRequest(
    compiledQuery: CompiledQuery,
    reject: (reason?: any) => void,
    resolve: (value: any) => void
  ): Request {
    const { parameters, query, sql } = compiledQuery

    let promisedRowCount: number | undefined
    const rows: Record<string, unknown>[] = []

    const request = new this.#tedious.Request(sql, (err, rowCount) => {
      if (err) {
        if (err instanceof AggregateError) {
          reject(err.errors)
        } else {
          reject(err)
        }
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
        rowCount: promisedRowCount,
      })
    })

    return request
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

  #getTediousIsolationLevel(isolationLevel: IsolationLevel) {
    const { ISOLATION_LEVEL } = this.#tedious

    const mapper: Record<
      IsolationLevel,
      (typeof ISOLATION_LEVEL)[keyof typeof ISOLATION_LEVEL]
    > = {
      [isolationLevel]: ISOLATION_LEVEL.NO_CHANGE,
      'read committed': ISOLATION_LEVEL.READ_COMMITTED,
      'read uncommitted': ISOLATION_LEVEL.READ_UNCOMMITTED,
      'repeatable read': ISOLATION_LEVEL.REPEATABLE_READ,
      serializable: ISOLATION_LEVEL.SERIALIZABLE,
      snapshot: ISOLATION_LEVEL.SNAPSHOT,
    }

    return mapper[isolationLevel] || undefined
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

// class MssqlCursor<O> {
//   readonly #request: Request
//   readonly #chunk: O[] = []

//   constructor(request: Request) {
//     this.#request = request
//   }

//   async read(chunkSize: number): Promise<O[]> {
//     if (this.#chunk.length >= chunkSize) {
//       return this.#chunk.splice(0, chunkSize)
//     }

//     return new Promise<O[]>((resolve, reject) => {
//       const rowListener = (row: O) => {
//         this.#chunk.push(row)

//         if (this.#chunk.length >= chunkSize) {
//           this.#request.pause()
//           this.#request.off('row', rowListener)
//           resolve(this.#chunk.splice(0, chunkSize))
//         }
//       }

//       this.#request.on('row', rowListener)

//       this.#request.once('error', reject)

//       this.#request.once('done', () => {
//         if (this.#chunk.length < chunkSize) {
//           resolve(this.#chunk)
//         }
//       })

//       this.#request.resume()
//     })
//   }
// }
