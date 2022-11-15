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
  parseSelectExpressionOrList,
  parseSelectAll,
  SelectExpression,
  SelectExpressionOrList,
} from '../parser/select-parser.js'
import {
  ExistsExpression,
  parseExistFilter,
  FilterOperator,
  parseReferenceFilter,
  parseWhereFilter,
  parseNotExistFilter,
  FilterValueExpressionOrList,
  WhereGrouper,
} from '../parser/filter-parser.js'
import { ReturningRow } from '../parser/returning-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { QueryNode } from '../operation-node/query-node.js'
import {
  MergePartial,
  Nullable,
  PickWith,
  SingleResultType,
} from '../util/type-utils.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import {
  MutationObject,
  parseUpdateObject,
} from '../parser/update-set-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { UpdateResult } from './update-result.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { ReturningInterface } from './returning-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { Selectable } from '../util/column-type.js'
import { Explainable, ExplainFormat } from '../util/explainable.js'
import { ExplainNode } from '../operation-node/explain-node.js'
import { AliasedExpression, Expression } from '../expression/expression.js'

export class UpdateQueryBuilder<DB, UT extends keyof DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    ReturningInterface<DB, TB, O>,
    OperationNodeSource,
    Compilable<O>,
    Explainable
{
  readonly #props: UpdateQueryBuilderProps

  constructor(props: UpdateQueryBuilderProps) {
    this.#props = freeze(props)
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): UpdateQueryBuilder<DB, UT, TB, O>

  where(grouper: WhereGrouper<DB, TB>): UpdateQueryBuilder<DB, UT, TB, O>
  where(expression: Expression<any>): UpdateQueryBuilder<DB, UT, TB, O>

  where(...args: any[]): any {
    return new UpdateQueryBuilder({
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
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
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
  ): UpdateQueryBuilder<DB, UT, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): UpdateQueryBuilder<DB, UT, TB, O>
  orWhere(expression: Expression<any>): UpdateQueryBuilder<DB, UT, TB, O>

  orWhere(...args: any[]): any {
    return new UpdateQueryBuilder({
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
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
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
        parseExistFilter(arg)
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
        parseNotExistFilter(arg)
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
        parseExistFilter(arg)
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
        parseNotExistFilter(arg)
      ),
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
   *   .set({
   *     first_name: (eb) => eb.ref('pet.name')
   *   })
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
   * raw {@link sql} snippets or select queries.
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
   * In addition to primitives, the values can also be raw sql expressions or
   * select queries:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const result = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: sql`${'Ani'} || ${'ston'}`,
   *     age: db.selectFrom('person').select(sql`avg(age)`),
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
   * update "person" set
   * "first_name" = $1,
   * "last_name" = $2 || $3,
   * "age" = (select avg(age) from "person")
   * where "id" = $4
   * ```
   */
  set<R extends MutationObject<DB, TB, UT>>(
    row: PickWith<MutationObject<DB, TB, UT>, R>
  ): UpdateQueryBuilder<DB, UT, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithUpdates(
        this.#props.queryNode,
        parseUpdateObject(row)
      ),
    })
  }

  returning<SE extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<SE>
  ): UpdateQueryBuilder<DB, UT, TB, ReturningRow<DB, TB, O, SE>>

  returning<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): UpdateQueryBuilder<DB, UT, TB, ReturningRow<DB, TB, O, SE>>

  returning(selection: SelectExpressionOrList<DB, TB>): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectExpressionOrList(selection)
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
   * db.updateTable('person')
   *   .set(values)
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
   *     .if(returnLastName, (qb) => qb.returning('last_name'))
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
    if (condition) {
      return func(this) as any
    }

    return new UpdateQueryBuilder({
      ...this.#props,
    })
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  castTo<T>(): UpdateQueryBuilder<DB, UT, TB, T> {
    return new UpdateQueryBuilder(this.#props)
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
    const query = compiledQuery.query as UpdateQueryNode

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
      this.#props.queryId
    )

    if (this.#props.executor.adapter.supportsReturning && query.returning) {
      return result.rows
    } else {
      return [new UpdateResult(result.numUpdatedOrDeletedRows!) as unknown as O]
    }
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
   * Executes query with `explain` statement before `update` keyword.
   *
   * ```ts
   * const explained = await db
   *  .updateTable('person')
   *  .set(updates)
   *  .where('id', '=', 123)
   *  .explain('json')
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * explain format=json update `person` set `first_name` = ?, `last_name` = ? where `id` = ?
   * ```
   */
  async explain<ER extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: Expression<any>
  ): Promise<ER[]> {
    const builder = new UpdateQueryBuilder<DB, UT, TB, ER>({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithExplain(
        this.#props.queryNode,
        ExplainNode.create(format, options?.toOperationNode())
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
