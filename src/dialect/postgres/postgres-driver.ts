import type {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import type {
  PostgresCursorConstructor,
  PostgresDialectConfig,
  PostgresClient,
} from './postgres-dialect-config.js'

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig
  #client?: PostgresClient
  #connection?: DatabaseConnection

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    this.#client = isFunction(this.#config.client)
      ? await this.#config.client()
      : this.#config.client
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.#connection) {
      if (!this.#client) {
        throw new Error('Driver not initialized')
      }

      await this.#client.connect()

      this.#connection = new PostgresConnection(this.#client, {
        cursor: this.#config.cursor ?? null,
      })

      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(this.#connection)
      }
    }

    if (this.#config.onReserveConnection) {
      await this.#config.onReserveConnection(this.#connection)
    }

    return this.#connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel || settings.accessMode) {
      let sql = 'start transaction'

      if (settings.isolationLevel) {
        sql += ` isolation level ${settings.isolationLevel}`
      }

      if (settings.accessMode) {
        sql += ` ${settings.accessMode}`
      }

      await connection.executeQuery(CompiledQuery.raw(sql))
    } else {
      await connection.executeQuery(CompiledQuery.raw('begin'))
    }
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

  async releaseConnection(_connection: DatabaseConnection): Promise<void> {
    // Single client connection is not released back to a pool.
  }

  async destroy(): Promise<void> {
    if (this.#client) {
      const client = this.#client
      this.#client = undefined
      this.#connection = undefined
      await client.end()
    }
  }
}

interface PostgresConnectionOptions {
  cursor: PostgresCursorConstructor | null
}

class PostgresConnection implements DatabaseConnection {
  #client: PostgresClient
  #options: PostgresConnectionOptions

  constructor(client: PostgresClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const { command, rowCount, rows } = await this.#client.query<O>(
        compiledQuery.sql,
        [...compiledQuery.parameters],
      )

      return {
        numAffectedRows:
          command === 'INSERT' ||
          command === 'UPDATE' ||
          command === 'DELETE' ||
          command === 'MERGE'
            ? BigInt(rowCount)
            : undefined,
        rows: rows ?? [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    const cursor = this.#client.query(
      new this.#options.cursor<O>(
        compiledQuery.sql,
        compiledQuery.parameters.slice(),
      ),
    )

    try {
      while (true) {
        const rows = await cursor.read(chunkSize)

        if (rows.length === 0) {
          break
        }

        yield {
          rows,
        }
      }
    } finally {
      await cursor.close()
    }
  }
}
