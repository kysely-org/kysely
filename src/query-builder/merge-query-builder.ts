import {
  ExpressionBuilder,
  createExpressionBuilder,
} from '../expression/expression-builder.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MergeQueryNode } from '../operation-node/merge-query-node'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { QueryNode } from '../operation-node/query-node.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import {
  JoinCallbackExpression,
  JoinReferenceExpression,
  parseJoin,
} from '../parser/join-parser.js'
import { parseMergeThen, parseMergeWhen } from '../parser/merge-parser.js'
import { TableExpression } from '../parser/table-parser.js'
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

export class MergeQueryBuilder<DB, IT extends keyof DB, O> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  using<
    TE extends TableExpression<DB, IT>,
    K1 extends JoinReferenceExpression<DB, IT, TE>,
    K2 extends JoinReferenceExpression<DB, IT, TE>
  >(table: TE, k1: K1, k2: K2): ExtractWheneableMergeQueryBuilder<DB, IT, TE, O>

  using<
    TE extends TableExpression<DB, IT>,
    FN extends JoinCallbackExpression<DB, IT, TE>
  >(table: TE, callback: FN): ExtractWheneableMergeQueryBuilder<DB, IT, TE, O>

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
  IT extends keyof DB,
  UT extends keyof DB,
  O
> implements Compilable<O>, OperationNodeSource
{
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  whenMatched(
    and?: (eb: ExpressionBuilder<DB, IT | UT>) => Expression<SqlBool>
  ): MatchedMergeQueryBuilder<DB, IT, UT, O> {
    return new MatchedMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen(true, and?.(createExpressionBuilder()))
      ),
    })
  }

  whenNotMatched(
    and?: (eb: ExpressionBuilder<DB, IT | UT>) => Expression<SqlBool>
  ): NotMatchedMergeQueryBuilder<DB, IT, UT, O> {
    return new NotMatchedMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen(false, and?.(createExpressionBuilder()))
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
    ? WheneableMergeQueryBuilder<DB, IT, UT, MergeResult>
    : O2 extends O & infer E
    ? WheneableMergeQueryBuilder<DB, IT, UT, O & Partial<E>>
    : WheneableMergeQueryBuilder<DB, IT, UT, Partial<O2>> {
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

export class MatchedMergeQueryBuilder<
  DB,
  IT extends keyof DB,
  UT extends keyof DB,
  O
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  thenDelete(): WheneableMergeQueryBuilder<DB, IT, UT, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('delete')
      ),
    })
  }

  thenDoNothing(): WheneableMergeQueryBuilder<DB, IT, UT, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('do nothing')
      ),
    })
  }

  thenUpdate(
    set: (
      ub: UpdateQueryBuilder<DB, IT, UT, never>
    ) => UpdateQueryBuilder<DB, IT, UT, never>
  ): WheneableMergeQueryBuilder<DB, IT, UT, O> {
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
}

export class NotMatchedMergeQueryBuilder<
  DB,
  IT extends keyof DB,
  UT extends keyof DB,
  O
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  thenDoNothing(): WheneableMergeQueryBuilder<DB, IT, UT, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('do nothing')
      ),
    })
  }

  thenInsert(
    values: (
      ib: InsertQueryBuilder<DB, IT, UT, never>
    ) => InsertQueryBuilder<DB, IT, UT, never>
  ): WheneableMergeQueryBuilder<DB, IT, UT, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen(
          values(
            new InsertQueryBuilder({
              queryId: this.#props.queryId,
              executor: NOOP_QUERY_EXECUTOR,
              queryNode: InsertQueryNode.createWithoutInto(),
            })
          )
        )
      ),
    })
  }
}

export type ExtractWheneableMergeQueryBuilder<
  DB,
  IT extends keyof DB,
  TE extends TableExpression<DB, IT>,
  O
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? UsingBuilder<DB, IT, A, DB[T], O>
    : never
  : TE extends keyof DB
  ? WheneableMergeQueryBuilder<DB, IT, TE, O>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, IT, QA, QO, O>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, IT, QA, QO, O>
  : never

type UsingBuilder<
  DB,
  IT extends keyof DB,
  A extends string,
  R,
  O
> = A extends keyof DB
  ? WheneableMergeQueryBuilder<DB, IT, A, O>
  : WheneableMergeQueryBuilder<DB & ShallowRecord<A, R>, IT, A, O>
