import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { IdentifierNode } from './identifier-node.js'
import { FilterExpressionNode } from './operation-node-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { WhereNode } from './where-node.js'

export type OnConflictNodeProps = Omit<
  OnConflictNode,
  'kind' | 'indexWhere' | 'updateWhere'
>

export interface OnConflictNode extends OperationNode {
  readonly kind: 'OnConflictNode'
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly constraint?: IdentifierNode
  readonly indexExpression?: RawNode
  readonly indexWhere?: WhereNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly updateWhere?: WhereNode
  readonly doNothing?: boolean
}

/**
 * @internal
 */
export const OnConflictNode = freeze({
  is(node: OperationNode): node is OnConflictNode {
    return node.kind === 'OnConflictNode'
  },

  create(): OnConflictNode {
    return freeze({
      kind: 'OnConflictNode',
    })
  },

  cloneWith(node: OnConflictNode, props: OnConflictNodeProps): OnConflictNode {
    return freeze({
      ...node,
      ...props,
    })
  },

  cloneWithIndexWhere(
    node: OnConflictNode,
    filter: FilterExpressionNode
  ): OnConflictNode {
    return freeze({
      ...node,
      indexWhere: node.indexWhere
        ? WhereNode.cloneWithFilter(node.indexWhere, 'And', filter)
        : WhereNode.create(filter),
    })
  },

  cloneWithIndexOrWhere(
    node: OnConflictNode,
    filter: FilterExpressionNode
  ): OnConflictNode {
    return freeze({
      ...node,
      indexWhere: node.indexWhere
        ? WhereNode.cloneWithFilter(node.indexWhere, 'Or', filter)
        : WhereNode.create(filter),
    })
  },

  cloneWithUpdateWhere(
    node: OnConflictNode,
    filter: FilterExpressionNode
  ): OnConflictNode {
    return freeze({
      ...node,
      updateWhere: node.updateWhere
        ? WhereNode.cloneWithFilter(node.updateWhere, 'And', filter)
        : WhereNode.create(filter),
    })
  },

  cloneWithUpdateOrWhere(
    node: OnConflictNode,
    filter: FilterExpressionNode
  ): OnConflictNode {
    return freeze({
      ...node,
      updateWhere: node.updateWhere
        ? WhereNode.cloneWithFilter(node.updateWhere, 'Or', filter)
        : WhereNode.create(filter),
    })
  },
})
