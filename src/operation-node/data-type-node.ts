import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export type ColumnDataType =
  | 'VarChar'
  | 'Text'
  | 'Integer'
  | 'BigInteger'
  | 'Boolean'
  | 'Float'
  | 'Double'
  | 'Decimal'
  | 'Numeric'
  | 'Binary'
  | 'Date'
  | 'DateTime'

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
  readonly size?: number
  readonly precision?: number
  readonly scale?: number
}

export const dataTypeNode = freeze({
  is(node: OperationNode): node is DataTypeNode {
    return node.kind === 'DataTypeNode'
  },

  create(
    dataType: ColumnDataType,
    params?: { size?: number; precision?: number; scale?: number }
  ): DataTypeNode {
    return freeze({
      kind: 'DataTypeNode',
      dataType,
      ...params,
    })
  },
})
