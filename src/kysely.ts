import { QueryBuilder } from './query-builder/query-builder'
import { RawBuilder } from './raw-builder/raw-builder'
import {
  TableExpression,
  QueryBuilderWithTable,
  parseTableExpressionOrList,
  parseTable,
  parseTableExpression,
  TableReference,
} from './parser/table-parser'
import { DriverConfig } from './driver/driver-config'
import { Dialect, TableMetadata } from './dialect/dialect'
import { PostgresDialect } from './dialect/postgres/postgres-dialect'
import { Driver } from './driver/driver'
import { createSchemaModule, SchemaModule } from './schema/schema'
import { selectQueryNode } from './operation-node/select-query-node'
import { insertQueryNode } from './operation-node/insert-query-node'
import { deleteQueryNode } from './operation-node/delete-query-node'
import { createDynamicModule, DynamicModule } from './dynamic/dynamic'
import {
  DeleteResultTypeTag,
  InsertResultTypeTag,
  UpdateResultTypeTag,
} from './query-builder/type-utils'
import { updateQueryNode } from './operation-node/update-query-node'
import { QueryCompiler } from './query-compiler/query-compiler'
import { DefaultConnectionProvider } from './driver/default-connection-provider'
import { ConnectionProvider } from './driver/connection-provider'
import { isObject } from './util/object-utils'
import { SingleConnectionProvider } from './driver/single-connection-provider'
import {
  INTERNAL_DRIVER_ACQUIRE_CONNECTION,
  INTERNAL_DRIVER_ENSURE_DESTROY,
  INTERNAL_DRIVER_RELEASE_CONNECTION,
} from './driver/driver-internal'
import { createMigrationModule, MigrationModule } from './migration/migration'
import { QueryExecutor } from './util/query-executor'

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
export class Kysely<DB> {
  readonly #dialect: Dialect
  readonly #driver: Driver
  readonly #compiler: QueryCompiler
  readonly #connectionProvider: ConnectionProvider

  constructor(config: KyselyConfig)
  constructor(args: KyselyConstructorArgs)
  constructor(configOrArgs: KyselyConfig | KyselyConstructorArgs) {
    if (isKyselyConstructorArgs(configOrArgs)) {
      const { dialect, driver, compiler, connectionProvider } = configOrArgs

      this.#dialect = dialect
      this.#driver = driver
      this.#compiler = compiler
      this.#connectionProvider = connectionProvider
    } else {
      const config = configOrArgs

      this.#dialect = createDialect(config)
      this.#driver = this.#dialect.createDriver(config)
      this.#compiler = this.#dialect.createQueryCompiler()
      this.#connectionProvider = new DefaultConnectionProvider(this.#driver)
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
   * Returns a the {@link Schema} module for building database schema.
   */
  get schema(): SchemaModule {
    return createSchemaModule(
      QueryExecutor.create(this.#compiler, this.#connectionProvider)
    )
  }

  /**
   * Returns a the {@link Migration} module for managing and running migrations.
   */
  get migration(): MigrationModule {
    return createMigrationModule(this)
  }

  /**
   * Returns a the {@link Dynamic} module.
   *
   * The {@link Dynamic} module can be used to bypass strict typing and
   * passing in dynamic values for the queries.
   */
  get dynamic(): DynamicModule {
    return createDynamicModule()
  }

  /**
   * Creates a `select` query builder against the given table/tables.
   *
   * The tables passed to this method are built as the query's `from` clause.
   *
   * @example
   * Create a select query for one table:
   *
   * ```ts
   * db.selectFrom('person').selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person"
   * ```
   *
   * @example
   * Create a select query for one table with an alias:
   *
   * ```ts
   * const persons = await db.selectFrom('person as p')
   *   .select(['p.id', 'p.first_name'])
   *   .execute()
   *
   * console.log(persons[0].id)
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "p"."id", "p"."first_name" from "person" as "p"
   * ```
   *
   * @example
   * Create a select query from a subquery:
   *
   * ```ts
   * const persons = await db.selectFrom(
   *     db.selectFrom('person').select('person.id as identifier').as('p')
   *   )
   *   .select('p.identifier')
   *   .execute()
   *
   * console.log(persons[0].identifier)
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "p"."identifier",
   * from (
   *   select "person"."id" as "identifier" from "person"
   * ) as p
   * ```
   *
   * @example
   * Create a select query from raw sql:
   *
   * ```ts
   * const items = await db.selectFrom(
   *     db.raw<{ one: number }>('select 1 as one').as('q')
   *   )
   *   .select('q.one')
   *   .execute()
   *
   * console.log(items[0].one)
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "q"."one",
   * from (
   *   select 1 as one
   * ) as q
   * ```
   *
   * When you use `raw` you need to also provide the result type of the
   * raw segment / query so that Kysely can figure out what columns are
   * available for the query.
   *
   * @example
   * The `selectFrom` method also accepts an array for multiple tables. All
   * the above examples can also be used in an array.
   *
   * ```ts
   * const items = await db.selectFrom([
   *     'person',
   *     'movie as m',
   *     db.selectFrom('pet').select('pet.species').as('a'),
   *     db.raw<{ one: number }>('select 1 as one').as('q')
   *   ])
   *   .select(['person.id', 'm.stars', 'a.species', 'q.one'])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person".id, "m"."stars", "a"."species", "q"."one"
   * from
   *   "person",
   *   "movie" as "m",
   *   (select "pet"."species" from "pet") as a,
   *   (select 1 as one) as "q"
   * ```
   */
  selectFrom<F extends TableExpression<DB, keyof DB>>(
    from: F[]
  ): QueryBuilderWithTable<DB, never, {}, F>

  selectFrom<F extends TableExpression<DB, keyof DB>>(
    from: F
  ): QueryBuilderWithTable<DB, never, {}, F>

  selectFrom(from: any): any {
    return new QueryBuilder({
      executor: QueryExecutor.create(this.#compiler, this.#connectionProvider),
      queryNode: selectQueryNode.create(parseTableExpressionOrList(from)),
    })
  }

  /**
   * Creates an insert query.
   *
   * The return value of this query is `number | undefined` because of the differences
   * between database engines. Most engines (like Mysql) return the auto incrementing
   * primary key (if it exists), but some (like postgres) return nothing by default.
   * If you are running a database engine like `Mysql` that always returns the primary
   * key, you can safely use `!` or the {@link QueryBuilder.castTo | castTo} method
   * to cast away the `undefined` from the type.
   *
   * See the {@link QueryBuilder.values | values} method for more info and examples. Also see
   * the {@link QueryBuilder.returning | returning} method for a way to return columns
   * on supported databases like postgres.
   *
   * @example
   * ```ts
   * const maybePrimaryKey: number | undefined = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirst()
   * ```
   *
   * @example
   * Some databases like postgres support the `returning` method:
   *
   * ```ts
   * const { id } = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning('id')
   *   .executeTakeFirst()
   * ```
   */
  insertInto<T extends keyof DB & string>(
    table: T
  ): QueryBuilder<DB, T, InsertResultTypeTag> {
    return new QueryBuilder({
      executor: QueryExecutor.create(this.#compiler, this.#connectionProvider),
      queryNode: insertQueryNode.create(parseTable(table)),
    })
  }

  /**
   * Creates a delete query.
   *
   * See the {@link QueryBuilder.where} method for examples on how to specify
   * a where clause for the delete operation .
   *
   * @example
   * ```ts
   * const numAffectedRows = await db
   *   .deleteFrom('person')
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   * ```
   */
  deleteFrom<TR extends TableReference<DB>>(
    table: TR
  ): QueryBuilderWithTable<DB, never, DeleteResultTypeTag, TR> {
    return new QueryBuilder({
      executor: QueryExecutor.create(this.#compiler, this.#connectionProvider),
      queryNode: deleteQueryNode.create(parseTableExpression(table)),
    })
  }

  /**
   * Creates an update query.
   *
   * See the {@link QueryBuilder.where} method for examples on how to specify
   * a where clause for the update operation.
   *
   * See the {@link QueryBuilder.set} method for examples on how to
   * specify the updates.
   *
   * @example
   * ```ts
   * const numAffectedRows = await db
   *   .updateTable('person')
   *   .set({ first_name: 'Jennifer' })
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   * ```
   */
  updateTable<TR extends TableReference<DB>>(
    table: TR
  ): QueryBuilderWithTable<DB, never, UpdateResultTypeTag, TR> {
    return new QueryBuilder({
      executor: QueryExecutor.create(this.#compiler, this.#connectionProvider),
      queryNode: updateQueryNode.create(parseTableExpression(table)),
    })
  }

  /**
   * Provides a way to pass arbitrary SQL into your query and executing completely
   * raw queries.
   *
   * You can use strings `?` and `??` in the `sql` to bind parameters such as
   * user input to the SQL. You should never EVER concatenate untrusted user
   * input to the SQL string to avoid injection vulnerabilities. Instead use `?`
   * in place of the value and pass the actual value in the `params` list. See
   * the examples below.
   *
   * You should only use `raw` when there is no other way to get the job done. This is
   * because Kysely is not able to use type inference when you use raw SQL. For example
   * Kysely won't be able to automatically provide you with the correct query result
   * type. However, there are ways to manually provide types when you use `raw` in most
   * cases. See the examples below.
   *
   * Raw builder instances can be passed to pretty much anywhere: `select`, `where`,
   * `*Join`, `groupBy`, `orderBy` etc. Just try it. If the method accepts it, it works.
   *
   * @param sql - The raw SQL. Special strings `?` and `??` can be used to provide
   *    parameter bindings. `?` for values and `??` for identifiers such as column names
   *    or `column.table` references.
   *
   * @param params - The parameters that will be bound to the `?` and `??` bindings in
   *    the sql string.
   *
   * @example
   * Example of using `raw` in a select statement:
   *
   * ```ts
   * const [person] = await db.selectFrom('person')
   *   .select(db.raw<string>('concat(first_name, ' ', last_name)').as('name'))
   *   .where('id', '=', 1)
   *   .execute()
   *
   * console.log(person.name)
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select concat(first_name, ' ', last_name) as "name"
   * from "person" where "id" = 1
   * ```
   *
   * The above example selects computed column `name` by concatenating the first name
   * and last name together.
   *
   * There are couple of things worth noticing:
   *
   *   1. You need to provide the output type of your SQL segment for the `raw` method
   *     so that Kysely knows what type to give for the `name` column. In this case it's
   *     a `string` since that's the output type of the `concat` function in SQL.
   *
   *   2. You need to give an alias for the selection using the `as` method so that
   *     Kysely is able to add a column to the output type. The alias needs to be
   *     known at compile time! If you pass a string variable whose value is not known
   *     at compile time, there is no way for Kysely or typescript to add a column to
   *     the output type. In this case you need to use the `castTo` method on the query
   *     to specify a return type for the query.
   *
   * We could've also used `??` bindings to provide `first_name` and `last_name` like
   * this:
   *
   * ```ts
   * db.raw<string>('concat(??, ' ', ??)', ['first_name', 'last_name'])
   * ```
   *
   * or this:
   *
   * ```ts
   * db.raw<string>('concat(??, ' ', ??)', ['person.first_name', 'person.last_name'])
   * ```
   *
   * But it's often cleaner to just write the column names in the SQL. Again remember to
   * never concatenate column names or any other untrusted user input to the SQL string or you
   * are going to create an injection vulnerability. All user input should go to the bindings
   * array, never to the SQL string directly. But if the column names or values are trusted
   * and known at compile time, there is no reason to use bindings.
   *
   * @example
   * Example of using `raw` in `where`:
   *
   * ```ts
   * function getPersonsOlderThan(ageLimit: number) {
   *   return await db.selectFrom('person')
   *     .selectAll()
   *     .where(
   *       db.raw('now() - birth_date'),
   *       '>',
   *       db.raw('interval ? year', [ageLimit.toString()])
   *     )
   *     .execute()
   * }
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where now() - birth_date > interval $1 year
   * ```
   *
   * The function in the above example returns people that are older than the given number of
   * years. The number of years in this example is an untrusted user input, and therefore we use
   * a `?` binding for it.
   *
   * @example
   * Example of creating a completely raw query from scratch:
   *
   * ```ts
   * const persons = await db.raw<Person>('select p.* from person p').execute()
   * ```
   *
   * For a raw query, you need to specify the type of the returned __row__. In
   * this case we know the resulting items will be of type `Person` se specify that.
   * The result of `execute()` method is always an array. In this case the type of
   * the `persons` variable is `Person[]`.
   */
  raw<T = unknown>(sql: string, params?: any[]): RawBuilder<T> {
    return new RawBuilder({
      sql,
      params,
      executor: QueryExecutor.create(this.#compiler, this.#connectionProvider),
    })
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
  async transaction<T>(callback: (trx: Transaction<DB>) => T): Promise<T> {
    const connection = await this.#driver[INTERNAL_DRIVER_ACQUIRE_CONNECTION]()

    const transaction = new Transaction<DB>({
      dialect: this.#dialect,
      driver: this.#driver,
      compiler: this.#compiler,
      connectionProvider: new SingleConnectionProvider(connection),
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

  async transaction<T>(_: (trx: Transaction<DB>) => T): Promise<T> {
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
  connectionProvider: ConnectionProvider
}

function isKyselyConstructorArgs(obj: any): obj is KyselyConstructorArgs {
  return (
    isObject(obj) &&
    obj.hasOwnProperty('dialect') &&
    obj.hasOwnProperty('driver') &&
    obj.hasOwnProperty('compiler') &&
    obj.hasOwnProperty('connectionProvider')
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
