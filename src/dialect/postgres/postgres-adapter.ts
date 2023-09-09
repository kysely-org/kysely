import { Kysely } from '../../kysely.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import { MigrationLockOptions } from '../dialect-adapter.js'

// Random id for our transaction lock.
const LOCK_ID = BigInt('3853314791062309107')

export class PostgresAdapter extends DialectAdapterBase {
  get supportsTransactionalDdl(): boolean {
    return true
  }

  get supportsReturning(): boolean {
    return true
  }

  async acquireMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions
  ): Promise<void> {
    // Acquire a transaction level advisory lock.
    await sql`select pg_advisory_xact_lock(${sql.lit(LOCK_ID)})`.execute(db)
  }

  async releaseMigrationLock(
    _db: Kysely<any>,
    _opt: MigrationLockOptions
  ): Promise<void> {
    // Nothing to do here. `pg_advisory_xact_lock` is automatically released at the
    // end of the transaction and since `supportsTransactionalDdl` true, we know
    // the `db` instance passed to acquireMigrationLock is actually a transaction.
  }
}
