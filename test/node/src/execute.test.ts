import { NoResultError, QueryNode } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  insertPersons,
  TestContext,
  expect,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
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
          expect(error instanceof NoResultError).to.equal(true)
        }
      })

      it('should throw a custom error constructor if no result is found and a custom error is provided', async () => {
        class MyNotFoundError extends Error {
          node: QueryNode

          constructor(node: QueryNode) {
            super('custom error')
            this.node = node
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
          expect(error instanceof MyNotFoundError).to.equal(true)

          if (error instanceof MyNotFoundError) {
            expect(error.node.kind).to.equal('SelectQueryNode')
          }
        }
      })

      it('should throw a custom error object if no result is found and a custom error is provided', async () => {
        const message = 'my custom error'
        const error = new Error(message)

        try {
          await ctx.db
            .selectFrom('person')
            .selectAll('person')
            .where('id', '=', 99999999)
            .executeTakeFirstOrThrow(() => error)
        } catch (error: any) {
          expect(error.message).to.equal(message)
        }
      })
    })
  })
}
