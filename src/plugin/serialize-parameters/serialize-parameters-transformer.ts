import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { ValueNode } from '../../operation-node/value-node.js'
import { defaultSerializer, Serializer } from './serialize-parameters.js'

export class SerializeParametersTransformer extends OperationNodeTransformer {
  readonly #serializer: Serializer

  constructor(serializer: Serializer | undefined) {
    super()
    this.#serializer = serializer || defaultSerializer
  }

  protected override transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: this.#serializer(node.value),
    }
  }
}
