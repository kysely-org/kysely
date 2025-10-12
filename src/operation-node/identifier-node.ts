import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface IdentifierNode extends OperationNode {
  readonly kind: 'IdentifierNode'
  readonly name: string
}

type IdentifierNodeFactory = Readonly<{
  is(node: OperationNode): node is IdentifierNode
  create(name: string): Readonly<IdentifierNode>
}>

/**
 * @internal
 */
export const IdentifierNode: IdentifierNodeFactory =
  freeze<IdentifierNodeFactory>({
    is(node): node is IdentifierNode {
      return node.kind === 'IdentifierNode'
    },

    create(name) {
      return freeze({
        kind: 'IdentifierNode',
        name,
      })
    },
  })
