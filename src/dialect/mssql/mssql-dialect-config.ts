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
  Request: TediousRequestClass
  TYPES: TediousTypes
  /**
   * Controls whether connections are reset to their initial states when released back to the pool. Resetting a connection performs additional requests to the database.
   * See {@link https://tediousjs.github.io/tedious/api-connection.html#function_reset | connection.reset}.
   *
   * Defaults to `true`.
   */
  resetConnectionOnRelease?: boolean
}

export interface TediousConnection {
  beginTransaction(
    callback: (error?: Error | null, transactionDescriptor?: any) => void,
    name?: string,
    isolationLevel?: number,
  ): void
  cancel(): boolean
  close(): void
  commitTransaction(
    callback: (error?: Error | null) => void,
    name?: string,
  ): void
  connect(callback?: (error?: Error) => void): void
  execSql(request: TediousRequest): void
  off(event: 'error', listener: (error: unknown) => void): this
  off(event: string, listener: (...args: any[]) => void): this
  on(event: 'error', listener: (error: unknown) => void): this
  on(event: string, listener: (...args: any[]) => void): this
  once(event: 'end', listener: () => void): this
  once(event: string, listener: (...args: any[]) => void): this
  reset(callback: (error?: Error | null) => void): void
  rollbackTransaction(
    callback: (error?: Error | null) => void,
    name?: string,
  ): void
  saveTransaction(callback: (error?: Error | null) => void, name: string): void
}

export type TediousIsolationLevel = Record<string, number>

export interface TediousRequestClass {
  new (
    sqlTextOrProcedure: string | undefined,
    callback: (error?: Error | null, rowCount?: number, rows?: any) => void,
    options?: {
      statementColumnEncryptionSetting?: any
    },
  ): TediousRequest
}

export declare class TediousRequest {
  addParameter(
    name: string,
    dataType: TediousDataType,
    value?: unknown,
    options?: Readonly<{
      output?: boolean
      length?: number
      precision?: number
      scale?: number
    }> | null,
  ): void
  off(event: 'row', listener: (columns: any) => void): this
  off(event: string, listener: (...args: any[]) => void): this
  on(event: 'row', listener: (columns: any) => void): this
  on(event: string, listener: (...args: any[]) => void): this
  once(event: 'requestCompleted', listener: () => void): this
  once(event: string, listener: (...args: any[]) => void): this
  pause(): void
  resume(): void
}

export interface TediousTypes {
  NVarChar: TediousDataType
  BigInt: TediousDataType
  Int: TediousDataType
  Float: TediousDataType
  Bit: TediousDataType
  DateTime: TediousDataType
  VarBinary: TediousDataType
  [x: string]: TediousDataType
}

export interface TediousDataType {}

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
  options: Omit<TarnPoolOptions<any>, 'create' | 'destroy' | 'validate'> & {
    /**
     * Controls whether connections are validated before being acquired from the pool. Connection validation performs additional requests to the database.
     *
     * Defaults to `true`.
     */
    validateConnections?: boolean
  }

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
  validate?(resource: R): boolean
}

export interface TarnPendingRequest<R> {
  promise: Promise<R>
  resolve: (resource: R) => void
  reject: (err: Error) => void
}
