import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SelectionNode } from './selection-node.js'

export interface ReturningNode extends OperationNode {
  readonly kind: 'ReturningNode'
  readonly selections: ReadonlyArray<SelectionNode>
}

/**
 * @internal
 */
export const ReturningNode = freeze({
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
    selections: ReadonlyArray<SelectionNode>,
  ): ReturningNode {
    return freeze({
      ...returning,
      selections: returning.selections
        ? freeze([...returning.selections, ...selections])
        : freeze(selections),
    })
  },
})
