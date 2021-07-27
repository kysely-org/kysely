import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'

export interface QueryExecutor {
  compileQuery(node: CompileEntryPointNode): CompiledQuery
  executeQuery<R>(node: CompileEntryPointNode): Promise<QueryResult<R>>
}

export class DefaultQueryExecutor implements QueryExecutor {
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

export class NeverExecutingQueryExecutor implements QueryExecutor {
  compileQuery(_node: CompileEntryPointNode): CompiledQuery {
    throw new Error(`this query cannot be compiled to SQL`)
  }

  async executeQuery<R>(_node: CompileEntryPointNode): Promise<QueryResult<R>> {
    throw new Error(`this query cannot be executed`)
  }
}
