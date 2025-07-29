import type { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the PGlite dialect.
 */
export interface PGliteDialectConfig {
  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `@electric-sql/pglite`
   * module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>

  /**
   * A PGlite instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://pglite.dev/docs/api#main-constructor
   */
  pglite: PGlite | (() => Promise<PGlite>)
}

/**
 * This interface is the subset of the PGlite instance that kysely needs.
 *
 * We don't use the type from `@electric-sql/pglite` here to not have a dependency
 * to it.
 *
 * https://pglite.dev/docs/api
 */
export interface PGlite {
  close(): Promise<void>
  closed: boolean
  query<T>(
    query: string,
    params?: any[],
    options?: PGliteQueryOptions,
  ): Promise<PGliteQueryResults<T>>
  ready: boolean
  transaction<T>(callback: (tx: PGliteTransaction) => Promise<T>): Promise<T>
  waitReady: Promise<void>
}

export interface PGliteQueryOptions {
  blob?: Blob | File
  onNotice?: (notice: any) => void
  paramTypes?: number[]
  parsers?: Record<number, (value: string) => any>
  rowMode?: 'array' | 'object'
  serializers?: Record<number, (value: any) => string>
}

export interface PGliteQueryResults<T> {
  affectedRows?: number
  blob?: Blob
  fields: {
    dataTypeID: number
    name: string
  }[]
  rows: T[]
}

export interface PGliteTransaction extends Pick<PGlite, 'query'> {
  rollback(): Promise<void>
}
