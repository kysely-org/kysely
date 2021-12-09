import { DialectAdapter } from '../dialect-adapter.js'

export class SqliteAdapter implements DialectAdapter {
  get supportsTransactionalDdl(): boolean {
    return false
  }

  get supportsReturning(): boolean {
    return false
  }

  async acquireMigrationLock(): Promise<void> {
    // Nothing to do here.
  }

  async releaseMigrationLock(): Promise<void> {
    // Nothing to do here.
  }
}
