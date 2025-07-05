import { setTimeout } from 'node:timers/promises'
import { expect } from 'chai'
import { AbortError, RawBuilder, sql } from '../../..'
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
          abortSignal: new AbortController().signal,
        }),
      ).to.not.be.eventually.rejected
    })

    it('should throw an abort error when aborted before query execution', async () => {
      const abortController = new AbortController()
      abortController.abort()

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .executeTakeFirstOrThrow({ abortSignal: abortController.signal }),
      )
        .to.eventually.be.rejectedWith(AbortError)
        .and.satisfies((error: AbortError) =>
          expect(error.reason).to.equal('aborted before query execution'),
        )
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

        const abortController = new AbortController()
        setTimeout(10).then(() => abortController.abort())

        await expect(
          delayedQuery.execute(ctx.db, { abortSignal: abortController.signal }),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies(
            (error: AbortError) =>
              error.reason === 'aborted during query execution',
          )

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

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .withPlugin({
            transformQuery: (args) => args.node,
            transformResult: async (result) => {
              abortController.abort()
              return result.result
            },
          })
          .executeTakeFirstOrThrow({ abortSignal: abortController.signal }),
      )
        .to.eventually.be.rejectedWith(AbortError)
        .and.satisfies((error: AbortError) =>
          expect(error.reason).to.equal('aborted during result transformation'),
        )
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
              .stream({ abortSignal: abortController.signal, chunkSize: 1 })) {
              // noop
            }
          })(),
        ).to.not.be.eventually.rejected
      })

      it('should throw an abort error when streaming is aborted before query execution', async () => {
        const abortController = new AbortController()
        abortController.abort()

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ abortSignal: abortController.signal, chunkSize: 1 })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies((error: AbortError) =>
            expect(error.reason).to.equal(
              'aborted before connection acquisition',
            ),
          )
      })

      it('should throw an abort error when streaming is aborted during query execution', async () => {
        const abortController = new AbortController()

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ abortSignal: abortController.signal, chunkSize: 1 })) {
              abortController.abort()
            }
          })(),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies((error: AbortError) =>
            expect(error.reason).to.equal('aborted during query streaming'),
          )
      })

      it('should throw an abort error when streaming is aborted during result transformation', async () => {
        const abortController = new AbortController()

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .withPlugin({
                transformQuery: (args) => args.node,
                transformResult: async (result) => {
                  abortController.abort()
                  return result.result
                },
              })
              .stream({
                abortSignal: abortController.signal,
                chunkSize: 1,
              })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies((error: AbortError) =>
            expect(error.reason).to.equal(
              'aborted during result transformation',
            ),
          )
      })
    }
  })
}
