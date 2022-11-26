import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface UsingNode extends OperationNode {
  readonly kind: 'UsingNode'
  readonly froms: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const UsingNode = freeze({
  is(node: OperationNode): node is UsingNode {
    return node.kind === 'UsingNode'
  },

  create(froms: ReadonlyArray<OperationNode>): UsingNode {
    return freeze({
      kind: 'UsingNode',
      froms: freeze(froms),
    })
  },

  cloneWithFroms(
    using: UsingNode,
    froms: ReadonlyArray<OperationNode>
  ): UsingNode {
    return freeze({
      ...using,
      froms: freeze([...using.froms, ...froms]),
    })
  },
})
