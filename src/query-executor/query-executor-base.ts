import { ConnectionProvider } from '../driver/connection-provider.js'
import {
  DatabaseConnection,
  QueryResult,
} from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'
import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { QueryExecutor } from './query-executor.js'

const NO_PLUGINS: ReadonlyArray<KyselyPlugin> = freeze([])

export abstract class QueryExecutorBase implements QueryExecutor {
  readonly #plugins: ReadonlyArray<KyselyPlugin>

  constructor(plugins: ReadonlyArray<KyselyPlugin> = NO_PLUGINS) {
    this.#plugins = plugins
  }

  abstract get adapter(): DialectAdapter

  get plugins(): ReadonlyArray<KyselyPlugin> {
    return this.#plugins
  }

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

  abstract compileQuery(
    node: RootOperationNode,
    queryId: QueryId
  ): CompiledQuery

  abstract provideConnection<T>(
    consumer: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T>

  async executeQuery<R>(
    compiledQuery: CompiledQuery,
    queryId: QueryId
  ): Promise<QueryResult<R>> {
    return await this.provideConnection(async (connection) => {
      const result = await connection.executeQuery(compiledQuery)
      return this.#transformResult(result, queryId)
    })
  }

  abstract withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutorBase

  abstract withPlugin(plugin: KyselyPlugin): QueryExecutorBase
  abstract withPlugins(plugin: ReadonlyArray<KyselyPlugin>): QueryExecutorBase
  abstract withPluginAtFront(plugin: KyselyPlugin): QueryExecutorBase
  abstract withoutPlugins(): QueryExecutorBase

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
