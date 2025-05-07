import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface UnaryOperationNode extends OperationNode {
  readonly kind: 'UnaryOperationNode'
  readonly operator: OperationNode
  readonly operand: OperationNode
}

type UnaryOperationNodeFactory = Readonly<{
  is(node: OperationNode): node is UnaryOperationNode
  create(
    operator: OperationNode,
    operand: OperationNode,
  ): Readonly<UnaryOperationNode>
}>

/**
 * @internal
 */
export const UnaryOperationNode: UnaryOperationNodeFactory =
  freeze<UnaryOperationNodeFactory>({
    is(node): node is UnaryOperationNode {
      return node.kind === 'UnaryOperationNode'
    },

    create(operator, operand) {
      return freeze({
        kind: 'UnaryOperationNode',
        operator,
        operand,
      })
    },
  })
