import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import {
  TableExpression,
  TableExpressionDatabase,
  TableExpressionTables,
  LeftJoinTableExpressionDatabase,
  RightJoinTableExpressionDatabase,
  FullJoinTableExpressionDatabase,
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
import { AnyRawBuilder, SingleResultType } from '../util/type-utils.js'
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
import { ParseContext } from '../parser/parse-context.js'
import { UpdateResult } from './update-result.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { JoinInterface } from './join-interface.js'
import { ReturningInterface } from './returning-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { Selectable } from '../util/column-type.js'

export class UpdateQueryBuilder<DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    JoinInterface<DB, TB>,
    ReturningInterface<DB, TB, O>,
    OperationNodeSource,
    Compilable
{
  readonly #props: UpdateQueryBuilderProps

  constructor(props: UpdateQueryBuilderProps) {
    this.#props = freeze(props)
  }

  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): UpdateQueryBuilder<DB, TB, O>

  where(grouper: WhereGrouper<DB, TB>): UpdateQueryBuilder<DB, TB, O>
  where(raw: AnyRawBuilder): UpdateQueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseWhereFilter(this.#props.parseContext, args)
      ),
    })
  }

  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): UpdateQueryBuilder<DB, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): UpdateQueryBuilder<DB, TB, O>
  orWhere(raw: AnyRawBuilder): UpdateQueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseWhereFilter(this.#props.parseContext, args)
      ),
    })
  }

  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  whereExists(arg: ExistsExpression<DB, TB>): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  whereNotExists(arg: ExistsExpression<DB, TB>): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  orWhereExists(arg: ExistsExpression<DB, TB>): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  orWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  innerJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilder<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): UpdateQueryBuilder<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  innerJoin(...args: any): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'InnerJoin', args)
      ),
    })
  }

  leftJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilder<
    LeftJoinTableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): UpdateQueryBuilder<
    LeftJoinTableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  leftJoin(...args: any): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'LeftJoin', args)
      ),
    })
  }

  rightJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilder<
    RightJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): UpdateQueryBuilder<
    RightJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  rightJoin(...args: any): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'RightJoin', args)
      ),
    })
  }

  fullJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): UpdateQueryBuilder<
    FullJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): UpdateQueryBuilder<
    FullJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  fullJoin(...args: any): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'FullJoin', args)
      ),
    })
  }

  /**
   * Sets the values to update for an {@link Kysely.updateTable | update} query.
   *
   * This method takes an object whose keys are column names and values are
   * values to update. In addition to the column's type, the values can be `raw`
   * instances or select queries.
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
   * In addition to primitives, the values can also be `raw` expressions or
   * select queries:
   *
   * ```ts
   * const result = await db
   *   .updateTable('person')
   *   .set({
   *     first_name: 'Jennifer',
   *     last_name: db.raw('? || ?', ['Ani', 'ston']),
   *     age: db.selectFrom('person').select(raw('avg(age)')),
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
  set(row: MutationObject<DB, TB>): UpdateQueryBuilder<DB, TB, O> {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: UpdateQueryNode.cloneWithUpdates(
        this.#props.queryNode,
        parseUpdateObject(this.#props.parseContext, row)
      ),
    })
  }

  returning<SE extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<SE>
  ): UpdateQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>

  returning<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): UpdateQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>

  returning(selection: SelectExpressionOrList<DB, TB>): any {
    return new UpdateQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithReturning(
        this.#props.queryNode,
        parseSelectExpressionOrList(this.#props.parseContext, selection)
      ),
    })
  }

  returningAll(): UpdateQueryBuilder<DB, TB, Selectable<DB[TB]>> {
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
   * This method can be useful when adding optional method calls:
   *
   * ### Examples
   *
   * ```ts
   * db.updateTable('person')
   *   .set(values)
   *   .call((qb) => {
   *     if (something) {
   *       return qb.where('something', '=', something)
   *     } else {
   *       return qb.where('somethingElse', '=', somethingElse)
   *     }
   *   })
   *   .execute()
   * ```
   */
  call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  castTo<T>(): UpdateQueryBuilder<DB, TB, T> {
    return new UpdateQueryBuilder(this.#props)
  }

  withPlugin(plugin: KyselyPlugin): UpdateQueryBuilder<DB, TB, O> {
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
    const query = compildQuery.query as UpdateQueryNode

    const result = await this.#props.executor.executeQuery<O>(
      compildQuery,
      this.#props.queryId
    )

    if (this.#props.parseContext.adapter.supportsReturning && query.returning) {
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
}

preventAwait(
  UpdateQueryBuilder,
  "don't await UpdateQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface UpdateQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: UpdateQueryNode
  readonly executor: QueryExecutor
  readonly parseContext: ParseContext
}
