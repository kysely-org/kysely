import * as path from 'path'
import { Database } from './database'
import { config } from './config'
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from 'kysely'

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect(config.database),
  })

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider(path.join(__dirname, 'migrations')),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
