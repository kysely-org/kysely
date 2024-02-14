import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ExplainNode } from './explain-node.js'
import { OnConflictNode } from './on-conflict-node.js'
import { OnDuplicateKeyNode } from './on-duplicate-key-node.js'
import { OperationNode } from './operation-node.js'
import { OutputNode } from './output-node.js'
import { ReturningNode } from './returning-node.js'
import { TableNode } from './table-node.js'
import { WithNode } from './with-node.js'

export type InsertQueryNodeProps = Omit<InsertQueryNode, 'kind' | 'into'>

export interface InsertQueryNode extends OperationNode {
  readonly kind: 'InsertQueryNode'
  readonly into?: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly values?: OperationNode
  readonly returning?: ReturningNode
  readonly onConflict?: OnConflictNode
  readonly onDuplicateKey?: OnDuplicateKeyNode
  readonly with?: WithNode
  readonly ignore?: boolean
  readonly replace?: boolean
  readonly explain?: ExplainNode
  readonly defaultValues?: boolean
  readonly output?: OutputNode
}

/**
 * @internal
 */
export const InsertQueryNode = freeze({
  is(node: OperationNode): node is InsertQueryNode {
    return node.kind === 'InsertQueryNode'
  },

  create(
    into: TableNode,
    withNode?: WithNode,
    replace?: boolean,
  ): InsertQueryNode {
    return freeze({
      kind: 'InsertQueryNode',
      into,
      ...(withNode && { with: withNode }),
      replace,
    })
  },

  createWithoutInto(): InsertQueryNode {
    return freeze({
      kind: 'InsertQueryNode',
    })
  },

  cloneWith(
    insertQuery: InsertQueryNode,
    props: InsertQueryNodeProps,
  ): InsertQueryNode {
    return freeze({
      ...insertQuery,
      ...props,
    })
  },
})
