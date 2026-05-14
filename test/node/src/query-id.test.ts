import { expect } from 'chai'
import {
  type DatabaseConnection,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type RootOperationNode,
  type QueryId,
  type QueryResult,
} from '../../../dist/index.js'
import type { Database } from './test-setup.js'

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

describe('result plugins', () => {
  it('should pass each transformed result to the next plugin', async () => {
    const db = new Kysely<Database>({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () =>
          new (class extends DummyDriver {
            async acquireConnection(): Promise<DatabaseConnection> {
              // @ts-ignore
              return {
                executeQuery: async <R>(): Promise<QueryResult<R>> => ({
                  rows: [{ original: true }] as R[],
                }),
              }
            }
          })(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      plugins: [
        {
          transformQuery: (args) => args.node,
          transformResult: async (args) => ({
            ...args.result,
            rows: args.result.rows.map((row) => ({ ...row, first: true })),
          }),
        },
        {
          transformQuery: (args) => args.node,
          transformResult: async (args) => ({
            ...args.result,
            rows: args.result.rows.map((row) => ({
              ...row,
              secondSawFirst: row.first,
            })),
          }),
        },
      ],
    })

    const result = await db.selectFrom('person').selectAll().execute()

    expect(result).to.deep.equal([
      {
        first: true,
        original: true,
        secondSawFirst: true,
      },
    ])
  })
})
