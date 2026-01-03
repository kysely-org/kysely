import type {
  DialectAdapter,
  MigrationLockOptions,
} from '../dialect/dialect-adapter.js'
import type { Kysely } from '../kysely.js'
import type { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NoopPlugin } from '../plugin/noop-plugin.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import type { CreateSchemaBuilder } from '../schema/create-schema-builder.js'
import type { CreateTableBuilder } from '../schema/create-table-builder.js'
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

  /**
   * Optional configuration for this migration.
   */
  config?: MigrationConfig
}

/**
 * Configuration for a single migration.
 */
export interface MigrationConfig {
  /**
   * Controls whether this migration runs inside a transaction.
   *
   * - `true`: Run in a transaction (if the dialect supports transactional DDL).
   *   This can override the global `disableTransactions` setting.
   * - `false`: Run without a transaction. This can override the global default
   *   when transactions are enabled.
   * - `undefined`: Use the global transaction setting.
   *
   * When transactions are enabled globally, consecutive migrations with the same
   * transaction behavior are batched together in a single transaction.
   *
   * When transactions are disabled globally, each migration with `transaction: true`
   * runs in its own separate transaction.
   *
   * Note: Setting this to `true` has no effect if the dialect doesn't support
   * transactional DDL.
   */
  readonly transaction?: boolean
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
    const tableExists = await this.#doesTableExist(this.#migrationTable)

    const executedMigrations = tableExists
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
  async migrateToLatest(options?: MigrateOptions): Promise<MigrationResultSet> {
    return this.#migrate(() => ({ direction: 'Up', step: Infinity }), options)
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
    options?: MigrateOptions,
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
        }

        if (pendingIndex !== -1) {
          return { direction: 'Up', step: pendingIndex + 1 }
        }

        throw new Error(
          `migration "${targetMigrationName}" isn't executed or pending`,
        )
      },
      options,
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
  async migrateUp(options?: MigrateOptions): Promise<MigrationResultSet> {
    return this.#migrate(() => ({ direction: 'Up', step: 1 }), options)
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
  async migrateDown(options?: MigrateOptions): Promise<MigrationResultSet> {
    return this.#migrate(() => ({ direction: 'Down', step: 1 }), options)
  }

  async #migrate(
    getMigrationDirectionAndStep: (state: MigrationState) => {
      direction: MigrationDirection
      step: number
    },
    options: MigrateOptions | undefined,
  ): Promise<MigrationResultSet> {
    try {
      await this.#ensureMigrationTableSchemaExists()
      await this.#ensureMigrationTableExists()
      await this.#ensureMigrationLockTableExists()
      await this.#ensureLockRowExists()

      return await this.#runMigrations(getMigrationDirectionAndStep, options)
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

  async #ensureMigrationTableSchemaExists(): Promise<void> {
    if (!this.#migrationTableSchema) {
      // Use default schema. Nothing to do.
      return
    }

    const schemaExists = await this.#doesSchemaExist()

    if (schemaExists) {
      return
    }

    try {
      await this.#createIfNotExists(
        this.#props.db.schema.createSchema(this.#migrationTableSchema),
      )
    } catch (error) {
      const schemaExists = await this.#doesSchemaExist()

      // At least on PostgreSQL, `if not exists` doesn't guarantee the `create schema`
      // query doesn't throw if the schema already exits. That's why we check if
      // the schema exist here and ignore the error if it does.
      if (!schemaExists) {
        throw error
      }
    }
  }

  async #ensureMigrationTableExists(): Promise<void> {
    const tableExists = await this.#doesTableExist(this.#migrationTable)

    if (tableExists) {
      return
    }

    try {
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
      const tableExists = await this.#doesTableExist(this.#migrationTable)

      // At least on PostgreSQL, `if not exists` doesn't guarantee the `create table`
      // query doesn't throw if the table already exits. That's why we check if
      // the table exist here and ignore the error if it does.
      if (!tableExists) {
        throw error
      }
    }
  }

  async #ensureMigrationLockTableExists(): Promise<void> {
    const tableExists = await this.#doesTableExist(this.#migrationLockTable)

    if (tableExists) {
      return
    }

    try {
      await this.#createIfNotExists(
        this.#props.db.schema
          .withPlugin(this.#schemaPlugin)
          .createTable(this.#migrationLockTable)
          .addColumn('id', 'varchar(255)', (col) => col.notNull().primaryKey())
          .addColumn('is_locked', 'integer', (col) =>
            col.notNull().defaultTo(0),
          ),
      )
    } catch (error) {
      const tableExists = await this.#doesTableExist(this.#migrationLockTable)

      // At least on PostgreSQL, `if not exists` doesn't guarantee the `create table`
      // query doesn't throw if the table already exits. That's why we check if
      // the table exist here and ignore the error if it does.
      if (!tableExists) {
        throw error
      }
    }
  }

  async #ensureLockRowExists(): Promise<void> {
    const lockRowExists = await this.#doesLockRowExists()

    if (lockRowExists) {
      return
    }

    try {
      await this.#props.db
        .withPlugin(this.#schemaPlugin)
        .insertInto(this.#migrationLockTable)
        .values({ id: MIGRATION_LOCK_ID, is_locked: 0 })
        .execute()
    } catch (error) {
      const lockRowExists = await this.#doesLockRowExists()

      if (!lockRowExists) {
        throw error
      }
    }
  }

  async #doesSchemaExist(): Promise<boolean> {
    const schemas = await this.#props.db.introspection.getSchemas()

    return schemas.some((it) => it.name === this.#migrationTableSchema)
  }

  async #doesTableExist(tableName: string): Promise<boolean> {
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
    options: MigrateOptions | undefined,
  ): Promise<MigrationResultSet> {
    const adapter = this.#props.db.getExecutor().adapter

    const lockOptions: MigrationLockOptions = freeze({
      lockTable:
        this.#props.migrationLockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
      lockRowId: MIGRATION_LOCK_ID,
      lockTableSchema: this.#props.migrationTableSchema,
    })

    // Check if any of the migrations to be run have per-migration transaction config
    const state = await this.#getState(this.#props.db)
    const { direction, step } = getMigrationDirectionAndStep(state)
    let hasPerMigrationConfig: boolean
    if (direction === 'Up') {
      hasPerMigrationConfig = state.pendingMigrations
        .slice(0, step)
        .some((m) => m.config?.transaction !== undefined)
    } else {
      hasPerMigrationConfig = state.executedMigrations
        .toReversed()
        .slice(0, step)
        .map((name) => {
          return state.migrations.find((it) => it.name === name)!
        })
        .some((m) => m.config?.transaction !== undefined)
    }

    if (hasPerMigrationConfig) {
      // Run migrations based on their transaction config.
      // Use a connection for the lock and state management.
      return this.#props.db.connection().execute(async (db) => {
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
            return await this.#migrateDownWithConfig(db, state, step, adapter)
          } else if (direction === 'Up') {
            return await this.#migrateUpWithConfig(db, state, step, adapter)
          }

          return { results: [] }
        } finally {
          await adapter.releaseMigrationLock(db, lockOptions)
        }
      })
    }

    // Otherwise, run all migrations based on the global config
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

    const disableTransactions =
      options?.disableTransactions ?? this.#props.disableTransactions

    if (this.#props.db.isTransaction) {
      if (!adapter.supportsTransactionalDdl) {
        throw new Error(
          'Transactional DDL is not supported in this dialect. Passing a transaction to this migrator would result in failure or unexpected behavior.',
        )
      }

      if (disableTransactions) {
        throw new Error(
          '`disableTransactions` is true but the migrator was given a transaction. Passing a transaction to this migrator would result in failure or unexpected behavior.',
        )
      }

      return run(this.#props.db)
    }

    if (adapter.supportsTransactionalDdl && !disableTransactions) {
      return this.#props.db.transaction().execute(run)
    }

    return this.#props.db.connection().execute(run)
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
        .toReversed()
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

  async #migrateUpWithConfig(
    db: Kysely<any>,
    state: MigrationState,
    step: number,
    adapter: DialectAdapter,
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

    // Group consecutive migrations by their transaction behavior
    const batches = this.#groupMigrationsByTransaction(migrationsToRun, adapter)

    let resultIndex = 0

    for (const batch of batches) {
      const batchStartIndex = resultIndex

      try {
        if (batch.useTransaction) {
          // Run all migrations in this batch within a single transaction
          await db.transaction().execute(async (trx) => {
            for (const migration of batch.migrations) {
              await migration.up(trx)
              await trx
                .withPlugin(this.#schemaPlugin)
                .insertInto(this.#migrationTable)
                .values({
                  name: migration.name,
                  timestamp: new Date().toISOString(),
                })
                .execute()

              results[resultIndex] = {
                migrationName: migration.name,
                direction: 'Up',
                status: 'Success',
              }
              resultIndex++
            }
          })
        } else {
          // Run each migration in this batch without a transaction
          for (const migration of batch.migrations) {
            await migration.up(db)
            await db
              .withPlugin(this.#schemaPlugin)
              .insertInto(this.#migrationTable)
              .values({
                name: migration.name,
                timestamp: new Date().toISOString(),
              })
              .execute()

            results[resultIndex] = {
              migrationName: migration.name,
              direction: 'Up',
              status: 'Success',
            }
            resultIndex++
          }
        }
      } catch (error) {
        // Mark current migration as error
        results[resultIndex] = {
          migrationName: batch.migrations[resultIndex - batchStartIndex].name,
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

  async #migrateDownWithConfig(
    db: Kysely<any>,
    state: MigrationState,
    step: number,
    adapter: DialectAdapter,
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

    // Group consecutive migrations by their transaction behavior
    const batches = this.#groupMigrationsByTransaction(
      migrationsToRollback,
      adapter,
    )

    let resultIndex = 0

    for (const batch of batches) {
      const batchStartIndex = resultIndex

      try {
        if (batch.useTransaction) {
          // Run all migrations in this batch within a single transaction
          await db.transaction().execute(async (trx) => {
            for (const migration of batch.migrations) {
              if (migration.down) {
                await migration.down(trx)
                await trx
                  .withPlugin(this.#schemaPlugin)
                  .deleteFrom(this.#migrationTable)
                  .where('name', '=', migration.name)
                  .execute()

                results[resultIndex] = {
                  migrationName: migration.name,
                  direction: 'Down',
                  status: 'Success',
                }
              }
              resultIndex++
            }
          })
        } else {
          // Run each migration in this batch without a transaction
          for (const migration of batch.migrations) {
            if (migration.down) {
              await migration.down(db)
              await db
                .withPlugin(this.#schemaPlugin)
                .deleteFrom(this.#migrationTable)
                .where('name', '=', migration.name)
                .execute()

              results[resultIndex] = {
                migrationName: migration.name,
                direction: 'Down',
                status: 'Success',
              }
            }
            resultIndex++
          }
        }
      } catch (error) {
        // Mark current migration as error
        results[resultIndex] = {
          migrationName: batch.migrations[resultIndex - batchStartIndex].name,
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

  /**
   * Groups consecutive migrations by their transaction behavior.
   *
   * When transactions are enabled globally:
   * - Consecutive migrations that should use transactions are grouped together
   * - Migrations with `config: { transaction: false }` break the group
   *
   * When transactions are disabled globally:
   * - Each migration with `config: { transaction: true }` gets its own batch
   * - Other migrations are grouped together (no transaction)
   */
  #groupMigrationsByTransaction(
    migrations: ReadonlyArray<NamedMigration>,
    adapter: DialectAdapter,
  ): Array<{ useTransaction: boolean; migrations: NamedMigration[] }> {
    if (migrations.length === 0) {
      return []
    }

    const globalTransactionsEnabled =
      adapter.supportsTransactionalDdl && !this.#props.disableTransactions

    if (globalTransactionsEnabled) {
      // Group consecutive migrations that should use transactions
      // Only break when a migration explicitly opts out
      return this.#groupByConsecutiveTransactionConfig(migrations, adapter)
    }

    // Transactions are globally disabled
    // Each migration with transaction: true gets its own batch
    // Others can be grouped together
    return this.#groupForDisabledTransactions(migrations, adapter)
  }

  #groupByConsecutiveTransactionConfig(
    migrations: ReadonlyArray<NamedMigration>,
    adapter: DialectAdapter,
  ): Array<{ useTransaction: boolean; migrations: NamedMigration[] }> {
    const batches: Array<{
      useTransaction: boolean
      migrations: NamedMigration[]
    }> = []

    let currentBatch: {
      useTransaction: boolean
      migrations: NamedMigration[]
    } = {
      useTransaction: this.#shouldUseTransaction(migrations[0], adapter),
      migrations: [migrations[0]],
    }

    for (let i = 1; i < migrations.length; i++) {
      const migration = migrations[i]
      const shouldUseTx = this.#shouldUseTransaction(migration, adapter)

      if (shouldUseTx === currentBatch.useTransaction) {
        // Same transaction behavior, add to current batch
        currentBatch.migrations.push(migration)
      } else {
        // Different transaction behavior, start a new batch
        batches.push(currentBatch)
        currentBatch = {
          useTransaction: shouldUseTx,
          migrations: [migration],
        }
      }
    }

    batches.push(currentBatch)
    return batches
  }

  #groupForDisabledTransactions(
    migrations: ReadonlyArray<NamedMigration>,
    adapter: DialectAdapter,
  ): Array<{ useTransaction: boolean; migrations: NamedMigration[] }> {
    const batches: Array<{
      useTransaction: boolean
      migrations: NamedMigration[]
    }> = []

    let currentNonTxBatch: NamedMigration[] = []

    for (const migration of migrations) {
      const shouldUseTx = this.#shouldUseTransaction(migration, adapter)

      if (shouldUseTx) {
        // This migration wants a transaction - flush any pending non-tx batch
        if (currentNonTxBatch.length > 0) {
          batches.push({ useTransaction: false, migrations: currentNonTxBatch })
          currentNonTxBatch = []
        }
        // Add this migration as its own transaction batch
        batches.push({ useTransaction: true, migrations: [migration] })
      } else {
        // Add to current non-transaction batch
        currentNonTxBatch.push(migration)
      }
    }

    // Flush any remaining non-tx migrations
    if (currentNonTxBatch.length > 0) {
      batches.push({ useTransaction: false, migrations: currentNonTxBatch })
    }

    return batches
  }

  async #createIfNotExists(
    qb: CreateTableBuilder<any, any> | CreateSchemaBuilder,
  ): Promise<void> {
    if (this.#props.db.getExecutor().adapter.supportsCreateIfNotExists) {
      qb = qb.ifNotExists()
    }

    await qb.execute()
  }

  #shouldUseTransaction(
    migration: NamedMigration,
    adapter: DialectAdapter,
  ): boolean {
    // If adapter doesn't support transactional DDL, never use transactions
    if (!adapter.supportsTransactionalDdl) {
      return false
    }

    // Check per-migration config first - it can override global settings
    if (migration.config?.transaction !== undefined) {
      return migration.config.transaction
    }

    // If global disableTransactions is true and no per-migration config,
    // don't use transactions
    if (this.#props.disableTransactions) {
      return false
    }

    // Default: use transactions (since adapter supports it and not globally disabled)
    return true
  }
}

export interface MigrateOptions {
  /**
   * When `true`, don't run migrations in transactions even if the dialect supports transactional DDL.
   *
   * Default is `false`.
   *
   * This is useful when some migrations include queries that would fail otherwise.
   */
  readonly disableTransactions?: boolean
}

export interface MigratorProps extends MigrateOptions {
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
   * This only works on postgres and mssql.
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
   *    if any of the later migrations in the {@link MigrationResultSet.results}
   *    list failed (have status `Error`) AND the dialect supports transactional
   *    DDL, even the successfull migrations were rolled back.
   *
   *  - `Error` means the migration failed. In this case the
   *    {@link MigrationResultSet.error} contains the error.
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
