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
import { MergeQueryNode } from './merge-query-node.js'
import { TopNode } from './top-node.js'
import { OutputNode } from './output-node.js'

export type QueryNode =
  | SelectQueryNode
  | InsertQueryNode
  | UpdateQueryNode
  | DeleteQueryNode
  | MergeQueryNode

type HasJoins = { joins?: ReadonlyArray<JoinNode> }
type HasWhere = { where?: WhereNode }
type HasReturning = { returning?: ReturningNode }
type HasExplain = { explain?: ExplainNode }
type HasTop = { top?: TopNode }
type HasOutput = { output?: OutputNode }

/**
 * @internal
 */
export const QueryNode = freeze({
  is(node: OperationNode): node is QueryNode {
    return (
      SelectQueryNode.is(node) ||
      InsertQueryNode.is(node) ||
      UpdateQueryNode.is(node) ||
      DeleteQueryNode.is(node) ||
      MergeQueryNode.is(node)
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
    selections: ReadonlyArray<SelectionNode>,
  ): T {
    return freeze({
      ...node,
      returning: node.returning
        ? ReturningNode.cloneWithSelections(node.returning, selections)
        : ReturningNode.create(selections),
    })
  },

  cloneWithoutReturning<T extends HasReturning>(node: T): T {
    return freeze({
      ...node,
      returning: undefined,
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
    options: Expression<any> | undefined,
  ): T {
    return freeze({
      ...node,
      explain: ExplainNode.create(format, options?.toOperationNode()),
    })
  },

  cloneWithTop<T extends HasTop>(node: T, top: TopNode): T {
    return freeze({
      ...node,
      top,
    })
  },

  cloneWithOutput<T extends HasOutput>(
    node: T,
    selections: ReadonlyArray<SelectionNode>,
  ): T {
    return freeze({
      ...node,
      output: node.output
        ? OutputNode.cloneWithSelections(node.output, selections)
        : OutputNode.create(selections),
    })
  },
})
