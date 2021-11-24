import { freeze } from '../util/object-utils.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { OperationNode } from './operation-node.js'

export type OnDuplicateKeyNodeProps = Omit<OnDuplicateKeyNode, 'kind'>

export interface OnDuplicateKeyNode extends OperationNode {
  readonly kind: 'OnDuplicateKeyNode'
  readonly updates: ReadonlyArray<ColumnUpdateNode>
}

/**
 * @internal
 */
export const OnDuplicateKeyNode = freeze({
  is(node: OperationNode): node is OnDuplicateKeyNode {
    return node.kind === 'OnDuplicateKeyNode'
  },

  create(updates: ReadonlyArray<ColumnUpdateNode>): OnDuplicateKeyNode {
    return freeze({
      kind: 'OnDuplicateKeyNode',
      updates,
    })
  },
})
