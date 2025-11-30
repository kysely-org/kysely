import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface UsingNode extends OperationNode {
  readonly kind: 'UsingNode'
  readonly tables: ReadonlyArray<OperationNode>
}

type UsingNodeFactory = Readonly<{
  is(node: OperationNode): node is UsingNode
  create(tables: ReadonlyArray<OperationNode>): Readonly<UsingNode>
  cloneWithTables(
    using: UsingNode,
    tables: ReadonlyArray<OperationNode>,
  ): Readonly<UsingNode>
}>

/**
 * @internal
 */
export const UsingNode: UsingNodeFactory = freeze<UsingNodeFactory>({
  is(node): node is UsingNode {
    return node.kind === 'UsingNode'
  },

  create(tables) {
    return freeze({
      kind: 'UsingNode',
      tables: freeze(tables),
    })
  },

  cloneWithTables(using, tables) {
    return freeze({
      ...using,
      tables: freeze([...using.tables, ...tables]),
    })
  },
})
