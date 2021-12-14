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
import { preventAwait } from '../util/prevent-await.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { ParseContext } from '../parser/parse-context.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { WhereInterface } from './where-interface.js'
import { JoinInterface } from './join-interface.js'
import { ReturningInterface } from './returning-interface.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import { DeleteResult } from './delete-result.js'
import { DeleteQueryNode } from '../index.js'

export class DeleteQueryBuilder<DB, TB extends keyof DB, O>
  implements
    WhereInterface<DB, TB>,
    JoinInterface<DB, TB>,
    ReturningInterface<DB, TB, O>,
    OperationNodeSource,
    Compilable
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
  where(raw: AnyRawBuilder): DeleteQueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O>

  orWhere(grouper: WhereGrouper<DB, TB>): DeleteQueryBuilder<DB, TB, O>
  orWhere(raw: AnyRawBuilder): DeleteQueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  whereExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  whereNotExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(
        this.#props.queryNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  orWhereExists(arg: ExistsExpression<DB, TB>): DeleteQueryBuilder<DB, TB, O> {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrWhere(
        this.#props.queryNode,
        parseExistFilter(this.#props.parseContext, arg)
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
  ): DeleteQueryBuilder<
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
  ): DeleteQueryBuilder<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  innerJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<
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
  ): DeleteQueryBuilder<
    LeftJoinTableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  leftJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<
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
  ): DeleteQueryBuilder<
    RightJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  rightJoin(...args: any): any {
    return new DeleteQueryBuilder({
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
  ): DeleteQueryBuilder<
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
  ): DeleteQueryBuilder<
    FullJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>,
    O
  >

  fullJoin(...args: any): any {
    return new DeleteQueryBuilder({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(
        this.#props.queryNode,
        parseJoin(this.#props.parseContext, 'FullJoin', args)
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
        parseSelectExpressionOrList(this.#props.parseContext, selection)
      ),
    })
  }

  returningAll(): DeleteQueryBuilder<DB, TB, DB[TB]> {
    return new DeleteQueryBuilder({
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
   * db.deleteFrom('person')
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
  castTo<T>(): DeleteQueryBuilder<DB, TB, T> {
    return new DeleteQueryBuilder(this.#props)
  }

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
    const compildQuery = this.compile()
    const query = compildQuery.query as DeleteQueryNode

    const result = await this.#props.executor.executeQuery<O>(
      compildQuery,
      this.#props.queryId
    )

    if (this.#props.parseContext.adapter.supportsReturning && query.returning) {
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
}

preventAwait(
  DeleteQueryBuilder,
  "don't await DeleteQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface DeleteQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: DeleteQueryNode
  readonly executor: QueryExecutor
  readonly parseContext: ParseContext
}
