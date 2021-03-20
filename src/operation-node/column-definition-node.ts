import { freeze } from '../utils/object-utils'
import { ColumnNode, createColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { ReferenceNode } from './reference-node'

export type ColumnDataType =
  | 'String'
  | 'Text'
  | 'Integer'
  | 'BigInteger'
  | 'Boolean'
  | 'Double'
  | 'Float'
  | 'Binary'

export type ColumnDefinitionNodeParams = Omit<
  Partial<ColumnDefinitionNode>,
  'kind'
>

export interface ColumnDefinitionNode extends OperationNode {
  readonly kind: 'ColumnDefinitionNode'
  readonly column: ColumnNode
  readonly dataType?: ColumnDataType
  readonly dataTypeSize?: number
  readonly references?: ReferenceNode
  readonly isPrimaryKey: boolean
  readonly isAutoIncrementing: boolean
  readonly isUnique: boolean
  readonly hasIndex: boolean
  readonly isNullable: boolean
}

export function isColumnDefinitionNode(
  node: OperationNode
): node is ColumnDefinitionNode {
  return node.kind === 'ColumnDefinitionNode'
}

export function createColumnDefinitionNode(
  column: string
): ColumnDefinitionNode {
  return freeze({
    kind: 'ColumnDefinitionNode',
    column: createColumnNode(column),
    isPrimaryKey: false,
    isAutoIncrementing: false,
    isUnique: false,
    hasIndex: false,
    isNullable: true,
  })
}

export function cloneColumnDefinitionNode(
  node: ColumnDefinitionNode,
  params: ColumnDefinitionNodeParams
): ColumnDefinitionNode {
  return freeze({
    ...node,
    ...params,
  })
}
