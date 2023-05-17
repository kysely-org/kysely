import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type ColumnDataType =
  | 'varchar'
  | `varchar(${number})`
  | 'char'
  | `char(${number})`
  | 'text'
  | 'integer'
  | 'int2'
  | 'int4'
  | 'int8'
  | 'bigint'
  | 'boolean'
  | 'real'
  | 'double precision'
  | 'float4'
  | 'float8'
  | 'decimal'
  | `decimal(${number}, ${number})`
  | 'numeric'
  | `numeric(${number}, ${number})`
  | 'binary'
  | `binary(${number})`
  | `bytea`
  | 'date'
  | 'datetime'
  | `datetime(${number})`
  | 'time'
  | `time(${number})`
  | 'timetz'
  | `timetz(${number})`
  | 'timestamp'
  | `timestamp(${number})`
  | 'timestamptz'
  | `timestamptz(${number})`
  | 'serial'
  | 'bigserial'
  | 'uuid'
  | 'json'
  | 'jsonb'
  | 'blob'

export type DataTypeParams = Omit<DataTypeNode, 'kind' | 'dataType'>

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
}

/**
 * @internal
 */
export const DataTypeNode = freeze({
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
