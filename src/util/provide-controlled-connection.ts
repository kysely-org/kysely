import { ConnectionProvider } from '../driver/connection-provider.js'
import { DatabaseConnection } from '../driver/database-connection.js'
import { promiseWithResolvers } from './promise-with-resolvers.js'
import { freeze } from './object-utils.js'

export interface ControlledConnection {
  readonly connection: DatabaseConnection
  readonly release: () => void
}

export async function provideControlledConnection(
  connectionProvider: ConnectionProvider,
): Promise<ControlledConnection> {
  const connectionDefer = promiseWithResolvers<DatabaseConnection>()
  const connectionReleaseDefer = promiseWithResolvers<void>()

  connectionProvider
    .provideConnection(async (connection) => {
      connectionDefer.resolve(connection)
      return await connectionReleaseDefer.promise
    })
    .catch((ex) => connectionDefer.reject(ex))

  // Create composite of the connection and the release method instead of
  // modifying the connection or creating a new nesting `DatabaseConnection`.
  // This way we don't accidentally override any methods of 3rd party
  // connections and don't return wrapped connections to drivers that
  // expect a certain specific connection class.
  return freeze({
    connection: await connectionDefer.promise,
    release: connectionReleaseDefer.resolve,
  })
}
