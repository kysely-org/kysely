import { freeze } from '../util/object-utils'
import { IdentifierNode, identifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

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
export const createSchemaNode = freeze({
  is(node: OperationNode): node is CreateSchemaNode {
    return node.kind === 'CreateSchemaNode'
  },

  create(schema: string, params?: CreateSchemaNodeParams): CreateSchemaNode {
    return freeze({
      kind: 'CreateSchemaNode',
      schema: identifierNode.create(schema),
      ...params,
    })
  },

  cloneWithModifier(
    createSchema: CreateSchemaNode,
    modifier: CreateSchemaNodeModifier
  ): CreateSchemaNode {
    return freeze({
      ...createSchema,
      modifier,
    })
  },
})
