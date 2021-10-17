import { QueryBuilder } from './query-builder/query-builder.js'
import { DeleteQueryNode } from './operation-node/delete-query-node.js'
import { InsertQueryNode } from './operation-node/insert-query-node.js'
import { SelectQueryNode } from './operation-node/select-query-node.js'
import { UpdateQueryNode } from './operation-node/update-query-node.js'
import {
  parseTable,
  parseTableExpression,
  parseTableExpressionOrList,
  QueryBuilderWithTable,
  TableExpression,
  TableExpressionOrList,
  TableReference,
} from './parser/table-parser.js'
import {
  InsertResultTypeTag,
  DeleteResultTypeTag,
  UpdateResultTypeTag,
} from './query-builder/type-utils.js'
import { QueryExecutor } from './query-executor/query-executor.js'
import { RawBuilder } from './raw-builder/raw-builder.js'
import {
  CommonTableExpression,
  parseCommonTableExpression,
  QueryCreatorWithCommonTableExpression,
} from './parser/with-parser.js'
import { WithNode } from './operation-node/with-node.js'
import { createQueryId } from './util/query-id.js'
import { WithSchemaPlugin } from './plugin/with-schema/with-schema-plugin.js'

export class QueryCreator<DB> {
  readonly #executor: QueryExecutor
  readonly #withNode?: WithNode

  constructor(executor: QueryExecutor, withNode?: WithNode) {
    this.#executor = executor
    this.#withNode = withNode
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
   *     db.raw<{ one: number }>('(select 1 as one)').as('q')
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
   *     'person as p',
   *     db.selectFrom('pet').select('pet.species').as('a'),
   *     db.raw<{ one: number }>('(select 1 as one)').as('q')
   *   ])
   *   .select(['p.id', 'a.species', 'q.one'])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "p".id, "a"."species", "q"."one"
   * from
   *   "person" as "p",
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

  selectFrom(from: TableExpressionOrList<any, any>): any {
    return new QueryBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      queryNode: SelectQueryNode.create(
        parseTableExpressionOrList(from),
        this.#withNode
      ),
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
   *     id: db.generated,
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
   *     id: db.generated,
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
      queryId: createQueryId(),
      executor: this.#executor,
      queryNode: InsertQueryNode.create(parseTable(table), this.#withNode),
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
      queryId: createQueryId(),
      executor: this.#executor,
      queryNode: DeleteQueryNode.create(
        parseTableExpression(table),
        this.#withNode
      ),
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
      queryId: createQueryId(),
      executor: this.#executor,
      queryNode: UpdateQueryNode.create(
        parseTableExpression(table),
        this.#withNode
      ),
    })
  }

  /**
   * Creates a `with` query (common table expressions).
   *
   * @example
   * ```ts
   * await db
   *   .with('jennifers', (db) => db
   *     .selectFrom('person')
   *     .where('first_name', '=', 'Jennifer')
   *     .select(['id', 'age'])
   *   )
   *   .with('adult_jennifers', (db) => db
   *     .selectFrom('jennifers')
   *     .where('age', '>', 18)
   *     .select(['id', 'age'])
   *   )
   *   .selectFrom('adult_jennifers')
   *   .where('age', '<', 60)
   *   .selectAll()
   *   .execute()
   * ```
   */
  with<N extends string, E extends CommonTableExpression<DB>>(
    name: N,
    expression: E
  ): QueryCreatorWithCommonTableExpression<DB, N, E> {
    const cte = parseCommonTableExpression(name, expression)

    return new QueryCreator(
      this.#executor,
      this.#withNode
        ? WithNode.cloneWithExpression(this.#withNode, cte)
        : WithNode.create(cte)
    )
  }

  /**
   * Sets the schema to be used for all table references that don't explicitly
   * specify a schema.
   *
   * @example
   * ```
   * await db.withSchema('mammals')
   *  .selectFrom('pet')
   *  .selectAll()
   *  .innerJoin('public.person', 'public.person.id', 'pet.owner_id')
   *  .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "mammals"."pet"
   * inner join "public"."person"
   * on "public"."person"."id" = "mammals"."pet"."owner_id"
   * ```
   *
   * @example
   * `withSchema` is smart enough to not add schema for aliases,
   * common table expressions or other places where the schema
   * doesn't belong to:
   *
   * ```
   * await db.withSchema('mammals')
   *  .selectFrom('pet as p')
   *  .select('p.name')
   *  .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "p"."name" from "mammals"."pet" as "p"
   * ```
   */
  withSchema(schema: string): QueryCreator<DB> {
    return new QueryCreator(
      this.#executor.withPluginAtFront(new WithSchemaPlugin(schema)),
      this.#withNode
    )
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
      executor: this.#executor,
    })
  }
}
