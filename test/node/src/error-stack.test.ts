import { AssertionError } from 'chai'
import { sql } from '../../../'

import {
  DIALECTS,
  destroyTest,
  initTest,
  TestContext,
  expect,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: error stack`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('error stack should contain the userland stack', async () => {
      for (const query of [
        ctx.db.selectFrom('person').select(sql`doesnt_exists`.as('d')),
        ctx.db.updateTable('person').set({ first_name: sql`doesnt_exists` }),
        ctx.db.deleteFrom('person').where(sql`doesnt_exists`, '=', 1),
        ctx.db
          .insertInto('person')
          .values({ first_name: sql`doesnt_exists`, gender: 'other' }),

        {
          execute: () => sql`select doesnt_exists`.execute(ctx.db),
          compile: () => ({ sql: 'select doesnt_exists' }),
        },
      ]) {
        try {
          await query.execute()
          expect.fail(
            `query "${query.compile().sql}" was supposed to throw but didn't`
          )
        } catch (err: any) {
          if (err instanceof AssertionError) {
            throw err
          }

          const stackLines = err.stack.split('\n')
          const lastStackLine = stackLines[stackLines.length - 1]
          expect(lastStackLine).to.contain(__filename)
        }
      }
    })
  })
}
