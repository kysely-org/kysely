import {
  CompiledQuery,
  DatabaseConnection,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryResult,
  RootOperationNode,
  sql,
} from '../../..'
import { expect } from './test-setup'

describe('async dispose', function () {
  it('should call destroy ', async () => {
    const steps: string[] = []

    {
      // @ts-ignore - `using` was only introduced in TS 5.2
      await using db = new Kysely({
        dialect: {
          createAdapter: () => new PostgresAdapter(),
          createDriver: () =>
            new (class extends DummyDriver {
              async acquireConnection() {
                return new (class implements DatabaseConnection {
                  async executeQuery<R>(): Promise<QueryResult<R>> {
                    steps.push('executed')
                    return { rows: [] }
                  }
                  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
                    throw new Error('Method not implemented.')
                  }
                })()
              }
              async destroy(): Promise<void> {
                steps.push('destroyed')
              }
            })(),
          createIntrospector: (db) => new PostgresIntrospector(db),
          createQueryCompiler: () =>
            new (class extends PostgresQueryCompiler {
              compileQuery(node: RootOperationNode): CompiledQuery<unknown> {
                const compiled = super.compileQuery(node)
                steps.push('compiled')
                return compiled
              }
            })(),
        },
      })

      await sql`select 1`.execute(db)
    }

    steps.push('after runScope')

    expect(steps).to.length.to.be.greaterThan(1)
    expect(steps).to.deep.equal([
      'compiled',
      'executed',
      'destroyed',
      'after runScope',
    ])
  })
})
