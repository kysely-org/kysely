import { freeze } from '../util/object-utils.js'
import type { ColumnNode } from './column-node.js'
import type { ColumnUpdateNode } from './column-update-node.js'
import type { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'
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

type OnConflictNodeFactory = Readonly<{
  is(node: OperationNode): node is OnConflictNode
  create(): Readonly<OnConflictNode>
  cloneWith(
    node: OnConflictNode,
    props: OnConflictNodeProps,
  ): Readonly<OnConflictNode>
  cloneWithIndexWhere(
    node: OnConflictNode,
    operation: OperationNode,
  ): Readonly<OnConflictNode>
  cloneWithIndexOrWhere(
    node: OnConflictNode,
    operation: OperationNode,
  ): Readonly<OnConflictNode>
  cloneWithUpdateWhere(
    node: OnConflictNode,
    operation: OperationNode,
  ): Readonly<OnConflictNode>
  cloneWithUpdateOrWhere(
    node: OnConflictNode,
    operation: OperationNode,
  ): Readonly<OnConflictNode>
  cloneWithoutIndexWhere(node: OnConflictNode): Readonly<OnConflictNode>
  cloneWithoutUpdateWhere(node: OnConflictNode): Readonly<OnConflictNode>
}>
/**
 * @internal
 */
export const OnConflictNode: OnConflictNodeFactory =
  freeze<OnConflictNodeFactory>({
    is(node): node is OnConflictNode {
      return node.kind === 'OnConflictNode'
    },

    create() {
      return freeze({
        kind: 'OnConflictNode',
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },

    cloneWithIndexWhere(node, operation) {
      return freeze({
        ...node,
        indexWhere: node.indexWhere
          ? WhereNode.cloneWithOperation(node.indexWhere, 'And', operation)
          : WhereNode.create(operation),
      })
    },

    cloneWithIndexOrWhere(node, operation) {
      return freeze({
        ...node,
        indexWhere: node.indexWhere
          ? WhereNode.cloneWithOperation(node.indexWhere, 'Or', operation)
          : WhereNode.create(operation),
      })
    },

    cloneWithUpdateWhere(node, operation) {
      return freeze({
        ...node,
        updateWhere: node.updateWhere
          ? WhereNode.cloneWithOperation(node.updateWhere, 'And', operation)
          : WhereNode.create(operation),
      })
    },

    cloneWithUpdateOrWhere(node, operation) {
      return freeze({
        ...node,
        updateWhere: node.updateWhere
          ? WhereNode.cloneWithOperation(node.updateWhere, 'Or', operation)
          : WhereNode.create(operation),
      })
    },

    cloneWithoutIndexWhere(node) {
      return freeze({
        ...node,
        indexWhere: undefined,
      })
    },

    cloneWithoutUpdateWhere(node) {
      return freeze({
        ...node,
        updateWhere: undefined,
      })
    },
  })
