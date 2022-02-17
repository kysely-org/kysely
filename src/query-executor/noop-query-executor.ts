import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from './query-executor.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { DialectAdapter } from '../dialect/dialect-adapter.js'

/**
 * A {@link QueryExecutor} subclass that can be used when you don't
 * have a {@link QueryCompiler}, {@link ConnectionProvider} or any
 * other needed things to actually execute queries.
 */
export class NoopQueryExecutor extends QueryExecutor {
  get adapter(): DialectAdapter {
    throw new Error('this query cannot be compiled to SQL')
  }

  compileQuery(): CompiledQuery {
    throw new Error('this query cannot be compiled to SQL')
  }

  provideConnection<T>(): Promise<T> {
    throw new Error('this query cannot be executed')
  }

  withConnectionProvider(): QueryExecutor {
    throw new Error('this query cannot have a connection provider')
  }

  withPlugin(plugin: KyselyPlugin): NoopQueryExecutor {
    return new NoopQueryExecutor([...this.plugins, plugin])
  }

  withPlugins(plugins: ReadonlyArray<KyselyPlugin>): NoopQueryExecutor {
    return new NoopQueryExecutor([...this.plugins, ...plugins])
  }

  withPluginAtFront(plugin: KyselyPlugin): NoopQueryExecutor {
    return new NoopQueryExecutor([plugin, ...this.plugins])
  }

  withoutPlugins(): QueryExecutor {
    return new NoopQueryExecutor([])
  }
}

export const NOOP_QUERY_EXECUTOR = new NoopQueryExecutor()
