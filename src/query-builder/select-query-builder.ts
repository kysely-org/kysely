import { AliasNode } from '../operation-node/alias-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { SelectModifierNode } from '../operation-node/select-modifier-node.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import { TableExpression } from '../parser/table-parser.js'
import {
  parseSelectArg,
  parseSelectAll,
  SelectExpression,
  Selection,
  SelectArg,
  AllSelection,
} from '../parser/select-parser.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
  ReferenceExpressionOrList,
} from '../parser/reference-parser.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  DrainOuterGeneric,
  NarrowPartial,
  Nullable,
  ShallowRecord,
  Simplify,
  SimplifySingleResult,
  SqlBool,
} from '../util/type-utils.js'
import {
  OrderByDirectionExpression,
  OrderByExpression,
  DirectedOrderByStringReference,
  UndirectedOrderByExpression,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { LimitNode } from '../operation-node/limit-node.js'
import { OffsetNode } from '../operation-node/offset-node.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { GroupByArg, parseGroupBy } from '../parser/group-by-parser.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import {
  isNoResultErrorConstructor,
  NoResultError,
  NoResultErrorConstructor,
} from './no-result-error.js'
import { HavingInterface } from './having-interface.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { Explainable, ExplainFormat } from '../util/explainable.js'
import {
  SetOperandExpression,
  parseSetOperations,
} from '../parser/set-operation-parser.js'
import {
  AliasableExpression,
  AliasedExpression,
  Expression,
} from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
  parseReferentialBinaryOperation,
} from '../parser/binary-operation-parser.js'
import { KyselyTypeError } from '../util/type-error.js'
import { Selectable } from '../util/column-type.js'
import { Streamable } from '../util/streamable.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import { ExpressionWrapper } from '../expression/expression-wrapper.js'

export interface SelectQueryBuilder<DB, TB extends keyof DB, O>
  extends WhereInterface<DB, TB>,
    HavingInterface<DB, TB>,
    AliasableExpression<O>,
    Compilable<O>,
    Explainable,
    Streamable<O> {
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  where(
    expression: ExpressionOrFactory<DB, TB, SqlBool>
  ): SelectQueryBuilder<DB, TB, O>

  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O>

  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  having(
    expression: ExpressionOrFactory<DB, TB, SqlBool>
  ): SelectQueryBuilder<DB, TB, O>

  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds a select statement to the query.
   *
   * When a column (or any expression) is selected, Kysely adds its type to the return
   * type of the query. Kysely is smart enough to parse the selection names and types
   * from aliased columns, subqueries, raw expressions etc.
   *
   * Kysely only allows you to select columns and expressions that exist and would
   * produce valid SQL. However, Kysely is not perfect and there may be cases where
   * the type inference doesn't work and you need to override it. You can always
   * use the {@link Kysely.dynamic | dynamic} module and the {@link sql} tag
   * to override the types.
   *
   * Select calls are additive. Calling `select('id').select('first_name')` is the
   * same as calling `select(['id', 'first_name'])`.
   *
   * To select all columns of the query or specific tables see the
   * {@link selectAll} method.
   *
   * See the {@link $if} method if you are looking for a way to add selections
   * based on a runtime condition.
   *
   * ### Examples
   *
   * <!-- siteExample("select", "A single column", 10) -->
   *
   * Select a single column:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .select('id')
   *   .where('first_name', '=', 'Arnold')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "id" from "person" where "first_name" = $1
   * ```
   *
   * <!-- siteExample("select", "Column with a table", 20) -->
   *
   * Select a single column and specify a table:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom(['person', 'pet'])
   *   .select('person.id')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id" from "person", "pet"
   * ```
   *
   * <!-- siteExample("select", "Multiple columns", 30) -->
   *
   * Select multiple columns:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .select(['person.id', 'first_name'])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", "first_name" from "person"
   * ```
   *
   * <!-- siteExample("select", "Aliases", 40) -->
   *
   * You can provide an alias for the selections by appending `as the_alias` to the selection.
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name as fn',
   *     'person.last_name as ln'
   *   ])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   "first_name" as "fn",
   *   "person"."last_name" as "ln"
   * from "person"
   * ```
   *
   * <!-- siteExample("select", "Complex selections", 50) -->
   *
   * You can select arbitrary expression including subqueries and raw sql snippets.
   * When you do that, you need to give a name for the selections using the `as` method:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const persons = await db.selectFrom('person')
   *   .select(({ eb, selectFrom, or }) => [
   *     // Select a correlated subquery
   *     selectFrom('pet')
   *       .whereRef('person.id', '=', 'pet.owner_id')
   *       .select('pet.name')
   *       .orderBy('pet.name')
   *       .limit(1)
   *       .as('first_pet_name'),
   *
   *     // Build and select an expression using
   *     // the expression builder
   *     or([
   *       eb('first_name', '=', 'Jennifer'),
   *       eb('first_name', '=', 'Arnold')
   *     ]).as('is_jennifer_or_arnold'),
   *
   *     // Select a raw sql expression
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name')
   *   ])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   (
   *     select "pet"."name"
   *     from "pet"
   *     where "person"."id" = "pet"."owner_id"
   *     order by "pet"."name"
   *     limit $1
   *   ) as "pet_name",
   *   ("first_name" = $2 or "first_name" = $3) as "jennifer_or_arnold",
   *   concat(first_name, ' ', last_name) as "full_name"
   * from "person"
   * ```
   *
   * In case you use the {@link sql} tag you need to specify the type of the expression
   * (in this example `string`).
   *
   * All the examples above assume you know the column names at compile time.
   * While it's better to build your code like that (that way you also know
   * the types) sometimes it's not possible or you just prefer to write more
   * dynamic code.
   * <br><br>
   * In this example, we use the `dynamic` module's methods to add selections
   * dynamically:
   *
   * ```ts
   * const { ref } = db.dynamic
   *
   * // Some column name provided by the user. Value not known at compile time.
   * const columnFromUserInput = req.query.select;
   *
   * // A type that lists all possible values `columnFromUserInput` can have.
   * // You can use `keyof Person` if any column of an interface is allowed.
   * type PossibleColumns = 'last_name' | 'first_name' | 'birth_date'
   *
   * const spersons = await db
   *   .selectFrom('person')
   *   .select([
   *     ref<PossibleColumns>(columnFromUserInput)
   *     'id'
   *   ])
   *   .execute()
   *
   * // The resulting type contains all `PossibleColumns` as optional fields
   * // because we cannot know which field was actually selected before
   * // running the code.
   * const lastName: string | undefined = persons[0].last_name
   * const firstName: string | undefined = persons[0].first_name
   * const birthDate: string | undefined = persons[0].birth_date
   *
   * // The result type also contains the compile time selection `id`.
   * persons[0].id
   * ```
   */
  select<SE extends SelectExpression<DB, TB>>(
    selection: SelectArg<DB, TB, SE>
  ): SelectQueryBuilder<DB, TB, O & Selection<DB, TB, SE>>

  /**
   * Adds `distinct on` expressions to the select clause.
   *
   * ### Examples
   *
   * <!-- siteExample("select", "Distinct on", 80) -->
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .where('pet.name', '=', 'Doggo')
   *   .distinctOn('person.id')
   *   .selectAll('person')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select distinct on ("person"."id") "person".*
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * where "pet"."name" = $1
   * ```
   */
  distinctOn<RE extends ReferenceExpression<DB, TB>>(
    selections: ReadonlyArray<RE>
  ): SelectQueryBuilder<DB, TB, O>

  distinctOn<RE extends ReferenceExpression<DB, TB>>(
    selection: RE
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * This can be used to add any additional SQL to the front of the query __after__ the `select` keyword.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .modifyFront(sql`sql_no_cache`)
   *   .select('first_name')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * select sql_no_cache `first_name`
   * from `person`
   * ```
   */
  modifyFront(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O>

  /**
   * This can be used to add any additional SQL to the end of the query.
   *
   * Also see {@link forUpdate}, {@link forShare}, {@link forKeyShare}, {@link forNoKeyUpdate}
   * {@link skipLocked} and  {@link noWait}.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select('first_name')
   *   .modifyEnd(sql`for update`)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name"
   * from "person"
   * for update
   * ```
   */
  modifyEnd(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O>

  /**
   * Makes the selection distinct.
   *
   * <!-- siteExample("select", "Distinct", 70) -->
   *
   * ### Examples
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .select('first_name')
   *   .distinct()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select distinct "first_name" from "person"
   * ```
   */
  distinct(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `for update` modifier to a select query on supported databases.
   */
  forUpdate(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `for share` modifier to a select query on supported databases.
   */
  forShare(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `for key share` modifier to a select query on supported databases.
   */
  forKeyShare(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `for no key update` modifier to a select query on supported databases.
   */
  forNoKeyUpdate(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `skip locked` modifier to a select query on supported databases.
   */
  skipLocked(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds the `nowait` modifier to a select query on supported databases.
   */
  noWait(): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds a `select *` or `select table.*` clause to the query.
   *
   * ### Examples
   *
   * <!-- siteExample("select", "All columns", 90) -->
   *
   * The `selectAll` method generates `SELECT *`:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * ```
   *
   * <!-- siteExample("select", "All columns of a table", 100) -->
   *
   * Select all columns of a table:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".* from "person"
   * ```
   *
   * Select all columns of multiple tables:
   *
   * ```ts
   * const personsPets = await db
   *   .selectFrom(['person', 'pet'])
   *   .selectAll(['person', 'pet'])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*, "pet".* from "person", "pet"
   * ```
   */
  selectAll<T extends TB>(
    table: ReadonlyArray<T>
  ): SelectQueryBuilder<DB, TB, O & AllSelection<DB, T>>

  selectAll<T extends TB>(
    table: T
  ): SelectQueryBuilder<DB, TB, O & Selectable<DB[T]>>

  selectAll(): SelectQueryBuilder<DB, TB, O & AllSelection<DB, TB>>

  /**
   * Joins another table to the query using an inner join.
   *
   * ### Examples
   *
   * <!-- siteExample("join", "Simple inner join", 10) -->
   *
   * Simple inner joins can be done by providing a table name and two columns to join:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   // `select` needs to come after the call to `innerJoin` so
   *   // that you can select from the joined table.
   *   .select(['person.id', 'pet.name as pet_name'])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", "pet"."name" as "pet_name"
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * ```
   *
   * <!-- siteExample("join", "Aliased inner join", 20) -->
   *
   * You can give an alias for the joined table like this:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin('pet as p', 'p.owner_id', 'person.id')
   *   .where('p.name', '=', 'Doggo')
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet" as "p"
   * on "p"."owner_id" = "person"."id"
   * where "p".name" = $1
   * ```
   *
   * <!-- siteExample("join", "Complex join", 30) -->
   *
   * You can provide a function as the second argument to get a join
   * builder for creating more complex joins. The join builder has a
   * bunch of `on*` methods for building the `on` clause of the join.
   * There's basically an equivalent for every `where` method
   * (`on`, `onRef` etc.). You can do all the same things with the
   * `on` method that you can with the corresponding `where` method.
   * See the `where` method documentation for more examples.
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin(
   *     'pet',
   *     (join) => join
   *       .onRef('pet.owner_id', '=', 'person.id')
   *       .on('pet.name', '=', 'Doggo')
   *   )
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * and "pet"."name" = $1
   * ```
   *
   * <!-- siteExample("join", "Subquery join", 40) -->
   *
   * You can join a subquery by providing two callbacks:
   *
   * ```ts
   * const result = await db.selectFrom('person')
   *   .innerJoin(
   *     (eb) => eb
   *       .selectFrom('pet')
   *       .select(['owner_id as owner', 'name'])
   *       .where('name', '=', 'Doggo')
   *       .as('doggos'),
   *     (join) => join
   *       .onRef('doggos.owner', '=', 'person.id'),
   *   )
   *   .selectAll('doggos')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "doggos".*
   * from "person"
   * inner join (
   *   select "owner_id" as "owner", "name"
   *   from "pet"
   *   where "name" = $1
   * ) as "doggos"
   * on "doggos"."owner" = "person"."id"
   * ```
   */
  innerJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  /**
   * Just like {@link innerJoin} but adds a left join instead of an inner join.
   */
  leftJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  /**
   * Just like {@link innerJoin} but adds a right join instead of an inner join.
   */
  rightJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithRightJoin<DB, TB, O, TE>

  /**
   * Just like {@link innerJoin} but adds a full join instead of an inner join.
   */
  fullJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithFullJoin<DB, TB, O, TE>

  /**
   * Just like {@link innerJoin} but adds a lateral join instead of an inner join.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .innerJoinLateral(
   *     (eb) =>
   *       eb.selectFrom('pet')
   *         .select('name')
   *         .whereRef('pet.owner_id', '=', 'person.id')
   *         .as('p'),
   *     (join) => join.onTrue()
   *   )
   *   .select(['first_name', 'p.name'])
   *   .orderBy('first_name')
   * ```
   */
  innerJoinLateral<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoinLateral<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  /**
   * Just like {@link innerJoin} but adds a lateral left join instead of an inner join.
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .leftJoinLateral(
   *     (eb) =>
   *       eb.selectFrom('pet')
   *         .select('name')
   *         .whereRef('pet.owner_id', '=', 'person.id')
   *         .as('p'),
   *     (join) => join.onTrue()
   *   )
   *   .select(['first_name', 'p.name'])
   *   .orderBy('first_name')
   * ```
   */
  leftJoinLateral<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoinLateral<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  /**
   * Adds an `order by` clause to the query.
   *
   * `orderBy` calls are additive. Meaning, additional `orderBy` calls append to
   * the existing order by clause.
   *
   * In a single call you can add a single column/expression or multiple columns/expressions.
   *
   * Single column/expression calls can have 1-2 arguments. The first argument is
   * the expression to order by (optionally including the direction) while the second
   * optional argument is the direction (`asc` or `desc`).
   *
   * ### Examples
   *
   * Single column/expression per call:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .select('person.first_name as fn')
   *   .orderBy('id')
   *   .orderBy('fn desc')
   *   .execute()
   * ```
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .select('person.first_name as fn')
   *   .orderBy('id')
   *   .orderBy('fn', 'desc')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."first_name" as "fn"
   * from "person"
   * order by "id" asc, "fn" desc
   * ```
   *
   * Multiple columns/expressions per call:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .select('person.first_name as fn')
   *   .orderBy(['id', 'fn desc'])
   *   .execute()
   * ```
   *
   * The order by expression can also be a raw sql expression or a subquery
   * in addition to column references:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .orderBy((eb) => eb.selectFrom('pet')
   *     .select('pet.name')
   *     .whereRef('pet.owner_id', '=', 'person.id')
   *     .limit(1)
   *   )
   *   .orderBy(
   *     sql`concat(first_name, last_name)`
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * order by
   *   ( select "pet"."name"
   *     from "pet"
   *     where "pet"."owner_id" = "person"."id"
   *     limit 1
   *   ) asc,
   *   concat(first_name, last_name) asc
   * ```
   *
   * `dynamic.ref` can be used to refer to columns not known at
   * compile time:
   *
   * ```ts
   * async function someQuery(orderBy: string) {
   *   const { ref } = db.dynamic
   *
   *   return await db
   *     .selectFrom('person')
   *     .select('person.first_name as fn')
   *     .orderBy(ref(orderBy))
   *     .execute()
   * }
   *
   * someQuery('fn')
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."first_name" as "fn"
   * from "person"
   * order by "fn" asc
   * ```
   */
  orderBy(
    orderBy: UndirectedOrderByExpression<DB, TB, O>,
    direction?: OrderByDirectionExpression
  ): SelectQueryBuilder<DB, TB, O>

  orderBy(
    ref: DirectedOrderByStringReference<DB, TB, O>
  ): SelectQueryBuilder<DB, TB, O>

  orderBy(
    refs: ReadonlyArray<OrderByExpression<DB, TB, O>>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds a `group by` clause to the query.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     sql`max(id)`.as('max_id')
   *   ])
   *   .groupBy('first_name')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name", max(id)
   * from "person"
   * group by "first_name"
   * ```
   *
   * `groupBy` also accepts an array:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     'last_name',
   *     sql`max(id)`.as('max_id')
   *   ])
   *   .groupBy([
   *     'first_name',
   *     'last_name'
   *   ])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name", "last_name", max(id)
   * from "person"
   * group by "first_name", "last_name"
   * ```
   *
   * The group by expressions can also be subqueries or
   * raw sql expressions:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     'last_name',
   *     sql`max(id)`.as('max_id')
   *   ])
   *   .groupBy([
   *     sql`concat(first_name, last_name)`,
   *     (qb) => qb.selectFrom('pet').select('id').limit(1)
   *   ])
   *   .execute()
   * ```
   *
   * `dynamic.ref` can be used to refer to columns not known at
   * compile time:
   *
   * ```ts
   * async function someQuery(groupBy: string) {
   *   const { ref } = db.dynamic
   *
   *   return await db
   *     .selectFrom('person')
   *     .select('first_name')
   *     .groupBy(ref(groupBy))
   *     .execute()
   * }
   *
   * someQuery('first_name')
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name"
   * from "person"
   * group by "first_name"
   * ```
   */
  groupBy(groupBy: GroupByArg<DB, TB, O>): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds a limit clause to the query.
   *
   * ### Examples
   *
   * Select the first 10 rows of the result:
   *
   * ```ts
   * return await db
   *   .selectFrom('person')
   *   .select('first_name')
   *   .limit(10)
   * ```
   *
   * Select rows from index 10 to index 19 of the result:
   *
   * ```ts
   * return await db
   *   .selectFrom('person')
   *   .select('first_name')
   *   .offset(10)
   *   .limit(10)
   * ```
   */
  limit(limit: number): SelectQueryBuilder<DB, TB, O>

  /**
   * Adds an offset clause to the query.
   *
   * ### Examples
   *
   * Select rows from index 10 to index 19 of the result:
   *
   * ```ts
   * return await db
   *   .selectFrom('person')
   *   .select('first_name')
   *   .offset(10)
   *   .limit(10)
   * ```
   */
  offset(offset: number): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `union`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .union(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .union((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  union(expression: SetOperandExpression<DB, O>): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `union all`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .unionAll(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .unionAll((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  unionAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `intersect`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .intersect(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .intersect((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  intersect(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `intersect all`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .intersectAll(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .intersectAll((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  intersectAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `except`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .except(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .except((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  except(expression: SetOperandExpression<DB, O>): SelectQueryBuilder<DB, TB, O>

  /**
   * Combines another select query or raw expression to this query using `except all`.
   *
   * The output row type of the combined query must match `this` query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .exceptAll(db.selectFrom('pet').select(['id', 'name']))
   *   .orderBy('name')
   * ```
   *
   * You can provide a callback to get an expression builder.
   * In the following example, this allows us to wrap the query in parentheses:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name as name'])
   *   .exceptAll((eb) => eb.parens(
   *     eb.selectFrom('pet').select(['id', 'name'])
   *   ))
   *   .orderBy('name')
   * ```
   */
  exceptAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O>

  /**
   * Gives an alias for the query. This method is only useful for sub queries.
   *
   * ### Examples
   *
   * ```ts
   * const pets = await db.selectFrom('pet')
   *   .selectAll('pet')
   *   .select(
   *     (qb) => qb.selectFrom('person')
   *       .select('first_name')
   *       .whereRef('pet.owner_id', '=', 'person.id')
   *       .as('owner_first_name')
   *   )
   *   .execute()
   *
   * pets[0].owner_first_name
   * ```
   */
  as<A extends string>(alias: A): AliasedSelectQueryBuilder<DB, TB, O, A>

  /**
   * Clears all select clauses from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name'])
   *   .clearSelect()
   *   .select(['id', 'gender'])
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select "id", "gender" from "person"
   * ```
   */
  clearSelect(): SelectQueryBuilder<DB, TB, {}>

  clearWhere(): SelectQueryBuilder<DB, TB, O>

  /**
   * Clears limit clause from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .limit(10)
   *   .clearLimit()
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * ```
   */
  clearLimit(): SelectQueryBuilder<DB, TB, O>

  /**
   * Clears offset clause from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .limit(10)
   *   .offset(20)
   *   .clearOffset()
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select * from "person" limit 10
   * ```
   */
  clearOffset(): SelectQueryBuilder<DB, TB, O>

  /**
   * Clears all `order by` clauses from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .orderBy('id')
   *   .clearOrderBy()
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * ```
   */
  clearOrderBy(): SelectQueryBuilder<DB, TB, O>

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   *
   * If you want to conditionally call a method on `this`, see
   * the {@link $if} method.
   *
   * ### Examples
   *
   * The next example uses a helper function `log` to log a query:
   *
   * ```ts
   * function log<T extends Compilable>(qb: T): T {
   *   console.log(qb.compile())
   *   return qb
   * }
   *
   * db.selectFrom('person')
   *   .selectAll()
   *   .$call(log)
   *   .execute()
   * ```
   */
  $call<T>(func: (qb: this) => T): T

  /**
   * Call `func(this)` if `condition` is true.
   *
   * NOTE: This method has an impact on typescript performance and it should only be used
   * when necessary. Remember that you can call most methods like `where` conditionally
   * like this:
   *
   * ```ts
   * let query = db.selectFrom('person').selectAll()
   *
   * if (firstName) {
   *   query = query.where('first_name', '=', firstName)
   * }
   *
   * if (lastName) {
   *   query = query.where('last_name', '=', lastName)
   * }
   *
   * const result = await query.execute()
   * ```
   *
   * This method is mainly useful with optional selects. Any `select` or `selectAll`
   * method called inside the callback add optional fields to the result type. This is
   * because we can't know if those selections were actually made before running the code.
   *
   * Also see [this recipe](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/conditional-selects.md)
   *
   * ### Examples
   *
   * ```ts
   * async function getPerson(id: number, withLastName: boolean) {
   *   return await db
   *     .selectFrom('person')
   *     .select(['id', 'first_name'])
   *     .$if(withLastName, (qb) => qb.select('last_name'))
   *     .where('id', '=', id)
   *     .executeTakeFirstOrThrow()
   * }
   * ```
   *
   * Any selections added inside the `if` callback will be added as optional fields to the
   * output type since we can't know if the selections were actually made before running
   * the code. In the example above the return type of the `getPerson` function is:
   *
   * ```ts
   * {
   *   id: number
   *   first_name: string
   *   last_name?: string
   * }
   * ```
   *
   * You can also call any other methods inside the callback:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select('person.id')
   *   .$if(filterByFirstName, (qb) => qb.where('first_name', '=', firstName))
   *   .$if(filterByPetCount, (qb) => qb
   *     .innerJoin('pet', 'pet.owner_id', 'person.id')
   *     .having((eb) => eb.fn.count('pet.id'), '>', petCountLimit)
   *     .groupBy('person.id')
   *   )
   * ```
   */
  $if<O2>(
    condition: boolean,
    func: (qb: this) => SelectQueryBuilder<any, any, O & O2>
  ): SelectQueryBuilder<DB, TB, O & Partial<O2>>

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  $castTo<T>(): SelectQueryBuilder<DB, TB, T>

  /**
   * Changes the output type from an object to a tuple.
   *
   * This doesn't affect the generated SQL in any way. This function is
   * just a necessary evil when you need to convert a query's output
   * record type to a tuple type. Typescript doesn't currently offer
   * tools to do this automatically (without insane hackery).
   *
   * The returned object can no longer be executed. It can only be used
   * as a subquery.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .where(({ eb, refTuple, selectFrom }) => eb(
   *     refTuple('first_name', 'last_name'),
   *     'in',
   *     selectFrom('pet')
   *       .select(['name', 'species'])
   *       .where('pet.species', '!=', 'cat')
   *       .$asTuple('name', 'species')
   *   ))
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select
   *   "person".*
   * from
   *   "person"
   * where
   *   ("first_name", "last_name")
   *   in
   *   (
   *     select "name", "species"
   *     from "pet"
   *     where "pet"."species" != $1
   *   )
   * ```
   */
  $asTuple<K1 extends keyof O, K2 extends Exclude<keyof O, K1>>(
    key1: K1,
    key2: K2
  ): keyof O extends K1 | K2
    ? ExpressionWrapper<DB, TB, [O[K1], O[K2]]>
    : KyselyTypeError<'$asTuple() call failed: All selected columns must be provided as arguments'>

  $asTuple<
    K1 extends keyof O,
    K2 extends Exclude<keyof O, K1>,
    K3 extends Exclude<keyof O, K1 | K2>
  >(
    key1: K1,
    key2: K2,
    key3: K3
  ): keyof O extends K1 | K2 | K3
    ? ExpressionWrapper<DB, TB, [O[K1], O[K2], O[K3]]>
    : KyselyTypeError<'$asTuple() call failed: All selected columns must be provided as arguments'>

  $asTuple<
    K1 extends keyof O,
    K2 extends Exclude<keyof O, K1>,
    K3 extends Exclude<keyof O, K1 | K2>,
    K4 extends Exclude<keyof O, K1 | K2 | K3>
  >(
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4
  ): keyof O extends K1 | K2 | K3 | K4
    ? ExpressionWrapper<DB, TB, [O[K1], O[K2], O[K3], O[K4]]>
    : KyselyTypeError<'$asTuple() call failed: All selected columns must be provided as arguments'>

  $asTuple<
    K1 extends keyof O,
    K2 extends Exclude<keyof O, K1>,
    K3 extends Exclude<keyof O, K1 | K2>,
    K4 extends Exclude<keyof O, K1 | K2 | K3>,
    K5 extends Exclude<keyof O, K1 | K2 | K3 | K4>
  >(
    key1: K1,
    key2: K2,
    key3: K3,
    key4: K4,
    key5: K5
  ): keyof O extends K1 | K2 | K3 | K4 | K5
    ? ExpressionWrapper<DB, TB, [O[K1], O[K2], O[K3], O[K4], O[K5]]>
    : KyselyTypeError<'$asTuple() call failed: All selected columns must be provided as arguments'>

  /**
   * Narrows (parts of) the output type of the query.
   *
   * Kysely tries to be as type-safe as possible, but in some cases we have to make
   * compromises for better maintainability and compilation performance. At present,
   * Kysely doesn't narrow the output type of the query when using {@link where}, {@link having}
   * or {@link JoinQueryBuilder.on}.
   *
   * This utility method is very useful for these situations, as it removes unncessary
   * runtime assertion/guard code. Its input type is limited to the output type
   * of the query, so you can't add a column that doesn't exist, or change a column's
   * type to something that doesn't exist in its union type.
   *
   * ### Examples
   *
   * Turn this code:
   *
   * ```ts
   * const person = await db.selectFrom('person')
   *   .where('nullable_column', 'is not', null)
   *   .selectAll()
   *   .executeTakeFirstOrThrow()
   *
   * if (person.nullable_column) {
   *   functionThatExpectsPersonWithNonNullValue(person)
   * }
   * ```
   *
   * Into this:
   *
   * ```ts
   * const person = await db.selectFrom('person')
   *   .where('nullable_column', 'is not', null)
   *   .selectAll()
   *   .$narrowType<{ nullable_column: string }>()
   *   .executeTakeFirstOrThrow()
   *
   * functionThatExpectsPersonWithNonNullValue(person)
   * ```
   */
  $narrowType<T>(): SelectQueryBuilder<DB, TB, NarrowPartial<O, T>>

  /**
   * Asserts that query's output row type equals the given type `T`.
   *
   * This method can be used to simplify excessively complex types to make typescript happy
   * and much faster.
   *
   * Kysely uses complex type magic to achieve its type safety. This complexity is sometimes too much
   * for typescript and you get errors like this:
   *
   * ```
   * error TS2589: Type instantiation is excessively deep and possibly infinite.
   * ```
   *
   * In these case you can often use this method to help typescript a little bit. When you use this
   * method to assert the output type of a query, Kysely can drop the complex output type that
   * consists of multiple nested helper types and replace it with the simple asserted type.
   *
   * Using this method doesn't reduce type safety at all. You have to pass in a type that is
   * structurally equal to the current type.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db
   *   .with('first_and_last', (qb) => qb
   *     .selectFrom('person')
   *     .select(['first_name', 'last_name'])
   *     .$assertType<{ first_name: string, last_name: string }>()
   *   )
   *   .with('age', (qb) => qb
   *     .selectFrom('person')
   *     .select('age')
   *     .$assertType<{ age: number }>()
   *   )
   *   .selectFrom(['first_and_last', 'age'])
   *   .selectAll()
   *   .executeTakeFirstOrThrow()
   * ```
   */
  $assertType<T extends O>(): O extends T
    ? SelectQueryBuilder<DB, TB, T>
    : KyselyTypeError<`$assertType() call failed: The type passed in is not equal to the output type of the query.`>

  /**
   * Returns a copy of this SelectQueryBuilder instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): SelectQueryBuilder<DB, TB, O>

  toOperationNode(): SelectQueryNode

  compile(): CompiledQuery<Simplify<O>>

  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  execute(): Promise<Simplify<O>[]>

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  executeTakeFirst(): Promise<SimplifySingleResult<O>>

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class, or callback to throw a different
   * error.
   */
  executeTakeFirstOrThrow(
    errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)
  ): Promise<Simplify<O>>

  stream(chunkSize?: number): AsyncIterableIterator<O>

  explain<ER extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: Expression<any>
  ): Promise<ER[]>
}

class SelectQueryBuilderImpl<DB, TB extends keyof DB, O>
  implements SelectQueryBuilder<DB, TB, O>
{
  readonly #props: SelectQueryBuilderProps

  constructor(props: SelectQueryBuilderProps) {
    this.#props = freeze(props)
  }

  get expressionType(): O | undefined {
    return undefined
  }

  where(...args: any[]): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseValueBinaryOperationOrExpression(args)
      ),
    })
  }

  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferentialBinaryOperation(lhs, op, rhs)
      ),
    })
  }

  having(...args: any[]): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseValueBinaryOperationOrExpression(args)
      ),
    })
  }

  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseReferentialBinaryOperation(lhs, op, rhs)
      ),
    })
  }

  select<SE extends SelectExpression<DB, TB>>(
    selection: SelectArg<DB, TB, SE>
  ): SelectQueryBuilder<DB, TB, O & Selection<DB, TB, SE>> {
    return new SelectQueryBuilderImpl<DB, TB, O & Selection<DB, TB, SE>>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(
        this.#props.queryNode,
        parseSelectArg(selection)
      ),
    })
  }

  distinctOn(selection: ReferenceExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinctOn(
        this.#props.queryNode,
        parseReferenceExpressionOrList(selection)
      ),
    })
  }

  modifyFront(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFrontModifier(
        this.#props.queryNode,
        SelectModifierNode.createWithExpression(modifier.toOperationNode())
      ),
    })
  }

  modifyEnd(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.createWithExpression(modifier.toOperationNode())
      ),
    })
  }

  distinct(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFrontModifier(
        this.#props.queryNode,
        SelectModifierNode.create('Distinct')
      ),
    })
  }

  forUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForUpdate')
      ),
    })
  }

  forShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForShare')
      ),
    })
  }

  forKeyShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForKeyShare')
      ),
    })
  }

  forNoKeyUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForNoKeyUpdate')
      ),
    })
  }

  skipLocked(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('SkipLocked')
      ),
    })
  }

  noWait(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('NoWait')
      ),
    })
  }

  selectAll(table?: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(
        this.#props.queryNode,
        parseSelectAll(table)
      ),
    })
  }

  innerJoin(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('InnerJoin', args)
      ),
    })
  }

  leftJoin(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LeftJoin', args)
      ),
    })
  }

  rightJoin(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('RightJoin', args)
      ),
    })
  }

  fullJoin(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('FullJoin', args)
      ),
    })
  }

  innerJoinLateral(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LateralInnerJoin', args)
      ),
    })
  }

  leftJoinLateral(...args: any): any {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LateralLeftJoin', args)
      ),
    })
  }

  orderBy(...args: any[]): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrderByItems(
        this.#props.queryNode,
        parseOrderBy(args)
      ),
    })
  }

  groupBy(groupBy: GroupByArg<DB, TB, O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithGroupByItems(
        this.#props.queryNode,
        parseGroupBy(groupBy)
      ),
    })
  }

  limit(limit: number): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithLimit(
        this.#props.queryNode,
        LimitNode.create(limit)
      ),
    })
  }

  offset(offset: number): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOffset(
        this.#props.queryNode,
        OffsetNode.create(offset)
      ),
    })
  }

  union(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('union', expression, false)
      ),
    })
  }

  unionAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('union', expression, true)
      ),
    })
  }

  intersect(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('intersect', expression, false)
      ),
    })
  }

  intersectAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('intersect', expression, true)
      ),
    })
  }

  except(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('except', expression, false)
      ),
    })
  }

  exceptAll(
    expression: SetOperandExpression<DB, O>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(
        this.#props.queryNode,
        parseSetOperations('except', expression, true)
      ),
    })
  }

  as<A extends string>(alias: A): AliasedSelectQueryBuilder<DB, TB, O, A> {
    return new AliasedSelectQueryBuilderImpl(this, alias)
  }

  clearSelect(): SelectQueryBuilder<DB, TB, {}> {
    return new SelectQueryBuilderImpl<DB, TB, {}>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutSelections(this.#props.queryNode),
    })
  }

  clearWhere(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl<DB, TB, O>({
      ...this.#props,
      queryNode: QueryNode.cloneWithoutWhere(this.#props.queryNode),
    })
  }

  clearLimit(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutLimit(this.#props.queryNode),
    })
  }

  clearOffset(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutOffset(this.#props.queryNode),
    })
  }

  clearOrderBy(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutOrderBy(this.#props.queryNode),
    })
  }

  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  $if<O2>(
    condition: boolean,
    func: (qb: this) => SelectQueryBuilder<any, any, O & O2>
  ): SelectQueryBuilder<DB, TB, O & Partial<O2>> {
    if (condition) {
      return func(this)
    }

    return new SelectQueryBuilderImpl<DB, TB, O & Partial<O2>>({
      ...this.#props,
    })
  }

  $castTo<T>(): SelectQueryBuilder<DB, TB, T> {
    return new SelectQueryBuilderImpl(this.#props)
  }

  $narrowType<T>(): SelectQueryBuilder<DB, TB, NarrowPartial<O, T>> {
    return new SelectQueryBuilderImpl(this.#props)
  }

  $assertType<T extends O>(): O extends T
    ? SelectQueryBuilder<DB, TB, T>
    : KyselyTypeError<`$assertType() call failed: The type passed in is not equal to the output type of the query.`> {
    return new SelectQueryBuilderImpl(this.#props) as unknown as any
  }

  $asTuple(): ExpressionWrapper<DB, TB, any> {
    return new ExpressionWrapper(this.toOperationNode())
  }

  withPlugin(plugin: KyselyPlugin): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  toOperationNode(): SelectQueryNode {
    return this.#props.executor.transformQuery(
      this.#props.queryNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery<Simplify<O>> {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<Simplify<O>[]> {
    const compiledQuery = this.compile()

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
      this.#props.queryId
    )

    return result.rows
  }

  async executeTakeFirst(): Promise<SimplifySingleResult<O>> {
    const [result] = await this.execute()
    return result as SimplifySingleResult<O>
  }

  async executeTakeFirstOrThrow(
    errorConstructor:
      | NoResultErrorConstructor
      | ((node: QueryNode) => Error) = NoResultError
  ): Promise<Simplify<O>> {
    const result = await this.executeTakeFirst()

    if (result === undefined) {
      const error = isNoResultErrorConstructor(errorConstructor)
        ? new errorConstructor(this.toOperationNode())
        : errorConstructor(this.toOperationNode())

      throw error
    }

    return result as O
  }

  async *stream(chunkSize: number = 100): AsyncIterableIterator<O> {
    const compiledQuery = this.compile()

    const stream = this.#props.executor.stream<O>(
      compiledQuery,
      chunkSize,
      this.#props.queryId
    )

    for await (const item of stream) {
      yield* item.rows
    }
  }

  async explain<ER extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: Expression<any>
  ): Promise<ER[]> {
    const builder = new SelectQueryBuilderImpl<DB, TB, ER>({
      ...this.#props,
      queryNode: QueryNode.cloneWithExplain(
        this.#props.queryNode,
        format,
        options
      ),
    })

    return await builder.execute()
  }
}

preventAwait(
  SelectQueryBuilderImpl,
  "don't await SelectQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export function createSelectQueryBuilder<DB, TB extends keyof DB, O>(
  props: SelectQueryBuilderProps
): SelectQueryBuilder<DB, TB, O> {
  return new SelectQueryBuilderImpl(props)
}

export interface SelectQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: SelectQueryNode
  readonly executor: QueryExecutor
}

export interface AliasedSelectQueryBuilder<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> extends AliasedExpression<O, A> {
  get selectQueryBuilder(): SelectQueryBuilder<DB, TB, O>
}

/**
 * {@link SelectQueryBuilder} with an alias. The result of calling {@link SelectQueryBuilder.as}.
 */
class AliasedSelectQueryBuilderImpl<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> implements AliasedSelectQueryBuilder<DB, TB, O, A>
{
  readonly #queryBuilder: SelectQueryBuilder<DB, TB, O>
  readonly #alias: A

  constructor(queryBuilder: SelectQueryBuilder<DB, TB, O>, alias: A) {
    this.#queryBuilder = queryBuilder
    this.#alias = alias
  }

  get expression(): Expression<O> {
    return this.#queryBuilder
  }

  get alias(): A {
    return this.#alias
  }

  get selectQueryBuilder(): SelectQueryBuilder<DB, TB, O> {
    return this.#queryBuilder
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#queryBuilder.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}

preventAwait(
  AliasedSelectQueryBuilderImpl,
  "don't await AliasedSelectQueryBuilder instances directly. AliasedSelectQueryBuilder should never be executed directly since it's always a part of another query."
)

export type SelectQueryBuilderWithInnerJoin<
  DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? InnerJoinedBuilder<DB, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? SelectQueryBuilder<DB, TB | TE, O>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? InnerJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? InnerJoinedBuilder<DB, TB, O, QA, QO>
  : never

type InnerJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends string,
  R
> = A extends keyof DB
  ? SelectQueryBuilder<InnerJoinedDB<DB, A, R>, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    SelectQueryBuilder<DB & ShallowRecord<A, R>, TB | A, O>

type InnerJoinedDB<DB, A extends string, R> = DrainOuterGeneric<{
  [C in keyof DB | A]: C extends A ? R : C extends keyof DB ? DB[C] : never
}>

export type SelectQueryBuilderWithLeftJoin<
  DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? LeftJoinedBuilder<DB, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? LeftJoinedBuilder<DB, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? LeftJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? LeftJoinedBuilder<DB, TB, O, QA, QO>
  : never

type LeftJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = A extends keyof DB
  ? SelectQueryBuilder<LeftJoinedDB<DB, A, R>, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    SelectQueryBuilder<DB & ShallowRecord<A, Nullable<R>>, TB | A, O>

type LeftJoinedDB<DB, A extends keyof any, R> = DrainOuterGeneric<{
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends keyof DB
    ? DB[C]
    : never
}>

export type SelectQueryBuilderWithRightJoin<
  DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? RightJoinedBuilder<DB, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? RightJoinedBuilder<DB, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? RightJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? RightJoinedBuilder<DB, TB, O, QA, QO>
  : never

type RightJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = SelectQueryBuilder<RightJoinedDB<DB, TB, A, R>, TB | A, O>

type RightJoinedDB<
  DB,
  TB extends keyof DB,
  A extends keyof any,
  R
> = DrainOuterGeneric<{
  [C in keyof DB | A]: C extends A
    ? R
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}>

export type SelectQueryBuilderWithFullJoin<
  DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? OuterJoinedBuilder<DB, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? OuterJoinedBuilder<DB, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? OuterJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? OuterJoinedBuilder<DB, TB, O, QA, QO>
  : never

type OuterJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = SelectQueryBuilder<OuterJoinedBuilderDB<DB, TB, A, R>, TB | A, O>

type OuterJoinedBuilderDB<
  DB,
  TB extends keyof DB,
  A extends keyof any,
  R
> = DrainOuterGeneric<{
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}>
