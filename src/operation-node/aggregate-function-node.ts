import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OverNode } from './over-node.js'
import { SimpleReferenceExpressionNode } from './simple-reference-expression-node.js'
import { WhereNode } from './where-node.js'

type AggregateFunction = 'avg' | 'count' | 'max' | 'min' | 'sum'

export interface AggregateFunctionNode extends OperationNode {
  readonly kind: 'AggregateFunctionNode'
  readonly func: AggregateFunction
  readonly column: SimpleReferenceExpressionNode
  readonly distinct?: boolean
  readonly filter?: WhereNode
  readonly over?: OverNode
}

/**
 * @internal
 */
export const AggregateFunctionNode = freeze({
  is(node: OperationNode): node is AggregateFunctionNode {
    return node.kind === 'AggregateFunctionNode'
  },

  create(
    aggregateFunction: AggregateFunction,
    column: SimpleReferenceExpressionNode
  ): AggregateFunctionNode {
    return freeze({
      kind: 'AggregateFunctionNode',
      func: aggregateFunction,
      column,
    })
  },

  cloneWithDistinct(
    aggregateFunctionNode: AggregateFunctionNode
  ): AggregateFunctionNode {
    return freeze({
      ...aggregateFunctionNode,
      distinct: true,
    })
  },

  cloneWithFilter(
    aggregateFunctionNode: AggregateFunctionNode,
    filter: OperationNode
  ): AggregateFunctionNode {
    return freeze({
      ...aggregateFunctionNode,
      filter: aggregateFunctionNode.filter
        ? WhereNode.cloneWithOperation(
            aggregateFunctionNode.filter,
            'And',
            filter
          )
        : WhereNode.create(filter),
    })
  },

  cloneWithOrFilter(
    aggregateFunctionNode: AggregateFunctionNode,
    filter: OperationNode
  ): AggregateFunctionNode {
    return freeze({
      ...aggregateFunctionNode,
      filter: aggregateFunctionNode.filter
        ? WhereNode.cloneWithOperation(
            aggregateFunctionNode.filter,
            'Or',
            filter
          )
        : WhereNode.create(filter),
    })
  },

  cloneWithOver(
    aggregateFunctionNode: AggregateFunctionNode,
    over?: OverNode
  ): AggregateFunctionNode {
    return freeze({
      ...aggregateFunctionNode,
      over,
    })
  },
})
