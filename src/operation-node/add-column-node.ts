import { freeze } from '../util/object-utils'
import { CheckConstraintNode } from './check-constraint-node'
import { ColumnNode, columnNode } from './column-node'
import { DataTypeNode } from './data-type-node'
import { OperationNode } from './operation-node'
import { RawNode } from './raw-node'
import { ReferencesNode } from './references-node'
import { ValueNode } from './value-node'

export type AddColumnNodeParams = Omit<Partial<AddColumnNode>, 'kind'>

export type ColumnDataTypeNode = DataTypeNode | RawNode

export interface AddColumnNode extends OperationNode {
  readonly kind: 'AddColumnNode'
  readonly column: ColumnNode
  readonly dataType: ColumnDataTypeNode
  readonly references?: ReferencesNode
  readonly isPrimaryKey: boolean
  readonly isAutoIncrementing: boolean
  readonly isUnique: boolean
  readonly isNullable: boolean
  readonly defaultTo?: ValueNode | RawNode
  readonly check?: CheckConstraintNode
}

export const addColumnNode = freeze({
  is(node: OperationNode): node is AddColumnNode {
    return node.kind === 'AddColumnNode'
  },

  create(column: string, dataType: ColumnDataTypeNode): AddColumnNode {
    return freeze({
      kind: 'AddColumnNode',
      column: columnNode.create(column),
      dataType,
      isPrimaryKey: false,
      isAutoIncrementing: false,
      isUnique: false,
      isNullable: true,
    })
  },

  cloneWith(node: AddColumnNode, params: AddColumnNodeParams): AddColumnNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
