import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type ColumnDataType =
  | 'varchar'
  | `varchar(${number})`
  | 'text'
  | 'integer'
  | 'int2'
  | 'int4'
  | 'int8'
  | 'bigint'
  | 'boolean'
  | 'real'
  | 'double precision'
  | 'float4'
  | 'float8'
  | 'decimal'
  | `decimal(${number}, ${number})`
  | 'numeric'
  | `numeric(${number}, ${number})`
  | 'binary'
  | 'date'
  | 'time'
  | 'timetz'
  | 'timestamp'
  | 'timestamptz'
  | 'serial'
  | 'bigserial'
  | 'uuid'
  | 'json'
  | 'jsonb'

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
