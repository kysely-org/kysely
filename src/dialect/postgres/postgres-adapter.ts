import type { Kysely } from '../../kysely.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import type { MigrationLockOptions } from '../dialect-adapter.js'

// Random id for our migration lock.
const LOCK_ID = BigInt('3853314791062309107')
// Mirrors the MySQL adapter's `get_lock` timeout so a migrator doesn't wait
// forever for a competing migrator to release the lock.
const LOCK_TIMEOUT_SECONDS = 60 * 60
const LOCK_POLL_INTERVAL_MS = 100

export class PostgresAdapter extends DialectAdapterBase {
  override get supportsTransactionalDdl(): boolean {
    return true
  }

  override get supportsReturning(): boolean {
    return true
  }

  override async acquireMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    // Kysely uses a single connection to run the migrations. Because of that,
    // we can take a session level advisory lock and release it using
    // `releaseMigrationLock`. We poll `pg_try_advisory_lock` instead of
    // blocking on `pg_advisory_lock` so that a migrator doesn't wait forever for
    // a competing migrator - it fails once the timeout is exceeded.
    const startTime = Date.now()

    while (true) {
      const result = await sql<{
        acquired: boolean
      }>`select pg_try_advisory_lock(${sql.lit(LOCK_ID)}) as acquired`.execute(
        db,
      )

      if (result.rows[0]?.acquired) {
        return
      }

      if (Date.now() - startTime >= LOCK_TIMEOUT_SECONDS * 1000) {
        throw new Error(
          `Timed out after ${LOCK_TIMEOUT_SECONDS} seconds while waiting for the migration lock.`,
        )
      }

      await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS))
    }
  }

  override async releaseMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    await sql`select pg_advisory_unlock(${sql.lit(LOCK_ID)})`.execute(db)
  }
}
