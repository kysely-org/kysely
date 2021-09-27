import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { CompileEntryPointNode } from '../query-compiler/query-compiler'
import { QueryExecutor } from './query-executor'

export class NeverExecutingQueryExecutor extends QueryExecutor {
  compileQuery(_node: CompileEntryPointNode): CompiledQuery {
    throw new Error('this query cannot be compiled to SQL')
  }

  async executeQuery<R>(
    _compiledQuery: CompiledQuery
  ): Promise<QueryResult<R>> {
    throw new Error('this query cannot be executed')
  }

  withTransformerAtFront(
    transformer: OperationNodeTransformer
  ): NeverExecutingQueryExecutor {
    return new NeverExecutingQueryExecutor([transformer, ...this.transformers])
  }

  withConnectionProvider(
    _connectionProvider: ConnectionProvider
  ): QueryExecutor {
    throw new Error('this makes no sense')
  }

  withoutTransformersOrRowMappers(): QueryExecutor {
    return new NeverExecutingQueryExecutor([], [])
  }
}
