import { expect } from 'chai'
import { QueryCancelledError } from '../../../'
import {
  initTest,
  destroyTest,
  insertDefaultDataSet,
  clearDatabase,
  DIALECTS,
  TestContext,
} from './test-setup.js'

// Only test dialects that support cancellation
const CANCELLATION_DIALECTS = DIALECTS.filter((d) => ['postgres'].includes(d))

for (const dialect of CANCELLATION_DIALECTS) {
  describe(`${dialect}: Error Handling in Query Cancellation`, () => {
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

    describe('QueryCancelledError Throwing', () => {
      it('should throw QueryCancelledError for already aborted signal', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
          expect(error.message).to.equal('Query was cancelled')
        }
      })

      it('should throw QueryCancelledError with custom abort reason', async () => {
        const controller = new AbortController()
        const customReason = 'User clicked cancel button'
        controller.abort(customReason)

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
          expect(error.message).to.equal('Query was cancelled')
        }
      })

      it('should throw QueryCancelledError for streaming queries', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          const stream = ctx.db
            .selectFrom('person')
            .selectAll()
            .stream(1, { signal: controller.signal })

          for await (const result of stream) {
            // Should not reach here
            expect.fail('Stream should have been cancelled')
          }
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
        }
      })
    })

    describe('Error Propagation Through Query Builders', () => {
      it('should propagate QueryCancelledError from SelectQueryBuilder.execute()', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 1)
            .execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
        }
      })

      it('should propagate QueryCancelledError from SelectQueryBuilder.executeTakeFirst()', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 1)
            .executeTakeFirst({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
        }
      })

      it('should propagate QueryCancelledError from SelectQueryBuilder.executeTakeFirstOrThrow()', async () => {
        const controller = new AbortController()
        controller.abort()

        try {
          await ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 1)
            .executeTakeFirstOrThrow({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
        }
      })

      it('should propagate QueryCancelledError from InsertQueryBuilder.execute()', async () => {
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
          expect(error.name).to.equal('QueryCancelledError')
        }
      })

      it('should propagate QueryCancelledError from InsertQueryBuilder.executeTakeFirst()', async () => {
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
            .returning('id')
            .executeTakeFirst({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.name).to.equal('QueryCancelledError')
        }
      })
    })

    describe('Cancellation During Different Execution Phases', () => {
      it('should handle cancellation before query compilation', async () => {
        const controller = new AbortController()

        // Create query but don't execute yet
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('id', '=', 1)

        // Abort before execution
        controller.abort()

        try {
          await query.execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should handle cancellation during query parameter binding', async () => {
        const controller = new AbortController()

        // Create a parameterized query
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where('first_name', '=', 'John')
          .where('last_name', '=', 'Doe')

        controller.abort()

        try {
          await query.execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should handle cancellation with complex query construction', async () => {
        const controller = new AbortController()

        // Build a complex query
        const query = ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name'])
          .where((eb) =>
            eb.or([
              eb('first_name', '=', 'John'),
              eb('last_name', '=', 'Smith'),
            ]),
          )
          .orderBy('first_name')
          .limit(10)

        controller.abort()

        try {
          await query.execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })
    })

    describe('Error Stack Traces and Debugging', () => {
      it('should maintain useful stack trace for cancelled queries', async () => {
        const controller = new AbortController()
        controller.abort()

        async function executeQuery() {
          return await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
        }

        try {
          await executeQuery()
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.stack).to.be.a('string')
          expect(error.stack).to.include('executeQuery')
          expect(error.stack).to.include('QueryCancelledError')
        }
      })

      it('should preserve original error context in nested function calls', async () => {
        const controller = new AbortController()
        controller.abort()

        async function databaseService() {
          return await queryRepository()
        }

        async function queryRepository() {
          return await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
        }

        try {
          await databaseService()
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
          expect(error.stack).to.include('databaseService')
          expect(error.stack).to.include('queryRepository')
        }
      })
    })

    describe('Error Boundaries and Handling Patterns', () => {
      it('should work correctly with Promise.allSettled for concurrent queries', async () => {
        const controllers = [
          new AbortController(),
          new AbortController(),
          new AbortController(),
        ]

        // Abort the first and third queries
        controllers[0].abort()
        controllers[2].abort()

        const queries = [
          ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 1)
            .execute({ signal: controllers[0].signal }),
          ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 2)
            .execute({ signal: controllers[1].signal }),
          ctx.db
            .selectFrom('person')
            .select('id')
            .where('id', '=', 3)
            .execute({ signal: controllers[2].signal }),
        ]

        const results = await Promise.allSettled(queries)

        expect(results).to.have.length(3)
        expect(results[0].status).to.equal('rejected')
        expect(results[1].status).to.equal('fulfilled')
        expect(results[2].status).to.equal('rejected')

        // Check that cancelled queries threw QueryCancelledError
        if (results[0].status === 'rejected') {
          expect(results[0].reason).to.be.instanceOf(QueryCancelledError)
        }
        if (results[2].status === 'rejected') {
          expect(results[2].reason).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should handle cancellation in try-catch-finally blocks properly', async () => {
        const controller = new AbortController()
        controller.abort()

        let finallyExecuted = false
        let caughtError: any = null

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
        } catch (error) {
          caughtError = error
        } finally {
          finallyExecuted = true
        }

        expect(finallyExecuted).to.be.true
        expect(caughtError).to.be.instanceOf(QueryCancelledError)
      })

      it('should work with async/await error propagation', async () => {
        const controller = new AbortController()
        controller.abort()

        async function wrapper() {
          const result = await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
          return result
        }

        try {
          await wrapper()
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })
    })

    describe('Signal State and Timing Edge Cases', () => {
      it('should handle signal aborted between query creation and execution', async () => {
        const controller = new AbortController()

        // Create query
        const query = ctx.db.selectFrom('person').selectAll()

        // Abort signal before execution
        controller.abort()

        // Small delay to simulate real-world timing
        await new Promise((resolve) => setTimeout(resolve, 1))

        try {
          await query.execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should handle multiple abort calls on same controller', async () => {
        const controller = new AbortController()

        controller.abort('First abort')
        controller.abort('Second abort') // Should be ignored

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }
      })

      it('should handle signal from different AbortController instances', async () => {
        const controller1 = new AbortController()
        const controller2 = new AbortController()

        controller1.abort()
        // controller2 remains active

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll()
            .execute({ signal: controller1.signal })
          expect.fail('Should have thrown QueryCancelledError')
        } catch (error: any) {
          expect(error).to.be.instanceOf(QueryCancelledError)
        }

        // This should work fine
        const result = await ctx.db
          .selectFrom('person')
          .select('id')
          .limit(1)
          .execute({ signal: controller2.signal })

        expect(result).to.be.an('array')
      })
    })
  })
}
