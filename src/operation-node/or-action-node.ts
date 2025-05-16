import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OrActionNode extends OperationNode {
  readonly kind: 'OrActionNode'
  readonly action: string
}

type OrActionNodeFactory = Readonly<{
  is(node: OperationNode): node is OrActionNode
  create(action: string): Readonly<OrActionNode>
}>

/**
 * @internal
 */
export const OrActionNode: OrActionNodeFactory = freeze<OrActionNodeFactory>({
  is(node): node is OrActionNode {
    return node.kind === 'OrActionNode'
  },

  create(action) {
    return freeze({
      kind: 'OrActionNode',
      action,
    })
  },
})
