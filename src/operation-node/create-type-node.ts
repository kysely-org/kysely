import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'
import { ValueListNode } from './value-list-node.js'
import { ValueNode } from './value-node.js'

export type CreateTypeNodeParams = Omit<Partial<CreateTypeNode>, 'kind'>

export interface CreateTypeNode extends OperationNode {
  readonly kind: 'CreateTypeNode'
  readonly name: SchemableIdentifierNode
  readonly enum?: ValueListNode
}

/**
 * @internal
 */
export const CreateTypeNode = freeze({
  is(node: OperationNode): node is CreateTypeNode {
    return node.kind === 'CreateTypeNode'
  },

  create(name: SchemableIdentifierNode): CreateTypeNode {
    return freeze({
      kind: 'CreateTypeNode',
      name,
    })
  },

  cloneWithEnum(createType: CreateTypeNode, values: string[]): CreateTypeNode {
    return freeze({
      ...createType,
      enum: ValueListNode.create(
        values.map((value) => ValueNode.createImmediate(value)),
      ),
    })
  },
})
