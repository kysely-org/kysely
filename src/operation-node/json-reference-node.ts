import { freeze } from '../util/object-utils.js'
import { JSONOperatorChainNode } from './json-operator-chain-node.js'
import { JSONPathNode } from './json-path-node.js'
import { OperationNode } from './operation-node.js'
import { ReferenceNode } from './reference-node.js'

export interface JSONReferenceNode extends OperationNode {
  readonly kind: 'JSONReferenceNode'
  readonly reference: ReferenceNode
  readonly traversal: JSONPathNode | JSONOperatorChainNode
}

type JSONReferenceNodeFactory = Readonly<{
  is(node: OperationNode): node is JSONReferenceNode
  create(
    reference: ReferenceNode,
    traversal: JSONPathNode | JSONOperatorChainNode,
  ): Readonly<JSONReferenceNode>
  cloneWithTraversal(
    node: JSONReferenceNode,
    traversal: JSONPathNode | JSONOperatorChainNode,
  ): Readonly<JSONReferenceNode>
}>

/**
 * @internal
 */
export const JSONReferenceNode: JSONReferenceNodeFactory =
  freeze<JSONReferenceNodeFactory>({
    is(node): node is JSONReferenceNode {
      return node.kind === 'JSONReferenceNode'
    },

    create(reference, traversal) {
      return freeze({
        kind: 'JSONReferenceNode',
        reference,
        traversal,
      })
    },

    cloneWithTraversal(node, traversal) {
      return freeze({
        ...node,
        traversal,
      })
    },
  })
