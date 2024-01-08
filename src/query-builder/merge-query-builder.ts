import { AliasedExpression } from '../expression/expression.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MergeQueryNode } from '../operation-node/merge-query-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { QueryNode } from '../operation-node/query-node.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import {
  InsertExpression,
  InsertObjectOrList,
  InsertObjectOrListFactory,
  parseInsertExpression,
} from '../parser/insert-values-parser.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import { parseMergeThen, parseMergeWhen } from '../parser/merge-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { TableExpression } from '../parser/table-parser.js'
import {
  ExtractUpdateTypeFromReferenceExpression,
  UpdateObject,
  UpdateObjectFactory,
} from '../parser/update-set-parser.js'
import { ValueExpression } from '../parser/value-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryId } from '../util/query-id.js'
import {
  ShallowRecord,
  SimplifyResult,
  SimplifySingleResult,
  SqlBool,
} from '../util/type-utils.js'
import { InsertQueryBuilder } from './insert-query-builder.js'
import { MergeResult } from './merge-result.js'
import {
  NoResultError,
  NoResultErrorConstructor,
  isNoResultErrorConstructor,
} from './no-result-error.js'
import { UpdateQueryBuilder } from './update-query-builder.js'

export class MergeQueryBuilder<DB, TT extends keyof DB, O> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the `using` clause to the query.
   *
   * This method is similar to {@link SelectQueryBuilder.innerJoin}, so see the
   * documentation for that method for more examples.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenDelete()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   delete
   * ```
   */
  using<
    TE extends TableExpression<DB, TT>,
    K1 extends JoinReferenceExpression<DB, TT, TE>,
    K2 extends JoinReferenceExpression<DB, TT, TE>
  >(
    sourceTable: TE,
    k1: K1,
    k2: K2
  ): ExtractWheneableMergeQueryBuilder<DB, TT, TE, O>

  using<
    TE extends TableExpression<DB, TT>,
    FN extends JoinCallbackExpression<DB, TT, TE>
  >(
    sourceTable: TE,
    callback: FN
  ): ExtractWheneableMergeQueryBuilder<DB, TT, TE, O>

  using(...args: any): any {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithUsing(
        this.#props.queryNode,
        parseJoin('Using', args)
      ),
    })
  }
}

preventAwait(
  MergeQueryBuilder,
  "don't await MergeQueryBuilder instances directly. To execute the query you need to call `execute` when available."
)

export interface MergeQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: MergeQueryNode
  readonly executor: QueryExecutor
}

export class WheneableMergeQueryBuilder<
  DB,
  TT extends keyof DB,
  ST extends keyof DB,
  O
> implements Compilable<O>, OperationNodeSource
{
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds a simple `when matched` clause to the query.
   *
   * For a `when matched` clause with an `and` condition, see {@link whenMatchedAnd}.
   *
   * For a simple `when not matched` clause, see {@link whenNotMatched}.
   *
   * For a `when not matched` clause with an `and` condition, see {@link whenNotMatchedAnd}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenDelete()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   delete
   * ```
   */
  whenMatched(): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O> {
    return this.#whenMatched([])
  }

  /**
   * Adds the `when matched` clause to the query with an `and` condition.
   *
   * This method is similar to {@link SelectQueryBuilder.where}, so see the documentation
   * for that method for more examples.
   *
   * For a simple `when matched` clause (without an `and` condition) see {@link whenMatched}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatchedAnd('person.first_name', '=', 'John')
   *   .thenDelete()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched and "person"."first_name" = $1 then
   *   delete
   * ```
   */
  whenMatchedAnd<
    RE extends ReferenceExpression<DB, TT | ST>,
    VE extends OperandValueExpressionOrList<DB, TT | ST, RE>
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: VE
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O>

  whenMatchedAnd(
    expression: ExpressionOrFactory<DB, TT | ST, SqlBool>
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O>

  whenMatchedAnd(
    ...args: any[]
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O> {
    return this.#whenMatched(args)
  }

  /**
   * Adds the `when matched` clause to the query with an `and` condition. But unlike
   * {@link whenMatchedAnd}, this method accepts a column reference as the 3rd argument.
   *
   * This method is similar to {@link SelectQueryBuilder.whereRef}, so see the documentation
   * for that method for more examples.
   */
  whenMatchedAndRef(
    lhs: ReferenceExpression<DB, TT | ST>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TT | ST>
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O> {
    return this.#whenMatched([lhs, op, rhs], true)
  }

  #whenMatched(
    args: any[],
    refRight?: boolean
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT | ST, O> {
    return new MatchedThenableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen({ isMatched: true }, args, refRight)
      ),
    })
  }

  /**
   * Adds a simple `when not matched` clause to the query.
   *
   * For a `when not matched` clause with an `and` condition, see {@link whenNotMatchedAnd}.
   *
   * For a simple `when matched` clause, see {@link whenMatched}.
   *
   * For a `when matched` clause with an `and` condition, see {@link whenMatchedAnd}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenNotMatched()
   *   .thenInsertValues({
   *     first_name: 'John',
   *     last_name: 'Doe',
   *   })
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when not matched then
   *   insert ("first_name", "last_name") values ($1, $2)
   * ```
   */
  whenNotMatched(): NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O> {
    return this.#whenNotMatched([])
  }

  /**
   * Adds the `when not matched` clause to the query with an `and` condition.
   *
   * This method is similar to {@link SelectQueryBuilder.where}, so see the documentation
   * for that method for more examples.
   *
   * For a simple `when not matched` clause (without an `and` condition) see {@link whenNotMatched}.
   *
   * Unlike {@link whenMatchedAnd}, you cannot reference columns from the table merged into.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenNotMatchedAnd('pet.name', '=', 'Lucky')
   *   .thenInsertValues({
   *     first_name: 'John',
   *     last_name: 'Doe',
   *   })
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when not matched and "pet"."name" = $1 then
   *   insert ("first_name", "last_name") values ($2, $3)
   * ```
   */
  whenNotMatchedAnd<RE extends ReferenceExpression<DB, ST>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, ST, RE>
  ): NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O>

  whenNotMatchedAnd(
    expression: ExpressionOrFactory<DB, ST, SqlBool>
  ): NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O>

  whenNotMatchedAnd(
    ...args: any[]
  ): NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O> {
    return this.#whenNotMatched(args)
  }

  /**
   * Adds the `when not matched` clause to the query with an `and` condition. But unlike
   * {@link whenNotMatchedAnd}, this method accepts a column reference as the 3rd argument.
   *
   * Unlike {@link whenMatchedAndRef}, you cannot reference columns from the target table.
   *
   * This method is similar to {@link SelectQueryBuilder.whereRef}, so see the documentation
   * for that method for more examples.
   */
  whenNotMatchedAndRef(
    lhs: ReferenceExpression<DB, ST>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, ST>
  ): NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O> {
    return this.#whenNotMatched([lhs, op, rhs], true)
  }

  /**
   * Adds a simple `when not matched by source` clause to the query.
   *
   * Supported in MS SQL Server.
   *
   * Similar to {@link whenNotMatched}, but returns a {@link MatchedThenableMergeQueryBuilder}.
   */
  whenNotMatchedBySource(): MatchedThenableMergeQueryBuilder<
    DB,
    TT,
    ST,
    TT,
    O
  > {
    return this.#whenNotMatched([], false, true)
  }

  /**
   * Adds the `when not matched by source` clause to the query with an `and` condition.
   *
   * Supported in MS SQL Server.
   *
   * Similar to {@link whenNotMatchedAnd}, but returns a {@link MatchedThenableMergeQueryBuilder}.
   */
  whenNotMatchedBySourceAnd<RE extends ReferenceExpression<DB, TT>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TT, RE>
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT, O>

  whenNotMatchedBySourceAnd(
    expression: ExpressionOrFactory<DB, TT, SqlBool>
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT, O>

  whenNotMatchedBySourceAnd(
    ...args: any[]
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT, O> {
    return this.#whenNotMatched(args, false, true)
  }

  /**
   * Adds the `when not matched by source` clause to the query with an `and` condition.
   *
   * Similar to {@link whenNotMatchedAndRef}, but you can reference columns from
   * the target table, and not from source table and returns a {@link MatchedThenableMergeQueryBuilder}.
   */
  whenNotMatchedBySourceAndRef(
    lhs: ReferenceExpression<DB, TT>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TT>
  ): MatchedThenableMergeQueryBuilder<DB, TT, ST, TT, O> {
    return this.#whenNotMatched([lhs, op, rhs], true, true)
  }

  #whenNotMatched(
    args: any[],
    refRight: boolean = false,
    bySource: boolean = false
  ): any {
    const props: MergeQueryBuilderProps = {
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen({ isMatched: false, bySource }, args, refRight)
      ),
    }

    const Builder: any = bySource
      ? MatchedThenableMergeQueryBuilder
      : NotMatchedThenableMergeQueryBuilder

    return new Builder(props)
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
    func: (qb: this) => WheneableMergeQueryBuilder<any, any, any, O2>
  ): O2 extends MergeResult
    ? WheneableMergeQueryBuilder<DB, TT, ST, MergeResult>
    : O2 extends O & infer E
    ? WheneableMergeQueryBuilder<DB, TT, ST, O & Partial<E>>
    : WheneableMergeQueryBuilder<DB, TT, ST, Partial<O2>> {
    if (condition) {
      return func(this) as any
    }

    return new WheneableMergeQueryBuilder({
      ...this.#props,
    }) as any
  }

  toOperationNode(): MergeQueryNode {
    return this.#props.executor.transformQuery(
      this.#props.queryNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery<never> {
    return this.#props.executor.compileQuery(
      this.#props.queryNode,
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

    const result = await this.#props.executor.executeQuery<O>(
      compiledQuery,
      this.#props.queryId
    )

    return [new MergeResult(result.numAffectedRows) as any]
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
}

preventAwait(
  WheneableMergeQueryBuilder,
  "don't await WheneableMergeQueryBuilder instances directly. To execute the query you need to call `execute`."
)

export class MatchedThenableMergeQueryBuilder<
  DB,
  TT extends keyof DB,
  ST extends keyof DB,
  UT extends TT | ST,
  O
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Performs the `delete` action.
   *
   * To perform the `do nothing` action, see {@link thenDoNothing}.
   *
   * To perform the `update` action, see {@link thenUpdate} or {@link thenUpdateSet}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenDelete()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   delete
   * ```
   */
  thenDelete(): WheneableMergeQueryBuilder<DB, TT, ST, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('delete')
      ),
    })
  }

  /**
   * Performs the `do nothing` action.
   *
   * This is supported in PostgreSQL.
   *
   * To perform the `delete` action, see {@link thenDelete}.
   *
   * To perform the `update` action, see {@link thenUpdate} or {@link thenUpdateSet}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenDoNothing()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   do nothing
   * ```
   */
  thenDoNothing(): WheneableMergeQueryBuilder<DB, TT, ST, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('do nothing')
      ),
    })
  }

  /**
   * Perform an `update` operation with a full-fledged {@link UpdateQueryBuilder}.
   * This is handy when multiple `set` invocations are needed.
   *
   * For a shorthand version of this method, see {@link thenUpdateSet}.
   *
   * To perform the `delete` action, see {@link thenDelete}.
   *
   * To perform the `do nothing` action, see {@link thenDoNothing}.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenUpdate((ub) => ub
   *     .set(sql`metadata['has_pets']`, 'Y')
   *     .set({
   *       updated_at: Date.now(),
   *     })
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   update set metadata['has_pets'] = $1, "updated_at" = $2
   * ```
   */
  thenUpdate(
    set: (
      ub: UpdateQueryBuilder<DB, TT, UT, never>
    ) => UpdateQueryBuilder<DB, TT, UT, never>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen(
          set(
            new UpdateQueryBuilder({
              queryId: this.#props.queryId,
              executor: NOOP_QUERY_EXECUTOR,
              queryNode: UpdateQueryNode.createWithoutTable(),
            })
          )
        )
      ),
    })
  }

  /**
   * Performs an `update set` action, similar to {@link UpdateQueryBuilder.set}.
   *
   * For a full-fledged update query builder, see {@link thenUpdate}.
   *
   * To perform the `delete` action, see {@link thenDelete}.
   *
   * To perform the `do nothing` action, see {@link thenDoNothing}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenMatched()
   *   .thenUpdateSet({
   *     middle_name: 'dog owner',
   *   })
   *   .execute()
   * ```
   *
   * The generate SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when matched then
   *   update set "middle_name" = $1
   * ```
   */
  thenUpdateSet(
    update: UpdateObject<DB, UT, TT>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O>

  thenUpdateSet(
    update: UpdateObjectFactory<DB, UT, TT>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O>

  thenUpdateSet<RE extends ReferenceExpression<DB, TT>>(
    key: RE,
    value: ValueExpression<
      DB,
      UT,
      ExtractUpdateTypeFromReferenceExpression<DB, TT, RE>
    >
  ): WheneableMergeQueryBuilder<DB, TT, ST, O>

  thenUpdateSet(...args: any[]): any {
    // @ts-ignore not sure how to type this so it won't complain about set(...args).
    return this.thenUpdate((ub) => ub.set(...args))
  }
}

preventAwait(
  MatchedThenableMergeQueryBuilder,
  "don't await MatchedThenableMergeQueryBuilder instances directly. To execute the query you need to call `execute` when available."
)

export class NotMatchedThenableMergeQueryBuilder<
  DB,
  TT extends keyof DB,
  ST extends keyof DB,
  O
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Performs the `do nothing` action.
   *
   * This is supported in PostgreSQL.
   *
   * To perform the `insert` action, see {@link thenInsertValues}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenNotMatched()
   *   .thenDoNothing()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when not matched then
   *   do nothing
   * ```
   */
  thenDoNothing(): WheneableMergeQueryBuilder<DB, TT, ST, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('do nothing')
      ),
    })
  }

  /**
   * Performs the `insert (...) values` action.
   *
   * This method is similar to {@link InsertQueryBuilder.values}, so see the documentation
   * for that method for more examples.
   *
   * To perform the `do nothing` action, see {@link thenDoNothing}.
   *
   * ### Examples
   *
   * ```ts
   * const result = await db.mergeInto('person')
   *   .using('pet', 'person.id', 'pet.owner_id')
   *   .whenNotMatched()
   *   .thenInsertValues({
   *     first_name: 'John',
   *     last_name: 'Doe',
   *   })
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * merge into "person"
   * using "pet" on "person"."id" = "pet"."owner_id"
   * when not matched then
   *   insert ("first_name", "last_name") values ($1, $2)
   * ```
   */
  thenInsertValues(
    insert: InsertObjectOrList<DB, TT>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O>

  thenInsertValues(
    insert: InsertObjectOrListFactory<DB, TT, ST>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O>

  thenInsertValues(
    insert: InsertExpression<DB, TT, ST>
  ): WheneableMergeQueryBuilder<DB, TT, ST, O> {
    const [columns, values] = parseInsertExpression(insert)

    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen(
          InsertQueryNode.cloneWith(InsertQueryNode.createWithoutInto(), {
            columns,
            values,
          })
        )
      ),
    })
  }
}

preventAwait(
  NotMatchedThenableMergeQueryBuilder,
  "don't await NotMatchedThenableMergeQueryBuilder instances directly. To execute the query you need to call `execute` when available."
)

export type ExtractWheneableMergeQueryBuilder<
  DB,
  TT extends keyof DB,
  TE extends TableExpression<DB, TT>,
  O
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? UsingBuilder<DB, TT, A, DB[T], O>
    : never
  : TE extends keyof DB
  ? WheneableMergeQueryBuilder<DB, TT, TE, O>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, TT, QA, QO, O>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, TT, QA, QO, O>
  : never

type UsingBuilder<
  DB,
  TT extends keyof DB,
  A extends string,
  R,
  O
> = A extends keyof DB
  ? WheneableMergeQueryBuilder<DB, TT, A, O>
  : WheneableMergeQueryBuilder<DB & ShallowRecord<A, R>, TT, A, O>
