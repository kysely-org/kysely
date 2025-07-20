import { PostgresAdapter } from '../postgres/postgres-adapter.js'

export class PGliteAdapter extends PostgresAdapter {
  override get supportsMultipleConnections(): boolean {
    return false
  }

  async acquireMigrationLock(): Promise<void> {
    // PGlite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }

  async releaseMigrationLock(): Promise<void> {
    // PGlite only has one connection that's reserved by the migration system
    // for the whole time between acquireMigrationLock and releaseMigrationLock.
    // We don't need to do anything here.
  }
}
