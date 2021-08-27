import { DriverConfig } from './driver/driver-config'
import { Dialect, TableMetadata } from './dialect/dialect'
import { PostgresDialect } from './dialect/postgres/postgres-dialect'
import { Driver } from './driver/driver'
import { createSchemaModule, SchemaModule } from './schema/schema'
import { createDynamicModule, DynamicModule } from './dynamic/dynamic'
import { QueryCompiler } from './query-compiler/query-compiler'
import { DefaultConnectionProvider } from './driver/default-connection-provider'
import { isObject } from './util/object-utils'
import { SingleConnectionProvider } from './driver/single-connection-provider'
import {
  INTERNAL_DRIVER_ACQUIRE_CONNECTION,
  INTERNAL_DRIVER_ENSURE_DESTROY,
  INTERNAL_DRIVER_RELEASE_CONNECTION,
} from './driver/driver-internal'
import { createMigrationModule, MigrationModule } from './migration/migration'
import { DefaultQueryExecutor, QueryExecutor } from './util/query-executor'
import { QueryCreator } from './query-creator'

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
 * interface PersonRow {
 *   id: number
 *   first_name: string
 * }
 *
 * interface PetRow {
 *   id: number
 *   owner_id: number
 *   name: string
 *   species 'cat' | 'dog
 * }
 *
 * interface Database {
 *   person: PersonRow,
 *   pet: PetRow
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
      const driver = dialect.createDriver(config)
      const compiler = dialect.createQueryCompiler()
      const connectionProvider = new DefaultConnectionProvider(driver)
      const executor = new DefaultQueryExecutor(compiler, connectionProvider)

      super(executor)

      this.#dialect = dialect
      this.#driver = driver
      this.#compiler = compiler
      this.#executor = executor
    }
  }

  /**
   * Returns true if this `Kysely` instance is a transaction.
   *
   * You can also use `db instanceof Transaction`.
   */
  get isTransaction(): boolean {
    return false
  }

  /**
   * Returns the {@link Schema} module for building database schema.
   */
  get schema(): SchemaModule {
    return createSchemaModule(this.#executor)
  }

  /**
   * Returns the {@link Migration} module for managing and running migrations.
   */
  get migration(): MigrationModule {
    return createMigrationModule(this)
  }

  /**
   * Returns a the {@link DynamicModule} module.
   *
   * The {@link DynamicModule} module can be used to bypass strict typing and
   * passing in dynamic values for the queries.
   */
  get dynamic(): DynamicModule {
    return createDynamicModule()
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
      executor: new DefaultQueryExecutor(this.#compiler, connectionProvider),
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
   * Returns the table metadata for a table.
   */
  async getTableMetadata(
    tableName: string
  ): Promise<TableMetadata | undefined> {
    return this.#dialect.getTableMetadata(this, tableName)
  }

  /**
   * Releases all resources and disconnects from the database.
   *
   * You need to call this when you are done using the `Kysely` instance.
   */
  async destroy(): Promise<void> {
    await this.#driver[INTERNAL_DRIVER_ENSURE_DESTROY]()
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
}

function createDialect(config: KyselyConfig) {
  if (typeof config.dialect !== 'string') {
    return config.dialect
  } else if (config.dialect === 'postgres') {
    return new PostgresDialect()
  } else {
    throw new Error(`unknown dialect ${config.dialect}`)
  }
}
