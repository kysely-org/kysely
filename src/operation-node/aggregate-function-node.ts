import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OverNode } from './over-node.js'
import { WhereNode } from './where-node.js'
import { OrderByNode } from './order-by-node.js'
import { OrderByItemNode } from './order-by-item-node.js'

export interface AggregateFunctionNode extends OperationNode {
  readonly kind: 'AggregateFunctionNode'
  readonly func: string
  readonly aggregated: readonly OperationNode[]
  readonly distinct?: boolean
  readonly orderBy?: OrderByNode
  readonly withinGroup?: OrderByNode
  readonly filter?: WhereNode
  readonly over?: OverNode
}

type AggregateFunctionNodeFactory = Readonly<{
  is(node: OperationNode): node is AggregateFunctionNode
  create(
    aggregateFunction: string,
    aggregated?: readonly OperationNode[],
  ): Readonly<AggregateFunctionNode>
  cloneWithDistinct(
    aggregateFunctionNode: AggregateFunctionNode,
  ): Readonly<AggregateFunctionNode>
  cloneWithOrderBy(
    aggregateFunctionNode: AggregateFunctionNode,
    orderItems: ReadonlyArray<OrderByItemNode>,
    withinGroup?: boolean,
  ): Readonly<AggregateFunctionNode>
  cloneWithFilter(
    aggregateFunctionNode: AggregateFunctionNode,
    filter: OperationNode,
  ): Readonly<AggregateFunctionNode>
  cloneWithOrFilter(
    aggregateFunctionNode: AggregateFunctionNode,
    filter: OperationNode,
  ): Readonly<AggregateFunctionNode>
  cloneWithOver(
    aggregateFunctionNode: AggregateFunctionNode,
    over?: OverNode,
  ): Readonly<AggregateFunctionNode>
}>

/**
 * @internal
 */
export const AggregateFunctionNode: AggregateFunctionNodeFactory =
  freeze<AggregateFunctionNodeFactory>({
    is(node): node is AggregateFunctionNode {
      return node.kind === 'AggregateFunctionNode'
    },

    create(aggregateFunction, aggregated = []) {
      return freeze({
        kind: 'AggregateFunctionNode',
        func: aggregateFunction,
        aggregated,
      })
    },

    cloneWithDistinct(aggregateFunctionNode) {
      return freeze({
        ...aggregateFunctionNode,
        distinct: true,
      })
    },

    cloneWithOrderBy(aggregateFunctionNode, orderItems, withinGroup = false) {
      const prop = withinGroup ? 'withinGroup' : 'orderBy'

      return freeze({
        ...aggregateFunctionNode,
        [prop]: aggregateFunctionNode[prop]
          ? OrderByNode.cloneWithItems(aggregateFunctionNode[prop], orderItems)
          : OrderByNode.create(orderItems),
      })
    },

    cloneWithFilter(aggregateFunctionNode, filter) {
      return freeze({
        ...aggregateFunctionNode,
        filter: aggregateFunctionNode.filter
          ? WhereNode.cloneWithOperation(
              aggregateFunctionNode.filter,
              'And',
              filter,
            )
          : WhereNode.create(filter),
      })
    },

    cloneWithOrFilter(aggregateFunctionNode, filter) {
      return freeze({
        ...aggregateFunctionNode,
        filter: aggregateFunctionNode.filter
          ? WhereNode.cloneWithOperation(
              aggregateFunctionNode.filter,
              'Or',
              filter,
            )
          : WhereNode.create(filter),
      })
    },

    cloneWithOver(aggregateFunctionNode, over?) {
      return freeze({
        ...aggregateFunctionNode,
        over,
      })
    },
  })
