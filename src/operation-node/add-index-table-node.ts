import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface AddIndexTableNode extends OperationNode {
  readonly kind: 'AddIndexTableNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
}

export type AddIndexTableNodeProps = Omit<Partial<AddIndexTableNode>, 'kind'>

/**
 * @internal
 */
export const AddIndexTableNode = freeze({
  is(node: OperationNode): node is AddIndexTableNode {
    return node.kind === 'AddIndexTableNode'
  },

  create(columns: string[], indexName?: string): AddIndexTableNode {
    return freeze({
      kind: 'AddIndexTableNode',
      columns: freeze(columns.map(ColumnNode.create)),
      name: indexName ? IdentifierNode.create(indexName) : undefined,
    })
  },

  cloneWith(
    node: AddIndexTableNode,
    props: AddIndexTableNodeProps,
  ): AddIndexTableNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
