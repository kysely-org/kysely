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
import { MergePartial, Nullable, SingleResultType } from '../util/type-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { ReturningInterface } from './returning-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { DeleteResult } from './delete-result.js'
import { DeleteQueryNode } from '../operation-node/delete-query-node.js'
import { Selectable } from '../util/column-type.js'
import { LimitNode } from '../operation-node/limit-node.js'
import {
  OrderByDirectionExpression,
  OrderByExpression,
  parseOrderBy,
} from '../parser/order-by-parser.js'
import { Explainable, ExplainFormat } from '../util/explainable.js'
import { ExplainNode } from '../operation-node/explain-node.js'
import { AliasedExpression, Expression } from '../expression/expression.js'

export class DeleteQueryBuilder<DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    ReturningInterface<DB, TB, O>,
    OperationNodeSource,
    Compilable,
    Explainable
{
  readonly #props: DeleteQueryBuilderProps

  constructor(props: DeleteQueryBuilderProps) {
    this.#props = freeze(props)
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): DeleteQueryBuilder<DB, TB, O>

  where(grouper: WhereGrouper<DB, TB>): DeleteQueryBuilder<DB, TB, O>
  where(expression: Expression<any>): DeleteQueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): DeleteQueryBuilder<DB, TB, O>
  orWhere(expression: Expression<any>): DeleteQueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(lhs, op, rhs)
      ),
    })
  }

  whereExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  whereNotExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExistFilter(arg)
      ),
    })
  }

  orWhereExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExistFilter(arg)
      ),
    })
  }

  orWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseNotExistFilter(arg)
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
  >(table: TE, k1: K1, k2: K2): DeleteQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): DeleteQueryBuilderWithInnerJoin<DB, TB, O, TE>

  innerJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  >(table: TE, k1: K1, k2: K2): DeleteQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): DeleteQueryBuilderWithLeftJoin<DB, TB, O, TE>

  leftJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  >(table: TE, k1: K1, k2: K2): DeleteQueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): DeleteQueryBuilderWithRightJoin<DB, TB, O, TE>

  rightJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  >(table: TE, k1: K1, k2: K2): DeleteQueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(table: TE, callback: FN): DeleteQueryBuilderWithFullJoin<DB, TB, O, TE>

  fullJoin(...args: any): any {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin('FullJoin', args)
      ),
    })
  }

  returning<SE extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<SE>
  ): DeleteQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>

  returning<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): DeleteQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>

  returning(selection: SelectExpressionOrList<DB, TB>): any {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectExpressionOrList(selection)
      ),
    })
  }

  returningAll(): DeleteQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return new DeleteQueryBuilder({
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
   * An `order by` clause in a delete query is only supported by some dialects
   * like MySQL.
   *
   * See {@link SelectQueryBuilder.orderBy} for more examples.
   *
   * ### Examples
   *
   * Delete 5 oldest items in a table:
   *
   * ```ts
   * await db
   *   .deleteFrom('pet')
   *   .orderBy('created_at')
   *   .limit(5)
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * delete from `pet`
   * order by `created_at`
   * limit ?
   * ```
   */
  orderBy(
    orderBy: OrderByExpression<DB, TB, O>,
    direction?: OrderByDirectionExpression
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: DeleteQueryNode.cloneWithOrderByItem(
        this.#props.queryNode,
        parseOrderBy(orderBy, direction)
      ),
    })
  }

  /**
   * Adds a limit clause to the query.
   *
   * A limit clause in a delete query is only supported by some dialects
   * like MySQL.
   *
   * ### Examples
   *
   * Delete 5 oldest items in a table:
   *
   * ```ts
   * await db
   *   .deleteFrom('pet')
   *   .orderBy('created_at')
   *   .limit(5)
   *   .execute()
   * ```
   */
  limit(limit: number): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: DeleteQueryNode.cloneWithLimit(
        this.#props.queryNode,
        LimitNode.create(limit)
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
   * db.deleteFrom('person')
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
   * async function deletePerson(id: number, returnLastName: boolean) {
   *   return await db
   *     .deleteFrom('person')
   *     .where('id', '=', id)
   *     .returning(['id', 'first_name'])
   *     .if(returnLastName, (qb) => qb.returning('last_name'))
   *     .executeTakeFirstOrThrow()
   * }
   * ```
   *
   * Any selections added inside the `if` callback will be added as optional fields to the
   * output type since we can't know if the selections were actually made before running
   * the code. In the example above the return type of the `deletePerson` function is:
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
    func: (qb: this) => DeleteQueryBuilder<DB, TB, O2>
  ): DeleteQueryBuilder<
    DB,
    TB,
    O2 extends DeleteResult
      ? DeleteResult
      : O extends DeleteResult
      ? Partial<O2>
      : MergePartial<O, O2>
  > {
    if (condition) {
      return func(this) as any
    }

    return new DeleteQueryBuilder({
      ...this.#props,
    })
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  castTo<T>(): DeleteQueryBuilder<DB, TB, T> {
    return new DeleteQueryBuilder(this.#props)
  }

  /**
   * Returns a copy of this DeleteQueryBuilder instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  toOperationNode(): DeleteQueryNode {
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
    const compiledQuery = this.compile()
    const query = compiledQuery.query as DeleteQueryNode

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
      this.#props.queryId
    )

    if (this.#props.executor.adapter.supportsReturning && query.returning) {
      return result.rows
    } else {
      return [new DeleteResult(result.numUpdatedOrDeletedRows!) as unknown as O]
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
   * Executes query with `explain` statement before `delete` keyword.
   *
   * ```ts
   * const explained = await db
   *  .deleteFrom('person')
   *  .where('id', '=', 123)
   *  .explain('json')
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * explain format=json delete from `person` where `id` = ?
   * ```
   */
  async explain<ER extends Record<string, any> = Record<string, any>>(
    format?: ExplainFormat,
    options?: Expression<any>
  ): Promise<ER[]> {
    const builder = new DeleteQueryBuilder<DB, TB, ER>({
      ...this.#props,
      queryNode: DeleteQueryNode.cloneWithExplain(
        this.#props.queryNode,
        ExplainNode.create(format, options?.toOperationNode())
      ),
    })

    return await builder.execute()
  }
}

preventAwait(
  DeleteQueryBuilder,
  "don't await DeleteQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface DeleteQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: DeleteQueryNode
  readonly executor: QueryExecutor
}

export type DeleteQueryBuilderWithInnerJoin<
  DB,
  TB extends keyof DB,
  O,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? InnerJoinedBuilder<DB, TB, O, A, DB[T]>
    : never
  : TE extends keyof DB
  ? DeleteQueryBuilder<DB, TB | TE, O>
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
  ? DeleteQueryBuilder<InnerJoinedDB<DB, A, R>, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    DeleteQueryBuilder<DB & Record<A, R>, TB | A, O>

type InnerJoinedDB<DB, A extends string, R> = {
  [C in keyof DB | A]: C extends A ? R : C extends keyof DB ? DB[C] : never
}

export type DeleteQueryBuilderWithLeftJoin<
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
  ? DeleteQueryBuilder<LeftJoinedDB<DB, A, R>, TB | A, O>
  : // Much faster non-recursive solution for the simple case.
    DeleteQueryBuilder<DB & Record<A, Nullable<R>>, TB | A, O>

type LeftJoinedDB<DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends keyof DB
    ? DB[C]
    : never
}

export type DeleteQueryBuilderWithRightJoin<
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
> = DeleteQueryBuilder<RightJoinedDB<DB, TB, A, R>, TB | A, O>

type RightJoinedDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? R
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}

export type DeleteQueryBuilderWithFullJoin<
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
> = DeleteQueryBuilder<OuterJoinedBuilderDB<DB, TB, A, R>, TB | A, O>

type OuterJoinedBuilderDB<DB, TB extends keyof DB, A extends keyof any, R> = {
  [C in keyof DB | A]: C extends A
    ? Nullable<R>
    : C extends TB
    ? Nullable<DB[C]>
    : C extends keyof DB
    ? DB[C]
    : never
}
