import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { ValueNode } from '../../operation-node/value-node.js'

/**
 * Transforms all ValueNodes to immediate.
 *
 * WARNING! This should never be part of the public API. Users should never use this.
 * This is an internal helper.
 *
 * @internal
 */
export class ImmediateValueTransformer extends OperationNodeTransformer {
  override transformValue(node: ValueNode): ValueNode {
    return {
      ...super.transformValue(node),
      immediate: true,
    }
  }
}
