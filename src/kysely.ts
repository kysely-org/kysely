import { DriverConfig } from './driver/driver-config.js'
import { Dialect } from './dialect/dialect.js'
import { PostgresDialect } from './dialect/postgres/postgres-dialect.js'
import { Driver } from './driver/driver.js'
import { SchemaModule } from './schema/schema.js'
import { DynamicModule } from './dynamic/dynamic.js'
import { QueryCompiler } from './query-compiler/query-compiler.js'
import { DefaultConnectionProvider } from './driver/default-connection-provider.js'
import { isObject } from './util/object-utils.js'
import { SingleConnectionProvider } from './driver/single-connection-provider.js'
import {
  INTERNAL_DRIVER_ACQUIRE_CONNECTION,
  INTERNAL_DRIVER_ENSURE_DESTROY,
  INTERNAL_DRIVER_RELEASE_CONNECTION,
} from './driver/driver-internal.js'
import { MigrationModule } from './migration/migration.js'
import { QueryExecutor, RowMapper } from './query-executor/query-executor.js'
import { QueryCreator } from './query-creator.js'
import { KyselyPlugin } from './plugin/plugin.js'
import { OperationNodeTransformer } from './operation-node/operation-node-transformer.js'
import { GeneratedPlaceholder } from './query-builder/type-utils.js'
import { generatedPlaceholder } from './util/generated-placeholder.js'
import { DefaultQueryExecutor } from './query-executor/default-query-executor.js'
import { DatabaseIntrospector } from './introspection/database-introspector.js'

/**
 * The main Kysely class.
 *
 * You should create one instance of `Kysely` per database. Each `Kysely` instance
 * maintains it's own connection pool.
 *
 * @example
 * This example assumes your database has tables `person` and `pet`:
 *
 * ```ts
 * interface Person {
 *   id: number
 *   first_name: string
 *   last_name: string
 * }
 *
 * interface Pet {
 *   id: number
 *   owner_id: number
 *   name: string
 *   species 'cat' | 'dog'
 * }
 *
 * interface Database {
 *   person: Person,
 *   pet: Pet
 * }
 *
 * const db = new Kysely<Database>(config)
 * ```
 *
 * @typeParam DB - The database interface type. Keys of this type must be table names
 *    in the database and values must be interfaces that describe the rows in those
 *    tables. See the examples above.
 */
export class Kysely<DB> extends QueryCreator<DB> {
  readonly #dialect: Dialect
  readonly #driver: Driver
  readonly #compiler: QueryCompiler
  readonly #executor: QueryExecutor

  constructor(config: KyselyConfig)
  constructor(args: KyselyConstructorArgs)
  constructor(configOrArgs: KyselyConfig | KyselyConstructorArgs) {
    if (isKyselyConstructorArgs(configOrArgs)) {
      const { dialect, driver, compiler, executor } = configOrArgs

      super(executor)

      this.#dialect = dialect
      this.#driver = driver
      this.#compiler = compiler
      this.#executor = executor
    } else {
      const config = configOrArgs
      const dialect = createDialect(config)
      const transformers = collectTransformers(config)
      const rowMappers = collectRowMappers(config)
      const driver = dialect.createDriver(config)
      const compiler = dialect.createQueryCompiler()
      const connectionProvider = new DefaultConnectionProvider(driver)
      const executor = new DefaultQueryExecutor(
        compiler,
        connectionProvider,
        transformers,
        rowMappers
      )

      super(executor)

      this.#dialect = dialect
      this.#driver = driver
      this.#compiler = compiler
      this.#executor = executor
    }
  }

  /**
   * Returns the {@link SchemaModule} module for building database schema.
   */
  get schema(): SchemaModule {
    return new SchemaModule(this.#executor)
  }

  /**
   * Returns the {@link MigrationModule} module for managing and running migrations.
   */
  get migration(): MigrationModule {
    return new MigrationModule(this)
  }

  /**
   * Returns a the {@link DynamicModule} module.
   *
   * The {@link DynamicModule} module can be used to bypass strict typing and
   * passing in dynamic values for the queries.
   */
  get dynamic(): DynamicModule {
    return new DynamicModule()
  }

  /**
   * Returns a {@link DatabaseIntrospector | database introspector}.
   */
  get introspection(): DatabaseIntrospector {
    return this.#dialect.createIntrospector(this)
  }

  /**
   * A value to be used in place of columns that are generated in the database
   * when inserting rows.
   *
   * @example
   * In this example the `Person` table has non-null properties `id` and `created_at`
   * which are both automatically genereted by the database. Since their types are
   * `number` and `string` respectively instead of `number | null` and `string | null`
   * the `values` method requires you to give a value for them. the `generated`
   * placeholder can be used in these cases.
   *
   * ```ts
   * await db.insertInto('person')
   *   .values({
   *     id: db.generated,
   *     created_at: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston',
   *     gender: 'female'
   *   })
   *   .execute()
   * ```
   */
  get generated(): GeneratedPlaceholder {
    return generatedPlaceholder
  }

  /**
   * Starts a transaction. If the callback throws the transaction is rolled back,
   * otherwise it's committed.
   *
   * @example
   * In the example below if either query fails or `someFunction` throws, both inserts
   * will be rolled back. Otherwise the transaction will be committed by the time the
   * `transaction` function returns the output value. The output value of the
   * `transaction` method is the value returned from the callback.
   *
   * ```ts
   * const catto = await db.transaction(async (trx) => {
   *   const jennifer = await trx.insertInto('person')
   *     .values({
   *       first_name: 'Jennifer',
   *      last_name: 'Aniston',
   *     })
   *     .returning('id')
   *     .executeTakeFirst()
   *
   *   await someFunction(trx, jennifer)
   *
   *   return await trx.insertInto('pet')
   *     .values({
   *       user_id: jennifer!.id,
   *       name: 'Catto',
   *       species: 'cat'
   *     })
   *     .returning('*')
   *     .executeTakeFirst()
   * })
   * ```
   *
   * @example
   * If you need to set the isolation level or any other transaction property,
   * you can use `raw`:
   *
   * ```ts
   * await db.transaction(async (trx) => {
   *   await trx.raw('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE').execute()
   *   await doStuff(trx)
   * })
   * ```
   */
  async transaction<T>(
    callback: (trx: Transaction<DB>) => Promise<T>
  ): Promise<T> {
    const connection = await this.#driver[INTERNAL_DRIVER_ACQUIRE_CONNECTION]()
    const connectionProvider = new SingleConnectionProvider(connection)

    const transaction = new Transaction<DB>({
      dialect: this.#dialect,
      driver: this.#driver,
      compiler: this.#compiler,
      executor: this.#executor.withConnectionProvider(connectionProvider),
    })

    try {
      await connection.executeQuery({ sql: 'begin', bindings: [] })
      const result = await callback(transaction)
      await connection.executeQuery({ sql: 'commit', bindings: [] })

      return result
    } catch (error) {
      await connection.executeQuery({ sql: 'rollback', bindings: [] })
      throw error
    } finally {
      await this.#driver[INTERNAL_DRIVER_RELEASE_CONNECTION](connection)
    }
  }

  /**
   * Returns a copy of this Kysely instance without any plugins.
   */
  withoutPlugins(): Kysely<DB> {
    return new Kysely({
      dialect: this.#dialect,
      driver: this.#driver,
      compiler: this.#compiler,
      executor: this.#executor.withoutTransformersOrRowMappers(),
    })
  }

  /**
   * Releases all resources and disconnects from the database.
   *
   * You need to call this when you are done using the `Kysely` instance.
   */
  async destroy(): Promise<void> {
    await this.#driver[INTERNAL_DRIVER_ENSURE_DESTROY]()
  }

  /**
   * Returns true if this `Kysely` instance is a transaction.
   *
   * You can also use `db instanceof Transaction`.
   */
  get isTransaction(): boolean {
    return false
  }
}

export class Transaction<DB> extends Kysely<DB> {
  // The return type is `true` instead of `boolean` to make Kysely<DB>
  // unassignable to Transaction<DB> while allowing assignment the
  // other way around.
  get isTransaction(): true {
    return true
  }

  get migration(): MigrationModule {
    throw new Error(
      'the migration module is not available for a transaction. Use the main Kysely instance to run migrations'
    )
  }

  async transaction<T>(_: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
    throw new Error(
      'calling the transaction method for a Transaction is not supported'
    )
  }

  async destroy(): Promise<void> {
    throw new Error(
      'calling the destroy method for a Transaction is not supported'
    )
  }
}

export interface KyselyConstructorArgs {
  dialect: Dialect
  driver: Driver
  compiler: QueryCompiler
  executor: QueryExecutor
}

function isKyselyConstructorArgs(obj: any): obj is KyselyConstructorArgs {
  return (
    isObject(obj) &&
    obj.hasOwnProperty('dialect') &&
    obj.hasOwnProperty('driver') &&
    obj.hasOwnProperty('compiler') &&
    obj.hasOwnProperty('executor')
  )
}

export interface KyselyConfig extends DriverConfig {
  dialect: 'postgres' | Dialect
  plugins?: KyselyPlugin[]
}

function createDialect(config: KyselyConfig): Dialect {
  if (typeof config.dialect !== 'string') {
    return config.dialect
  } else if (config.dialect === 'postgres') {
    return new PostgresDialect()
  } else {
    throw new Error(`unknown dialect ${config.dialect}`)
  }
}

function collectTransformers(config: KyselyConfig): OperationNodeTransformer[] {
  return (
    config.plugins?.reduce<OperationNodeTransformer[]>(
      (transformers, plugin) => [
        ...transformers,
        ...plugin.createTransformers(),
      ],
      []
    ) ?? []
  )
}

function collectRowMappers(config: KyselyConfig): RowMapper[] {
  return config.plugins?.map((plugin) => plugin.mapRow.bind(plugin)) ?? []
}
