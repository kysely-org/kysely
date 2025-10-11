import { freeze } from '../util/object-utils.js'
import { AliasNode } from './alias-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { OutputNode } from './output-node.js'
import { ReturningNode } from './returning-node.js'
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
  readonly returning?: ReturningNode
  readonly output?: OutputNode
  readonly endModifiers?: ReadonlyArray<OperationNode>
}

type MergeQueryNodeFactory = Readonly<{
  is(node: OperationNode): node is MergeQueryNode
  create(
    into: TableNode | AliasNode,
    withNode?: WithNode,
  ): Readonly<MergeQueryNode>
  cloneWithUsing(
    mergeNode: MergeQueryNode,
    using: JoinNode,
  ): Readonly<MergeQueryNode>
  cloneWithWhen(
    mergeNode: MergeQueryNode,
    when: WhenNode,
  ): Readonly<MergeQueryNode>
  cloneWithThen(
    mergeNode: MergeQueryNode,
    then: OperationNode,
  ): Readonly<MergeQueryNode>
}>

/**
 * @internal
 */
export const MergeQueryNode: MergeQueryNodeFactory =
  freeze<MergeQueryNodeFactory>({
    is(node): node is MergeQueryNode {
      return node.kind === 'MergeQueryNode'
    },

    create(into, withNode?) {
      return freeze({
        kind: 'MergeQueryNode',
        into,
        ...(withNode && { with: withNode }),
      })
    },

    cloneWithUsing(mergeNode, using) {
      return freeze({
        ...mergeNode,
        using,
      })
    },

    cloneWithWhen(mergeNode, when) {
      return freeze({
        ...mergeNode,
        whens: mergeNode.whens
          ? freeze([...mergeNode.whens, when])
          : freeze([when]),
      })
    },

    cloneWithThen(mergeNode, then) {
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
