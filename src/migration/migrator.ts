import { MigrationLockOptions } from '../dialect/dialect-adapter.js'
import { Kysely } from '../kysely.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NoopPlugin } from '../plugin/noop-plugin.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { CreateSchemaBuilder } from '../schema/create-schema-builder.js'
import { CreateTableBuilder } from '../schema/create-table-builder.js'
import { freeze, getLast, isObject } from '../util/object-utils.js'

export const DEFAULT_MIGRATION_TABLE = 'kysely_migration'
export const DEFAULT_MIGRATION_LOCK_TABLE = 'kysely_migration_lock'
export const DEFAULT_ALLOW_UNORDERED_MIGRATIONS = false
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
 * import { promises as fs } from 'node:fs'
 * import path from 'node:path'
 * import * as Sqlite from 'better-sqlite3'
 * import {
 *   FileMigrationProvider,
 *   Kysely,
 *   Migrator,
 *   SqliteDialect
 * } from 'kysely'
 *
 * const db = new Kysely<any>({
 *   dialect: new SqliteDialect({
 *     database: Sqlite(':memory:')
 *   })
 * })
 *
 * const migrator = new Migrator({
 *   db,
 *   provider: new FileMigrationProvider({
 *     fs,
 *     // Path to the folder that contains all your migrations.
 *     migrationFolder: 'some/path/to/migrations',
 *     path,
 *   })
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
      this.#migrationTable,
    ))
      ? await this.#props.db
          .withPlugin(this.#schemaPlugin)
          .selectFrom(this.#migrationTable)
          .select(['name', 'timestamp'])
          .$narrowType<{ name: string; timestamp: string }>()
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
   * an error is returned.
   *
   * ### Examples
   *
   * ```ts
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import * as Sqlite from 'better-sqlite3'
   * import { FileMigrationProvider, Migrator } from 'kysely'
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider({
   *     fs,
   *     migrationFolder: 'some/path/to/migrations',
   *     path,
   *   })
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
    return this.#migrate(() => ({ direction: 'Up', step: Infinity }))
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
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { FileMigrationProvider, Migrator } from 'kysely'
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider({
   *     fs,
   *     // Path to the folder that contains all your migrations.
   *     migrationFolder: 'some/path/to/migrations',
   *     path,
   *   })
   * })
   *
   * await migrator.migrateTo('some_migration')
   * ```
   *
   * If you specify the name of the first migration, this method migrates
   * down to the first migration, but doesn't run the `down` method of
   * the first migration. In case you want to migrate all the way down,
   * you can use a special constant `NO_MIGRATIONS`:
   *
   * ```ts
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { FileMigrationProvider, Migrator, NO_MIGRATIONS } from 'kysely'
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider({
   *     fs,
   *     // Path to the folder that contains all your migrations.
   *     migrationFolder: 'some/path/to/migrations',
   *     path,
   *   })
   * })
   *
   * await migrator.migrateTo(NO_MIGRATIONS)
   * ```
   */
  async migrateTo(
    targetMigrationName: string | NoMigrations,
  ): Promise<MigrationResultSet> {
    return this.#migrate(
      ({
        migrations,
        executedMigrations,
        pendingMigrations,
      }: MigrationState) => {
        if (
          isObject(targetMigrationName) &&
          targetMigrationName.__noMigrations__ === true
        ) {
          return { direction: 'Down', step: Infinity }
        }

        if (
          !migrations.find((m) => m.name === (targetMigrationName as string))
        ) {
          throw new Error(`migration "${targetMigrationName}" doesn't exist`)
        }

        const executedIndex = executedMigrations.indexOf(
          targetMigrationName as string,
        )
        const pendingIndex = pendingMigrations.findIndex(
          (m) => m.name === (targetMigrationName as string),
        )

        if (executedIndex !== -1) {
          return {
            direction: 'Down',
            step: executedMigrations.length - executedIndex - 1,
          }
        } else if (pendingIndex !== -1) {
          return { direction: 'Up', step: pendingIndex + 1 }
        } else {
          throw new Error(
            `migration "${targetMigrationName}" isn't executed or pending`,
          )
        }
      },
    )
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
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { FileMigrationProvider, Migrator } from 'kysely'
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider({
   *     fs,
   *     // Path to the folder that contains all your migrations.
   *     migrationFolder: 'some/path/to/migrations',
   *     path,
   *   })
   * })
   *
   * await migrator.migrateUp()
   * ```
   */
  async migrateUp(): Promise<MigrationResultSet> {
    return this.#migrate(() => ({ direction: 'Up', step: 1 }))
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
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { FileMigrationProvider, Migrator } from 'kysely'
   *
   * const migrator = new Migrator({
   *   db,
   *   provider: new FileMigrationProvider({
   *     fs,
   *     // Path to the folder that contains all your migrations.
   *     migrationFolder: 'some/path/to/migrations',
   *     path,
   *   })
   * })
   *
   * await migrator.migrateDown()
   * ```
   */
  async migrateDown(): Promise<MigrationResultSet> {
    return this.#migrate(() => ({ direction: 'Down', step: 1 }))
  }

  async #migrate(
    getMigrationDirectionAndStep: (state: MigrationState) => {
      direction: MigrationDirection
      step: number
    },
  ): Promise<MigrationResultSet> {
    try {
      await this.#ensureMigrationTablesExists()
      return await this.#runMigrations(getMigrationDirectionAndStep)
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

  get #allowUnorderedMigrations(): boolean {
    return (
      this.#props.allowUnorderedMigrations ?? DEFAULT_ALLOW_UNORDERED_MIGRATIONS
    )
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
        await this.#createIfNotExists(
          this.#props.db.schema.createSchema(this.#migrationTableSchema),
        )
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
          await this.#createIfNotExists(
            this.#props.db.schema.createSchema(this.#migrationTableSchema),
          )
        }

        await this.#createIfNotExists(
          this.#props.db.schema
            .withPlugin(this.#schemaPlugin)
            .createTable(this.#migrationTable)
            .addColumn('name', 'varchar(255)', (col) =>
              col.notNull().primaryKey(),
            )
            // The migration run time as ISO string. This is not a real date type as we
            // can't know which data type is supported by all future dialects.
            .addColumn('timestamp', 'varchar(255)', (col) => col.notNull()),
        )
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
        await this.#createIfNotExists(
          this.#props.db.schema
            .withPlugin(this.#schemaPlugin)
            .createTable(this.#migrationLockTable)
            .addColumn('id', 'varchar(255)', (col) =>
              col.notNull().primaryKey(),
            )
            .addColumn('is_locked', 'integer', (col) =>
              col.notNull().defaultTo(0),
            ),
        )
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
      (it) => it.name === tableName && (!schema || it.schema === schema),
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
    getMigrationDirectionAndStep: (state: MigrationState) => {
      direction: MigrationDirection
      step: number
    },
  ): Promise<MigrationResultSet> {
    const adapter = this.#props.db.getExecutor().adapter

    const lockOptions: MigrationLockOptions = freeze({
      lockTable:
        this.#props.migrationLockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
      lockRowId: MIGRATION_LOCK_ID,
      lockTableSchema: this.#props.migrationTableSchema,
    })

    const run = async (db: Kysely<any>): Promise<MigrationResultSet> => {
      try {
        await adapter.acquireMigrationLock(db, lockOptions)
        const state = await this.#getState(db)

        if (state.migrations.length === 0) {
          return { results: [] }
        }

        const { direction, step } = getMigrationDirectionAndStep(state)

        if (step <= 0) {
          return { results: [] }
        }

        if (direction === 'Down') {
          return await this.#migrateDown(db, state, step)
        } else if (direction === 'Up') {
          return await this.#migrateUp(db, state, step)
        }

        return { results: [] }
      } finally {
        await adapter.releaseMigrationLock(db, lockOptions)
      }
    }

    if (adapter.supportsTransactionalDdl && !this.#props.disableTransactions) {
      return this.#props.db.transaction().execute(run)
    } else {
      return this.#props.db.connection().execute(run)
    }
  }

  async #getState(db: Kysely<any>): Promise<MigrationState> {
    const migrations = await this.#resolveMigrations()
    const executedMigrations = await this.#getExecutedMigrations(db)

    this.#ensureNoMissingMigrations(migrations, executedMigrations)
    if (!this.#allowUnorderedMigrations) {
      this.#ensureMigrationsInOrder(migrations, executedMigrations)
    }

    const pendingMigrations = this.#getPendingMigrations(
      migrations,
      executedMigrations,
    )

    return freeze({
      migrations,
      executedMigrations,
      lastMigration: getLast(executedMigrations),
      pendingMigrations,
    })
  }

  #getPendingMigrations(
    migrations: ReadonlyArray<NamedMigration>,
    executedMigrations: ReadonlyArray<string>,
  ): ReadonlyArray<NamedMigration> {
    return migrations.filter((migration) => {
      return !executedMigrations.includes(migration.name)
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
    db: Kysely<any>,
  ): Promise<ReadonlyArray<string>> {
    const executedMigrations = await db
      .withPlugin(this.#schemaPlugin)
      .selectFrom(this.#migrationTable)
      .select(['name', 'timestamp'])
      .$narrowType<{ name: string; timestamp: string }>()
      .execute()

    const nameComparator =
      this.#props.nameComparator || ((a, b) => a.localeCompare(b))

    return (
      executedMigrations
        // https://github.com/kysely-org/kysely/issues/843
        .sort((a, b) => {
          if (a.timestamp === b.timestamp) {
            return nameComparator(a.name, b.name)
          }

          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        })
        .map((it) => it.name)
    )
  }

  #ensureNoMissingMigrations(
    migrations: ReadonlyArray<NamedMigration>,
    executedMigrations: ReadonlyArray<string>,
  ) {
    // Ensure all executed migrations exist in the `migrations` list.
    for (const executed of executedMigrations) {
      if (!migrations.some((it) => it.name === executed)) {
        throw new Error(
          `corrupted migrations: previously executed migration ${executed} is missing`,
        )
      }
    }
  }

  #ensureMigrationsInOrder(
    migrations: ReadonlyArray<NamedMigration>,
    executedMigrations: ReadonlyArray<string>,
  ) {
    // Ensure the executed migrations are the first ones in the migration list.
    for (let i = 0; i < executedMigrations.length; ++i) {
      if (migrations[i].name !== executedMigrations[i]) {
        throw new Error(
          `corrupted migrations: expected previously executed migration ${executedMigrations[i]} to be at index ${i} but ${migrations[i].name} was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.`,
        )
      }
    }
  }

  async #migrateDown(
    db: Kysely<any>,
    state: MigrationState,
    step: number,
  ): Promise<MigrationResultSet> {
    const migrationsToRollback: ReadonlyArray<NamedMigration> =
      state.executedMigrations
        .slice()
        .reverse()
        .slice(0, step)
        .map((name) => {
          return state.migrations.find((it) => it.name === name)!
        })

    const results: MigrationResult[] = migrationsToRollback.map((migration) => {
      return {
        migrationName: migration.name,
        direction: 'Down',
        status: 'NotExecuted',
      }
    })

    for (let i = 0; i < results.length; ++i) {
      const migration = migrationsToRollback[i]

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
    step: number,
  ): Promise<MigrationResultSet> {
    const migrationsToRun: ReadonlyArray<NamedMigration> =
      state.pendingMigrations.slice(0, step)

    const results: MigrationResult[] = migrationsToRun.map((migration) => {
      return {
        migrationName: migration.name,
        direction: 'Up',
        status: 'NotExecuted',
      }
    })

    for (let i = 0; i < results.length; i++) {
      const migration = state.pendingMigrations[i]

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

  async #createIfNotExists(
    qb: CreateTableBuilder<any, any> | CreateSchemaBuilder,
  ): Promise<void> {
    if (this.#props.db.getExecutor().adapter.supportsCreateIfNotExists) {
      qb = qb.ifNotExists()
    }

    await qb.execute()
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
   *
   * This only works on postgres.
   */
  readonly migrationTableSchema?: string

  /**
   * Enforces whether or not migrations must be run in alpha-numeric order.
   *
   * When false, migrations must be run in their exact alpha-numeric order.
   * This is checked against the migrations already run in the database
   * (`migrationTableName`). This ensures your migrations are always run in
   * the same order and is the safest option.
   *
   * When true, migrations are still run in alpha-numeric order, but
   * the order is not checked against already-run migrations in the database.
   * Kysely will simply run all migrations that haven't run yet, in alpha-numeric
   * order.
   */
  readonly allowUnorderedMigrations?: boolean

  /**
   * A function that compares migration names, used when sorting migrations in
   * ascending order.
   *
   * Default is `name0.localeCompare(name1)`.
   */
  readonly nameComparator?: (name0: string, name1: string) => number

  /**
   * When `true`, don't run migrations in transactions even if the dialect supports transactional DDL.
   *
   * Default is `false`.
   *
   * This is useful when some migrations include queries that would fail otherwise.
   */
  readonly disableTransactions?: boolean
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

type MigrationDirection = 'Up' | 'Down'

export interface MigrationResult {
  readonly migrationName: string

  /**
   * The direction in which this migration was executed.
   */
  readonly direction: MigrationDirection

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
   * you can implement this method to return all migration in that folder
   * as {@link Migration} objects.
   *
   * Kysely already has a built-in {@link FileMigrationProvider} for node.js
   * that does exactly that.
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

  // Names of executed migrations sorted by execution timestamp
  readonly executedMigrations: ReadonlyArray<string>

  // Name of the last executed migration.
  readonly lastMigration?: string

  // Migrations that have not yet ran
  readonly pendingMigrations: ReadonlyArray<NamedMigration>
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
