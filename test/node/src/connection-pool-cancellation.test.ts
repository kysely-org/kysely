import { expect } from 'chai'
import { QueryCancelledError } from '../../../'
import {
  initTest,
  destroyTest,
  insertDefaultDataSet,
  clearDatabase,
  DIALECTS,
  TestContext,
  POOL_SIZE,
} from './test-setup.js'

// Only test dialects that support cancellation
const CANCELLATION_DIALECTS = DIALECTS.filter((d) => ['postgres'].includes(d))

for (const dialect of CANCELLATION_DIALECTS) {
  describe(`${dialect}: Connection Pool Cancellation Tests`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(60000)
      ctx = await initTest(this, dialect)
      await insertDefaultDataSet(ctx)
    })

    beforeEach(async () => {
      await clearDatabase(ctx)
      await insertDefaultDataSet(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('Pool Health After Cancellation', () => {
      it('should maintain pool health after single query cancellation', async () => {
        const controller = new AbortController()
        controller.abort()

        // Cancel a query
        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }

        // Verify pool is still healthy by executing a successful query
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(result).to.be.an('array')
        expect(result.length).to.be.greaterThan(0)
      })

      it('should handle multiple consecutive cancellations without pool degradation', async () => {
        const numCancellations = 5

        // Cancel multiple queries in sequence
        for (let i = 0; i < numCancellations; i++) {
          const controller = new AbortController()
          controller.abort()

          try {
            await ctx.db
              .selectFrom('person')
              .selectAll()
              .execute({ signal: controller.signal })
            expect.fail(
              `Cancellation ${i} should have thrown QueryCancelledError`,
            )
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
          }
        }

        // Verify pool is still healthy
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(result).to.be.an('array')
        expect(result.length).to.be.greaterThan(0)
      })

      it('should handle pool exhaustion scenarios with cancellation', async () => {
        const controllers: AbortController[] = []
        const queries: Promise<any>[] = []

        // Create more concurrent queries than pool size
        for (let i = 0; i < POOL_SIZE + 2; i++) {
          const controller = new AbortController()
          controllers.push(controller)

          const query = ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })

          queries.push(query)
        }

        // Cancel half of the queries after a short delay
        setTimeout(() => {
          for (let i = 0; i < Math.floor(controllers.length / 2); i++) {
            controllers[i].abort()
          }
        }, 50)

        const results = await Promise.allSettled(queries)

        // Some should be cancelled, some should succeed
        const cancelled = results.filter((r) => r.status === 'rejected')
        const succeeded = results.filter((r) => r.status === 'fulfilled')

        expect(cancelled.length).to.be.greaterThan(0)
        expect(succeeded.length).to.be.greaterThan(0)

        // Verify pool recovered and can handle new queries
        const healthCheck = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(healthCheck).to.be.an('array')
      })
    })

    describe('Connection Cleanup After Cancellation', () => {
      it('should properly clean up connections after query cancellation', async () => {
        const controller = new AbortController()

        // Start a query and cancel it immediately
        const queryPromise = ctx.db
          .selectFrom('person')
          .selectAll()
          .execute({ signal: controller.signal })

        controller.abort()

        try {
          await queryPromise
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }

        // Wait a moment for cleanup
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Verify connections are available for new queries
        const parallelQueries = Array.from({ length: 3 }, () =>
          ctx.db.selectFrom('person').select('id').limit(1).execute(),
        )

        const results = await Promise.all(parallelQueries)

        results.forEach((result) => {
          expect(result).to.be.an('array')
          expect(result.length).to.be.greaterThan(0)
        })
      })

      it('should handle streaming query cancellation with proper connection cleanup', async () => {
        const controller = new AbortController()
        let iterationCount = 0

        try {
          const stream = ctx.db
            .selectFrom('person')
            .selectAll()
            .stream(1, { signal: controller.signal })

          for await (const result of stream) {
            iterationCount++
            if (iterationCount >= 2) {
              controller.abort() // Cancel mid-stream
            }
          }

          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(iterationCount).to.be.greaterThanOrEqual(2)
        }

        // Verify connection was properly returned to pool
        const healthCheck = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(healthCheck).to.be.an('array')
      })
    })

    describe('Concurrent Cancellation Scenarios', () => {
      it('should handle mixed cancelled and successful queries concurrently', async function () {
        this.timeout(10000)

        const queries: Promise<any>[] = []
        const controllers: AbortController[] = []

        // Create a mix of queries, some will be cancelled
        for (let i = 0; i < 6; i++) {
          const controller = new AbortController()
          controllers.push(controller)

          const query = ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', i + 1)
            .execute({ signal: controller.signal })

          queries.push(query)
        }

        // Cancel every other query
        setTimeout(() => {
          for (let i = 0; i < controllers.length; i += 2) {
            controllers[i].abort()
          }
        }, 50)

        const results = await Promise.allSettled(queries)

        // Verify we have both cancelled and successful queries
        const cancelled = results.filter((r) => r.status === 'rejected')
        const succeeded = results.filter((r) => r.status === 'fulfilled')

        expect(cancelled.length).to.equal(3) // Every other query cancelled
        expect(succeeded.length).to.equal(3) // Remaining queries succeeded

        // Verify all cancellations are QueryCancelledErrors
        cancelled.forEach((result) => {
          if (result.status === 'rejected') {
            expect(result.reason).to.be.instanceOf(QueryCancelledError)
          }
        })

        // Verify pool is still healthy
        const healthCheck = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(healthCheck).to.be.an('array')
      })

      it('should handle rapid cancellation and new query cycles', async () => {
        const cycles = 3

        for (let cycle = 0; cycle < cycles; cycle++) {
          // Start and immediately cancel a query
          const controller = new AbortController()
          controller.abort()

          try {
            await ctx.db
              .selectFrom('person')
              .selectAll()
              .execute({ signal: controller.signal })
            expect.fail(`Cycle ${cycle} should have thrown QueryCancelledError`)
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
          }

          // Immediately run a successful query
          const result = await ctx.db
            .selectFrom('person')
            .select('id')
            .limit(1)
            .execute()

          expect(result).to.be.an('array')
          expect(result.length).to.be.greaterThan(0)
        }
      })
    })

    describe('Resource Management', () => {
      it('should not leak connections after multiple cancellations', async () => {
        const cancellationCount = POOL_SIZE * 2

        // Cancel more queries than pool size to test resource management
        for (let i = 0; i < cancellationCount; i++) {
          const controller = new AbortController()
          controller.abort()

          try {
            await ctx.db
              .selectFrom('person')
              .selectAll()
              .execute({ signal: controller.signal })
            expect.fail(
              `Cancellation ${i} should have thrown QueryCancelledError`,
            )
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
          }
        }

        // Verify we can still utilize the full pool capacity
        const parallelQueries = Array.from({ length: POOL_SIZE }, () =>
          ctx.db.selectFrom('person').select('id').limit(1).execute(),
        )

        const results = await Promise.all(parallelQueries)

        expect(results).to.have.length(POOL_SIZE)
        results.forEach((result) => {
          expect(result).to.be.an('array')
          expect(result.length).to.be.greaterThan(0)
        })
      })

      it('should handle query timeout vs cancellation scenarios', async function () {
        this.timeout(10000)

        const timeoutController = new AbortController()
        const immediateController = new AbortController()

        // Cancel one immediately
        immediateController.abort()

        // Cancel another after a delay (simulating timeout)
        setTimeout(() => {
          timeoutController.abort()
        }, 100)

        const immediateQuery = ctx.db
          .selectFrom('person')
          .selectAll()
          .execute({ signal: immediateController.signal })

        const timeoutQuery = ctx.db
          .selectFrom('person')
          .selectAll()
          .execute({ signal: timeoutController.signal })

        const results = await Promise.allSettled([immediateQuery, timeoutQuery])

        // Both should be cancelled
        expect(results[0].status).to.equal('rejected')
        expect(results[1].status).to.equal('rejected')

        if (results[0].status === 'rejected') {
          expect(results[0].reason).to.be.instanceOf(QueryCancelledError)
        }
        if (results[1].status === 'rejected') {
          expect(results[1].reason).to.be.instanceOf(QueryCancelledError)
        }

        // Pool should remain healthy
        const healthCheck = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(healthCheck).to.be.an('array')
      })
    })
  })
}
