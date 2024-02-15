import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'

export type DropTablexNodeParams = Omit<
  Partial<DropTableNode>,
  'kind' | 'table'
>
export interface DropTableNode extends OperationNode {
  readonly kind: 'DropTableNode'
  readonly table: TableNode
  readonly ifExists?: boolean
  readonly cascade?: boolean
}

/**
 * @internal
 */
export const DropTableNode = freeze({
  is(node: OperationNode): node is DropTableNode {
    return node.kind === 'DropTableNode'
  },

  create(table: TableNode, params?: DropTablexNodeParams): DropTableNode {
    return freeze({
      kind: 'DropTableNode',
      table,
      ...params,
    })
  },

  cloneWith(
    dropIndex: DropTableNode,
    params: DropTablexNodeParams,
  ): DropTableNode {
    return freeze({
      ...dropIndex,
      ...params,
    })
  },
})
