import type { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'

export type DropConstraintNodeProps = Omit<
  DropConstraintNode,
  'kind' | 'constraintName'
>

export interface DropConstraintNode extends OperationNode {
  readonly kind: 'DropConstraintNode'
  readonly constraintName: IdentifierNode
  readonly ifExists?: boolean
  readonly modifier?: 'cascade' | 'restrict'
}

type DropConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is DropConstraintNode
  create(
    constraintName: string,
    params?: DropConstraintNodeProps,
  ): Readonly<DropConstraintNode>
  cloneWith(
    dropConstraint: DropConstraintNode,
    props: DropConstraintNodeProps,
  ): Readonly<DropConstraintNode>
}>

/**
 * @internal
 */
export const DropConstraintNode: DropConstraintNodeFactory =
  freeze<DropConstraintNodeFactory>({
    is(node): node is DropConstraintNode {
      return node.kind === 'DropConstraintNode'
    },

    create(constraintName) {
      return freeze({
        kind: 'DropConstraintNode',
        constraintName: IdentifierNode.create(constraintName),
      })
    },

    cloneWith(dropConstraint, props) {
      return freeze({
        ...dropConstraint,
        ...props,
      })
    },
  })
