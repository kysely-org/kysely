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
  TransactionSettings,
  TRANSACTION_ISOLATION_LEVELS,
} from './driver/driver.js'
import {
  createFunctionModule,
  FunctionModule,
} from './query-builder/function-module.js'
import { Log, LogConfig } from './util/log.js'
import { QueryExecutorProvider } from './query-executor/query-executor-provider.js'
import { QueryResult } from './driver/database-connection.js'
import { CompiledQuery } from './query-compiler/compiled-query.js'
import { createQueryId, QueryId } from './util/query-id.js'
import { Compilable, isCompilable } from './util/compilable.js'
import { CaseBuilder } from './query-builder/case-builder.js'
import { CaseNode } from './operation-node/case-node.js'
import { parseExpression } from './parser/expression-parser.js'
import { Expression } from './expression/expression.js'
import { WithSchemaPlugin } from './plugin/with-schema/with-schema-plugin.js'
import { DrainOuterGeneric } from './util/type-utils.js'
import { QueryCompiler } from './query-compiler/query-compiler.js'
import {
  ReleaseSavepoint,
  RollbackToSavepoint,
} from './parser/savepoint-parser.js'
import {
  ControlledConnection,
  provideControlledConnection,
} from './util/provide-controlled-connection.js'

/**
 * The main Kysely class.
 *
 * You should create one instance of `Kysely` per database using the {@link Kysely}
 * constructor. Each `Kysely` instance maintains its own connection pool.
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
 *   species: 'cat' | 'dog'
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
   * Returns a {@link FunctionModule} that can be used to write type safe function
   * calls.
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
    return createFunctionModule()
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
   * To run a controlled transaction, allowing you to commit and rollback manually,
   * use {@link startTransaction} instead.
   *
   * ### Examples
   *
   * <!-- siteExample("transactions", "Simple transaction", 10) -->
   *
   * This example inserts two rows in a transaction. If an error is thrown inside
   * the callback passed to the `execute` method, the transaction is rolled back.
   * Otherwise it's committed.
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
   *   return catto
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
   *     const bone = await trxAfterJennifer
   *       .insertInto('toy')
   *       .values({ name: 'Bone', price: 1.99 })
   *       .returning('id')
   *       .executeTakeFirstOrThrow()
   *
   *     await trxAfterJennifer
   *       .insertInto('pet')
   *       .values({
   *         owner_id: jennifer.id,
   *         name: 'Catto',
   *         species: 'cat',
   *         favorite_toy_id: bone.id,
   *       })
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
  withSchema(schema: string): Kysely<DB> {
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
    queryId: QueryId = createQueryId(),
  ): Promise<QueryResult<R>> {
    const compiledQuery = isCompilable(query) ? query.compile() : query

    return this.getExecutor().executeQuery<R>(compiledQuery, queryId)
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
      'calling the transaction method for a Transaction is not supported',
    )
  }

  connection(): ConnectionBuilder<DB> {
    throw new Error(
      'calling the connection method for a Transaction is not supported',
    )
  }

  async destroy(): Promise<void> {
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

  /**
   * @override
   */
  withSchema(schema: string): Transaction<DB> {
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
  readonly isolationLevel?: IsolationLevel
}

function validateTransactionSettings(settings: TransactionSettings): void {
  if (
    settings.isolationLevel &&
    !TRANSACTION_ISOLATION_LEVELS.includes(settings.isolationLevel)
  ) {
    throw new Error(
      `invalid transaction isolation level ${settings.isolationLevel}`,
    )
  }
}

export class ControlledTransactionBuilder<DB> {
  readonly #props: ControlledTransactionBuilderProps

  constructor(props: ControlledTransactionBuilderProps) {
    this.#props = freeze(props)
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
    const { isolationLevel, ...props } = this.#props
    const settings = { isolationLevel }

    validateTransactionSettings(settings)

    const connection = await provideControlledConnection(this.#props.executor)

    await this.#props.driver.beginTransaction(connection, settings)

    return new ControlledTransaction({
      ...props,
      connection,
      executor: this.#props.executor.withConnectionProvider(
        new SingleConnectionProvider(connection),
      ),
    })
  }
}

interface ControlledTransactionBuilderProps extends TransactionBuilderProps {
  readonly releaseConnection?: boolean
}

export class ControlledTransaction<
  DB,
  S extends string[] = [],
> extends Transaction<DB> {
  readonly #props: ControlledTransactionProps
  readonly #compileQuery: QueryCompiler['compileQuery']
  #isCommitted: boolean
  #isRolledBack: boolean

  constructor(props: ControlledTransactionProps) {
    const { connection, ...transactionProps } = props
    super(transactionProps)
    this.#props = freeze(props)

    const queryId = createQueryId()
    this.#compileQuery = (node) => props.executor.compileQuery(node, queryId)

    this.#isCommitted = false
    this.#isRolledBack = false

    this.#assertNotCommittedOrRolledBackBeforeAllExecutions()
  }

  get isCommitted(): boolean {
    return this.#isCommitted
  }

  get isRolledBack(): boolean {
    return this.#isRolledBack
  }

  /**
   * Commits the transaction.
   *
   * See {@link rollback}.
   *
   * ### Examples
   *
   * ```ts
   * try {
   *   await doSomething(trx)
   *
   *   await trx.commit().execute()
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   * ```
   */
  commit(): Command<void> {
    this.#assertNotCommittedOrRolledBack()

    return new Command(async () => {
      await this.#props.driver.commitTransaction(this.#props.connection)
      this.#isCommitted = true
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
   * try {
   *   await doSomething(trx)
   *
   *   await trx.commit().execute()
   * } catch (error) {
   *   await trx.rollback().execute()
   * }
   * ```
   */
  rollback(): Command<void> {
    this.#assertNotCommittedOrRolledBack()

    return new Command(async () => {
      await this.#props.driver.rollbackTransaction(this.#props.connection)
      this.#isRolledBack = true
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
   *   await insertJennifer(trx)
   *
   *   const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   *   try {
   *     await doSomething(trxAfterJennifer)
   *   } catch (error) {
   *     await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   *   }
   * ```
   */
  savepoint<SN extends string>(
    savepointName: SN extends S ? never : SN,
  ): Command<ControlledTransaction<DB, [...S, SN]>> {
    this.#assertNotCommittedOrRolledBack()

    return new Command(async () => {
      await this.#props.driver.savepoint?.(
        this.#props.connection,
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
   *   await insertJennifer(trx)
   *
   *   const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   *   try {
   *     await doSomething(trxAfterJennifer)
   *   } catch (error) {
   *     await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   *   }
   * ```
   */
  rollbackToSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): Command<ControlledTransaction<DB, RollbackToSavepoint<S, SN>>> {
    this.#assertNotCommittedOrRolledBack()

    return new Command(async () => {
      await this.#props.driver.rollbackToSavepoint?.(
        this.#props.connection,
        savepointName,
        this.#compileQuery,
      )

      return new ControlledTransaction({ ...this.#props })
    })
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
   *   await insertJennifer(trx)
   *
   *   const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()
   *
   *   try {
   *     await doSomething(trxAfterJennifer)
   *   } catch (error) {
   *     await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
   *   }
   *
   *   await trxAfterJennifer.releaseSavepoint('after_jennifer').execute()
   *
   *   await doSomethingElse(trx)
   * ```
   */
  releaseSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): Command<ControlledTransaction<DB, ReleaseSavepoint<S, SN>>> {
    this.#assertNotCommittedOrRolledBack()

    return new Command(async () => {
      await this.#props.driver.releaseSavepoint?.(
        this.#props.connection,
        savepointName,
        this.#compileQuery,
      )

      return new ControlledTransaction({ ...this.#props })
    })
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

  #assertNotCommittedOrRolledBackBeforeAllExecutions() {
    const { executor } = this.#props

    const originalExecuteQuery = executor.executeQuery.bind(executor)
    executor.executeQuery = async (query, queryId) => {
      this.#assertNotCommittedOrRolledBack()
      return await originalExecuteQuery(query, queryId)
    }

    const that = this
    const originalStream = executor.stream.bind(executor)
    executor.stream = (query, chunkSize, queryId) => {
      that.#assertNotCommittedOrRolledBack()
      return originalStream(query, chunkSize, queryId)
    }
  }

  #assertNotCommittedOrRolledBack(): void {
    if (this.isCommitted) {
      throw new Error('Transaction is already committed')
    }

    if (this.isRolledBack) {
      throw new Error('Transaction is already rolled back')
    }
  }
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
