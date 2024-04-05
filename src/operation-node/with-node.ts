import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { CommonTableExpressionNode } from './common-table-expression-node.js'

export type WithNodeParams = Omit<WithNode, 'kind' | 'expressions'>

export interface WithNode extends OperationNode {
  readonly kind: 'WithNode'
  readonly expressions: ReadonlyArray<CommonTableExpressionNode>
  readonly recursive?: RecursiveOptions
}

export interface RecursiveOptions {
  cycle?: Cycle
  // search: Search
}

export interface Cycle<
  UsingColumn extends string = string,
  SetColumnName extends string = string,
  SetValueType = unknown,
  ColumnList = Array<unknown>,
> {
  columnList: ColumnList
  using: UsingColumn
  set: {
    column: SetColumnName
    default?: SetValueType
    to?: SetValueType
  }
}

/**
 * @internal
 */
export const WithNode = freeze({
  is(node: OperationNode): node is WithNode {
    return node.kind === 'WithNode'
  },

  create(
    expression: CommonTableExpressionNode,
    params?: WithNodeParams,
  ): WithNode {
    return freeze({
      kind: 'WithNode',
      expressions: freeze([expression]),
      ...params,
    })
  },

  cloneWithExpression(
    withNode: WithNode,
    expression: CommonTableExpressionNode,
  ): WithNode {
    return freeze({
      ...withNode,
      expressions: freeze([...withNode.expressions, expression]),
    })
  },
})
