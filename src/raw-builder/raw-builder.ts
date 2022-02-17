import { QueryResult } from '../driver/database-connection.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze } from '../util/object-utils.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { QueryExecutorProvider } from '../query-executor/query-executor-provider.js'
import { QueryId } from '../util/query-id.js'

/**
 * An instance of this class can be used to create raw SQL snippets or queries.
 *
 * You shouldn't need to create `RawBuilder` instances directly. Instead you should
 * use the {@link sql} template tag.
 */
export class RawBuilder<O = unknown> implements OperationNodeSource {
  readonly #props: RawBuilderProps

  constructor(props: RawBuilderProps) {
    this.#props = freeze(props)
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
   */
  as<A extends string>(alias: A): AliasedRawBuilder<O, A> {
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

preventAwait(
  RawBuilder,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

/**
 * {@link RawBuilder} with an alias. The result of calling {@link RawBuilder.as}.
 */
export class AliasedRawBuilder<O = unknown, A extends string = never>
  implements OperationNodeSource
{
  readonly #rawBuilder: RawBuilder<O>
  readonly #alias: A

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedRawBuilder with any A
   * as long as O is the same.
   */
  protected get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(this.#rawBuilder.toOperationNode(), this.#alias)
  }

  constructor(rawBuilder: RawBuilder<O>, alias: A) {
    this.#rawBuilder = rawBuilder
    this.#alias = alias
  }
}

export interface RawBuilderProps {
  readonly queryId: QueryId
  readonly rawNode: RawNode
  readonly plugins?: ReadonlyArray<KyselyPlugin>
}
