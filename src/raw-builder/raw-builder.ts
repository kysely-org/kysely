import { QueryResult } from '../driver/database-connection.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze } from '../util/object-utils.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { QueryExecutorProvider } from '../query-executor/query-executor-provider.js'
import { QueryId } from '../util/query-id.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import {
  AliasableExpression,
  AliasedExpression,
  Expression,
} from '../expression/expression.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'

/**
 * An instance of this class can be used to create raw SQL snippets or queries.
 *
 * You shouldn't need to create `RawBuilder` instances directly. Instead you should
 * use the {@link sql} template tag.
 */
export interface RawBuilder<O> extends AliasableExpression<O> {
  /**
   * @private Without this SelectQueryBuilder extends RawBuilder and things break.
   */
  get isRawBuilder(): true

  /**
   * Returns an aliased version of the SQL expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `full_name: string` field exists in the result type.
   * console.log(result.full_name)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select concat(first_name, ' ', last_name) as "full_name"
   * from "person"
   * ```
   *
   * You can also pass in a raw SQL snippet but in that case you must
   * provide the alias as the only type argument:
   *
   * ```ts
   * const values = sql<{ a: number, b: string }>`(values (1, 'foo'))`
   *
   * // The alias is `t(a, b)` which specifies the column names
   * // in addition to the table name. We must tell kysely that
   * // columns of the table can be referenced through `t`
   * // by providing an explicit type argument.
   * const aliasedValues = values.as<'t'>(sql`t(a, b)`)
   *
   * await db
   *   .insertInto('person')
   *   .columns(['first_name', 'last_name'])
   *   .expression(
   *     db.selectFrom(aliasedValues).select(['t.a', 't.b'])
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * insert into "person" ("first_name", "last_name")
   * from (values (1, 'foo')) as t(a, b)
   * select "t"."a", "t"."b"
   * ```
   */
  as<A extends string>(alias: A): AliasedRawBuilder<O, A>
  as<A extends string>(alias: Expression<any>): AliasedRawBuilder<O, A>

  /**
   * Change the output type of the raw expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `RawBuilder` with a new output type.
   */
  $castTo<T>(): RawBuilder<T>

  /**
   * Adds a plugin for this SQL snippet.
   */
  withPlugin(plugin: KyselyPlugin): RawBuilder<O>

  /**
   * Compiles the builder to a `CompiledQuery`.
   *
   * ### Examples
   *
   * ```ts
   * const { sql } = sql`select * from ${sql.table('person')}`.compile(db)
   * console.log(sql)
   * ```
   */
  compile(executorProvider: QueryExecutorProvider): CompiledQuery<O>

  /**
   * Executes the raw query.
   *
   * ### Examples
   *
   * ```ts
   * const result = await sql`select * from ${sql.table('person')}`.execute(db)
   * ```
   */
  execute(executorProvider: QueryExecutorProvider): Promise<QueryResult<O>>

  toOperationNode(): RawNode
}

class RawBuilderImpl<O> implements RawBuilder<O> {
  readonly #props: RawBuilderProps

  constructor(props: RawBuilderProps) {
    this.#props = freeze(props)
  }

  get expressionType(): O | undefined {
    return undefined
  }

  get isRawBuilder(): true {
    return true
  }

  as(alias: string | Expression<unknown>): AliasedRawBuilder<O, string> {
    return new AliasedRawBuilderImpl(this, alias)
  }

  $castTo<T>(): RawBuilder<T> {
    return new RawBuilderImpl({ ...this.#props })
  }

  withPlugin(plugin: KyselyPlugin): RawBuilder<O> {
    return new RawBuilderImpl({
      ...this.#props,
      plugins:
        this.#props.plugins !== undefined
          ? freeze([...this.#props.plugins, plugin])
          : freeze([plugin]),
    })
  }

  toOperationNode(): RawNode {
    return this.#toOperationNode(this.#getExecutor())
  }

  compile(executorProvider: QueryExecutorProvider): CompiledQuery<O> {
    return this.#compile(this.#getExecutor(executorProvider))
  }

  async execute(
    executorProvider: QueryExecutorProvider
  ): Promise<QueryResult<O>> {
    const executor = this.#getExecutor(executorProvider)

    return executor.executeQuery<O>(
      this.#compile(executor),
      this.#props.queryId
    )
  }

  #getExecutor(executorProvider?: QueryExecutorProvider): QueryExecutor {
    const executor =
      executorProvider !== undefined
        ? executorProvider.getExecutor()
        : NOOP_QUERY_EXECUTOR

    return this.#props.plugins !== undefined
      ? executor.withPlugins(this.#props.plugins)
      : executor
  }

  #toOperationNode(executor: QueryExecutor): RawNode {
    return executor.transformQuery(this.#props.rawNode, this.#props.queryId)
  }

  #compile(executor: QueryExecutor): CompiledQuery {
    return executor.compileQuery(
      this.#toOperationNode(executor),
      this.#props.queryId
    )
  }
}

export interface RawBuilderProps {
  readonly queryId: QueryId
  readonly rawNode: RawNode
  readonly plugins?: ReadonlyArray<KyselyPlugin>
}

export function createRawBuilder<O>(props: RawBuilderProps): RawBuilder<O> {
  return new RawBuilderImpl(props)
}

preventAwait(
  RawBuilderImpl,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

/**
 * {@link RawBuilder} with an alias. The result of calling {@link RawBuilder.as}.
 */
export interface AliasedRawBuilder<O = unknown, A extends string = never>
  extends AliasedExpression<O, A> {
  get rawBuilder(): RawBuilder<O>
}

class AliasedRawBuilderImpl<O = unknown, A extends string = never>
  implements AliasedRawBuilder<O, A>
{
  readonly #rawBuilder: RawBuilder<O>
  readonly #alias: A | Expression<unknown>

  constructor(rawBuilder: RawBuilder<O>, alias: A | Expression<unknown>) {
    this.#rawBuilder = rawBuilder
    this.#alias = alias
  }

  get expression(): Expression<O> {
    return this.#rawBuilder
  }

  get alias(): A | Expression<unknown> {
    return this.#alias
  }

  get rawBuilder(): RawBuilder<O> {
    return this.#rawBuilder
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#rawBuilder.toOperationNode(),
      isOperationNodeSource(this.#alias)
        ? this.#alias.toOperationNode()
        : IdentifierNode.create(this.#alias)
    )
  }
}

preventAwait(
  AliasedRawBuilderImpl,
  "don't await AliasedRawBuilder instances directly. AliasedRawBuilder should never be executed directly since it's always a part of another query."
)
