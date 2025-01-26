import { IdentifierNode } from '../../operation-node/identifier-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { QueryId } from '../../util/query-id.js'
import { StringMapper } from './camel-case.js'

export class SnakeCaseTransformer extends OperationNodeTransformer {
  readonly #snakeCase: StringMapper

  constructor(snakeCase: StringMapper) {
    super()
    this.#snakeCase = snakeCase
  }

  protected override transformIdentifier(
    node: IdentifierNode,
    queryId: QueryId,
  ): IdentifierNode {
    node = super.transformIdentifier(node, queryId)

    return {
      ...node,
      name: this.#snakeCase(node.name),
    }
  }
}
