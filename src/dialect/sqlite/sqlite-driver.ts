import type {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver } from '../../driver/driver.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { freeze, isFunction } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import type {
  SqliteDatabase,
  SqliteDialectConfig,
} from './sqlite-dialect-config.js'

export class SqliteDriver implements Driver {
  readonly #config: SqliteDialectConfig

  #db?: SqliteDatabase
  #connection?: DatabaseConnection

  constructor(config: SqliteDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    this.#db = isFunction(this.#config.database)
      ? await this.#config.database()
      : this.#config.database

    this.#connection = new SqliteConnection(this.#db)

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection)
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
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

  constructor(db: SqliteDatabase) {
    this.#db = db
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery
    const stmt = this.#db.prepare(sql)

    if (stmt.reader) {
      return Promise.resolve({
        rows: stmt.all(parameters) as O[],
      })
    }

    const { changes, lastInsertRowid } = stmt.run(parameters)

    return Promise.resolve({
      numAffectedRows:
        changes !== undefined && changes !== null ? BigInt(changes) : undefined,
      insertId:
        lastInsertRowid !== undefined && lastInsertRowid !== null
          ? BigInt(lastInsertRowid)
          : undefined,
      rows: [],
    })
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery
    const stmt = this.#db.prepare(sql)
    if (SelectQueryNode.is(query)) {
      const iter = stmt.iterate(parameters) as IterableIterator<R>
      for (const row of iter) {
        yield {
          rows: [row],
        }
      }
    } else {
      throw new Error('Sqlite driver only supports streaming of select queries')
    }
  }
}
