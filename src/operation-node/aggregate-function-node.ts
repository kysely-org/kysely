import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OverNode } from './over-node.js'
import { WhereNode } from './where-node.js'

export interface AggregateFunctionNode extends OperationNode {
  readonly kind: 'AggregateFunctionNode'
  readonly func: string
  readonly aggregated: readonly OperationNode[]
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
    aggregateFunction: string,
    aggregated: readonly OperationNode[] = []
  ): AggregateFunctionNode {
    return freeze({
      kind: 'AggregateFunctionNode',
      func: aggregateFunction,
      aggregated,
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
