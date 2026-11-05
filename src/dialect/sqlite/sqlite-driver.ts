import { AbortedTransactionError } from '../../driver/aborted-transaction-error.js'
import type {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver } from '../../driver/driver.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type { AbortableOperationOptions } from '../../util/abort.js'
import { freeze, isFunction } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import type {
  SqliteDatabase,
  SqliteDialectConfig,
} from './sqlite-dialect-config.js'

const PRIVATE_BEGIN_TRANSACTION_METHOD: unique symbol = Symbol()
const PRIVATE_COMMIT_TRANSACTION_METHOD: unique symbol = Symbol()
const PRIVATE_ROLLBACK_TRANSACTION_METHOD: unique symbol = Symbol()

export class SqliteDriver implements Driver {
  readonly #config: SqliteDialectConfig
  #db?: SqliteDatabase

  constructor(config: SqliteDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(options?: AbortableOperationOptions): Promise<void> {
    this.#db = isFunction(this.#config.database)
      ? await this.#config.database(options)
      : this.#config.database

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(
        new SqliteConnection(this.#db),
        options,
      )
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new SqliteConnection(this.#db!)
  }

  async beginTransaction(connection: SqliteConnection): Promise<void> {
    await connection[PRIVATE_BEGIN_TRANSACTION_METHOD]()
  }

  async commitTransaction(connection: SqliteConnection): Promise<void> {
    await connection[PRIVATE_COMMIT_TRANSACTION_METHOD]()
  }

  async rollbackTransaction(connection: SqliteConnection): Promise<void> {
    await connection[PRIVATE_ROLLBACK_TRANSACTION_METHOD]()
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
        parseSavepointCommand('release', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseConnection(): Promise<void> {
    // noop
  }

  async destroy(): Promise<void> {
    this.#db?.close()
  }
}

class SqliteConnection implements DatabaseConnection {
  readonly #db: SqliteDatabase
  #inTransaction: boolean

  constructor(db: SqliteDatabase) {
    this.#db = db
    this.#inTransaction = false
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    if (this.#inTransaction && this.#db.inTransaction === false) {
      throw new AbortedTransactionError()
    }

    const { sql, parameters } = compiledQuery

    const statement = this.#db.prepare(sql)

    try {
      if (statement.reader) {
        return {
          rows: statement.all(parameters) as O[],
        }
      }

      const { changes, lastInsertRowid } = statement.run(parameters)

      return {
        insertId: lastInsertRowid != null ? BigInt(lastInsertRowid) : undefined,
        numAffectedRows: changes != null ? BigInt(changes) : undefined,
        rows: [],
      }
    } catch (error) {
      if (this.#inTransaction && this.#db.inTransaction === false) {
        throw new AbortedTransactionError({ cause: error })
      }

      throw error
    }
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery

    const stmt = this.#db.prepare(sql)

    if (!SelectQueryNode.is(query)) {
      throw new Error('Sqlite driver only supports streaming of select queries')
    }

    const iter = stmt.iterate(parameters)

    for (const row of iter) {
      yield {
        rows: [row as R],
      }
    }
  }

  async [PRIVATE_BEGIN_TRANSACTION_METHOD](): Promise<void> {
    await this.executeQuery(CompiledQuery.raw('begin'))

    this.#inTransaction = true
  }

  async [PRIVATE_COMMIT_TRANSACTION_METHOD](): Promise<void> {
    await this.executeQuery(CompiledQuery.raw('commit'))

    this.#inTransaction = false
  }

  async [PRIVATE_ROLLBACK_TRANSACTION_METHOD](): Promise<void> {
    if (this.#db.inTransaction === false) {
      this.#inTransaction = false
      return
    }

    await this.executeQuery(CompiledQuery.raw('rollback'))

    this.#inTransaction = false
  }
}
