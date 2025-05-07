import { freeze } from '../util/object-utils.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { OperationNode } from './operation-node.js'

export type OnDuplicateKeyNodeProps = Omit<OnDuplicateKeyNode, 'kind'>

export interface OnDuplicateKeyNode extends OperationNode {
  readonly kind: 'OnDuplicateKeyNode'
  readonly updates: ReadonlyArray<ColumnUpdateNode>
}

type OnDuplicateKeyNodeFactory = Readonly<{
  is(node: OperationNode): node is OnDuplicateKeyNode
  create(updates: ReadonlyArray<ColumnUpdateNode>): Readonly<OnDuplicateKeyNode>
}>

/**
 * @internal
 */
export const OnDuplicateKeyNode: OnDuplicateKeyNodeFactory =
  freeze<OnDuplicateKeyNodeFactory>({
    is(node): node is OnDuplicateKeyNode {
      return node.kind === 'OnDuplicateKeyNode'
    },

    create(updates) {
      return freeze({
        kind: 'OnDuplicateKeyNode',
        updates,
      })
    },
  })
