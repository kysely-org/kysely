import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface DefaultInsertValueNode extends OperationNode {
  readonly kind: 'DefaultInsertValueNode'
}

type DefaultInsertValueNodeFactory = Readonly<{
  is(node: OperationNode): node is DefaultInsertValueNode
  create(): Readonly<DefaultInsertValueNode>
}>

/**
 * @internal
 */
export const DefaultInsertValueNode: DefaultInsertValueNodeFactory =
  freeze<DefaultInsertValueNodeFactory>({
    is(node): node is DefaultInsertValueNode {
      return node.kind === 'DefaultInsertValueNode'
    },

    create() {
      return freeze({
        kind: 'DefaultInsertValueNode',
      })
    },
  })
