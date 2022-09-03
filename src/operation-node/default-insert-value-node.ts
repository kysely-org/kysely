import { freeze, isObject } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface DefaultInsertValueNode extends OperationNode {
  readonly kind: 'DefaultInsertValueNode'
}

/**
 * @internal
 */
export const DefaultInsertValueNode = freeze({
  is(node: OperationNode): node is DefaultInsertValueNode {
    return node.kind === 'DefaultInsertValueNode'
  },

  create(): DefaultInsertValueNode {
    return freeze({
      kind: 'DefaultInsertValueNode',
    })
  },
})
