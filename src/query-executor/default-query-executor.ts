import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  RootOperationNode,
  QueryCompiler,
} from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { QueryExecutor } from './query-executor.js'
import { DialectAdapter } from '../index-nodeless.js'

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #adapter: DialectAdapter
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    adapter: DialectAdapter,
    connectionProvider: ConnectionProvider,
    plugins: KyselyPlugin[] = []
  ) {
    super(plugins)

    this.#compiler = compiler
    this.#adapter = adapter
    this.#connectionProvider = connectionProvider
  }

  get adapter(): DialectAdapter {
    return this.#adapter
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

  withPlugins(plugins: ReadonlyArray<KyselyPlugin>): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [...this.plugins, ...plugins]
    )
  }

  withPlugin(plugin: KyselyPlugin): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [...this.plugins, plugin]
    )
  }

  withPluginAtFront(plugin: KyselyPlugin): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [plugin, ...this.plugins]
    )
  }

  withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      connectionProvider,
      [...this.plugins]
    )
  }

  withoutPlugins(): QueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      []
    )
  }
}
