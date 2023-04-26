import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type JSONPathLegType = 'Member' | 'ArrayLocation'

export interface JSONPathLegNode extends OperationNode {
  readonly kind: 'JSONPathLegNode'
  readonly type: JSONPathLegType
  readonly value: OperationNode
}

/**
 * @internal
 */
export const JSONPathLegNode = freeze({
  is(node: OperationNode): node is JSONPathLegNode {
    return node.kind === 'JSONPathLegNode'
  },

  create(type: JSONPathLegType, value: OperationNode): JSONPathLegNode {
    return freeze({
      kind: 'JSONPathLegNode',
      type,
      value,
    })
  },
})
