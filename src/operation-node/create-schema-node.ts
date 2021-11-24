import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type CreateSchemaNodeModifier = 'IfNotExists'
export type CreateSchemaNodeParams = Omit<
  Partial<CreateSchemaNode>,
  'kind' | 'schema'
>

export interface CreateSchemaNode extends OperationNode {
  readonly kind: 'CreateSchemaNode'
  readonly schema: IdentifierNode
  readonly modifier?: CreateSchemaNodeModifier
}

/**
 * @internal
 */
export const CreateSchemaNode = freeze({
  is(node: OperationNode): node is CreateSchemaNode {
    return node.kind === 'CreateSchemaNode'
  },

  create(schema: string, params?: CreateSchemaNodeParams): CreateSchemaNode {
    return freeze({
      kind: 'CreateSchemaNode',
      schema: IdentifierNode.create(schema),
      ...params,
    })
  },

  cloneWith(
    createSchema: CreateSchemaNode,
    params: CreateSchemaNodeParams
  ): CreateSchemaNode {
    return freeze({
      ...createSchema,
      ...params,
    })
  },
})
