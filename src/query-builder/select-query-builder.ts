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
  parseSelectExpressionOrList,
  parseSelectAll,
  SelectExpression,
  QueryBuilderWithSelection,
  SelectAllQueryBuilder,
  SelectExpressionOrList,
} from '../parser/select-parser.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
  ReferenceExpressionOrList,
} from '../parser/reference-parser.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import { MergePartial, Nullable, SingleResultType } from '../util/type-utils.js'
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
import {
  GroupByExpression,
  GroupByExpressionOrList,
  parseGroupBy,
} from '../parser/group-by-parser.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { HavingInterface } from './having-interface.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { Explainable, ExplainFormat } from '../util/explainable.js'
import { ExplainNode } from '../operation-node/explain-node.js'
import { parseSetOperation } from '../parser/set-operation-parser.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  HavingGrouper,
  OperandValueExpressionOrList,
  parseHaving,
  parseReferentialFilter,
  parseWhere,
  WhereGrouper,
} from '../parser/binary-operation-parser.js'
import {
  ExistsExpression,
  parseExists,
  parseNotExists,
} from '../parser/unary-operation-parser.js'
import { KyselyTypeError } from '../util/type-error.js'

export class SelectQueryBuilder<DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    HavingInterface<DB, TB>,
    Expression<O>,
    Compilable<O>,
    Explainable
{
  readonly #props: SelectQueryBuilderProps

  constructor(props: SelectQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  where(grouper: WhereGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>
  where(expression: Expression<any>): SelectQueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseWhere(args)
      ),
    })
  }

  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>
  orWhere(expression: Expression<any>): SelectQueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseWhere(args)
      ),
    })
  }

  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  whereExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExists(arg)
      ),
    })
  }

  whereNotExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExists(arg)
      ),
    })
  }

  orWhereExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExists(arg)
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
        parseNotExists(arg)
      ),
    })
  }

  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  having(grouper: HavingGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>

  having(expression: Expression<any>): SelectQueryBuilder<DB, TB, O>

  having(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseHaving(args)
      ),
    })
  }

  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): SelectQueryBuilder<DB, TB, O>

  orHaving(grouper: HavingGrouper<DB, TB>): SelectQueryBuilder<DB, TB, O>

  orHaving(expression: Expression<any>): SelectQueryBuilder<DB, TB, O>

  orHaving(...args: any[]): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseHaving(args)
      ),
    })
  }

  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseReferentialFilter(lhs, op, rhs)
      ),
    })
  }

  havingExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseExists(arg)
      ),
    })
  }

  havingNotExist(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseNotExists(arg)
      ),
    })
  }

  orHavingExists(arg: ExistsExpression<DB, TB>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseExists(arg)
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
        parseNotExists(arg)
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
   * Adds `distinct on` expressions to the select clause.
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
  distinctOn<RE extends ReferenceExpression<DB, TB>>(
    selections: ReadonlyArray<RE>
  ): SelectQueryBuilder<DB, TB, O>

  distinctOn<RE extends ReferenceExpression<DB, TB>>(
    selection: RE
  ): SelectQueryBuilder<DB, TB, O>

  distinctOn(selection: ReferenceExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinctOn(
        this.#props.queryNode,
        parseReferenceExpressionOrList(selection)
      ),
    })
  }

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
  modifyFront(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFrontModifier(
        this.#props.queryNode,
        SelectModifierNode.createWithExpression(modifier.toOperationNode())
      ),
    })
  }

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
  modifyEnd(modifier: Expression<any>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.createWithExpression(modifier.toOperationNode())
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
      queryNode: SelectQueryNode.cloneWithFrontModifier(
        this.#props.queryNode,
        SelectModifierNode.create('Distinct')
      ),
    })
  }

  /**
   * Adds the `for update` modifier to a select query on supported databases.
   */
  forUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForUpdate')
      ),
    })
  }

  /**
   * Adds the `for share` modifier to a select query on supported databases.
   */
  forShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForShare')
      ),
    })
  }

  /**
   * Adds the `for key share` modifier to a select query on supported databases.
   */
  forKeyShare(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForKeyShare')
      ),
    })
  }

  /**
   * Adds the `for no key update` modifier to a select query on supported databases.
   */
  forNoKeyUpdate(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('ForNoKeyUpdate')
      ),
    })
  }

  /**
   * Adds the `skip locked` modifier to a select query on supported databases.
   */
  skipLocked(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('SkipLocked')
      ),
    })
  }

  /**
   * Adds the `nowait` modifier to a select query on supported databases.
   */
  noWait(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithEndModifier(
        this.#props.queryNode,
        SelectModifierNode.create('NoWait')
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
   *     db.selectFrom('pet')
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
   *
   * ### Examples
   *
   * Simple usage:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .leftJoin('address')
   *   .leftJoin('address', 'person.address_id', 'address.id')
   *   .execute();
   * ```
   *
   * A subquery for a more complex join:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .leftJoin(
   *     (qb) =>
   *       qb
   *         .selectFrom('address')
   *         .select(['address.id', 'address.street', 'address.city'])
   *         .as('address'),
   *     (join) => join.onRef('address.id', '=', 'person.address_id'),
   *   )
   *   .selectAll()
   *   .execute();
   * ```
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
    groupBy: ReadonlyArray<GroupByExpression<DB, TB, O>>
  ): SelectQueryBuilder<DB, TB, O>

  groupBy(groupBy: GroupByExpression<DB, TB, O>): SelectQueryBuilder<DB, TB, O>

  groupBy(groupBy: GroupByExpressionOrList<DB, TB, O>): any {
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
  union(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('union', expression, false)
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
  unionAll(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('union', expression, true)
      ),
    })
  }

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
   */
  intersect(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('intersect', expression, false)
      ),
    })
  }

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
   */
  intersectAll(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('intersect', expression, true)
      ),
    })
  }

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
   */
  except(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('except', expression, false)
      ),
    })
  }

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
   */
  exceptAll(expression: Expression<O>): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperation(
        this.#props.queryNode,
        parseSetOperation('except', expression, true)
      ),
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
  as<A extends string>(alias: A): AliasedSelectQueryBuilder<DB, TB, O, A> {
    return new AliasedSelectQueryBuilder(this, alias)
  }

  /**
   * Clears all select clauses from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(['id', 'first_name'])
   *   .clearSelect()
   *   .select(['id','gender'])
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select "id", "gender" from "person"
   * ```
   */
  clearSelect(): SelectQueryBuilder<DB, TB, {}> {
    return new SelectQueryBuilder<DB, TB, {}>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutSelections(this.#props.queryNode),
    })
  }

  clearWhere(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder<DB, TB, O>({
      ...this.#props,
      queryNode: QueryNode.cloneWithoutWhere(this.#props.queryNode),
    })
  }

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
  clearLimit(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutLimit(this.#props.queryNode),
    })
  }

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
  clearOffset(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutOffset(this.#props.queryNode),
    })
  }

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
  clearOrderBy(): SelectQueryBuilder<DB, TB, O> {
    return new SelectQueryBuilder<DB, TB, O>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutOrderBy(this.#props.queryNode),
    })
  }

  /**
   * Simply calls the given function passing `this` as the only argument.
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
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  /**
   * @deprecated Use `$call` instead
   */
  call<T>(func: (qb: this) => T): T {
    return this.$call(func)
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
   * const { count } = db.fn
   *
   * db.selectFrom('person')
   *   .select('person.id')
   *   .$if(filterByFirstName, (qb) => qb.where('first_name', '=', firstName))
   *   .$if(filterByPetCount, (qb) => qb
   *     .innerJoin('pet', 'pet.owner_id', 'person.id')
   *     .having(count('pet.id'), '>', petCountLimit)
   *     .groupBy('person.id')
   *   )
   * ```
   */
  $if<O2 extends O>(
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
   * @deprecated Use `$if` instead
   */
  if<O2 extends O>(
    condition: boolean,
    func: (qb: this) => SelectQueryBuilder<DB, TB, O2>
  ): SelectQueryBuilder<DB, TB, MergePartial<O, O2>> {
    return this.$if(condition, func)
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  $castTo<T>(): SelectQueryBuilder<DB, TB, T> {
    return new SelectQueryBuilder(this.#props)
  }

  /**
   * @deprecated Use `$castTo` instead.
   */
  castTo<T>(): SelectQueryBuilder<DB, TB, T> {
    return this.$castTo<T>()
  }

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
    : KyselyTypeError<`$assertType() call failed: The type passed in is not equal to the output type of the query.`> {
    return new SelectQueryBuilder(this.#props) as unknown as any
  }

  /**
   * @deprecated Use `$assertType` instead.
   */
  assertType<T extends O>(): O extends T
    ? SelectQueryBuilder<DB, TB, T>
    : KyselyTypeError<`assertType() call failed: The type passed in is not equal to the output type of the query.`> {
    return new SelectQueryBuilder(this.#props) as unknown as any
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

  compile(): CompiledQuery<O> {
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
    const compiledQuery = this.compile()

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
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

  /**
   * Executes the query and streams the rows.
   *
   * The optional argument `chunkSize` defines how many rows to fetch from the database
   * at a time. It only affects some dialects like PostgreSQL that support it.
   *
   * ### Examples
   *
   * ```ts
   * const stream = db.
   *   .selectFrom('person')
   *   .select(['first_name', 'last_name'])
   *   .where('gender', '=', 'other')
   *   .stream()
   *
   * for await (const person of stream) {
   *   console.log(person.first_name)
   *
   *   if (person.last_name === 'Something') {
   *     // Breaking or returning before the stream has ended will release
   *     // the database connection and invalidate the stream.
   *     break
   *   }
   * }
   * ```
   */
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

  /**
   * Executes query with `explain` statement before `select` keyword.
   *
   * ```ts
   * const explained = await db
   *  .selectFrom('person')
   *  .where('gender', '=', 'female')
   *  .selectAll()
   *  .explain('json')
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * explain format=json select * from `person` where `gender` = ?
   * ```
   *
   * You can also execute `explain analyze` statements.
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const explained = await db
   *  .selectFrom('person')
   *  .where('gender', '=', 'female')
   *  .selectAll()
   *  .explain('json', sql`analyze`)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * explain (analyze, format json) select * from "person" where "gender" = $1
   * ```
   */
  async explain<ER extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: Expression<any>
  ): Promise<ER[]> {
    const builder = new SelectQueryBuilder<DB, TB, ER>({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithExplain(
        this.#props.queryNode,
        ExplainNode.create(format, options?.toOperationNode())
      ),
    })

    return await builder.execute()
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
export class AliasedSelectQueryBuilder<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> implements AliasedExpression<O, A>
{
  readonly #queryBuilder: SelectQueryBuilder<DB, TB, O>
  readonly #alias: A

  constructor(queryBuilder: SelectQueryBuilder<DB, TB, O>, alias: A) {
    this.#queryBuilder = queryBuilder
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<O> {
    return this.#queryBuilder
  }

  /** @private */
  get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#queryBuilder.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
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

type OuterJoinedBuilderDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}
