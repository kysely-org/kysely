import { ConnectionProvider } from '../driver/connection-provider.js'
import { DatabaseConnection } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  RootOperationNode,
  QueryCompiler,
} from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { QueryExecutorBase } from './query-executor-base.js'
import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { QueryId } from '../util/query-id.js'
import { AbortableOperationOptions } from '../util/abort.js'

export class DefaultQueryExecutor extends QueryExecutorBase {
  #compiler: QueryCompiler
  #adapter: DialectAdapter
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    adapter: DialectAdapter,
    connectionProvider: ConnectionProvider,
    plugins: KyselyPlugin[] = [],
  ) {
    super(plugins)

    this.#compiler = compiler
    this.#adapter = adapter
    this.#connectionProvider = connectionProvider
  }

  get adapter(): DialectAdapter {
    return this.#adapter
  }

  compileQuery(node: RootOperationNode, queryId: QueryId): CompiledQuery {
    return this.#compiler.compileQuery(node, queryId)
  }

  provideConnection<T>(
    consumer: (
      connection: DatabaseConnection,
      options?: AbortableOperationOptions,
    ) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T> {
    return this.#connectionProvider.provideConnection(consumer, options)
  }

  withPlugins(plugins: ReadonlyArray<KyselyPlugin>): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [...this.plugins, ...plugins],
    )
  }

  withPlugin(plugin: KyselyPlugin): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [...this.plugins, plugin],
    )
  }

  withPluginAtFront(plugin: KyselyPlugin): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [plugin, ...this.plugins],
    )
  }

  withConnectionProvider(
    connectionProvider: ConnectionProvider,
  ): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      connectionProvider,
      [...this.plugins],
    )
  }

  withoutPlugins(): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#adapter,
      this.#connectionProvider,
      [],
    )
  }
}
