import { Kysely } from '../kysely.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NoopPlugin } from '../plugin/noop-plugin.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { freeze, getLast } from '../util/object-utils.js'

export const DEFAULT_MIGRATION_TABLE = 'kysely_migration'
export const DEFAULT_MIGRATION_LOCK_TABLE = 'kysely_migration_lock'
export const MIGRATION_LOCK_ID = 'migration_lock'
export const NO_MIGRATIONS: NoMigrations = freeze({ __noMigrations__: true })

export interface Migration {
  up(db: Kysely<any>): Promise<void>

  /**
   * An optional down method.
   *
   * If you don't provide a down method, the migration is skipped when
   * migrating down.
   */
  down?(db: Kysely<any>): Promise<void>
}

/**
 * A class for running migrations.
 *
 * ### Example
 *
 * This example uses the {@link FileMigrationProvider} that reads migrations
 * files from a single folder. You can easily implement your own
 * {@link MigrationProvider} if you want to provide migrations some
 * other way.
 *
 * ```ts
 * const migrator = new Migrator({
 *   db,
 *   provider: new FileMigrationProvider(
 *     // Path to the folder that contains all your migrations.
 *     'some/path/to/migrations'
 *   )
 * })
 * ```
 */
export class Migrator {
  readonly #props: MigratorProps

  constructor(props: MigratorProps) {
    this.#props = freeze(props)
  }

  /**
   * Returns a {@link MigrationInfo} object for each migration.
   *
   * The returned array is sorted by migration name.
   */
  async getMigrations(): Promise<ReadonlyArray<MigrationInfo>> {
    const executedMigrations = (await this.#doesTableExists(
      this.#migrationTable
    ))
      ? await this.#props.db
          .withPlugin(this.#schemaPlugin)
          .selectFrom(this.#migrationTable)
          .select(['name', 'timestamp'])
          .execute()
      : []

    const migrations = await this.#resolveMigrations()

    return migrations.map(({ name, ...migration }) => {
      const executed = executedMigrations.find((it) => it.name === name)

      return {
        name,
        migration,
        executedAt: executed ? new Date(executed.timestamp) : undefined,
      }
    })
  }

  /**
   * Runs all migrations that have not yet been run.
   *
   * This method returns a {@link MigrationResultSet} instance and _never_ throws.
   * {@link MigrationResultSet.error} holds the error if something went wrong.
   * {@link MigrationResultSet.results} contains information about which migrations
   * were executed and which failed. See the examples below.
   *
   * This method goes through all possible migrations provided by the provider and runs the
   * ones whose names come alphabetically after the last migration that has been run. If the
   * list of executed migrations doesn't match the beginning of the list of possible migrations
   * an error is thrown.
   *
   * ### Examples
   *
   * ```ts
   * const db = new Kysely<Database>({
   *   dialect: new PostgresDialect({
   *     host: 'localhost',
   *     database: 'kysely_test',
   *   }),
   * })
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider(
   *     // Path to the folder that contains all your migrations.
   *     'some/path/to/migrations'
   *   )
   * })
   *
   * const { error, results } = await migrator.migrateToLatest()
   *
   * results?.forEach((it) => {
   *   if (it.status === 'Success') {
   *     console.log(`migration "${it.migrationName}" was executed successfully`)
   *   } else if (it.status === 'Error') {
   *     console.error(`failed to execute migration "${it.migrationName}"`)
   *   }
   * })
   *
   * if (error) {
   *   console.error('failed to run `migrateToLatest`')
   *   console.error(error)
   * }
   * ```
   */
  async migrateToLatest(): Promise<MigrationResultSet> {
    return this.#migrate(({ migrations }) => migrations.length - 1)
  }

  /**
   * Migrate up/down to a specific migration.
   *
   * This method returns a {@link MigrationResultSet} instance and _never_ throws.
   * {@link MigrationResultSet.error} holds the error if something went wrong.
   * {@link MigrationResultSet.results} contains information about which migrations
   * were executed and which failed.
   *
   * ### Examples
   *
   * ```ts
   * await migrator.migrateTo('some_migration')
   * ```
   *
   * If you specify the name of the first migration, this method migrates
   * down to the first migration, but doesn't run the `down` method of
   * the first migration. In case you want to migrate all the way down,
   * you can use a special constant `NO_MIGRATIONS`:
   *
   * ```ts
   * await migrator.migrateTo(NO_MIGRATIONS)
   * ```
   */
  async migrateTo(
    targetMigrationName: string | NoMigrations
  ): Promise<MigrationResultSet> {
    return this.#migrate(({ migrations }) => {
      if (targetMigrationName === NO_MIGRATIONS) {
        return -1
      }

      const index = migrations.findIndex(
        (it) => it.name === targetMigrationName
      )

      if (index === -1) {
        throw new Error(`migration "${targetMigrationName}" doesn't exist`)
      }

      return index
    })
  }

  /**
   * Migrate one step up.
   *
   * This method returns a {@link MigrationResultSet} instance and _never_ throws.
   * {@link MigrationResultSet.error} holds the error if something went wrong.
   * {@link MigrationResultSet.results} contains information about which migrations
   * were executed and which failed.
   *
   * ### Examples
   *
   * ```ts
   * await migrator.migrateUp()
   * ```
   */
  async migrateUp(): Promise<MigrationResultSet> {
    return this.#migrate(({ currentIndex, migrations }) =>
      Math.min(currentIndex + 1, migrations.length - 1)
    )
  }

  /**
   * Migrate one step down.
   *
   * This method returns a {@link MigrationResultSet} instance and _never_ throws.
   * {@link MigrationResultSet.error} holds the error if something went wrong.
   * {@link MigrationResultSet.results} contains information about which migrations
   * were executed and which failed.
   *
   * ### Examples
   *
   * ```ts
   * await migrator.migrateDown()
   * ```
   */
  async migrateDown(): Promise<MigrationResultSet> {
    return this.#migrate(({ currentIndex }) => Math.max(currentIndex - 1, -1))
  }

  async #migrate(
    getTargetMigrationIndex: (state: MigrationState) => number | undefined
  ): Promise<MigrationResultSet> {
    try {
      await this.#ensureMigrationTablesExists()
      return await this.#runMigrations(getTargetMigrationIndex)
    } catch (error) {
      if (error instanceof MigrationResultSetError) {
        return error.resultSet
      }

      return { error }
    }
  }

  get #migrationTableSchema(): string | undefined {
    return this.#props.migrationTableSchema
  }

  get #migrationTable(): string {
    return this.#props.migrationTableName ?? DEFAULT_MIGRATION_TABLE
  }

  get #migrationLockTable(): string {
    return this.#props.migrationLockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE
  }

  get #schemaPlugin(): KyselyPlugin {
    if (this.#migrationTableSchema) {
      return new WithSchemaPlugin(this.#migrationTableSchema)
    }

    return new NoopPlugin()
  }

  async #ensureMigrationTablesExists(): Promise<void> {
    await this.#ensureMigrationTableSchemaExists()
    await this.#ensureMigrationTableExists()
    await this.#ensureMigrationLockTableExists()
    await this.#ensureLockRowExists()
  }

  async #ensureMigrationTableSchemaExists(): Promise<void> {
    if (!this.#migrationTableSchema) {
      // Use default schema. Nothing to do.
      return
    }

    if (!(await this.#doesSchemaExists())) {
      try {
        await this.#props.db.schema
          .createSchema(this.#migrationTableSchema)
          .ifNotExists()
          .execute()
      } catch (error) {
        // At least on PostgreSQL, `if not exists` doesn't guarantee the `create schema`
        // query doesn't throw if the schema already exits. That's why we check if
        // the schema exist here and ignore the error if it does.
        if (!(await this.#doesSchemaExists())) {
          throw error
        }
      }
    }
  }

  async #ensureMigrationTableExists(): Promise<void> {
    if (!(await this.#doesTableExists(this.#migrationTable))) {
      try {
        if (this.#migrationTableSchema) {
          await this.#props.db.schema
            .createSchema(this.#migrationTableSchema)
            .ifNotExists()
            .execute()
        }

        await this.#props.db.schema
          .withPlugin(this.#schemaPlugin)
          .createTable(this.#migrationTable)
          .ifNotExists()
          .addColumn('name', 'varchar(255)', (col) =>
            col.notNull().primaryKey()
          )
          // The migration run time as ISO string. This is not a real date type as we
          // can't know which data type is supported by all future dialects.
          .addColumn('timestamp', 'varchar(255)', (col) => col.notNull())
          .execute()
      } catch (error) {
        // At least on PostgreSQL, `if not exists` doesn't guarantee the `create table`
        // query doesn't throw if the table already exits. That's why we check if
        // the table exist here and ignore the error if it does.
        if (!(await this.#doesTableExists(this.#migrationTable))) {
          throw error
        }
      }
    }
  }

  async #ensureMigrationLockTableExists(): Promise<void> {
    if (!(await this.#doesTableExists(this.#migrationLockTable))) {
      try {
        await this.#props.db.schema
          .withPlugin(this.#schemaPlugin)
          .createTable(this.#migrationLockTable)
          .ifNotExists()
          .addColumn('id', 'varchar(255)', (col) => col.notNull().primaryKey())
          .addColumn('is_locked', 'integer', (col) =>
            col.notNull().defaultTo(0)
          )
          .execute()
      } catch (error) {
        // At least on PostgreSQL, `if not exists` doesn't guarantee the `create table`
        // query doesn't throw if the table already exits. That's why we check if
        // the table exist here and ignore the error if it does.
        if (!(await this.#doesTableExists(this.#migrationLockTable))) {
          throw error
        }
      }
    }
  }

  async #ensureLockRowExists(): Promise<void> {
    if (!(await this.#doesLockRowExists())) {
      try {
        await this.#props.db
          .withPlugin(this.#schemaPlugin)
          .insertInto(this.#migrationLockTable)
          .values({ id: MIGRATION_LOCK_ID, is_locked: 0 })
          .execute()
      } catch (error) {
        if (!(await this.#doesLockRowExists())) {
          throw error
        }
      }
    }
  }

  async #doesSchemaExists(): Promise<boolean> {
    const schemas = await this.#props.db.introspection.getSchemas()

    return schemas.some((it) => it.name === this.#migrationTableSchema)
  }

  async #doesTableExists(tableName: string): Promise<boolean> {
    const schema = this.#migrationTableSchema

    const tables = await this.#props.db.introspection.getTables({
      withInternalKyselyTables: true,
    })

    return tables.some(
      (it) => it.name === tableName && (!schema || it.schema === schema)
    )
  }

  async #doesLockRowExists(): Promise<boolean> {
    const lockRow = await this.#props.db
      .withPlugin(this.#schemaPlugin)
      .selectFrom(this.#migrationLockTable)
      .where('id', '=', MIGRATION_LOCK_ID)
      .select('id')
      .executeTakeFirst()

    return !!lockRow
  }

  async #runMigrations(
    getTargetMigrationIndex: (state: MigrationState) => number | undefined
  ): Promise<MigrationResultSet> {
    const adapter = this.#props.db.getExecutor().adapter

    const run = async (db: Kysely<any>): Promise<MigrationResultSet> => {
      try {
        await adapter.acquireMigrationLock(db)

        const state = await this.#getState(db)

        if (state.migrations.length === 0) {
          return { results: [] }
        }

        const targetIndex = getTargetMigrationIndex(state)

        if (targetIndex === undefined) {
          return { results: [] }
        }

        if (targetIndex < state.currentIndex) {
          return await this.#migrateDown(db, state, targetIndex)
        } else if (targetIndex > state.currentIndex) {
          return await this.#migrateUp(db, state, targetIndex)
        }

        return { results: [] }
      } finally {
        await adapter.releaseMigrationLock(db)
      }
    }

    if (adapter.supportsTransactionalDdl) {
      return this.#props.db.transaction().execute(run)
    } else {
      return this.#props.db.connection().execute(run)
    }
  }

  async #getState(db: Kysely<any>): Promise<MigrationState> {
    const migrations = await this.#resolveMigrations()
    const executedMigrations = await this.#getExecutedMigrations(db)

    this.#ensureMigrationsNotCorrupted(migrations, executedMigrations)

    return freeze({
      migrations,
      currentIndex: migrations.findIndex(
        (it) => it.name === getLast(executedMigrations)
      ),
    })
  }

  async #resolveMigrations(): Promise<ReadonlyArray<NamedMigration>> {
    const allMigrations = await this.#props.provider.getMigrations()

    return Object.keys(allMigrations)
      .sort()
      .map((name) => ({
        ...allMigrations[name],
        name,
      }))
  }

  async #getExecutedMigrations(
    db: Kysely<any>
  ): Promise<ReadonlyArray<string>> {
    const executedMigrations = await db
      .withPlugin(this.#schemaPlugin)
      .selectFrom(this.#migrationTable)
      .select('name')
      .orderBy('name')
      .execute()

    return executedMigrations.map((it) => it.name)
  }

  #ensureMigrationsNotCorrupted(
    migrations: ReadonlyArray<NamedMigration>,
    executedMigrations: ReadonlyArray<string>
  ) {
    for (const executed of executedMigrations) {
      if (!migrations.some((it) => it.name === executed)) {
        throw new Error(
          `corrupted migrations: previously executed migration ${executed} is missing`
        )
      }
    }

    // Now we know all executed migrations exist in the `migrations` list.
    // Next we need to make sure that the executed migratiosns are the first
    // ones in the migration list.
    for (let i = 0; i < executedMigrations.length; ++i) {
      if (migrations[i].name !== executedMigrations[i]) {
        throw new Error(
          `corrupted migrations: expected previously executed migration ${executedMigrations[i]} to be at index ${i} but ${migrations[i].name} was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.`
        )
      }
    }
  }

  async #migrateDown(
    db: Kysely<any>,
    state: MigrationState,
    targetIndex: number
  ): Promise<MigrationResultSet> {
    const results: MigrationResult[] = []

    for (let i = state.currentIndex; i > targetIndex; --i) {
      results.push({
        migrationName: state.migrations[i].name,
        direction: 'Down',
        status: 'NotExecuted',
      })
    }

    for (let i = 0; i < results.length; ++i) {
      const migration = state.migrations.find(
        (it) => it.name === results[i].migrationName
      )!

      try {
        if (migration.down) {
          await migration.down(db)
          await db
            .withPlugin(this.#schemaPlugin)
            .deleteFrom(this.#migrationTable)
            .where('name', '=', migration.name)
            .execute()

          results[i] = {
            migrationName: migration.name,
            direction: 'Down',
            status: 'Success',
          }
        }
      } catch (error) {
        results[i] = {
          migrationName: migration.name,
          direction: 'Down',
          status: 'Error',
        }

        throw new MigrationResultSetError({
          error,
          results,
        })
      }
    }

    return { results }
  }

  async #migrateUp(
    db: Kysely<any>,
    state: MigrationState,
    targetIndex: number
  ): Promise<MigrationResultSet> {
    const results: MigrationResult[] = []

    for (let i = state.currentIndex + 1; i <= targetIndex; ++i) {
      results.push({
        migrationName: state.migrations[i].name,
        direction: 'Up',
        status: 'NotExecuted',
      })
    }

    for (let i = 0; i < results.length; ++i) {
      const migration = state.migrations.find(
        (it) => it.name === results[i].migrationName
      )!

      try {
        await migration.up(db)
        await db
          .withPlugin(this.#schemaPlugin)
          .insertInto(this.#migrationTable)
          .values({
            name: migration.name,
            timestamp: new Date().toISOString(),
          })
          .execute()

        results[i] = {
          migrationName: migration.name,
          direction: 'Up',
          status: 'Success',
        }
      } catch (error) {
        results[i] = {
          migrationName: migration.name,
          direction: 'Up',
          status: 'Error',
        }

        throw new MigrationResultSetError({
          error,
          results,
        })
      }
    }

    return { results }
  }
}

export interface MigratorProps {
  readonly db: Kysely<any>
  readonly provider: MigrationProvider

  /**
   * The name of the internal migration table. Defaults to `kysely_migration`.
   *
   * If you do specify this, you need to ALWAYS use the same value. Kysely doesn't
   * support changing the table on the fly. If you run the migrator even once with a
   * table name X and then change the table name to Y, kysely will create a new empty
   * migration table and attempt to run the migrations again, which will obviously
   * fail.
   *
   * If you do specify this, ALWAYS ALWAYS use the same value from the beginning of
   * the project, to the end of time or prepare to manually migrate the migration
   * tables.
   */
  readonly migrationTableName?: string

  /**
   * The name of the internal migration lock table. Defaults to `kysely_migration_lock`.
   *
   * If you do specify this, you need to ALWAYS use the same value. Kysely doesn't
   * support changing the table on the fly. If you run the migrator even once with a
   * table name X and then change the table name to Y, kysely will create a new empty
   * lock table.
   *
   * If you do specify this, ALWAYS ALWAYS use the same value from the beginning of
   * the project, to the end of time or prepare to manually migrate the migration
   * tables.
   */
  readonly migrationLockTableName?: string

  /**
   * The schema of the internal migration tables. Defaults to the default schema
   * on dialects that support schemas.
   *
   * If you do specify this, you need to ALWAYS use the same value. Kysely doesn't
   * support changing the schema on the fly. If you run the migrator even once with a
   * schema name X and then change the schema name to Y, kysely will create a new empty
   * migration tables in the new schema and attempt to run the migrations again, which
   * will obviously fail.
   *
   * If you do specify this, ALWAYS ALWAYS use the same value from the beginning of
   * the project, to the end of time or prepare to manually migrate the migration
   * tables.
   */
  readonly migrationTableSchema?: string
}

/**
 * All migration methods ({@link Migrator.migrateTo | migrateTo},
 * {@link Migrator.migrateToLatest | migrateToLatest} etc.) never
 * throw but return this object instead.
 */
export interface MigrationResultSet {
  /**
   * This is defined if something went wrong.
   *
   * An error may have occurred in one of the migrations in which case the
   * {@link results} list contains an item with `status === 'Error'` to
   * indicate which migration failed.
   *
   * An error may also have occurred before Kysely was able to figure out
   * which migrations should be executed, in which case the {@link results}
   * list is undefined.
   */
  readonly error?: unknown

  /**
   * {@link MigrationResult} for each individual migration that was supposed
   * to be executed by the operation.
   *
   * If all went well, each result's `status` is `Success`. If some migration
   * failed, the failed migration's result's `status` is `Error` and all
   * results after that one have `status` ´NotExecuted`.
   *
   * This property can be undefined if an error occurred before Kysely was
   * able to figure out which migrations should be executed.
   *
   * If this list is empty, there were no migrations to execute.
   */
  readonly results?: MigrationResult[]
}

export interface MigrationResult {
  readonly migrationName: string

  /**
   * The direction in which this migration was executed.
   */
  readonly direction: 'Up' | 'Down'

  /**
   * The execution status.
   *
   *  - `Success` means the migration was successfully executed. Note that
   *    if any of the later migrations in the {@link MigrationResult.results}
   *    list failed (have status `Error`) AND the dialect supports transactional
   *    DDL, even the successfull migrations were rolled back.
   *
   *  - `Error` means the migration failed. In this case the
   *    {@link MigrationResult.error} contains the error.
   *
   *  - `NotExecuted` means that the migration was supposed to be executed
   *    but wasn't because an earlier migration failed.
   */
  readonly status: 'Success' | 'Error' | 'NotExecuted'
}

export interface MigrationProvider {
  /**
   * Returns all migrations, old and new.
   *
   * For example if you have your migrations in a folder as separate files,
   * you can use the {@link FileMigrationProvider} that implements this
   * method to return all migrations in a folder.
   *
   * The keys of the returned object are migration names and values are the
   * migrations. The order of the migrations is determined by the alphabetical
   * order of the migration names. The items in the object don't need to be
   * sorted, they are sorted by Kysely.
   */
  getMigrations(): Promise<Record<string, Migration>>
}

/**
 * Type for the {@link NO_MIGRATIONS} constant. Never create one of these.
 */
export interface NoMigrations {
  readonly __noMigrations__: true
}

export interface MigrationInfo {
  /**
   * Name of the migration.
   */
  name: string

  /**
   * The actual migration.
   */
  migration: Migration

  /**
   * When was the migration executed.
   *
   * If this is undefined, the migration hasn't been executed yet.
   */
  executedAt?: Date
}

interface NamedMigration extends Migration {
  readonly name: string
}

interface MigrationState {
  // All migrations sorted by name.
  readonly migrations: ReadonlyArray<NamedMigration>

  // Index of the last executed migration.
  readonly currentIndex: number
}

class MigrationResultSetError extends Error {
  readonly #resultSet: MigrationResultSet

  constructor(result: MigrationResultSet) {
    super()
    this.#resultSet = result
  }

  get resultSet(): MigrationResultSet {
    return this.#resultSet
  }
}
