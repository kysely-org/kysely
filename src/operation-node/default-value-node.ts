import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface DefaultValueNode extends OperationNode {
  readonly kind: 'DefaultValueNode'
  readonly defaultValue: OperationNode
}

/**
 * @internal
 */
export const DefaultValueNode = freeze({
  is(node: OperationNode): node is DefaultValueNode {
    return node.kind === 'DefaultValueNode'
  },

  create(defaultValue: OperationNode): DefaultValueNode {
    return freeze({
      kind: 'DefaultValueNode',
      defaultValue,
    })
  },
})
