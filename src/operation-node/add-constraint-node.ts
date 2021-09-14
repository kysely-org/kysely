import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { PrimaryKeyConstraintNode } from './primary-constraint-node'
import { UniqueConstraintNode } from './unique-constraint-node'
import { CheckConstraintNode } from './check-constraint-node'
import { IdentifierNode } from './identifier-node'

export type ConstraintNode =
  | PrimaryKeyConstraintNode
  | UniqueConstraintNode
  | CheckConstraintNode

export interface AddConstraintNode extends OperationNode {
  readonly kind: 'AddConstraintNode'
  readonly constraint: ConstraintNode
}

export const addConstraintNode = freeze({
  is(node: OperationNode): node is AddConstraintNode {
    return node.kind === 'AddConstraintNode'
  },

  create(constraint: ConstraintNode): AddConstraintNode {
    return freeze({
      kind: 'AddConstraintNode',
      constraint,
    })
  },
})
