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
    })
  }
})
