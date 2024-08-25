import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the PostgreSQL dialect.
 */
export interface PostgresDialectConfig {
  /**
   * A postgres Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://node-postgres.com/apis/pool
   */
  pool: PostgresPool | (() => Promise<PostgresPool>)

  /**
   * https://github.com/brianc/node-postgres/tree/master/packages/pg-cursor
   * ```ts
   * import Cursor from 'pg-cursor'
   * // or
   * import * as Cursor from 'pg-cursor'
   *
   * new PostgresDialect({
   *  cursor: Cursor
   * })
   * ```
   */
  cursor?: PostgresCursorConstructor

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>

  /**
   * Called every time a connection is acquired from the pool.
   */
  onReserveConnection?: (connection: DatabaseConnection) => Promise<void>
}

/**
 * This interface is the subset of pg driver's `Pool` class that
 * kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/apis/pool
 */
export interface PostgresPool {
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
}

export interface PostgresPoolClient {
  query<R>(queryConfig: PostgresQueryConfig): Promise<PostgresQueryResult<R>>
  query<R>(cursor: PostgresCursor<R>): PostgresCursor<R>
  release(): void
}

// https://node-postgres.com/apis/client#queryconfig
export interface PostgresQueryConfig {
  text: string
  values: ReadonlyArray<unknown>
  name?: string
  rowMode: 'array'
  types?: any
  queryMode?: string
}

export interface PostgresCursor<T> {
  // https://github.com/brianc/node-pg-cursor/pull/23
  read(
    rowCount: number,
    cb: (err: Error | null, rows: T[], result?: PostgresQueryResult<T>) => void,
  ): void
  close(): Promise<void>
}

export type PostgresCursorConstructor = new <T>(
  sql: string,
  parameters: unknown[],
  queryConfig?: { rowMode?: 'array' },
) => PostgresCursor<T>

export interface PostgresQueryResult<R> {
  command: 'UPDATE' | 'DELETE' | 'INSERT' | 'SELECT' | 'MERGE'
  rowCount: number
  rows: R[]
  fields: PostgresField<R>[]
  rowAsArray: boolean
}

export interface PostgresStream<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>
}

export interface PostgresField<R> {
  name: keyof R
  tableID: number
  columnID: number
  dataTypeID: number
  dataTypeSize: number
  dataTypeModifier: number
  format: string
}
