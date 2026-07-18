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
import { logOnce } from '../util/log-once.js'
import { freeze, isObject } from '../util/object-utils.js'
import type { Migration } from './migration.js'

export const DEFAULT_MIGRATION_TABLE = 'kysely_migration'
export const DEFAULT_MIGRATION_LOCK_TABLE = 'kysely_migration_lock'
export const DEFAULT_ALLOW_UNORDERED_MIGRATIONS = false
export const MIGRATION_LOCK_ID = 'migration_lock'
export const NO_MIGRATIONS: NoMigrations = freeze({ __noMigrations__: true })

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
 * import { Kysely, SqliteDialect } from 'kysely'
 * import { FileMigrationProvider, Migrator } from 'kysely/migration'
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
   * import { FileMigrationProvider, Migrator } from 'kysely/migration'
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
   * import { FileMigrationProvider, Migrator } from 'kysely/migration'
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
   * import { FileMigrationProvider, Migrator, NO_MIGRATIONS } from 'kysely/migration'
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
   * import { FileMigrationProvider, Migrator } from 'kysely/migration'
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
   * import { FileMigrationProvider, Migrator } from 'kysely/migration'
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

    const transactionMode = this.#resolveTransactionMode(options, adapter)

    const run = async (db: Kysely<any>): Promise<MigrationResultSet> => {
      const state = await this.#getState(db)

      if (state.migrations.length === 0) {
        return { results: [] }
      }

      const { direction, step } = getMigrationDirectionAndStep(state)

      if (step <= 0) {
        return { results: [] }
      }

      const migrationsToRun = this.#getMigrationsToRun(state, direction, step)

      const [orchestrator, runner] =
        direction === 'Down'
          ? [
              this.#rollbackMigrations.bind(this),
              this.#rollbackMigration.bind(this),
            ]
          : [this.#applyMigrations.bind(this), this.#applyMigration.bind(this)]

      if (transactionMode.value === 'per-migration') {
        return await orchestrator(migrationsToRun, async (migration) => {
          if (migration.config?.transaction === false) {
            return await runner(db, migration)
          }

          await db.transaction().execute((trx) => runner(trx, migration))
        })
      }

      const migrationWithTransactionConfig = migrationsToRun.find(
        (migration) => migration.config?.transaction != null,
      )

      if (migrationWithTransactionConfig) {
        const modeDescription = transactionMode.explicit
          ? `\`transactionMode\` is '${transactionMode.value}'`
          : `\`transactionMode\` was not provided and defaults to '${transactionMode.value}'`

        throw new Error(
          `Migration "${migrationWithTransactionConfig.name}" has a \`transaction\` configuration but ${modeDescription}. Per-migration transaction configuration is only supported when \`transactionMode\` is 'per-migration'. Set \`transactionMode: 'per-migration'\` on the migrator or the migrate call to enable it.`,
        )
      }

      if (
        !transactionMode.explicit &&
        adapter.supportsTransactionalDdl &&
        migrationsToRun.length > 1
      ) {
        logOnce(
          "kysely:migrator: multiple migrations were run in a single transaction ('per-run'). This default might change in a future version of Kysely. Pass an explicit `transactionMode` to the migrator to pin the behavior and silence this message: 'per-run' to keep the current behavior, or 'per-migration' to run each migration in its own transaction.",
        )
      }

      return await orchestrator(migrationsToRun, (migration) =>
        runner(db, migration),
      )
    }

    const runWithLock = async (
      db: Kysely<any>,
      cb: (db: Kysely<any>) => Promise<MigrationResultSet>,
    ): Promise<MigrationResultSet> => {
      try {
        await adapter.acquireMigrationLock(db, lockOptions)
        return await cb(db)
      } finally {
        await adapter.releaseMigrationLock(db, lockOptions)
      }
    }

    if (this.#props.db.isTransaction) {
      if (!adapter.supportsTransactionalDdl) {
        throw new Error(
          'Transactional DDL is not supported in this dialect. Passing a transaction to this migrator would result in failure or unexpected behavior.',
        )
      }

      if (transactionMode.value !== 'per-run') {
        throw new Error(
          `The transaction mode is '${transactionMode.value}' but the migrator was given a transaction. Passing a transaction to this migrator is only supported when \`transactionMode\` is 'per-run'.`,
        )
      }

      return runWithLock(this.#props.db, run)
    }

    if (transactionMode.value === 'per-run') {
      return this.#props.db
        .connection()
        .execute((db) => runWithLock(db, (db) => db.transaction().execute(run)))
    }

    return this.#props.db.connection().execute((db) => runWithLock(db, run))
  }

  #resolveTransactionMode(
    options: MigrateOptions | undefined,
    adapter: DialectAdapter,
  ): { value: MigratorTransactionMode; explicit: boolean } {
    const resolveLevel = (
      options: MigrateOptions | undefined,
      source: 'migrate call options' | 'migrator properties',
    ): { value: MigratorTransactionMode; explicit: boolean } | undefined => {
      if (!options) {
        return
      }

      const { disableTransactions, transactionMode } = options

      if (
        disableTransactions != null &&
        transactionMode &&
        (transactionMode === 'none') !== disableTransactions
      ) {
        throw new Error(
          `\`transactionMode\` is '${transactionMode}' but \`disableTransactions\` is ${disableTransactions} in the ${source}. These options contradict each other. Prefer \`transactionMode\` — \`disableTransactions\` is deprecated.`,
        )
      }

      if (transactionMode) {
        if (transactionMode !== 'none' && !adapter.supportsTransactionalDdl) {
          throw new Error(
            `\`transactionMode\` is '${transactionMode}' but transactional DDL is not supported in this dialect. Migrations would fail or behave unexpectedly.`,
          )
        }

        return { explicit: true, value: transactionMode }
      }

      if (disableTransactions == null) {
        return
      }

      if (disableTransactions === true) {
        return { explicit: true, value: 'none' }
      }

      return {
        explicit: false,
        value: adapter.supportsTransactionalDdl ? 'per-run' : 'none',
      }
    }

    return (
      resolveLevel(options, 'migrate call options') ||
      resolveLevel(this.#props, 'migrator properties') || {
        explicit: false,
        value: adapter.supportsTransactionalDdl ? 'per-run' : 'none',
      }
    )
  }

  #getMigrationsToRun(
    state: MigrationState,
    direction: MigrationDirection,
    step: number,
  ): ReadonlyArray<NamedMigration> {
    if (direction === 'Down') {
      return state.executedMigrations
        .toReversed()
        .slice(0, step)
        .map((name) => {
          return state.migrations.find((it) => it.name === name)!
        })
    }

    return state.pendingMigrations.slice(0, step)
  }

  async #getState(db: Kysely<any>): Promise<MigrationState> {
    const [migrations, executedMigrations] = await Promise.all([
      this.#resolveMigrations(),
      this.#getExecutedMigrations(db),
    ])

    this.#ensureNoMissingMigrations(migrations, executedMigrations)

    if (!this.#allowUnorderedMigrations) {
      this.#ensureMigrationsInOrder(migrations, executedMigrations)
    }

    const pendingMigrations = this.#getPendingMigrations(
      migrations,
      executedMigrations,
    )

    return freeze({
      executedMigrations,
      lastMigration: executedMigrations.at(-1),
      migrations,
      pendingMigrations,
    })
  }

  #getPendingMigrations(
    migrations: ReadonlyArray<NamedMigration>,
    executedMigrations: ReadonlyArray<string>,
  ): ReadonlyArray<NamedMigration> {
    return migrations.filter(
      (migration) => !executedMigrations.includes(migration.name),
    )
  }

  async #resolveMigrations(): Promise<ReadonlyArray<NamedMigration>> {
    const allMigrations = await this.#props.provider.getMigrations()

    return Object.keys(allMigrations)
      .sort()
      .map((name) => ({ ...allMigrations[name], name }))
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

  async #rollbackMigrations(
    migrationsToRollback: readonly NamedMigration[],
    rollbacker: (migration: NamedMigration) => Promise<void>,
  ): Promise<MigrationResultSet> {
    const results: {
      -readonly [K in keyof MigrationResult]: MigrationResult[K]
    }[] = migrationsToRollback.map((migration) => ({
      direction: 'Down',
      migrationName: migration.name,
      status: 'NotExecuted',
    }))

    for (let i = 0; i < results.length; ++i) {
      const migration = migrationsToRollback[i]

      if (!migration.down) {
        continue
      }

      try {
        await rollbacker(migration)

        results[i].status = 'Success'
      } catch (error) {
        results[i].status = 'Error'

        throw new MigrationResultSetError({ error, results })
      }
    }

    return { results }
  }

  async #applyMigrations(
    migrationsToRun: readonly NamedMigration[],
    applier: (migration: NamedMigration) => Promise<void>,
  ): Promise<MigrationResultSet> {
    const results: {
      -readonly [K in keyof MigrationResult]: MigrationResult[K]
    }[] = migrationsToRun.map((migration) => ({
      direction: 'Up',
      migrationName: migration.name,
      status: 'NotExecuted',
    }))

    for (let i = 0; i < results.length; i++) {
      const migration = migrationsToRun[i]

      try {
        await applier(migration)

        results[i].status = 'Success'
      } catch (error) {
        results[i].status = 'Error'

        throw new MigrationResultSetError({ error, results })
      }
    }

    return { results }
  }

  async #applyMigration(
    db: Kysely<any>,
    migration: NamedMigration,
  ): Promise<void> {
    await migration.up(db)
    await db
      .withPlugin(this.#schemaPlugin)
      .insertInto(this.#migrationTable)
      .values({ name: migration.name, timestamp: new Date().toISOString() })
      .execute()
  }

  async #rollbackMigration(
    db: Kysely<any>,
    migration: NamedMigration,
  ): Promise<void> {
    await migration.down!(db)
    await db
      .withPlugin(this.#schemaPlugin)
      .deleteFrom(this.#migrationTable)
      .where('name', '=', migration.name)
      .execute()
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

export interface MigrateOptions {
  /**
   * When `true`, don't run migrations in transactions even if the dialect supports transactional DDL.
   *
   * Default is `false`.
   *
   * @deprecated Use {@link transactionMode} instead — `disableTransactions: true`
   * is equivalent to `transactionMode: 'none'`. Setting both to contradicting
   * values results in an error.
   */
  readonly disableTransactions?: boolean

  /**
   * Controls how migrations are wrapped in transactions, when the dialect
   * supports transactional DDL ({@link DialectAdapter.supportsTransactionalDdl}).
   *
   * - `'per-run'` — the entire migration run is wrapped in a single transaction.
   *   Either every migration in the run is applied, or none are. Any migration
   *   with a per-migration `transaction` configuration ({@link MigrationConfig.transaction})
   *   results in an error, since a single shared transaction cannot partially
   *   exclude a migration. Requires transactional DDL — results in an error on
   *   dialects without it (e.g. MySQL).
   *
   * - `'per-migration'` — each migration runs in its own transaction, together
   *   with the insertion/deletion of its migration table record. A failure rolls
   *   back only the failing migration; previously completed migrations stay
   *   applied. Individual migrations can opt out of their transaction with
   *   `config: { transaction: false }` — required for statements that cannot
   *   run inside a transaction, such as PostgreSQL's `CREATE INDEX CONCURRENTLY`
   *   or `ALTER TYPE ... ADD VALUE` (pre-12). Requires transactional DDL —
   *   results in an error on dialects without it.
   *
   * - `'none'` — migrations run without any transactions. Any migration with a
   *   per-migration `transaction` configuration results in an error.
   *
   * When not provided, the current default is `'per-run'` on dialects that
   * support transactional DDL and `'none'` on dialects that don't. This
   * default might change to `'per-migration'` in a future version of Kysely —
   * running multiple migrations without an explicit `transactionMode` logs a
   * message about this. Provide an explicit `transactionMode` to make the
   * migrator's behavior independent of the default.
   *
   * Note that transactions spanning multiple migrations (`'per-run'`) can make
   * otherwise-valid migration sequences fail. For example, a new PostgreSQL enum
   * value cannot be used in the same transaction that added it, so a migration
   * that runs `ALTER TYPE ... ADD VALUE` followed by a migration that uses the
   * new value works when the two run in separate transactions, but fails when
   * both are pending in a single `'per-run'` mode run.
   */
  readonly transactionMode?: MigratorTransactionMode
}

export type MigratorTransactionMode = 'per-run' | 'per-migration' | 'none'

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
  /**
   * All migrations sorted by name.
   */
  readonly migrations: ReadonlyArray<NamedMigration>

  /**
   * Names of executed migrations sorted by execution timestamp.
   */
  readonly executedMigrations: ReadonlyArray<string>

  /**
   * Name of the last executed migration.
   */
  readonly lastMigration?: string

  /**
   * Migrations that have not yet ran.
   */
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
