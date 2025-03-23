import { expect } from 'chai'
import {
  DatabaseConnection,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  RootOperationNode,
  QueryId,
} from '../../..'
import { Database } from './test-setup'

describe('queryId', () => {
  const visits = new Map()

  const db = new Kysely<Database>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () =>
        new (class extends DummyDriver {
          async acquireConnection(): Promise<DatabaseConnection> {
            // @ts-ignore
            return {
              executeQuery: async ({ queryId }) => {
                checkIn(queryId, 'connection.executeQuery')

                return {
                  rows: [],
                }
              },
            }
          }
        })(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () =>
        new (class SomeCompiler extends PostgresQueryCompiler {
          compileQuery(node: RootOperationNode, queryId: QueryId) {
            checkIn(queryId, 'compiler.compileQuery')

            return super.compileQuery(node, queryId)
          }
        })(),
    },
    plugins: [
      {
        transformQuery: (args) => {
          checkIn(args.queryId, 'plugin.transformQuery')

          return args.node
        },
        transformResult: async (args) => {
          checkIn(args.queryId, 'plugin.transformResult')

          return args.result
        },
      },
    ],
  })

  it('should pass query id around, allowing async communication between compilers, plugins and connections', async () => {
    await db.selectFrom('person').where('id', '=', 1).execute()

    expect(Array.from(visits.values())[0]).to.deep.equal([
      'plugin.transformQuery',
      'compiler.compileQuery',
      'connection.executeQuery',
      'plugin.transformResult',
    ])
  })

  function checkIn(queryId: QueryId, place: string): void {
    visits.set(queryId, [...(visits.get(queryId) || []), place])
  }
})
