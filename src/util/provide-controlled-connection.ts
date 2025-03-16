import { ConnectionProvider } from '../driver/connection-provider.js'
import { DatabaseConnection } from '../driver/database-connection.js'
import { Deferred } from './deferred.js'

export async function provideControlledConnection(
  connectionProvider: ConnectionProvider,
): Promise<ControlledConnection> {
  const connectionDefer = new Deferred<DatabaseConnection>()
  const connectionReleaseDefer = new Deferred<void>()

  connectionProvider
    .provideConnection(async (connection) => {
      connectionDefer.resolve(connection)

      return await connectionReleaseDefer.promise
    })
    .catch((ex) => connectionDefer.reject(ex))

  const connection = (await connectionDefer.promise) as ControlledConnection
  connection.release = connectionReleaseDefer.resolve

  return connection
}

export interface ControlledConnection extends DatabaseConnection {
  release(): void
}
