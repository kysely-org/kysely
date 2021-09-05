import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'
import { freeze } from './object-utils'

export abstract class QueryExecutor {
  #transformers: ReadonlyArray<OperationNodeTransformer>

  constructor(transformers: OperationNodeTransformer[] = []) {
    this.#transformers = freeze(transformers)
  }

  protected get transformers(): ReadonlyArray<OperationNodeTransformer> {
    return this.#transformers
  }

  transformNode<T extends CompileEntryPointNode>(node: T): T {
    for (const transformer of this.#transformers) {
      node = transformer.transformNode(node)
    }

    return node
  }

  abstract compileQuery(node: CompileEntryPointNode): CompiledQuery

  abstract executeQuery<R>(
    compiledQuery: CompiledQuery
  ): Promise<QueryResult<R>>

  abstract copyWithTransformer(
    transformer: OperationNodeTransformer
  ): QueryExecutor
}

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    transformers: OperationNodeTransformer[] = []
  ) {
    super(transformers)
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  compileQuery(node: CompileEntryPointNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    return await this.#connectionProvider.withConnection((connection) => {
      return connection.executeQuery<R>(compiledQuery)
    })
  }

  copyWithTransformer(
    transformer: OperationNodeTransformer
  ): DefaultQueryExecutor {
    return new DefaultQueryExecutor(this.#compiler, this.#connectionProvider, [
      ...this.transformers,
      transformer,
    ])
  }
}

export class NeverExecutingQueryExecutor extends QueryExecutor {
  compileQuery(_node: CompileEntryPointNode): CompiledQuery {
    throw new Error(`this query cannot be compiled to SQL`)
  }

  async executeQuery<R>(
    _compiledQuery: CompiledQuery
  ): Promise<QueryResult<R>> {
    throw new Error(`this query cannot be executed`)
  }

  copyWithTransformer(
    transformer: OperationNodeTransformer
  ): NeverExecutingQueryExecutor {
    return new NeverExecutingQueryExecutor([...this.transformers, transformer])
  }
}
