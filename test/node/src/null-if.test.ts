import { Kysely } from '../../../dist/cjs'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
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

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should return correct values for NULLIF when selecting from a table', async () => {
      const result = await db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select((eb) => [
          'first_name',
          eb.nullif('2000-01-01', '2000-01-01').as('null_dates_equal'),
          eb.nullif('2000-01-01', '2000-01-02').as('null_dates_different'),
          eb.nullif(1, 1).as('null_numbers_equal'),
          eb.nullif(1, 2).as('null_numbers_different'),
          eb.nullif('yes', 'yes').as('null_strings_equal'),
          eb.nullif('yes', 'no').as('null_strings_different'),
          eb.nullif('yes', null).as('null_nulls_equal'),
        ])
        .executeTakeFirstOrThrow()

      expect(result).to.eql({
        first_name: 'Jennifer',
        null_dates_equal: null,
        null_dates_different: '2000-01-01',
        null_numbers_equal: null,
        null_numbers_different: dialect === 'mysql' ? '1' : 1,
        null_strings_equal: null,
        null_strings_different: 'yes',
        null_nulls_equal: 'yes',
      })
    })

    it('should return correct values for NULLIF without selection from a table', async () => {
      const result = await db
        .selectNoFrom((eb) => [
          eb.nullif('2000-01-01', '2000-01-01').as('null_dates_equal'),
          eb.nullif('2000-01-01', '2000-01-02').as('null_dates_different'),
          eb.nullif(1, 1).as('null_numbers_equal'),
          eb.nullif(1, 2).as('null_numbers_different'),
          eb.nullif('yes', 'yes').as('null_strings_equal'),
          eb.nullif('yes', 'no').as('null_strings_different'),
          eb.nullif('yes', null).as('null_nulls_equal'),
        ])
        .executeTakeFirstOrThrow()

      expect(result).to.eql({
        null_dates_equal: null,
        null_dates_different: '2000-01-01',
        null_numbers_equal: null,
        null_numbers_different: dialect === 'mysql' ? '1' : 1,
        null_strings_equal: null,
        null_strings_different: 'yes',
        null_nulls_equal: 'yes',
      })
    })
  })
}
