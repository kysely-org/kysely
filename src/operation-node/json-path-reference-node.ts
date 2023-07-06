import { freeze } from '../util/object-utils.js'
import { JSONPathNode } from './json-path-node.js'
import { OperationNode } from './operation-node.js'
import { JSONOperator } from './operator-node.js'

type JSONOperatorNo$ = Exclude<JSONOperator, `${string}$`>

export interface JSONPathReferenceNode extends OperationNode {
  readonly kind: 'JSONPathReferenceNode'
  readonly operator: JSONOperatorNo$
  readonly is$: boolean
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
    const is$ = operator.endsWith('$')

    return freeze({
      kind: 'JSONPathReferenceNode',
      operator: (is$ ? operator.slice(0, -1) : operator) as JSONOperatorNo$,
      is$,
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
