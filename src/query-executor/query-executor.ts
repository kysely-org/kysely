import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

export abstract class QueryExecutor {
  readonly #plugins: ReadonlyArray<KyselyPlugin>

  constructor(plugins: KyselyPlugin[] = []) {
    this.#plugins = freeze([...plugins])
  }

  get plugins(): ReadonlyArray<KyselyPlugin> {
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

  abstract withPluginAtFront(plugin: KyselyPlugin): QueryExecutor

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
