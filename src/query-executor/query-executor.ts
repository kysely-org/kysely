import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RootOperationNode } from '../query-compiler/query-compiler'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

export abstract class QueryExecutor {
  readonly #plugins: ReadonlyArray<ExecutorPlugin>

  constructor(plugins: ExecutorPlugin[] = []) {
    this.#plugins = freeze([...plugins])
  }

  get plugins(): ReadonlyArray<ExecutorPlugin> {
    return this.#plugins
  }

  transformQuery<T extends RootOperationNode>(node: T, queryId: QueryId): T {
    for (const plugin of this.#plugins) {
      const transformedNode = plugin.transformQuery({ node, queryId })

      // We need to do a runtime check here instead of compile-time. There is no good way
      // to write types that enforce this constraint.
      if (transformedNode.kind === node.kind) {
        node = transformedNode as T
      } else {
        throw new Error(
          `KyselyPlugin.transformQuery must return a node of the same kind that was given to it. The plugin was given a ${node.kind} but it returned a ${transformedNode.kind}`
        )
      }
    }

    return node
  }

  abstract compileQuery(
    node: RootOperationNode,
    queryId: QueryId
  ): CompiledQuery

  abstract executeQuery<R>(
    compiledQuery: CompiledQuery,
    queryId: QueryId
  ): Promise<QueryResult<R>>

  abstract withPluginAtFront(plugin: ExecutorPlugin): QueryExecutor

  abstract withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor

  abstract withoutPlugins(): QueryExecutor

  protected async mapQueryResult<T>(
    result: QueryResult<any>,
    queryId: QueryId
  ): Promise<QueryResult<T>> {
    for (const plugin of this.#plugins) {
      result = await plugin.transformResult({ result, queryId })
    }

    return result
  }
}

export interface ExecutorPlugin {
  /**
   * This is called for each query before it is executed. You can modify the query by
   * transforming its {@link OperationNode} tree provided in {@link PluginTransformQueryArgs.node | args.node}
   * and returning the transformed tree. You'd usually  want to use an {@link OperationNodeTransformer}
   * for this.
   *
   * If you need to pass some query-related data between this method and `transformResult` you
   * can use a `WeakMap` with {@link PluginTransformQueryArgs.queryId | args.queryId} as the key:
   *
   * ```ts
   * const plugin = {
   *   data: new WeakMap<QueryId, SomeData>(),
   *
   *   transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
   *     this.data.set(args.queryId, something)
   *     return args.node
   *   },
   *
   *   transformResult(args: PluginTransformResultArgs): QueryResult<AnyRow> {
   *     const data = this.data.get(args.queryId)
   *     return data.result
   *   }
   * }
   * ```
   */
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode

  /**
   * This method is called for each query after it has been executed. The result
   * of the query can be accessed through {@link PluginTransformResultArgs.result | args.result}.
   * You can modify the result and return the modifier result.
   */
  transformResult(args: PluginTransformResultArgs): Promise<QueryResult<AnyRow>>
}

export interface PluginTransformQueryArgs {
  readonly queryId: QueryId
  readonly node: RootOperationNode
}

export type AnyRow = Record<string, unknown>

export interface PluginTransformResultArgs {
  readonly queryId: QueryId
  readonly result: QueryResult<AnyRow>
}
