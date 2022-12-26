import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { WhereNode } from './where-node.js'

export type OnConflictNodeProps = Omit<
  OnConflictNode,
  'kind' | 'indexWhere' | 'updateWhere'
>

export interface OnConflictNode extends OperationNode {
  readonly kind: 'OnConflictNode'
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly constraint?: IdentifierNode
  readonly indexExpression?: OperationNode
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
    operation: OperationNode
  ): OnConflictNode {
    return freeze({
      ...node,
      indexWhere: node.indexWhere
        ? WhereNode.cloneWithOperation(node.indexWhere, 'And', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithIndexOrWhere(
    node: OnConflictNode,
    operation: OperationNode
  ): OnConflictNode {
    return freeze({
      ...node,
      indexWhere: node.indexWhere
        ? WhereNode.cloneWithOperation(node.indexWhere, 'Or', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithUpdateWhere(
    node: OnConflictNode,
    operation: OperationNode
  ): OnConflictNode {
    return freeze({
      ...node,
      updateWhere: node.updateWhere
        ? WhereNode.cloneWithOperation(node.updateWhere, 'And', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithUpdateOrWhere(
    node: OnConflictNode,
    operation: OperationNode
  ): OnConflictNode {
    return freeze({
      ...node,
      updateWhere: node.updateWhere
        ? WhereNode.cloneWithOperation(node.updateWhere, 'Or', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithoutIndexWhere(node: OnConflictNode):OnConflictNode {
    return freeze({
      ...node,
      indexWhere: undefined,
    })
  },

  cloneWithoutUpdateWhere(node: OnConflictNode):OnConflictNode {
    return freeze({
      ...node,
      updateWhere: undefined,
    })
  }
})
