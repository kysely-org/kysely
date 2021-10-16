import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  RootOperationNode,
  QueryCompiler,
} from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { QueryExecutor } from './query-executor.js'

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    plugins: KyselyPlugin[] = []
  ) {
    super(plugins)

    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  compileQuery(node: RootOperationNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  protected async executeQueryImpl<R>(
    compiledQuery: CompiledQuery
  ): Promise<QueryResult<R>> {
    return this.#connectionProvider.withConnection((connection) => {
      return connection.executeQuery<R>(compiledQuery)
    })
  }

  withPluginAtFront(plugin: KyselyPlugin): DefaultQueryExecutor {
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
