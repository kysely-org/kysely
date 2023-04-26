import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { JSONPathLegNode } from './json-path-leg-node.js'
import { OperationNode } from './operation-node.js'

export interface JSONPathNode extends OperationNode {
  readonly kind: 'JSONPathNode'
  readonly pathLegs: ReadonlyArray<JSONPathLegNode>
}

/**
 * @internal
 */
export const JSONPathNode = freeze({
  is(node: OperationNode): node is JSONPathNode {
    return node.kind === 'JSONPathNode'
  },

  create(): JSONPathNode {
    return freeze({
      kind: 'JSONPathNode',
      pathLegs: freeze([]),
    })
  },

  cloneWithLeg(
    jsonPathNode: JSONPathNode,
    pathLeg: JSONPathLegNode
  ): JSONPathNode {
    return freeze({
      ...jsonPathNode,
      pathLegs: freeze([...jsonPathNode.pathLegs, pathLeg]),
    })
  },
})
