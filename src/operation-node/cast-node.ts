import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface CastNode extends OperationNode {
  readonly kind: 'CastNode'
  readonly expression: OperationNode
  readonly dataType: OperationNode
}

type CastNodeFactory = Readonly<{
  is(node: OperationNode): node is CastNode
  create(expression: OperationNode, dataType: OperationNode): Readonly<CastNode>
}>

/**
 * @internal
 */
export const CastNode: CastNodeFactory = freeze<CastNodeFactory>({
  is(node): node is CastNode {
    return node.kind === 'CastNode'
  },

  create(expression, dataType) {
    return freeze({
      kind: 'CastNode',
      expression,
      dataType,
    })
  },
})
