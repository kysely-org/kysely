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

type PrimaryKeyConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is PrimaryKeyConstraintNode
  create(
    columns: string[],
    constraintName?: string,
  ): Readonly<PrimaryKeyConstraintNode>
  cloneWith(
    node: PrimaryKeyConstraintNode,
    props: PrimaryKeyConstraintNodeProps,
  ): Readonly<PrimaryKeyConstraintNode>
}>

/**
 * @internal
 */
export const PrimaryKeyConstraintNode: PrimaryKeyConstraintNodeFactory =
  freeze<PrimaryKeyConstraintNodeFactory>({
    is(node): node is PrimaryKeyConstraintNode {
      return node.kind === 'PrimaryKeyConstraintNode'
    },

    create(columns, constraintName?) {
      return freeze({
        kind: 'PrimaryKeyConstraintNode',
        columns: freeze(columns.map(ColumnNode.create)),
        name: constraintName
          ? IdentifierNode.create(constraintName)
          : undefined,
      })
    },

    cloneWith(node, props) {
      return freeze({ ...node, ...props })
    },
  })

/**
 * Backwards compatibility for a typo in the codebase.
 *
 * @deprecated Use {@link PrimaryKeyConstraintNode} instead.
 */
export const PrimaryConstraintNode = PrimaryKeyConstraintNode
