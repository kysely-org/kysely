import type { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'

export interface CheckConstraintNode extends OperationNode {
  readonly kind: 'CheckConstraintNode'
  readonly expression: OperationNode
  readonly name?: IdentifierNode
}

type CheckConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is CheckConstraintNode
  create(
    expression: OperationNode,
    constraintName?: string,
  ): Readonly<CheckConstraintNode>
}>

/**
 * @internal
 */
export const CheckConstraintNode: CheckConstraintNodeFactory =
  freeze<CheckConstraintNodeFactory>({
    is(node): node is CheckConstraintNode {
      return node.kind === 'CheckConstraintNode'
    },

    create(expression, constraintName?) {
      return freeze({
        kind: 'CheckConstraintNode',
        expression,
        name: constraintName
          ? IdentifierNode.create(constraintName)
          : undefined,
      })
    },
  })
