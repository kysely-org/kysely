import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

const NO_PLUGINS: ReadonlyArray<KyselyPlugin> = freeze([])

/**
 * This class abstracts away the details of how to compile a query into SQL
 * and execute it. Instead of passing around all those details, {@link SelectQueryBuilder}
 * and other classes that execute queries can just pass around and instance of
 * `QueryExecutor`.
 */
export abstract class QueryExecutor {
  readonly #plugins: ReadonlyArray<KyselyPlugin>

  constructor(plugins?: KyselyPlugin[]) {
    this.#plugins = plugins ?? NO_PLUGINS
  }

  get plugins(): ReadonlyArray<KyselyPlugin> {
    return this.#plugins
  }

  /**
   * Given the query the user has built (expressed as an operation node tree)
   * this method runs it through all plugins' `transformQuery` methods and
   * returns the result.
   */
  transformQuery<T extends RootOperationNode>(node: T, queryId: QueryId): T {
    for (const plugin of this.#plugins) {
      const transformedNode = plugin.transformQuery({ node, queryId })

      // We need to do a runtime check here. There is no good way
      // to write types that enforce this constraint.
      if (transformedNode.kind === node.kind) {
        node = transformedNode as T
      } else {
        throw new Error(
          [
            `KyselyPlugin.transformQuery must return a node`,
            `of the same kind that was given to it.`,
            `The plugin was given a ${node.kind}`,
            `but it returned a ${transformedNode.kind}`,
          ].join(' ')
        )
      }
    }

    return node
  }

  /**
   * Compiles the transformed query into SQL. You usually want to pass
   * the output of {@link transformQuery} into this method but you can
   * compile any query using this method.
   */
  abstract compileQuery(
    node: RootOperationNode,
    queryId: QueryId
  ): CompiledQuery

  /**
   * Executes a compiled query and runs the result through all plugins'
   * `transformResult` method.
   */
  async executeQuery<R>(
    compiledQuery: CompiledQuery,
    queryId: QueryId
  ): Promise<QueryResult<R>> {
    const result = await this.executeQueryImpl(compiledQuery, queryId)
    return this.#transformResult(result, queryId)
  }

  /**
   * Executes a compiled query.
   */
  protected abstract executeQueryImpl<R>(
    compiledQuery: CompiledQuery,
    queryId: QueryId
  ): Promise<QueryResult<R>>

  /**
   * Returns a copy of this executor with a new connection provider.
   */
  abstract withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor

  /**
   * Returns a copy of this executor with a plugin added as the
   * last plugin.
   */
  abstract withPlugin(plugin: KyselyPlugin): QueryExecutor

  /**
   * Returns a copy of this executor with a plugin added as the
   * first plugin.
   */
  abstract withPluginAtFront(plugin: KyselyPlugin): QueryExecutor

  /**
   * Returns a copy of this executor without any plugins.
   */
  abstract withoutPlugins(): QueryExecutor

  async #transformResult<T>(
    result: QueryResult<any>,
    queryId: QueryId
  ): Promise<QueryResult<T>> {
    for (const plugin of this.#plugins) {
      result = await plugin.transformResult({ result, queryId })
    }

    return result
  }
}
