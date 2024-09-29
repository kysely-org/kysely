import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'

export class UniqueConstraintNodeBuilder implements OperationNodeSource {
  readonly #node: UniqueConstraintNode

  constructor(node: UniqueConstraintNode) {
    this.#node = node
  }

  toOperationNode(): UniqueConstraintNode {
    return this.#node
  }

  /**
   * Adds `nulls not distinct` to the unique constraint definition
   *
   * Supported by PostgreSQL dialect only
   */
  nullsNotDistinct(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { nullsNotDistinct: true }),
    )
  }
}

export type UniqueConstraintNodeBuilderCallback = (
  builder: UniqueConstraintNodeBuilder,
) => UniqueConstraintNodeBuilder
