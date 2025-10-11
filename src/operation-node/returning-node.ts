import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SelectionNode } from './selection-node.js'

export interface ReturningNode extends OperationNode {
  readonly kind: 'ReturningNode'
  readonly selections: ReadonlyArray<SelectionNode>
}

type ReturningNodeFactory = Readonly<{
  is(node: OperationNode): node is ReturningNode
  create(selections: ReadonlyArray<SelectionNode>): Readonly<ReturningNode>
  cloneWithSelections(
    returning: ReturningNode,
    selections: ReadonlyArray<SelectionNode>,
  ): Readonly<ReturningNode>
}>

/**
 * @internal
 */
export const ReturningNode: ReturningNodeFactory = freeze<ReturningNodeFactory>(
  {
    is(node): node is ReturningNode {
      return node.kind === 'ReturningNode'
    },

    create(selections) {
      return freeze({
        kind: 'ReturningNode',
        selections: freeze(selections),
      })
    },

    cloneWithSelections(returning, selections) {
      return freeze({
        ...returning,
        selections: returning.selections
          ? freeze([...returning.selections, ...selections])
          : freeze(selections),
      })
    },
  },
)
