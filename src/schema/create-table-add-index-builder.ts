import { AddIndexNode } from '../operation-node/add-index-node.js'
import { IndexType } from '../operation-node/create-index-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'

export class CreateTableAddIndexBuilder implements OperationNodeSource {
  readonly #node: AddIndexNode

  constructor(node: AddIndexNode) {
    this.#node = node
  }

  /**
   * Specifies the index type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('email', 'varchar(255)')
   *   .addIndex('email_index', ['email'], (ib) => ib.using('hash'))
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create table `person` (`email` varchar(255), index `email_index` (`email`) using hash)
   * ```
   */
  using(indexType: IndexType): CreateTableAddIndexBuilder
  using(indexType: string): CreateTableAddIndexBuilder
  using(indexType: string): CreateTableAddIndexBuilder {
    return new CreateTableAddIndexBuilder(
      AddIndexNode.cloneWith(this.#node, {
        using: RawNode.createWithSql(indexType),
      }),
    )
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): AddIndexNode {
    return this.#node
  }
}

export type CreateTableAddIndexBuilderCallback = (
  builder: CreateTableAddIndexBuilder,
) => CreateTableAddIndexBuilder
