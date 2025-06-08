import { Dialect } from './dialect/dialect.js'
import { SchemaModule } from './schema/schema.js'
import { DynamicModule } from './dynamic/dynamic.js'
import { DefaultConnectionProvider } from './driver/default-connection-provider.js'
import { QueryExecutor } from './query-executor/query-executor.js'
import { QueryCreator, QueryCreatorProps } from './query-creator.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import { DefaultQueryExecutor } from './query-executor/default-query-executor.js'
import { DatabaseIntrospector } from './dialect/database-introspector.js'
import { freeze, isObject, isUndefined } from './util/object-utils.js'
import { RuntimeDriver } from './driver/runtime-driver.js'
import { SingleConnectionProvider } from './driver/single-connection-provider.js'
import {
  Driver,
  IsolationLevel,
  AccessMode,
  validateTransactionSettings,
} from './driver/driver.js'
import {
  createFunctionModule,
  FunctionModule,
} from './query-builder/function-module.js'
import { Log, LogConfig } from './util/log.js'
import { QueryExecutorProvider } from './query-executor/query-executor-provider.js'
import {
  DatabaseConnection,
  QueryResult,
} from './driver/database-connection.js'
import { CompiledQuery } from './query-compiler/compiled-query.js'
import { createQueryId, QueryId } from './util/query-id.js'
import { Compilable, isCompilable } from './util/compilable.js'
import { CaseBuilder } from './query-builder/case-builder.js'
import { CaseNode } from './operation-node/case-node.js'
import { parseExpression } from './parser/expression-parser.js'
import { Expression } from './expression/expression.js'
import { WithSchemaPlugin } from './plugin/with-schema/with-schema-plugin.js'
import { DrainOuterGeneric } from './util/type-utils.js'
import {
  QueryCompiler,
  RootOperationNode,
} from './query-compiler/query-compiler.js'
import {
  ReleaseSavepoint,
  RollbackToSavepoint,
} from './parser/savepoint-parser.js'
import {
  ControlledConnection,
  provideControlledConnection,
} from './util/provide-controlled-connection.js'
import { ConnectionProvider } from './driver/connection-provider.js'
import { logOnce } from './util/log-once.js'

// @ts-ignore
Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose')

/**
 * The main Kysely class.
 *
 * You should create one instance of `Kysely` per database using the {@link Kysely}
 * constructor. Each `Kysely` instance maintains its own connection pool.
 *
 * ### Examples
 *
 * This example assumes your database has a "person" table:
 *
 * ```ts
 * import * as Sqlite from 'better-sqlite3'
 * import { type Generated, Kysely, SqliteDialect } from 'kysely'
 *
 * interface Database {
 *   person: {
 *     id: Generated<number>
 *     first_name: string
 *     last_name: string | null
 *   }
 * }
 *
 * const db = new Kysely<Database>({
 *   dialect: new SqliteDialect({
 *     database: new Sqlite(':memory:'),
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
  implements QueryExecutorProvider, AsyncDisposable
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
        args.plugins ?? [],
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
  get dynamic(): DynamicModule<DB> {
    return new DynamicModule<DB>()
  }

  /**
   * Returns a {@link DatabaseIntrospector | database introspector}.
   */
  get introspection(): DatabaseIntrospector {
    return this.#props.dialect.createIntrospector(this.withoutPlugins())
  }

  /**
   * Creates a `case` statement/operator.
   *
   * See {@link ExpressionBuilder.case} for more information.
   */
  case(): CaseBuilder<DB, keyof DB>

  case<V>(value: Expression<V>): CaseBuilder<DB, keyof DB, V>

  case<V>(value?: Expression<V>): any {
    return new CaseBuilder({
      node: CaseNode.create(
        isUndefined(value) ? undefined : parseExpression(value),
      ),
    })
  }

  /**
   * Returns a {@link FunctionModule} that can be used to write somewhat type-safe function
   * calls.
   *
   * ```ts
   * const { count } = db.fn
   *
   * await db.selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .select([
   *     'id',
   *     count('pet.id').as('person_count'),
   *   ])
   *   .groupBy('person.id')
   *   .having(count('pet.id'), '>', 10)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", count("pet"."id") as "person_count"
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * group by "person"."id"
   * having count("pet"."id") > $1
   * ```
   *
   * Why "somewhat" type-safe? Because the function calls are not bound to the
   * current query context. They allow you to reference columns and tables that
   * are not in the current query. E.g. remove the `innerJoin` from the previous
   * query and TypeScript won't even complain.
   *
   * If you want to make the function calls fully type-safe, you can use the
   * {@link ExpressionBuilder.fn} getter for a query context-aware, stricter {@link FunctionModule}.
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .select((eb) => [
   *     'person.id',
   *     eb.fn.count('pet.id').as('pet_count')
   *   ])
   *   .groupBy('person.id')
   *   .having((eb) => eb.fn.count('pet.id'), '>', 10)
   *   .execute()
   * ```
   */
  get fn(): FunctionModule<DB, keyof DB> {
    return createFunctionModule()
  }

  /**
   * Creates a {@link TransactionBuilder} that can be used to run queries inside a transaction.
   *
   * The returned {@link TransactionBuilder} can be used to configure the transaction. The
   * {@link TransactionBuilder.execute} method can then be called to run the transaction.
   * {@link TransactionBuilder.execute} takes a function that is run inside the
   * transaction. If the function throws an exception,
   * 1. the exception is caught,
   * 2. the transaction is rolled back, and
   * 3. the exception is thrown again.
   * Otherwise the transaction is committed.
   *
   * The callback function passed to the {@link TransactionBuilder.execute | execute}
   * method gets the transaction object as its only argument. The transaction is
   * of type {@link Transaction} which inherits {@link Kysely}. Any query
   * started through the transaction object is executed inside the transaction.
   *
   * To run a controlled transaction, allowing you to commit and rollback manually,
   * use {@link startTransaction} instead.
   *
   * ### Examples
   *
   * <!-- siteExample("transactions", "Simple transaction", 10) -->
   *
   * This example inserts two rows in a transaction. If an exception is thrown inside
   * the callback passed to the `execute` method,
   * 1. the exception is caught,
   * 2. the transaction is rolled back, and
   * 3. the exception is thrown again.
   * Otherwise the transaction is committed.
   *
   * ```ts
   * const catto = await db.transaction().execute(async (trx) => {
   *   const jennifer = await trx.insertInto('person')
   *     .values({
   *       first_name: 'Jennifer',
   *       last_name: 'Aniston',
   *       age: 40,
   *     })
   *     .returning('id')
   *     .executeTakeFirstOrThrow()
   *
   *   return await trx.insertInto('pet')
   *     .values({
   *       owner_id: jennifer.id,
   *       name: 'Catto',
   *       species: 'cat',
   *       is_favorite: false,
   *     })
   *     .returningAll()
   *     .executeTakeFirst()
   * })
   * ```
   *
   * Setting the isolation level:
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   *
   * await db
   *   .transaction()
   *   .setIsolationLevel('serializable')
   *   .execute(async (trx) => {
   *     await doStuff(trx)
   *   })
   *
   * async function doStuff(kysely: typeof db) {
   *   // ...
   * }
   * ```
   */
  transaction(): TransactionBuilder<DB> {
    return new TransactionBuilder({ ...this.#props })
  }

  /**
   * Creates a {@link ControlledTransactionBuilder} that can be used to run queries inside a controlled transaction.
   *
   * The returned {@link ControlledTransactionBuilder} can be used to configure the transaction.
   * The {@link ControlledTransactionBuilder.execute} method can then be called
   * to start the transaction and return a {@link ControlledTransaction}.
   *
   * A {@link ControlledTransaction} allows you to commit and rollback manually,
   * execute savepoint commands. It extends {@link Transaction} which extends {@link Kysely},
   * so you can run queries inside the transaction. Once the transaction is committed,
   * or rolled back, it can't be used anymore - all queries will throw an error.
   * This is to prevent accidentally running queries outside the transaction - where
   * atomicity is not guaranteed anymore.
   *
   * ### Examples
   *
   * <!-- siteExample("transactions", "Controlled transaction", 11) -->
   *
   * A controlled transaction allows you to commit and rollback manually, execute
   * savepoint commands, and queries in general.
   *
   * In this example we start a transaction, use it to insert two rows and then commit
   * the transaction. If an error is thrown, we catch it and rollback the transaction.
   *
   * ```ts
   * const trx = await db.startTransaction().execute()
   *
   * try {
   *   const jennifer = await trx.insertInto('person')
   *     .values({
   *       first_name: 'Jennifer',
   *       last_name: 'Aniston',
   *       age: 40,
   *     })
   *     .returning('id')
   *     .executeTakeFirstOrThrow()
   *
   *   const catto = await trx.insertInto('pet')
   *     .values({
   *       owner_id: jennifer.id,
   *       name: 'Catto',
   *       species: 'cat',
   *       is_favorite: false,
   *     })
   *     .returningAll()
   *     .executeTakeFirstOrThrow()
   *
   *   await trx.commit().execute()
   *
   *   // ...
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   * ```
   *
   * <!-- siteExample("transactions", "Controlled transaction /w savepoints", 12) -->
   *
   * A controlled transaction allows you to commit and rollback manually, execute
   * savepoint commands, and queries in general.
   *
   * In this example we start a transaction, insert a person, create a savepoint,
   * try inserting a toy and a pet, and if an error is thrown, we rollback to the
   * savepoint. Eventually we release the savepoint, insert an audit record and
   * commit the transaction. If an error is thrown, we catch it and rollback the
   * transaction.
   *
   * ```ts
   * const trx = await db.startTransaction().execute()
   *
   * try {
   *   const jennifer = await trx
   *     .insertInto('person')
   *     .values({
   *       first_name: 'Jennifer',
   *       last_name: 'Aniston',
   *       age: 40,
   *     })
   *     .returning('id')
   *     .executeTakeFirstOrThrow()
   *
   *   const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   *   try {
   *     const catto = await trxAfterJennifer
   *       .insertInto('pet')
   *       .values({
   *         owner_id: jennifer.id,
   *         name: 'Catto',
   *         species: 'cat',
   *       })
   *       .returning('id')
   *       .executeTakeFirstOrThrow()
   *
   *     await trxAfterJennifer
   *       .insertInto('toy')
   *       .values({ name: 'Bone', price: 1.99, pet_id: catto.id })
   *       .execute()
   *   } catch (error) {
   *     await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   *   }
   *
   *   await trxAfterJennifer.releaseSavepoint('after_jennifer').execute()
   *
   *   await trx.insertInto('audit').values({ action: 'added Jennifer' }).execute()
   *
   *   await trx.commit().execute()
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   * ```
   */
  startTransaction(): ControlledTransactionBuilder<DB> {
    return new ControlledTransactionBuilder({ ...this.#props })
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
   *
   * async function doStuff(kysely: typeof db) {
   *   // ...
   * }
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
   * @override
   */
  override withSchema(schema: string): Kysely<DB> {
    return new Kysely({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema),
      ),
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
  withTables<T extends Record<string, Record<string, any>>>(): Kysely<
    DrainOuterGeneric<DB & T>
  > {
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

  /**
   * Executes a given compiled query or query builder.
   *
   * See {@link https://github.com/kysely-org/kysely/blob/master/site/docs/recipes/0004-splitting-query-building-and-execution.md#execute-compiled-queries splitting build, compile and execute code recipe} for more information.
   */
  executeQuery<R>(
    query: CompiledQuery<R> | Compilable<R>,
    // TODO: remove this in the future. deprecated in  0.28.x
    queryId?: QueryId,
  ): Promise<QueryResult<R>> {
    if (queryId !== undefined) {
      logOnce(
        'Passing `queryId` in `db.executeQuery` is deprecated and will result in a compile-time error in the future.',
      )
    }

    const compiledQuery = isCompilable(query) ? query.compile() : query

    return this.getExecutor().executeQuery<R>(compiledQuery)
  }

  async [Symbol.asyncDispose]() {
    await this.destroy()
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
  override get isTransaction(): true {
    return true
  }

  override transaction(): TransactionBuilder<DB> {
    throw new Error(
      'calling the transaction method for a Transaction is not supported',
    )
  }

  override connection(): ConnectionBuilder<DB> {
    throw new Error(
      'calling the connection method for a Transaction is not supported',
    )
  }

  override async destroy(): Promise<void> {
    throw new Error(
      'calling the destroy method for a Transaction is not supported',
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

  override withSchema(schema: string): Transaction<DB> {
    return new Transaction({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema),
      ),
    })
  }

  override withTables<
    T extends Record<string, Record<string, any>>,
  >(): Transaction<DrainOuterGeneric<DB & T>> {
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
   * Setting up built-in logging for preferred log levels:
   *
   * ```ts
   * import * as Sqlite from 'better-sqlite3'
   * import { Kysely, SqliteDialect } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const db = new Kysely<Database>({
   *   dialect: new SqliteDialect({
   *     database: new Sqlite(':memory:'),
   *   }),
   *   log: ['query', 'error']
   * })
   * ```
   *
   * Setting up custom logging:
   *
   * ```ts
   * import * as Sqlite from 'better-sqlite3'
   * import { Kysely, SqliteDialect } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const db = new Kysely<Database>({
   *   dialect: new SqliteDialect({
   *     database: new Sqlite(':memory:'),
   *   }),
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
        new SingleConnectionProvider(connection),
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

export class TransactionBuilder<DB> {
  readonly #props: TransactionBuilderProps

  constructor(props: TransactionBuilderProps) {
    this.#props = freeze(props)
  }

  setAccessMode(accessMode: AccessMode): TransactionBuilder<DB> {
    return new TransactionBuilder({
      ...this.#props,
      accessMode,
    })
  }

  setIsolationLevel(isolationLevel: IsolationLevel): TransactionBuilder<DB> {
    return new TransactionBuilder({
      ...this.#props,
      isolationLevel,
    })
  }

  async execute<T>(callback: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
    const { isolationLevel, accessMode, ...kyselyProps } = this.#props
    const settings = { isolationLevel, accessMode }

    validateTransactionSettings(settings)

    return this.#props.executor.provideConnection(async (connection) => {
      const executor = this.#props.executor.withConnectionProvider(
        new SingleConnectionProvider(connection),
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
  readonly accessMode?: AccessMode
  readonly isolationLevel?: IsolationLevel
}

export class ControlledTransactionBuilder<DB> {
  readonly #props: TransactionBuilderProps

  constructor(props: TransactionBuilderProps) {
    this.#props = freeze(props)
  }

  setAccessMode(accessMode: AccessMode): ControlledTransactionBuilder<DB> {
    return new ControlledTransactionBuilder({
      ...this.#props,
      accessMode,
    })
  }

  setIsolationLevel(
    isolationLevel: IsolationLevel,
  ): ControlledTransactionBuilder<DB> {
    return new ControlledTransactionBuilder({
      ...this.#props,
      isolationLevel,
    })
  }

  async execute(): Promise<ControlledTransaction<DB>> {
    const { isolationLevel, accessMode, ...props } = this.#props
    const settings = { isolationLevel, accessMode }

    validateTransactionSettings(settings)

    const connection = await provideControlledConnection(this.#props.executor)

    await this.#props.driver.beginTransaction(connection.connection, settings)

    return new ControlledTransaction({
      ...props,
      connection,
      executor: this.#props.executor.withConnectionProvider(
        new SingleConnectionProvider(connection.connection),
      ),
    })
  }
}

export class ControlledTransaction<
  DB,
  S extends string[] = [],
> extends Transaction<DB> {
  readonly #props: ControlledTransactionProps
  readonly #compileQuery: QueryCompiler['compileQuery']
  readonly #state: ControlledTransctionState

  constructor(props: ControlledTransactionProps) {
    const state = { isCommitted: false, isRolledBack: false }
    props = {
      ...props,
      executor: new NotCommittedOrRolledBackAssertingExecutor(
        props.executor,
        state,
      ),
    }
    const { connection, ...transactionProps } = props
    super(transactionProps)

    this.#props = freeze(props)
    this.#state = state

    const queryId = createQueryId()
    this.#compileQuery = (node) => props.executor.compileQuery(node, queryId)
  }

  get isCommitted(): boolean {
    return this.#state.isCommitted
  }

  get isRolledBack(): boolean {
    return this.#state.isRolledBack
  }

  /**
   * Commits the transaction.
   *
   * See {@link rollback}.
   *
   * ### Examples
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const trx = await db.startTransaction().execute()
   *
   * try {
   *   await doSomething(trx)
   *
   *   await trx.commit().execute()
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   *
   * async function doSomething(kysely: Kysely<Database>) {}
   * ```
   */
  commit(): Command<void> {
    assertNotCommittedOrRolledBack(this.#state)

    return new Command(async () => {
      await this.#props.driver.commitTransaction(
        this.#props.connection.connection,
      )
      this.#state.isCommitted = true
      this.#props.connection.release()
    })
  }

  /**
   * Rolls back the transaction.
   *
   * See {@link commit} and {@link rollbackToSavepoint}.
   *
   * ### Examples
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const trx = await db.startTransaction().execute()
   *
   * try {
   *   await doSomething(trx)
   *
   *   await trx.commit().execute()
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   *
   * async function doSomething(kysely: Kysely<Database>) {}
   * ```
   */
  rollback(): Command<void> {
    assertNotCommittedOrRolledBack(this.#state)

    return new Command(async () => {
      await this.#props.driver.rollbackTransaction(
        this.#props.connection.connection,
      )
      this.#state.isRolledBack = true
      this.#props.connection.release()
    })
  }

  /**
   * Creates a savepoint with a given name.
   *
   * See {@link rollbackToSavepoint} and {@link releaseSavepoint}.
   *
   * For a type-safe experience, you should use the returned instance from now on.
   *
   * ### Examples
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const trx = await db.startTransaction().execute()
   *
   * await insertJennifer(trx)
   *
   * const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   * try {
   *   await doSomething(trxAfterJennifer)
   * } catch (error) {
   *   await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   * }
   *
   * async function insertJennifer(kysely: Kysely<Database>) {}
   * async function doSomething(kysely: Kysely<Database>) {}
   * ```
   */
  savepoint<SN extends string>(
    savepointName: SN extends S ? never : SN,
  ): Command<ControlledTransaction<DB, [...S, SN]>> {
    assertNotCommittedOrRolledBack(this.#state)

    return new Command(async () => {
      await this.#props.driver.savepoint?.(
        this.#props.connection.connection,
        savepointName,
        this.#compileQuery,
      )

      return new ControlledTransaction({ ...this.#props })
    })
  }

  /**
   * Rolls back to a savepoint with a given name.
   *
   * See {@link savepoint} and {@link releaseSavepoint}.
   *
   * You must use the same instance returned by {@link savepoint}, or
   * escape the type-check by using `as any`.
   *
   * ### Examples
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const trx = await db.startTransaction().execute()
   *
   * await insertJennifer(trx)
   *
   * const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   * try {
   *   await doSomething(trxAfterJennifer)
   * } catch (error) {
   *   await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   * }
   *
   * async function insertJennifer(kysely: Kysely<Database>) {}
   * async function doSomething(kysely: Kysely<Database>) {}
   * ```
   */
  rollbackToSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): RollbackToSavepoint<S, SN> extends string[]
    ? Command<ControlledTransaction<DB, RollbackToSavepoint<S, SN>>>
    : never {
    assertNotCommittedOrRolledBack(this.#state)

    return new Command(async () => {
      await this.#props.driver.rollbackToSavepoint?.(
        this.#props.connection.connection,
        savepointName,
        this.#compileQuery,
      )

      return new ControlledTransaction({ ...this.#props })
    }) as any
  }

  /**
   * Releases a savepoint with a given name.
   *
   * See {@link savepoint} and {@link rollbackToSavepoint}.
   *
   * You must use the same instance returned by {@link savepoint}, or
   * escape the type-check by using `as any`.
   *
   * ### Examples
   *
   * ```ts
   * import type { Kysely } from 'kysely'
   * import type { Database } from 'type-editor' // imaginary module
   *
   * const trx = await db.startTransaction().execute()
   *
   * await insertJennifer(trx)
   *
   * const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   * try {
   *   await doSomething(trxAfterJennifer)
   * } catch (error) {
   *   await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   * }
   *
   * await trxAfterJennifer.releaseSavepoint('after_jennifer').execute()
   *
   * await doSomethingElse(trx)
   *
   * async function insertJennifer(kysely: Kysely<Database>) {}
   * async function doSomething(kysely: Kysely<Database>) {}
   * async function doSomethingElse(kysely: Kysely<Database>) {}
   * ```
   */
  releaseSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): ReleaseSavepoint<S, SN> extends string[]
    ? Command<ControlledTransaction<DB, ReleaseSavepoint<S, SN>>>
    : never {
    assertNotCommittedOrRolledBack(this.#state)

    return new Command(async () => {
      await this.#props.driver.releaseSavepoint?.(
        this.#props.connection.connection,
        savepointName,
        this.#compileQuery,
      )

      return new ControlledTransaction({ ...this.#props })
    }) as any
  }

  override withPlugin(plugin: KyselyPlugin): ControlledTransaction<DB, S> {
    return new ControlledTransaction({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  override withoutPlugins(): ControlledTransaction<DB, S> {
    return new ControlledTransaction({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
  }

  override withSchema(schema: string): ControlledTransaction<DB, S> {
    return new ControlledTransaction({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema),
      ),
    })
  }

  override withTables<
    T extends Record<string, Record<string, any>>,
  >(): ControlledTransaction<DrainOuterGeneric<DB & T>, S> {
    return new ControlledTransaction({ ...this.#props })
  }
}

interface ControlledTransctionState {
  isCommitted: boolean
  isRolledBack: boolean
}

interface ControlledTransactionProps extends KyselyProps {
  readonly connection: ControlledConnection
}

export class Command<T> {
  readonly #cb: () => Promise<T>

  constructor(cb: () => Promise<T>) {
    this.#cb = cb
  }

  /**
   * Executes the command.
   */
  async execute(): Promise<T> {
    return await this.#cb()
  }
}

function assertNotCommittedOrRolledBack(
  state: ControlledTransctionState,
): void {
  if (state.isCommitted) {
    throw new Error('Transaction is already committed')
  }

  if (state.isRolledBack) {
    throw new Error('Transaction is already rolled back')
  }
}

/**
 * An executor wrapper that asserts that the transaction state is not committed
 * or rolled back when a query is executed.
 *
 * @internal
 */
class NotCommittedOrRolledBackAssertingExecutor implements QueryExecutor {
  readonly #executor: QueryExecutor
  readonly #state: ControlledTransctionState

  constructor(executor: QueryExecutor, state: ControlledTransctionState) {
    if (executor instanceof NotCommittedOrRolledBackAssertingExecutor) {
      this.#executor = executor.#executor
    } else {
      this.#executor = executor
    }

    this.#state = state
  }

  get adapter() {
    return this.#executor.adapter
  }

  get plugins() {
    return this.#executor.plugins
  }

  transformQuery<T extends RootOperationNode>(node: T, queryId: QueryId): T {
    return this.#executor.transformQuery(node, queryId)
  }

  compileQuery<R = unknown>(
    node: RootOperationNode,
    queryId: QueryId,
  ): CompiledQuery<R> {
    return this.#executor.compileQuery(node, queryId)
  }

  provideConnection<T>(
    consumer: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return this.#executor.provideConnection(consumer)
  }

  executeQuery<R>(compiledQuery: CompiledQuery<R>): Promise<QueryResult<R>> {
    assertNotCommittedOrRolledBack(this.#state)
    return this.#executor.executeQuery(compiledQuery)
  }

  stream<R>(
    compiledQuery: CompiledQuery<R>,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    assertNotCommittedOrRolledBack(this.#state)
    return this.#executor.stream(compiledQuery, chunkSize)
  }

  withConnectionProvider(
    connectionProvider: ConnectionProvider,
  ): QueryExecutor {
    return new NotCommittedOrRolledBackAssertingExecutor(
      this.#executor.withConnectionProvider(connectionProvider),
      this.#state,
    )
  }

  withPlugin(plugin: KyselyPlugin): QueryExecutor {
    return new NotCommittedOrRolledBackAssertingExecutor(
      this.#executor.withPlugin(plugin),
      this.#state,
    )
  }

  withPlugins(plugins: ReadonlyArray<KyselyPlugin>): QueryExecutor {
    return new NotCommittedOrRolledBackAssertingExecutor(
      this.#executor.withPlugins(plugins),
      this.#state,
    )
  }

  withPluginAtFront(plugin: KyselyPlugin): QueryExecutor {
    return new NotCommittedOrRolledBackAssertingExecutor(
      this.#executor.withPluginAtFront(plugin),
      this.#state,
    )
  }

  withoutPlugins(): QueryExecutor {
    return new NotCommittedOrRolledBackAssertingExecutor(
      this.#executor.withoutPlugins(),
      this.#state,
    )
  }
}
