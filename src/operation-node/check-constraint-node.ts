import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { rawNode, RawNode } from './raw-node.js'
import { identifierNode, IdentifierNode } from './identifier-node.js'

export interface CheckConstraintNode extends OperationNode {
  readonly kind: 'CheckConstraintNode'
  readonly expression: RawNode
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const checkConstraintNode = freeze({
  is(node: OperationNode): node is CheckConstraintNode {
    return node.kind === 'CheckConstraintNode'
  },

  create(expressionSql: string, constraintName?: string): CheckConstraintNode {
    return freeze({
      kind: 'CheckConstraintNode',
      expression: rawNode.createWithSql(expressionSql),
      name: constraintName ? identifierNode.create(constraintName) : undefined,
    })
  },
})
