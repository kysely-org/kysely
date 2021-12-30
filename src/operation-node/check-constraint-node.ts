import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { RawNode } from './raw-node.js'
import { IdentifierNode } from './identifier-node.js'

export interface CheckConstraintNode extends OperationNode {
  readonly kind: 'CheckConstraintNode'
  readonly expression: RawNode
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const CheckConstraintNode = freeze({
  is(node: OperationNode): node is CheckConstraintNode {
    return node.kind === 'CheckConstraintNode'
  },

  create(expression: RawNode, constraintName?: string): CheckConstraintNode {
    return freeze({
      kind: 'CheckConstraintNode',
      expression,
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },
})
