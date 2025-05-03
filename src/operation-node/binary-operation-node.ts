import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface BinaryOperationNode extends OperationNode {
  readonly kind: 'BinaryOperationNode'
  readonly leftOperand: OperationNode
  readonly operator: OperationNode
  readonly rightOperand: OperationNode
}

type BinaryOperationNodeFactory = Readonly<{
  is(node: OperationNode): node is BinaryOperationNode
  create(
    leftOperand: OperationNode,
    operator: OperationNode,
    rightOperand: OperationNode,
  ): Readonly<BinaryOperationNode>
}>

/**
 * @internal
 */
export const BinaryOperationNode: BinaryOperationNodeFactory =
  freeze<BinaryOperationNodeFactory>({
    is(node): node is BinaryOperationNode {
      return node.kind === 'BinaryOperationNode'
    },

    create(leftOperand, operator, rightOperand) {
      return freeze({
        kind: 'BinaryOperationNode',
        leftOperand,
        operator,
        rightOperand,
      })
    },
  })
