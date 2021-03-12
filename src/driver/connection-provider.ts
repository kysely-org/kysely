import { Connection } from './connection'

export interface ConnectionProvider {
  acquireConnection(): Promise<Connection>
  releaseConnection(connection: Connection): Promise<void>
}
