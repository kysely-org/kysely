import { OperationNode } from './operation-node.js'
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

/**
 * @internal
 */
export const DropConstraintNode = freeze({
  is(node: OperationNode): node is DropConstraintNode {
    return node.kind === 'DropConstraintNode'
  },

  create(constraintName: string): DropConstraintNode {
    return freeze({
      kind: 'DropConstraintNode',
      constraintName: IdentifierNode.create(constraintName),
    })
  },

  cloneWith(
    dropConstraint: DropConstraintNode,
    props: DropConstraintNodeProps,
  ): DropConstraintNode {
    return freeze({
      ...dropConstraint,
      ...props,
    })
  },
})
