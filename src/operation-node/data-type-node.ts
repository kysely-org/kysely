import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

const SIMPLE_COLUMN_DATA_TYPES = [
  'varchar',
  'char',
  'text',
  'integer',
  'int2',
  'int4',
  'int8',
  'smallint',
  'bigint',
  'boolean',
  'real',
  'double precision',
  'float4',
  'float8',
  'decimal',
  'numeric',
  'binary',
  'bytea',
  'date',
  'datetime',
  'time',
  'timetz',
  'timestamp',
  'timestamptz',
  'serial',
  'bigserial',
  'uuid',
  'json',
  'jsonb',
  'blob',
] as const

const COLUMN_DATA_TYPE_REGEX = [
  /^varchar\(\d+\)$/,
  /^char\(\d+\)$/,
  /^decimal\(\d+, \d+\)$/,
  /^numeric\(\d+, \d+\)$/,
  /^binary\(\d+\)$/,
  /^datetime\(\d+\)$/,
  /^time\(\d+\)$/,
  /^timetz\(\d+\)$/,
  /^timestamp\(\d+\)$/,
  /^timestamptz\(\d+\)$/,
]

type SimpleColumnDataType = (typeof SIMPLE_COLUMN_DATA_TYPES)[number]

export type ColumnDataType =
  | SimpleColumnDataType
  | `varchar(${number})`
  | `char(${number})`
  | `decimal(${number}, ${number})`
  | `numeric(${number}, ${number})`
  | `binary(${number})`
  | `datetime(${number})`
  | `time(${number})`
  | `timetz(${number})`
  | `timestamp(${number})`
  | `timestamptz(${number})`

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

export function isColumnDataType(dataType: string): dataType is ColumnDataType {
  if (SIMPLE_COLUMN_DATA_TYPES.includes(dataType as SimpleColumnDataType)) {
    return true
  }

  if (COLUMN_DATA_TYPE_REGEX.some((r) => r.test(dataType))) {
    return true
  }

  return false
}
