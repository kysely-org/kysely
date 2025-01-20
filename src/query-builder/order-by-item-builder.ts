import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OrderByItemNode } from '../operation-node/order-by-item-node.js'
import { Collation } from '../parser/order-by-parser.js'
import { freeze } from '../util/object-utils.js'

export class OrderByItemBuilder implements OperationNodeSource {
  readonly #props: OrderByItemBuilderProps

  constructor(props: OrderByItemBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds `desc` to the `order by` item.
   *
   * See {@link asc} for the opposite.
   */
  desc(): OrderByItemBuilder {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { direction: 'desc' }),
    })
  }

  /**
   * Adds `asc` to the `order by` item.
   *
   * See {@link desc} for the opposite.
   */
  asc(): OrderByItemBuilder {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { direction: 'asc' }),
    })
  }

  /**
   * Adds `nulls last` to the `order by` item.
   *
   * This is only supported by some dialects like PostgreSQL and SQLite.
   *
   * See {@link nullsFirst} for the opposite.
   */
  nullsLast(): OrderByItemBuilder {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { nulls: 'last' }),
    })
  }

  /**
   * Adds `nulls first` to the `order by` item.
   *
   * This is only supported by some dialects like PostgreSQL and SQLite.
   *
   * See {@link nullsLast} for the opposite.
   */
  nullsFirst(): OrderByItemBuilder {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { nulls: 'first' }),
    })
  }

  /**
   * Adds `collate <collationName>` to the `order by` item.
   */
  collate(collation: Collation): OrderByItemBuilder {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { collation }),
    })
  }

  toOperationNode(): OrderByItemNode {
    return this.#props.node
  }
}

export interface OrderByItemBuilderProps {
  readonly node: OrderByItemNode
}
