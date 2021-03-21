import { freeze } from '../utils/object-utils'
import { ColumnNode, createColumnNode } from './column-node'
import { DataTypeNode } from './data-type-node'
import { OperationNode } from './operation-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'

export type ColumnDefinitionNodeParams = Omit<
  Partial<ColumnDefinitionNode>,
  'kind'
>

export type ColumnDataTypeNode = DataTypeNode | RawNode

export interface ColumnDefinitionNode extends OperationNode {
  readonly kind: 'ColumnDefinitionNode'
  readonly column: ColumnNode
  readonly dataType: ColumnDataTypeNode
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
  column: string,
  dataType: ColumnDataTypeNode
): ColumnDefinitionNode {
  return freeze({
    kind: 'ColumnDefinitionNode',
    column: createColumnNode(column),
    dataType,
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
