import { freeze } from '../util/object-utils.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ReturningNode } from './returning-node.js'
import { ValueListNode } from './value-list-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { FromNode } from './from-node.js'
import { ExplainNode } from './explain-node.js'
import {UpdateModifierNode} from './update-modifier-node.js'

export type UpdateValuesNode = ValueListNode | PrimitiveValueListNode

export interface UpdateQueryNode extends OperationNode {
  readonly kind: 'UpdateQueryNode'
  readonly table?: OperationNode
  readonly from?: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly returning?: ReturningNode
  readonly with?: WithNode
  readonly explain?: ExplainNode
  readonly frontModifiers?: ReadonlyArray<UpdateModifierNode>
  readonly endModifiers?: ReadonlyArray<UpdateModifierNode>
}

/**
 * @internal
 */
export const UpdateQueryNode = freeze({
  is(node: OperationNode): node is UpdateQueryNode {
    return node.kind === 'UpdateQueryNode'
  },

  create(table: OperationNode, withNode?: WithNode): UpdateQueryNode {
    return freeze({
      kind: 'UpdateQueryNode',
      table,
      ...(withNode && { with: withNode }),
    })
  },

  createWithoutTable(): UpdateQueryNode {
    return freeze({
      kind: 'UpdateQueryNode',
    })
  },

  cloneWithFromItems(
    updateQuery: UpdateQueryNode,
    fromItems: ReadonlyArray<OperationNode>,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      from: updateQuery.from
        ? FromNode.cloneWithFroms(updateQuery.from, fromItems)
        : FromNode.create(fromItems),
    })
  },

  cloneWithFrontModifier(
    updateQuery: UpdateQueryNode,
    modifier: UpdateModifierNode,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      frontModifiers: updateQuery.frontModifiers
        ? freeze([...updateQuery.frontModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithEndModifier(
    updateQuery: UpdateQueryNode,
    modifier: UpdateModifierNode,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      endModifiers: updateQuery.endModifiers
        ? freeze([...updateQuery.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithUpdates(
    updateQuery: UpdateQueryNode,
    updates: ReadonlyArray<ColumnUpdateNode>,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      updates: updateQuery.updates
        ? freeze([...updateQuery.updates, ...updates])
        : updates,
    })
  },

  createWithExpression(modifier: OperationNode): UpdateModifierNode {
    return freeze({
      kind: 'UpdateModifierNode',
      rawModifier: modifier,
    })
  },
})
