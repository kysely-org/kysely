import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type DropSchemaNodeParams = Omit<
  Partial<DropSchemaNode>,
  'kind' | 'schema'
>

export interface DropSchemaNode extends OperationNode {
  readonly kind: 'DropSchemaNode'
  readonly schema: IdentifierNode
  readonly ifExists?: boolean
}

/**
 * @internal
 */
export const DropSchemaNode = freeze({
  is(node: OperationNode): node is DropSchemaNode {
    return node.kind === 'DropSchemaNode'
  },

  create(schema: string, params?: DropSchemaNodeParams): DropSchemaNode {
    return freeze({
      kind: 'DropSchemaNode',
      schema: IdentifierNode.create(schema),
      ...params,
    })
  },

  cloneWith(
    dropSchema: DropSchemaNode,
    params: DropSchemaNodeParams
  ): DropSchemaNode {
    return freeze({
      ...dropSchema,
      ...params,
    })
  },
})
