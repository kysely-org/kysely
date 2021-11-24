import { AliasNode } from '../operation-node/alias-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import {
  TableExpression,
  QueryBuilderWithTable,
  QueryBuilderWithLeftJoin,
  QueryBuilderWithRightJoin,
  QueryBuilderWithFullJoin,
} from '../parser/table-parser.js'
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
} from '../parser/filter-parser.js'
import {
  InsertObject,
  InsertObjectOrList,
  parseInsertObjectOrList,
} from '../parser/insert-values-parser.js'
import { QueryBuilderWithReturning } from '../parser/returning-parser.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpression,
} from '../parser/reference-parser.js'
import { ValueExpressionOrList } from '../parser/value-parser.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import {
  QueryNode,
  FilterableQueryNode,
  MutatingQueryNode,
} from '../operation-node/query-node.js'
import {
  AnyColumn,
  ManyResultRowType,
  NonEmptySingleResultRowType,
  SingleResultRowType,
} from '../util/type-utils.js'
import {
  OrderByDirectionExpression,
  OrderByExpression,
  parseOrderByDirectionExpression,
  parseOrderByExpression,
} from '../parser/order-by-parser.js'
import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import {
  MutationObject,
  parseUpdateObject,
} from '../parser/update-set-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { LimitNode } from '../operation-node/limit-node.js'
import { OffsetNode } from '../operation-node/offset-node.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import {
  OnConflictConstraintTarget,
  OnConflictTargetExpression,
  parseOnConflictDoNothing,
  parseOnConflictUpdate,
} from '../parser/on-conflict-parser.js'
import { freeze } from '../util/object-utils.js'
import { ParseContext } from '../parser/parse-context.js'
import { DeleteQueryNode } from '../operation-node/delete-query-node.js'
import { OnDuplicateKeyNode } from '../operation-node/on-duplicate-key-node.js'

/**
 * The main query builder class.
 *
 * @typeParam DB - A type whose keys are table names/aliases and values are interfaces that
 *    define the table's columns and their types. This type defines the tables, subqueries
 *    etc. that are available to the query. This type contains all tables, even the ones
 *    that have not actually been joined to the query. the `TB` parameter defines the
 *    table names/aliases that have been joined to the query.
 *
 * @typeParam TB - The names/aliases of the tables that have been joined to the query
 *    using `from`, `with` any join method and so on. This type is a union of `DB`
 *    type's keys. For example `'person' | 'pet'`.
 *
 * @typePAram O - The query output row type.
 */
export class QueryBuilder<DB, TB extends keyof DB, O = {}>
  implements OperationNodeSource, Compilable
{
  readonly #props: QueryBuilderProps

  constructor(props: QueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds a `where` clause to the query.
   *
   * Also see {@link QueryBuilder.whereExists | whereExists}, {@link QueryBuilder.whereRef | whereRef}
   * and {@link QueryBuilder.whereRef | orWhere}.
   *
   * @example
   * Find a row by column value:
   *
   * ```ts
   * const person = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '=', 100)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" = $1
   * ```
   *
   * @example
   * Operator can be any supported operator or if the typings don't support it
   * you can always use `db.raw('your operator')`.
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '>', 100)
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" > $1
   * ```
   *
   * @example
   * The `where` methods don't change the type of the query. You can add
   * conditional `where`s easily by doing something like this:
   *
   * ```ts
   * let query = db
   *   .selectFrom('person')
   *   .selectAll()
   *
   * if (firstName) {
   *   query = query.where('first_name', '=', firstName)
   * }
   *
   * const persons = await query.execute()
   * ```
   *
   * This is true for basically all methods execpt the `select` and
   * `returning` methods, which DO change the return type of the
   * query.
   *
   * @example
   * Both the first and third argument can also be subqueries.
   * A subquery is defined by passing a function and calling
   * the `subQuery` method of the object passed into the
   * function:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(
   *     (qb) => qb.subQuery('pet')
   *       .select('pet.name')
   *       .whereRef('pet.owner_id', '=', 'person.id')
   *       .limit(1),
   *     '=',
   *     'Fluffy'
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * where (
   *   select "pet"."name"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   *   limit $1
   * ) = $2
   * ```
   *
   * @example
   * A `where in` query can be built by using the `in` operator and an array
   * of values. The values in the array can also be subqueries or raw
   * instances.
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('person.id', 'in', [100, 200, 300])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" in ($1, $2, $3)
   * ```
   *
   * @example
   * If everything else fails, you can always pass {@link Kysely.raw | raw}
   * as any of the arguments, including the operator:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(
   *     db.raw('coalesce(first_name, last_name)'),
   *     'like',
   *     '%' + name + '%',
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person"
   * where coalesce(first_name, last_name) like $1
   * ```
   *
   * @example
   * If you only pass one function argument to this method, it can be
   * used to create parentheses around other where clauses:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   *
   * @example
   * In all examples above the columns were known at compile time
   * (except for the `raw` expressions). By default kysely only allows
   * you to refer to columns that exist in the database **and** can be
   * referred to in the current query and context.
   *
   * Sometimes you may want to refer to columns that come from the user
   * input and thus are not available at compile time.
   *
   * You have two options, `db.raw` or `db.dynamic`. The example below
   * uses both:
   *
   * ```ts
   * const { ref } = db.dynamic
   *
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(ref(columnFromUserInput), '=', 1)
   *   .orWhere(db.raw('??', [columnFromUserInput]), '=', 2)
   *   .execute()
   * ```
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): QueryBuilder<DB, TB, O>

  where(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseWhereFilter(this.#props.parseContext, args)
      ),
    })
  }

  /**
   * Adds a `where` clause where both sides of the operator are references
   * to columns.
   *
   * The normal `where` method treats the right hand side argument as a
   * value by default. `whereRef` treats it as a column reference. This method is
   * expecially useful with joins and correclated subqueries.
   *
   * @example
   * Usage with a join:
   *
   * ```ts
   * db.selectFrom(['person', 'pet'])
   *   .selectAll()
   *   .whereRef('person.first_name', '=', 'pet.name')
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person", "pet" where "person"."first_name" = "pet"."name"
   * ```
   *
   * @example
   * Usage in a subquery:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .select((qb) => qb
   *     .subQuery('pet')
   *     .select('name')
   *     .whereRef('pet.owner_id', '=', 'person.id')
   *     .limit(1)
   *     .as('pet_name')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person".*, (
   *   select "name"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   *   limit $1
   * ) as "pet_name"
   * from "person"
   */
  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  /**
   * Adds an `or where` clause to the query. Otherwise works just like
   * {@link QueryBuilder.where | where}.
   *
   * It's often necessary to wrap `or where` clauses in parentheses to control
   * precendence. You can use the one argument version of the `where` method
   * for that. See the examples.
   *
   * @example
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '=', 1)
   *   .orWhere('id', '=', 2)
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" = 1 or "id" = 2
   * ```
   *
   * @example
   * Grouping with parentheses:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   *
   * @example
   * Even the first `where` can be an `orWhere`. This is useful
   * if you are looping through a set of conditions:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .orWhere('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   */
  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): QueryBuilder<DB, TB, O>

  orWhere(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseWhereFilter(this.#props.parseContext, args)
      ),
    })
  }

  /**
   * Adds an `or where` clause to the query. Otherwise works just like
   * {@link QueryBuilder.whereRef | whereRef}.
   *
   * Also see {@link QueryBuilder.orWhere | orWhere} and {@link QueryBuilder.where | where}.
   */
  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  /**
   * Adds a `where exists` clause to the query.
   *
   * You can either use a subquery or a raw instance.
   *
   * @example
   * The query below selets all persons that own a pet named Catto:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .whereExists((qb) => qb
   *     .subQuery('pet')
   *     .select('pet.id')
   *     .whereRef('person.id', '=', 'pet.owner_id')
   *     .where('pet.name', '=', 'Catto')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person"
   * where exists (
   *   select "pet"."id"
   *   from "pet"
   *   where "person"."id" = "pet"."owner_id"
   *   and "pet"."name" = $1
   * )
   * ```
   *
   * @example
   * The same query as in the previous example but with using raw:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .whereExists(
   *     db.raw(
   *       '(select pet.id from pet where person.id = pet.owner_id and pet.name = ?)',
   *       ['Catto']
   *     )
   *   )
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person"
   * where exists (
   *   select pet.id
   *   from pet
   *   where person.id = pet.owner_id
   *   and pet.name = $1
   * )
   * ```
   */
  whereExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereExists | whereExists} but creates a `not exists` clause.
   */
  whereNotExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereExists | whereExists} but creates a `or exists` clause.
   */
  orWhereExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereExists | whereExists} but creates a `or not exists` clause.
   */
  orWhereNotExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveWhereClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.where | where} but adds a `having` statement
   * instead of a `where` statement.
   */
  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): QueryBuilder<DB, TB, O>

  having(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  having(...args: any[]): any {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseHavingFilter(this.#props.parseContext, args)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereRef | whereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhere | orWhere} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): QueryBuilder<DB, TB, O>

  orHaving(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  orHaving(...args: any[]): any {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseHavingFilter(this.#props.parseContext, args)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhereRef | orWhereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereExists | whereExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereNotExists | whereNotExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingNotExist(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhereExists | orWhereExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhereNotExists | orWhereNotExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingNotExists(arg: ExistsExpression<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveHavingClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrHaving(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
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
   * use the {@link Kysely.dynamic | dynamic} module and {@link Kysely.raw | raw}
   * to override the types.
   *
   * Select calls are additive. Calling `select('id').select('first_name')` is the
   * same as calling `select(['id', 'first_name']).
   *
   * To select all columns of the query or specific tables see the
   * {@link QueryBuilder.selectAll | selectAll} method.
   *
   * @example
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "id" from "person" where "first_name" = $1
   * ```
   *
   * @example
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person"."id" from "person", "pet"
   * ```
   *
   * @example
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person"."id", "first_name" from "person"
   * ```
   *
   * @example
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select
   *   "person"."first_name" as "fn",
   *   "person"."last_name" as "ln"
   * from "person"
   * ```
   *
   * @example
   * You can also select subqueries and raw expressions. Note that you
   * always need to give a name for the selections using the `as`
   * method:
   *
   * ```ts
   * const persons = await db.selectFrom('person')
   *   .select([
   *     (qb) => qb
   *       .subQuery('pet')
   *       .whereRef('person.id', '=', 'pet.owner_id')
   *       .select('pet.name')
   *       .limit(1)
   *       .as('pet_name')
   *     db.raw<string>("concat(first_name, ' ', last_name)").as('full_name')
   *   ])
   *   .execute()
   *
   * persons[0].pet_name
   * persons[0].full_name
   * ```
   *
   * The generated SQL (postgresql):
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
   * In case you use `raw` you need to specify the type of the expression
   * (in this example `string`).
   *
   * @example
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
   * type PossibleColumns = 'last_name' | 'first_name' | 'birth_date'
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
   * const lastName: string | undefined = persons[0].last_name
   * const firstName: string | undefined = persons[0].first_name
   * const birthDate: string | undefined = persons[0].birth_date
   *
   * // The result type also contains the compile time selection `id`.
   * persons[0].id
   * ```
   */
  select<S extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<S>
  ): QueryBuilderWithSelection<DB, TB, O, S>

  select<S extends SelectExpression<DB, TB>>(
    selection: S
  ): QueryBuilderWithSelection<DB, TB, O, S>

  select(selection: SelectExpressionOrList<DB, TB>): any {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(
        this.#props.queryNode,
        parseSelectExpressionOrList(this.#props.parseContext, selection)
      ),
    })
  }

  /**
   * Adds `distinct on` selections to the select clause.
   *
   * Takes the same inputs as the {@link QueryBuilder.select | select} method.
   * See the {@link QueryBuilder.select | select} method's documentation for
   * more examples.
   *
   * @example
   * ```ts
   * await db.selectFrom('person')
   *   .selectAll('person')
   *   .distinctOn('person.id')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .where('pet.name', '=', 'Doggo')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select distinct on ("person"."id") "person".*
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * where "pet"."name" = $1
   * ```
   */
  distinctOn<S extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<S>
  ): QueryBuilder<DB, TB, O>

  distinctOn<S extends SelectExpression<DB, TB>>(
    selection: S
  ): QueryBuilder<DB, TB, O>

  distinctOn(selection: SelectExpressionOrList<DB, TB>): any {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinctOnSelections(
        this.#props.queryNode,
        parseSelectExpressionOrList(this.#props.parseContext, selection)
      ),
    })
  }

  /**
   * Makes the selection distinct.
   *
   * @example
   * ```ts
   * await db.selectFrom('person')
   *   .select('first_name')
   *   .distinct()
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select distinct "first_name" from "person"
   * ```
   */
  distinct(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinct(this.#props.queryNode),
    })
  }

  /**
   * Adds the `for update` option to a select query on supported databases.
   */
  forUpdate(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
  forShare(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
  forKeyShare(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
  forNoKeyUpdate(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
  skipLocked(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
  noWait(): QueryBuilder<DB, TB, O> {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
   * @example
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person"
   * ```
   *
   * @example
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person".* from "person"
   * ```
   *
   * @example
   * ```ts
   * const personsPets = await db
   *   .selectFrom(['person', 'pet'])
   *   .selectAll(['person', 'pet'])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person".*, "pet".* from "person", "pet"
   * ```
   */
  selectAll<T extends TB>(
    table: ReadonlyArray<T>
  ): SelectAllQueryBuilder<DB, TB, O, T>

  selectAll<T extends TB>(table: T): SelectAllQueryBuilder<DB, TB, O, T>

  selectAll<T extends TB>(): SelectAllQueryBuilder<DB, TB, O, T>

  selectAll(table?: any): any {
    assertCanHaveSelectClause(this.#props.queryNode)

    return new QueryBuilder({
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
   * @example
   * Simple usage by providing a table name and two columns to join:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .execute()
   *
   * // The result has all `Person` columns
   * result[0].first_name
   *
   * // The result has all `Pet` columns
   * result[0].species
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * ```
   *
   * @example
   * You can give an alias for the joined table like this:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .selectAll()
   *   .innerJoin('pet as p', 'p.owner_id', 'person.id')
   *   .where('p.name', '=', 'Doggo')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet" as "p"
   * on "p"."owner_id" = "person"."id"
   * where "p".name" = $1
   * ```
   *
   * @example
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
   *   .selectAll()
   *   .innerJoin(
   *     'pet',
   *     (join) => join
   *       .onRef('pet.owner_id', '=', 'person.id')
   *       .on('pet.name', '=', 'Doggo')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * and "pet"."name" = $1
   * ```
   *
   * @example
   * You can join a subquery by providing a function as the first
   * argument:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .selectAll()
   *   .innerJoin(
   *     (qb) => qb.subQuery('pet')
   *       .select(['owner_id', 'name'])
   *       .where('name', '=', 'Doggo')
   *       .as('doggos'),
   *     'doggos.owner_id',
   *     'person.id',
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
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
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithTable<DB, TB, O, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): QueryBuilderWithTable<DB, TB, O, TE>

  innerJoin(...args: any): any {
    assertCanHaveJoins(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'InnerJoin', args)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.innerJoin | innerJoin} but adds a left join
   * instead of an inner join.
   */
  leftJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): QueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin(...args: any): any {
    assertCanHaveJoins(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'LeftJoin', args)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.innerJoin | innerJoin} but adds a right join
   * instead of an inner join.
   */
  rightJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): QueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin(...args: any): any {
    assertCanHaveJoins(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'RightJoin', args)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.innerJoin | innerJoin} but adds a full join
   * instead of an inner join.
   */
  fullJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): QueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin(...args: any): any {
    assertCanHaveJoins(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'FullJoin', args)
      ),
    })
  }

  /**
   * Sets the values to insert for an {@link Kysely.insertInto | insert} query.
   *
   * This method takes an object whose keys are column names and values are
   * values to insert. In addition to the column's type, the values can be
   * {@link Kysely.raw | raw} instances, select queries or the
   * {@link Kysely.generated} placeholder.
   *
   * You must provide all values defined by the interface for the table you
   * are inserting into. Values that are generated by the database like autoincrementing
   * identifiers can be marked with the {@link Kysely.generated} placeholder unless you
   * want to insert a specific value instead of the generated default.
   *
   * The return value is the primary key of the inserted row BUT on some databases
   * there is no return value by default. That's the reason for the `number | undefined`
   * type of the return value. On postgres you need to additionally call `returning` to get
   * something out of the query. If you know your database engine always returns the primary
   * key, you can use the {@link QueryBuilder.executeTakeFirstOrThrow | executeTakeFirstOrThrow}
   * method to execute the query.
   *
   * @example
   * Insert a row into `person`:
   * ```ts
   * const id = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "person" ("first_name", "last_name") values ($1, $2)
   * ```
   *
   * @example
   * On dialects that support it (for example postgres) you can insert multiple
   * rows by providing an array. Note that the return value is once again very
   * dialect-specific. Some databases may only return the id of the *first* inserted
   * row and some return nothing at all unless you call `returning`.
   *
   * ```ts
   * await db
   *   .insertInto('person')
   *   .values([{
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   }, {
   *     id: db.generated,
   *     first_name: 'Arnold',
   *     last_name: 'Schwarzenegger',
   *   }])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "person" ("first_name", "last_name") values (($1, $2), ($3, $4))
   * ```
   *
   * @example
   * On postgresql you need to chain `returning` to the query to get
   * the inserted row's columns (or any other expression) as the
   * return value:
   *
   * ```ts
   * const row = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning('id')
   *   .executeTakeFirstOrThrow()
   *
   * row.id
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "person" ("first_name", "last_name") values ($1, $2) returning "id"
   * ```
   *
   * @example
   * In addition to primitives, the values can also be `raw` expressions or
   * select queries:
   *
   * ```ts
   * const maybeId = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: db.raw('? || ?', ['Ani', 'ston']),
   *     age: db.selectFrom('person').select(raw('avg(age)')),
   *   })
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "person" ("first_name", "last_name", "age")
   * values ($1, $2 || $3, (select avg(age) from "person"))
   * ```
   */
  values(row: InsertObject<DB, TB>): QueryBuilder<DB, TB, O>

  values(row: InsertObject<DB, TB>[]): QueryBuilder<DB, TB, O>

  values(args: InsertObjectOrList<DB, TB>): any {
    assertCanHaveInsertValues(this.#props.queryNode)
    const [columns, values] = parseInsertObjectOrList(args)

    return new QueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        columns,
        values,
      }),
    })
  }

  /**
   * Ignores the insert if the column or constraint given as the first
   * argument conflicts with the current rows in the database. The
   * default behavior without this method call is to throw an error.
   *
   * For example if a table has a field `name` that has a unique constraint
   * and you try to insert a row with a `name` that already exists in the
   * database, calling `onConflictDoNothing('name')` will ignore the conflict
   * and do nothing. By default the query would throw.
   *
   * Only some dialects like postgres and sqlite implement the `on conflict`
   * statement. On MySQL you should use the {@link ignore} method to achieve
   * similar results.
   *
   * Also see the {@link QueryBuilder.onConflictUpdate | onConflictUpdate}
   * method if you want to perform an update in case of a conflict (upsert).
   *
   * @example
   * ```ts
   * await db
   *   .insertInto('pet')
   *   .values({
   *     id: db.generated,
   *     name: 'Catto',
   *     species: 'cat',
   *   })
   *   .onConflictDoNothing('name')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "pet" ("name", "species")
   * values ($1, $2)
   * on conflict ("name") do nothing
   * ```
   *
   * @example
   * You can provied the name of the constraint instead of a column name
   *
   * ```ts
   * await db
   *   .insertInto('pet')
   *   .values({
   *     id: db.generated,
   *     name: 'Catto',
   *     species: 'cat',
   *   })
   *   .onConflictDoNothing({
   *     constraint: 'pet_name_key'
   *   })
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "pet" ("name", "species")
   * values ($1, $2)
   * on conflict on constraint "pet_name_key"
   * do nothing
   * ```
   */
  onConflictDoNothing(column: AnyColumn<DB, TB>): QueryBuilder<DB, TB, O>

  onConflictDoNothing(
    columns: ReadonlyArray<AnyColumn<DB, TB>>
  ): QueryBuilder<DB, TB, O>

  onConflictDoNothing(
    constraint: OnConflictConstraintTarget
  ): QueryBuilder<DB, TB, O>

  onConflictDoNothing(
    target: OnConflictTargetExpression<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveOnConflict(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        onConflict: parseOnConflictDoNothing(target),
      }),
    })
  }

  /**
   * Changes an `insert into` query to an `insert ignore into` query.
   *
   * If you use the ignore modifier, ignorable errors that occur while executing the
   * insert statement are ignored. For example, without ignore, a row that duplicates
   * an existing unique index or primary key value in the table causes a duplicate-key
   * error and the statement is aborted. With ignore, the row is discarded and no error
   * occurs.
   *
   * This is only supported on some dialects like MySQL. On most dialects you should
   * use the {@link onConflictDoNothing} method.
   *
   * @example
   * ```ts
   * await db.insertInto('person')
   *   .ignore()
   *   .values(values)
   *   .execute()
   * ```
   */
  ignore(): QueryBuilder<DB, TB, O> {
    assertCanHaveInsertIgnore(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        ignore: true,
      }),
    })
  }

  /**
   * Ignores an insert if the column or constraint given as the first
   * argument conflicts with the current rows in the database and
   * performs an update on the conflicting row instead. This method
   * can be used to implement an upsert operation.
   *
   * For example if a table has a field `name` that has a unique constraint
   * and you try to insert a row with a `name` that already exists in the
   * database, calling `onConfictUpdate('name', { species: 'hamster' })`
   * will set the conflicting row's `species` field to value `'hamster'`.
   * By default the query would throw.
   *
   * The second argument (updates) can be anything the {@link QueryBuilder.set | set}
   * method accepts.
   *
   * The `on conflict do update` statement is only implemented by some dialects
   * like postgres and sqlite. On MySQL you should use the {@link onDuplicateKeyUpdate}
   * method instead.
   *
   * Also see the {@link QueryBuilder.onConflictDoNothing | onConflictDoNothing}
   * method.
   *
   * @example
   * ```ts
   * await db
   *   .insertInto('pet')
   *   .values({
   *     id: db.generated,
   *     name: 'Catto',
   *     species: 'cat',
   *   })
   *   .onConflictUpdate('name', { species: 'hamster' })
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "pet" ("name", "species")
   * values ($1, $2)
   * on conflict ("name") do update set "species" = $3
   * ```
   *
   * @example
   * You can provied the name of the constraint instead of a column name
   *
   * ```ts
   * await db
   *   .insertInto('pet')
   *   .values({
   *     id: db.generated,
   *     name: 'Catto',
   *     species: 'cat',
   *   })
   *   .onConflictUpdate(
   *     { constraint: 'pet_name_key' },
   *     { species: 'hamster' }
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * insert into "pet" ("name", "species")
   * values ($1, $2)
   * on conflict on constraint "pet_name_key"
   * do update set "species" = $3
   * ```
   */
  onConflictUpdate(
    column: AnyColumn<DB, TB>,
    updates: MutationObject<DB, TB>
  ): QueryBuilder<DB, TB, O>

  onConflictUpdate(
    columns: ReadonlyArray<AnyColumn<DB, TB>>,
    updates: MutationObject<DB, TB>
  ): QueryBuilder<DB, TB, O>

  onConflictUpdate(
    constraint: OnConflictConstraintTarget,
    updates: MutationObject<DB, TB>
  ): QueryBuilder<DB, TB, O>

  onConflictUpdate(
    target: OnConflictTargetExpression<DB, TB>,
    updates: MutationObject<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveOnConflict(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        onConflict: parseOnConflictUpdate(
          this.#props.parseContext,
          target,
          updates
        ),
      }),
    })
  }

  /**
   * Adds `on duplicate key update` to an insert query.
   *
   * If you specify `on duplicate key update`, and a row is inserted that would cause
   * a duplicate value in a unique index or primary key, an update of the old row occurs.
   *
   * This is only implemented by some dialects like MySQL. On most dialects you should
   * use {@link onConflictUpdate} instead.
   *
   * @example
   * ```ts
   * await db
   *   .insertInto('person')
   *   .values(values)
   *   .onDuplicateKeyUpdate({ species: 'hamster' })
   * ```
   */
  onDuplicateKeyUpdate(
    updates: MutationObject<DB, TB>
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveOnDuplicateKey(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        onDuplicateKey: OnDuplicateKeyNode.create(
          parseUpdateObject(this.#props.parseContext, updates)
        ),
      }),
    })
  }

  /**
   * Sets the values to update for an {@link Kysely.updateTable | update} query.
   *
   * This method takes an object whose keys are column names and values are
   * values to update. In addition to the column's type, the values can be `raw`
   * instances or select queries.
   *
   * The return value is the number of affected rows. You can use the
   * {@link QueryBuilder.returning | returning} method on supported databases
   * to get out the updated rows.
   *
   * @example
   * Update a row in `person` table:
   *
   * ```ts
   * const numAffectedRows = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .where('id', '=', 1)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * update "person" set "first_name" = $1, "last_name" = $2 where "id" = $3
   * ```
   *
   * @example
   * On postgresql you ca chain `returning` to the query to get
   * the updated rows' columns (or any other expression) as the
   * return value:
   *
   * ```ts
   * const row = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .where('id', '=', 1)
   *   .returning('id')
   *   .executeTakeFirstOrThrow()
   *
   * row.id
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * update "person" set "first_name" = $1, "last_name" = $2 where "id" = $3 returning "id"
   * ```
   *
   * @example
   * In addition to primitives, the values can also be `raw` expressions or
   * select queries:
   *
   * ```ts
   * const numAffectedRows = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: db.raw('? || ?', ['Ani', 'ston']),
   *     age: db.selectFrom('person').select(raw('avg(age)')),
   *   })
   *   .where('id', '=', 1)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * update "person" set
   * "first_name" = $1,
   * "last_name" = $2 || $3,
   * "age" = (select avg(age) from "person")
   * where "id" = $4
   * ```
   */
  set(row: MutationObject<DB, TB>): QueryBuilder<DB, TB, O> {
    assertCanHaveUpdates(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithUpdates(
        this.#props.queryNode,
        parseUpdateObject(this.#props.parseContext, row)
      ),
    })
  }

  /**
   * Allows you to return data from modified rows.
   *
   * On supported databases like postgres, this method can be chained to
   * `insert`, `update` and `delete` queries to return data.
   *
   * Also see the {@link QueryBuilder.returningAll | returningAll} method.
   *
   * @example
   * Return one column:
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
   *
   * @example
   * Return multiple columns:
   *
   * ```ts
   * const { id, first_name } = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning(['id', 'last_name'])
   *   .executeTakeFirst()
   * ```
   *
   * @example
   * Return arbitrary expressions:
   *
   * ```ts
   * const { raw } = db
   *
   * const { id, full_name, first_pet_id } = await db
   *   .insertInto('person')
   *   .values({
   *     id: db.generated,
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning([
   *     raw<string>(`concat(first_name, ' ', last_name)`).as('full_name'),
   *     (qb) => qb.subQuery('pets').select('pet.id').limit(1).as('first_pet_id')
   *   ])
   *   .executeTakeFirst()
   * ```
   */
  returning<S extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<S>
  ): QueryBuilderWithReturning<DB, TB, O, S>

  returning<S extends SelectExpression<DB, TB>>(
    selection: S
  ): QueryBuilderWithReturning<DB, TB, O, S>

  returning(selection: SelectExpressionOrList<DB, TB>): any {
    assertCanHaveReturningClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectExpressionOrList(this.#props.parseContext, selection)
      ),
    })
  }

  /**
   * Adds a `returning *` to an insert/update/delete query on databases
   * that support `returning` such as postgres.
   */
  returningAll(): QueryBuilder<DB, TB, DB[TB]> {
    assertCanHaveReturningClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectAll()
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
   * @example
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .select('person.first_name as fn')
   *   .orderBy('id')
   *   .orderBy('fn', 'desc')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "person"."first_name" as "fn"
   * from "person"
   * order by "id" asc, "fn" desc
   * ```
   *
   * @example
   * The order by expression can also be a `raw` expression or a subquery
   * in addition to column references:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .orderBy((qb) => qb.subQuery('pet')
   *     .select('pet.name')
   *     .whereRef('pet.owner_id', '=', 'person.id')
   *     .limit(1)
   *   )
   *   .orderBy(
   *     db.raw('concat(first_name, last_name)')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
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
   * @example
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
   * The generated SQL (postgresql):
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
  ): QueryBuilder<DB, TB, O> {
    assertCanHaveOrderByClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOrderByItem(
        this.#props.queryNode,
        OrderByItemNode.create(
          parseOrderByExpression(this.#props.parseContext, orderBy),
          parseOrderByDirectionExpression(direction)
        )
      ),
    })
  }

  /**
   * Adds a `group by` clause to the query.
   *
   * @example
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     db.raw('max(id)').as('max_id')
   *   ])
   *   .groupBy('first_name')
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "first_name", max(id)
   * from "person"
   * group by "first_name"
   * ```
   *
   * @example
   * `groupBy` also accepts an array:
   *
   * ```ts
   * const { raw } = db
   *
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     'last_name',
   *     raw('max(id)').as('max_id')
   *   ])
   *   .groupBy([
   *     'first_name',
   *     'last_name'
   *   ])
   *   .execute()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "first_name", "last_name", max(id)
   * from "person"
   * group by "first_name", "last_name"
   * ```
   *
   * @example
   * The group by expressions can also be subqueries or
   * raw expressions:
   *
   * ```ts
   * const { raw } = db
   *
   * await db
   *   .selectFrom('person')
   *   .select([
   *     'first_name',
   *     'last_name',
   *     raw('max(id)').as('max_id')
   *   ])
   *   .groupBy([
   *     raw('concat(first_name, last_name)'),
   *     (qb) => qb.subQuery('pet').select('id').limit(1)
   *   ])
   *   .execute()
   * ```
   *
   * @example
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
   * The generated SQL (postgresql):
   *
   * ```sql
   * select "first_name"
   * from "person"
   * group by "first_name"
   * ```
   */
  groupBy(
    orderBy: ReadonlyArray<ReferenceExpression<DB, TB>>
  ): QueryBuilder<DB, TB, O>

  groupBy(orderBy: ReferenceExpression<DB, TB>): QueryBuilder<DB, TB, O>

  groupBy(orderBy: any): QueryBuilder<DB, TB, O> {
    assertCanHaveGroupByClause(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithGroupByItems(
        this.#props.queryNode,
        parseReferenceExpressionOrList(this.#props.parseContext, orderBy).map(
          GroupByItemNode.create
        )
      ),
    })
  }

  /**
   * Adds a limit clause to the query.
   *
   * @example
   * Select the first 10 rows of the result:
   *
   * ```ts
   * return await db
   *   .selectFrom('person')
   *   .select('first_name')
   *   .limit(10)
   * ```
   *
   * @example
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
  limit(limit: number): QueryBuilder<DB, TB, O> {
    assertCanHaveLimit(this.#props.queryNode)

    return new QueryBuilder({
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
   * @example
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
  offset(offset: number): QueryBuilder<DB, TB, O> {
    assertCanHaveOffset(this.#props.queryNode)

    return new QueryBuilder({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOffset(
        this.#props.queryNode,
        OffsetNode.create(offset)
      ),
    })
  }

  /**
   * Gives an alias for the query. This method is only useful for sub queries.
   *
   * @example
   * ```ts
   * await db.selectFrom('pet')
   *   .selectAll('pet')
   *   .select(
   *     (qb) => qb.subQuery('person')
   *       .select('first_name')
   *       .whereRef('pet.owner_id', '=', 'person.id')
   *       .as('owner_first_name')
   *   )
   *   .execute()
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
  castTo<T>(): QueryBuilder<DB, TB, T> {
    return new QueryBuilder(this.#props)
  }

  toOperationNode(): QueryNode {
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
  async execute(): Promise<ManyResultRowType<O>[]> {
    const node = this.#props.executor.transformQuery(
      this.#props.queryNode,
      this.#props.queryId
    )

    const compildQuery = this.#props.executor.compileQuery(
      node,
      this.#props.queryId
    )

    const result = await this.#props.executor.executeQuery<
      ManyResultRowType<O>
    >(compildQuery, this.#props.queryId)

    if (InsertQueryNode.is(node)) {
      if (
        this.#props.parseContext.adapter.supportsReturning &&
        node.returning
      ) {
        return result.rows
      } else if (result.insertedPrimaryKey != null) {
        return [result.insertedPrimaryKey as ManyResultRowType<O>]
      } else {
        return []
      }
    } else if (UpdateQueryNode.is(node) || DeleteQueryNode.is(node)) {
      if (
        this.#props.parseContext.adapter.supportsReturning &&
        node.returning
      ) {
        return result.rows
      } else if (result.numUpdatedOrDeletedRows != null) {
        return [result.numUpdatedOrDeletedRows as ManyResultRowType<O>]
      } else {
        return []
      }
    } else {
      return result.rows
    }
  }

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  async executeTakeFirst(): Promise<SingleResultRowType<O>> {
    const [result] = await this.execute()
    return result
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
  ): Promise<NonEmptySingleResultRowType<O>> {
    const result = await this.executeTakeFirst()

    if (result === undefined) {
      throw new errorConstructor(this.toOperationNode())
    }

    return result as NonEmptySingleResultRowType<O>
  }
}

preventAwait(
  QueryBuilder,
  "don't await QueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface QueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: QueryNode
  readonly executor: QueryExecutor
  readonly parseContext: ParseContext
}

/**
 * {@link QueryBuilder} with an alias. The result of calling {@link QueryBuilder.as}.
 */
export class AliasedQueryBuilder<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> {
  readonly #queryBuilder: QueryBuilder<DB, TB, O>
  readonly #alias: A

  constructor(queryBuilder: QueryBuilder<DB, TB, O>, alias: A) {
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

    if (SelectQueryNode.is(node)) {
      return AliasNode.create(node, this.#alias)
    }

    throw new Error('only select queries can be aliased')
  }
}

export type NoResultErrorConstructor = new (node: QueryNode) => Error

export class NoResultError extends Error {
  /**
   * The operation node tree of the query that was executed.
   */
  readonly node: QueryNode

  constructor(node: QueryNode) {
    super('no result')
    this.node = node
  }
}

function assertCanHaveWhereClause(
  node: QueryNode
): asserts node is FilterableQueryNode {
  if (!QueryNode.isFilterable(node)) {
    throw new Error(
      'only select, delete and update queries can have a where clause'
    )
  }
}

function assertCanHaveHavingClause(
  node: QueryNode
): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only select queries can have a having clause')
  }
}

function assertCanHaveSelectClause(
  node: QueryNode
): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only a select query can have selections')
  }
}

function assertCanHaveJoins(
  node: QueryNode
): asserts node is FilterableQueryNode {
  if (!QueryNode.isFilterable(node)) {
    throw new Error('only select, delete and update queries can have joins')
  }
}

function assertCanHaveInsertValues(
  node: QueryNode
): asserts node is InsertQueryNode {
  if (!InsertQueryNode.is(node)) {
    throw new Error('only an insert query can have insert values')
  }
}

function assertCanHaveInsertIgnore(
  node: QueryNode
): asserts node is InsertQueryNode {
  if (!InsertQueryNode.is(node)) {
    throw new Error('only an insert query can have the ignore clause')
  }
}

function assertCanHaveOnConflict(
  node: QueryNode
): asserts node is InsertQueryNode {
  if (!InsertQueryNode.is(node)) {
    throw new Error('only an insert query can have an on conflict clause')
  }
}

function assertCanHaveOnDuplicateKey(
  node: QueryNode
): asserts node is InsertQueryNode {
  if (!InsertQueryNode.is(node)) {
    throw new Error('only an insert query can have an on duplicate key clause')
  }
}

function assertCanHaveUpdates(
  node: QueryNode
): asserts node is UpdateQueryNode {
  if (!UpdateQueryNode.is(node)) {
    throw new Error('only an update query can set values')
  }
}

function assertCanHaveReturningClause(
  node: QueryNode
): asserts node is MutatingQueryNode {
  if (!QueryNode.isMutating(node)) {
    throw new Error(
      'only an insert, delete and update queries can have a returning clause'
    )
  }
}

function assertCanHaveOrderByClause(
  node: QueryNode
): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only a select query can have an order by clause')
  }
}

function assertCanHaveGroupByClause(
  node: QueryNode
): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only a select query can have a group by clause')
  }
}

function assertCanHaveLimit(node: QueryNode): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only a select query can have a limit')
  }
}

function assertCanHaveOffset(node: QueryNode): asserts node is SelectQueryNode {
  if (!SelectQueryNode.is(node)) {
    throw new Error('only a select query can have an offset')
  }
}
