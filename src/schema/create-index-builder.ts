import {
  CreateIndexNode,
  IndexType,
} from '../operation-node/create-index-node.js'
import { ListNode } from '../operation-node/list-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { parseColumnName } from '../parser/reference-parser.js'
import { parseTable } from '../parser/table-parser.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'

export class CreateIndexBuilder implements OperationNodeSource, Compilable {
  readonly #createIndexNode: CreateIndexNode
  readonly #executor: QueryExecutor

  constructor(args: CreateIndexBuilderConstructorArgs) {
    this.#createIndexNode = args.createIndexNode
    this.#executor = args.executor
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder {
    return new CreateIndexBuilder({
      executor: this.#executor,
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
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
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
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
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
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
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
        expression: ListNode.create(columns.map(parseColumnName)),
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
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
        expression: RawNode.createWithSql(expression),
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
      createIndexNode: CreateIndexNode.cloneWith(this.#createIndexNode, {
        using: RawNode.createWithSql(indexType),
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
