import { Connection } from './connection'

export interface ConnectionProvider {
  withConnection<T>(runner: (connection: Connection) => Promise<T>): Promise<T>
}
