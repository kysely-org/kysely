import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface FunctionNode extends OperationNode {
  readonly kind: 'FunctionNode'
  readonly func: string
  readonly arguments: ReadonlyArray<OperationNode>
}

type FunctionNodeFactory = Readonly<{
  is(node: OperationNode): node is FunctionNode
  create(
    func: string,
    args: ReadonlyArray<OperationNode>,
  ): Readonly<FunctionNode>
}>

/**
 * @internal
 */
export const FunctionNode: FunctionNodeFactory = freeze<FunctionNodeFactory>({
  is(node): node is FunctionNode {
    return node.kind === 'FunctionNode'
  },

  create(func, args) {
    return freeze({
      kind: 'FunctionNode',
      func,
      arguments: args,
    })
  },
})
