import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export type DropIndexNodeParams = Omit<Partial<DropTableNode>, 'kind' | 'table'>
export type DropTableNodeModifier = 'IfExists'

export interface DropTableNode extends OperationNode {
  readonly kind: 'DropTableNode'
  readonly table: TableNode
  readonly modifier?: DropTableNodeModifier
}

export const dropTableNode = freeze({
  is(node: OperationNode): node is DropTableNode {
    return node.kind === 'DropTableNode'
  },

  create(table: TableNode, params?: DropIndexNodeParams): DropTableNode {
    return freeze({
      kind: 'DropTableNode',
      table,
      ...params,
    })
  },

  cloneWithModifier(
    dropIndex: DropTableNode,
    modifier: DropTableNodeModifier
  ): DropTableNode {
    return freeze({
      ...dropIndex,
      modifier,
    })
  },
})
