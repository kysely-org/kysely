import { Kysely } from '../../kysely.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import { MigrationLockOptions } from '../dialect-adapter.js'

export class SqliteAdapter extends DialectAdapterBase {
  override get supportsTransactionalDdl(): boolean {
    return false
  }

  override get supportsReturning(): boolean {
    return true
  }

  override async acquireMigrationLock(
    _db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    // SQLite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }

  override async releaseMigrationLock(
    _db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    // SQLite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }
}
