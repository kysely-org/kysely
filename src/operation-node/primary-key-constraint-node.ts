import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface PrimaryKeyConstraintNode extends OperationNode {
  readonly kind: 'PrimaryKeyConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
  readonly deferrable?: boolean
  readonly initiallyDeferred?: boolean
}

export type PrimaryKeyConstraintNodeProps = Omit<
  Partial<PrimaryKeyConstraintNode>,
  'kind'
>

/**
 * @internal
 */
export const PrimaryKeyConstraintNode = freeze({
  is(node: OperationNode): node is PrimaryKeyConstraintNode {
    return node.kind === 'PrimaryKeyConstraintNode'
  },

  create(columns: string[], constraintName?: string): PrimaryKeyConstraintNode {
    return freeze({
      kind: 'PrimaryKeyConstraintNode',
      columns: freeze(columns.map(ColumnNode.create)),
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },

  cloneWith(
    node: PrimaryKeyConstraintNode,
    props: PrimaryKeyConstraintNodeProps,
  ): PrimaryKeyConstraintNode {
    return freeze({ ...node, ...props })
  },
})

/**
 * Backwards compatibility for a typo in the codebase.
 *
 * @deprecated Use {@link PrimaryKeyConstraintNode} instead.
 */
export const PrimaryConstraintNode = PrimaryKeyConstraintNode
