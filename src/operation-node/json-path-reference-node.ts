import { freeze } from '../util/object-utils.js'
import { JSONPathNode } from './json-path-node.js'
import { OperationNode } from './operation-node.js'
import { JSONOperator } from './operator-node.js'

export interface JSONPathReferenceNode extends OperationNode {
  readonly kind: 'JSONPathReferenceNode'
  readonly operator: JSONOperator
  readonly jsonPath: JSONPathNode
}

/**
 * @internal
 */
export const JSONPathReferenceNode = freeze({
  is(node: OperationNode): node is JSONPathReferenceNode {
    return node.kind === 'JSONPathReferenceNode'
  },

  create(
    operator: JSONOperator,
    jsonPath: JSONPathNode
  ): JSONPathReferenceNode {
    return freeze({
      kind: 'JSONPathReferenceNode',
      operator,
      jsonPath,
    })
  },

  clone(
    node: JSONPathReferenceNode,
    jsonPath: JSONPathNode
  ): JSONPathReferenceNode {
    return freeze({
      ...node,
      jsonPath,
    })
  },
})
