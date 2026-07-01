import type { Kysely } from '../../kysely.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import type { MigrationLockOptions } from '../dialect-adapter.js'

// Random id for our migration lock.
const LOCK_ID = BigInt('3853314791062309107')

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
    // Non-transactional migrations are autocommitted statement by statement,
    // so use a session-level lock held until releaseMigrationLock.
    await sql`select pg_advisory_lock(${sql.lit(LOCK_ID)})`.execute(db)
  }

  override async releaseMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    await sql`select pg_advisory_unlock(${sql.lit(LOCK_ID)})`.execute(db)
  }
}
