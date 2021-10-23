import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OnConflictNode } from './on-conflict-node.js'
import { OnDuplicateKeyNode } from './on-duplicate-key-node.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ReturningNode } from './returning-node.js'
import { TableNode } from './table-node.js'
import { ValueListNode } from './value-list-node.js'
import { WithNode } from './with-node.js'

export type InsertValuesNode = ValueListNode | PrimitiveValueListNode
export type InsertQueryNodeProps = Omit<InsertQueryNode, 'kind' | 'into'>

export interface InsertQueryNode extends OperationNode {
  readonly kind: 'InsertQueryNode'
  readonly into: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly values?: ReadonlyArray<InsertValuesNode>
  readonly returning?: ReturningNode
  readonly onConflict?: OnConflictNode
  readonly onDuplicateKey?: OnDuplicateKeyNode
  readonly with?: WithNode
  readonly ignore?: boolean
}

/**
 * @internal
 */
export const InsertQueryNode = freeze({
  is(node: OperationNode): node is InsertQueryNode {
    return node.kind === 'InsertQueryNode'
  },

  create(into: TableNode, withNode?: WithNode): InsertQueryNode {
    return freeze({
      kind: 'InsertQueryNode',
      into,
      ...(withNode && { with: withNode }),
    })
  },

  cloneWith(
    insertQuery: InsertQueryNode,
    props: InsertQueryNodeProps
  ): InsertQueryNode {
    return freeze({
      ...insertQuery,
      ...props,
    })
  },
})
