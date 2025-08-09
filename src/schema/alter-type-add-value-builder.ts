import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { AddValueNode } from '../operation-node/add-value-node.js'
import { ValueNode } from '../operation-node/value-node.js'

export class AlterTypeAddValueBuilder implements OperationNodeSource {
  readonly #node: AddValueNode

  constructor(node: AddValueNode) {
    this.#node = node
  }

  /**
   * Avoids the query throwing an error if the value already exists inside the enum type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').renameValue('cat', 'dog').execute()
   * ```
   */
  ifNotExists() {
    return new AlterTypeAddValueBuilder(
      AddValueNode.cloneWithAddValueProps(this.#node, {
        ifNotExists: true,
      }),
    )
  }

  /**
   * Adds the new value before the specified existing value.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').renameValue('cat', 'dog').execute()
   * ```
   */
  before(value: string) {
    return new AlterTypeAddValueBuilder(
      AddValueNode.cloneWithAddValueProps(this.#node, {
        before: ValueNode.createImmediate(value),
        after: undefined, // before and after are mutually exclusive
      }),
    )
  }
  /**
   * Adds the new value after the specified existing value.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').renameValue('cat', 'dog').execute()
   * ```
   */
  after(value: string) {
    return new AlterTypeAddValueBuilder(
      AddValueNode.cloneWithAddValueProps(this.#node, {
        after: ValueNode.createImmediate(value),
        before: undefined, // before and after are mutually exclusive
      }),
    )
  }

  toOperationNode(): AddValueNode {
    return this.#node
  }
}

export type AlterTypeAddValueCallback = (
  builder: AlterTypeAddValueBuilder,
) => AlterTypeAddValueBuilder
