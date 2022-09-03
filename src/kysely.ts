import { Dialect } from './dialect/dialect.js'
import { SchemaModule } from './schema/schema.js'
import { DynamicModule } from './dynamic/dynamic.js'
import { DefaultConnectionProvider } from './driver/default-connection-provider.js'
import { QueryExecutor } from './query-executor/query-executor.js'
import { QueryCreator, QueryCreatorProps } from './query-creator.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import { DefaultQueryExecutor } from './query-executor/default-query-executor.js'
import { DatabaseIntrospector } from './dialect/database-introspector.js'
import { freeze, isObject } from './util/object-utils.js'
import { RuntimeDriver } from './driver/runtime-driver.js'
import { SingleConnectionProvider } from './driver/single-connection-provider.js'
import {
  Driver,
  IsolationLevel,
  TransactionSettings,
  TRANSACTION_ISOLATION_LEVELS,
} from './driver/driver.js'
import { preventAwait } from './util/prevent-await.js'
import { FunctionModule } from './query-builder/function-module.js'
import { Log, LogConfig } from './util/log.js'
import { QueryExecutorProvider } from './query-executor/query-executor-provider.js'

/**
 * The main Kysely class.
 *
 * You should create one instance of `Kysely` per database using the {@link Kysely}
 * constructor. Each `Kysely` instance maintains it's own connection pool.
 *
 * ### Examples
 *
 * This example assumes your database has tables `person` and `pet`:
 *
 * ```ts
 * import { Kysely, Generated, PostgresDialect } from 'kysely'
 *
 * interface PersonTable {
 *   id: Generated<number>
 *   first_name: string
 *   last_name: string
 * }
 *
 * interface PetTable {
 *   id: Generated<number>
 *   owner_id: number
 *   name: string
 *   species 'cat' | 'dog'
 * }
 *
 * interface Database {
 *   person: PersonTable,
 *   pet: PetTable
 * }
 *
 * const db = new Kysely<Database>({
 *   dialect: new PostgresDialect({
 *     host: 'localhost',
 *     database: 'kysely_test',
 *   })
 * })
 * ```
 *
 * @typeParam DB - The database interface type. Keys of this type must be table names
 *    in the database and values must be interfaces that describe the rows in those
 *    tables. See the examples above.
 */
export class Kysely<DB>
  extends QueryCreator<DB>
  implements QueryExecutorProvider
{
  readonly #props: KyselyProps

  constructor(args: KyselyConfig)
  constructor(args: KyselyProps)
  constructor(args: KyselyConfig | KyselyProps) {
    let superProps: QueryCreatorProps
    let props: KyselyProps

    if (isKyselyProps(args)) {
      superProps = { executor: args.executor }
      props = { ...args }
    } else {
      const dialect = args.dialect

      const driver = dialect.createDriver()
      const compiler = dialect.createQueryCompiler()
      const adapter = dialect.createAdapter()

      const log = new Log(args.log ?? [])
      const runtimeDriver = new RuntimeDriver(driver, log)

      const connectionProvider = new DefaultConnectionProvider(runtimeDriver)
      const executor = new DefaultQueryExecutor(
        compiler,
        adapter,
        connectionProvider,
        args.plugins ?? []
      )

      superProps = { executor }
      props = {
        config: args,
        executor,
        dialect,
        driver: runtimeDriver,
      }
    }

    super(superProps)
    this.#props = freeze(props)
  }

  /**
   * Returns the {@link SchemaModule} module for building database schema.
   */
  get schema(): SchemaModule {
    return new SchemaModule(this.#props.executor)
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
    return this.#props.dialect.createIntrospector(this.withoutPlugins())
  }

  /**
   * Returns a {@link FunctionModule} that can be used to write type safe function
   * calls.
   *
   * ```ts
   * const { count } = db.fn
   *
   * await db.selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .select([
   *     'person.id',
   *     count('pet.id').as('pet_count')
   *   ])
   *   .groupBy('person.id')
   *   .having(count('pet.id'), '>', 10)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", count("pet"."id") as "pet_count"
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * group by "person"."id"
   * having count("pet"."id") > $1
   * ```
   */
  get fn(): FunctionModule<DB, keyof DB> {
    return new FunctionModule()
  }

  /**
   * Creates a {@link TransactionBuilder} that can be used to run queries inside a transaction.
   *
   * The returned {@link TransactionBuilder} can be used to configure the transaction. The
   * {@link TransactionBuilder.execute} method can then be called to run the transaction.
   * {@link TransactionBuilder.execute} takes a function that is run inside the
   * transaction. If the function throws, the transaction is rolled back. Otherwise
   * the transaction is committed.
   *
   * The callback function passed to the {@link TransactionBuilder.execute | execute}
   * method gets the transaction object as its only argument. The transaction is
   * of type {@link Transaction} which inherits {@link Kysely}. Any query
   * started through the transaction object is executed inside the transaction.
   *
   * ### Examples
   *
   * ```ts
   * const catto = await db.transaction().execute(async (trx) => {
   *   const jennifer = await trx.insertInto('person')
   *     .values({
   *       first_name: 'Jennifer',
   *       last_name: 'Aniston',
   *     })
   *     .returning('id')
   *     .executeTakeFirstOrThrow()
   *
   *   await someFunction(trx, jennifer)
   *
   *   return await trx.insertInto('pet')
   *     .values({
   *       user_id: jennifer.id,
   *       name: 'Catto',
   *       species: 'cat'
   *     })
   *     .returning('*')
   *     .executeTakeFirst()
   * })
   * ```
   *
   * Setting the isolation level:
   *
   * ```ts
   * await db
   *   .transaction()
   *   .setIsolationLevel('serializable')
   *   .execute(async (trx) => {
   *     await doStuff(trx)
   *   })
   * ```
   */
  transaction(): TransactionBuilder<DB> {
    return new TransactionBuilder({ ...this.#props })
  }

  /**
   * Provides a kysely instance bound to a single database connection.
   *
   * ### Examples
   *
   * ```ts
   * await db
   *   .connection()
   *   .execute(async (db) => {
   *     // `db` is an instance of `Kysely` that's bound to a single
   *     // database connection. All queries executed through `db` use
   *     // the same connection.
   *     await doStuff(db)
   *   })
   * ```
   */
  connection(): ConnectionBuilder<DB> {
    return new ConnectionBuilder({ ...this.#props })
  }

  /**
   * Returns a copy of this Kysely instance with the given plugin installed.
   */
  override withPlugin(plugin: KyselyPlugin): Kysely<DB> {
    return new Kysely({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  /**
   * Returns a copy of this Kysely instance without any plugins.
   */
  override withoutPlugins(): Kysely<DB> {
    return new Kysely({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
  }

  /**
   * Returns a copy of this Kysely instance with tables added to its
   * database type.
   *
   * This method only modifies the types and doesn't affect any of the
   * executed queries in any way.
   *
   * ### Examples
   *
   * The following example adds and uses a temporary table:
   *
   * @example
   * ```ts
   * await db.schema
   *   .createTable('temp_table')
   *   .temporary()
   *   .addColumn('some_column', 'integer')
   *   .execute()
   *
   * const tempDb = db.withTables<{
   *   temp_table: {
   *     some_column: number
   *   }
   * }>()
   *
   * await tempDb
   *   .insertInto('temp_table')
   *   .values({ some_column: 100 })
   *   .execute()
   * ```
   */
  withTables<T extends Record<string, Record<string, any>>>(): Kysely<DB & T> {
    return new Kysely({ ...this.#props })
  }

  /**
   * Releases all resources and disconnects from the database.
   *
   * You need to call this when you are done using the `Kysely` instance.
   */
  async destroy(): Promise<void> {
    await this.#props.driver.destroy()
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
   * @internal
   * @private
   */
  getExecutor(): QueryExecutor {
    return this.#props.executor
  }
}

export class Transaction<DB> extends Kysely<DB> {
  readonly #props: KyselyProps

  constructor(props: KyselyProps) {
    super(props)
    this.#props = props
  }

  // The return type is `true` instead of `boolean` to make Kysely<DB>
  // unassignable to Transaction<DB> while allowing assignment the
  // other way around.
  get isTransaction(): true {
    return true
  }

  transaction(): TransactionBuilder<DB> {
    throw new Error(
      'calling the transaction method for a Transaction is not supported'
    )
  }

  connection(): ConnectionBuilder<DB> {
    throw new Error(
      'calling the connection method for a Transaction is not supported'
    )
  }

  async destroy(): Promise<void> {
    throw new Error(
      'calling the destroy method for a Transaction is not supported'
    )
  }

  override withPlugin(plugin: KyselyPlugin): Transaction<DB> {
    return new Transaction({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  override withoutPlugins(): Transaction<DB> {
    return new Transaction({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
  }

  override withTables<
    T extends Record<string, Record<string, any>>
  >(): Transaction<DB & T> {
    return new Transaction({ ...this.#props })
  }
}

export interface KyselyProps {
  readonly config: KyselyConfig
  readonly driver: Driver
  readonly executor: QueryExecutor
  readonly dialect: Dialect
}

export function isKyselyProps(obj: unknown): obj is KyselyProps {
  return (
    isObject(obj) &&
    isObject(obj.config) &&
    isObject(obj.driver) &&
    isObject(obj.executor) &&
    isObject(obj.dialect)
  )
}

export interface KyselyConfig {
  readonly dialect: Dialect
  readonly plugins?: KyselyPlugin[]

  /**
   * A list of log levels to log or a custom logger function.
   *
   * Currently there's only two levels: `query` and `error`.
   * This will be expanded based on user feedback later.
   *
   * ### Examples
   *
   * ```ts
   * const db = new Kysely<Database>({
   *   dialect: new PostgresDialect(postgresConfig),
   *   log: ['query', 'error']
   * })
   * ```
   *
   * ```ts
   * const db = new Kysely<Database>({
   *   dialect: new PostgresDialect(postgresConfig),
   *   log(event): void {
   *     if (event.level === 'query') {
   *       console.log(event.query.sql)
   *       console.log(event.query.parameters)
   *     }
   *   }
   * })
   * ```
   */
  readonly log?: LogConfig
}

export class ConnectionBuilder<DB> {
  readonly #props: ConnectionBuilderProps

  constructor(props: ConnectionBuilderProps) {
    this.#props = freeze(props)
  }

  async execute<T>(callback: (db: Kysely<DB>) => Promise<T>): Promise<T> {
    return this.#props.executor.provideConnection(async (connection) => {
      const executor = this.#props.executor.withConnectionProvider(
        new SingleConnectionProvider(connection)
      )

      const db = new Kysely<DB>({
        ...this.#props,
        executor,
      })

      return await callback(db)
    })
  }
}

interface ConnectionBuilderProps extends KyselyProps {}

preventAwait(
  ConnectionBuilder,
  "don't await ConnectionBuilder instances directly. To execute the query you need to call the `execute` method"
)

export class TransactionBuilder<DB> {
  readonly #props: TransactionBuilderProps

  constructor(props: TransactionBuilderProps) {
    this.#props = freeze(props)
  }

  setIsolationLevel(isolationLevel: IsolationLevel): TransactionBuilder<DB> {
    return new TransactionBuilder({
      ...this.#props,
      isolationLevel,
    })
  }

  async execute<T>(callback: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
    const { isolationLevel, ...kyselyProps } = this.#props
    const settings = { isolationLevel }

    validateTransactionSettings(settings)

    return this.#props.executor.provideConnection(async (connection) => {
      const executor = this.#props.executor.withConnectionProvider(
        new SingleConnectionProvider(connection)
      )

      const transaction = new Transaction<DB>({
        ...kyselyProps,
        executor,
      })

      try {
        await this.#props.driver.beginTransaction(connection, settings)
        const result = await callback(transaction)
        await this.#props.driver.commitTransaction(connection)

        return result
      } catch (error) {
        await this.#props.driver.rollbackTransaction(connection)
        throw error
      }
    })
  }
}

interface TransactionBuilderProps extends KyselyProps {
  readonly isolationLevel?: IsolationLevel
}

preventAwait(
  TransactionBuilder,
  "don't await TransactionBuilder instances directly. To execute the transaction you need to call the `execute` method"
)

function validateTransactionSettings(settings: TransactionSettings): void {
  if (
    settings.isolationLevel &&
    !TRANSACTION_ISOLATION_LEVELS.includes(settings.isolationLevel)
  ) {
    throw new Error(
      `invalid transaction isolation level ${settings.isolationLevel}`
    )
  }
}
