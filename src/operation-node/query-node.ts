import { InsertQueryNode } from './insert-query-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { UpdateQueryNode } from './update-query-node.js'
import { DeleteQueryNode } from './delete-query-node.js'
import { WhereNode } from './where-node.js'
import { freeze } from '../util/object-utils.js'
import { JoinNode } from './join-node.js'
import { SelectionNode } from './selection-node.js'
import { ReturningNode } from './returning-node.js'
import { OperationNode } from './operation-node.js'
import { ExplainNode } from './explain-node.js'
import { ExplainFormat } from '../util/explainable.js'
import { Expression } from '../expression/expression.js'

export type QueryNode =
  | SelectQueryNode
  | InsertQueryNode
  | UpdateQueryNode
  | DeleteQueryNode

type HasJoins = { joins?: ReadonlyArray<JoinNode> }
type HasWhere = { where?: WhereNode }
type HasReturning = { returning?: ReturningNode }
type HasExplain = { explain?: ExplainNode }

/**
 * @internal
 */
export const QueryNode = freeze({
  is(node: OperationNode): node is QueryNode {
    return (
      SelectQueryNode.is(node) ||
      InsertQueryNode.is(node) ||
      UpdateQueryNode.is(node) ||
      DeleteQueryNode.is(node)
    )
  },

  cloneWithWhere<T extends HasWhere>(node: T, operation: OperationNode): T {
    return freeze({
      ...node,
      where: node.where
        ? WhereNode.cloneWithOperation(node.where, 'And', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithJoin<T extends HasJoins>(node: T, join: JoinNode): T {
    return freeze({
      ...node,
      joins: node.joins ? freeze([...node.joins, join]) : freeze([join]),
    })
  },

  cloneWithReturning<T extends HasReturning>(
    node: T,
    selections: ReadonlyArray<SelectionNode>
  ): T {
    return freeze({
      ...node,
      returning: node.returning
        ? ReturningNode.cloneWithSelections(node.returning, selections)
        : ReturningNode.create(selections),
    })
  },

  cloneWithoutWhere<T extends HasWhere>(node: T): T {
    return freeze({
      ...node,
      where: undefined,
    })
  },

  cloneWithExplain<T extends HasExplain>(
    node: T,
    format: ExplainFormat | undefined,
    options: Expression<any> | undefined
  ): T {
    return freeze({
      ...node,
      explain: ExplainNode.create(format, options?.toOperationNode()),
    })
  },
})
