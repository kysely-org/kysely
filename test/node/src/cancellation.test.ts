import { setTimeout } from 'node:timers/promises'
import { expect } from 'chai'
import { AbortError, RawBuilder, sql } from '../../..'
import {
  BuiltInDialect,
  clearDatabase,
  destroyTest,
  DIALECTS,
  initTest,
  insertDefaultDataSet,
  TestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  if (dialect === 'postgres') {
    describe(`${dialect}: query cancellation`, () => {
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
          .and.satisfies(
            (error: AbortError) =>
              error.reason === 'aborted before query execution',
          )
      })

      it('should throw an abort error when aborted during query execution', async () => {
        const sleepQuery = (
          {
            postgres: sql`select pg_sleep(300)`,
            mysql: sql`select sleep(300)`,
            mssql: sql`waitfor delay '00:05:00.000'`,
            sqlite: sql`WITH RECURSIVE timer(i) AS (
              SELECT 1
              UNION ALL
              SELECT i + 1 FROM timer WHERE i < 10000000
            )
            SELECT COUNT(*) FROM timer;`,
          } as const satisfies Record<BuiltInDialect, RawBuilder<any>>
        )[dialect]

        const abortController = new AbortController()
        setTimeout(10).then(() => abortController.abort())

        await expect(
          sleepQuery.execute(ctx.db, { abortSignal: abortController.signal }),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies(
            (error: AbortError) =>
              error.reason === 'aborted during query execution',
          )
      })

      it('should throw an abort error when aborted during result transformation', async () => {
        const abortController = new AbortController()
        setTimeout(10).then(() => abortController.abort())

        await expect(
          ctx.db
            .selectFrom('person')
            .selectAll()
            .withPlugin({
              transformQuery: (args) => args.node,
              transformResult: (result) => setTimeout(10, result.result),
            })
            .executeTakeFirstOrThrow({ abortSignal: abortController.signal }),
        )
          .to.eventually.be.rejectedWith(AbortError)
          .and.satisfies(
            (error: AbortError) =>
              error.reason === 'aborted during result transformation',
          )
      })

      // TODO: stream cancellation test cases...
    })
  }
}
