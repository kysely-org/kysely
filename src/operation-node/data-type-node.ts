import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type ColumnDataType =
  | 'varchar'
  | `varchar(${number})`
  | 'text'
  | 'integer'
  | 'bigint'
  | 'boolean'
  | 'real'
  | 'double precision'
  | 'decimal'
  | `decimal(${number}, ${number})`
  | 'numeric'
  | `numeric(${number}, ${number})`
  | 'binary'
  | 'date'
  | 'timestamp'
  | 'timestamp with time zone'
  | 'serial'
  | 'bigserial'
  | 'uuid'

export type DataTypeParams = Omit<DataTypeNode, 'kind' | 'dataType'>

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
}

/**
 * @internal
 */
export const dataTypeNode = freeze({
  is(node: OperationNode): node is DataTypeNode {
    return node.kind === 'DataTypeNode'
  },

  create(dataType: ColumnDataType): DataTypeNode {
    return freeze({
      kind: 'DataTypeNode',
      dataType,
    })
  },
})
