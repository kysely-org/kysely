import type { DatabaseSync } from 'node:sqlite'
import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the SQLite dialect.
 */
export interface SqliteDialectConfig {
  /**
   * A node:sqlite DatabaseSync instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://nodejs.org/api/sqlite.html#class-databasesync
   */
  database: InstanceType<typeof DatabaseSync> | (() => Promise<InstanceType<typeof DatabaseSync>>);

  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}
