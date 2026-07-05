import type { Kysely } from '../../kysely.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import type { MigrationLockOptions } from '../dialect-adapter.js'

const LOCK_ID = BigInt('3853314791062309107')
const LOCK_TIMEOUT_MILLISECONDS = 60 * 60 * 1_000

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
    // in 1 RTT, acquire a session-level advisory lock with a timeout.
    //
    // if ever this runs inside a transaction, niche edge case we support - the
    // user is responsible to set a different timeout value or disable (`0` value).
    await sql`
    with set_timeout as (
      select set_config('lock_timeout', '${sql.lit(LOCK_TIMEOUT_MILLISECONDS)}', true) as config_val
    )
    select pg_advisory_lock(${sql.lit(LOCK_ID)})
    from set_timeout`.execute(db)
  }

  override async releaseMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    await sql`select pg_advisory_unlock(${sql.lit(LOCK_ID)})`.execute(db)
  }
}
