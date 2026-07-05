import type { Kysely } from '../../kysely.js'
import { DEFAULT_MIGRATION_TABLE } from '../../migration/migrator.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'
import type { MigrationLockOptions } from '../dialect-adapter.js'

const LOCK_PRINCIPAL = 'dbo'

export class MssqlAdapter extends DialectAdapterBase {
  override get supportsCreateIfNotExists(): boolean {
    return false
  }

  override get supportsTransactionalDdl(): boolean {
    return true
  }

  override get supportsOutput(): boolean {
    return true
  }

  override async acquireMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    // Acquire a session-level exclusive lock on the migrations table. A
    // session-level lock (as opposed to the default transaction-level lock)
    // stays held after the migration transaction commits and until we release
    // it explicitly in `releaseMigrationLock` OR the session ends. This way we
    // know the lock is either released by us after successful or failed
    // migrations OR it's released by SQL Server if the connection dies.
    // https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-getapplock-transact-sql?view=sql-server-ver16
    await sql`exec sp_getapplock @DbPrincipal = ${sql.lit(
      LOCK_PRINCIPAL,
    )}, @Resource = ${sql.lit(
      DEFAULT_MIGRATION_TABLE,
    )}, @LockMode = ${sql.lit('Exclusive')}, @LockOwner = ${sql.lit(
      'Session',
    )}`.execute(db)
  }

  override async releaseMigrationLock(
    db: Kysely<any>,
    _opt: MigrationLockOptions,
  ): Promise<void> {
    // Release the session-level lock acquired in `acquireMigrationLock`.
    // https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-releaseapplock-transact-sql?view=sql-server-ver16
    await sql`exec sp_releaseapplock @DbPrincipal = ${sql.lit(
      LOCK_PRINCIPAL,
    )}, @Resource = ${sql.lit(DEFAULT_MIGRATION_TABLE)}, @LockOwner = ${sql.lit(
      'Session',
    )}`.execute(db)
  }
}
