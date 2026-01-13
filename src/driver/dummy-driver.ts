import type { DatabaseConnection, QueryResult } from './database-connection.js'
import type { Driver } from './driver.js'

/**
 * A driver that does absolutely nothing.
 *
 * You can use this to create Kysely instances solely for building queries
 *
 * ### Examples
 *
 * This example creates a Kysely instance for building postgres queries:
 *
 * ```ts
 * import {
 *   DummyDriver,
 *   Kysely,
 *   PostgresAdapter,
 *   PostgresIntrospector,
 *   PostgresQueryCompiler
 * } from 'kysely'
 * import type { Database } from 'type-editor' // imaginary module
 *
 * const db = new Kysely<Database>({
 *   dialect: {
 *     createAdapter: () => new PostgresAdapter(),
 *     createDriver: () => new DummyDriver(),
 *     createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),
 *     createQueryCompiler: () => new PostgresQueryCompiler(),
 *   },
 * })
 * ```
 *
 * You can use it to build a query and compile it to SQL but trying to
 * execute the query will throw an error.
 *
 * ```ts
 * const { sql } = db.selectFrom('person').selectAll().compile()
 * console.log(sql) // select * from "person"
 * ```
 */
export class DummyDriver implements Driver {
  async init(): Promise<void> {
    // Nothing to do here.
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new DummyConnection()
  }

  async beginTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async commitTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async rollbackTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async releaseConnection(): Promise<void> {
    // Nothing to do here.
  }

  async destroy(): Promise<void> {
    // Nothing to do here.
  }

  async releaseSavepoint(): Promise<void> {
    // Nothing to do here.
  }

  async rollbackToSavepoint(): Promise<void> {
    // Nothing to do here.
  }

  async savepoint(): Promise<void> {
    // Nothing to do here.
  }
}

class DummyConnection implements DatabaseConnection {
  async executeQuery<R>(): Promise<QueryResult<R>> {
    return {
      rows: [],
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    // Nothing to do here.
  }
}
