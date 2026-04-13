import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { FileMigrationProvider, Migrator } from 'kysely'
import { createDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrateToLatest() {
  const db = createDb()

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('migration failed')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
