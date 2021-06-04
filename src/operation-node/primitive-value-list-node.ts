import { freeze, PrimitiveValue } from '../util/object-utils'
import { OperationNode } from './operation-node'

/**
 * This node is basically just a performance optimization over the normal ValueListNode.
 * The queries often contain large arrays of primitive values (for example in a `where in` list)
 * and we don't want to create a ValueNode for each item in those lists.
 */
export interface PrimitiveValueListNode extends OperationNode {
  readonly kind: 'PrimitiveValueListNode'
  readonly values: ReadonlyArray<PrimitiveValue>
}

export function isPrimitiveValueListNode(
  node: OperationNode
): node is PrimitiveValueListNode {
  return node.kind === 'PrimitiveValueListNode'
}

export function createPrimitiveValueListNode(
  values: ReadonlyArray<PrimitiveValue>
): PrimitiveValueListNode {
  return freeze({
    kind: 'PrimitiveValueListNode',
    values: freeze(values),
  })
}
