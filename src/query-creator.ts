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
import { freeze } from './util/object-utils.js'
import { ParseContext } from './parser/parse-context.js'
import { InsertResult } from './query-builder/insert-result.js'
import { DeleteResult } from './query-builder/delete-result.js'
import { UpdateResult } from './query-builder/update-result.js'

export class QueryCreator<DB> {
  readonly #props: QueryCreatorProps

  constructor(props: QueryCreatorProps) {
    this.#props = freeze(props)
  }

  /**
   * Creates a `select` query builder for the given table or tables.
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
   * The generated SQL (PostgreSQL):
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
   * The generated SQL (PostgreSQL):
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
   * The generated SQL (PostgreSQL):
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
   * The generated SQL (PostgreSQL):
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
   * The generated SQL (PostgreSQL):
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
      executor: this.#props.executor,
      parseContext: this.#props.parseContext,
      queryNode: SelectQueryNode.create(
        parseTableExpressionOrList(this.#props.parseContext, from),
        this.#props.withNode
      ),
    })
  }

  /**
   * Creates an insert query.
   *
   * The return value of this query is an instance of {@link InsertResult}. {@link InsertResult}
   * has the {@link InsertResult.insertId | insertId} field that holds the auto incremented id of
   * the inserted row if the db returned one.
   *
   * See the {@link QueryBuilder.values | values} method for more info and examples. Also see
   * the {@link QueryBuilder.returning | returning} method for a way to return columns
   * on supported databases like PostgreSQL.
   *
   * @example
   * ```ts
   * const result = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirst()
   *
   * console.log(result.insertId)
   * ```
   *
   * @example
   * Some databases like PostgreSQL support the `returning` method:
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
  ): QueryBuilder<DB, T, InsertResult> {
    return new QueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      parseContext: this.#props.parseContext,
      queryNode: InsertQueryNode.create(
        parseTable(table),
        this.#props.withNode
      ),
    })
  }

  /**
   * Creates a delete query.
   *
   * See the {@link QueryBuilder.where} method for examples on how to specify
   * a where clause for the delete operation.
   *
   * The return value of the query is an instance of {@link DeleteResult}.
   *
   * @example
   * ```ts
   * const result = await db
   *   .deleteFrom('person')
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   *
   * console.log(result.numDeletedRows)
   * ```
   */
  deleteFrom<TR extends TableReference<DB>>(
    table: TR
  ): QueryBuilderWithTable<DB, never, DeleteResult, TR> {
    return new QueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      parseContext: this.#props.parseContext,
      queryNode: DeleteQueryNode.create(
        parseTableExpression(this.#props.parseContext, table),
        this.#props.withNode
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
   * The return value of the query is an {@link UpdateResult}.
   *
   * @example
   * ```ts
   * const result = await db
   *   .updateTable('person')
   *   .set({ first_name: 'Jennifer' })
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   *
   * console.log(result.numUpdatedRows)
   * ```
   */
  updateTable<TR extends TableReference<DB>>(
    table: TR
  ): QueryBuilderWithTable<DB, never, UpdateResult, TR> {
    return new QueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      parseContext: this.#props.parseContext,
      queryNode: UpdateQueryNode.create(
        parseTableExpression(this.#props.parseContext, table),
        this.#props.withNode
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
    const cte = parseCommonTableExpression(
      this.#props.parseContext,
      name,
      expression
    )

    return new QueryCreator({
      ...this.#props,
      withNode: this.#props.withNode
        ? WithNode.cloneWithExpression(this.#props.withNode, cte)
        : WithNode.create(cte),
    })
  }

  /**
   * Sets the schema to be used for all table references that don't explicitly
   * specify a schema.
   *
   * This only affects the query created through the builder returned from
   * this method and doesn't modify the `db` instance.
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
   * The generated SQL (PostgreSQL):
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
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "p"."name" from "mammals"."pet" as "p"
   * ```
   */
  withSchema(schema: string): QueryCreator<DB> {
    return new QueryCreator({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema)
      ),
    })
  }

  /**
   * Provides a way to pass arbitrary SQL into your query and executing completely
   * raw queries.
   *
   * You can use the strings `?` and `??` in the `sql` to bind parameters such as
   * user input to the SQL. You should never EVER concatenate untrusted user
   * input to the SQL string to avoid injection vulnerabilities. Instead use `?`
   * in place of a value and pass the actual value in the `parameters` list. See
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
   * @param sql - The raw SQL. Special strings `?` and `??` can be used as parameter
   *    placeholders. `?` for values and `??` for identifiers such as column names
   *    or `column.table` references.
   *
   * @param params - The parameters that will be bound to the `?` and `??` placeholders in
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
   * The generated SQL (PostgreSQL):
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
   * We could've also used a `??` placeholder to provide `first_name` and `last_name` like
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
   * are going to create an injection vulnerability. All user input should go to the parameters
   * array, never to the SQL string directly. But if the column names or values are trusted
   * and known at compile time, there is no reason to use parameters.
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
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where now() - birth_date > interval $1 year
   * ```
   *
   * The function in the above example returns people that are older than the given number of
   * years. The number of years in this example is an untrusted user input, and therefore we use
   * a `?` placeholder for it.
   *
   * @example
   * Example of creating a completely raw query from scratch:
   *
   * ```ts
   * const result = await db.raw<Person>('select p.* from person p').execute()
   * const persons = result.rows
   * ```
   *
   * For a raw query, you need to specify the type of the returned __row__. In
   * this case we know the resulting items will be of type `Person` se specify that.
   * The result of `execute()` method is always an array. In this case the type of
   * the `persons` variable is `Person[]`.
   */
  raw<T = unknown>(sql: string, parameters?: any[]): RawBuilder<T> {
    return new RawBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      sql,
      parameters,
    })
  }
}

export interface QueryCreatorProps {
  readonly executor: QueryExecutor
  readonly parseContext: ParseContext
  readonly withNode?: WithNode
}
