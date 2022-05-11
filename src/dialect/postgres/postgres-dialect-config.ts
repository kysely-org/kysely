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
   * https://node-postgres.com/api/pool
   */
  pool: PostgresPool | (() => Promise<PostgresPool>)

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}

/**
 * This interface is the subset of pg driver's `Pool` class that
 * kysely needs.
 *
 * We don't use the type from `pg` here to not have a dependency to it.
 *
 * https://node-postgres.com/api/pool
 */
export interface PostgresPool {
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
}

export interface PostgresPoolClient {
  query<R>(
    sql: string,
    parameters: ReadonlyArray<unknown>
  ): Promise<PostgresQueryResult<R>>
  release(): void
}

export interface PostgresQueryResult<R> {
  command: 'UPDATE' | 'DELETE' | 'INSERT' | 'SELECT'
  rowCount: number
  rows: R[]
}
