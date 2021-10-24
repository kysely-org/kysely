import { Kysely } from '../kysely.js'

export interface DialectSupports {
  /**
   * Whether or not this dialect supports transactional DDL.
   *
   * If this is true, migrations are executed inside a transaction.
   */
  readonly supportsTransactionalDdl: boolean

  /**
   * Whether or not this dialect supports the `returning` in inserts
   * upates and deletes.
   */
  readonly supportsReturning: boolean
}

/**
 * The `DialectAdapter` encapsulates all differences between dialects outside
 * the `Driver` and `QueryCompiler`.
 *
 * For example, some databases support transactional DDL and therefore we want
 * to run migrations inside a transaction, while other databases don't support
 * it. For that there's a `supportsTransactionalDdl` boolean in this interface.
 */
export interface DialectAdapter extends DialectSupports {
  /**
   * This method is used to acquire a lock for the migrations so that
   * it's not possible for two migration processes to run in parallel.
   *
   * Most dialects have explicit locks that can be used, like advisory locks
   * in postgres and the get_lock function in mysql.
   *
   * If the dialect doesn't have explicit locks the {@link MIGRATION_LOCK_TABLE}
   * created by Kysely can be used instead. {@link MIGRATION_LOCK_TABLE}
   * has two columns `id` and `is_locked` and there's only one row in the
   * table whose id is {@link MIGRATION_LOCK_ID}. `is_locked` is an integer.
   * Kysely takes care of creating the lock table and inserting the one single
   * row to it before this method is executed.
   */
  acquireMigrationLock(db: Kysely<any>): Promise<void>

  /**
   * Releases the migration lock. See {@link acquireMigrationLock}.
   */
  releaseMigrationLock(db: Kysely<any>): Promise<void>
}
