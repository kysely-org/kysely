import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { SelectionNode } from './selection-node'

export type SelectModifier = 'Distinct'

export interface SelectNode extends OperationNode {
  readonly kind: 'SelectNode'
  readonly selections?: ReadonlyArray<SelectionNode>
  readonly distinctOnSelections?: ReadonlyArray<SelectionNode>
  readonly modifier?: SelectModifier
}

export function isSelectNode(node: OperationNode): node is SelectNode {
  return node.kind === 'SelectNode'
}

export function createSelectNodeWithSelections(
  selections: ReadonlyArray<SelectionNode>
): SelectNode {
  return freeze({
    kind: 'SelectNode',
    selections: freeze(selections),
  })
}

export function createSelectNodeWithDistinctOnSelections(
  selections: ReadonlyArray<SelectionNode>
): SelectNode {
  return freeze({
    kind: 'SelectNode',
    distinctOnSelections: freeze(selections),
  })
}

export function createSelectNodeWithModifier(
  modifier: SelectModifier
): SelectNode {
  return freeze({
    kind: 'SelectNode',
    modifier,
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
