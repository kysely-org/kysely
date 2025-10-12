import { logOnce } from '../util/log-once.js'
import { freeze, isString } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface UniqueConstraintNode extends OperationNode {
  readonly kind: 'UniqueConstraintNode'
  readonly columns: ReadonlyArray<OperationNode>
  readonly name?: IdentifierNode
  readonly nullsNotDistinct?: boolean
  readonly deferrable?: boolean
  readonly initiallyDeferred?: boolean
}

export type UniqueConstraintNodeProps = Omit<
  Partial<UniqueConstraintNode>,
  'kind'
>

/**
 * TODO: remove this interface once support for `string[]` is removed.
 *
 * @internal
 */
interface UniqueConstraintNodeFactory {
  is(node: OperationNode): node is UniqueConstraintNode
  create(
    columns: OperationNode[],
    constraintName?: string,
    nullsNotDistinct?: boolean,
  ): UniqueConstraintNode
  /**
   * @deprecated pass `ColumnNode[]` instead of strings.
   */
  create(
    columns: string[],
    constraintName?: string,
    nullsNotDistinct?: boolean,
  ): UniqueConstraintNode
  cloneWith(
    node: UniqueConstraintNode,
    props: UniqueConstraintNodeProps,
  ): UniqueConstraintNode
}

/**
 * @internal
 */
export const UniqueConstraintNode: UniqueConstraintNodeFactory = freeze({
  is(node: OperationNode): node is UniqueConstraintNode {
    return node.kind === 'UniqueConstraintNode'
  },

  create(
    columns: string[] | OperationNode[],
    constraintName?: string,
    nullsNotDistinct?: boolean,
  ): UniqueConstraintNode {
    // TODO: remove this block when support for `string[]` is removed.
    if (isString(columns.at(0))) {
      logOnce(
        '`UniqueConstraintNode.create(columns: string[], ...)` is deprecated - pass `ColumnNode[]` instead.',
      )

      columns = (columns as string[]).map(ColumnNode.create)
    }

    return freeze({
      kind: 'UniqueConstraintNode',
      columns: freeze(columns) as OperationNode[],
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
      nullsNotDistinct,
    })
  },

  cloneWith(
    node: UniqueConstraintNode,
    props: UniqueConstraintNodeProps,
  ): UniqueConstraintNode {
    return freeze({ ...node, ...props })
  },
})

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
