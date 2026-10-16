import type { DatabaseConnection } from '../../driver/database-connection.js'
import type { AbortableOperationOptions } from '../../util/abort.js'

/**
 * Config for the SQLite dialect.
 */
export interface SqliteDialectConfig {
  /**
   * An sqlite Database instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * Once the driver has initialized, {@link Kysely.destroy} calls
   * `database.close()`, whether the database is supplied directly or returned by
   * a function. If initialization hasn't started, `db.destroy()` does nothing,
   * even if the supplied database has been used outside Kysely.
   *
   * If Kysely is not the sole consumer of the database, or the database's
   * lifecycle is managed elsewhere, skip `db.destroy()`. Let the application
   * call `database.close()` once all consumers, including Kysely, have finished.
   * No separate cleanup of the `Kysely` instance is needed.
   *
   * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
   */
  database:
    | SqliteDatabase
    | ((options?: AbortableOperationOptions) => Promise<SqliteDatabase>)

  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (
    connection: DatabaseConnection,
    options?: AbortableOperationOptions,
  ) => Promise<void>
}

/**
 * This interface is the subset of better-sqlite3 driver's `Database` class that
 * kysely needs.
 *
 * We don't use the type from `better-sqlite3` here to not have a dependency to it.
 *
 * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
 */
export interface SqliteDatabase {
  close(): void
  prepare(sql: string): SqliteStatement
}

export interface SqliteStatement {
  readonly reader: boolean
  all(parameters: ReadonlyArray<unknown>): unknown[]
  run(parameters: ReadonlyArray<unknown>): {
    changes: number | bigint
    lastInsertRowid: number | bigint
  }
  iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown>
}
