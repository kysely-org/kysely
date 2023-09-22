import {
  ExpressionBuilder,
  createExpressionBuilder,
} from '../expression/expression-builder.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MergeQueryNode } from '../operation-node/merge-query-node'
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
import { ShallowRecord, SqlBool } from '../util/type-utils.js'
import { InsertQueryBuilder } from './insert-query-builder.js'
import { UpdateQueryBuilder } from './update-query-builder.js'

export class MergeQueryBuilder<DB, IT extends keyof DB> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  using<
    TE extends TableExpression<DB, IT>,
    K1 extends JoinReferenceExpression<DB, IT, TE>,
    K2 extends JoinReferenceExpression<DB, IT, TE>
  >(table: TE, k1: K1, k2: K2): ExtractWheneableMergeQueryBuilder<DB, IT, TE>

  using<
    TE extends TableExpression<DB, IT>,
    FN extends JoinCallbackExpression<DB, IT, TE>
  >(table: TE, callback: FN): ExtractWheneableMergeQueryBuilder<DB, IT, TE>

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
  UT extends keyof DB
> implements Compilable<never>
{
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  whenMatched(
    and?: (eb: ExpressionBuilder<DB, IT | UT>) => Expression<SqlBool>
  ): MatchedMergeQueryBuilder<DB, IT, UT> {
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
  ): NotMatchedMergeQueryBuilder<DB, IT, UT> {
    return new NotMatchedMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen(false, and?.(createExpressionBuilder()))
      ),
    })
  }

  compile(): CompiledQuery<never> {
    return this.#props.executor.compileQuery(
      this.#props.queryNode,
      this.#props.queryId
    )
  }
}

export class MatchedMergeQueryBuilder<
  DB,
  IT extends keyof DB,
  UT extends keyof DB
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  thenDelete(): WheneableMergeQueryBuilder<DB, IT, UT> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('delete')
      ),
    })
  }

  thenDoNothing(): WheneableMergeQueryBuilder<DB, IT, UT> {
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
  ): WheneableMergeQueryBuilder<DB, IT, UT> {
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
  UT extends keyof DB
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  thenDoNothing(): WheneableMergeQueryBuilder<DB, IT, UT> {
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
  ): WheneableMergeQueryBuilder<DB, IT, UT> {
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
  TE extends TableExpression<DB, IT>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? UsingBuilder<DB, IT, A, DB[T]>
    : never
  : TE extends keyof DB
  ? WheneableMergeQueryBuilder<DB, IT, TE>
  : TE extends AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, IT, QA, QO>
  : TE extends (qb: any) => AliasedExpression<infer QO, infer QA>
  ? UsingBuilder<DB, IT, QA, QO>
  : never

type UsingBuilder<
  DB,
  IT extends keyof DB,
  A extends string,
  R
> = A extends keyof DB
  ? WheneableMergeQueryBuilder<DB, IT, A>
  : WheneableMergeQueryBuilder<DB & ShallowRecord<A, R>, IT, A>
