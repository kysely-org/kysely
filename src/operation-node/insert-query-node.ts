import { freeze } from '../util/object-utils.js'
import type { ColumnNode } from './column-node.js'
import type { ExplainNode } from './explain-node.js'
import type { OnConflictNode } from './on-conflict-node.js'
import type { OnDuplicateKeyNode } from './on-duplicate-key-node.js'
import type { OperationNode } from './operation-node.js'
import type { OrActionNode } from './or-action-node.js'
import type { OutputNode } from './output-node.js'
import type { ReturningNode } from './returning-node.js'
import type { TableNode } from './table-node.js'
import type { TopNode } from './top-node.js'
import type { WithNode } from './with-node.js'

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
  // TODO: remove in 0.29
  /** @deprecated use {@link orAction} instead. */
  readonly ignore?: boolean
  readonly orAction?: OrActionNode
  readonly replace?: boolean
  readonly explain?: ExplainNode
  readonly defaultValues?: boolean
  readonly endModifiers?: ReadonlyArray<OperationNode>
  readonly top?: TopNode
  readonly output?: OutputNode
}

type InsertQueryNodeFactory = Readonly<{
  is(node: OperationNode): node is InsertQueryNode
  create(
    into: TableNode,
    withNode?: WithNode,
    replace?: boolean,
  ): Readonly<InsertQueryNode>
  createWithoutInto(): Readonly<InsertQueryNode>
  cloneWith(
    insertQuery: InsertQueryNode,
    props: InsertQueryNodeProps,
  ): Readonly<InsertQueryNode>
}>

/**
 * @internal
 */
export const InsertQueryNode: InsertQueryNodeFactory =
  freeze<InsertQueryNodeFactory>({
    is(node): node is InsertQueryNode {
      return node.kind === 'InsertQueryNode'
    },

    create(into, withNode?, replace?) {
      return freeze({
        kind: 'InsertQueryNode',
        into,
        ...(withNode && { with: withNode }),
        replace,
      })
    },

    createWithoutInto() {
      return freeze({
        kind: 'InsertQueryNode',
      })
    },

    cloneWith(insertQuery, props) {
      return freeze({
        ...insertQuery,
        ...props,
      })
    },
  })
