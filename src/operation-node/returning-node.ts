import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { SelectionNode } from './selection-node'

export interface ReturningNode extends OperationNode {
  readonly kind: 'ReturningNode'
  readonly selections: ReadonlyArray<SelectionNode>
}

/**
 * @internal
 */
export const returningNode = freeze({
  is(node: OperationNode): node is ReturningNode {
    return node.kind === 'ReturningNode'
  },

  create(selections: ReadonlyArray<SelectionNode>): ReturningNode {
    return freeze({
      kind: 'ReturningNode',
      selections: freeze(selections),
    })
  },

  cloneWithSelections(
    returning: ReturningNode,
    selections: ReadonlyArray<SelectionNode>
  ): ReturningNode {
    return freeze({
      ...returning,
      selections: returning.selections
        ? freeze([...returning.selections, ...selections])
        : freeze(selections),
    })
  },
})
