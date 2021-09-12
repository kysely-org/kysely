import { ConnectionProvider } from '../driver/connection-provider'
import { QueryResult } from '../driver/database-connection'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { CompiledQuery } from '../query-compiler/compiled-query'
import {
  CompileEntryPointNode,
  QueryCompiler,
} from '../query-compiler/query-compiler'
import { freeze } from './object-utils'

export type RowMapper = (row: Record<string, any>) => Record<string, any>

export abstract class QueryExecutor {
  readonly #transformers: ReadonlyArray<OperationNodeTransformer>

  constructor(transformers: OperationNodeTransformer[] = []) {
    this.#transformers = freeze([...transformers])
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

  abstract copyWithTransformerAtFront(
    transformer: OperationNodeTransformer
  ): QueryExecutor
}

export class DefaultQueryExecutor extends QueryExecutor {
  #compiler: QueryCompiler
  #connectionProvider: ConnectionProvider
  #rowMappers: ReadonlyArray<RowMapper>

  constructor(
    compiler: QueryCompiler,
    connectionProvider: ConnectionProvider,
    transformers: OperationNodeTransformer[] = [],
    rowMappers: RowMapper[] = []
  ) {
    super(transformers)
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
    this.#rowMappers = freeze([...rowMappers])
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

  copyWithTransformerAtFront(
    transformer: OperationNodeTransformer
  ): DefaultQueryExecutor {
    return new DefaultQueryExecutor(
      this.#compiler,
      this.#connectionProvider,
      [transformer, ...this.transformers],
      [...this.#rowMappers]
    )
  }

  private mapQueryResult<T>(result: QueryResult<any>): QueryResult<T> {
    if (result.rows && result.rows.length > 0 && this.#rowMappers.length > 0) {
      return freeze({
        ...result,
        rows: result.rows.map((row) => {
          return this.#rowMappers.reduce(
            (row, rowMapper) => rowMapper(row),
            row
          )
        }),
      })
    }

    return result
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

  copyWithTransformerAtFront(
    transformer: OperationNodeTransformer
  ): NeverExecutingQueryExecutor {
    return new NeverExecutingQueryExecutor([transformer, ...this.transformers])
  }
}
