import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'

export abstract class QueryExecutor {
  static create(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider
  ): QueryExecutor {
    return new QueryExecutorImpl(compiler, connectionProvider)
  }

  static createNeverExecutingExecutor(): QueryExecutor {
    return new NeverExecutingExecutor()
  }

  abstract compileQuery(node: CompileEntryPointNode): CompiledQuery
  abstract executeQuery<R>(node: CompileEntryPointNode): Promise<QueryResult<R>>
}

class QueryExecutorImpl {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider

  constructor(compiler: QueryCompiler, connectionProvider: ConnectionProvider) {
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  compileQuery(node: CompileEntryPointNode): CompiledQuery {
    return this.#compiler.compileQuery(node)
  }

  async executeQuery<R>(node: CompileEntryPointNode): Promise<QueryResult<R>> {
    return await this.#connectionProvider.withConnection((connection) => {
      return connection.executeQuery<R>(this.compileQuery(node))
    })
  }
}

class NeverExecutingExecutor extends QueryExecutor {
  compileQuery(_node: CompileEntryPointNode): CompiledQuery {
    throw new Error(`this query cannot be compiled to SQL`)
  }

  async executeQuery<R>(_node: CompileEntryPointNode): Promise<QueryResult<R>> {
    throw new Error(`this query cannot be executed`)
  }
}
