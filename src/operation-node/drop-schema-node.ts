import { freeze } from '../util/object-utils'
import { IdentifierNode, identifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

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
export const dropSchemaNode = freeze({
  is(node: OperationNode): node is DropSchemaNode {
    return node.kind === 'DropSchemaNode'
  },

  create(schema: string, params?: DropSchemaNodeParams): DropSchemaNode {
    return freeze({
      kind: 'DropSchemaNode',
      schema: identifierNode.create(schema),
      ...params,
    })
  },

  cloneWithModifier(
    createSchema: DropSchemaNode,
    modifier: DropSchemaNodeModifier
  ): DropSchemaNode {
    return freeze({
      ...createSchema,
      modifier,
    })
  },
})
