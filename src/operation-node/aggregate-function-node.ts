import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { OverNode } from './over-node.js'
import { ReferenceNode } from './reference-node.js'

type AggregateFunction = 'avg' | 'count' | 'max' | 'min' | 'sum'

export interface AggregateFunctionNode extends OperationNode {
  readonly kind: 'AggregateFunctionNode'
  readonly func: AggregateFunction
  readonly column: ColumnNode | ReferenceNode
  readonly distinct?: boolean
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
    column: ColumnNode | ReferenceNode
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
