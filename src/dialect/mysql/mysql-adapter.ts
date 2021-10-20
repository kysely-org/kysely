import { Kysely } from '../../kysely.js'
import { DialectAdapter } from '../dialect-adapter.js'

const LOCK_ID = 'ea586330-2c93-47c8-908d-981d9d270f9d'
const LOCK_TIMEOUT_SECONDS = 60 * 60

export class MysqlAdapter implements DialectAdapter {
  get supportsTransactionalDdl(): boolean {
    return false
  }

  get supportsReturning(): boolean {
    return false
  }

  async acquireMigrationLock(db: Kysely<any>): Promise<void> {
    await db
      .raw(`select get_lock('${LOCK_ID}', ${LOCK_TIMEOUT_SECONDS})`)
      .execute()
  }

  async releaseMigrationLock(db: Kysely<any>): Promise<void> {
    await db.raw(`select release_lock('${LOCK_ID}')`).execute()
  }
}
