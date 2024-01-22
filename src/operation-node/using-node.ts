import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface UsingNode extends OperationNode {
  readonly kind: 'UsingNode'
  readonly tables: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const UsingNode = freeze({
  is(node: OperationNode): node is UsingNode {
    return node.kind === 'UsingNode'
  },

  create(tables: ReadonlyArray<OperationNode>): UsingNode {
    return freeze({
      kind: 'UsingNode',
      tables: freeze(tables),
    })
  },

  cloneWithTables(
    using: UsingNode,
    tables: ReadonlyArray<OperationNode>,
  ): UsingNode {
    return freeze({
      ...using,
      tables: freeze([...using.tables, ...tables]),
    })
  },
})
