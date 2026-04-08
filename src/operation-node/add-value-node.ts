import type { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import type { ValueNode } from './value-node.js'

export type AddValueNodeProps = Omit<AddValueNode, 'kind' | 'value'>

export interface AddValueNode extends OperationNode {
  readonly kind: 'AddValueNode'
  readonly value: ValueNode
  readonly ifNotExists?: boolean
  readonly neighborValue?: ValueNode
  readonly isBefore?: boolean
}

type AddValueNodeFactory = Readonly<{
  is(node: OperationNode): node is AddValueNode
  create(value: ValueNode): Readonly<AddValueNode>
  cloneWith(
    node: AddValueNode,
    props: AddValueNodeProps,
  ): Readonly<AddValueNode>
}>

/**
 * @internal
 */
export const AddValueNode: AddValueNodeFactory = freeze<AddValueNodeFactory>({
  is(node): node is AddValueNode {
    return node.kind === 'AddValueNode'
  },

  create(value) {
    return freeze({
      kind: 'AddValueNode',
      value,
    })
  },

  cloneWith(node, props) {
    return freeze({
      ...node,
      ...props,
    })
  },
})
