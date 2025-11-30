import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import type { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../../operation-node/value-list-node.js'
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
  override transformPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    return ValueListNode.create(
      node.values.map(ValueNode.createImmediate),
    ) as any
  }

  override transformValue(node: ValueNode): ValueNode {
    return ValueNode.createImmediate(node.value)
  }
}
