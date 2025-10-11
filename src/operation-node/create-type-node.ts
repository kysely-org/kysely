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

type CreateTypeNodeFactory = Readonly<{
  is(node: OperationNode): node is CreateTypeNode
  create(name: SchemableIdentifierNode): Readonly<CreateTypeNode>
  cloneWithEnum(
    createType: CreateTypeNode,
    values: readonly string[],
  ): Readonly<CreateTypeNode>
}>

/**
 * @internal
 */
export const CreateTypeNode: CreateTypeNodeFactory =
  freeze<CreateTypeNodeFactory>({
    is(node): node is CreateTypeNode {
      return node.kind === 'CreateTypeNode'
    },

    create(name) {
      return freeze({
        kind: 'CreateTypeNode',
        name,
      })
    },

    cloneWithEnum(createType, values) {
      return freeze({
        ...createType,
        enum: ValueListNode.create(values.map(ValueNode.createImmediate)),
      })
    },
  })
