import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface SelectAllNode extends OperationNode {
  readonly kind: 'SelectAllNode'
}

type SelectAllNodeFactory = Readonly<{
  is(node: OperationNode): node is SelectAllNode
  create(): Readonly<SelectAllNode>
}>

/**
 * @internal
 */
export const SelectAllNode: SelectAllNodeFactory = freeze<SelectAllNodeFactory>(
  {
    is(node): node is SelectAllNode {
      return node.kind === 'SelectAllNode'
    },

    create() {
      return freeze({
        kind: 'SelectAllNode',
      })
    },
  },
)
