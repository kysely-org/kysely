import { Kysely } from '../../kysely.js'
import { MigrationAdapter } from '../../migration/migration-adapter.js'

// Random id for our transaction lock.
const LOCK_ID = '3853314791062309107'

export class PostgresMigrationAdapter implements MigrationAdapter {
  get supportsTransactionalDdl(): boolean {
    return true
  }

  async acquireMigrationLock(db: Kysely<any>): Promise<void> {
    // Acquire a transaction level advisory lock.
    await db.raw(`select pg_advisory_xact_lock(${LOCK_ID})`).execute()
  }

  async releaseMigrationLock(): Promise<void> {
    // Nothing to do here. `pg_advisory_xact_lock` is automatically released at the
    // end of the transaction and since `supportsTransactionalDdl` true, we know
    // the `db` instance passed to acquireMigrationLock is actually a transaction.
  }
}
