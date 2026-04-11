import { DropColumnNode } from '../operation-node/drop-column-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { freeze } from '../util/object-utils.js'

export class DropColumnBuilder implements OperationNodeSource {
  readonly #props: DropColumnBuilderProps

  constructor(props: DropColumnBuilderProps) {
    this.#props = freeze({ ...props })
  }

  ifExists(): DropColumnBuilder {
    return new DropColumnBuilder({
      ...this.#props,
      node: DropColumnNode.cloneWith(this.#props.node, { ifExists: true }),
    })
  }

  toOperationNode(): DropColumnNode {
    return this.#props.node
  }
}

export interface DropColumnBuilderProps {
  readonly node: DropColumnNode
}

export type DropColumnBuilderCallback = (
  builder: DropColumnBuilder,
) => DropColumnBuilder
