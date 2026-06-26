import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import type { TableNode } from './table-node.js'

export type DropTableNodeParams = Omit<Partial<DropTableNode>, 'kind' | 'table'>

// TODO: remove in 0.30
/**
 * @deprecated use {@link DropTableNodeParams} instead.
 */
export type DropTablexNodeParams = DropTableNodeParams

export interface DropTableNode extends OperationNode {
  readonly kind: 'DropTableNode'
  readonly table: TableNode
  readonly ifExists?: boolean
  readonly cascade?: boolean
  readonly temporary?: boolean
}

type DropTableNodeFactory = Readonly<{
  is(node: OperationNode): node is DropTableNode
  create(
    table: TableNode,
    params?: DropTableNodeParams,
  ): Readonly<DropTableNode>
  cloneWith(
    dropIndex: DropTableNode,
    params: DropTableNodeParams,
  ): Readonly<DropTableNode>
}>

/**
 * @internal
 */
export const DropTableNode: DropTableNodeFactory = freeze<DropTableNodeFactory>(
  {
    is(node): node is DropTableNode {
      return node.kind === 'DropTableNode'
    },

    create(table, params?) {
      return freeze({
        kind: 'DropTableNode',
        table,
        ...params,
      })
    },

    cloneWith(dropIndex, params) {
      return freeze({
        ...dropIndex,
        ...params,
      })
    },
  },
)
