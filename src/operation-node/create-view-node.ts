import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { SelectQueryNode } from './select-query-node.js'

export type CreateViewNodeParams = Omit<
  Partial<CreateViewNode>,
  'kind' | 'name'
>

export interface CreateViewNode extends OperationNode {
  readonly kind: 'CreateViewNode'
  readonly name: IdentifierNode
  readonly materialized?: boolean
  readonly orReplace?: boolean
  readonly ifNotExists?: boolean
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly as?: SelectQueryNode | RawNode
}

/**
 * @internal
 */
export const CreateViewNode = freeze({
  is(node: OperationNode): node is CreateViewNode {
    return node.kind === 'CreateViewNode'
  },

  create(name: string): CreateViewNode {
    return freeze({
      kind: 'CreateViewNode',
      name: IdentifierNode.create(name),
    })
  },

  cloneWith(
    createView: CreateViewNode,
    params: CreateViewNodeParams
  ): CreateViewNode {
    return freeze({
      ...createView,
      ...params,
    })
  },
})
