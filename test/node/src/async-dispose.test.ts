import {
  CompiledQuery,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  RootOperationNode,
  sql,
} from '../../..'
import { expect } from './test-setup'

describe('async dispose', function () {
  it.only('should call destroy ', async () => {
    const steps: string[] = [];

    async function runScope() {
        await using db = new Kysely({
          dialect: {
            createAdapter: () => new PostgresAdapter(),
            createDriver: () => new (class SpiedOnDummyDriver extends DummyDriver {
                async destroy(): Promise<void> {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    steps.push('destroyed')
                }
            })(),
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new (class SpiedOnPostgresQueryCompiler extends PostgresQueryCompiler {
                compileQuery(node: RootOperationNode): CompiledQuery<unknown> {
                    const compiled = super.compileQuery(node)
                    steps.push('compiled')
                    return compiled
                }
            })(),
          },
        })

        sql`select 1`.compile(db);
    }

    await runScope()

    steps.push('after runScope')

    expect(steps).to.length.to.be.greaterThan(1)
    expect(steps).to.deep.equal([
        'compiled',
        'destroyed',
        'after runScope',
    ])
  })
})
