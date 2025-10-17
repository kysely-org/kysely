import { setTimeout } from 'node:timers/promises'
import { expect } from 'chai'
import { KyselyAbortError, RawBuilder, sql } from '../../..'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  initTest,
  insertDefaultDataSet,
  SQLSpec,
  TestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: query cancellation`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should execute queries normally when not aborted', async () => {
      await expect(
        ctx.db.selectFrom('person').selectAll().executeTakeFirstOrThrow({
          signal: new AbortController().signal,
        }),
      ).to.not.be.eventually.rejected
    })

    it('should throw an abort error when aborted before query execution', async () => {
      const reason = "rip d'angelo"

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .executeTakeFirstOrThrow({ signal: AbortSignal.abort(reason) }),
      )
        .to.eventually.be.rejectedWith(KyselyAbortError)
        .and.satisfies((error: KyselyAbortError) => {
          expect(error.message).to.equal(
            'The operation was aborted before query execution.',
          )
          expect(error.reason).to.equal(reason)
          return true
        })
    })

    // database-side cancellation was only implemented in PostgresDialect thus far.
    if (variant === 'postgres') {
      it('should throw an abort error when aborted during query execution', async () => {
        const writeQuery = ctx.db
          .insertInto('person')
          .values({ gender: sql.lit('woah') as never })

        const delayedQuery = (
          {
            postgres: sql`select pg_sleep(0.1); ${writeQuery};`,
            mysql: sql`select sleep(0.1); ${writeQuery};`,
            mssql: sql`waitfor delay '00:00:00.100'; ${writeQuery};`,
            sqlite: sql`WITH RECURSIVE timer(i) AS (
              SELECT 1
              UNION ALL
              SELECT i + 1 FROM timer WHERE i < 10000000
            )
            SELECT COUNT(*) FROM timer; ${writeQuery};`,
          } as const satisfies Record<SQLSpec, RawBuilder<any>>
        )[sqlSpec]

        await expect(
          delayedQuery.execute(ctx.db, { signal: AbortSignal.timeout(10) }),
        )
          .to.eventually.be.rejectedWith(KyselyAbortError)
          .and.satisfies((error: KyselyAbortError) => {
            expect(error.message).to.equal(
              'The operation was aborted during query execution.',
            )
            expect(error.reason).to.be.instanceOf(DOMException)
            expect((error.reason as DOMException).name).to.equal('TimeoutError')
            return true
          })

        await setTimeout(250) // long enough to ensure that if the query was not aborted, the write would have registered.
        await expect(
          ctx.db
            .selectFrom('person')
            .where('gender', '=', 'woah' as never)
            .select(ctx.db.fn.countAll().as('count'))
            .executeTakeFirstOrThrow(),
        ).to.eventually.satisfy((result: { count: unknown }) =>
          expect(Number(result.count)).to.equal(0),
        )
      })
    }

    it('should throw an abort error when aborted during result transformation', async () => {
      const abortController = new AbortController()

      const reason = 'i like trains'

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .withPlugin({
            transformQuery: (args) => args.node,
            transformResult: async (result) => {
              abortController.abort(reason)
              return result.result
            },
          })
          .executeTakeFirstOrThrow({ signal: abortController.signal }),
      )
        .to.eventually.be.rejectedWith(KyselyAbortError)
        .and.satisfies((error: KyselyAbortError) => {
          expect(error.message).to.equal(
            'The operation was aborted during result transformation.',
          )
          expect(error.reason).to.equal(reason)
          return true
        })
    })

    // mssql hangs on abort because `cancelQuery` is not yet implemented in the database connection.
    // pglite doesn't support streaming.
    if (variant !== 'mssql' && variant !== 'pglite') {
      it('should stream queries normally when not aborted', async () => {
        const abortController = new AbortController()

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: abortController.signal, chunkSize: 1 })) {
              // noop
            }
          })(),
        ).to.not.be.eventually.rejected
      })

      it('should throw an abort error when streaming is aborted before query execution', async () => {
        const reason = 'top of the morning!'

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: AbortSignal.abort(reason), chunkSize: 1 })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(KyselyAbortError)
          .and.satisfies((error: KyselyAbortError) => {
            expect(error.message).to.equal(
              'The operation was aborted before connection acquisition.',
            )
            expect(error.reason).to.equal(reason)
            return true
          })
      })

      it('should throw an abort error when streaming is aborted during query execution', async () => {
        const abortController = new AbortController()

        const reason = 'ani kaki metumtam'

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: abortController.signal, chunkSize: 1 })) {
              abortController.abort(reason)
            }
          })(),
        )
          .to.eventually.be.rejectedWith(KyselyAbortError)
          .and.satisfies((error: KyselyAbortError) => {
            expect(error.message).to.equal(
              'The operation was aborted during query streaming.',
            )
            expect(error.reason).to.equal(reason)
            return true
          })
      })

      it('should throw an abort error when streaming is aborted during result transformation', async () => {
        const abortController = new AbortController()

        const reason = 'spaghetti and meat balls'

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .withPlugin({
                transformQuery: (args) => args.node,
                transformResult: async (result) => {
                  abortController.abort(reason)
                  return result.result
                },
              })
              .stream({
                signal: abortController.signal,
                chunkSize: 1,
              })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(KyselyAbortError)
          .and.satisfies((error: KyselyAbortError) => {
            expect(error.message).to.equal(
              'The operation was aborted during result transformation.',
            )
            expect(error.reason).to.equal(reason)
            return true
          })
      })
    }
  })
}
