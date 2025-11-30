import { freeze } from '../util/object-utils.js'
import type { CommonTableExpressionNameNode } from './common-table-expression-name-node.js'
import type { OperationNode } from './operation-node.js'

type CommonTableExpressionNodeProps = Pick<
  CommonTableExpressionNode,
  'materialized'
>

export interface CommonTableExpressionNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNode'
  readonly name: CommonTableExpressionNameNode
  readonly materialized?: boolean
  readonly expression: OperationNode
}

type CommonTableExpressionNodeFactory = Readonly<{
  is(node: OperationNode): node is CommonTableExpressionNode
  create(
    name: CommonTableExpressionNameNode,
    expression: OperationNode,
  ): Readonly<CommonTableExpressionNode>
  cloneWith(
    node: CommonTableExpressionNode,
    props: CommonTableExpressionNodeProps,
  ): Readonly<CommonTableExpressionNode>
}>

/**
 * @internal
 */
export const CommonTableExpressionNode: CommonTableExpressionNodeFactory =
  freeze<CommonTableExpressionNodeFactory>({
    is(node): node is CommonTableExpressionNode {
      return node.kind === 'CommonTableExpressionNode'
    },

    create(name, expression) {
      return freeze({
        kind: 'CommonTableExpressionNode',
        name,
        expression,
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },
  })
