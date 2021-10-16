import { Kysely } from '../kysely.js'
import { isObject } from '../util/object-utils.js'
import { MigrationAdapter } from './migration-adapter.js'
import { MIGRATION_LOCK_ID, MIGRATION_LOCK_TABLE } from './migration.js'

const MAX_LOCK_WAIT_TIME_MS = 60000
const LOCK_ATTEMPT_GAP_MS = 500

export class FallbackMigrationAdapter implements MigrationAdapter {
  get supportsTransactionalDdl(): boolean {
    return false
  }

  async acquireMigrationLock(db: Kysely<any>): Promise<void> {
    const startTime = performance.now()

    while (true) {
      let error: unknown

      try {
        const gotLock = await tryAcquireLock(db)

        if (gotLock) {
          return
        }
      } catch (err) {
        error = err
      }

      const now = performance.now()

      if (now - startTime > MAX_LOCK_WAIT_TIME_MS) {
        throw new Error(
          'could not acquire migration lock' +
            (isObject(error) ? `: ${error.message}` : '')
        )
      }

      await sleep(LOCK_ATTEMPT_GAP_MS)
    }
  }

  async releaseMigrationLock(db: Kysely<any>): Promise<void> {
    await releaseLock(db)
  }
}

async function tryAcquireLock(db: Kysely<any>): Promise<boolean> {
  const numUpdatedRows = await db
    .updateTable(MIGRATION_LOCK_TABLE)
    .set({ is_locked: 1 })
    .where('is_locked', '=', 0)
    .where('id', '=', MIGRATION_LOCK_ID)
    .executeTakeFirst()

  return numUpdatedRows === 1
}

async function releaseLock(db: Kysely<any>): Promise<void> {
  await db
    .updateTable(MIGRATION_LOCK_TABLE)
    .set({ is_locked: 0 })
    .where('id', '=', MIGRATION_LOCK_ID)
    .execute()
}

function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis))
}
