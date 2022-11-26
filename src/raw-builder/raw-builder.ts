import { QueryResult } from '../driver/database-connection.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze, isFunction, isObject } from '../util/object-utils.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { QueryExecutorProvider } from '../query-executor/query-executor-provider.js'
import { QueryId } from '../util/query-id.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { SingleResultType } from '../util/type-utils.js'
import { InsertResult } from '../query-builder/insert-result.js'
import {
  NoResultError,
  NoResultErrorConstructor,
} from '../query-builder/no-result-error.js'

/**
 * An instance of this class can be used to create raw SQL snippets or queries.
 *
 * You shouldn't need to create `RawBuilder` instances directly. Instead you should
 * use the {@link sql} template tag.
 */
export class RawBuilder<O> implements Expression<O> {
  readonly #props: RawBuilderProps

  constructor(props: RawBuilderProps) {
    this.#props = freeze(props)
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

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
  as<A extends string = never>(alias: Expression<any>): AliasedRawBuilder<O, A>
  as(alias: string | Expression<any>): AliasedRawBuilder<O, string> {
    return new AliasedRawBuilder(this, alias)
  }

  /**
   * Change the output type of the raw expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `RawBuilder` with a new output type.
   */
  castTo<T>(): RawBuilder<T> {
    return new RawBuilder({ ...this.#props })
  }

  /**
   * Adds a plugin for this SQL snippet.
   */
  withPlugin(plugin: KyselyPlugin): RawBuilder<O> {
    return new RawBuilder({
      ...this.#props,
      plugins:
        this.#props.plugins !== undefined
          ? freeze([...this.#props.plugins, plugin])
          : freeze([plugin]),
    })
  }

  toOperationNode(): RawNode {
    const executor =
      this.#props.plugins !== undefined
        ? NOOP_QUERY_EXECUTOR.withPlugins(this.#props.plugins)
        : NOOP_QUERY_EXECUTOR

    return this.#toOperationNode(executor)
  }

  async execute(
    executorProvider: QueryExecutorProvider
  ): Promise<QueryResult<O>> {
    const executor =
      this.#props.plugins !== undefined
        ? executorProvider.getExecutor().withPlugins(this.#props.plugins)
        : executorProvider.getExecutor()

    return executor.executeQuery<O>(
      this.#compile(executor),
      this.#props.queryId
    )
  }

  /**
   * Executes the query and returns the first result row or undefined if the query
   * returned no rows.
   */
  async executeTakeFirstRow(
    executorProvider: QueryExecutorProvider
  ): Promise<O | undefined> {
    const result = await this.execute(executorProvider)

    return result.rows[0]
  }

  /**
   * Executes the query and returns the first result row or throws if
   * the query returned no rows.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class as the second argument to throw a different
   * error.
   */
  async executeTakeFirstRowOrThrow(
    executorProvider: QueryExecutorProvider,
    errorConstructor: NoResultErrorConstructor = NoResultError
  ): Promise<O> {
    const result = await this.executeTakeFirstRow(executorProvider)

    if (result === undefined) {
      throw new errorConstructor(this.toOperationNode())
    }

    return result
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

export function isRawBuilder(obj: unknown): obj is RawBuilder<unknown> {
  return (
    isObject(obj) &&
    isFunction(obj.as) &&
    isFunction(obj.castTo) &&
    isFunction(obj.withPlugin) &&
    isFunction(obj.toOperationNode) &&
    isFunction(obj.execute)
  )
}

preventAwait(
  RawBuilder,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

/**
 * {@link RawBuilder} with an alias. The result of calling {@link RawBuilder.as}.
 */
export class AliasedRawBuilder<O = unknown, A extends string = never>
  implements AliasedExpression<O, A>
{
  readonly #rawBuilder: RawBuilder<O>
  readonly #alias: A | Expression<any>

  constructor(rawBuilder: RawBuilder<O>, alias: A | Expression<any>) {
    this.#rawBuilder = rawBuilder
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<O> {
    return this.#rawBuilder
  }

  /** @private */
  get alias(): A {
    return this.#alias as A
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

export interface RawBuilderProps {
  readonly queryId: QueryId
  readonly rawNode: RawNode
  readonly plugins?: ReadonlyArray<KyselyPlugin>
}
