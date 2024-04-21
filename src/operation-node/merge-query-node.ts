import { freeze } from '../util/object-utils.js'
import { AliasNode } from './alias-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { OutputNode } from './output-node.js'
import { TableNode } from './table-node.js'
import { TopNode } from './top-node.js'
import { WhenNode } from './when-node.js'
import { WithNode } from './with-node.js'

export interface MergeQueryNode extends OperationNode {
  readonly kind: 'MergeQueryNode'
  readonly into: TableNode | AliasNode
  readonly using?: JoinNode
  readonly whens?: ReadonlyArray<WhenNode>
  readonly with?: WithNode
  readonly top?: TopNode
  readonly output?: OutputNode
}

/**
 * @internal
 */
export const MergeQueryNode = freeze({
  is(node: OperationNode): node is MergeQueryNode {
    return node.kind === 'MergeQueryNode'
  },

  create(into: TableNode | AliasNode, withNode?: WithNode): MergeQueryNode {
    return freeze({
      kind: 'MergeQueryNode',
      into,
      ...(withNode && { with: withNode }),
    })
  },

  cloneWithUsing(mergeNode: MergeQueryNode, using: JoinNode): MergeQueryNode {
    return freeze({
      ...mergeNode,
      using,
    })
  },

  cloneWithWhen(mergeNode: MergeQueryNode, when: WhenNode): MergeQueryNode {
    return freeze({
      ...mergeNode,
      whens: mergeNode.whens
        ? freeze([...mergeNode.whens, when])
        : freeze([when]),
    })
  },

  cloneWithThen(
    mergeNode: MergeQueryNode,
    then: OperationNode,
  ): MergeQueryNode {
    return freeze({
      ...mergeNode,
      whens: mergeNode.whens
        ? freeze([
            ...mergeNode.whens.slice(0, -1),
            WhenNode.cloneWithResult(
              mergeNode.whens[mergeNode.whens.length - 1],
              then,
            ),
          ])
        : undefined,
    })
  },
})
