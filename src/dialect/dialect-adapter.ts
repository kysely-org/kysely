import { Kysely } from '../kysely.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'

/**
 * A `DialectAdapter` encapsulates all differences between dialects outside
 * of `Driver` and `QueryCompiler`.
 *
 * For example, some databases support transactional DDL and therefore we want
 * to run migrations inside a transaction, while other databases don't support
 * it. For that there's a `supportsTransactionalDdl` boolean in this interface.
 */
export interface DialectAdapter {
  /**
   * Whether or not this dialect supports transactional DDL.
   *
   * If this is true, migrations are executed inside a transaction.
   */
  readonly supportsTransactionalDdl: boolean

  /**
   * Whether or not this dialect supports the `returning` in inserts
   * updates and deletes.
   */
  readonly supportsReturning: boolean

  /**
   * This method is used to acquire a lock for the migrations so that
   * it's not possible for two migration operations to run in parallel.
   *
   * Most dialects have explicit locks that can be used, like advisory locks
   * in PostgreSQL and the get_lock function in MySQL.
   *
   * If the dialect doesn't have explicit locks the `migrationLockTable`
   * created by Kysely can be used instead. `migrationLockTable`
   * has two columns `id` and `is_locked` and there's only one row in the
   * table whose id is {@link MIGRATION_LOCK_ID}. `is_locked` is an integer.
   * Kysely takes care of creating the lock table and inserting the one single
   * row to it before this method is executed.
   *
   * If `supportsTransactionalDdl` is `true` then the `db` passed to this method
   * is a transaction inside which the migrations will be executed. Otherwise
   * `db` is a single connection (session) that will be used to execute the
   * migrations.
   */
  acquireMigrationLock(db: Kysely<any>, schemaPlugin: KyselyPlugin, migrationLockTable: string): Promise<void>

  /**
   * Releases the migration lock. See {@link acquireMigrationLock}.
   *
   * If `supportsTransactionalDdl` is `true` then the `db` passed to this method
   * is a transaction inside which the migrations were executed. Otherwise `db`
   * is a single connection (session) that was used to execute the migrations
   * and the `acquireMigrationLock` call.
   */
  releaseMigrationLock(db: Kysely<any>, schemaPlugin: KyselyPlugin, migrationLockTable: string): Promise<void>
}
