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

export class MergeQueryBuilder<DB, MT extends keyof DB, O> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  using<
    TE extends TableExpression<DB, MT>,
    K1 extends JoinReferenceExpression<DB, MT, TE>,
    K2 extends JoinReferenceExpression<DB, MT, TE>
  >(table: TE, k1: K1, k2: K2): ExtractWheneableMergeQueryBuilder<DB, MT, TE, O>

  using<
    TE extends TableExpression<DB, MT>,
    FN extends JoinCallbackExpression<DB, MT, TE>
  >(table: TE, callback: FN): ExtractWheneableMergeQueryBuilder<DB, MT, TE, O>

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
  MT extends keyof DB,
  UT extends keyof DB,
  O
> implements Compilable<O>, OperationNodeSource
{
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * TODO: ...
   */
  whenMatched(
    and?: (eb: ExpressionBuilder<DB, MT | UT>) => Expression<SqlBool>
  ): MatchedMergeQueryBuilder<DB, MT, UT, O> {
    return new MatchedMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithWhen(
        this.#props.queryNode,
        parseMergeWhen(true, and?.(createExpressionBuilder()))
      ),
    })
  }

  /**
   * TODO: ...
   */
  whenNotMatched(
    and?: (eb: ExpressionBuilder<DB, MT | UT>) => Expression<SqlBool>
  ): NotMatchedMergeQueryBuilder<DB, MT, UT, O> {
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
    ? WheneableMergeQueryBuilder<DB, MT, UT, MergeResult>
    : O2 extends O & infer E
    ? WheneableMergeQueryBuilder<DB, MT, UT, O & Partial<E>>
    : WheneableMergeQueryBuilder<DB, MT, UT, Partial<O2>> {
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
  MT extends keyof DB,
  UT extends keyof DB,
  O
> {
  readonly #props: MergeQueryBuilderProps

  constructor(props: MergeQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Performs the `delete` action.
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
  thenDelete(): WheneableMergeQueryBuilder<DB, MT, UT, O> {
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
  thenDoNothing(): WheneableMergeQueryBuilder<DB, MT, UT, O> {
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
      ub: UpdateQueryBuilder<DB, MT, UT, never>
    ) => UpdateQueryBuilder<DB, MT, UT, never>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O> {
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
    update: UpdateObject<DB, UT, MT>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O>

  thenUpdateSet(
    update: UpdateObjectFactory<DB, UT, MT>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O>

  thenUpdateSet<RE extends ReferenceExpression<DB, MT>>(
    key: RE,
    value: ValueExpression<
      DB,
      UT,
      ExtractUpdateTypeFromReferenceExpression<DB, MT, RE>
    >
  ): WheneableMergeQueryBuilder<DB, MT, UT, O>

  thenUpdateSet(...args: any[]): any {
    // @ts-ignore not sure how to type this so it won't complain about set(...args).
    return this.thenUpdate((ub) => ub.set(...args))
  }
}

export class NotMatchedMergeQueryBuilder<
  DB,
  MT extends keyof DB,
  UT extends keyof DB,
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
  thenDoNothing(): WheneableMergeQueryBuilder<DB, MT, UT, O> {
    return new WheneableMergeQueryBuilder({
      ...this.#props,
      queryNode: MergeQueryNode.cloneWithThen(
        this.#props.queryNode,
        parseMergeThen('do nothing')
      ),
    })
  }

  /**
   * Performs an `insert (...) values` action, similar to {@link InsertQueryBuilder.values}.
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
    insert: InsertObjectOrList<DB, MT>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O>

  thenInsertValues(
    insert: InsertObjectOrListFactory<DB, MT, UT>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O>

  thenInsertValues(
    insert: InsertExpression<DB, MT, UT>
  ): WheneableMergeQueryBuilder<DB, MT, UT, O> {
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
