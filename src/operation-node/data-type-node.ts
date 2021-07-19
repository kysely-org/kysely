import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export type ColumnDataType =
  | 'String'
  | 'Text'
  | 'Integer'
  | 'BigInteger'
  | 'Boolean'
  | 'Float'
  | 'Double'
  | 'Decimal'
  | 'Numeric'
  | 'Binary'

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
  readonly size?: number
  readonly precision?: number
  readonly scale?: number
}

export function isDataTypeNode(node: OperationNode): node is DataTypeNode {
  return node.kind === 'DataTypeNode'
}

export function createDataTypeNode(
  dataType: ColumnDataType,
  args?: { size?: number; precision?: number; scale?: number }
): DataTypeNode {
  return freeze({
    kind: 'DataTypeNode',
    dataType,
    ...args,
  })
}
