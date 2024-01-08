import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface FunctionNode extends OperationNode {
  readonly kind: 'FunctionNode'
  readonly func: string
  readonly arguments: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const FunctionNode = freeze({
  is(node: OperationNode): node is FunctionNode {
    return node.kind === 'FunctionNode'
  },

  create(func: string, args: ReadonlyArray<OperationNode>): FunctionNode {
    return freeze({
      kind: 'FunctionNode',
      func,
      arguments: args,
    })
  },
})
