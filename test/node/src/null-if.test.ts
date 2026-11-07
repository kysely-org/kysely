import { Kysely, sql } from '../../../dist/cjs'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  clearDatabase,
  DIALECTS,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect} null if`, () => {
    let ctx: TestContext
    let db: Kysely<Database>

    before(async function () {
      ctx = await initTest(this, dialect)

      db = ctx.db as any
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should return correct values for NULLIF without selection from a table', async () => {
      const result = await db
        .selectNoFrom(({ fn }) => [
          fn.nullif(sql.lit('2000-01-01'), '2000-01-01').as('null_dates_equal'),
          fn.nullif(sql.lit(1), 2).as('null_numbers_different'),
        ])
        .executeTakeFirstOrThrow()

      expect(result).to.eql({
        null_dates_equal: null,
        null_numbers_different: dialect === 'mysql' ? '1' : 1,
      })
    })
  })
}
