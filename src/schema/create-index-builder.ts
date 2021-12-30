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
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { AnyRawBuilder } from '../util/type-utils.js'

export class CreateIndexBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateIndexBuilderProps

  constructor(props: CreateIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder {
    return new CreateIndexBuilder({
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
        unique: true,
      }),
    })
  }

  /**
   * Specifies the table for the index.
   */
  on(table: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
        table: parseTable(table),
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
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
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
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
        expression: ListNode.create(columns.map(parseColumnName)),
      }),
    })
  }

  /**
   * Specifies an arbitrary expression for the index.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createIndex('person_first_name_index')
   *   .on('person')
   *   .expression(db.raw('first_name COLLATE "fi_FI"'))
   *   .execute()
   * ```
   */
  expression(expression: AnyRawBuilder): CreateIndexBuilder {
    return new CreateIndexBuilder({
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
        expression: expression.toOperationNode(),
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
      ...this.#props,
      createIndexNode: CreateIndexNode.cloneWith(this.#props.createIndexNode, {
        using: RawNode.createWithSql(indexType),
      }),
    })
  }

  toOperationNode(): CreateIndexNode {
    return this.#props.executor.transformQuery(
      this.#props.createIndexNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  CreateIndexBuilder,
  "don't await CreateIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly createIndexNode: CreateIndexNode
}
