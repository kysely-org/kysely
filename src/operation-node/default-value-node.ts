import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface DefaultValueNode extends OperationNode {
  readonly kind: 'DefaultValueNode'
  readonly defaultValue: OperationNode
}

type DefaultValueNodeFactory = Readonly<{
  is(node: OperationNode): node is DefaultValueNode
  create(defaultValue: OperationNode): Readonly<DefaultValueNode>
}>

/**
 * @internal
 */
export const DefaultValueNode: DefaultValueNodeFactory =
  freeze<DefaultValueNodeFactory>({
    is(node): node is DefaultValueNode {
      return node.kind === 'DefaultValueNode'
    },

    create(defaultValue) {
      return freeze({
        kind: 'DefaultValueNode',
        defaultValue,
      })
    },
  })
