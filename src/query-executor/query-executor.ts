import { ConnectionProvider } from '../driver/connection-provider.js'
import { QueryResult } from '../driver/database-connection.js'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { CompileEntryPointNode } from '../query-compiler/query-compiler'
import { freeze } from '../util/object-utils.js'

export type RowMapper = (row: Record<string, any>) => Record<string, any>

export abstract class QueryExecutor {
  readonly #transformers: ReadonlyArray<OperationNodeTransformer>
  readonly #rowMappers: ReadonlyArray<RowMapper>

  constructor(
    transformers: OperationNodeTransformer[] = [],
    rowMappers: RowMapper[] = []
  ) {
    this.#transformers = freeze([...transformers])
    this.#rowMappers = freeze([...rowMappers])
  }

  protected get transformers(): ReadonlyArray<OperationNodeTransformer> {
    return this.#transformers
  }

  protected get rowMappers(): ReadonlyArray<RowMapper> {
    return this.#rowMappers
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

  abstract withTransformerAtFront(
    transformer: OperationNodeTransformer
  ): QueryExecutor

  abstract withConnectionProvider(
    connectionProvider: ConnectionProvider
  ): QueryExecutor

  abstract withoutTransformersOrRowMappers(): QueryExecutor

  protected mapQueryResult<T>(result: QueryResult<any>): QueryResult<T> {
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
