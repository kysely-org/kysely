import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'

export type DropSchemaNodeParams = Omit<
  Partial<DropSchemaNode>,
  'kind' | 'schema'
>

export interface DropSchemaNode extends OperationNode {
  readonly kind: 'DropSchemaNode'
  readonly schema: IdentifierNode
  readonly ifExists?: boolean
  readonly cascade?: boolean
}

type DropSchemaNodeFactory = Readonly<{
  is(node: OperationNode): node is DropSchemaNode
  create(
    schema: string,
    params?: DropSchemaNodeParams,
  ): Readonly<DropSchemaNode>
  cloneWith(
    dropSchema: DropSchemaNode,
    params: DropSchemaNodeParams,
  ): Readonly<DropSchemaNode>
}>

/**
 * @internal
 */
export const DropSchemaNode: DropSchemaNodeFactory =
  freeze<DropSchemaNodeFactory>({
    is(node): node is DropSchemaNode {
      return node.kind === 'DropSchemaNode'
    },

    create(schema, params?) {
      return freeze({
        kind: 'DropSchemaNode',
        schema: IdentifierNode.create(schema),
        ...params,
      })
    },

    cloneWith(dropSchema, params) {
      return freeze({
        ...dropSchema,
        ...params,
      })
    },
  })
