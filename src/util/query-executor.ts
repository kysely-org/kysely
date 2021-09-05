import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'
import { freeze } from './object-utils'

export interface QueryExecutor {
  transformNode<T extends CompileEntryPointNode>(node: T): T
  compileQuery(node: CompileEntryPointNode): CompiledQuery
  executeQuery<R>(node: CompileEntryPointNode): Promise<QueryResult<R>>
  copyWithTransformer(transformer: OperationNodeTransformer): QueryExecutor
}

export class DefaultQueryExecutor implements QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider
  #transformers: ReadonlyArray<OperationNodeTransformer>

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    transformers: OperationNodeTransformer[] = []
  ) {
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
    this.#transformers = freeze(transformers)
  }

  transformNode<T extends CompileEntryPointNode>(node: T): T {
    for (const transformer of this.#transformers) {
      node = transformer.transformNode(node)
    }

    return node
  }

  compileQuery(node: CompileEntryPointNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  async executeQuery<R>(node: CompileEntryPointNode): Promise<QueryResult<R>> {
    return await this.#connectionProvider.withConnection((connection) => {
      return connection.executeQuery<R>(this.compileQuery(node))
    })
  }

  copyWithTransformer(
    transformer: OperationNodeTransformer
  ): DefaultQueryExecutor {
    return new DefaultQueryExecutor(this.#compiler, this.#connectionProvider, [
      ...this.#transformers,
      transformer,
    ])
  }
}

export class NeverExecutingQueryExecutor implements QueryExecutor {
  #transformers: ReadonlyArray<OperationNodeTransformer>

  constructor(transformers: OperationNodeTransformer[] = []) {
    this.#transformers = transformers
  }

  transformNode<T extends CompileEntryPointNode>(node: T): T {
    for (const transformer of this.#transformers) {
      node = transformer.transformNode(node)
    }

    return node
  }

  compileQuery(_node: CompileEntryPointNode): CompiledQuery {
    throw new Error(`this query cannot be compiled to SQL`)
  }

  async executeQuery<R>(_node: CompileEntryPointNode): Promise<QueryResult<R>> {
    throw new Error(`this query cannot be executed`)
  }

  copyWithTransformer(
    transformer: OperationNodeTransformer
  ): NeverExecutingQueryExecutor {
    return new NeverExecutingQueryExecutor([...this.#transformers, transformer])
  }
}
