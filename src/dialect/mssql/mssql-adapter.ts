import { Kysely } from '../../kysely.js'
import { DEFAULT_MIGRATION_TABLE } from '../../migration/migrator.js'
import { sql } from '../../raw-builder/sql.js'
import { DialectAdapterBase } from '../dialect-adapter-base.js'

export class MssqlAdapter extends DialectAdapterBase {
  get supportsCreateIfNotExists(): boolean {
    return false
  }

  get supportsTransactionalDdl(): boolean {
    return true
  }

  get supportsReturning(): boolean {
    // mssql should support returning with the `output` clause.
    // we need to figure this out when we'll introduce support for it.
    return false
  }

  async acquireMigrationLock(db: Kysely<any>): Promise<void> {
    // Acquire a transaction-level exclusive lock on the migrations table.
    // https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-getapplock-transact-sql?view=sql-server-ver16
    await sql`exec sp_getapplock @DbPrincipal = ${sql.lit(
      'dbo'
    )}, @Resource = ${sql.lit(DEFAULT_MIGRATION_TABLE)}, @LockMode = ${sql.lit(
      'Exclusive'
    )}`.execute(db)
  }

  async releaseMigrationLock(): Promise<void> {
    // Nothing to do here. `sp_getapplock` is automatically released at the
    // end of the transaction and since `supportsTransactionalDdl` true, we know
    // the `db` instance passed to acquireMigrationLock is actually a transaction.
  }
}
