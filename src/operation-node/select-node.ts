import { freeze } from '../utils/object-utils'
import { FromNode } from './from-node'
import { OperationNode } from './operation-node'
import { SelectionNode } from './selection-node'

export type SelectModifier = 'Distinct'

export interface SelectNode extends OperationNode {
  readonly kind: 'SelectNode'
  readonly from: FromNode
  readonly selections?: ReadonlyArray<SelectionNode>
  readonly distinctOnSelections?: ReadonlyArray<SelectionNode>
  readonly modifier?: SelectModifier
}

export function isSelectNode(node: OperationNode): node is SelectNode {
  return node.kind === 'SelectNode'
}

export function createSelectNode(from: FromNode): SelectNode {
  return freeze({
    kind: 'SelectNode',
    from,
  })
}

export function cloneSelectNodeWithSelections(
  select: SelectNode,
  selections: ReadonlyArray<SelectionNode>
): SelectNode {
  return freeze({
    ...select,
    selections: select.selections
      ? freeze([...select.selections, ...selections])
      : freeze(selections),
  })
}

export function cloneSelectNodeWithDistinctOnSelections(
  select: SelectNode,
  selections: ReadonlyArray<SelectionNode>
): SelectNode {
  return freeze({
    ...select,
    distinctOnSelections: select.distinctOnSelections
      ? freeze([...select.distinctOnSelections, ...selections])
      : freeze(selections),
  })
}

export function cloneSelectNodeWithModifier(
  select: SelectNode,
  modifier: SelectModifier
): SelectNode {
  return freeze({
    ...select,
    modifier,
  })
}
