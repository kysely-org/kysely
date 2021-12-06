import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { ValueNode } from './value-node.js'

export interface DefaultValueNode extends OperationNode {
  readonly kind: 'DefaultValueNode'
  readonly defaultValue: ValueNode | RawNode
}

/**
 * @internal
 */
export const DefaultValueNode = freeze({
  is(node: OperationNode): node is DefaultValueNode {
    return node.kind === 'DefaultValueNode'
  },

  create(defaultValue: ValueNode | RawNode): DefaultValueNode {
    return freeze({
      kind: 'DefaultValueNode',
      defaultValue,
    })
  },
})
