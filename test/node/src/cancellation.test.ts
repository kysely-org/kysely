import { expect } from 'chai'
import { AbortError, Executable } from '../../..'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  initTest,
  insertDefaultDataSet,
  TestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: query cancellation`, () => {
    const cancellableBuilders: Executable<any>[] = []
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)

      const { db } = ctx

      cancellableBuilders.push(db.selectFrom('person').selectAll())
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
      const abortSignal = new AbortController().signal

      const results = await executeQueries(cancellableBuilders, abortSignal)

      expect(
        results.filter(
          (result) =>
            result.status === 'rejected' && result.reason instanceof AbortError,
        ),
      ).to.be.empty
    })

    it.skip('should cancel the query when aborted after execution start and throw an abort error', async () => {
      const abortController = new AbortController()
      const abortSignal = abortController.signal

      const results = await executeQueries(cancellableBuilders, abortSignal, [
        setTimeout(() => {
          abortController.abort()
        }, 0),
      ])

      expect(
        results.filter(
          (result) =>
            result.status === 'rejected' && result.reason instanceof AbortError,
        ),
      ).to.have.lengthOf(cancellableBuilders.length)
      // TODO: assert all queries were executed and cancelled.
    })

    it.skip('should not execute the query when aborted before and throw an abort error', async () => {
      const abortController = new AbortController()
      const abortSignal = abortController.signal
      abortController.abort()

      const results = await executeQueries(cancellableBuilders, abortSignal)

      expect(
        results.filter(
          (result) =>
            result.status === 'rejected' && result.reason instanceof AbortError,
        ),
      ).to.have.lengthOf(cancellableBuilders.length)
      // TODO: assert no queries were executed internally.
    })
  })
}

async function executeQueries(
  queries: Executable<any>[],
  abortSignal: AbortSignal,
  moreItems?: any[],
) {
  return await Promise.allSettled([
    ...queries.flatMap((query) => [
      query.execute({ abortSignal }),
      query.executeTakeFirst({ abortSignal }),
      query.executeTakeFirstOrThrow({ abortSignal }),
    ]),
    ...(moreItems ?? []),
  ])
}
