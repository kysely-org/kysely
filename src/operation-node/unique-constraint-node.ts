import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface UniqueConstraintNode extends OperationNode {
  readonly kind: 'UniqueConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
  readonly nullsNotDistinct?: boolean
  readonly deferrable?: boolean
  readonly initiallyDeferred?: boolean
}

export type UniqueConstraintNodeProps = Omit<
  Partial<UniqueConstraintNode>,
  'kind'
>

type UniqueConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is UniqueConstraintNode
  create(
    columns: string[],
    constraintName?: string,
    nullsNotDistinct?: boolean,
  ): Readonly<UniqueConstraintNode>
  cloneWith(
    node: UniqueConstraintNode,
    props: UniqueConstraintNodeProps,
  ): Readonly<UniqueConstraintNode>
}>

/**
 * @internal
 */
export const UniqueConstraintNode: UniqueConstraintNodeFactory =
  freeze<UniqueConstraintNodeFactory>({
    is(node): node is UniqueConstraintNode {
      return node.kind === 'UniqueConstraintNode'
    },

    create(columns, constraintName?, nullsNotDistinct?) {
      return freeze({
        kind: 'UniqueConstraintNode',
        columns: freeze(columns.map(ColumnNode.create)),
        name: constraintName
          ? IdentifierNode.create(constraintName)
          : undefined,
        nullsNotDistinct,
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },
  })
