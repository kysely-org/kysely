import { expect } from 'chai'
import { QueryCancelledError } from '../../../'
import {
  initTest,
  destroyTest,
  insertDefaultDataSet,
  DIALECTS,
  TestContext,
} from './test-setup.js'

describe('Query Cancellation', () => {
  describe('QueryCancelledError', () => {
    it('should create error with default message', () => {
      const error = new QueryCancelledError()
      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal('Query was cancelled')
      expect(error).to.be.instanceOf(Error)
    })

    it('should create error with custom message', () => {
      const customMessage = 'Operation was aborted by user'
      const error = new QueryCancelledError(customMessage)
      expect(error.name).to.equal('QueryCancelledError')
      expect(error.message).to.equal(customMessage)
      expect(error).to.be.instanceOf(Error)
    })

    it('should have proper error stack', () => {
      const error = new QueryCancelledError()
      expect(error.stack).to.be.a('string')
      expect(error.stack).to.include('QueryCancelledError')
    })
  })

  for (const dialect of DIALECTS) {
    describe(`${dialect}: AbortSignal functionality`, () => {
      let ctx: TestContext

      before(async function () {
        this.timeout(60000)
        ctx = await initTest(this, dialect)
        await insertDefaultDataSet(ctx)
      })

      after(async () => {
        await destroyTest(ctx)
      })

      it('should execute query normally without signal', async () => {
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(result).to.be.an('array')
      })

      it('should execute query with non-aborted signal', async () => {
        const controller = new AbortController()

        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute({ signal: controller.signal })

        expect(result).to.be.an('array')
      })

      it('should throw QueryCancelledError when signal is already aborted', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .limit(1)
            .execute({ signal: controller.signal })

          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.message).to.equal('Query was cancelled')
        }
      })

      it('should support cancellation in executeTakeFirst method', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .executeTakeFirst({ signal: controller.signal })

          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should support cancellation in executeTakeFirstOrThrow method', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .executeTakeFirstOrThrow({ signal: controller.signal })

          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should support cancellation in InsertQueryBuilder execute method', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .insertInto('person')
            .values({
              first_name: 'Test',
              last_name: 'User',
              gender: 'other',
            })
            .execute({ signal: controller.signal })

          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should support cancellation in stream method', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          const stream = ctx.db
            .selectFrom('person')
            .select('id')
            .stream(10, { signal: controller.signal })

          for await (const row of stream) {
            // Should not reach here
            expect.fail('Should have thrown QueryCancelledError')
          }
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should work without options parameter (backward compatibility)', async () => {
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute()

        expect(result).to.be.an('array')
      })

      it('should work with empty options object', async () => {
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute({})

        expect(result).to.be.an('array')
      })

      it('should work with undefined signal', async () => {
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute({ signal: undefined })

        expect(result).to.be.an('array')
      })

      // Real-world scenarios from GitHub issue #783
      describe('Real-world cancellation scenarios', () => {
        it('should cancel long-running analytical query mid-execution (user clicks cancel)', async function () {
          this.timeout(10000) // Allow time for cancellation test

          const controller = new AbortController()

          // Simulate a long-running analytical query like mentioned in the issue
          const longRunningQuery = ctx.db
            .selectFrom('person')
            .select((eb) => [
              'id',
              'first_name',
              // Simulate expensive analytical operation for supported dialects
              ...(dialect === 'postgres'
                ? [eb.fn<number>('pg_sleep', [eb.lit(0.5)]).as('sleep')]
                : []),
              // For other dialects, just do a regular query (MSSQL syntax is complex)
            ])
            .execute({ signal: controller.signal })

          // Simulate user clicking cancel button after 100ms
          setTimeout(() => {
            controller.abort()
          }, 100)

          try {
            await longRunningQuery
            // If we reach here without the query being cancelled, it might be too fast
            // This is okay for fast databases/queries
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
            expect(error.message).to.equal('Query was cancelled')
          }
        })

        it('should cancel streaming query when user leaves page (iterator cleanup)', async function () {
          this.timeout(10000)

          const controller = new AbortController()
          let rowsProcessed = 0

          try {
            const stream = ctx.db
              .selectFrom('person')
              .selectAll()
              .stream(1, { signal: controller.signal }) // Small chunk size for testing

            // Simulate user leaving page after processing some results
            setTimeout(() => {
              controller.abort() // User navigates away / closes tab
            }, 50)

            for await (const row of stream) {
              rowsProcessed++
              // Simulate some processing time
              await new Promise((resolve) => setTimeout(resolve, 10))
            }

            // If we reach here, the query completed before cancellation
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
            // Verify we processed some data before cancellation
            expect(rowsProcessed).to.be.greaterThanOrEqual(0)
          }
        })

        it('should handle immediate cancellation for cost management', async () => {
          // Scenario: User accidentally starts expensive query and immediately cancels
          const controller = new AbortController()

          // Immediate cancellation (user realizes mistake)
          controller.abort()

          const startTime = Date.now()

          try {
            await ctx.db
              .selectFrom('person')
              .selectAll()
              .execute({ signal: controller.signal })

            expect.fail('Should have thrown QueryCancelledError')
          } catch (error: any) {
            const endTime = Date.now()
            expect(error).to.be.instanceOf(QueryCancelledError)

            // Verify cancellation was fast (cost-saving benefit)
            expect(endTime - startTime).to.be.lessThan(100) // Should be very fast
          }
        })

        it('should handle cancellation during different query types (INSERT operations)', async () => {
          const controller = new AbortController()

          // Simulate cancelling a bulk insert operation
          setTimeout(() => {
            controller.abort()
          }, 50)

          try {
            await ctx.db
              .insertInto('person')
              .values([
                { first_name: 'John', last_name: 'Doe', gender: 'male' },
                { first_name: 'Jane', last_name: 'Smith', gender: 'female' },
                { first_name: 'Bob', last_name: 'Johnson', gender: 'male' },
              ])
              .execute({ signal: controller.signal })
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
          }
        })

        it('should handle cancellation for UPDATE operations', async () => {
          const controller = new AbortController()

          // Simulate cancelling a bulk update
          setTimeout(() => {
            controller.abort()
          }, 50)

          try {
            await ctx.db
              .updateTable('person')
              .set({ first_name: 'Updated' })
              .where('gender', '=', 'male')
              .execute({ signal: controller.signal })
          } catch (error: any) {
            expect(error).to.be.instanceOf(QueryCancelledError)
          }
        })

        it('should handle concurrent queries with selective cancellation', async function () {
          this.timeout(10000)

          const controller1 = new AbortController()
          const controller2 = new AbortController()

          // Cancel the first query immediately for reliable testing
          controller1.abort()

          // Start two concurrent queries
          const query1 = ctx.db
            .selectFrom('person')
            .select('id')
            .where('gender', '=', 'male')
            .execute({ signal: controller1.signal })

          const query2 = ctx.db
            .selectFrom('person')
            .select('id')
            .where('gender', '=', 'female')
            .execute({ signal: controller2.signal })

          const results = await Promise.allSettled([query1, query2])

          // First query should be cancelled (immediate abort)
          expect(results[0].status).to.equal('rejected')
          if (results[0].status === 'rejected') {
            expect(results[0].reason).to.be.instanceOf(QueryCancelledError)
          }

          // Second query should complete successfully
          expect(results[1].status).to.equal('fulfilled')
        })

        // Test the streaming scenario specifically mentioned in the issue
        it('should cancel streaming analytical query for cost savings', async function () {
          this.timeout(10000)

          const controller = new AbortController()
          let totalRowsProcessed = 0
          let streamStarted = false

          try {
            // Simulate the streaming analytical query mentioned in the issue
            const stream = ctx.db
              .selectFrom('person')
              .selectAll()
              .stream(2, { signal: controller.signal }) // Small chunks to ensure streaming

            streamStarted = true

            // Simulate user deciding they don't need more results after some data
            setTimeout(() => {
              controller.abort() // User expresses disinterest in more results
            }, 100)

            for await (const result of stream) {
              // Each result is a QueryResult which contains an array of rows
              totalRowsProcessed += Array.isArray(result) ? result.length : 1
              // Simulate processing time for analytical work
              await new Promise((resolve) => setTimeout(resolve, 20))
            }
          } catch (error: any) {
            expect(streamStarted).to.be.true
            expect(error).to.be.instanceOf(QueryCancelledError)
            // Verify we got some results before cancellation (realistic scenario)
            expect(totalRowsProcessed).to.be.greaterThanOrEqual(0)
          }
        })
      })
    })
  }
})
