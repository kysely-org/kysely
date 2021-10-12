import { ExecutorPlugin } from '..'
import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  RootOperationNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'
import { QueryId } from '../util/query-id'
import { QueryExecutor } from './query-executor'

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
