import { AliasNode } from '../operation-node/alias-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import { TableExpression } from '../parser/table-parser.js'
import {
  parseSelectExpressionOrList,
  parseSelectAll,
  SelectExpression,
  QueryBuilderWithSelection,
  SelectAllQueryBuilder,
  SelectExpressionOrList,
} from '../parser/select-parser.js'
import {
  ExistsExpression,
  parseExistFilter,
  FilterOperator,
  parseReferenceFilter,
  parseWhereFilter,
  parseHavingFilter,
  parseNotExistFilter,
  FilterValueExpressionOrList,
  WhereGrouper,
  HavingGrouper,
} from '../parser/filter-parser.js'
import {
  ReferenceExpression,
  ReferenceExpressionOrList,
} from '../parser/reference-parser.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  AnyRawBuilder,
  MergePartial,
  Nullable,
  SingleResultType,
} from '../util/type-utils.js'
import {
  OrderByDirectionExpression,
  OrderByExpression,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { LimitNode } from '../operation-node/limit-node.js'
import { OffsetNode } from '../operation-node/offset-node.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { parseGroupBy } from '../parser/group-by-parser.js'
import { parseUnion, UnionExpression } from '../parser/union-parser.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { HavingInterface } from './having-interface.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'

export class SelectQueryBuilder<DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    HavingInterface<DB, TB>,
    OperationNodeSource,
    Compilable
{
  readonly #props: SelectQueryBuilderProps

  constructor(props: SelectQueryBuilderProps) {
    this.#props = freeze(props)
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  where(grouper: WhereGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>
  where(raw: AnyRawBuilder): SelectQueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseWhereFilter(args)
      ),
    })
  }

  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>
  orWhere(raw: AnyRawBuilder): SelectQueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseWhereFilter(args)
      ),
    })
  }

  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  whereExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  whereNotExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  orWhereExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  orWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  having(grouper: HavingGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>

  having(raw: AnyRawBuilder): SelectQueryBuilder<DB, TB, O>

  having(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseHavingFilter(args)
      ),
    })
  }

  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  orHaving(grouper: HavingGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>

  orHaving(raw: AnyRawBuilder): SelectQueryBuilder<DB, TB, O>

  orHaving(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseHavingFilter(args)
      ),
    })
  }

  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  havingExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  havingNotExist(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  orHavingExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  orHavingNotExists(
    arg: ExistsExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  /**
   * Adds a select clause to the query.
   *
   * When a column (or any expression) is selected, Kysely adds its type to the return
   * type of the query. Kysely is smart enough to parse the column names and types even
   * from aliased columns, subqueries, raw expressions etc.
   *
   * Kysely only allows you to select columns and expressions that exist and would
   * produce valid SQL. However, Kysely is not perfect and there may be cases where
   * the type inference doesn't work and you need to override it. You can always
   * use the {@link Kysely.dynamic | dynamic} module and the {@link sql} tag
   * to override the types.
   *
   * Select calls are additive. Calling `select('id').select('first_name')` is the
   * same as calling `select(['id', 'first_name']).
   *
   * To select all columns of the query or specific tables see the
   * {@link selectAll} method.
   *
   * See the {@link if} method if you are looking for a way to add selections
   * based on a runtime condition.
   *
   * ### Examples
   *
   * Select a single column:
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .select('id')
   *   .where('first_name', '=', 'Arnold')
   *   .execute()
   *
   * persons[0].id
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "id" from "person" where "first_name" = $1
   * ```
   *
   * Select a single column and specify a table:
   *
   * ```ts
   * const persons = await db.selectFrom(['person', 'pet'])
   *   .select('person.id')
   *   .execute()
   *
   * persons[0].id
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id" from "person", "pet"
   * ```
   *
   * Select multiple columns:
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .select(['person.id', 'first_name'])
   *   .execute()
   *
   * persons[0].id
   * persons[0].first_name
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", "first_name" from "person"
   * ```
   *
   * Aliased selections:
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .select([
   *     'person.first_name as fn',
   *     'person.last_name as ln'
   *   ])
   *   .execute()
   *
   * persons[0].fn
   * persons[0].ln
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   "person"."first_name" as "fn",
   *   "person"."last_name" as "ln"
   * from "person"
   * ```
   *
   * You can also select subqueries and raw sql expressions. Note that you
   * always need to give a name for the selections using the `as`
   * method:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const persons = await db.selectFrom('person')
   *   .select([
   *     (qb) => qb
   *       .selectFrom('pet')
   *       .whereRef('person.id', '=', 'pet.owner_id')
   *       .select('pet.name')
   *       .limit(1)
   *       .as('pet_name')
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name')
   *   ])
   *   .execute()
   *
   * persons[0].pet_name
   * persons[0].full_name
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
   *     limit $1
   *   ) as "pet_name",
   *   concat(first_name, ' ', last_name) as full_name
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
   * const spersons = await db.selectFrom('person')
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
    selections: ReadonlyArray<SE>
  ): QueryBuilderWithSelection<DB, TB, O, SE>

  select<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): QueryBuilderWithSelection<DB, TB, O, SE>

  select(selection: SelectExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(
        this.#props.queryNode,
        parseSelectExpressionOrList(selection)
      ),
    })
  }

  /**
   * Adds `distinct on` selections to the select clause.
   *
   * Takes the same inputs as the {@link SelectQueryBuilder.select | select} method.
   * See the {@link SelectQueryBuilder.select | select} method's documentation for
   * more examples.
   *
   * ### Examples
   *
   * ```ts
   * await db.selectFrom('person')
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
  distinctOn<SE extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<SE>
  ): SelectQueryBuilder<DB, TB, O>

  distinctOn<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): SelectQueryBuilder<DB, TB, O>

  distinctOn(selection: SelectExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinctOnSelections(
        this.#props.queryNode,
        parseSelectExpressionOrList(selection)
      ),
    })
  }

  /**
   * Makes the selection distinct.
   *
   * ### Examples
   *
   * ```ts
   * await db.selectFrom('person')
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
  distinct(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinct(this.#props.queryNode),
    })
  }

  /**
   * Adds the `for update` option to a select query on supported databases.
   */
  forUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'ForUpdate'
      ),
    })
  }

  /**
   * Adds the `for share` option to a select query on supported databases.
   */
  forShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'ForShare'
      ),
    })
  }

  /**
   * Adds the `for key share` option to a select query on supported databases.
   */
  forKeyShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'ForKeyShare'
      ),
    })
  }

  /**
   * Adds the `for no key update` option to a select query on supported databases.
   */
  forNoKeyUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'ForNoKeyUpdate'
      ),
    })
  }

  /**
   * Adds the `skip locked` option to a select query on supported databases.
   */
  skipLocked(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'SkipLocked'
      ),
    })
  }

  /**
   * Adds the `nowait` option to a select query on supported databases.
   */
  noWait(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithModifier(
        this.#props.queryNode,
        'NoWait'
      ),
    })
  }

  /**
   * Adds a `select *` or `select table.*` clause to the query.
   *
   * ### Examples
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
  ): SelectAllQueryBuilder<DB, TB, O, T>

  selectAll<T extends TB>(table: T): SelectAllQueryBuilder<DB, TB, O, T>

  selectAll(): SelectAllQueryBuilder<DB, TB, O, TB>

  selectAll(table?: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(
        this.#props.queryNode,
        parseSelectAll(table)
      ),
    })
  }

  /**
   * Joins another table to the query using an inner join.
   *
   * ### Examples
   *
   * Simple usage by providing a table name and two columns to join:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   // `select` needs to come after the call to `innerJoin` so
   *   // that you can select from the joined table.
   *   .select('person.id', 'pet.name')
   *   .execute()
   *
   * result[0].id
   * result[0].name
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", "pet"."name"
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * ```
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
   * You can provide a function as the second argument to get a join
   * builder for creating more complex joins. The join builder has a
   * bunch of `on*` methods for building the `on` clause of the join.
   * There's basically an equivalent for every `where` method
   * (`on`, `onRef`, `onExists` etc.). You can do all the same things
   * with the `on` method that you can with the corresponding `where`
   * method. See the `where` method documentation for more examples.
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
   * You can join a subquery by providing a select query (or a callback)
   * as the first argument:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin(
   *     qb.selectFrom('pet')
   *       .select(['owner_id', 'name'])
   *       .where('name', '=', 'Doggo')
   *       .as('doggos'),
   *     'doggos.owner_id',
   *     'person.id',
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
   * inner join (
   *   select "owner_id", "name"
   *   from "pet"
   *   where "name" = $1
   * ) as "doggos"
   * on "doggos"."owner_id" = "person"."id"
   * ```
   */
  innerJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoin(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('InnerJoin', args)
      ),
    })
  }

  /**
   * Just like {@link innerJoin} but adds a left join instead of an inner join.
   */
  leftJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LeftJoin', args)
      ),
    })
  }

  /**
   * Just like {@link innerJoin} but adds a right join instead of an inner join.
   */
  rightJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('RightJoin', args)
      ),
    })
  }

  /**
   * Just like {@link innerJoin} but adds a full join instead of an inner join.
   */
  fullJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('FullJoin', args)
      ),
    })
  }

  /**
   * Just like {@link innerJoin} but adds a lateral join instead of an inner join.
   */
  innerJoinLateral<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoinLateral<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoinLateral(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LateralInnerJoin', args)
      ),
    })
  }

  /**
   * Just like {@link innerJoin} but adds a lateral left join instead of an inner join.
   */
  leftJoinLateral<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoinLateral<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): SelectQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoinLateral(...args: any): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('LateralLeftJoin', args)
      ),
    })
  }

  /**
   * Adds an `order by` clause to the query.
   *
   * `orderBy` calls are additive. To order by multiple columns, call `orderBy`
   * multiple times.
   *
   * The first argument is the expression to order by and the second is the
   * order (`asc` or `desc`).
   *
   * ### Examples
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
   * The order by expression can also be a raw sql expression or a subquery
   * in addition to column references:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .orderBy((qb) => qb.selectFrom('pet')
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
    orderBy: OrderByExpression<DB, TB, O>,
    direction?: OrderByDirectionExpression
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrderByItem(
        this.#props.queryNode,
        parseOrderBy(orderBy, direction)
      ),
    })
  }

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
  groupBy(
    groupBy: ReadonlyArray<ReferenceExpression<DB, TB>>
  ): SelectQueryBuilder<DB, TB, O>

  groupBy(groupBy: ReferenceExpression<DB, TB>): SelectQueryBuilder<DB, TB, O>

  groupBy(groupBy: ReferenceExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithGroupByItems(
        this.#props.queryNode,
        parseGroupBy(groupBy)
      ),
    })
  }

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
  limit(limit: number): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithLimit(
        this.#props.queryNode,
        LimitNode.create(limit)
      ),
    })
  }

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
  offset(offset: number): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOffset(
        this.#props.queryNode,
        OffsetNode.create(offset)
      ),
    })
  }

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
   */
  union(expression: UnionExpression<DB, O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithUnion(
        this.#props.queryNode,
        parseUnion(expression, false)
      ),
    })
  }

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
   */
  unionAll(expression: UnionExpression<DB, O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithUnion(
        this.#props.queryNode,
        parseUnion(expression, true)
      ),
    })
  }

  /**
   * Simply calls the given function passing `this` as the only argument.
   *
   * If you want to conditionally call a method on `this`, see
   * the {@link if} method.
   *
   * ### Examples
   *
   * The next example uses a helper funtion `log` to log a query:
   *
   * ```ts
   * function log<T extends Compilable>(qb: T): T {
   *   console.log(qb.compile())
   *   return qb
   * }
   *
   * db.selectFrom('person')
   *   .selectAll()
   *   .call(log)
   *   .execute()
   * ```
   */
  call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  /**
   * Call `func(this)` if `condition` is true.
   *
   * This method is especially handy with optional selects. Any `select` or `selectAll`
   * method calls add columns as optional fields to the output type when called inside
   * the `func` callback. This is because we can't know if those selections were actually
   * made before running the code.
   *
   * Also see [this recipe](https://github.com/koskimas/kysely/tree/master/recipes/conditional-selects.md)
   *
   * ### Examples
   *
   * ```ts
   * async function getPerson(id: number, withLastName: boolean) {
   *   return await db
   *     .selectFrom('person')
   *     .select(['id', 'first_name'])
   *     .if(withLastName, (qb) => qb.select('last_name'))
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
   * const { count } = db.fn
   *
   * db.selectFrom('person')
   *   .select('person.id')
   *   .if(filterByFirstName, (qb) => qb.where('first_name', '=', firstName))
   *   .if(filterByPetCount, (qb) => qb
   *     .innerJoin('pet', 'pet.owner_id', 'person.id')
   *     .having(count('pet.id'), '>', petCountLimit)
   *     .groupBy('person.id')
   *   )
   * ```
   */
  if<O2 extends O>(
    condition: boolean,
    func: (qb: this) => SelectQueryBuilder<DB, TB, O2>
  ): SelectQueryBuilder<DB, TB, MergePartial<O, O2>> {
    if (condition) {
      return func(this)
    }

    return new SelectQueryBuilder({
      ...this.#props,
    })
  }

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
  as<A extends string>(alias: A): AliasedQueryBuilder<DB, TB, O, A> {
    return new AliasedQueryBuilder(this, alias)
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  castTo<T>(): SelectQueryBuilder<DB, TB, T> {
    return new SelectQueryBuilder(this.#props)
  }

  /**
   * Returns a copy of this SelectQueryBuilder instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
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

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  async execute(): Promise<O[]> {
    const compildQuery = this.compile()
    const query = compildQuery.query

    const result = await this.#props.executor.executeQuery<O>(
      compildQuery,
      this.#props.queryId
    )

    return result.rows
  }

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  async executeTakeFirst(): Promise<SingleResultType<O>> {
    const [result] = await this.execute()
    return result as SingleResultType<O>
  }

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class as the only argument to throw a different
   * error.
   */
  async executeTakeFirstOrThrow(
    errorConstructor: NoResultErrorConstructor = NoResultError
  ): Promise<O> {
    const result = await this.executeTakeFirst()

    if (result === undefined) {
      throw new errorConstructor(this.toOperationNode())
    }

    return result as O
  }
}

preventAwait(
  SelectQueryBuilder,
  "don't await SelectQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface SelectQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: SelectQueryNode
  readonly executor: QueryExecutor
}

/**
 * {@link SelectQueryBuilder} with an alias. The result of calling {@link SelectQueryBuilder.as}.
 */
export class AliasedQueryBuilder<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> {
  readonly #queryBuilder: SelectQueryBuilder<DB, TB, O>
  readonly #alias: A

  constructor(queryBuilder: SelectQueryBuilder<DB, TB, O>, alias: A) {
    this.#queryBuilder = queryBuilder
    this.#alias = alias
  }

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedQueryBuilder with any A
   * as long as D, TB and O are the same.
   */
  protected get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    const node = this.#queryBuilder.toOperationNode()
    return AliasNode.create(node, IdentifierNode.create(this.#alias))
  }
}

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
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? InnerJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? InnerJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? InnerJoinedBuilder<DB, TB, O, RA, RO>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? InnerJoinedBuilder<DB, TB, O, RA, RO>
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
    SelectQueryBuilder<DB & Record<A, R>, TB | A, O>

type InnerJoinedDB<DB, A extends string, R> = {
  [C in keyof DB | A]: C extends A ? R : C extends keyof DB ? DB[C] : never
}

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
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? LeftJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? LeftJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? LeftJoinedBuilder<DB, TB, O, RA, RO>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? LeftJoinedBuilder<DB, TB, O, RA, RO>
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
    SelectQueryBuilder<DB & Record<A, Nullable<R>>, TB | A, O>

type LeftJoinedDB<DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends keyof DB
    ? DB[C]
    : never
}

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
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? RightJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? RightJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? RightJoinedBuilder<DB, TB, O, RA, RO>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? RightJoinedBuilder<DB, TB, O, RA, RO>
  : never

type RightJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = SelectQueryBuilder<RightJoinedDB<DB, TB, A, R>, TB | A, O>

type RightJoinedDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? R
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}

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
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? OuterJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? OuterJoinedBuilder<DB, TB, O, QA, QO>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? OuterJoinedBuilder<DB, TB, O, RA, RO>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? OuterJoinedBuilder<DB, TB, O, RA, RO>
  : never

type OuterJoinedBuilder<
  DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = SelectQueryBuilder<OuterJoinedBuilderDB<DB, TB, A, R>, TB | A, O>

type OuterJoinedBuilderDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}
