import { SelectQueryBuilder } from './query-builder/select-query-builder.js'
import { InsertQueryBuilder } from './query-builder/insert-query-builder.js'
import { DeleteQueryBuilder } from './query-builder/delete-query-builder.js'
import { UpdateQueryBuilder } from './query-builder/update-query-builder.js'
import { DeleteQueryNode } from './operation-node/delete-query-node.js'
import { InsertQueryNode } from './operation-node/insert-query-node.js'
import { SelectQueryNode } from './operation-node/select-query-node.js'
import { UpdateQueryNode } from './operation-node/update-query-node.js'
import {
  parseTable,
  parseTableExpression,
  parseTableExpressionOrList,
  TableExpression,
  From,
  TableExpressionOrList,
  FromTables,
  TableReference,
  TableReferenceOrList,
  ExtractTableAlias,
  AnyAliasedTable,
  PickTableWithAlias,
} from './parser/table-parser.js'
import { QueryExecutor } from './query-executor/query-executor.js'
import {
  CommonTableExpression,
  parseCommonTableExpression,
  QueryCreatorWithCommonTableExpression,
  RecursiveCommonTableExpression,
} from './parser/with-parser.js'
import { WithNode } from './operation-node/with-node.js'
import { createQueryId } from './util/query-id.js'
import { WithSchemaPlugin } from './plugin/with-schema/with-schema-plugin.js'
import { freeze } from './util/object-utils.js'
import { InsertResult } from './query-builder/insert-result.js'
import { DeleteResult } from './query-builder/delete-result.js'
import { UpdateResult } from './query-builder/update-result.js'
import { KyselyPlugin } from './plugin/kysely-plugin.js'
import { QueryNodeErrorConstructor } from './query-builder/query-node-error.js'

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
   * ### Examples
   *
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
   * Create a select query for one table with an alias:
   *
   * ```ts
   * const persons = await db.selectFrom('person as p')
   *   .select(['p.id', 'first_name'])
   *   .execute()
   *
   * console.log(persons[0].id)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "p"."id", "first_name" from "person" as "p"
   * ```
   *
   * Create a select query from a subquery:
   *
   * ```ts
   * const persons = await db.selectFrom(
   *     (eb) => eb.selectFrom('person').select('person.id as identifier').as('p')
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
   * Create a select query from raw sql:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const items = await db
   *   .selectFrom(sql<{ one: number }>`(select 1 as one)`.as('q'))
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
   * When you use the `sql` tag you need to also provide the result type of the
   * raw snippet / query so that Kysely can figure out what columns are
   * available for the rest of the query.
   *
   * The `selectFrom` method also accepts an array for multiple tables. All
   * the above examples can also be used in an array.
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const items = await db.selectFrom([
   *     'person as p',
   *     db.selectFrom('pet').select('pet.species').as('a'),
   *     sql<{ one: number }>`(select 1 as one)`.as('q')
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
  selectFrom<TE extends keyof DB & string>(
    from: TE[]
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends TableExpression<DB, keyof DB>>(
    from: TE[]
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, never, TE>, {}>

  selectFrom<TE extends keyof DB & string>(
    from: TE
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends AnyAliasedTable<DB>>(
    from: TE
  ): SelectQueryBuilder<
    DB & PickTableWithAlias<DB, TE>,
    ExtractTableAlias<DB, TE>,
    {}
  >

  selectFrom<TE extends TableExpression<DB, keyof DB>>(
    from: TE
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, never, TE>, {}>

  selectFrom(from: TableExpressionOrList<any, any>): any {
    return new SelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: SelectQueryNode.create(
        parseTableExpressionOrList(from),
        this.#props.withNode
      ),
      noResultErrorConstructor: this.#props.noResultErrorConstructor,
    })
  }

  /**
   * Creates an insert query.
   *
   * The return value of this query is an instance of {@link InsertResult}. {@link InsertResult}
   * has the {@link InsertResult.insertId | insertId} field that holds the auto incremented id of
   * the inserted row if the db returned one.
   *
   * See the {@link InsertQueryBuilder.values | values} method for more info and examples. Also see
   * the {@link ReturningInterface.returning | returning} method for a way to return columns
   * on supported databases like PostgreSQL.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirst()
   *
   * console.log(result.insertId)
   * ```
   *
   * Some databases like PostgreSQL support the `returning` method:
   *
   * ```ts
   * const { id } = await db
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
  ): InsertQueryBuilder<DB, T, InsertResult> {
    return new InsertQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: InsertQueryNode.create(
        parseTable(table),
        this.#props.withNode
      ),
      noResultErrorConstructor: this.#props.noResultErrorConstructor,
    })
  }

  /**
   * Creates a replace query.
   *
   * A MySQL-only statement similar to {@link InsertQueryBuilder.onDuplicateKeyUpdate}
   * that deletes and inserts values on collision instead of updating existing rows.
   *
   * The return value of this query is an instance of {@link InsertResult}. {@link InsertResult}
   * has the {@link InsertResult.insertId | insertId} field that holds the auto incremented id of
   * the inserted row if the db returned one.
   *
   * See the {@link InsertQueryBuilder.values | values} method for more info and examples.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .replaceInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirst()
   *
   * console.log(result.insertId)
   * ```
   */
  replaceInto<T extends keyof DB & string>(
    table: T
  ): InsertQueryBuilder<DB, T, InsertResult> {
    return new InsertQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: InsertQueryNode.create(
        parseTable(table),
        this.#props.withNode,
        true
      ),
      noResultErrorConstructor: this.#props.noResultErrorConstructor,
    })
  }

  /**
   * Creates a delete query.
   *
   * See the {@link DeleteQueryBuilder.where} method for examples on how to specify
   * a where clause for the delete operation.
   *
   * The return value of the query is an instance of {@link DeleteResult}.
   *
   * ### Examples
   *
   * Deleting person with id 1:
   *
   * ```ts
   * const result = await db
   *   .deleteFrom('person')
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   *
   * console.log(result.numDeletedRows)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * delete from "person" where "person"."id" = $1
   * ```
   *
   * Some databases such as MySQL support deleting from multiple tables:
   *
   * ```ts
   * const result = await db
   *   .deleteFrom(['person', 'pet'])
   *   .using('person')
   *   .innerJoin('pet', 'pet.owner_id', '=', 'person.id')
   *   .where('person.id', '=', 1)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * delete from `person`, `pet`
   * using `person`
   * inner join `pet` on `pet`.`owner_id` = `person`.`id`
   * where `person`.`id` = ?
   * ```
   */
  deleteFrom<TR extends keyof DB & string>(
    from: TR[]
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, TR>, DeleteResult>

  deleteFrom<TR extends TableReference<DB>>(
    tables: TR[]
  ): DeleteQueryBuilder<From<DB, TR>, FromTables<DB, never, TR>, DeleteResult>

  deleteFrom<TR extends keyof DB & string>(
    from: TR
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, TR>, DeleteResult>

  deleteFrom<TR extends TableReference<DB>>(
    table: TR
  ): DeleteQueryBuilder<From<DB, TR>, FromTables<DB, never, TR>, DeleteResult>

  deleteFrom(tables: TableReferenceOrList<DB>): any {
    return new DeleteQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: DeleteQueryNode.create(
        parseTableExpressionOrList(tables),
        this.#props.withNode
      ),
      noResultErrorConstructor: this.#props.noResultErrorConstructor,
    })
  }

  /**
   * Creates an update query.
   *
   * See the {@link UpdateQueryBuilder.where} method for examples on how to specify
   * a where clause for the update operation.
   *
   * See the {@link UpdateQueryBuilder.set} method for examples on how to
   * specify the updates.
   *
   * The return value of the query is an {@link UpdateResult}.
   *
   * ### Examples
   *
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
  updateTable<TR extends keyof DB & string>(
    table: TR
  ): UpdateQueryBuilder<
    DB,
    ExtractTableAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    UpdateResult
  >

  updateTable<TR extends AnyAliasedTable<DB>>(
    table: TR
  ): UpdateQueryBuilder<
    DB & PickTableWithAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    ExtractTableAlias<DB, TR>,
    UpdateResult
  >

  updateTable<TR extends TableReference<DB>>(
    table: TR
  ): UpdateQueryBuilder<
    From<DB, TR>,
    FromTables<DB, never, TR>,
    FromTables<DB, never, TR>,
    UpdateResult
  >

  updateTable<TR extends TableReference<DB>>(table: TR): any {
    return new UpdateQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: UpdateQueryNode.create(
        parseTableExpression(table),
        this.#props.withNode
      ),
      noResultErrorConstructor: this.#props.noResultErrorConstructor,
    })
  }

  /**
   * Creates a `with` query (Common Table Expression).
   *
   * ### Examples
   *
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
   *
   * The CTE name can optionally specify column names in addition to
   * a name. In that case Kysely requires the expression to retun
   * rows with the same columns.
   *
   * ```ts
   * await db
   *   .with('jennifers(id, age)', (db) => db
   *     .selectFrom('person')
   *     .where('first_name', '=', 'Jennifer')
   *     // This is ok since we return columns with the same
   *     // names as specified by `jennifers(id, age)`.
   *     .select(['id', 'age'])
   *   )
   *   .selectFrom('jennifers')
   *   .selectAll()
   *   .execute()
   * ```
   */
  with<N extends string, E extends CommonTableExpression<DB, N>>(
    name: N,
    expression: E
  ): QueryCreatorWithCommonTableExpression<DB, N, E> {
    const cte = parseCommonTableExpression(name, expression)

    return new QueryCreator({
      ...this.#props,
      withNode: this.#props.withNode
        ? WithNode.cloneWithExpression(this.#props.withNode, cte)
        : WithNode.create(cte),
    })
  }

  /**
   * Creates a recursive `with` query (Common Table Expression).
   *
   * See the {@link with} method for examples and more documentation.
   */
  withRecursive<
    N extends string,
    E extends RecursiveCommonTableExpression<DB, N>
  >(name: N, expression: E): QueryCreatorWithCommonTableExpression<DB, N, E> {
    const cte = parseCommonTableExpression(name, expression)

    return new QueryCreator({
      ...this.#props,
      withNode: this.#props.withNode
        ? WithNode.cloneWithExpression(this.#props.withNode, cte)
        : WithNode.create(cte, { recursive: true }),
    })
  }

  /**
   * Returns a copy of this query creator instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): QueryCreator<DB> {
    return new QueryCreator({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  /**
   * Returns a copy of this query creator instance without any plugins.
   */
  withoutPlugins(): QueryCreator<DB> {
    return new QueryCreator({
      ...this.#props,
      executor: this.#props.executor.withoutPlugins(),
    })
  }

  /**
   * Sets the schema to be used for all table references that don't explicitly
   * specify a schema.
   *
   * This only affects the query created through the builder returned from
   * this method and doesn't modify the `db` instance.
   *
   * See [this recipe](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/schemas.md)
   * for a more detailed explanation.
   *
   * ### Examples
   *
   * ```
   * await db
   *   .withSchema('mammals')
   *   .selectFrom('pet')
   *   .selectAll()
   *   .innerJoin('public.person', 'public.person.id', 'pet.owner_id')
   *   .execute()
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
   * `withSchema` is smart enough to not add schema for aliases,
   * common table expressions or other places where the schema
   * doesn't belong to:
   *
   * ```
   * await db
   *   .withSchema('mammals')
   *   .selectFrom('pet as p')
   *   .select('p.name')
   *   .execute()
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
}

export interface QueryCreatorProps {
  readonly executor: QueryExecutor
  readonly withNode?: WithNode
  readonly noResultErrorConstructor: QueryNodeErrorConstructor
}
