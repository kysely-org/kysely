import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

const SIMPLE_COLUMN_DATA_TYPES = {
  bigint: true,
  bigserial: true,
  binary: true,
  blob: true,
  boolean: true,
  bytea: true,
  char: true,
  date: true,
  datemultirange: true,
  daterange: true,
  datetime: true,
  decimal: true,
  'double precision': true,
  float4: true,
  float8: true,
  int2: true,
  int4: true,
  int4multirange: true,
  int4range: true,
  int8: true,
  int8multirange: true,
  int8range: true,
  integer: true,
  json: true,
  jsonb: true,
  numeric: true,
  nummultirange: true,
  numrange: true,
  real: true,
  serial: true,
  smallint: true,
  text: true,
  time: true,
  timestamp: true,
  timestamptz: true,
  timetz: true,
  tsmultirange: true,
  tsrange: true,
  tstzmultirange: true,
  tstzrange: true,
  uuid: true,
  varbinary: true,
  varchar: true,
} as const satisfies Record<string, true>

// TODO: look into optimizing this, perhaps merging regexes.
const COLUMN_DATA_TYPE_REGEX: readonly RegExp[] = [
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
  /^varbinary\(\d+\)$/,
] as const

type SimpleColumnDataType = keyof typeof SIMPLE_COLUMN_DATA_TYPES

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
  | `varbinary(${number})`

export type DataTypeParams = Omit<DataTypeNode, 'kind' | 'dataType'>

export interface DataTypeNode extends OperationNode {
  readonly kind: 'DataTypeNode'
  readonly dataType: ColumnDataType
}

type DataTypeNodeFactory = Readonly<{
  is(node: OperationNode): node is DataTypeNode
  create(dataType: ColumnDataType): Readonly<DataTypeNode>
}>

/**
 * @internal
 */
export const DataTypeNode: DataTypeNodeFactory = freeze<DataTypeNodeFactory>({
  is(node): node is DataTypeNode {
    return node.kind === 'DataTypeNode'
  },

  create(dataType) {
    return freeze({
      kind: 'DataTypeNode',
      dataType,
    })
  },
})

export function isColumnDataType(dataType: string): dataType is ColumnDataType {
  return (
    SIMPLE_COLUMN_DATA_TYPES[dataType as never] ||
    COLUMN_DATA_TYPE_REGEX.some((r) => r.test(dataType))
  )
}
