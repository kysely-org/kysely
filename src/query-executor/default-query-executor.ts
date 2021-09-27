import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'
import { QueryExecutor, RowMapper } from './query-executor'

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    transformers: OperationNodeTransformer[] = [],
    rowMappers: RowMapper[] = []
  ) {
    super(transformers, rowMappers)

    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  compileQuery(node: CompileEntryPointNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    return await this.#connectionProvider.withConnection(async (connection) => {
      const result = await connection.executeQuery<R>(compiledQuery)
      return this.mapQueryResult(result)
    })
  }

  withTransformerAtFront(
    transformer: OperationNodeTransformer
  ): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#connectionProvider,
      [transformer, ...this.transformers],
      [...this.rowMappers]
    )
  }

  withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      connectionProvider,
      [...this.transformers],
      [...this.rowMappers]
    )
  }

  withoutTransformersOrRowMappers(): QueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#connectionProvider,
      [],
      []
    )
  }
}
