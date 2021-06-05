import { DatabaseConnection } from './database-connection'

export interface ConnectionProvider {
  withConnection<T>(runner: (connection: DatabaseConnection) => Promise<T>): Promise<T>
}
