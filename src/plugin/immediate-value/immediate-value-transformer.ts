import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { ValueNode } from '../../operation-node/value-node.js'
import { QueryId } from '../../util/query-id.js'

/**
 * Transforms all ValueNodes to immediate.
 *
 * WARNING! This should never be part of the public API. Users should never use this.
 * This is an internal helper.
 *
 * @internal
 */
export class ImmediateValueTransformer extends OperationNodeTransformer {
  override transformValue(node: ValueNode, queryId: QueryId): ValueNode {
    return {
      ...super.transformValue(node, queryId),
      immediate: true,
    }
  }
}
