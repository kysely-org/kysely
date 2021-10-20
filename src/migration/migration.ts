import * as path from 'path'
import { promises as fs } from 'fs'

import { Kysely } from '../kysely.js'
import { getLast, isFunction, isString } from '../util/object-utils.js'
import { DialectAdapter } from '../dialect/dialect-adapter.js'

export const MIGRATION_TABLE = 'kysely_migration'
export const MIGRATION_LOCK_TABLE = 'kysely_migration_lock'
export const MIGRATION_LOCK_ID = 'migration_lock'

export class MigrationModule {
  readonly #db: Kysely<any>
  readonly #adapter: DialectAdapter

  constructor(db: Kysely<any>, adapter: DialectAdapter) {
    this.#db = db
    this.#adapter = adapter
  }

  /**
   * Runs all migrations that have not yet been run.
   *
   * The only argument must either be a file path to the folder that contains all migrations
   * OR an object that contains all migrations (not just the ones that need to be run).
   * The keys in the object must be the unique migration names.
   *
   * This method goes through all possible migrations (passed as the argument) and runs the
   * ones whose names are alphabetically after the last migration that has been run. If the
   * list of executed migrations doesn't match the list of possible migrations, and error
   * is thrown.
   *
   * @example
   * ```ts
   * await db.migration.migrateToLatest(
   *   path.join(__dirname, 'migrations')
   * )
   * ```
   */
  migrateToLatest(migrationsFolderPath: string): Promise<void>
  migrateToLatest(allMigrations: Record<string, Migration>): Promise<void>

  async migrateToLatest(
    migrationsFolderPath: string | Record<string, Migration>
  ): Promise<void> {
    await ensureMigrationTablesExists(this.#db)

    if (isString(migrationsFolderPath)) {
      return this.#migrateToLatest(
        await readMigrationsFromFolder(migrationsFolderPath)
      )
    } else {
      return this.#migrateToLatest(migrationsFolderPath)
    }
  }

  async #migrateToLatest(migrations: Record<string, Migration>): Promise<void> {
    const run = async (db: Kysely<any>) => {
      try {
        await this.#adapter.acquireMigrationLock(db)
        await runNewMigrations(db, migrations)
      } finally {
        await this.#adapter.releaseMigrationLock(db)
      }
    }

    if (this.#adapter.supportsTransactionalDdl) {
      await this.#db.transaction().execute(run)
    } else {
      await this.#db.connection().execute(run)
    }
  }
}

export interface Migration {
  up(db: Kysely<any>): Promise<void>
  down(db: Kysely<any>): Promise<void>
}

async function ensureMigrationTablesExists(db: Kysely<any>): Promise<void> {
  await ensureMigrationTableExists(db)
  await ensureMigrationLockTableExists(db)
  await ensureLockRowExists(db)
}

async function ensureMigrationTableExists(db: Kysely<any>): Promise<void> {
  if (!(await doesTableExists(db, MIGRATION_TABLE))) {
    try {
      await db.schema
        .createTable(MIGRATION_TABLE)
        .ifNotExists()
        .addColumn('name', 'varchar(255)', (col) => col.notNull().primaryKey())
        // The migration run time as ISO string. This is not a real date type as we
        // can't know which data type is supported by all future dialects.
        .addColumn('timestamp', 'varchar(255)', (col) => col.notNull())
        .execute()
    } catch (error) {
      // At least on postgres, `if not exists` doesn't guarantee the `create table`
      // query doesn't throw if the table already exits. That's why we check if
      // the table exist here and ignore the error if it does.
      if (!(await doesTableExists(db, MIGRATION_TABLE))) {
        throw error
      }
    }
  }
}

async function ensureMigrationLockTableExists(db: Kysely<any>): Promise<void> {
  if (!(await doesTableExists(db, MIGRATION_LOCK_TABLE))) {
    try {
      await db.schema
        .createTable(MIGRATION_LOCK_TABLE)
        .ifNotExists()
        .addColumn('id', 'varchar(255)', (col) => col.notNull().primaryKey())
        .addColumn('is_locked', 'integer', (col) => col.notNull().defaultTo(0))
        .execute()
    } catch (error) {
      // At least on postgres, `if not exists` doesn't guarantee the `create table`
      // query doesn't throw if the table already exits. That's why we check if
      // the table exist here and ignore the error if it does.
      if (!(await doesTableExists(db, MIGRATION_LOCK_TABLE))) {
        throw error
      }
    }
  }
}

async function ensureLockRowExists(db: Kysely<any>): Promise<void> {
  if (!(await doesLockRowExists(db))) {
    try {
      await db
        .insertInto(MIGRATION_LOCK_TABLE)
        .values({ id: MIGRATION_LOCK_ID })
        .execute()
    } catch (error) {
      if (!(await doesLockRowExists(db))) {
        throw error
      }
    }
  }
}

async function doesTableExists(
  db: Kysely<any>,
  tableName: string
): Promise<boolean> {
  const metadata = await db.introspection.getMetadata({
    withInternalKyselyTables: true,
  })

  return !!metadata.tables.find((it) => it.name === tableName)
}

async function doesLockRowExists(db: Kysely<any>): Promise<boolean> {
  const lockRow = await db
    .selectFrom(MIGRATION_LOCK_TABLE)
    .where('id', '=', MIGRATION_LOCK_ID)
    .select('id')
    .executeTakeFirst()

  return !!lockRow
}

async function readMigrationsFromFolder(
  migrationsFolderPath: string
): Promise<Record<string, Migration>> {
  const files = await fs.readdir(migrationsFolderPath)
  const migrations: Record<string, Migration> = {}

  for (const file of files) {
    if (
      (file.endsWith('.js') || file.endsWith('.ts')) &&
      !file.endsWith('.d.ts')
    ) {
      const migration = await import(path.join(migrationsFolderPath, file))

      if (isMigration(migration)) {
        migrations[file.substring(0, file.length - 3)] = migration
      }
    }
  }

  return migrations
}

async function runNewMigrations(
  db: Kysely<any>,
  allMigrations: Record<string, Migration>
) {
  const sortedMigrations = Object.keys(allMigrations)
    .sort()
    .map((name) => ({
      ...allMigrations[name],
      name,
    }))

  const executedMigrations = await db
    .selectFrom(MIGRATION_TABLE)
    .select('name')
    .orderBy('name')
    .execute()

  const lastExecuted = getLast(executedMigrations)
  const lastExecutedIndex = sortedMigrations.findIndex(
    (it) => it.name === lastExecuted?.name
  )

  if (lastExecuted && lastExecutedIndex === -1) {
    throw new Error(
      `corrupted migrations: previously executed migration ${lastExecuted.name} is missing`
    )
  }

  const oldMigrations = lastExecuted
    ? sortedMigrations.slice(0, lastExecutedIndex + 1)
    : []

  const newMigrations = lastExecuted
    ? sortedMigrations.slice(lastExecutedIndex + 1)
    : sortedMigrations

  ensureMigrationsAreNotCorrupted(
    executedMigrations.map((it) => it.name),
    oldMigrations.map((it) => it.name)
  )

  for (const migration of newMigrations) {
    await migration.up(db)
    await db
      .insertInto(MIGRATION_TABLE)
      .values({
        name: migration.name,
        timestamp: new Date().toISOString(),
      })
      .execute()
  }
}

function ensureMigrationsAreNotCorrupted(
  executedMigrationNames: string[],
  oldMigrationNames: string[]
) {
  const executedSet = new Set(executedMigrationNames)
  const oldMigrationSet = new Set(oldMigrationNames)

  for (const it of executedSet) {
    if (!oldMigrationSet.has(it)) {
      throw new Error(
        `corrupted migrations: previously executed migration ${it} is missing`
      )
    }
  }

  for (const it of oldMigrationSet) {
    if (!executedSet.has(it)) {
      throw new Error(
        `corrupted migrations: new migration ${it} comes alphabetically before the last executed migration. New migrations must always have a name that comes alphabetically after the last executed migration.`
      )
    }
  }
}

function isMigration(obj: any): obj is Migration {
  return obj && isFunction(obj.up) && isFunction(obj.down)
}
