import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'

export interface RenameConstraintNode extends OperationNode {
  readonly kind: 'RenameConstraintNode'
  readonly oldName: IdentifierNode
  readonly newName: IdentifierNode
}

/**
 * @internal
 */
export const RenameConstraintNode = freeze({
  is(node: OperationNode): node is RenameConstraintNode {
    return node.kind === 'RenameConstraintNode'
  },

  create(oldName: string, newName: string): RenameConstraintNode {
    return freeze({
      kind: 'RenameConstraintNode',
      oldName: IdentifierNode.create(oldName),
      newName: IdentifierNode.create(newName),
    })
  },
})
