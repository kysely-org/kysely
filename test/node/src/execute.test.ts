import { createSandbox, SinonSpy } from 'sinon'
import { CompiledQuery, QueryExecutor, QueryNode } from '../../../'
import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  expect,
  TestNoResultError,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: execute`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertPersons(ctx, [
        {
          first_name: 'Jennifer',
          last_name: 'Aniston',
          gender: 'female',
          pets: [
            { name: 'Catto 1', species: 'cat' },
            { name: 'Catto 2', species: 'cat' },
          ],
        },
        {
          first_name: 'Arnold',
          last_name: 'Schwarzenegger',
          gender: 'male',
          pets: [
            { name: 'Doggo 1', species: 'dog' },
            { name: 'Doggo 2', species: 'dog' },
          ],
        },
        {
          first_name: 'Sylvester',
          last_name: 'Stallone',
          gender: 'male',
          pets: [{ name: 'Hammo 1', species: 'hamster' }],
        },
      ])
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('executeTakeFirstOrThrow', () => {
      it('should throw if no result is found', async () => {
        try {
          await ctx.db
            .selectFrom('person')
            .selectAll('person')
            .where('id', '=', 99999999)
            .executeTakeFirstOrThrow()

          throw new Error('should not get here')
        } catch (error) {
          expect(error).to.instanceOf(TestNoResultError)
          if (error instanceof TestNoResultError) {
            expect(error.node.kind).to.equal('SelectQueryNode')
          }
        }
      })

      it('should throw a custom error if no result is found and a custom error class is provided', async () => {
        class MyNotFoundError extends Error {
          constructor(readonly node: QueryNode) {
            super('custom error')
          }
        }

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll('person')
            .where('id', '=', 99999999)
            .executeTakeFirstOrThrow(MyNotFoundError)

          throw new Error('should not get here')
        } catch (error) {
          expect(error).to.instanceOf(MyNotFoundError)
          if (error instanceof MyNotFoundError) {
            expect(error.node.kind).to.equal('SelectQueryNode')
          }
        }
      })

      it('should throw a custom error if no result is found and a custom error factory function is provided', async () => {
        const message = 'my custom error'
        class MyNotFoundError extends Error {
          constructor(readonly node: QueryNode) {
            super(message)
          }
        }
        const cb = (node: QueryNode) => new MyNotFoundError(node)

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll('person')
            .where('id', '=', 99999999)
            .executeTakeFirstOrThrow(cb)
        } catch (error: any) {
          expect(error).to.instanceOf(MyNotFoundError)
          if (error instanceof MyNotFoundError) {
            expect(error.message).to.equal(message)
            expect(error.node.kind).to.equal('SelectQueryNode')
          }
        }
      })
    })

    describe('Kysely.executeQuery', () => {
      const sandbox = createSandbox()
      let executorSpy: SinonSpy<
        Parameters<QueryExecutor['executeQuery']>,
        ReturnType<QueryExecutor['executeQuery']>
      >

      beforeEach(() => {
        executorSpy = sandbox.spy(
          ctx.db.getExecutor() as QueryExecutor,
          'executeQuery'
        )
      })

      afterEach(() => {
        sandbox.restore()
      })

      it('should execute a compiled query', async () => {
        const compiledQuery = CompiledQuery.raw('select 1 as count')

        const results = await ctx.db.executeQuery(compiledQuery)

        expect(executorSpy.calledOnce).to.be.true
        expect(executorSpy.firstCall.firstArg).to.equal(compiledQuery)
        expect(results).to.equal(await executorSpy.firstCall.returnValue)
      })

      it('should compile and execute a query builder', async () => {
        const query = ctx.db.selectFrom('person').selectAll()
        const compiledQuery = query.compile()

        const results = await ctx.db.executeQuery(query)

        expect(executorSpy.calledOnce).to.be.true
        expect(executorSpy.firstCall.firstArg).to.deep.equal(compiledQuery)
        expect(results).to.equal(await executorSpy.firstCall.returnValue)
      })
    })
  })
}
