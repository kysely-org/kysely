import { Dialect } from './dialect/dialect.js'
import { SchemaModule } from './schema/schema.js'
import { DynamicModule } from './dynamic/dynamic.js'
import { DefaultConnectionProvider } from './driver/default-connection-provider.js'
import { MigrationModule } from './migration/migration.js'
import { QueryExecutor } from './query-executor/query-executor.js'
import { QueryCreator } from './query-creator.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import { GeneratedPlaceholder } from './util/type-utils.js'
import { GENERATED_PLACEHOLDER } from './util/generated-placeholder.js'
import { DefaultQueryExecutor } from './query-executor/default-query-executor.js'
import { DatabaseIntrospector } from './introspection/database-introspector.js'
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
import { DefaultParseContext, ParseContext } from './parser/parse-context.js'
import { FunctionBuilder } from './query-builder/function-builder.js'
import { Log, LogLevel } from './util/log.js'

/**
 * The main Kysely class.
 *
 * You should create one instance of `Kysely` per database using the {@link Kysely}
 * constructor. Each `Kysely` instance maintains it's own connection pool.
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
export class Kysely<DB> extends QueryCreator<DB> {
  readonly #props: KyselyProps

  constructor(args: KyselyConfig)
  constructor(args: KyselyProps)
  constructor(args: KyselyConfig | KyselyProps) {
    if (isKyselyProps(args)) {
      super({ executor: args.executor, parseContext: args.parseContext })
      this.#props = freeze({ ...args })
    } else {
      const dialect = args.dialect

      const driver = dialect.createDriver()
      const compiler = dialect.createQueryCompiler()
      const adapter = dialect.createAdapter()

      const log = new Log(args.log ?? [])
      const parseContext = new DefaultParseContext(adapter)
      const runtimeDriver = new RuntimeDriver(driver, log)

      const connectionProvider = new DefaultConnectionProvider(runtimeDriver)
      const executor = new DefaultQueryExecutor(
        compiler,
        connectionProvider,
        args.plugins ?? []
      )

      super({ executor, parseContext })

      this.#props = freeze({
        config: args,
        executor,
        dialect,
        driver: runtimeDriver,
        parseContext,
      })
    }
  }

  /**
   * Returns the {@link SchemaModule} module for building database schema.
   */
  get schema(): SchemaModule {
    return new SchemaModule(this.#props.executor)
  }

  /**
   * Returns the {@link MigrationModule} module for managing and running migrations.
   */
  get migration(): MigrationModule {
    return new MigrationModule(this, this.#props.parseContext.adapter)
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
    return GENERATED_PLACEHOLDER
  }

  /**
   * Returns a {@link FunctionBuilder} that can be used to write type safe function
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person"."id", count("pet"."id") as "pet_count"
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * group by "person"."id"
   * having count("pet"."id") > $1
   * ```
   */
  get fn(): FunctionBuilder<DB, keyof DB> {
    return new FunctionBuilder({ executor: this.#props.executor })
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
   * The callback function passed to the {@link TransactionBuilder.execute | execute}
   * method gets the transaction object as its only argument. The transaction is
   * of type {@link Transaction} which inherits {@link Kysely}. Any query
   * started through the transaction object is executed inside the transaction.
   *
   * @example
   * ```ts
   * const catto = await db.transaction().execute(async (trx) => {
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
   * Setting the isolation level.
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
   * @example
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
  withPlugin(plugin: KyselyPlugin): Kysely<DB> {
    return new Kysely({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  /**
   * Returns a copy of this Kysely instance without any plugins.
   */
  withoutPlugins(): Kysely<DB> {
    return new Kysely({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
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

  transaction(): TransactionBuilder<DB> {
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

export interface KyselyProps {
  readonly config: KyselyConfig
  readonly driver: Driver
  readonly executor: QueryExecutor
  readonly dialect: Dialect
  readonly parseContext: ParseContext
}

export function isKyselyProps(obj: unknown): obj is KyselyProps {
  return (
    isObject(obj) &&
    isObject(obj.config) &&
    isObject(obj.driver) &&
    isObject(obj.executor) &&
    isObject(obj.dialect) &&
    isObject(obj.parseContext)
  )
}

export interface KyselyConfig {
  readonly dialect: Dialect
  readonly plugins?: KyselyPlugin[]

  /**
   * A list of log levels to log.
   *
   * Currently there's only one level: `query` and it's logged using
   * `console.log`. This will be expanded based on user request later.
   *
   * Log levels:
   *
   *  - query: Log each query's SQL and duration.
   */
  readonly log?: ReadonlyArray<LogLevel>
}

export class ConnectionBuilder<DB> {
  readonly #props: ConnectionBuilderProps

  constructor(props: ConnectionBuilderProps) {
    this.#props = freeze(props)
  }

  async execute<T>(callback: (db: Kysely<DB>) => Promise<T>): Promise<T> {
    const connection = await this.#props.driver.acquireConnection()
    const connectionProvider = new SingleConnectionProvider(connection)

    const transaction = new Kysely<DB>({
      ...this.#props,
      executor: this.#props.executor.withConnectionProvider(connectionProvider),
    })

    try {
      return await callback(transaction)
    } finally {
      await this.#props.driver.releaseConnection(connection)
    }
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

    const connection = await this.#props.driver.acquireConnection()
    const connectionProvider = new SingleConnectionProvider(connection)

    const transaction = new Transaction<DB>({
      ...kyselyProps,
      executor: this.#props.executor.withConnectionProvider(connectionProvider),
    })

    try {
      await this.#props.driver.beginTransaction(connection, settings)
      const result = await callback(transaction)
      await this.#props.driver.commitTransaction(connection)

      return result
    } catch (error) {
      await this.#props.driver.rollbackTransaction(connection)
      throw error
    } finally {
      await this.#props.driver.releaseConnection(connection)
    }
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
