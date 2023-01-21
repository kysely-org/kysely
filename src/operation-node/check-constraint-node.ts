import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'

export interface CheckConstraintNode extends OperationNode {
  readonly kind: 'CheckConstraintNode'
  readonly expression: OperationNode
  readonly name?: IdentifierNode
  readonly deferrableModifier?: 'deferrable' | 'not deferrable'
  readonly initiallyModifier?: 'initially immediate' | 'initially deferred'
}

/**
 * @internal
 */
export const CheckConstraintNode = freeze({
  is(node: OperationNode): node is CheckConstraintNode {
    return node.kind === 'CheckConstraintNode'
  },

  create(
    expression: OperationNode,
    constraintName?: string
  ): CheckConstraintNode {
    return freeze({
      kind: 'CheckConstraintNode',
      expression,
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },
})
