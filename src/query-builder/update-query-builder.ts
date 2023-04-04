import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import {
  TableExpression,
  From,
  FromTables,
  parseTableExpressionOrList,
  TableExpressionOrList,
} from '../parser/table-parser.js'
import {
  parseSelectArg,
  parseSelectAll,
  SelectExpression,
  SelectArg,
} from '../parser/select-parser.js'
import { ReturningRow } from '../parser/returning-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  MergePartial,
  Nullable,
  SimplifyResult,
  SimplifySingleResult,
} from '../util/type-utils.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import {
  parseUpdateExpression,
  UpdateExpression,
  UpdateObject,
  UpdateObjectFactory,
} from '../parser/update-set-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { UpdateResult } from './update-result.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereExpressionFactory, WhereInterface } from './where-interface.js'
import { ReturningInterface } from './returning-interface.js'
import {
  isNoResultErrorConstructor,
  NoResultError,
  NoResultErrorConstructor,
} from './no-result-error.js'
import { Selectable } from '../util/column-type.js'
import { Explainable, ExplainFormat } from '../util/explainable.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseReferentialComparison,
  parseWhere,
} from '../parser/binary-operation-parser.js'
import {
  ExistsExpression,
  parseExists,
  parseNotExists,
} from '../parser/unary-operation-parser.js'
import { KyselyTypeError } from '../util/type-error.js'
import { Streamable } from '../util/streamable.js'

export class UpdateQueryBuilder<DB, UT extends keyof DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    ReturningInterface<DB, TB, O>,
    OperationNodeSource,
    Compilable<O>,
    Explainable,
    Streamable<O>
{
  readonly #props: UpdateQueryBuilderProps

  constructor(props: UpdateQueryBuilderProps) {
    this.#props = freeze(props)
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  where(
    factory: WhereExpressionFactory<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  where(expression: Expression<any>): UpdateQueryBuilder<DB, UT, TB, O>

  where(...args: any[]): any {
    return new UpdateQueryBuilder({
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
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  orWhere(
    factory: WhereExpressionFactory<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  orWhere(expression: Expression<any>): UpdateQueryBuilder<DB, UT, TB, O>

  orWhere(...args: any[]): any {
    return new UpdateQueryBuilder({
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
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  whereExists(
    arg: ExistsExpression<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExists(arg)
      ),
    })
  }

  whereNotExists(
    arg: ExistsExpression<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExists(arg)
      ),
    })
  }

  orWhereExists(
    arg: ExistsExpression<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExists(arg)
      ),
    })
  }

  orWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseNotExists(arg)
      ),
    })
  }

  clearWhere(): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithoutWhere(this.#props.queryNode),
    })
  }

  /**
   * Adds a from clause to the update query.
   *
   * This is supported only on some databases like PostgreSQL.
   *
   * The API is the same as {@link QueryCreator.selectFrom}.
   *
   * ### Examples
   *
   * ```ts
   * db.updateTable('person')
   *   .from('pet')
   *   .set((eb) => ({
   *     first_name: eb.ref('pet.name')
   *   }))
   *   .whereRef('pet.owner_id', '=', 'person.id')
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person"
   * set "first_name" = "pet"."name"
   * from "pet"
   * where "pet"."owner_id" = "person"."id"
   * ```
   */
  from<TE extends TableExpression<DB, TB>>(
    table: TE
  ): UpdateQueryBuilder<From<DB, TE>, UT, FromTables<DB, TB, TE>, O>

  from<TE extends TableExpression<DB, TB>>(
    table: TE[]
  ): UpdateQueryBuilder<From<DB, TE>, UT, FromTables<DB, TB, TE>, O>

  from(from: TableExpressionOrList<any, any>): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithFromItems(
        this.#props.queryNode,
        parseTableExpressionOrList(from)
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
   *   .select(['person.id', 'pet.name'])
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
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilderWithInnerJoin<DB, UT, TB, O, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): UpdateQueryBuilderWithInnerJoin<DB, UT, TB, O, TE>

  innerJoin(...args: any): any {
    return new UpdateQueryBuilder({
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
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilderWithLeftJoin<DB, UT, TB, O, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): UpdateQueryBuilderWithLeftJoin<DB, UT, TB, O, TE>

  leftJoin(...args: any): any {
    return new UpdateQueryBuilder({
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
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilderWithRightJoin<DB, UT, TB, O, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): UpdateQueryBuilderWithRightJoin<DB, UT, TB, O, TE>

  rightJoin(...args: any): any {
    return new UpdateQueryBuilder({
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
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilderWithFullJoin<DB, UT, TB, O, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): UpdateQueryBuilderWithFullJoin<DB, UT, TB, O, TE>

  fullJoin(...args: any): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('FullJoin', args)
      ),
    })
  }

  /**
   * Sets the values to update for an {@link Kysely.updateTable | update} query.
   *
   * This method takes an object whose keys are column names and values are
   * values to update. In addition to the column's type, the values can be
   * any expressions such as raw {@link sql} snippets or select queries.
   *
   * This method also accepts a callback that returns the update object. The
   * callback takes an instance of {@link ExpressionBuilder} as its only argument.
   * The expression builder can be used to create arbitrary update expressions.
   *
   * The return value of an update query is an instance of {@link UpdateResult}.
   * You can use the {@link returning} method on supported databases to get out
   * the updated rows.
   *
   * ### Examples
   *
   * Update a row in `person` table:
   *
   * ```ts
   * const result = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .where('id', '=', 1)
   *   .executeTakeFirst()
   *
   * console.log(result.numUpdatedRows)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person" set "first_name" = $1, "last_name" = $2 where "id" = $3
   * ```
   *
   * On PostgreSQL you ca chain `returning` to the query to get
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
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person" set "first_name" = $1, "last_name" = $2 where "id" = $3 returning "id"
   * ```
   *
   * In addition to primitives, the values can arbitrary expressions including
   * raw `sql` snippets or subqueries:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const result = await db
   *   .updateTable('person')
   *   .set(({ selectFrom, ref, fn, bxp }) => ({
   *     first_name: selectFrom('person').select('first_name').limit(1),
   *     middle_name: ref('first_name'),
   *     age: bxp('age', '+', 1),
   *     last_name: sql`${'Ani'} || ${'ston'}`,
   *   }))
   *   .where('id', '=', 1)
   *   .executeTakeFirst()
   *
   * console.log(result.numUpdatedRows)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person" set
   * "first_name" = (select "first_name" from "person" limit $1),
   * "middle_name" = "first_name",
   * "age" = "age" + $2,
   * "last_name" = $3 || $4
   * where "id" = $5
   * ```
   */
  set(update: UpdateObject<DB, TB, UT>): UpdateQueryBuilder<DB, UT, TB, O>

  set(
    update: UpdateObjectFactory<DB, TB, UT>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  set(update: UpdateExpression<DB, TB, UT>): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithUpdates(
        this.#props.queryNode,
        parseUpdateExpression(update)
      ),
    })
  }

  returning<SE extends SelectExpression<DB, TB>>(
    selection: SelectArg<DB, TB, SE>
  ): UpdateQueryBuilder<DB, UT, TB, ReturningRow<DB, TB, O, SE>> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectArg(selection)
      ),
    })
  }

  returningAll(): UpdateQueryBuilder<DB, UT, TB, Selectable<DB[TB]>> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectAll()
      ),
    })
  }

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
   * db.updateTable('person')
   *   .set(values)
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
   * This method is especially handy with optional selects. Any `returning` or `returningAll`
   * method calls add columns as optional fields to the output type when called inside
   * the `func` callback. This is because we can't know if those selections were actually
   * made before running the code.
   *
   * You can also call any other methods inside the callback.
   *
   * ### Examples
   *
   * ```ts
   * async function updatePerson(id: number, updates: UpdateablePerson, returnLastName: boolean) {
   *   return await db
   *     .updateTable('person')
   *     .set(updates)
   *     .where('id', '=', id)
   *     .returning(['id', 'first_name'])
   *     .$if(returnLastName, (qb) => qb.returning('last_name'))
   *     .executeTakeFirstOrThrow()
   * }
   * ```
   *
   * Any selections added inside the `if` callback will be added as optional fields to the
   * output type since we can't know if the selections were actually made before running
   * the code. In the example above the return type of the `updatePerson` function is:
   *
   * ```ts
   * {
   *   id: number
   *   first_name: string
   *   last_name?: string
   * }
   * ```
   */
  $if<O2>(
    condition: boolean,
    func: (qb: this) => UpdateQueryBuilder<DB, UT, TB, O2>
  ): UpdateQueryBuilder<
    DB,
    UT,
    TB,
    O2 extends UpdateResult
      ? UpdateResult
      : O extends UpdateResult
      ? Partial<O2>
      : MergePartial<O, O2>
  > {
    if (condition) {
      return func(this) as any
    }

    return new UpdateQueryBuilder({
      ...this.#props,
    })
  }

  /**
   * @deprecated Use `$if` instead
   */
  if<O2>(
    condition: boolean,
    func: (qb: this) => UpdateQueryBuilder<DB, UT, TB, O2>
  ): UpdateQueryBuilder<
    DB,
    UT,
    TB,
    O2 extends UpdateResult
      ? UpdateResult
      : O extends UpdateResult
      ? Partial<O2>
      : MergePartial<O, O2>
  > {
    return this.$if(condition, func)
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  $castTo<T>(): UpdateQueryBuilder<DB, UT, TB, T> {
    return new UpdateQueryBuilder(this.#props)
  }

  /**
   * @deprecated Use `$castTo` instead.
   */
  castTo<T>(): UpdateQueryBuilder<DB, UT, TB, T> {
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
   *   .with('updated_person', (qb) => qb
   *     .updateTable('person')
   *     .set(person)
   *     .where('id', '=', person.id)
   *     .returning('first_name')
   *     .$assertType<{ first_name: string }>()
   *   )
   *   .with('updated_pet', (qb) => qb
   *     .updateTable('pet')
   *     .set(pet)
   *     .where('owner_id', '=', person.id)
   *     .returning(['name as pet_name', 'species'])
   *     .$assertType<{ pet_name: string, species: Species }>()
   *   )
   *   .selectFrom(['updated_person', 'updated_pet'])
   *   .selectAll()
   *   .executeTakeFirstOrThrow()
   * ```
   */
  $assertType<T extends O>(): O extends T
    ? UpdateQueryBuilder<DB, UT, TB, T>
    : KyselyTypeError<`$assertType() call failed: The type passed in is not equal to the output type of the query.`> {
    return new UpdateQueryBuilder(this.#props) as unknown as any
  }

  /**
   * @deprecated Use `$assertType` instead.
   */
  assertType<T extends O>(): O extends T
    ? UpdateQueryBuilder<DB, UT, TB, T>
    : KyselyTypeError<`assertType() call failed: The type passed in is not equal to the output type of the query.`> {
    return new UpdateQueryBuilder(this.#props) as unknown as any
  }

  /**
   * Returns a copy of this UpdateQueryBuilder instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  toOperationNode(): UpdateQueryNode {
    return this.#props.executor.transformQuery(
      this.#props.queryNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery<SimplifyResult<O>> {
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
  async execute(): Promise<SimplifyResult<O>[]> {
    const compiledQuery = this.compile()
    const query = compiledQuery.query as UpdateQueryNode

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
      this.#props.queryId
    )

    if (this.#props.executor.adapter.supportsReturning && query.returning) {
      return result.rows as any
    }

    return [
      new UpdateResult(
        // TODO: remove numUpdatedOrDeletedRows.
        result.numAffectedRows ?? result.numUpdatedOrDeletedRows ?? BigInt(0)
      ) as any,
    ]
  }

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  async executeTakeFirst(): Promise<SimplifySingleResult<O>> {
    const [result] = await this.execute()
    return result as SimplifySingleResult<O>
  }

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class, or callback as the only argument to throw a different
   * error.
   */
  async executeTakeFirstOrThrow(
    errorConstructor:
      | NoResultErrorConstructor
      | ((node: QueryNode) => Error) = NoResultError
  ): Promise<SimplifyResult<O>> {
    const result = await this.executeTakeFirst()

    if (result === undefined) {
      const error = isNoResultErrorConstructor(errorConstructor)
        ? new errorConstructor(this.toOperationNode())
        : errorConstructor(this.toOperationNode())

      throw error
    }

    return result as SimplifyResult<O>
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
    const builder = new UpdateQueryBuilder<DB, UT, TB, ER>({
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
  UpdateQueryBuilder,
  "don't await UpdateQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface UpdateQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: UpdateQueryNode
  readonly executor: QueryExecutor
}

export type UpdateQueryBuilderWithInnerJoin<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? InnerJoinedBuilder<DB, UT, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? UpdateQueryBuilder<DB, UT, TB | TE, O>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? InnerJoinedBuilder<DB, UT, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? InnerJoinedBuilder<DB, UT, TB, O, QA, QO>
  : never

type InnerJoinedBuilder<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  A extends string,
  R
> = A extends keyof DB
  ? UpdateQueryBuilder<InnerJoinedDB<DB, A, R>, UT, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    UpdateQueryBuilder<DB & Record<A, R>, UT, TB | A, O>

type InnerJoinedDB<DB, A extends string, R> = {
  [C in keyof DB | A]: C extends A ? R : C extends keyof DB ? DB[C] : never
}

export type UpdateQueryBuilderWithLeftJoin<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? LeftJoinedBuilder<DB, UT, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? LeftJoinedBuilder<DB, UT, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? LeftJoinedBuilder<DB, UT, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? LeftJoinedBuilder<DB, UT, TB, O, QA, QO>
  : never

type LeftJoinedBuilder<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = A extends keyof DB
  ? UpdateQueryBuilder<LeftJoinedDB<DB, A, R>, UT, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    UpdateQueryBuilder<DB & Record<A, Nullable<R>>, UT, TB | A, O>

type LeftJoinedDB<DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends keyof DB
    ? DB[C]
    : never
}

export type UpdateQueryBuilderWithRightJoin<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? RightJoinedBuilder<DB, UT, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? RightJoinedBuilder<DB, UT, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? RightJoinedBuilder<DB, UT, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? RightJoinedBuilder<DB, UT, TB, O, QA, QO>
  : never

type RightJoinedBuilder<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = UpdateQueryBuilder<RightJoinedDB<DB, TB, A, R>, UT, TB | A, O>

type RightJoinedDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? R
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}

export type UpdateQueryBuilderWithFullJoin<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? OuterJoinedBuilder<DB, UT, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? OuterJoinedBuilder<DB, UT, TB, O, TE, DB[TE]>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? OuterJoinedBuilder<DB, UT, TB, O, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? OuterJoinedBuilder<DB, UT, TB, O, QA, QO>
  : never

type OuterJoinedBuilder<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O,
  A extends keyof any,
  R
> = UpdateQueryBuilder<OuterJoinedBuilderDB<DB, TB, A, R>, UT, TB | A, O>

type OuterJoinedBuilderDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}
