import { DropColumnNode } from '../operation-node/drop-column-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { freeze } from '../util/object-utils.js'

export class DropColumnBuilder implements OperationNodeSource {
  readonly #node: DropColumnNode

  constructor(node: DropColumnNode) {
    this.#node = node
  }

  ifExists(): DropColumnBuilder {
    return new DropColumnBuilder(
      DropColumnNode.cloneWith(this.#node, { ifExists: true }),
    )
  }

  toOperationNode(): DropColumnNode {
    return this.#node
  }
}

export type DropColumnBuilderCallback = (
  builder: DropColumnBuilder,
) => DropColumnBuilder
