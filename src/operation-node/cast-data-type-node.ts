import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

// MySQL cast data types
// https://dev.mysql.com/doc/refman/8.0/en/cast-functions.html
const SIMPLE_MYSQL_CAST_DATA_TYPES = [
  'binary',
  'char',
  'date',
  'datetime',
  'decimal',
  'double',
  'float',
  'json',
  'signed',
  'time',
  'unsigned',
] as const

const MYSQL_CAST_DATA_TYPE_REGEX = [
  /^char\(\d+\)$/,
  /^decimal\(\d+, \d+\)$/,
  /^time\(\d+\)$/,
  /^datetime\(\d+\)$/,
]

type SimpleMysqlCastDataType = (typeof SIMPLE_MYSQL_CAST_DATA_TYPES)[number]

export type MysqlCastDataType =
  | SimpleMysqlCastDataType
  | `char(${number})`
  | `decimal(${number}, ${number})`
  | `time(${number})`
  | `datetime(${number})`

// PostgreSQL cast data types
const SIMPLE_POSTGRES_CAST_DATA_TYPES = [
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
  'bytea',
  'date',
  'time',
  'timetz',
  'timestamp',
  'timestamptz',
  'uuid',
  'json',
  'jsonb',
  'int4range',
  'int4multirange',
  'int8range',
  'int8multirange',
  'numrange',
  'nummultirange',
  'tsrange',
  'tsmultirange',
  'tstzrange',
  'tstzmultirange',
  'daterange',
  'datemultirange',
] as const

const POSTGRES_CAST_DATA_TYPE_REGEX = [
  /^varchar\(\d+\)$/,
  /^char\(\d+\)$/,
  /^decimal\(\d+, \d+\)$/,
  /^numeric\(\d+, \d+\)$/,
  /^time\(\d+\)$/,
  /^timetz\(\d+\)$/,
  /^timestamp\(\d+\)$/,
  /^timestamptz\(\d+\)$/,
]

type SimplePostgresCastDataType =
  (typeof SIMPLE_POSTGRES_CAST_DATA_TYPES)[number]

export type PostgresCastDataType =
  | SimplePostgresCastDataType
  | `varchar(${number})`
  | `char(${number})`
  | `decimal(${number}, ${number})`
  | `numeric(${number}, ${number})`
  | `time(${number})`
  | `timetz(${number})`
  | `timestamp(${number})`
  | `timestamptz(${number})`

// MSSQL cast data types
// https://learn.microsoft.com/en-us/sql/t-sql/functions/cast-and-convert-transact-sql
const SIMPLE_MSSQL_CAST_DATA_TYPES = [
  'bigint',
  'int',
  'smallint',
  'tinyint',
  'bit',
  'decimal',
  'numeric',
  'money',
  'smallmoney',
  'float',
  'real',
  'date',
  'datetime',
  'datetime2',
  'datetimeoffset',
  'smalldatetime',
  'time',
  'char',
  'varchar',
  'text',
  'nchar',
  'nvarchar',
  'ntext',
  'binary',
  'varbinary',
  'image',
  'uniqueidentifier',
  'xml',
] as const

const MSSQL_CAST_DATA_TYPE_REGEX = [
  /^char\(\d+\)$/,
  /^varchar\(\d+\)$/,
  /^nchar\(\d+\)$/,
  /^nvarchar\(\d+\)$/,
  /^binary\(\d+\)$/,
  /^varbinary\(\d+\)$/,
  /^decimal\(\d+, \d+\)$/,
  /^numeric\(\d+, \d+\)$/,
  /^datetime2\(\d+\)$/,
  /^datetimeoffset\(\d+\)$/,
  /^time\(\d+\)$/,
]

type SimpleMssqlCastDataType = (typeof SIMPLE_MSSQL_CAST_DATA_TYPES)[number]

export type MssqlCastDataType =
  | SimpleMssqlCastDataType
  | `char(${number})`
  | `varchar(${number})`
  | `nchar(${number})`
  | `nvarchar(${number})`
  | `binary(${number})`
  | `varbinary(${number})`
  | `decimal(${number}, ${number})`
  | `numeric(${number}, ${number})`
  | `datetime2(${number})`
  | `datetimeoffset(${number})`
  | `time(${number})`

// SQLite cast data types
// SQLite has a very limited set of types for CAST
// https://www.sqlite.org/lang_expr.html#castexpr
const SIMPLE_SQLITE_CAST_DATA_TYPES = [
  'integer',
  'real',
  'text',
  'blob',
  'numeric',
] as const

type SimpleSqliteCastDataType = (typeof SIMPLE_SQLITE_CAST_DATA_TYPES)[number]

export type SqliteCastDataType = SimpleSqliteCastDataType

export type CastDataType =
  | MysqlCastDataType
  | PostgresCastDataType
  | MssqlCastDataType
  | SqliteCastDataType

export function isMysqlCastDataType(
  dataType: string,
): dataType is MysqlCastDataType {
  if (
    SIMPLE_MYSQL_CAST_DATA_TYPES.includes(dataType as SimpleMysqlCastDataType)
  ) {
    return true
  }

  if (MYSQL_CAST_DATA_TYPE_REGEX.some((r) => r.test(dataType))) {
    return true
  }

  return false
}

export function isPostgresCastDataType(
  dataType: string,
): dataType is PostgresCastDataType {
  if (
    SIMPLE_POSTGRES_CAST_DATA_TYPES.includes(
      dataType as SimplePostgresCastDataType,
    )
  ) {
    return true
  }

  if (POSTGRES_CAST_DATA_TYPE_REGEX.some((r) => r.test(dataType))) {
    return true
  }

  return false
}

export function isMssqlCastDataType(
  dataType: string,
): dataType is MssqlCastDataType {
  if (
    SIMPLE_MSSQL_CAST_DATA_TYPES.includes(dataType as SimpleMssqlCastDataType)
  ) {
    return true
  }

  if (MSSQL_CAST_DATA_TYPE_REGEX.some((r) => r.test(dataType))) {
    return true
  }

  return false
}

export function isSqliteCastDataType(
  dataType: string,
): dataType is SqliteCastDataType {
  return SIMPLE_SQLITE_CAST_DATA_TYPES.includes(
    dataType as SimpleSqliteCastDataType,
  )
}

export function isCastDataType(dataType: string): dataType is CastDataType {
  return (
    isMysqlCastDataType(dataType) ||
    isPostgresCastDataType(dataType) ||
    isMssqlCastDataType(dataType) ||
    isSqliteCastDataType(dataType)
  )
}
