import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  RootOperationNode,
  QueryCompiler,
} from '../query-compiler/query-compiler.js'
import { QueryId } from '../util/query-id.js'
import { ExecutorPlugin, QueryExecutor } from './query-executor.js'

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    plugins: ExecutorPlugin[] = []
  ) {
    super(plugins)

    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  compileQuery(node: RootOperationNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery,
    queryId: QueryId
  ): Promise<QueryResult<R>> {
    return await this.#connectionProvider.withConnection(async (connection) => {
      const result = await connection.executeQuery<R>(compiledQuery)
      return this.mapQueryResult(result, queryId)
    })
  }

  withPluginAtFront(plugin: ExecutorPlugin): DefaultQueryExecutor {
    return new DefaultQueryExecutor(this.#compiler, this.#connectionProvider, [
      plugin,
      ...this.plugins,
    ])
  }

  withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor {
    return new DefaultQueryExecutor(this.#compiler, connectionProvider, [
      ...this.plugins,
    ])
  }

  withoutPlugins(): QueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#connectionProvider,
      []
    )
  }
}
