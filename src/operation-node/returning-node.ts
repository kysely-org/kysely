import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { SelectionNode } from './selection-node'

export interface ReturningNode extends OperationNode {
  readonly kind: 'ReturningNode'
  readonly selections: ReadonlyArray<SelectionNode>
}

export function isReturningNode(node: OperationNode): node is ReturningNode {
  return node.kind === 'ReturningNode'
}

export function createReturningNodeWithSelections(
  selections: ReadonlyArray<SelectionNode>
): ReturningNode {
  return freeze({
    kind: 'ReturningNode',
    selections: freeze(selections),
  })
}

export function cloneReturningNodeWithSelections(
  returning: ReturningNode,
  selections: ReadonlyArray<SelectionNode>
): ReturningNode {
  return freeze({
    ...returning,
    selections: returning.selections
      ? freeze([...returning.selections, ...selections])
      : freeze(selections),
  })
}
