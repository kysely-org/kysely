import { Kysely } from '../../kysely.js'
import { KyselyPlugin } from '../../plugin/kysely-plugin.js'
import { PostgresAdapter } from '../postgres/postgres-adapter.js'

export class CockroachAdapter extends PostgresAdapter {
  async acquireMigrationLock(db: Kysely<any>, schemaPlugin: KyselyPlugin, migrationLockTable: string): Promise<void> {
    // We don't need to actually write to a row on this table, only selecting it "for update"
    // will ensure no other transaction can get past this point. They will wait in a queue.
    await db.withPlugin(schemaPlugin).selectFrom(migrationLockTable).selectAll().forUpdate().execute();
  }

  async releaseMigrationLock(): Promise<void> {
    // Nothing to do here. The "for update" lock is automatically released at the
    // end of the transaction and since `supportsTransactionalDdl` true, we know
    // the `db` instance passed to acquireMigrationLock is actually a transaction.
  }
}
