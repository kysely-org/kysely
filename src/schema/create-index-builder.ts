import { ConnectionProvider } from '../driver/connection-provider'
import {
  cloneCreateIndexNode,
  CreateIndexNode,
  IndexType,
} from '../operation-node/create-index-node'
import { createListNode } from '../operation-node/list-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { createRawNodeWithSql } from '../operation-node/raw-node'
import { parseColumnName } from '../parser/reference-parser'
import { parseTable } from '../parser/table-parser'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'

export class CreateIndexBuilder implements OperationNodeSource, Compilable {
  readonly #createIndexNode: CreateIndexNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    createIndexNode,
    compiler,
    connectionProvider,
  }: CreateIndexBuilderConstructorArgs) {
    this.#createIndexNode = createIndexNode
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        unique: true,
      }),
    })
  }

  /**
   * Specifies the table for the index.
   */
  on(table: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        on: parseTable(table),
      }),
    })
  }

  /**
   * Specifies the column for the index.
   *
   * Also see the `expression` for specifying an arbitrary expression.
   */
  column(column: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        expression: parseColumnName(column),
      }),
    })
  }

  /**
   * Specifies a list of columns for the index.
   *
   * Also see the `expression` for specifying an arbitrary expression.
   */
  columns(columns: string[]): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        expression: createListNode(columns.map(parseColumnName)),
      }),
    })
  }

  /**
   * Specifies an arbitrary expression for the index.
   *
   * @example
   * ```ts
   * await db.schema
   *   .createIndex('person_first_name_index')
   *   .on('person')
   *   .expression('first_name COLLATE "fi_FI"')
   *   .execute()
   * ```
   */
  expression(expression: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        expression: createRawNodeWithSql(expression),
      }),
    })
  }

  /**
   * Specifies the index type.
   */
  using(indexType: IndexType): CreateIndexBuilder
  using(indexType: string): CreateIndexBuilder
  using(indexType: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createIndexNode: cloneCreateIndexNode(this.#createIndexNode, {
        using: createRawNodeWithSql(indexType),
      }),
    })
  }

  toOperationNode(): CreateIndexNode {
    return this.#createIndexNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compileQuery(this.#createIndexNode)
  }

  async execute(): Promise<void> {
    if (!this.#connectionProvider) {
      throw new Error(`this builder cannot be executed`)
    }

    await this.#connectionProvider.withConnection(async (connection) => {
      await connection.executeQuery(this.compile())
    })
  }
}

preventAwait(
  CreateIndexBuilder,
  "don't await CreateIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateIndexBuilderConstructorArgs {
  createIndexNode: CreateIndexNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}
