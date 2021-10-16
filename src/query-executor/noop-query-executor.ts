import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from './query-executor.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'

/**
 * A {@link QueryExecutor} subclass that can be used when you don't
 * have a {@link QueryCompiler}, {@link ConnectionProvider} or any
 * other needed things to actually execute queries.
 */
export class NoopQueryExecutor extends QueryExecutor {
  compileQuery(): CompiledQuery {
    throw new Error('this query cannot be compiled to SQL')
  }

  protected async executeQueryImpl<R>(): Promise<QueryResult<R>> {
    throw new Error('this query cannot be executed')
  }

  withConnectionProvider(): QueryExecutor {
    throw new Error('this query cannot have a connection provider')
  }

  withPluginAtFront(plugin: KyselyPlugin): NoopQueryExecutor {
    return new NoopQueryExecutor([plugin, ...this.plugins])
  }

  withoutPlugins(): QueryExecutor {
    return new NoopQueryExecutor([])
  }
}
