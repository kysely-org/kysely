import {
  createIndexNode,
  CreateIndexNode,
  IndexType,
} from '../operation-node/create-index-node'
import { listNode } from '../operation-node/list-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { rawNode } from '../operation-node/raw-node'
import { parseColumnName } from '../parser/reference-parser'
import { parseTable } from '../parser/table-parser'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'

export class CreateIndexBuilder implements OperationNodeSource, Compilable {
  readonly #createIndexNode: CreateIndexNode
  readonly #executor: QueryExecutor

  constructor({
    createIndexNode,
    executor,
  }: CreateIndexBuilderConstructorArgs) {
    this.#createIndexNode = createIndexNode
    this.#executor = executor
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder {
    return new CreateIndexBuilder({
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
        unique: true,
      }),
    })
  }

  /**
   * Specifies the table for the index.
   */
  on(table: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
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
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
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
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
        expression: listNode.create(columns.map(parseColumnName)),
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
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
        expression: rawNode.createWithSql(expression),
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
      executor: this.#executor,
      createIndexNode: createIndexNode.cloneWith(this.#createIndexNode, {
        using: rawNode.createWithSql(indexType),
      }),
    })
  }

  toOperationNode(): CreateIndexNode {
    return this.#executor.transformNode(this.#createIndexNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(
  CreateIndexBuilder,
  "don't await CreateIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateIndexBuilderConstructorArgs {
  createIndexNode: CreateIndexNode
  executor: QueryExecutor
}
