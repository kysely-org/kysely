import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ValueNode } from './value-node.js'

export type AddValueNodeProps = Omit<AddValueNode, 'kind' | 'value'>

export interface AddValueNode extends OperationNode {
  readonly kind: 'AddValueNode'
  readonly value: ValueNode
  ifNotExists?: boolean
  before?: ValueNode
  after?: ValueNode
}

/**
 * @internal
 */
export const AddValueNode = freeze({
  is(node: OperationNode): node is AddValueNode {
    return node.kind === 'AddValueNode'
  },
  create(value: ValueNode): AddValueNode {
    return freeze({
      kind: 'AddValueNode',
      value,
    })
  },

  cloneWithAddValueProps(
    node: AddValueNode,
    props: AddValueNodeProps,
  ): AddValueNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
