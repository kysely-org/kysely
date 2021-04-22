import {
  createQueryNodeWithDeleteTable,
  createQueryNodeWithInsertTable,
  createQueryNodeWithSelectFromItems,
} from './operation-node/query-node'
import { QueryBuilder } from './query-builder/query-builder'
import { RawBuilder } from './raw-builder/raw-builder'
import {
  TableArg,
  FromQueryBuilder,
  parseFromArgs,
  parseTable,
} from './query-builder/methods/from-method'
import { DriverConfig } from './driver/driver-config'
import { Dialect } from './dialect/dialect'
import { PostgresDialect } from './dialect/postgres/postgres-dialect'
import { Driver } from './driver/driver'
import { QueryCompiler } from './query-compiler/query-compiler'
import { TransactionalConnectionProvider } from './driver/transactional-connection-provider'
import { AsyncLocalStorage } from 'async_hooks'
import { Connection } from './driver/connection'
import { ConnectionProvider } from './driver/connection-provider'
import { InsertResultTypeTag } from './query-builder/methods/insert-values-method'
import { SchemaBuilder } from './schema/schema-builder'

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
  readonly #driver: Driver
  readonly #compiler: QueryCompiler
  readonly #transactions = new AsyncLocalStorage<Connection>()
  readonly #connectionProvider: ConnectionProvider

  constructor(config: KyselyConfig) {
    const dialect = createDialect(config)

    this.#driver = dialect.createDriver(config)
    this.#compiler = dialect.createQueryCompiler()

    this.#connectionProvider = new TransactionalConnectionProvider(
      this.#driver,
      this.#transactions
    )
  }

  get schema(): SchemaBuilder {
    return new SchemaBuilder(this.#compiler, this.#connectionProvider)
  }

  /**
   * Creates a `select` query builder against the given table/tables.
   *
   * The tables passed to this method are built as the query's `from` clause.
   *
   * The tables must be:
   *
   *  - one of the keys of the `DB` type
   *  - aliased versions of the keys of the `DB` type
   *  - select queries
   *  - `raw` statements.
   *
   * See the examples.
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
  selectFrom<F extends TableArg<DB, keyof DB, {}>>(
    from: F[]
  ): FromQueryBuilder<DB, never, {}, F>

  selectFrom<F extends TableArg<DB, keyof DB, {}>>(
    from: F
  ): FromQueryBuilder<DB, never, {}, F>

  selectFrom(from: any): any {
    return new QueryBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      queryNode: createQueryNodeWithSelectFromItems(parseFromArgs(from)),
    })
  }

  /**
   * Creates an insert query.
   *
   * See {@link QueryBuilder.values} for more info and examples.
   *
   * @example
   * ```ts
   * const maybePrimaryKey = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirst()
   * ```
   */
  insertInto<T extends keyof DB & string>(
    table: T
  ): QueryBuilder<DB, T, InsertResultTypeTag> {
    return new QueryBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      queryNode: createQueryNodeWithInsertTable(parseTable(table)),
    })
  }

  /**
   * Creates a delete query.
   *
   * See {@link QueryBuilder.where} for examples on how to specify the where
   * clauses for the delete operation.
   *
   * @example
   * ```ts
   * const [maybeId] = await db
   *   .deleteFrom('person')
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   * ```
   */
  deleteFrom<T extends keyof DB & string>(table: T): QueryBuilder<DB, T, any> {
    return new QueryBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      queryNode: createQueryNodeWithDeleteTable(parseTable(table)),
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
    return new RawBuilder(sql, params)
  }

  /**
   * Returns true if called inside a Kysely.transaction() callback.
   */
  isTransactionRunning(): boolean {
    return !!this.#transactions.getStore()
  }

  /**
   * Begins a transaction for the async chain started inside the callback.
   *
   * Any `kysely` query started inside the callback or any method called
   * by the callback will automatically use the same transaction. No need to
   * pass around a transaction object. This is possible through node's async
   * hooks and specifically `AsyncLocalStorage`.
   *
   * @example
   * ```ts
   * async function main() {
   *   await db.transaction(async () => {
   *     await doStuff()
   *   });
   * }
   *
   * async function doStuff() {
   *   // This automatically uses the correct transasction because `doStuff` was
   *   // called inside the transaction method that registers the transaction
   *   // for a shared `AsyncLocalStorage` inside `Kysely`.
   *   await db.selectFrom('person').insert({ first_name: 'Jennifer' }).execute()
   *
   *   return doMoreStuff();
   * }
   *
   * function doMoreStuff(): Promise<void> {
   *   // Even this automatically uses the correct transaction even though
   *   // we didn't `await` on the method. Node's async hooks work with all
   *   // possible kinds of async events.
   *   return db.selectFrom('pet').insert({ name: 'Fluffy' }).execute()
   * }
   * ```
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    let connection: Connection | null = null

    if (this.isTransactionRunning()) {
      throw new Error(
        'You attempted to call Kysely.transaction() inside an existing transaction. Nested transactions are not yet supported. See the Kysely.isTransactionRunning() method.'
      )
    }

    try {
      await this.#driver.ensureInit()

      connection = await this.#driver.acquireConnection()
      await connection.execute<void>({ sql: 'BEGIN', bindings: [] })

      const result = await this.#transactions.run(connection, () => {
        return callback()
      })

      await connection.execute<void>({ sql: 'COMMIT', bindings: [] })
      return result
    } catch (error) {
      if (connection) {
        await connection.execute<void>({ sql: 'ROLLBACK', bindings: [] })
      }
      throw error
    } finally {
      if (connection) {
        await this.#driver.releaseConnection(connection)
      }
    }
  }

  async destroy(): Promise<void> {
    await this.#driver.ensureDestroy()
    this.#transactions.disable()
  }
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
