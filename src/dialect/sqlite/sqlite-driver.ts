import type { DatabaseSync, StatementSync } from 'node:sqlite'

import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver } from '../../driver/driver.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { QueryCompiler, RootOperationNode } from '../../query-compiler/query-compiler.js'
import { freeze, isFunction } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { SqliteDialectConfig } from './sqlite-dialect-config.js'
import { QueryNode } from '../../operation-node/query-node.js'

export class SqliteDriver implements Driver {
  readonly #config: SqliteDialectConfig
  readonly #connectionMutex = new ConnectionMutex()

  #db?: DatabaseSync;
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
    this.#connectionMutex.unlock()
  }

  async destroy(): Promise<void> {
    this.#db?.close()
  }
}

class SqliteConnection implements DatabaseConnection {
  readonly #db: DatabaseSync

  constructor(db: DatabaseSync) {
    this.#db = db
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters, query } = compiledQuery
    const stmt = this.#db.prepare(sql)

    // node:sqlite expects parameters as individual arguments, not array
    // If parameters is an array, spread it; if not, pass nothing
    const args = Array.isArray(parameters) ? parameters : []

    if (SqliteConnection.isRequrningQuery(query)) {
      const rows = stmt.all(...args) as O[]
      return Promise.resolve({ rows });
    }

    const result = stmt.run(...args)

    return Promise.resolve({
      numAffectedRows: BigInt(result.changes),
      insertId: BigInt(result.lastInsertRowid),
      rows: [],
    })
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery
    const stmt: StatementSync = this.#db.prepare(sql)
    const args = Array.isArray(parameters) ? parameters : []

    if (!SelectQueryNode.is(query)) {
      throw new Error('Sqlite driver only supports streaming of select queries')
    }

    const iter = stmt.iterate(...args) as IterableIterator<R>
    for (const row of iter) {
      yield {
        rows: [row],
      }
    }
  }

  private static isRequrningQuery(query: RootOperationNode): boolean {
    return QueryNode.is(query) && (SelectQueryNode.is(query) || !!query.returning)
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
