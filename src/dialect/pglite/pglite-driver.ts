import type {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import type { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Deferred } from '../../util/deferred.js'
import { freeze, isFunction } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import type {
  PGlite,
  PGliteDialectConfig,
  PGliteTransaction,
} from './pglite-dialect-config.js'

const PRIVATE_BEGIN_TRANSACTION_METHOD = Symbol()
const PRIVATE_COMMIT_TRANSACTION_METHOD = Symbol()
const PRIVATE_ROLLBACK_TRANSACTION_METHOD = Symbol()

export class PGliteDriver implements Driver {
  readonly #config: PGliteDialectConfig
  #connection?: PGliteConnection
  #pglite?: PGlite

  constructor(config: PGliteDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return this.#connection!
  }

  async beginTransaction(connection: PGliteConnection): Promise<void> {
    await connection[PRIVATE_BEGIN_TRANSACTION_METHOD]()
  }

  async commitTransaction(connection: PGliteConnection): Promise<void> {
    await connection[PRIVATE_COMMIT_TRANSACTION_METHOD]()
  }

  async destroy(): Promise<void> {
    if (!this.#pglite?.closed) {
      await this.#pglite?.close()
    }
  }

  async init(): Promise<void> {
    this.#pglite = isFunction(this.#config.pglite)
      ? await this.#config.pglite()
      : this.#config.pglite

    if (this.#pglite.closed) {
      throw new Error('PGlite instance is already closed.')
    }

    if (!this.#pglite.ready) {
      await this.#pglite.waitReady
    }

    this.#connection = new PGliteConnection(this.#pglite!)

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection)
    }
  }

  async releaseConnection(): Promise<void> {
    // noop
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

  async rollbackTransaction(connection: PGliteConnection): Promise<void> {
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
}

class PGliteConnection implements DatabaseConnection {
  readonly #pglite: PGlite
  #commitTransaction?: () => void
  #rollbackTransaction?: () => void
  #transaction?: PGliteTransaction
  #transactionClosedPromise?: Promise<any>

  constructor(pglite: PGlite) {
    this.#pglite = pglite
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    try {
      const { affectedRows, rows } = await (
        this.#transaction || this.#pglite
      ).query<R>(compiledQuery.sql, compiledQuery.parameters as never, {
        rowMode: 'object',
      })

      return {
        numAffectedRows:
          affectedRows != null ? BigInt(affectedRows) : undefined,
        rows: rows || [],
      }
    } catch (error) {
      throw extendStackTrace(error, new Error())
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming is not supported by PGlite.')
  }

  async [PRIVATE_BEGIN_TRANSACTION_METHOD](): Promise<void> {
    const {
      promise: waitForCommit,
      reject: rollback,
      resolve: commit,
    } = new Deferred<void>()
    const { promise: waitForBegin, resolve: hasBegun } = new Deferred<void>()

    this.#commitTransaction = commit
    this.#rollbackTransaction = rollback

    // we want to use PGlite's exclusive transaction mode, to lock the instance,
    // in case this dialect is not the only one using it.
    this.#transactionClosedPromise = this.#pglite.transaction(async (tx) => {
      this.#transaction = tx

      hasBegun()

      await waitForCommit
    })

    await waitForBegin
  }

  async [PRIVATE_COMMIT_TRANSACTION_METHOD](): Promise<void> {
    this.#commitTransaction?.()
    await this.#transactionClosedPromise
    this.#commitTransaction = undefined
    this.#rollbackTransaction = undefined
    this.#transaction = undefined
    this.#transactionClosedPromise = undefined
  }

  async [PRIVATE_ROLLBACK_TRANSACTION_METHOD](): Promise<void> {
    this.#rollbackTransaction?.()
    await this.#transactionClosedPromise?.catch(() => {})
    this.#commitTransaction = undefined
    this.#rollbackTransaction = undefined
    this.#transaction = undefined
    this.#transactionClosedPromise = undefined
  }
}
