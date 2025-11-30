import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly froms: ReadonlyArray<OperationNode>
}

type FromNodeFactory = Readonly<{
  is(node: OperationNode): node is FromNode
  create(froms: ReadonlyArray<OperationNode>): Readonly<FromNode>
  cloneWithFroms(
    from: FromNode,
    froms: ReadonlyArray<OperationNode>,
  ): Readonly<FromNode>
}>

/**
 * @internal
 */
export const FromNode: FromNodeFactory = freeze<FromNodeFactory>({
  is(node): node is FromNode {
    return node.kind === 'FromNode'
  },

  create(froms) {
    return freeze({
      kind: 'FromNode',
      froms: freeze(froms),
    })
  },

  cloneWithFroms(from, froms) {
    return freeze({
      ...from,
      froms: freeze([...from.froms, ...froms]),
    })
  },
})
