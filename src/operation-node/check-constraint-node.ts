import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { rawNode, RawNode } from './raw-node'

export interface CheckConstraintNode extends OperationNode {
  readonly kind: 'CheckConstraintNode'
  readonly expression: RawNode
}

export const checkConstraintNode = freeze({
  is(node: OperationNode): node is CheckConstraintNode {
    return node.kind === 'CheckConstraintNode'
  },

  create(expressionSql: string): CheckConstraintNode {
    return freeze({
      kind: 'CheckConstraintNode',
      expression: rawNode.createWithSql(expressionSql),
    })
  },
})
