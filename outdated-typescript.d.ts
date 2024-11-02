import { KyselyTypeError } from './src/util/type-error'
type OutdatedTSError =
  KyselyTypeError<'The installed TypeScript version is outdated and cannot guarantee type-safety with Kysely. Please upgrade to version 4.6 or newer.'>
export type Kysely = OutdatedTSError
export type sql = OutdatedTSError
export type expressionBuilder = OutdatedTSError
export type Expression = OutdatedTSError
export type ColumnType = OutdatedTSError
export type Generated = OutdatedTSError
export type GeneratedAlways = OutdatedTSError
export type JSONColumnType = OutdatedTSError
export type Selectable = OutdatedTSError
export type Insertable = OutdatedTSError
export type Updateable = OutdatedTSError
export type MysqlDialect = OutdatedTSError
export type PostgresDialect = OutdatedTSError
export type SqliteDialect = OutdatedTSError
export type MssqlDialect = OutdatedTSError
export type InferResult = OutdatedTSError
export type CompiledQuery = OutdatedTSError
export type UpdateResult = OutdatedTSError
export type InsertResult = OutdatedTSError
export type DeleteResult = OutdatedTSError
export type MergeResult = OutdatedTSError
