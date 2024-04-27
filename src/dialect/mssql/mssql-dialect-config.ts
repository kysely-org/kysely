import type { Connection, ISOLATION_LEVEL, Request, TYPES } from 'tedious'

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
  connectionFactory: () => Connection | Promise<Connection>
  ISOLATION_LEVEL: typeof ISOLATION_LEVEL
  Request: typeof Request
  TYPES: typeof TYPES
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
