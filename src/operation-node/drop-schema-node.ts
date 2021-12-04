import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type DropSchemaNodeModifier = 'IfExists'
export type DropSchemaNodeParams = Omit<
  Partial<DropSchemaNode>,
  'kind' | 'schema'
>

export interface DropSchemaNode extends OperationNode {
  readonly kind: 'DropSchemaNode'
  readonly schema: IdentifierNode
  readonly modifier?: DropSchemaNodeModifier
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

  cloneWithModifier(
    dropSchema: DropSchemaNode,
    modifier: DropSchemaNodeModifier
  ): DropSchemaNode {
    return freeze({
      ...dropSchema,
      modifier,
    })
  },
})
