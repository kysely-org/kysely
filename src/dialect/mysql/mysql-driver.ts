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
import {
  isFunction,
  isNumber,
  isObject,
  isString,
} from '../../util/object-utils.js'
import { MysqlDialectConfig } from './mysql-dialect.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class MysqlDriver implements Driver {
  readonly #config: MysqlDialectConfig
  readonly #connections = new WeakMap<PoolConnection, DatabaseConnection>()
  #pool?: Pool

  constructor(config: MysqlDialectConfig) {
    this.#config = config
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
      // On mysql this sets the isolation level of the next transaction.
      await connection.executeQuery({
        sql: `set transaction isolation level ${settings.isolationLevel}`,
        parameters: [],
      })
    }

    await connection.executeQuery({ sql: 'begin', parameters: [] })
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({ sql: 'commit', parameters: [] })
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({ sql: 'rollback', parameters: [] })
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

async function importMysqlPoolFactory(): Promise<
  (config: PoolOptions) => Pool
> {
  try {
    // For this to work with both esm and cjs modules we need
    // this hacky crap here.
    const mysql = (await import('mysql2')) as any

    if (isFunction(mysql.createPool)) {
      return mysql.createPool
    } else {
      // With esm the imported module doesn't match the typings.
      return mysql.default.createPool
    }
  } catch (error) {
    throw new Error(
      'Mysql client not installed. Please run `npm install mysql2`'
    )
  }
}

class MysqlConnection implements DatabaseConnection {
  readonly #rawConnection: PoolConnection

  constructor(rawConnection: PoolConnection) {
    this.#rawConnection = rawConnection
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.#executeQuery(compiledQuery)

    if (isObject(result) && 'insertId' in result && 'affectedRows' in result) {
      if (isNumber(result.insertId) && result.insertId > 0) {
        return {
          insertedPrimaryKey: result.insertId,
          rows: [],
        }
      } else if (isNumber(result.affectedRows)) {
        return {
          numUpdatedOrDeletedRows: result.affectedRows,
          rows: [],
        }
      }
    } else if (Array.isArray(result)) {
      return {
        rows: result as O[],
      }
    }

    return {
      rows: [],
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
