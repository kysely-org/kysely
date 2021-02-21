import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { SelectionNode } from './selection-node'

export type SelectModifier = 'Distinct'

export interface SelectNode extends OperationNode {
  readonly kind: 'SelectNode'
  readonly selections: ReadonlyArray<SelectionNode>
  readonly distinctOnSelections: ReadonlyArray<SelectionNode>
  readonly modifier?: SelectModifier
}

export function isSelectNode(node: OperationNode): node is SelectNode {
  return node.kind === 'SelectNode'
}

export function createSelectNode(): SelectNode {
  return freeze({
    kind: 'SelectNode',
    selections: freeze([]),
    distinctOnSelections: freeze([]),
    modifier: undefined,
  })
}
