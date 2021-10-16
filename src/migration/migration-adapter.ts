import { Kysely } from '../kysely.js'

export interface MigrationAdapter {
  /**
   * Whether or not this dialect supports transactional DDL.
   */
  readonly supportsTransactionalDdl: boolean

  /**
   * This method is used to acquire a lock for the migrations so that
   * it's not possible for two migration processes to run in parallel.
   *
   * Most dialects have explicit locks that can be used, like advisory locks
   * on postgres and the GET_LOCK function on mysql.
   *
   * If the dialect doesn't have explicit locks {@link MIGRATION_LOCK_TABLE}
   * created by Kysely can be used instead. {@link MIGRATION_LOCK_TABLE}
   * has two columns `id` and `is_locked` and there's only one row in the
   * table (created by Kysely) whose id is {@link MIGRATION_LOCK_ID}.
   * `is_locked` is an integer.
   */
  acquireMigrationLock(db: Kysely<any>): Promise<void>

  /**
   * Releases the migration lock. See {@link acquireMigrationLock}.
   */
  releaseMigrationLock(db: Kysely<any>): Promise<void>
}
