import { DatabaseConnection } from './database-connection.js'

export interface ConnectionProvider {
  withConnection<T>(
    runner: (connection: DatabaseConnection) => Promise<T>
  ): Promise<T>
}
