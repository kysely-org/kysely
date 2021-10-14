import { QueryResult } from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { ExecutorPlugin, QueryExecutor } from './query-executor.js'

export class NeverExecutingQueryExecutor extends QueryExecutor {
  compileQuery(): CompiledQuery {
    throw new Error('this query cannot be compiled to SQL')
  }

  async executeQuery<R>(): Promise<QueryResult<R>> {
    throw new Error('this query cannot be executed')
  }

  withConnectionProvider(): QueryExecutor {
    throw new Error('this makes no sense')
  }

  withPluginAtFront(plugin: ExecutorPlugin): NeverExecutingQueryExecutor {
    return new NeverExecutingQueryExecutor([plugin, ...this.plugins])
  }

  withoutPlugins(): QueryExecutor {
    return new NeverExecutingQueryExecutor([])
  }
}
