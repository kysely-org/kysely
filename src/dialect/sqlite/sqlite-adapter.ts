import { DialectAdapter } from '../dialect-adapter.js'

export class SqliteAdapter implements DialectAdapter {
  get supportsTransactionalDdl(): boolean {
    return false
  }

  get supportsReturning(): boolean {
    return false
  }

  async acquireMigrationLock(): Promise<void> {
    // SQLite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }

  async releaseMigrationLock(): Promise<void> {
    // SQLite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }
}
