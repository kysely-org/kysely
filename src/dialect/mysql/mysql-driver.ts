import {
  Pool,
  PoolOptions,
  PoolConnection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from 'mysql2'
import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { isFunction, isObject, freeze } from '../../util/object-utils.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import { MysqlDialectConfig } from './mysql-dialect-config.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class MysqlDriver implements Driver {
  readonly #config: MysqlDialectConfig
  readonly #connections = new WeakMap<PoolConnection, DatabaseConnection>()
  #pool?: Pool

  constructor(config: MysqlDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    // Import the `mysql2` module here instead at the top of the file
    // so that this file can be loaded by node without `mysql2` driver
    // installed. As you can see, there IS an import from `mysql2` at the
    // top level too, but that's only for types. It doesn't get compiled
    // into javascript. You can check the built javascript code.
    const poolFactory = await importMysqlPoolFactory()

    // Use the `mysql2` module's own pool. All drivers should use the
    // pool provided by the database library if possible.
    this.#pool = poolFactory(this.#config)
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
      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    return connection
  }

  async #acquireConnection(): Promise<PoolConnection> {
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
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      // On MySQL this sets the isolation level of the next transaction.
      await connection.executeQuery(
        CompiledQuery.raw(
          `set transaction isolation level ${settings.isolationLevel}`
        )
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

  async releaseConnection(connection: DatabaseConnection): Promise<void> {
    const mysqlConnection = connection as MysqlConnection
    mysqlConnection[PRIVATE_RELEASE_METHOD]()
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

type CreatePool = (config: PoolOptions) => Pool

async function importMysqlPoolFactory(): Promise<CreatePool> {
  try {
    // The imported module name must be a string literal to make
    // some bundlers work. So don't move this code behind a helper
    // for example.
    const mysqlModule: any = await import('mysql2')

    if (isFunction(mysqlModule.createPool)) {
      return mysqlModule.createPool
    } else {
      return mysqlModule.default.createPool
    }
  } catch (error) {
    throw new Error(
      'MySQL client not installed. Please run `npm install mysql2`'
    )
  }
}

class MysqlConnection implements DatabaseConnection {
  readonly #rawConnection: PoolConnection

  constructor(rawConnection: PoolConnection) {
    this.#rawConnection = rawConnection
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#executeQuery(compiledQuery)

      if (isOkPacket(result)) {
        const { insertId, affectedRows } = result

        return {
          insertId:
            insertId !== undefined &&
            insertId !== null &&
            insertId.toString() !== '0'
              ? BigInt(insertId)
              : undefined,
          numUpdatedOrDeletedRows:
            affectedRows !== undefined && insertId !== null
              ? BigInt(affectedRows)
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

  #executeQuery(
    compiledQuery: CompiledQuery
  ): Promise<
    | RowDataPacket[][]
    | RowDataPacket[]
    | OkPacket
    | OkPacket[]
    | ResultSetHeader
  > {
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
        }
      )
    })
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#rawConnection.release()
  }
}

function isOkPacket(obj: unknown): obj is OkPacket {
  return isObject(obj) && 'insertId' in obj && 'affectedRows' in obj
}
