import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'

export interface RenameConstraintNode extends OperationNode {
  readonly kind: 'RenameConstraintNode'
  readonly oldName: IdentifierNode
  readonly newName: IdentifierNode
}

type RenameConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is RenameConstraintNode
  create(oldName: string, newName: string): Readonly<RenameConstraintNode>
}>

/**
 * @internal
 */
export const RenameConstraintNode: RenameConstraintNodeFactory =
  freeze<RenameConstraintNodeFactory>({
    is(node): node is RenameConstraintNode {
      return node.kind === 'RenameConstraintNode'
    },

    create(oldName, newName) {
      return freeze({
        kind: 'RenameConstraintNode',
        oldName: IdentifierNode.create(oldName),
        newName: IdentifierNode.create(newName),
      })
    },
  })
