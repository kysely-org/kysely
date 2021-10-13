import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type OnConflictNodeParams = Omit<OnConflictNode, 'kind'>

export interface OnConflictNode extends OperationNode {
  readonly kind: 'OnConflictNode'
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly constraint?: IdentifierNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly doNothing?: boolean
}

/**
 * @internal
 */
export const OnConflictNode = freeze({
  is(node: OperationNode): node is OnConflictNode {
    return node.kind === 'OnConflictNode'
  },

  create(params: OnConflictNodeParams): OnConflictNode {
    return freeze({
      kind: 'OnConflictNode',
      ...params,
    })
  },
})
