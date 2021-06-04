import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export type ColumnDataType =
  | 'String'
  | 'Text'
  | 'Integer'
  | 'BigInteger'
  | 'Boolean'
  | 'Double'
  | 'Float'
  | 'Binary'

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
  readonly size?: number
}

export function isDataTypeNode(node: OperationNode): node is DataTypeNode {
  return node.kind === 'DataTypeNode'
}

export function createDataTypeNode(
  dataType: ColumnDataType,
  size?: number
): DataTypeNode {
  return freeze({
    kind: 'DataTypeNode',
    dataType,
    size,
  })
}
