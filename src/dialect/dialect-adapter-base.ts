import type { Kysely } from '../kysely.js'
import type { DialectAdapter, MigrationLockOptions } from './dialect-adapter.js'

/**
 * A basic implementation of `DialectAdapter` with sensible default values.
 * Third-party dialects can extend this instead of implementing the `DialectAdapter`
 * interface from scratch. That way all new settings will get default values when
 * they are added and there will be less breaking changes.
 */
export abstract class DialectAdapterBase implements DialectAdapter {
  get supportsCreateIfNotExists(): boolean {
    return true
  }

  get supportsTransactionalDdl(): boolean {
    return false
  }

  get supportsReturning(): boolean {
    return false
  }

  get supportsOutput(): boolean {
    return false
  }

  get supportsSyncExecution(): boolean {
    return false
  }

  abstract acquireMigrationLock(
    db: Kysely<any>,
    options: MigrationLockOptions,
  ): Promise<void>

  abstract releaseMigrationLock(
    db: Kysely<any>,
    options: MigrationLockOptions,
  ): Promise<void>
}
