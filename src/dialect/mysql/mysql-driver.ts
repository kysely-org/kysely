import {
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
      connection = new MysqlConnection(rawConnection)
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

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel) {
      // On MySQL this sets the isolation level of the next transaction.
      await connection.executeQuery(
        CompiledQuery.raw(
          `set transaction isolation level ${settings.isolationLevel}`,
        ),
      )
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
}

function isOkPacket(obj: unknown): obj is MysqlOkPacket {
  return isObject(obj) && 'insertId' in obj && 'affectedRows' in obj
}

class MysqlConnection implements DatabaseConnection {
  readonly #rawConnection: MysqlPoolConnection

  constructor(rawConnection: MysqlPoolConnection) {
    this.#rawConnection = rawConnection
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#executeQuery(compiledQuery)

      if (isOkPacket(result)) {
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
      } else if (Array.isArray(result)) {
        return {
          rows: result as O[],
        }
      }

      return {
        rows: [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
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

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    const stream = this.#rawConnection
      .query(compiledQuery.sql, compiledQuery.parameters)
      .stream<O>({
        objectMode: true,
      })

    try {
      for await (const row of stream) {
        yield {
          rows: [row],
        }
      }
    } catch (ex) {
      if (
        ex &&
        typeof ex === 'object' &&
        'code' in ex &&
        // @ts-ignore
        ex.code === 'ERR_STREAM_PREMATURE_CLOSE'
      ) {
        // Most likely because of https://github.com/mysqljs/mysql/blob/master/lib/protocol/sequences/Query.js#L220
        return
      }

      throw ex
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#rawConnection.release()
  }
}
