import { DatabaseConnection } from './database-connection.js'

export interface ConnectionProvider {
  /**
   * Provides a connection for the callback and takes care of disposing
   * the connection after the callback has been run.
   */
  withConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T>
}
