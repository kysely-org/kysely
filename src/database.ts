import { SqlBool } from './util/type-utils.js'

export interface Database {
  tables: object
  config: TypeConfig
}

export interface TypeConfig {
  dateTimeType: unknown
  floatType: unknown
  bigIntType: unknown
  boolType: unknown

  /**
   * This type can be used to specify the `sum` function's output type.
   */
  sumType: unknown

  /**
   * This type can be used to specify the `avg` function's output type.
   * By default the {@link floatType} is used.
   */
  avgType: unknown

  /**
   * This type can be used to specify the `count` and `countAll` functions' output type.
   * By default the {@link bigIntType} is used.
   */
  countType: unknown
}

export interface DefaultTypeConfig extends TypeConfig {
  dateTimeType: Date | string
  floatType: number | string
  bigIntType: bigint | number | string
  boolType: SqlBool

  /**
   * This type can be used to specify the `sum` function's output type.
   */
  sumType: number | string | bigint

  /**
   * This type can be used to specify the `avg` function's output type.
   * By default the {@link floatType} is used.
   */
  avgType: unknown

  /**
   * This type can be used to specify the `count` and `countAll` functions' output type.
   * By default the {@link bigIntType} is used.
   */
  countType: unknown
}

export type GetConfig<
  DB extends Database,
  K extends keyof TypeConfig
> = unknown extends DB['config'][K] ? DefaultTypeConfig[K] : DB['config'][K]

export type GetConfigFallback<
  DB extends Database,
  K extends keyof TypeConfig,
  F extends keyof TypeConfig
> = unknown extends DB['config'][K] ? GetConfig<DB, F> : DB['config'][K]
