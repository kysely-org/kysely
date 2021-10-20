import { CompiledQuery, Dialect } from '../../../'
import { DialectWrapper } from '../test-setup'

export function getExecutedQueries(): [DialectWrapper, CompiledQuery[]] {
  const monkeyPatchedConnections = new WeakSet()
  const queries: CompiledQuery[] = []

  // A dialect wrapper that monkey patches the database connection's
  // executeQuery method and stores the executed SQL to the queries
  // array.
  const wrapper = (dialect: Dialect): Dialect => {
    return {
      createIntrospector: dialect.createIntrospector.bind(dialect),
      createAdapter: dialect.createAdapter.bind(dialect),
      createQueryCompiler: dialect.createQueryCompiler.bind(dialect),
      createDriver() {
        const driver = dialect.createDriver()

        return {
          init: driver.init.bind(driver),
          beginTransaction: driver.beginTransaction.bind(driver),
          commitTransaction: driver.commitTransaction.bind(driver),
          rollbackTransaction: driver.rollbackTransaction.bind(driver),
          releaseConnection: driver.releaseConnection.bind(driver),
          destroy: driver.destroy.bind(driver),

          async acquireConnection() {
            const connection = await driver.acquireConnection()

            if (!monkeyPatchedConnections.has(connection)) {
              const executeQuery = connection.executeQuery.bind(connection)

              connection.executeQuery = (compiledQuery) => {
                queries.push(compiledQuery)
                return executeQuery(compiledQuery)
              }

              monkeyPatchedConnections.add(connection)
            }

            return connection
          },
        }
      },
    }
  }

  return [wrapper, queries]
}
