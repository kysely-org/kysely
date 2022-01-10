import { Database, Options as DatabaseOptions } from 'better-sqlite3'

import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'

import { Driver } from '../../driver/driver.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { isBoolean, isFunction, isNumber } from '../../util/object-utils.js'
import { SqliteDialectConfig } from './sqlite-dialect-config.js'

export class SqliteDriver implements Driver {
  readonly #config: SqliteDialectConfig
  readonly #connectionMutex = new ConnectionMutex()

  #db?: Database
  #connection?: DatabaseConnection

  constructor(config: SqliteDialectConfig) {
    this.#config = config
  }

  async init(): Promise<void> {
    // Import the `better-sqlite3` module here instead at the top of the file
    // so that this file can be loaded by node without `better-sqlite3` driver
    // installed. As you can see, there IS an import from `better-sqlite3` at
    // the top level too, but that's only for types. It doesn't get compiled
    // into javascript. You can check the built javascript code.
    const DatabaseConstructor = await importBetterSqlite3Database()

    const options: DatabaseOptions = {}

    if (isBoolean(this.#config.readonly)) {
      options.readonly = this.#config.readonly
    }

    if (isBoolean(this.#config.fileMustExist)) {
      options.fileMustExist = this.#config.fileMustExist
    }

    if (isNumber(this.#config.timeout)) {
      options.timeout = this.#config.timeout
    }

    if (isFunction(this.#config.verbose)) {
      options.verbose = this.#config.verbose
    }

    this.#db = new DatabaseConstructor(this.#config.databasePath, options)
    this.#connection = new SqliteConnection(this.#db)

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection)
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.#connectionMutex.lock()
    return this.#connection!
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock()
  }

  async destroy(): Promise<void> {
    this.#db?.close()
  }
}

type DatabaseConstructor = new (
  fileName: string,
  options: DatabaseOptions
) => Database

async function importBetterSqlite3Database(): Promise<DatabaseConstructor> {
  try {
    // The imported module name must be a string literal to make
    // some bundlers work. So don't move this code behind a helper
    // for example.
    const sqliteModule: any = await import('better-sqlite3')

    if (isFunction(sqliteModule)) {
      return sqliteModule
    } else {
      return sqliteModule.default
    }
  } catch (error) {
    throw new Error(
      'SQLite client not installed. Please run `npm install better-sqlite3`'
    )
  }
}

class SqliteConnection implements DatabaseConnection {
  readonly #db: Database

  constructor(db: Database) {
    this.#db = db
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery
    const stmt = this.#db.prepare(sql)

    if (stmt.reader) {
      return Promise.resolve({
        rows: stmt.all(parameters),
      })
    } else {
      const { changes, lastInsertRowid } = stmt.run(parameters)

      return Promise.resolve({
        numUpdatedOrDeletedRows:
          changes !== undefined && changes !== null
            ? BigInt(changes)
            : undefined,
        insertId:
          lastInsertRowid !== undefined && lastInsertRowid !== null
            ? BigInt(lastInsertRowid)
            : undefined,
        rows: [],
      })
    }
  }
}

class ConnectionMutex {
  #promise?: Promise<void>
  #resolve?: () => void

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })
  }

  unlock(): void {
    const resolve = this.#resolve

    this.#promise = undefined
    this.#resolve = undefined

    resolve?.()
  }
}
