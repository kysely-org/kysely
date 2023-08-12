export interface MssqlDialectConfig {
  /**
   * This dialect uses the `tarn` package to manage the connection pool to your
   * database. To use it as a peer dependency and not bundle it with Kysely's code,
   * you need to pass the `tarn` package itself. You also need to pass some pool options
   * (excluding `create`, `destroy` and `validate` functions which are controlled by this dialect),
   * `min` & `max` connections at the very least.
   *
   * Example:
   *
   * ```ts
   * import * as Tarn from 'tarn'
   *
   * const dialect = new MssqlDialect({
   *   // ...
   *   tarn: {
   *     ...Tarn,
   *     options: {
   *       // ...
   *       min: 0,
   *       max: 10,
   *     },
   *   },
   * })
   * ```
   */
  tarn: Tarn

  /**
   * This dialect uses the `tedious` package to communicate with your MS SQL Server
   * database. To use it as a peer dependency and not bundle it with Kysely's code,
   * you need to pass the `tedious` package itself. You also need to pass a factory
   * function that creates new `tedious` `Connection` instances on demand.
   *
   * Example:
   *
   * ```ts
   * import * as Tedious from 'tedious'
   *
   * const dialect = new MssqlDialect({
   *   // ...
   *   tedious: {
   *     ...Tedious,
   *     connectionFactory: () => new Tedious.Connection({ ... }),
   *   },
   * })
   * ```
   */
  tedious: Tedious
}

export interface Tedious {
  connectionFactory: () => TediousConnection | Promise<TediousConnection>
  ISOLATION_LEVEL: TediousIsolationLevel
  Request: typeof TediousRequest
  TYPES: TediousTypes
}

export type TediousIsolationLevel = Record<
  | 'NO_CHANGE'
  | 'READ_UNCOMMITTED'
  | 'READ_COMMITTED'
  | 'REPEATABLE_READ'
  | 'SERIALIZABLE'
  | 'SNAPSHOT',
  number
>

export type TediousTypes = Record<
  | 'BigInt'
  | 'Binary'
  | 'Bit'
  | 'Char'
  | 'Date'
  | 'DateTime'
  | 'DateTime2'
  | 'DateTimeOffset'
  | 'Decimal'
  | 'Float'
  | 'Image'
  | 'Int'
  | 'Money'
  | 'NChar'
  | 'NText'
  | 'Null'
  | 'Numeric'
  | 'NVarChar'
  | 'Real'
  | 'SmallDateTime'
  | 'SmallInt'
  | 'SmallMoney'
  | 'Text'
  | 'Time'
  | 'TinyInt'
  | 'TVP'
  | 'UDT'
  | 'UniqueIdentifier'
  | 'VarBinary'
  | 'VarChar'
  // TODO: uncomment once it is introduced in @types/tedious. See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/66369
  // | 'Variant'
  | 'Xml',
  { name: string; type: string }
>

export interface TediousType {
  name: string
  type: string
}

export interface TediousConnection {
  beginTransaction(
    callback: (error?: Error) => void,
    transactionId?: string | undefined,
    isolationLevel?: number | undefined
  ): void
  cancel(): void
  close(): void
  commitTransaction(callback: (error?: Error) => void): void
  connect(callback: (error?: Error) => void): void
  execSql(request: TediousRequest): void
  reset(callback: (error?: Error) => void): void
  rollbackTransaction(callback: (error?: Error) => void): void
  once(event: 'end', listener: () => void): void
}

export declare class TediousRequest {
  constructor(
    sql: string,
    callback: (error: Error, rowCount: number, rows: any[]) => void
  )
  addParameter(
    name: string,
    type: TediousType,
    value: any,
    options?: {
      length?: number | 'max' | undefined
      precision?: number | undefined
      scale?: number | undefined
    }
  ): void
  off(event: 'row', listener: (...args: any[]) => void): void
  on(event: 'row', listener: (columns: TediousColumnValue[]) => void): void
  once(event: 'requestCompleted', listener: (...args: any[]) => void): void
}

export interface TediousColumnValue {
  metadata: {
    colName: string
  }
  value: any
}

export interface Tarn {
  /**
   * Tarn.js' pool options, excluding `create`, `destroy` and `validate` functions,
   * which must be implemented by this dialect.
   */
  options: Omit<TarnPoolOptions<any>, 'create' | 'destroy' | 'validate'>

  /**
   * Tarn.js' Pool class.
   *
   * Example:
   *
   * ```ts
   * import { Pool } from 'tarn'
   *
   * const dialect = new MssqlDialect({
   *   // ...
   *   tarn: {
   *     // ...
   *     Pool,
   *   },
   * })
   * ```
   */
  Pool: typeof TarnPool
}

export declare class TarnPool<R> {
  constructor(opt: TarnPoolOptions<R>)
  acquire(): TarnPendingRequest<R>
  destroy(): any
  release(resource: R): void
}

export interface TarnPoolOptions<R> {
  acquireTimeoutMillis?: number
  create(cb: (err: Error | null, resource: R) => void): any | (() => Promise<R>)
  createRetryIntervalMillis?: number
  createTimeoutMillis?: number
  destroy(resource: R): any
  destroyTimeoutMillis?: number
  idleTimeoutMillis?: number
  log?(msg: string): any
  max: number
  min: number
  propagateCreateError?: boolean
  reapIntervalMillis?: number
  validate(resource: R): boolean
}

export interface TarnPendingRequest<R> {
  promise: Promise<R>
  resolve: (resource: R) => void
  reject: (err: Error) => void
}
