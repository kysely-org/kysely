import { Kysely } from '../../kysely.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import { MigrationLockOptions } from '../dialect-adapter.js'

const LOCK_ID = 'ea586330-2c93-47c8-908d-981d9d270f9d'
const LOCK_TIMEOUT_SECONDS = 60 * 60

export class MysqlAdapter extends DialectAdapterBase {
  get supportsTransactionalDdl(): boolean {
    return false
  }

  get supportsReturning(): boolean {
    return false
  }

  async acquireMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions
  ): Promise<void> {
    // Kysely uses a single connection to run the migrations. Because of that, we
    // can take a lock using `get_lock`. Locks acquired using `get_lock` get
    // released when the connection is destroyed (session ends) or when the lock
    // is released using `release_lock`. This way we know that the lock is either
    // released by us after successfull or failed migrations OR it's released by
    // MySQL if the process gets killed for some reason.
    await sql`select get_lock(${sql.lit(LOCK_ID)}, ${sql.lit(
      LOCK_TIMEOUT_SECONDS
    )})`.execute(db)
  }

  async releaseMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions
  ): Promise<void> {
    await sql`select release_lock(${sql.lit(LOCK_ID)})`.execute(db)
  }
}
