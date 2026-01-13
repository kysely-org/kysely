import { freeze } from '../util/object-utils.js'
import type { JSONPathLegNode } from './json-path-leg-node.js'
import type { OperationNode } from './operation-node.js'
import type { OperatorNode } from './operator-node.js'

export interface JSONPathNode extends OperationNode {
  readonly kind: 'JSONPathNode'
  readonly inOperator?: OperatorNode
  readonly pathLegs: ReadonlyArray<JSONPathLegNode>
}

type JSONPathNodeFactory = Readonly<{
  is(node: OperationNode): node is JSONPathNode
  create(inOperator?: OperatorNode): Readonly<JSONPathNode>
  cloneWithLeg(
    jsonPathNode: JSONPathNode,
    pathLeg: JSONPathLegNode,
  ): Readonly<JSONPathNode>
}>

/**
 * @internal
 */
export const JSONPathNode: JSONPathNodeFactory = freeze<JSONPathNodeFactory>({
  is(node): node is JSONPathNode {
    return node.kind === 'JSONPathNode'
  },

  create(inOperator?) {
    return freeze({
      kind: 'JSONPathNode',
      inOperator,
      pathLegs: freeze([]),
    })
  },

  cloneWithLeg(jsonPathNode, pathLeg) {
    return freeze({
      ...jsonPathNode,
      pathLegs: freeze([...jsonPathNode.pathLegs, pathLeg]),
    })
  },
})
