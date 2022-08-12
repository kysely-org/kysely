import { IdentifierNode } from '../../operation-node/identifier-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { StringMapper } from './camel-case.js'

export class SnakeCaseTransformer extends OperationNodeTransformer {
  readonly #snakeCase: StringMapper

  constructor(snakeCase: StringMapper) {
    super()
    this.#snakeCase = snakeCase
  }

  protected override transformIdentifier(node: IdentifierNode): IdentifierNode {
    node = super.transformIdentifier(node)

    return {
      ...node,
      name: this.#snakeCase(node.name),
    }
  }
}
